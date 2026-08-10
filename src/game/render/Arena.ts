import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import type { Quality } from '../types/GameTypes';
import {
  createCarrot,
  createExtraction,
  createSeal,
  type ExtractionRig,
  type SealRig,
} from './ActorFactory';
import { SeededRandom } from '../utils/SeededRandom';
import { createArenaMaterials, type ArenaMaterialLibrary } from './ArenaMaterials';
import { batchStaticArenaGeometry, createBioGothicArchitecture } from './BioGothicArchitecture';

export interface ArenaObstacle {
  center: THREE.Vector3;
  radius: number;
}

export interface ArenaRig {
  root: THREE.Group;
  seals: SealRig[];
  carrot: THREE.Group;
  extraction: ExtractionRig;
  obstacles: ArenaObstacle[];
  rain: THREE.Points;
  embers: THREE.Points;
  lightning: THREE.DirectionalLight;
  practicalLights: THREE.PointLight[];
  surfaceTextures: THREE.Texture[];
}

export async function createArena(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  quality: Quality,
  random: SeededRandom,
): Promise<ArenaRig> {
  const root = new THREE.Group();
  root.name = 'VesperaFloodedBioCathedral';
  scene.add(root);

  const materials = await createArenaMaterials(renderer);
  createArenaFloor(root, materials, quality);
  createStormBackdrop(root, materials.cityTexture, quality);

  const obstacles: ArenaObstacle[] = [];
  createBioGothicArchitecture(root, materials, quality, random, obstacles);

  const sealPositions = [
    new THREE.Vector3(-19, 0, -12),
    new THREE.Vector3(19, 0, -9),
    new THREE.Vector3(2, 0, 22),
  ];
  const seals = sealPositions.map((position, index) => {
    const seal = createSeal(index);
    seal.root.position.copy(position);
    seal.root.rotation.y = index * 1.7;
    root.add(seal.root);
    return seal;
  });

  const carrot = createCarrot();
  carrot.position.set(0, 0.08, 11.5);
  root.add(carrot);

  const extraction = createExtraction();
  extraction.root.position.set(-2, 0, 32);
  root.add(extraction.root);

  const rain = createRain(quality === 'high' ? 2200 : quality === 'medium' ? 1300 : 620, random);
  root.add(rain);
  const embers = createEmbers(quality === 'high' ? 620 : quality === 'medium' ? 360 : 170, random);
  root.add(embers);

  const hemisphere = new THREE.HemisphereLight(0x7898bb, 0x160609, 0.14);
  scene.add(hemisphere);
  const moonKey = createMoonKey(quality);
  scene.add(moonKey);
  const lightning = new THREE.DirectionalLight(0xc8e2ff, 0);
  lightning.position.set(20, 36, -20);
  scene.add(lightning);

  const practicalLights = addCathedralLights(root, materials, quality);
  batchStaticArenaGeometry(root, materials);
  const environmentTextures = await createEnvironment(scene, renderer);
  root.userData.sceneLights = [hemisphere, moonKey, lightning];
  root.userData.environmentTexture = environmentTextures.filtered;
  installRenderDiagnostics(renderer, root, quality);

  const particleTextures = [
    (rain.material as THREE.PointsMaterial).map,
    (embers.material as THREE.PointsMaterial).map,
  ].filter((texture): texture is THREE.Texture => texture !== null);

  return {
    root,
    seals,
    carrot,
    extraction,
    obstacles,
    rain,
    embers,
    lightning,
    practicalLights,
    surfaceTextures: [
      ...materials.textures,
      environmentTextures.filtered,
      ...(environmentTextures.raw ? [environmentTextures.raw] : []),
      ...particleTextures,
    ],
  };
}

export function animateArena(
  arena: ArenaRig,
  time: number,
  delta: number,
  reducedFlashes = false,
): void {
  const rainPositions = arena.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < rainPositions.count; index += 1) {
    let y = rainPositions.getY(index) - delta * (18 + (index % 9) * 0.85);
    let x = rainPositions.getX(index) - delta * (2.7 + (index % 4) * 0.18);
    if (y < 0.16) {
      y = 25 + (index % 11);
      x = ((index * 13.37) % 90) - 45;
    }
    rainPositions.setXYZ(index, x, y, rainPositions.getZ(index));
  }
  rainPositions.needsUpdate = true;

  const emberPositions = arena.embers.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < emberPositions.count; index += 1) {
    let y = emberPositions.getY(index) + delta * (0.42 + (index % 5) * 0.14);
    if (y > 10) y = 0.18;
    const drift = Math.sin(time * 0.72 + index) * delta * 0.24;
    emberPositions.setXYZ(index, emberPositions.getX(index) + drift, y, emberPositions.getZ(index));
  }
  emberPositions.needsUpdate = true;

  arena.seals.forEach((seal, index) => {
    seal.core.rotation.y += delta * (0.65 + index * 0.14);
    seal.core.rotation.x += delta * 0.28;
    seal.rings.forEach((ring, ringIndex) => {
      ring.rotation.z += delta * (ringIndex % 2 === 0 ? 0.22 : -0.18);
    });
  });
  arena.carrot.rotation.y += delta * 1.1;
  arena.carrot.position.y = 0.08 + Math.sin(time * 2.4) * 0.12;
  arena.extraction.beam.rotation.y += delta * 0.12;
  arena.extraction.ship.position.y = 17 + Math.sin(time * 0.72) * 0.45;
  applyArenaFlashProfile(arena, time, reducedFlashes);
}

export function applyArenaFlashProfile(
  arena: ArenaRig,
  time: number,
  reducedFlashes: boolean,
): void {
  arena.seals.forEach((seal, index) => {
    const baseIntensity = Number(seal.light.userData.baseIntensity ?? seal.light.intensity);
    seal.light.intensity = reducedFlashes
      ? baseIntensity * (0.94 + Math.sin(time * 0.65 + index) * 0.015)
      : baseIntensity * (0.92 + Math.sin(time * 8 + index) * 0.08);
  });
  arena.extraction.light.intensity = reducedFlashes
    ? 24 + Math.sin(time * 0.72) * 0.75
    : 27 + Math.sin(time * 7) * 4;
  arena.practicalLights.forEach((light, index) => {
    const base = Number(light.userData.baseIntensity ?? light.intensity);
    if (reducedFlashes) {
      light.intensity = base * (0.94 + Math.sin(time * 0.62 + index * 1.91) * 0.015);
      return;
    }
    const flutter = 0.9 + Math.sin(time * (7.4 + (index % 4)) + index * 1.91) * 0.08;
    const spit = Math.sin(time * 29 + index * 4.7) > 0.94 ? 0.78 : 1;
    light.intensity = base * flutter * spit;
  });

  const stormCycle = time % 11.7;
  arena.lightning.intensity =
    !reducedFlashes && stormCycle > 10.95 && stormCycle < 11.08
      ? 4.2
      : !reducedFlashes && stormCycle > 11.16 && stormCycle < 11.24
        ? 2.1
        : 0;
}

function createArenaFloor(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
): void {
  const segments = quality === 'high' ? 128 : quality === 'medium' ? 96 : 64;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(48, segments), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.035;
  floor.receiveShadow = true;
  root.add(floor);

  const undercroft = new THREE.Mesh(
    new THREE.CylinderGeometry(48.15, 48.7, 0.62, segments, 2),
    materials.floorEdge,
  );
  undercroft.position.y = -0.36;
  undercroft.receiveShadow = true;
  root.add(undercroft);

  const wetFilm = new THREE.Mesh(
    new THREE.CircleGeometry(47.85, segments),
    new THREE.MeshPhysicalMaterial({
      color: 0x111722,
      roughness: 0.16,
      metalness: 0.02,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      specularIntensity: 0.9,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      envMapIntensity: 1.35,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  wetFilm.rotation.x = -Math.PI / 2;
  wetFilm.position.y = 0.018;
  wetFilm.receiveShadow = true;
  root.add(wetFilm);
}

function createStormBackdrop(
  root: THREE.Group,
  cityTexture: THREE.Texture,
  quality: Quality,
): void {
  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(70, quality === 'low' ? 32 : 64, quality === 'low' ? 20 : 32),
    new THREE.MeshBasicMaterial({
      map: cityTexture,
      side: THREE.BackSide,
      fog: false,
      color: 0x657287,
    }),
  );
  backdrop.name = 'VesperaStormCyclorama';
  backdrop.scale.y = 0.54;
  backdrop.position.y = 18;
  backdrop.rotation.y = Math.PI * 0.5;
  root.add(backdrop);
}

function createMoonKey(quality: Quality): THREE.DirectionalLight {
  const key = new THREE.DirectionalLight(0xa9c8ff, 1.06);
  key.position.set(-18, 31, 15);
  key.castShadow = quality !== 'low';
  const shadowSize = quality === 'high' ? 2048 : 1024;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 96;
  key.shadow.camera.left = -43;
  key.shadow.camera.right = 43;
  key.shadow.camera.top = 43;
  key.shadow.camera.bottom = -43;
  key.shadow.bias = -0.00032;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = quality === 'high' ? 3 : 1.5;
  return key;
}

function addCathedralLights(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
): THREE.PointLight[] {
  const lightPositions: ReadonlyArray<readonly [number, number, number, number]> = [
    [-30, 5.4, -18, 0xff5b2d],
    [30, 4.8, -15, 0x53a9ff],
    [-30, 4.8, 18, 0xff4725],
    [28, 5.4, 22, 0x70c7ff],
    [-15, 7.4, -34, 0xff5b2d],
    [16, 7.1, -35, 0x5a9dff],
  ];
  const lights: THREE.PointLight[] = [];
  lightPositions.forEach(([x, y, z, color], index) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const bracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.2, 1.35, 8),
      materials.blackMetal,
    );
    bracket.rotation.z = Math.PI / 2;
    bracket.position.x = index % 2 ? 0.48 : -0.48;
    bracket.castShadow = true;
    group.add(bracket);
    const cage = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 7), materials.tarnishedMetal);
    cage.scale.set(0.8, 1.45, 0.8);
    cage.castShadow = true;
    group.add(cage);
    for (let ring = 0; ring < 3; ring += 1) {
      const hoop = new THREE.Mesh(
        new THREE.TorusGeometry(0.36 - ring * 0.035, 0.035, 5, 12),
        materials.blackMetal,
      );
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = (ring - 1) * 0.32;
      group.add(hoop);
    }
    const flame = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
    );
    flame.scale.y = 1.8;
    group.add(flame);
    const light = new THREE.PointLight(color, quality === 'low' ? 5 : 7.5, 19, 2);
    light.userData.baseIntensity = light.intensity;
    group.add(light);
    lights.push(light);

    root.add(group);
  });
  const localRims: ReadonlyArray<readonly [number, number, number, number]> = [
    [-11, 3.1, 5, 0xff3b20],
    [13, 3.4, -4, 0xff7838],
  ];
  localRims.forEach(([x, y, z, color]) => {
    const light = new THREE.PointLight(color, quality === 'low' ? 4 : 6.5, 15, 2);
    light.position.set(x, y, z);
    light.userData.baseIntensity = light.intensity;
    root.add(light);
    lights.push(light);
  });
  return lights;
}

async function createEnvironment(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
): Promise<{ filtered: THREE.Texture; raw: THREE.DataTexture | null }> {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  let raw: THREE.DataTexture | null = null;
  let filtered: THREE.Texture;
  try {
    raw = await new HDRLoader().loadAsync('/assets/hdri/rooftop-night-1k.hdr');
    raw.mapping = THREE.EquirectangularReflectionMapping;
    filtered = pmrem.fromEquirectangular(raw).texture;
    scene.userData.pathTracingEnvironment = raw;
  } catch {
    const room = new RoomEnvironment();
    filtered = pmrem.fromScene(room, 0.035).texture;
    room.dispose();
    scene.userData.pathTracingEnvironment = null;
  }
  scene.environment = filtered;
  scene.environmentIntensity = 0.52;
  pmrem.dispose();
  return { filtered, raw };
}

function createRain(count: number, random: SeededRandom): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = random.range(-46, 46);
    positions[index * 3 + 1] = random.range(0.2, 34);
    positions[index * 3 + 2] = random.range(-46, 46);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xc5dcf2,
    size: 0.18,
    map: createParticleSprite('rain'),
    alphaTest: 0.08,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function createEmbers(count: number, random: SeededRandom): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = random.range(-40, 40);
    positions[index * 3 + 1] = random.range(0.2, 9);
    positions[index * 3 + 2] = random.range(-40, 40);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xff6338,
    size: 0.18,
    map: createParticleSprite('ember'),
    alphaTest: 0.04,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

function createParticleSprite(kind: 'rain' | 'ember'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, 64, 64);
    if (kind === 'rain') {
      const gradient = context.createLinearGradient(32, 2, 32, 62);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.24, 'rgba(255,255,255,.85)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.strokeStyle = gradient;
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(36, 2);
      context.lineTo(27, 62);
      context.stroke();
    } else {
      const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 30);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.18, 'rgba(255,179,91,.92)');
      gradient.addColorStop(0.56, 'rgba(255,65,20,.28)');
      gradient.addColorStop(1, 'rgba(255,0,0,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
    }
  }
  return new THREE.CanvasTexture(canvas);
}

function installRenderDiagnostics(
  renderer: THREE.WebGLRenderer,
  root: THREE.Group,
  quality: Quality,
): void {
  if (!new URLSearchParams(window.location.search).has('diagnostics')) return;
  const diagnosticsWindow = window as Window & {
    __MARK_RENDER_INFO__?: () => {
      quality: Quality;
      calls: number;
      triangles: number;
      points: number;
      lines: number;
      geometries: number;
      textures: number;
      arenaMeshes: number;
      arenaTriangles: number;
    };
  };
  diagnosticsWindow.__MARK_RENDER_INFO__ = () => {
    let arenaMeshes = 0;
    let arenaTriangles = 0;
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.InstancedMesh)) return;
      arenaMeshes += 1;
      const geometry = object.geometry;
      const triangles = geometry.index
        ? geometry.index.count / 3
        : (geometry.getAttribute('position')?.count ?? 0) / 3;
      arenaTriangles += triangles * (object instanceof THREE.InstancedMesh ? object.count : 1);
    });
    return {
      quality,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      points: renderer.info.render.points,
      lines: renderer.info.render.lines,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      arenaMeshes,
      arenaTriangles: Math.round(arenaTriangles),
    };
  };
}
