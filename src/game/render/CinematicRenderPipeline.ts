import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import type { GameSettings } from '../types/GameTypes';
import { CinematicCompositeShader } from './CinematicCompositeShader';
import { ForwardLightBudget } from './ForwardLightBudget';
import { PathTracedPresentation, type PathTracingStatus } from './PathTracedPresentation';
import {
  AdaptiveRenderBudget,
  selectRenderingProfile,
  type GraphicsCapabilities,
  type RenderingProfile,
} from './RenderingQuality';
import { SceneMaterialCalibrator } from './SceneMaterialCalibrator';

export interface RenderPipelineDiagnostics {
  tier: RenderingProfile['tier'];
  hdr: boolean;
  reflections: 'screen-space-ray-marched' | 'disabled';
  ambientOcclusion: boolean;
  webgpuAvailable: boolean;
  adaptiveLevel: 0 | 1 | 2;
  internalResolutionScale: number;
  pathTracing: PathTracingStatus;
  pathTracingSamples: number;
}

export class CinematicRenderPipeline {
  private readonly capabilities: GraphicsCapabilities;
  private readonly previousRendererInfoAutoReset: boolean;
  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly ssrPass: SSRPass;
  private readonly gtaoPass: GTAOPass;
  private readonly bloomPass: UnrealBloomPass;
  private readonly gradePass: ShaderPass;
  private readonly smaaPass: SMAAPass;
  private readonly outputPass: OutputPass;
  private readonly fxaaPass: ShaderPass;
  private readonly materialCalibrator: SceneMaterialCalibrator;
  private readonly lightBudget: ForwardLightBudget;
  private readonly pathTracedPresentation: PathTracedPresentation;
  private readonly budget = new AdaptiveRenderBudget();
  private profile: RenderingProfile;
  private elapsed = 0;
  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  private internalResolutionScale = 1;
  private calibrationTimer = 0;
  private frozenSeconds = 0;
  private readonly diagnosticsEnabled =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('diagnostics') === '1';
  private readonly pathTracingDisabledForDiagnostics = this.diagnosticsEnabled;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    settings: GameSettings,
  ) {
    this.capabilities = inspectGraphicsCapabilities(
      renderer.getContext() as WebGL2RenderingContext,
    );
    this.profile = selectRenderingProfile(settings.quality, this.capabilities);
    this.previousRendererInfoAutoReset = renderer.info.autoReset;
    renderer.info.autoReset = false;

    const renderTarget = createComposerRenderTarget(this.profile);
    this.composer = new EffectComposer(renderer, renderTarget);

    this.renderPass = new RenderPass(scene, camera);
    this.ssrPass = new SSRPass({
      renderer,
      scene,
      camera,
      width: 1,
      height: 1,
      selects: null,
      groundReflector: null,
    });
    this.ssrPass.opacity = 0.26;
    this.ssrPass.maxDistance = 18;
    this.ssrPass.thickness = 0.22;
    this.ssrPass.blur = true;
    this.ssrPass.distanceAttenuation = true;
    this.ssrPass.fresnel = true;
    this.ssrPass.infiniteThick = false;

    this.gtaoPass = new GTAOPass(scene, camera, 1, 1);
    this.gtaoPass.blendIntensity = 0.82;
    this.gtaoPass.updateGtaoMaterial({
      radius: 3.2,
      distanceExponent: 1.4,
      thickness: 1.1,
      distanceFallOff: 1,
      scale: 1,
      samples: 12,
      screenSpaceRadius: false,
    });
    this.gtaoPass.updatePdMaterial({
      lumaPhi: 10,
      depthPhi: 2.5,
      normalPhi: 3,
      radius: 7,
      radiusExponent: 2,
      rings: 2,
      samples: 12,
    });

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.34, 1.05);
    this.gradePass = new ShaderPass(CinematicCompositeShader);
    this.smaaPass = new SMAAPass();
    this.outputPass = new OutputPass();
    this.fxaaPass = new ShaderPass(FXAAShader);

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.ssrPass);
    this.composer.addPass(this.gtaoPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.gradePass);
    this.composer.addPass(this.smaaPass);
    this.composer.addPass(this.fxaaPass);
    this.composer.addPass(this.outputPass);

    this.materialCalibrator = new SceneMaterialCalibrator(renderer, scene);
    this.lightBudget = new ForwardLightBudget(scene, camera);
    this.pathTracedPresentation = new PathTracedPresentation(renderer, scene, camera, () =>
      this.composer.render(0),
    );
    this.applyProfile(settings, true);
  }

  render(deltaSeconds: number, paused: boolean): void {
    this.renderer.info.reset();
    this.elapsed += deltaSeconds;
    this.calibrationTimer -= deltaSeconds;
    if (this.calibrationTimer <= 0) {
      this.calibrationTimer = 1.5;
      this.materialCalibrator.update(this.profile);
    }
    this.gradePass.uniforms.time.value = this.elapsed;

    const budgetChange = this.budget.sample(
      deltaSeconds,
      !paused && this.profile.tier === 'cinematic',
    );
    if (budgetChange) this.applyAdaptiveLevel(budgetChange.level);

    this.lightBudget.update(deltaSeconds, this.adaptivePointLightLimit());

    if (paused && this.profile.tier === 'cinematic' && !this.pathTracingDisabledForDiagnostics) {
      this.frozenSeconds += deltaSeconds;
      if (this.frozenSeconds >= 0.65) {
        // Frozen path-traced presentation receives the complete authored light
        // rig. The forward-light budget is only a raster gameplay optimization.
        this.lightBudget.setSuspended(true);
        void this.pathTracedPresentation.activate();
        if (this.pathTracedPresentation.render()) {
          if (this.diagnosticsEnabled) this.publishRenderStats();
          return;
        }
      }
    } else {
      this.frozenSeconds = 0;
      this.lightBudget.setSuspended(false);
      this.pathTracedPresentation.deactivate();
    }
    this.composer.render(deltaSeconds);
    if (this.diagnosticsEnabled) this.publishRenderStats();
  }

  updateSettings(settings: GameSettings): void {
    const previousTier = this.profile.tier;
    const previousHdr = this.profile.hdr;
    this.profile = selectRenderingProfile(settings.quality, this.capabilities);
    if (previousTier !== this.profile.tier) this.budget.reset();
    if (previousHdr !== this.profile.hdr) {
      this.composer.reset(createComposerRenderTarget(this.profile));
    }
    this.applyProfile(
      settings,
      previousTier !== this.profile.tier || previousHdr !== this.profile.hdr,
    );
  }

  setSize(width: number, height: number, pixelRatio: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.pixelRatio = Math.max(0.5, pixelRatio);
    this.resizeComposerTargets();
  }

  diagnostics(): RenderPipelineDiagnostics {
    const pathTracing = this.pathTracedPresentation.diagnostics();
    return {
      tier: this.profile.tier,
      hdr: this.profile.hdr,
      reflections: this.ssrPass.enabled ? 'screen-space-ray-marched' : 'disabled',
      ambientOcclusion: this.gtaoPass.enabled,
      webgpuAvailable: this.capabilities.webgpuAvailable,
      adaptiveLevel: this.budget.currentLevel,
      internalResolutionScale: this.internalResolutionScale,
      pathTracing: pathTracing.status,
      pathTracingSamples: pathTracing.samples,
    };
  }

  dispose(): void {
    this.pathTracedPresentation.dispose();
    this.lightBudget.dispose();
    this.composer.passes.forEach((pass) => pass.dispose());
    this.composer.dispose();
    this.renderer.info.autoReset = this.previousRendererInfoAutoReset;
  }

  private applyProfile(settings: GameSettings, resizeTargets: boolean): void {
    this.renderer.toneMapping =
      this.profile.tier === 'essential' ? THREE.ACESFilmicToneMapping : THREE.AgXToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = this.profile.tier !== 'essential';
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.composer.renderTarget1.samples = this.profile.multisamples;
    this.composer.renderTarget2.samples = this.profile.multisamples;
    this.ssrPass.resolutionScale = this.profile.reflectionScale;
    this.gradePass.uniforms.grainAmount.value = this.profile.grainAmount;
    this.gradePass.uniforms.vignetteStrength.value = this.profile.vignetteStrength;
    this.gradePass.uniforms.sharpenStrength.value = this.profile.sharpenStrength;
    this.gradePass.uniforms.chromaAmount.value = settings.reducedMotion ? 0 : 0.0007;
    this.bloomPass.strength = settings.reducedFlashes ? 0.22 : 0.42;
    this.bloomPass.threshold = settings.reducedFlashes ? 1.25 : 1.05;

    this.bloomPass.enabled = this.profile.bloom;
    this.outputPass.enabled = true;
    this.applyAdaptiveLevel(this.budget.currentLevel);

    this.renderer.domElement.dataset.renderTier = this.profile.tier;
    this.renderer.domElement.dataset.hdr = String(this.profile.hdr);
    this.renderer.domElement.dataset.webgpuAvailable = String(this.capabilities.webgpuAvailable);
    this.renderer.domElement.dataset.lightingModel = 'hybrid-pbr-ssr-gtao';
    this.renderer.domElement.dataset.pathTracingPolicy = this.pathTracingDisabledForDiagnostics
      ? 'diagnostics-disabled'
      : 'frozen-scenes';
    if (resizeTargets) this.setSize(this.width, this.height, this.pixelRatio);
    this.materialCalibrator.update(this.profile);
  }

  private applyAdaptiveLevel(level: 0 | 1 | 2): void {
    this.ssrPass.enabled = this.profile.screenSpaceReflections && level === 0;
    this.renderPass.enabled = !this.ssrPass.enabled;
    this.gtaoPass.enabled = this.profile.ambientOcclusion && level < 2;
    // SMAA is retained while there is headroom. At the emergency level FXAA
    // replaces SMAA's three full-screen stages with one pass; the cinematic
    // composite's sharpening offsets the small softness cost.
    this.smaaPass.enabled = this.profile.smaa && level < 2;
    this.fxaaPass.enabled = !this.smaaPass.enabled;
    const nextResolutionScale = level === 2 ? 0.76 : level === 1 ? 0.84 : 1;
    if (nextResolutionScale !== this.internalResolutionScale) {
      this.internalResolutionScale = nextResolutionScale;
      this.resizeComposerTargets();
    }
    this.renderer.domElement.dataset.adaptiveRenderLevel = String(level);
    this.renderer.domElement.dataset.internalResolutionScale = String(this.internalResolutionScale);
    this.renderer.domElement.dataset.renderScale = String(this.internalResolutionScale);
    this.renderer.domElement.dataset.antialiasing = this.smaaPass.enabled ? 'smaa' : 'fxaa';
    this.renderer.domElement.dataset.shadowFiltering = 'pcf';
    this.renderer.domElement.dataset.composerSamples = String(this.profile.multisamples);
  }

  private updateResolutionUniforms(): void {
    const effectivePixelRatio = this.pixelRatio * this.internalResolutionScale;
    const effectiveWidth = Math.max(1, Math.floor(this.width * effectivePixelRatio));
    const effectiveHeight = Math.max(1, Math.floor(this.height * effectivePixelRatio));
    this.gradePass.uniforms.resolution.value.set(effectiveWidth, effectiveHeight);
    this.fxaaPass.material.uniforms.resolution.value.set(1 / effectiveWidth, 1 / effectiveHeight);
  }

  private resizeComposerTargets(): void {
    const effectivePixelRatio = this.pixelRatio * this.internalResolutionScale;
    this.composer.setPixelRatio(effectivePixelRatio);
    this.composer.setSize(this.width, this.height);
    const bloomScale =
      this.profile.bloomResolutionScale *
      (this.budget.currentLevel === 2 ? 0.7 : this.budget.currentLevel === 1 ? 0.84 : 1);
    this.bloomPass.setSize(
      Math.max(1, Math.floor(this.width * effectivePixelRatio * bloomScale)),
      Math.max(1, Math.floor(this.height * effectivePixelRatio * bloomScale)),
    );
    const gtaoScale = this.budget.currentLevel === 0 ? 0.62 : 0.52;
    this.gtaoPass.setSize(
      Math.max(1, Math.floor(this.width * effectivePixelRatio * gtaoScale)),
      Math.max(1, Math.floor(this.height * effectivePixelRatio * gtaoScale)),
    );
    if (this.diagnosticsEnabled) {
      this.renderer.domElement.dataset.effectiveComposerPixelRatio = effectivePixelRatio.toFixed(3);
      this.renderer.domElement.dataset.bloomResolutionScale = bloomScale.toFixed(3);
      this.renderer.domElement.dataset.gtaoResolutionScale = gtaoScale.toFixed(3);
    }
    this.updateResolutionUniforms();
  }

  private publishRenderStats(): void {
    const { render, memory, programs } = this.renderer.info;
    const canvas = this.renderer.domElement;
    canvas.dataset.renderCalls = String(render.calls);
    canvas.dataset.renderTriangles = String(render.triangles);
    canvas.dataset.renderPoints = String(render.points);
    canvas.dataset.renderLines = String(render.lines);
    canvas.dataset.renderGeometries = String(memory.geometries);
    canvas.dataset.renderTextures = String(memory.textures);
    canvas.dataset.renderPrograms = String(programs?.length ?? 0);
    const lightDiagnostics = this.lightBudget.diagnostics();
    canvas.dataset.pointLightsActive = String(lightDiagnostics.active);
    canvas.dataset.pointLightsEligible = String(lightDiagnostics.eligible);
    canvas.dataset.pointLightsTotal = String(lightDiagnostics.total);
  }

  private adaptivePointLightLimit(): number {
    if (this.profile.tier !== 'cinematic') return this.profile.maxPointLights;
    if (this.budget.currentLevel === 2) return Math.max(4, this.profile.maxPointLights - 2);
    if (this.budget.currentLevel === 1) return Math.max(5, this.profile.maxPointLights - 1);
    return this.profile.maxPointLights;
  }
}

function inspectGraphicsCapabilities(gl: WebGL2RenderingContext): GraphicsCapabilities {
  const maxSamples = Number(gl.getParameter(gl.MAX_SAMPLES) ?? 0);
  const maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE) ?? 0);
  return {
    hdrRenderTargets: Boolean(gl.getExtension('EXT_color_buffer_float')),
    floatTextureFiltering: Boolean(gl.getExtension('OES_texture_float_linear')),
    timerQueries: Boolean(gl.getExtension('EXT_disjoint_timer_query_webgl2')),
    maxSamples: Number.isFinite(maxSamples) ? maxSamples : 0,
    maxTextureSize: Number.isFinite(maxTextureSize) ? maxTextureSize : 0,
    webgpuAvailable: typeof navigator !== 'undefined' && 'gpu' in navigator,
  };
}

function createComposerRenderTarget(profile: RenderingProfile): THREE.WebGLRenderTarget {
  const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: profile.hdr ? THREE.HalfFloatType : THREE.UnsignedByteType,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false,
    samples: profile.multisamples,
  });
  renderTarget.texture.name = profile.hdr ? 'Vespera.HDR.SceneColor' : 'Vespera.SDR.SceneColor';
  return renderTarget;
}
