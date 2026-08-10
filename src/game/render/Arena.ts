import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { installRuntimeRenderDiagnostics } from '../runtimeDiagnostics';
import type { Quality } from '../types/GameTypes';
import { createExtraction, createSeal, type ExtractionRig, type SealRig } from './ActorFactory';
import { SeededRandom } from '../utils/SeededRandom';
import { createArenaMaterials, type ArenaMaterialLibrary } from './ArenaMaterials';
import { batchStaticArenaGeometry, createBioGothicArchitecture } from './BioGothicArchitecture';
import { selectCinematicLook } from './CinematicLook';
import {
  applyChapterVisualProfile,
  CHAPTER_LAYOUTS,
  createChapterScenery,
  type ChapterEnvironmentId,
  type ChapterVisualProfile,
} from './ChapterScenery';
import { createChapterRecovery } from './ChapterRecovery';

export interface ArenaObstacle {
  center: THREE.Vector3;
  radius: number;
}

export interface ArenaRig {
  root: THREE.Group;
  chapterId: ChapterEnvironmentId;
  profile: ChapterVisualProfile;
  playerStart: THREE.Vector3;
  bossPosition: THREE.Vector3;
  playRadius: number;
  animatedScenery: THREE.Object3D[];
  seals: SealRig[];
  recovery: THREE.Group;
  extraction: ExtractionRig;
  obstacles: ArenaObstacle[];
  rain: THREE.Points;
  embers: THREE.Points;
  lightning: THREE.DirectionalLight;
  practicalLights: THREE.PointLight[];
  surfaceTextures: THREE.Texture[];
  removeRenderDiagnostics: () => void;
}

export async function createArena(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  quality: Quality,
  random: SeededRandom,
  chapterId: ChapterEnvironmentId = 'the-drowned-cathedral',
  reducedFlashes = false,
  diagnosticsEnabled = false,
): Promise<ArenaRig> {
  const root = new THREE.Group();
  root.name = `CampaignArena-${chapterId}`;
  scene.add(root);

  const materials = await createArenaMaterials(renderer);
  const profile = applyChapterVisualProfile(scene, materials, chapterId);
  const look = selectCinematicLook(chapterId, reducedFlashes);
  materials.vein.emissiveIntensity = look.veinEmissiveIntensity;
  const layout = CHAPTER_LAYOUTS[chapterId];
  createArenaFloor(root, materials, quality, chapterId);
  createStormBackdrop(root, materials.cityTexture, quality, chapterId);

  const obstacles: ArenaObstacle[] = [];
  if (chapterId === 'the-root-vault' || chapterId === 'the-drowned-cathedral') {
    createBioGothicArchitecture(root, materials, quality, random, obstacles);
  }
  const chapterScenery = createChapterScenery(
    root,
    materials,
    quality,
    random,
    obstacles,
    chapterId,
  );
  const animatedScenery: THREE.Object3D[] = [];
  chapterScenery.traverse((object) => {
    if (
      typeof object.userData.orbitSpeed === 'number' ||
      typeof object.userData.memoryRing === 'number' ||
      typeof object.userData.memoryShard === 'number' ||
      object.userData.choirCrown === true
    ) {
      animatedScenery.push(object);
    }
  });

  const sealPositions = layout.anchors.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const seals = sealPositions.map((position, index) => {
    const seal = createSeal(index);
    seal.root.position.copy(position);
    seal.root.rotation.y = index * 1.7;
    root.add(seal.root);
    return seal;
  });

  const recovery = createChapterRecovery(chapterId);
  recovery.position.set(layout.recovery[0], 0.08, layout.recovery[1]);
  root.add(recovery);

  const extraction = createExtraction();
  extraction.root.position.set(layout.extraction[0], 0, layout.extraction[1]);
  root.add(extraction.root);

  const rain = createRain(quality === 'high' ? 2200 : quality === 'medium' ? 1300 : 620, random);
  root.add(rain);
  const embers = createEmbers(quality === 'high' ? 620 : quality === 'medium' ? 360 : 170, random);
  root.add(embers);
  configureChapterParticles(rain, embers, profile);

  const hemisphere = new THREE.HemisphereLight(
    profile.secondaryColor,
    profile.fogColor,
    look.hemisphereIntensity,
  );
  scene.add(hemisphere);
  const moonKey = createMoonKey(quality, profile);
  scene.add(moonKey);
  const lightning = new THREE.DirectionalLight(0xc8e2ff, 0);
  lightning.position.set(20, 36, -20);
  scene.add(lightning);

  const practicalLights = addCathedralLights(
    root,
    materials,
    quality,
    profile,
    look.practicalIntensityScale,
  );
  batchStaticArenaGeometry(root, materials);
  const environmentTextures = await createEnvironment(scene, renderer, look.environmentIntensity);
  root.userData.sceneLights = [hemisphere, moonKey, lightning];
  root.userData.hemisphereLight = hemisphere;
  root.userData.veinMaterial = materials.vein;
  root.userData.environmentTexture = environmentTextures.filtered;
  const removeRenderDiagnostics = installArenaRenderDiagnostics(
    renderer,
    root,
    quality,
    diagnosticsEnabled,
  );

  const particleTextures = [
    (rain.material as THREE.PointsMaterial).map,
    (embers.material as THREE.PointsMaterial).map,
  ].filter((texture): texture is THREE.Texture => texture !== null);

  return {
    root,
    chapterId,
    profile,
    playerStart: new THREE.Vector3(layout.start[0], 0, layout.start[1]),
    bossPosition: new THREE.Vector3(layout.boss[0], 0, layout.boss[1]),
    playRadius: layout.playRadius,
    animatedScenery,
    seals,
    recovery,
    extraction,
    obstacles,
    rain,
    embers,
    lightning,
    practicalLights,
    removeRenderDiagnostics,
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
  reducedMotion = false,
): void {
  const ambienceMotionScale = reducedMotion ? 0.08 : 1;
  const ambienceDelta = delta * ambienceMotionScale;
  const rainPositions = arena.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < rainPositions.count; index += 1) {
    let x = rainPositions.getX(index);
    let y = rainPositions.getY(index);
    let z = rainPositions.getZ(index);
    if (arena.profile.particles === 'rain') {
      y -= ambienceDelta * (18 + (index % 9) * 0.85);
      x -= ambienceDelta * (2.7 + (index % 4) * 0.18);
      if (y < 0.16) {
        y = 25 + (index % 11);
        x = ((index * 13.37) % 90) - 45;
      }
    } else if (arena.profile.particles === 'ash') {
      y += ambienceDelta * (0.32 + (index % 7) * 0.09);
      x += Math.sin(time * 0.37 + index * 0.71) * ambienceDelta * 0.34;
      z += Math.cos(time * 0.29 + index * 0.43) * ambienceDelta * 0.2;
      if (y > 24) y = 0.2;
    } else if (arena.profile.particles === 'stars') {
      x += Math.sin(time * 0.08 + index) * ambienceDelta * 0.025;
      y += Math.cos(time * 0.07 + index * 0.4) * ambienceDelta * 0.018;
    } else {
      y += ambienceDelta * (0.5 + (index % 9) * 0.11);
      x += Math.sin(time * 0.4 + index * 0.19) * ambienceDelta * 0.46;
      if (y > 28) y = 0.1;
    }
    rainPositions.setXYZ(index, x, y, z);
  }
  rainPositions.needsUpdate = true;

  const emberPositions = arena.embers.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < emberPositions.count; index += 1) {
    let y = emberPositions.getY(index) + ambienceDelta * (0.42 + (index % 5) * 0.14);
    if (y > 10) y = 0.18;
    const drift = Math.sin(time * 0.72 + index) * ambienceDelta * 0.24;
    emberPositions.setXYZ(index, emberPositions.getX(index) + drift, y, emberPositions.getZ(index));
  }
  emberPositions.needsUpdate = true;

  arena.seals.forEach((seal, index) => {
    seal.core.rotation.y += ambienceDelta * (0.65 + index * 0.14);
    seal.core.rotation.x += ambienceDelta * 0.28;
    seal.rings.forEach((ring, ringIndex) => {
      ring.rotation.z += ambienceDelta * (ringIndex % 2 === 0 ? 0.22 : -0.18);
    });
  });
  arena.recovery.rotation.y += ambienceDelta * 1.1;
  arena.recovery.position.y = 0.08 + Math.sin(time * 2.4) * (reducedMotion ? 0.018 : 0.12);
  arena.extraction.beam.rotation.y += ambienceDelta * 0.12;
  arena.extraction.ship.position.y = 17 + Math.sin(time * 0.72) * (reducedMotion ? 0.06 : 0.45);
  arena.animatedScenery.forEach((object, index) => {
    const orbitSpeed = Number(object.userData.orbitSpeed ?? 0);
    if (orbitSpeed !== 0) {
      object.rotation.x += ambienceDelta * orbitSpeed * 0.63;
      object.rotation.y += ambienceDelta * orbitSpeed;
    }
    if (typeof object.userData.memoryRing === 'number') {
      const direction = Number(object.userData.memoryRing) % 2 === 0 ? 1 : -1;
      object.rotation.y += ambienceDelta * 0.08 * direction;
      object.rotation.z += ambienceDelta * 0.045 * -direction;
    }
    if (typeof object.userData.memoryShard === 'number') {
      object.position.y += Math.sin(time * 0.45 + index) * ambienceDelta * 0.05;
    }
    if (object.userData.choirCrown === true) {
      object.rotation.z += ambienceDelta * 0.035;
      object.scale.setScalar(1 + Math.sin(time * 0.52) * (reducedMotion ? 0.002 : 0.018));
    }
  });
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
    arena.profile.storm && !reducedFlashes && stormCycle > 10.95 && stormCycle < 11.08
      ? 4.2
      : arena.profile.storm && !reducedFlashes && stormCycle > 11.16 && stormCycle < 11.24
        ? 2.1
        : 0;
}

export function applyArenaCinematicLook(arena: ArenaRig, reducedFlashes: boolean): void {
  const look = selectCinematicLook(arena.chapterId, reducedFlashes);
  const hemisphere = arena.root.userData.hemisphereLight;
  if (hemisphere instanceof THREE.HemisphereLight) {
    hemisphere.intensity = look.hemisphereIntensity;
  }
  if (arena.root.parent instanceof THREE.Scene) {
    arena.root.parent.environmentIntensity = look.environmentIntensity;
  }
  const veinMaterial = arena.root.userData.veinMaterial;
  if (veinMaterial instanceof THREE.MeshStandardMaterial) {
    veinMaterial.emissiveIntensity = look.veinEmissiveIntensity;
  }
  arena.practicalLights.forEach((light) => {
    const authoredIntensity = Number(
      light.userData.authoredIntensity ?? light.userData.baseIntensity ?? light.intensity,
    );
    const intensity = authoredIntensity * look.practicalIntensityScale;
    light.userData.baseIntensity = intensity;
    light.intensity = intensity;
  });
}

function createArenaFloor(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  chapterId: ChapterEnvironmentId,
): void {
  const segments = quality === 'high' ? 128 : quality === 'medium' ? 96 : 64;
  const radius = chapterId === 'crown-of-eidolon' ? 51 : 48;
  const radialSegments =
    chapterId === 'the-root-vault'
      ? 12
      : chapterId === 'vespera-in-black'
        ? 16
        : chapterId === 'the-silent-orbit'
          ? 32
          : segments;
  const floorMaterial =
    chapterId === 'the-silent-orbit' || chapterId === 'the-memory-forge'
      ? materials.blackMetal
      : materials.floor;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, radialSegments), floorMaterial);
  if (chapterId === 'ashes-of-home') floor.scale.set(1.06, 0.86, 1);
  if (chapterId === 'crown-of-eidolon') floor.scale.set(0.76, 1, 1);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.035;
  floor.receiveShadow = true;
  root.add(floor);

  const undercroft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 0.15, radius + 0.7, 0.62, radialSegments, 2),
    materials.floorEdge,
  );
  undercroft.position.y = -0.36;
  undercroft.receiveShadow = true;
  root.add(undercroft);

  const wetFilm = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 0.15, radialSegments),
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
  if (chapterId === 'ashes-of-home') wetFilm.scale.set(1.06, 0.86, 1);
  if (chapterId === 'crown-of-eidolon') wetFilm.scale.set(0.76, 1, 1);
  wetFilm.position.y = 0.018;
  wetFilm.receiveShadow = true;
  root.add(wetFilm);

  createChapterFloorDetails(root, materials, quality, chapterId);

  if (chapterId === 'the-root-choir') {
    const memoryOcean = new THREE.Mesh(new THREE.CircleGeometry(48.2, segments), materials.water);
    memoryOcean.rotation.x = -Math.PI / 2;
    memoryOcean.position.y = 0.04;
    memoryOcean.name = 'MemoryOcean';
    root.add(memoryOcean);
  }
}

function createStormBackdrop(
  root: THREE.Group,
  cityTexture: THREE.Texture,
  quality: Quality,
  chapterId: ChapterEnvironmentId,
): THREE.Mesh {
  const chapterTreatment: Partial<
    Record<
      ChapterEnvironmentId,
      { color: number; rotation: number; heightScale: number; verticalOffset: number }
    >
  > = {
    'ashes-of-home': {
      color: 0x48566b,
      rotation: Math.PI * 0.16,
      heightScale: 0.43,
      verticalOffset: 15,
    },
    'vespera-in-black': {
      color: 0x7a8da8,
      rotation: Math.PI * 0.67,
      heightScale: 0.66,
      verticalOffset: 20,
    },
    'the-drowned-cathedral': {
      color: 0x313946,
      rotation: Math.PI * 1.12,
      heightScale: 0.38,
      verticalOffset: 13,
    },
  };
  const treatment = chapterTreatment[chapterId];
  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(70, quality === 'low' ? 32 : 64, quality === 'low' ? 20 : 32),
    new THREE.MeshBasicMaterial({
      map: cityTexture,
      side: THREE.BackSide,
      fog: false,
      color: treatment?.color ?? 0x657287,
    }),
  );
  backdrop.name = 'VesperaStormCyclorama';
  backdrop.visible = treatment !== undefined;
  backdrop.scale.y = treatment?.heightScale ?? 0.54;
  backdrop.position.y = treatment?.verticalOffset ?? 18;
  backdrop.rotation.y = treatment?.rotation ?? Math.PI * 0.5;
  root.add(backdrop);
  return backdrop;
}

function createChapterFloorDetails(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  chapterId: ChapterEnvironmentId,
): void {
  const details = new THREE.Group();
  details.name = `FloorLanguage-${chapterId}`;
  root.add(details);
  const radialSegments = quality === 'low' ? 28 : quality === 'medium' ? 44 : 64;

  const addRing = (
    radius: number,
    thickness: number,
    material: THREE.Material,
    x = 0,
    z = 0,
  ): void => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, thickness, 6, radialSegments),
      material,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.045, z);
    ring.receiveShadow = true;
    details.add(ring);
  };
  const addRail = (
    x: number,
    z: number,
    width: number,
    depth: number,
    rotation: number,
    material: THREE.Material,
  ): void => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.075, depth), material);
    rail.position.set(x, 0.022, z);
    rail.rotation.y = rotation;
    rail.receiveShadow = true;
    details.add(rail);
  };

  switch (chapterId) {
    case 'ashes-of-home':
      addRing(10.5, 0.18, materials.tarnishedMetal, -8, -7);
      addRing(17, 0.11, materials.blackMetal, -8, -7);
      for (let index = -3; index <= 3; index += 1) {
        addRail(
          index * 7.2,
          -2 + Math.abs(index) * 1.15,
          5.4,
          0.26,
          -0.12 * index,
          materials.blackMetal,
        );
      }
      break;
    case 'the-root-vault':
      [9, 18, 29].forEach((radius, index) =>
        addRing(radius, index === 1 ? 0.16 : 0.1, materials.blackMetal),
      );
      for (let spoke = 0; spoke < 8; spoke += 1) {
        const angle = (spoke / 8) * Math.PI * 2;
        addRail(
          Math.sin(angle) * 17,
          Math.cos(angle) * 17,
          0.25,
          34,
          angle,
          materials.bioStoneDark,
        );
      }
      break;
    case 'vespera-in-black':
      for (let line = -4; line <= 4; line += 1) {
        addRail(line * 8.4, 0, 0.13, 74, 0, materials.tarnishedMetal);
        addRail(0, line * 8.4, 74, 0.13, 0, materials.tarnishedMetal);
      }
      [13, 27, 39].forEach((radius) => addRing(radius, 0.08, materials.vein));
      break;
    case 'the-drowned-cathedral':
      for (let slab = -9; slab <= 9; slab += 1) {
        addRail((slab % 2) * 0.22, slab * 4.2, 7.2, 3.72, slab * 0.012, materials.bioStone);
      }
      addRail(-10.5, 0, 5.8, 76, 0, materials.water);
      addRail(10.5, 0, 5.8, 76, 0, materials.water);
      break;
    case 'the-silent-orbit':
      [7, 14, 22, 31, 40].forEach((radius, index) =>
        addRing(radius, index % 2 === 0 ? 0.13 : 0.08, materials.tarnishedMetal),
      );
      for (let spoke = 0; spoke < 12; spoke += 1) {
        const angle = (spoke / 12) * Math.PI * 2;
        addRail(Math.sin(angle) * 20, Math.cos(angle) * 20, 0.18, 40, angle, materials.blackMetal);
      }
      break;
    case 'the-memory-forge':
      [8, 17, 29, 39].forEach((radius, index) =>
        addRing(
          radius,
          index % 2 === 0 ? 0.16 : 0.1,
          index % 2 === 0 ? materials.tarnishedMetal : materials.vein,
        ),
      );
      for (let spoke = 0; spoke < 10; spoke += 1) {
        const angle = (spoke / 10) * Math.PI * 2;
        addRail(
          Math.sin(angle) * 21,
          Math.cos(angle) * 21,
          spoke % 2 === 0 ? 0.42 : 0.17,
          42,
          angle,
          spoke % 2 === 0 ? materials.tarnishedMetal : materials.vein,
        );
      }
      break;
    case 'crown-of-eidolon':
      for (const side of [-1, 1]) {
        addRail(side * 12.5, 0, 3.2, 78, 0, materials.blackMetal);
        addRail(side * 17.2, 0, 0.42, 78, 0, materials.vein);
      }
      for (let brace = -4; brace <= 4; brace += 1) {
        addRail(0, brace * 8.5, 30, 0.3, brace * 0.018, materials.tarnishedMetal);
      }
      break;
    case 'the-root-choir':
      [12, 23, 35].forEach((radius, index) =>
        addRing(radius, 0.1 + index * 0.025, index === 1 ? materials.vein : materials.hostileGlass),
      );
      break;
  }
}

function configureChapterParticles(
  primary: THREE.Points,
  secondary: THREE.Points,
  profile: ChapterVisualProfile,
): void {
  const primaryMaterial = primary.material;
  if (primaryMaterial instanceof THREE.PointsMaterial) {
    primaryMaterial.color.setHex(
      profile.particles === 'rain'
        ? 0x93b8d8
        : profile.particles === 'stars'
          ? 0xdbe8ff
          : profile.particles === 'memory'
            ? profile.secondaryColor
            : 0xd09b77,
    );
    primaryMaterial.opacity = profile.particles === 'stars' ? 0.82 : 0.55;
    primaryMaterial.size =
      profile.particles === 'rain' ? 0.085 : profile.particles === 'stars' ? 0.13 : 0.1;
  }
  const secondaryMaterial = secondary.material;
  if (secondaryMaterial instanceof THREE.PointsMaterial) {
    secondaryMaterial.color.setHex(profile.accentColor);
    secondaryMaterial.opacity = profile.particles === 'stars' ? 0.22 : 0.68;
  }
}

function createMoonKey(quality: Quality, profile: ChapterVisualProfile): THREE.DirectionalLight {
  const key = new THREE.DirectionalLight(profile.keyColor, profile.keyIntensity);
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
  profile: ChapterVisualProfile,
  intensityScale: number,
): THREE.PointLight[] {
  const lightPositions: ReadonlyArray<readonly [number, number, number]> = [
    [-30, 5.4, -18],
    [30, 4.8, -15],
    [-30, 4.8, 18],
    [28, 5.4, 22],
    [-15, 7.4, -34],
    [16, 7.1, -35],
  ];
  const lights: THREE.PointLight[] = [];
  lightPositions.forEach(([x, y, z], index) => {
    const color = index % 2 === 0 ? profile.accentColor : profile.secondaryColor;
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
    const authoredIntensity = quality === 'low' ? 5 : 7.5;
    const light = new THREE.PointLight(color, authoredIntensity * intensityScale, 19, 2);
    light.userData.authoredIntensity = authoredIntensity;
    light.userData.baseIntensity = light.intensity;
    group.add(light);
    lights.push(light);

    root.add(group);
  });
  const localRims: ReadonlyArray<readonly [number, number, number, number]> = [
    [-11, 3.1, 5, profile.accentColor],
    [13, 3.4, -4, profile.secondaryColor],
  ];
  localRims.forEach(([x, y, z, color]) => {
    const authoredIntensity = quality === 'low' ? 4 : 6.5;
    const light = new THREE.PointLight(color, authoredIntensity * intensityScale, 15, 2);
    light.userData.authoredIntensity = authoredIntensity;
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
  intensity: number,
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
  scene.environmentIntensity = intensity;
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

function installArenaRenderDiagnostics(
  renderer: THREE.WebGLRenderer,
  root: THREE.Group,
  quality: Quality,
  enabled: boolean,
): () => void {
  return installRuntimeRenderDiagnostics(enabled, () => {
    const result: {
      quality: Quality;
      calls: number;
      triangles: number;
      points: number;
      lines: number;
      geometries: number;
      textures: number;
      arenaMeshes: number;
      arenaTriangles: number;
    } = {
      quality,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      points: renderer.info.render.points,
      lines: renderer.info.render.lines,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      arenaMeshes: 0,
      arenaTriangles: 0,
    };
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
    result.arenaMeshes = arenaMeshes;
    result.arenaTriangles = Math.round(arenaTriangles);
    return result;
  });
}
