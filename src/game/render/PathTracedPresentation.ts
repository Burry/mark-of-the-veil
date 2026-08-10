import { Color, Frustum, Group, Matrix4, Mesh, MeshStandardMaterial, Sphere, Vector3 } from 'three';
import type * as THREE from 'three';

export type PathTracingStatus = 'idle' | 'loading' | 'converging' | 'unavailable';

type WebGLPathTracerInstance = import('three-gpu-pathtracer').WebGLPathTracer;
type BVHWorkerInstance = import('three-mesh-bvh/worker').GenerateMeshBVHWorker;

const PATH_TRACING_BUILD_TIMEOUT_MS = 45_000;
const PATH_TRACING_TRIANGLE_BUDGET = 450_000;
const TRACE_EXCLUSION_PATTERN =
  /VesperaStormCyclorama|InstancedCathedralRubble|HangingReliquaryChains|contact-shadow/i;
const TRACE_SUBJECT_PATTERN =
  /Mark|Sunlance|Chainling|Needlewing|Gorewarden|HollowRegent|Seal|Carrot|Extraction/i;
const TRACE_MAJOR_ARCHITECTURE_PATTERN =
  /StaticArchitectureBatch|TexturedInnerAmbulatory|WeatheredNavePier|HiveRosePortal|Choir/i;

/**
 * Genuine multi-bounce GPU path tracing for frozen presentation frames.
 *
 * This is deliberately separate from the real-time gameplay compositor: BVH
 * construction and progressive accumulation are valuable only while the world
 * and camera are stationary. The implementation is lazy-loaded and always
 * keeps the raster compositor as a visible fallback while it converges.
 */
export class PathTracedPresentation {
  private tracer: WebGLPathTracerInstance | null = null;
  private bvhWorker: BVHWorkerInstance | null = null;
  private status: PathTracingStatus = 'idle';
  private activationToken = 0;
  private requested = false;
  private sceneNeedsSync = true;
  private readonly runtimeDisabledReason: string | null;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly renderRasterFallback: () => void,
  ) {
    const rendererName = inspectRendererName(renderer);
    const forcePathTracing =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('forcePathTracing') === '1';
    const softwareRenderer = /SwiftShader|llvmpipe|software/i.test(rendererName);
    const automatedBrowser = typeof navigator !== 'undefined' && navigator.webdriver;
    this.runtimeDisabledReason = forcePathTracing
      ? null
      : softwareRenderer
        ? 'software-gpu-disabled'
        : automatedBrowser
          ? 'automation-gpu-disabled'
          : null;
    renderer.domElement.dataset.pathTracingRenderer = rendererName;
    renderer.domElement.dataset.pathTracingProfile = this.runtimeDisabledReason
      ? this.runtimeDisabledReason
      : 'hardware-cinematic';
    if (this.runtimeDisabledReason) {
      this.status = 'unavailable';
      renderer.domElement.dataset.pathTracingReason = this.runtimeDisabledReason;
    }
    this.publishDiagnostics();
  }

  async activate(): Promise<void> {
    if (this.requested || this.status === 'unavailable') return;
    this.requested = true;
    this.status = 'loading';
    this.publishDiagnostics();
    const token = ++this.activationToken;

    try {
      const [{ WebGLPathTracer }, { GenerateMeshBVHWorker }] = await Promise.all([
        import('three-gpu-pathtracer'),
        import('three-mesh-bvh/worker'),
      ]);
      if (!this.requested || token !== this.activationToken) return;

      if (!this.tracer) {
        this.tracer = new WebGLPathTracer(this.renderer);
        this.bvhWorker = new GenerateMeshBVHWorker();
        this.tracer.setBVHWorker(this.bvhWorker);
        this.tracer.bounces = 4;
        this.tracer.transmissiveBounces = 2;
        this.tracer.multipleImportanceSampling = true;
        this.tracer.filterGlossyFactor = 0.36;
        this.tracer.renderDelay = 0;
        this.tracer.minSamples = 2;
        this.tracer.fadeDuration = 520;
        this.tracer.dynamicLowRes = true;
        this.tracer.lowResScale = 0.22;
        this.tracer.renderScale = 0.58;
        this.tracer.textureSize.set(1024, 1024);
        this.tracer.tiles.set(2, 2);
        this.tracer.rasterizeScene = true;
        this.tracer.rasterizeSceneCallback = this.renderRasterFallback;
      }

      if (this.sceneNeedsSync) {
        const buildStartedAt = performance.now();
        const sceneBridge = bridgeUnsupportedScenePrimitives(
          this.scene,
          this.camera,
          this.renderer.domElement,
        );
        const pathTracingScene = createPathTracingSceneView(this.scene);
        let sceneBuild: Promise<void>;
        try {
          // The upstream generator snapshots and merges scene geometry before
          // returning its worker promise. Restore proxies immediately so the
          // raster fallback never observes compatibility-bridge mutations.
          sceneBuild = this.tracer.setSceneAsync(pathTracingScene, this.camera, {
            onProgress: (progress) => {
              this.renderer.domElement.dataset.pathTracingBuildProgress = progress.toFixed(3);
            },
          });
        } finally {
          sceneBridge.restore();
        }
        await withTimeout(
          sceneBuild,
          PATH_TRACING_BUILD_TIMEOUT_MS,
          'Path-tracing BVH build exceeded its 45 second production budget.',
        );
        this.renderer.domElement.dataset.pathTracingBuildMs = String(
          Math.round(performance.now() - buildStartedAt),
        );
        this.sceneNeedsSync = false;
      } else {
        this.tracer.updateCamera();
        this.tracer.reset();
      }

      if (!this.requested || token !== this.activationToken) return;
      this.tracer.pausePathTracing = false;
      this.status = 'converging';
      delete this.renderer.domElement.dataset.pathTracingReason;
      this.publishDiagnostics();
    } catch (error) {
      if (token !== this.activationToken) return;
      console.warn('Path-traced presentation is unavailable; using hybrid raster lighting.', error);
      this.bvhWorker?.dispose();
      this.bvhWorker = null;
      this.tracer?.dispose();
      this.tracer = null;
      this.status = 'unavailable';
      this.renderer.domElement.dataset.pathTracingReason =
        error instanceof Error && /45 second production budget/.test(error.message)
          ? 'bvh-build-timeout'
          : 'runtime-initialization-failed';
      this.requested = false;
      this.publishDiagnostics();
    }
  }

  render(): boolean {
    if (!this.requested || this.status !== 'converging' || !this.tracer) return false;
    this.tracer.renderSample();
    this.publishDiagnostics();
    return true;
  }

  deactivate(): void {
    if (!this.requested && this.status !== 'loading' && this.status !== 'converging') return;
    this.requested = false;
    this.activationToken += 1;
    this.sceneNeedsSync = true;
    if (this.status === 'loading') {
      this.bvhWorker?.dispose();
      this.bvhWorker = null;
      this.tracer?.dispose();
      this.tracer = null;
    } else if (this.tracer) {
      this.tracer.pausePathTracing = true;
      this.tracer.reset();
    }
    if (this.status !== 'unavailable') this.status = 'idle';
    this.publishDiagnostics();
  }

  dispose(): void {
    this.requested = false;
    this.activationToken += 1;
    this.bvhWorker?.dispose();
    this.bvhWorker = null;
    this.tracer?.dispose();
    this.tracer = null;
    this.status = 'idle';
    this.publishDiagnostics();
  }

  diagnostics(): { status: PathTracingStatus; samples: number } {
    return { status: this.status, samples: Math.floor(this.tracer?.samples ?? 0) };
  }

  private publishDiagnostics(): void {
    const samples = Math.floor(this.tracer?.samples ?? 0);
    this.renderer.domElement.dataset.pathTracing = this.status;
    this.renderer.domElement.dataset.pathTracingSamples = String(samples);
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function inspectRendererName(renderer: THREE.WebGLRenderer): string {
  const context = renderer.getContext();
  const debugInfo = context.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const name = context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (typeof name === 'string' && name.length > 0) return name;
  }
  const fallback = context.getParameter(context.RENDERER);
  return typeof fallback === 'string' && fallback.length > 0 ? fallback : 'unknown';
}

/**
 * Gives the path tracer raw equirectangular HDR data while every Object3D
 * method continues to operate on the live scene. This avoids ever swapping
 * the raster scene's PMREM CubeUV environment during an asynchronous build.
 */
function createPathTracingSceneView(scene: THREE.Scene): THREE.Scene {
  const rawEnvironment = (scene.userData.pathTracingEnvironment as THREE.Texture | null) ?? null;
  return new Proxy(scene, {
    get(target, property) {
      if (property === 'environment') return rawEnvironment;
      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

interface SceneBridge {
  restore(): void;
}

interface VisibilityRecord {
  object: THREE.Object3D;
  visible: boolean;
}

interface MaterialRecord {
  mesh: THREE.Mesh;
  material: THREE.Material | THREE.Material[];
}

interface TraceCandidate {
  mesh: THREE.Mesh;
  triangles: number;
  priority: number;
  distanceSquared: number;
}

/**
 * Converts scene features that the upstream static BVH flattener cannot
 * represent directly into a temporary, traceable form. The bridge exists only
 * during `setScene`: the path tracer owns baked geometry/material data after
 * that call, and the live raster scene is restored byte-for-byte afterwards.
 */
export function bridgeUnsupportedScenePrimitives(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
): SceneBridge {
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  const expansionRoot = new Group();
  expansionRoot.name = 'PathTracing.InstanceExpansion';
  expansionRoot.matrixAutoUpdate = false;
  const visibilityRecords: VisibilityRecord[] = [];
  const materialRecords: MaterialRecord[] = [];
  const ownedMaterials: THREE.Material[] = [];
  const instances: THREE.InstancedMesh[] = [];
  const rasterOnlyPrimitives: THREE.Object3D[] = [];
  const staticMeshes: THREE.Mesh[] = [];
  let expandedInstanceCount = 0;
  let rasterOnlyPrimitiveCount = 0;
  let substitutedMaterialCount = 0;
  let retainedTriangleCount = 0;
  let culledTriangleCount = 0;
  let culledMeshCount = 0;
  let restored = false;

  const restore = (): void => {
    if (restored) return;
    restored = true;
    if (expansionRoot.parent) expansionRoot.removeFromParent();
    for (const record of visibilityRecords) record.object.visible = record.visible;
    for (const record of materialRecords) record.mesh.material = record.material;
    for (const material of ownedMaterials) material.dispose();
  };

  try {
    scene.traverseVisible((object) => {
      if (isRasterOnlyPrimitive(object)) {
        rasterOnlyPrimitives.push(object);
        return;
      }

      if (isInstancedMesh(object)) {
        instances.push(object);
        return;
      }

      if (isMesh(object)) staticMeshes.push(object);
    });

    for (const object of rasterOnlyPrimitives) {
      rasterOnlyPrimitiveCount += 1;
      visibilityRecords.push({ object, visible: object.visible });
      object.visible = false;
    }

    const traceVolume = createTraceVolume(camera);
    const candidates = staticMeshes
      .map((mesh) => createTraceCandidate(mesh, camera, traceVolume))
      .sort(
        (a, b) =>
          a.priority - b.priority ||
          a.distanceSquared - b.distanceSquared ||
          b.triangles - a.triangles,
      );

    for (const candidate of candidates) {
      const fitsBudget =
        retainedTriangleCount + candidate.triangles <= PATH_TRACING_TRIANGLE_BUDGET;
      const retain = candidate.priority === 0 || (candidate.priority <= 2 && fitsBudget);
      if (!retain) {
        visibilityRecords.push({ object: candidate.mesh, visible: candidate.mesh.visible });
        candidate.mesh.visible = false;
        culledTriangleCount += candidate.triangles;
        culledMeshCount += 1;
        continue;
      }

      retainedTriangleCount += candidate.triangles;
      if (!hasTraceableMaterial(candidate.mesh.material)) {
        const originalMaterial = candidate.mesh.material;
        materialRecords.push({ mesh: candidate.mesh, material: originalMaterial });
        candidate.mesh.material = createPathTracingFallbackMaterial(originalMaterial);
        ownedMaterials.push(...asMaterialArray(candidate.mesh.material));
        substitutedMaterialCount += 1;
      }
    }

    const instanceMatrix = new Matrix4();
    const worldMatrix = new Matrix4();
    const instanceColor = new Color();
    for (const source of instances) {
      const expandedBeforeSource = expandedInstanceCount;
      visibilityRecords.push({ object: source, visible: source.visible });
      source.visible = false;
      const sourceTriangles = geometryTriangleCount(source.geometry);
      const excluded = traceHierarchyMatches(source, TRACE_EXCLUSION_PATTERN);
      const subject = traceHierarchyMatches(source, TRACE_SUBJECT_PATTERN);

      for (let index = 0; index < source.count; index += 1) {
        source.getMatrixAt(index, instanceMatrix);
        worldMatrix.multiplyMatrices(source.matrixWorld, instanceMatrix);

        const spatial = geometryTraceSpatialInfo(source.geometry, worldMatrix, camera, traceVolume);
        const subjectInRange = subject && (spatial.inFrame || spatial.distanceSquared < 900);
        const fitsBudget = retainedTriangleCount + sourceTriangles <= PATH_TRACING_TRIANGLE_BUDGET;
        if (excluded || (!subjectInRange && (!spatial.inFrame || !fitsBudget))) {
          culledTriangleCount += sourceTriangles;
          continue;
        }

        const hasInstanceColor = Boolean(source.instanceColor);
        if (hasInstanceColor) source.getColorAt(index, instanceColor);
        const material = cloneInstanceMaterial(
          source.material,
          hasInstanceColor ? instanceColor : null,
          ownedMaterials,
        );
        const mesh = new Mesh(source.geometry, material);
        mesh.name = `${source.name || 'InstancedMesh'}.TraceInstance.${index}`;
        mesh.matrixAutoUpdate = false;
        mesh.matrix.copy(worldMatrix);
        mesh.castShadow = source.castShadow;
        mesh.receiveShadow = source.receiveShadow;
        expansionRoot.add(mesh);
        expandedInstanceCount += 1;
        retainedTriangleCount += sourceTriangles;
      }
      if (expandedInstanceCount === expandedBeforeSource) culledMeshCount += 1;
    }

    if (expandedInstanceCount > 0) {
      scene.add(expansionRoot);
      expansionRoot.updateMatrixWorld(true);
    }

    canvas.dataset.pathTracingExpandedInstances = String(expandedInstanceCount);
    canvas.dataset.pathTracingRasterOnlyPrimitives = String(rasterOnlyPrimitiveCount);
    canvas.dataset.pathTracingSubstitutedMaterials = String(substitutedMaterialCount);
    canvas.dataset.pathTracingRetainedTriangles = String(retainedTriangleCount);
    canvas.dataset.pathTracingCulledTriangles = String(culledTriangleCount);
    canvas.dataset.pathTracingCulledMeshes = String(culledMeshCount);

    return { restore };
  } catch (error) {
    restore();
    throw error;
  }
}

function isInstancedMesh(object: THREE.Object3D): object is THREE.InstancedMesh {
  return 'isInstancedMesh' in object && object.isInstancedMesh === true;
}

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

function isRasterOnlyPrimitive(object: THREE.Object3D): boolean {
  return (
    ('isPoints' in object && object.isPoints === true) ||
    ('isLine' in object && object.isLine === true) ||
    ('isSprite' in object && object.isSprite === true)
  );
}

function createTraceVolume(camera: THREE.PerspectiveCamera): Frustum {
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const viewProjection = new Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  return new Frustum().setFromProjectionMatrix(viewProjection);
}

function createTraceCandidate(
  mesh: THREE.Mesh,
  camera: THREE.PerspectiveCamera,
  traceVolume: Frustum,
): TraceCandidate {
  const triangles = geometryTriangleCount(mesh.geometry);
  const spatial = geometryTraceSpatialInfo(mesh.geometry, mesh.matrixWorld, camera, traceVolume);
  const excluded = traceHierarchyMatches(mesh, TRACE_EXCLUSION_PATTERN);
  const subject = traceHierarchyMatches(mesh, TRACE_SUBJECT_PATTERN);
  const majorArchitecture = traceHierarchyMatches(mesh, TRACE_MAJOR_ARCHITECTURE_PATTERN);
  let priority = 3;
  if (excluded) priority = 4;
  else if (subject && (spatial.inFrame || spatial.distanceSquared < 900)) priority = 0;
  else if (spatial.inFrame) priority = 1;
  else if (majorArchitecture && spatial.distanceSquared < 3_600) priority = 2;

  return {
    mesh,
    triangles,
    priority,
    distanceSquared: spatial.distanceSquared,
  };
}

function geometryTraceSpatialInfo(
  geometry: THREE.BufferGeometry,
  matrixWorld: THREE.Matrix4,
  camera: THREE.PerspectiveCamera,
  traceVolume: Frustum,
): { inFrame: boolean; distanceSquared: number } {
  if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  if (!geometry.boundingSphere) return { inFrame: true, distanceSquared: 0 };
  const sphere = new Sphere().copy(geometry.boundingSphere).applyMatrix4(matrixWorld);
  const cameraPosition = camera.getWorldPosition(new Vector3());
  return {
    inFrame: traceVolume.intersectsSphere(sphere),
    distanceSquared: cameraPosition.distanceToSquared(sphere.center),
  };
}

function geometryTriangleCount(geometry: THREE.BufferGeometry): number {
  const indexCount = geometry.index?.count;
  const positionCount = geometry.getAttribute('position')?.count ?? 0;
  return Math.floor((indexCount ?? positionCount) / 3);
}

function traceHierarchyMatches(object: THREE.Object3D, pattern: RegExp): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (pattern.test(current.name)) return true;
    current = current.parent;
  }
  return false;
}

function hasTraceableMaterial(material: THREE.Material | THREE.Material[]): boolean {
  return asMaterialArray(material).every(
    (candidate) => 'color' in candidate && candidate.color instanceof Color,
  );
}

function createPathTracingFallbackMaterial(
  source: THREE.Material | THREE.Material[],
): THREE.Material | THREE.Material[] {
  const convert = (material: THREE.Material): THREE.MeshStandardMaterial =>
    new MeshStandardMaterial({
      name: `${material.name || material.type}.PathTracingFallback`,
      color: 0x24252a,
      roughness: 0.72,
      metalness: 0.12,
      opacity: material.opacity,
      transparent: material.transparent,
      side: material.side,
    });
  return Array.isArray(source) ? source.map(convert) : convert(source);
}

function cloneInstanceMaterial(
  source: THREE.Material | THREE.Material[],
  tint: THREE.Color | null,
  ownedMaterials: THREE.Material[],
): THREE.Material | THREE.Material[] {
  if (!tint && hasTraceableMaterial(source)) return source;

  const clone = (material: THREE.Material): THREE.Material => {
    const result =
      'color' in material && material.color instanceof Color
        ? material.clone()
        : createPathTracingFallbackMaterial(material);
    if (Array.isArray(result)) return result[0];
    if (tint && 'color' in result && result.color instanceof Color) result.color.multiply(tint);
    ownedMaterials.push(result);
    return result;
  };
  return Array.isArray(source) ? source.map(clone) : clone(source);
}

function asMaterialArray(material: THREE.Material | THREE.Material[]): THREE.Material[] {
  return Array.isArray(material) ? material : [material];
}
