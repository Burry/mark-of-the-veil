import * as THREE from 'three';
import type { Quality } from '../types/GameTypes';
import { SeededRandom } from '../utils/SeededRandom';
import { TAU } from '../utils/math';
import type { ArenaObstacle } from './Arena';
import type { ArenaMaterialLibrary } from './ArenaMaterials';

export type ChapterEnvironmentId =
  | 'ashes-of-home'
  | 'the-root-vault'
  | 'vespera-in-black'
  | 'the-drowned-cathedral'
  | 'the-silent-orbit'
  | 'the-memory-forge'
  | 'crown-of-eidolon'
  | 'the-root-choir';

export interface ChapterVisualProfile {
  id: ChapterEnvironmentId;
  clearColor: number;
  fogColor: number;
  fogDensity: number;
  keyColor: number;
  keyIntensity: number;
  accentColor: number;
  secondaryColor: number;
  stoneTint: number;
  metalTint: number;
  waterTint: number;
  storm: boolean;
  particles: 'rain' | 'ash' | 'stars' | 'memory';
}

export interface ChapterArenaLayout {
  start: readonly [number, number];
  recovery: readonly [number, number];
  anchors: readonly [
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
  ];
  boss: readonly [number, number];
  extraction: readonly [number, number];
  playRadius: number;
}

export const CHAPTER_LAYOUTS: Record<ChapterEnvironmentId, ChapterArenaLayout> = {
  'ashes-of-home': {
    start: [-9, 17],
    recovery: [-2, 10],
    anchors: [
      [-16, 4],
      [20, -17],
      [12, 20],
    ],
    boss: [2, -4],
    extraction: [0, 34],
    playRadius: 40,
  },
  'the-root-vault': {
    start: [0, 17],
    recovery: [0, 11.5],
    anchors: [
      [-18, -11],
      [18, -10],
      [1, 23],
    ],
    boss: [0, -2],
    extraction: [-3, 33],
    playRadius: 39,
  },
  'vespera-in-black': {
    start: [-12, 19],
    recovery: [-4, 12],
    anchors: [
      [-21, -13],
      [17, 11],
      [8, -23],
    ],
    boss: [0, 0],
    extraction: [26, 23],
    playRadius: 40,
  },
  'the-drowned-cathedral': {
    start: [0, 16.5],
    recovery: [0, 11.5],
    anchors: [
      [-19, -12],
      [19, -9],
      [2, 22],
    ],
    boss: [0, -1],
    extraction: [-2, 32],
    playRadius: 39.5,
  },
  'the-silent-orbit': {
    start: [17, 13],
    recovery: [9, 8],
    anchors: [
      [-23, 9],
      [17, -19],
      [2, 24],
    ],
    boss: [-2, -4],
    extraction: [-27, -19],
    playRadius: 40,
  },
  'the-memory-forge': {
    start: [0, 19],
    recovery: [0, 12],
    anchors: [
      [-20, 4],
      [19, 7],
      [0, -23],
    ],
    boss: [0, -7],
    extraction: [24, 24],
    playRadius: 40,
  },
  'crown-of-eidolon': {
    start: [0, 21],
    recovery: [-5, 13],
    anchors: [
      [-18, 5],
      [18, -6],
      [0, -25],
    ],
    boss: [0, -10],
    extraction: [0, -34],
    playRadius: 40,
  },
  'the-root-choir': {
    start: [0, 24],
    recovery: [0, 14],
    anchors: [
      [-17, 6],
      [16, -4],
      [0, -19],
    ],
    boss: [0, -15],
    extraction: [0, -35],
    playRadius: 40,
  },
};

export const CHAPTER_VISUALS: Record<ChapterEnvironmentId, ChapterVisualProfile> = {
  'ashes-of-home': {
    id: 'ashes-of-home',
    clearColor: 0x071019,
    fogColor: 0x142232,
    fogDensity: 0.0115,
    keyColor: 0xb4d4ff,
    keyIntensity: 1.28,
    accentColor: 0xff7a3d,
    secondaryColor: 0x62c8ff,
    stoneTint: 0x4b515b,
    metalTint: 0x536170,
    waterTint: 0x132431,
    storm: true,
    particles: 'rain',
  },
  'the-root-vault': {
    id: 'the-root-vault',
    clearColor: 0x030807,
    fogColor: 0x0b1713,
    fogDensity: 0.019,
    keyColor: 0x93bfa9,
    keyIntensity: 0.72,
    accentColor: 0xc4ef91,
    secondaryColor: 0x5dbf9b,
    stoneTint: 0x343d38,
    metalTint: 0x4b5149,
    waterTint: 0x0b211d,
    storm: false,
    particles: 'ash',
  },
  'vespera-in-black': {
    id: 'vespera-in-black',
    clearColor: 0x050812,
    fogColor: 0x10192a,
    fogDensity: 0.013,
    keyColor: 0x94c5ff,
    keyIntensity: 1.06,
    accentColor: 0x45d9ff,
    secondaryColor: 0xff5846,
    stoneTint: 0x3a414d,
    metalTint: 0x465e74,
    waterTint: 0x0c1d2d,
    storm: true,
    particles: 'rain',
  },
  'the-drowned-cathedral': {
    id: 'the-drowned-cathedral',
    clearColor: 0x05070c,
    fogColor: 0x0a0e15,
    fogDensity: 0.0145,
    keyColor: 0xa9c8ff,
    keyIntensity: 1.06,
    accentColor: 0xff5d36,
    secondaryColor: 0x53a9ff,
    stoneTint: 0x6b5e62,
    metalTint: 0x84644f,
    waterTint: 0x101823,
    storm: true,
    particles: 'rain',
  },
  'the-silent-orbit': {
    id: 'the-silent-orbit',
    clearColor: 0x010208,
    fogColor: 0x070a14,
    fogDensity: 0.006,
    keyColor: 0xc9dcff,
    keyIntensity: 1.65,
    accentColor: 0x72e9ff,
    secondaryColor: 0xffb76c,
    stoneTint: 0x555b6a,
    metalTint: 0x778397,
    waterTint: 0x080e1d,
    storm: false,
    particles: 'stars',
  },
  'the-memory-forge': {
    id: 'the-memory-forge',
    clearColor: 0x090607,
    fogColor: 0x211314,
    fogDensity: 0.012,
    keyColor: 0xffc48a,
    keyIntensity: 1.16,
    accentColor: 0xff8f5d,
    secondaryColor: 0x7acbff,
    stoneTint: 0x55433f,
    metalTint: 0x735344,
    waterTint: 0x1d1013,
    storm: false,
    particles: 'memory',
  },
  'crown-of-eidolon': {
    id: 'crown-of-eidolon',
    clearColor: 0x070506,
    fogColor: 0x1a0d10,
    fogDensity: 0.009,
    keyColor: 0xffb89a,
    keyIntensity: 1.42,
    accentColor: 0xff4f32,
    secondaryColor: 0xb876ff,
    stoneTint: 0x4e3639,
    metalTint: 0x6d4543,
    waterTint: 0x210b0f,
    storm: false,
    particles: 'ash',
  },
  'the-root-choir': {
    id: 'the-root-choir',
    clearColor: 0x030209,
    fogColor: 0x100c1c,
    fogDensity: 0.008,
    keyColor: 0xd9c8ff,
    keyIntensity: 1.12,
    accentColor: 0xffc477,
    secondaryColor: 0xa98aff,
    stoneTint: 0x453f56,
    metalTint: 0x6b5e7b,
    waterTint: 0x080611,
    storm: false,
    particles: 'memory',
  },
};

export const CHAPTER_ENVIRONMENT_SIGNATURES: Record<ChapterEnvironmentId, readonly string[]> = {
  'ashes-of-home': [
    'WayfarerWreck',
    'ImpactReliquary',
    'BrokenWayfarerViaduct',
    'CrashDebrisField',
  ],
  'the-root-vault': ['OssuarySluiceGates', 'RootVaultDrainage', 'MycelialBloom'],
  'vespera-in-black': ['VesperaRoofline', 'VesperaSkybridge', 'VesperaVentField'],
  'the-drowned-cathedral': ['DrownedOrganLofts', 'DrownedProcessionalArches'],
  'the-silent-orbit': ['OrbitalLiftCore', 'OrbitalRingArray', 'ZeroGravityDebris'],
  'the-memory-forge': ['MnemonicForgeEngine', 'MnemonicForgeHall', 'MemoryGlassArchive'],
  'crown-of-eidolon': ['EidolonTrenchworks', 'EidolonCrownGate', 'OssuaryConduits'],
  'the-root-choir': ['ChoirPilgrimage', 'ChoirNeuralCanopy', 'ChoirCrown', 'ChoirNave'],
};

export function applyChapterVisualProfile(
  scene: THREE.Scene,
  materials: ArenaMaterialLibrary,
  chapterId: ChapterEnvironmentId,
): ChapterVisualProfile {
  const profile = CHAPTER_VISUALS[chapterId];
  scene.background = new THREE.Color(profile.clearColor);
  scene.fog = new THREE.FogExp2(profile.fogColor, profile.fogDensity);
  materials.bioStone.color.setHex(profile.stoneTint);
  materials.bioStoneDark.color.copy(materials.bioStone.color).multiplyScalar(0.58);
  materials.vaultWall.color.copy(materials.bioStone.color).multiplyScalar(0.42);
  materials.tarnishedMetal.color.setHex(profile.metalTint);
  materials.water.color.setHex(profile.waterTint);
  materials.vein.color.setHex(profile.accentColor);
  materials.vein.emissive.setHex(profile.accentColor);
  materials.hostileGlass.emissive.setHex(profile.secondaryColor);
  return profile;
}

export function createChapterScenery(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  random: SeededRandom,
  obstacles: ArenaObstacle[],
  chapterId: ChapterEnvironmentId,
): THREE.Group {
  const scenery = new THREE.Group();
  scenery.name = `ChapterScenery-${chapterId}`;
  root.add(scenery);

  switch (chapterId) {
    case 'ashes-of-home':
      createCrashBasin(scenery, materials, quality, obstacles);
      break;
    case 'the-root-vault':
      createPrisonAqueduct(scenery, materials, quality, random, obstacles);
      break;
    case 'vespera-in-black':
      createVesperaRooftops(scenery, materials, quality, obstacles);
      break;
    case 'the-drowned-cathedral':
      createDrownedNave(scenery, materials, obstacles);
      break;
    case 'the-silent-orbit':
      createOrbitalLift(scenery, materials, quality, random, obstacles);
      break;
    case 'the-memory-forge':
      createMemoryForge(scenery, materials, quality, obstacles);
      break;
    case 'crown-of-eidolon':
      createEidolonTrenches(scenery, materials, quality, obstacles);
      break;
    case 'the-root-choir':
      createRootChoir(scenery, materials, quality, obstacles);
      break;
  }
  return scenery;
}

interface ChapterDetailBudget {
  archSegments: number;
  radialSegments: number;
  rubble: number;
  greebles: number;
}

function chapterDetailBudget(quality: Quality): ChapterDetailBudget {
  if (quality === 'high') {
    return { archSegments: 40, radialSegments: 64, rubble: 46, greebles: 7 };
  }
  if (quality === 'medium') {
    return { archSegments: 28, radialSegments: 48, rubble: 30, greebles: 5 };
  }
  return { archSegments: 18, radialSegments: 32, rubble: 18, greebles: 3 };
}

function createCrashBasin(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  obstacles: ArenaObstacle[],
): void {
  const budget = chapterDetailBudget(quality);
  const hull = new THREE.Group();
  hull.name = 'WayfarerWreck';
  hull.position.set(-21, 1.8, 4);
  hull.rotation.set(-0.18, 0.55, 0.12);
  const fuselage = mesh(new THREE.CapsuleGeometry(2.8, 11, 12, 28), materials.blackMetal);
  fuselage.rotation.z = Math.PI / 2;
  hull.add(fuselage);
  const canopy = mesh(new THREE.SphereGeometry(2.3, 28, 18), materials.hostileGlass);
  canopy.scale.set(1.4, 0.62, 0.8);
  canopy.position.set(3.2, 0.9, -0.15);
  hull.add(canopy);
  for (let rib = -3; rib <= 3; rib += 1) {
    const hullRib = mesh(
      new THREE.TorusGeometry(2.52 - Math.abs(rib) * 0.08, 0.105, 6, budget.radialSegments),
      rib % 2 === 0 ? materials.tarnishedMetal : materials.blackMetal,
    );
    hullRib.rotation.y = Math.PI / 2;
    hullRib.scale.y = 0.62;
    hullRib.position.x = rib * 1.45;
    hull.add(hullRib);
  }
  for (const side of [-1, 1]) {
    const wing = mesh(new THREE.BoxGeometry(7.5, 0.32, 3.5), materials.tarnishedMetal);
    wing.position.set(-0.4, -0.35, side * 3.5);
    wing.rotation.x = side * 0.08;
    hull.add(wing);
    const tornTip = mesh(new THREE.ConeGeometry(1.65, 5.2, 4, 1), materials.blackMetal);
    tornTip.position.set(-1.8, -0.2, side * 6.1);
    tornTip.rotation.set(side * 0.16, 0, Math.PI / 2);
    hull.add(tornTip);
    const nacelle = mesh(
      new THREE.CylinderGeometry(0.72, 0.92, 4.4, budget.radialSegments, 2),
      materials.tarnishedMetal,
    );
    nacelle.rotation.z = Math.PI / 2;
    nacelle.position.set(-2.1, 0.18, side * 3.85);
    hull.add(nacelle);
  }
  for (let panel = 0; panel < budget.greebles; panel += 1) {
    const plate = mesh(new THREE.BoxGeometry(1.25, 0.09, 0.7), materials.tarnishedMetal);
    plate.position.set(-3.4 + panel * 1.05, 2.03 - Math.abs(panel - 3) * 0.08, 0);
    plate.rotation.z = panel % 2 === 0 ? 0.04 : -0.05;
    hull.add(plate);
  }
  root.add(hull);
  obstacles.push({ center: new THREE.Vector3(-21, 0, 4), radius: 5.4 });

  const dish = new THREE.Group();
  dish.name = 'ImpactReliquary';
  dish.position.set(20, 0, -17);
  const mast = mesh(new THREE.CylinderGeometry(0.8, 1.4, 11, 12), materials.bioStoneDark);
  mast.position.y = 5.5;
  dish.add(mast);
  const bowl = mesh(
    new THREE.SphereGeometry(7, quality === 'low' ? 18 : 32, 12, 0, TAU, 0, Math.PI * 0.34),
    materials.tarnishedMetal,
  );
  bowl.rotation.x = Math.PI * 0.62;
  bowl.rotation.z = -0.4;
  bowl.position.y = 11;
  dish.add(bowl);
  for (let brace = 0; brace < 6; brace += 1) {
    const angle = (brace / 6) * TAU;
    dish.add(
      beamBetween(
        new THREE.Vector3(Math.cos(angle) * 1.1, 5.8, Math.sin(angle) * 1.1),
        new THREE.Vector3(Math.cos(angle) * 4.6, 10.7, Math.sin(angle) * 4.6),
        0.09,
        materials.blackMetal,
        7,
      ),
    );
  }
  const receiver = mesh(new THREE.OctahedronGeometry(0.7, 2), materials.vein);
  receiver.position.set(-1.9, 12.4, 0.7);
  dish.add(receiver);
  root.add(dish);
  obstacles.push({ center: new THREE.Vector3(20, 0, -17), radius: 2.4 });

  const viaduct = new THREE.Group();
  viaduct.name = 'BrokenWayfarerViaduct';
  viaduct.position.set(0, 0, -35);
  for (let bay = -3; bay <= 3; bay += 1) {
    if (bay === 1) continue;
    const height = 8.5 + (3 - Math.abs(bay)) * 1.35;
    addSpiredPier(viaduct, materials, bay * 7.4, 0, height, budget.radialSegments);
    if (bay < 3 && bay !== 0) {
      const arch = createPointedArch(
        7.4,
        7 + (3 - Math.abs(bay)) * 0.7,
        0.28,
        budget.archSegments,
        materials.bioStoneDark,
      );
      arch.position.x = bay * 7.4 + 3.7;
      viaduct.add(arch);
    }
  }
  root.add(viaduct);

  for (let index = 0; index < 9; index += 1) {
    const shard = mesh(
      new THREE.ConeGeometry(0.45 + (index % 3) * 0.18, 5 + (index % 4) * 1.8, 5),
      index % 2 === 0 ? materials.hostileGlass : materials.bioStone,
    );
    const angle = (index / 9) * TAU;
    shard.position.set(Math.cos(angle) * 31, 2.4, Math.sin(angle) * 27);
    shard.rotation.z = Math.cos(angle) * 0.25;
    root.add(shard);
  }

  const debrisGeometry = new THREE.DodecahedronGeometry(0.45, 0);
  const debris = new THREE.InstancedMesh(debrisGeometry, materials.blackMetal, budget.rubble);
  debris.name = 'CrashDebrisField';
  const transform = new THREE.Object3D();
  for (let index = 0; index < budget.rubble; index += 1) {
    const angle = index * 2.39996;
    const radius = 7.5 + ((index * 13) % 31);
    transform.position.set(Math.cos(angle) * radius, 0.15, Math.sin(angle) * radius);
    transform.rotation.set(angle * 0.7, angle * 0.37, angle * 0.19);
    const scale = 0.35 + (index % 7) * 0.13;
    transform.scale.set(scale * 1.7, scale * 0.55, scale);
    transform.updateMatrix();
    debris.setMatrixAt(index, transform.matrix);
  }
  debris.castShadow = true;
  debris.receiveShadow = true;
  root.add(debris);
}

function createPrisonAqueduct(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  random: SeededRandom,
  obstacles: ArenaObstacle[],
): void {
  const budget = chapterDetailBudget(quality);
  const gates = new THREE.Group();
  gates.name = 'OssuarySluiceGates';
  root.add(gates);
  for (let gateIndex = 0; gateIndex < 4; gateIndex += 1) {
    const angle = gateIndex * (TAU / 4) + Math.PI / 4;
    const position = new THREE.Vector3(Math.cos(angle) * 24, 0, Math.sin(angle) * 24);
    const gate = new THREE.Group();
    gate.position.copy(position);
    gate.rotation.y = -angle;
    for (const side of [-1, 1]) {
      const pillar = mesh(new THREE.BoxGeometry(1.5, 9.5, 1.7), materials.bioStoneDark);
      pillar.position.set(side * 3.4, 4.75, 0);
      gate.add(pillar);
      const cap = mesh(new THREE.ConeGeometry(0.9, 2.6, 6), materials.chitin);
      cap.position.set(side * 3.4, 10.4, 0);
      gate.add(cap);
    }
    for (let bar = -2; bar <= 2; bar += 1) {
      const iron = mesh(new THREE.CylinderGeometry(0.1, 0.14, 7.8, 8), materials.blackMetal);
      iron.position.set(bar * 1.05, 4.1, 0);
      gate.add(iron);
    }
    const arch = createPointedArch(6.8, 7.4, 0.34, budget.archSegments, materials.bioStone);
    arch.position.y = 4.2;
    gate.add(arch);
    gates.add(gate);
  }

  const bloom = new THREE.Group();
  bloom.name = 'MycelialBloom';
  root.add(bloom);
  const fungusCount = quality === 'high' ? 70 : quality === 'medium' ? 44 : 22;
  for (let index = 0; index < fungusCount; index += 1) {
    const angle = random.range(0, TAU);
    const radius = random.range(10, 39);
    const stem = mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.5, 6), materials.bioStone);
    stem.position.set(Math.cos(angle) * radius, 0.25, Math.sin(angle) * radius);
    const cap = mesh(new THREE.SphereGeometry(0.18, 10, 6), materials.hostileGlass);
    cap.scale.y = 0.35;
    cap.position.copy(stem.position).add(new THREE.Vector3(0, 0.25, 0));
    bloom.add(stem, cap);
  }

  const drainage = new THREE.Group();
  drainage.name = 'RootVaultDrainage';
  root.add(drainage);
  for (let channel = 0; channel < 8; channel += 1) {
    const angle = (channel / 8) * TAU;
    const trough = mesh(new THREE.BoxGeometry(0.52, 0.2, 31), materials.water);
    trough.position.set(Math.sin(angle) * 14, 0.06, Math.cos(angle) * 14);
    trough.rotation.y = angle;
    drainage.add(trough);
    const drain = mesh(
      new THREE.TorusGeometry(2.4 + (channel % 2) * 0.4, 0.16, 7, budget.radialSegments),
      channel % 2 === 0 ? materials.chitin : materials.tarnishedMetal,
    );
    drain.rotation.x = Math.PI / 2;
    drain.position.set(Math.cos(angle) * 32.5, 3.2, Math.sin(angle) * 32.5);
    drain.rotation.y = -angle;
    drainage.add(drain);
  }
  addCover(root, materials, obstacles, -16, -6, 3.2, 1.8, 6.5);
  addCover(root, materials, obstacles, 15, 12, 4.6, 2.1, 2.4);
}

function createVesperaRooftops(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  obstacles: ArenaObstacle[],
): void {
  const budget = chapterDetailBudget(quality);
  const roofline = new THREE.Group();
  roofline.name = 'VesperaRoofline';
  root.add(roofline);
  const count = quality === 'high' ? 16 : quality === 'medium' ? 12 : 8;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * TAU;
    const radius = 29 + (index % 3) * 4.2;
    const height = 8 + (index % 5) * 3.8;
    const tower = mesh(
      new THREE.BoxGeometry(4 + (index % 2) * 1.5, height, 4.8),
      index % 3 === 0 ? materials.blackMetal : materials.bioStoneDark,
    );
    tower.position.set(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius);
    tower.rotation.y = -angle + index * 0.12;
    roofline.add(tower);
    const crown = mesh(
      new THREE.CylinderGeometry(1.35, 2.65, 3.2, 4, 1),
      index % 3 === 0 ? materials.tarnishedMetal : materials.blackMetal,
    );
    crown.position.copy(tower.position).add(new THREE.Vector3(0, height / 2 + 1.6, 0));
    crown.rotation.y = tower.rotation.y + Math.PI / 4;
    roofline.add(crown);
    const spire = mesh(new THREE.ConeGeometry(0.28, 4.8, 6), materials.tarnishedMetal);
    spire.position.copy(tower.position).add(new THREE.Vector3(0, height / 2 + 5.2, 0));
    roofline.add(spire);
    for (const side of [-1, 1]) {
      const buttress = mesh(
        new THREE.BoxGeometry(0.36, height * 0.78, 0.54),
        materials.tarnishedMetal,
      );
      buttress.position
        .copy(tower.position)
        .add(new THREE.Vector3(side * (2.15 + (index % 2) * 0.72), -height * 0.05, 0));
      buttress.rotation.y = tower.rotation.y;
      roofline.add(buttress);
    }
    const neon = mesh(new THREE.BoxGeometry(0.12, height * 0.55, 2.2), materials.vein);
    neon.position.copy(tower.position).add(new THREE.Vector3(0, height * 0.08, 2.45));
    neon.rotation.y = tower.rotation.y;
    roofline.add(neon);
  }

  const skybridge = new THREE.Group();
  skybridge.name = 'VesperaSkybridge';
  skybridge.position.set(0, 0, -30);
  for (let section = -3; section <= 3; section += 1) {
    const deck = mesh(new THREE.BoxGeometry(7.3, 0.45, 3.1), materials.blackMetal);
    deck.position.set(section * 7.1, 8 + Math.abs(section) * 0.28, 0);
    deck.rotation.z = section * -0.018;
    skybridge.add(deck);
    if (section < 3) {
      const support = createPointedArch(
        7.1,
        6.8,
        0.22,
        budget.archSegments,
        materials.tarnishedMetal,
      );
      support.position.set(section * 7.1 + 3.55, 1.2, 0);
      skybridge.add(support);
    }
  }
  root.add(skybridge);

  const vents = new THREE.Group();
  vents.name = 'VesperaVentField';
  for (let vent = 0; vent < 12; vent += 1) {
    const angle = vent * 2.39996;
    const radius = 16 + (vent % 4) * 4.2;
    const stack = mesh(
      new THREE.CylinderGeometry(0.34, 0.56, 2.2 + (vent % 3), 8),
      vent % 3 === 0 ? materials.tarnishedMetal : materials.blackMetal,
    );
    stack.position.set(Math.cos(angle) * radius, 1.1 + (vent % 3) * 0.5, Math.sin(angle) * radius);
    vents.add(stack);
    const cowl = mesh(new THREE.CylinderGeometry(0.72, 0.42, 0.55, 8), materials.tarnishedMetal);
    cowl.position.copy(stack.position).add(new THREE.Vector3(0, 1.35 + (vent % 3) * 0.5, 0));
    vents.add(cowl);
  }
  root.add(vents);
  addCover(root, materials, obstacles, -11, 9, 6.8, 2.2, 2.2);
  addCover(root, materials, obstacles, 13, -8, 5.4, 2.4, 3.4);
  addCover(root, materials, obstacles, 3, 19, 8.2, 1.4, 2.2);
}

function createDrownedNave(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  obstacles: ArenaObstacle[],
): void {
  const organLofts = new THREE.Group();
  organLofts.name = 'DrownedOrganLofts';
  root.add(organLofts);
  for (const [x, z] of [
    [-27, 0],
    [27, 0],
  ] as const) {
    const organ = new THREE.Group();
    organ.position.set(x, 0, z);
    for (let pipe = 0; pipe < 7; pipe += 1) {
      const tube = mesh(
        new THREE.CylinderGeometry(0.22, 0.3, 7 + Math.abs(pipe - 3) * 1.1, 10),
        materials.tarnishedMetal,
      );
      tube.position.set(0, 4 + Math.abs(pipe - 3) * 0.55, (pipe - 3) * 0.72);
      organ.add(tube);
      const mouth = mesh(new THREE.TorusGeometry(0.29, 0.06, 6, 14), materials.blackMetal);
      mouth.rotation.x = Math.PI / 2;
      mouth.position
        .copy(tube.position)
        .add(new THREE.Vector3(0, (7 + Math.abs(pipe - 3) * 1.1) / 2, 0));
      organ.add(mouth);
    }
    organLofts.add(organ);
    obstacles.push({ center: new THREE.Vector3(x, 0, z), radius: 2.2 });
  }

  const arches = new THREE.Group();
  arches.name = 'DrownedProcessionalArches';
  for (let bay = -3; bay <= 3; bay += 1) {
    if (bay === 0) continue;
    const arch = createPointedArch(12, 13 + Math.abs(bay) * 0.4, 0.58, 36, materials.bioStoneDark);
    arch.position.set(0, 1.2, bay * 10.5);
    arches.add(arch);
    for (const side of [-1, 1]) {
      const pier = mesh(new THREE.CylinderGeometry(0.7, 1.2, 11, 10), materials.bioStone);
      pier.position.set(side * 6, 5.5, bay * 10.5);
      arches.add(pier);
      obstacles.push({
        center: new THREE.Vector3(side * 6, 0, bay * 10.5),
        radius: 1.2,
      });
    }
  }
  root.add(arches);
}

function createOrbitalLift(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  random: SeededRandom,
  obstacles: ArenaObstacle[],
): void {
  const budget = chapterDetailBudget(quality);
  const liftCore = new THREE.Group();
  liftCore.name = 'OrbitalLiftCore';
  const elevator = mesh(new THREE.CylinderGeometry(8.2, 9.6, 19, 32, 5), materials.blackMetal);
  elevator.position.set(0, -8.2, -32);
  liftCore.add(elevator);
  for (let tier = 0; tier < 5; tier += 1) {
    const collar = mesh(
      new THREE.TorusGeometry(9.2 - tier * 0.28, 0.24, 7, budget.radialSegments),
      tier % 2 === 0 ? materials.tarnishedMetal : materials.hostileGlass,
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, -0.6 - tier * 2.8, -32);
    liftCore.add(collar);
  }
  root.add(liftCore);
  obstacles.push({ center: new THREE.Vector3(0, 0, -32), radius: 9.2 });

  const ringArray = new THREE.Group();
  ringArray.name = 'OrbitalRingArray';
  for (let ring = 0; ring < 5; ring += 1) {
    const halo = mesh(
      new THREE.TorusGeometry(12 + ring * 4.8, 0.28 + ring * 0.04, 10, quality === 'low' ? 48 : 80),
      ring % 2 === 0 ? materials.tarnishedMetal : materials.hostileGlass,
    );
    halo.position.set(0, 10 + ring * 3.8, -21 + ring * 3.2);
    halo.rotation.set(0.8 + ring * 0.17, ring * 0.25, ring * 0.12);
    ringArray.add(halo);
    for (let brace = 0; brace < 4; brace += 1) {
      const angle = (brace / 4) * TAU + ring * 0.13;
      ringArray.add(
        beamBetween(
          new THREE.Vector3(
            Math.cos(angle) * (11.6 + ring * 4.8),
            10 + ring * 3.8,
            -21 + ring * 3.2 + Math.sin(angle) * (11.6 + ring * 4.8),
          ),
          new THREE.Vector3(
            Math.cos(angle) * (12.4 + ring * 4.8),
            10 + ring * 3.8,
            -21 + ring * 3.2 + Math.sin(angle) * (12.4 + ring * 4.8),
          ),
          0.12,
          materials.tarnishedMetal,
          7,
        ),
      );
    }
  }
  root.add(ringArray);
  const debrisCount = quality === 'high' ? 54 : quality === 'medium' ? 34 : 18;
  const debrisField = new THREE.Group();
  debrisField.name = 'ZeroGravityDebris';
  const debrisPerBelt = Math.ceil(debrisCount / 3);
  for (let beltIndex = 0; beltIndex < 3; beltIndex += 1) {
    const remaining = debrisCount - beltIndex * debrisPerBelt;
    const instanceCount = Math.min(debrisPerBelt, remaining);
    if (instanceCount <= 0) continue;
    const belt = new THREE.Group();
    belt.userData.orbitSpeed = (beltIndex % 2 === 0 ? 1 : -1) * (0.018 + beltIndex * 0.009);
    const instances = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      beltIndex === 1 ? materials.hostileGlass : materials.tarnishedMetal,
      instanceCount,
    );
    instances.castShadow = true;
    instances.receiveShadow = true;
    const transform = new THREE.Object3D();
    for (let index = 0; index < instanceCount; index += 1) {
      const angle = random.range(0, TAU);
      const radius = random.range(10 + beltIndex * 4, 30 + beltIndex * 5);
      transform.position.set(
        Math.cos(angle) * radius,
        random.range(3 + beltIndex * 2, 11 + beltIndex * 4),
        Math.sin(angle) * radius,
      );
      transform.rotation.set(random.range(0, TAU), random.range(0, TAU), random.range(0, TAU));
      transform.scale.set(random.range(0.2, 1.8), random.range(0.15, 0.7), random.range(0.4, 2.8));
      transform.updateMatrix();
      instances.setMatrixAt(index, transform.matrix);
    }
    belt.add(instances);
    debrisField.add(belt);
  }
  root.add(debrisField);
}

function createMemoryForge(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  obstacles: ArenaObstacle[],
): void {
  const budget = chapterDetailBudget(quality);
  const engine = new THREE.Group();
  engine.name = 'MnemonicForgeEngine';
  engine.position.set(0, 8.5, -29);
  const axle = mesh(
    new THREE.CylinderGeometry(1.05, 1.45, 13, budget.radialSegments, 3),
    materials.blackMetal,
  );
  axle.rotation.x = Math.PI / 2;
  axle.position.z = -3.8;
  engine.add(axle);
  for (let ring = 0; ring < 6; ring += 1) {
    const machineRing = mesh(
      new THREE.TorusGeometry(
        4 + ring * 0.95,
        0.18 + ring * 0.035,
        10,
        quality === 'low' ? 36 : 64,
      ),
      ring % 2 === 0 ? materials.tarnishedMetal : materials.hostileGlass,
    );
    machineRing.rotation.set(ring * 0.31, ring * 0.27, ring * 0.18);
    machineRing.userData.memoryRing = ring;
    engine.add(machineRing);
  }
  const core = mesh(new THREE.IcosahedronGeometry(2.1, quality === 'low' ? 1 : 2), materials.vein);
  engine.add(core);
  for (let arm = 0; arm < 8; arm += 1) {
    const angle = (arm / 8) * TAU;
    const start = new THREE.Vector3(Math.cos(angle) * 6.6, Math.sin(angle) * 6.6, -0.6);
    const elbow = new THREE.Vector3(Math.cos(angle) * 10.4, Math.sin(angle) * 10.4, 2.3);
    engine.add(beamBetween(start, elbow, 0.34, materials.tarnishedMetal, 10));
    const piston = mesh(
      new THREE.CylinderGeometry(0.52, 0.72, 2.2, 10),
      arm % 2 === 0 ? materials.hostileGlass : materials.blackMetal,
    );
    piston.position.copy(elbow);
    piston.rotation.z = angle;
    engine.add(piston);
  }
  root.add(engine);

  const hall = new THREE.Group();
  hall.name = 'MnemonicForgeHall';
  for (const z of [-31, -15, 1, 17, 33]) {
    const arch = createPointedArch(57, 23, 0.68, budget.archSegments, materials.blackMetal);
    arch.position.set(0, 0.8, z);
    hall.add(arch);
    const innerArch = createPointedArch(
      51,
      20,
      0.16,
      budget.archSegments,
      materials.tarnishedMetal,
    );
    innerArch.position.set(0, 1.1, z + 0.08);
    hall.add(innerArch);
    for (const side of [-1, 1]) {
      addSpiredPier(hall, materials, side * 28.5, z, 17.5, budget.radialSegments);
      const transformer = mesh(
        new THREE.CylinderGeometry(1.1, 1.4, 5.8, budget.radialSegments),
        materials.tarnishedMetal,
      );
      transformer.position.set(side * 25.2, 3.1, z);
      hall.add(transformer);
      for (let collar = 0; collar < 3; collar += 1) {
        const ring = mesh(
          new THREE.TorusGeometry(1.42, 0.12, 6, budget.radialSegments),
          materials.blackMetal,
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(side * 25.2, 1.6 + collar * 1.5, z);
        hall.add(ring);
      }
    }
  }
  root.add(hall);

  const archive = new THREE.Group();
  archive.name = 'MemoryGlassArchive';
  for (let index = 0; index < 9; index += 1) {
    const shard = mesh(
      new THREE.PlaneGeometry(4 + (index % 3) * 1.8, 6 + (index % 4) * 1.4),
      materials.hostileGlass,
    );
    const angle = (index / 9) * TAU;
    shard.position.set(Math.cos(angle) * 24, 4 + (index % 3) * 2.2, Math.sin(angle) * 24);
    shard.rotation.y = -angle + Math.PI / 2;
    shard.userData.memoryShard = index;
    const frame = mesh(
      new THREE.BoxGeometry(4.35 + (index % 3) * 1.8, 0.14, 0.16),
      materials.tarnishedMetal,
    );
    frame.position.copy(shard.position).add(new THREE.Vector3(0, 3 + (index % 4) * 0.7, 0));
    frame.rotation.y = shard.rotation.y;
    archive.add(frame);
    archive.add(shard);
  }
  root.add(archive);
  addCover(root, materials, obstacles, -10, -2, 7, 2.2, 2.1);
  addCover(root, materials, obstacles, 11, 4, 6, 2.4, 2.3);
}

function createEidolonTrenches(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  obstacles: ArenaObstacle[],
): void {
  const budget = chapterDetailBudget(quality);
  const trenchworks = new THREE.Group();
  trenchworks.name = 'EidolonTrenchworks';
  root.add(trenchworks);
  const conduits = new THREE.Group();
  conduits.name = 'OssuaryConduits';
  root.add(conduits);
  for (const side of [-1, 1]) {
    for (let segment = 0; segment < 6; segment += 1) {
      const conduit = mesh(
        new THREE.CylinderGeometry(0.48, 0.7, 9.2, quality === 'low' ? 10 : 16),
        segment % 2 === 0 ? materials.blackMetal : materials.tarnishedMetal,
      );
      conduit.rotation.x = Math.PI / 2;
      conduit.position.set(side * (11 + segment * 1.1), 0.75, -22 + segment * 8.5);
      conduits.add(conduit);
      const collar = mesh(
        new THREE.TorusGeometry(0.76, 0.11, 6, budget.radialSegments),
        materials.tarnishedMetal,
      );
      collar.rotation.y = Math.PI / 2;
      collar.position.copy(conduit.position);
      conduits.add(collar);
      const parapet = mesh(
        new THREE.BoxGeometry(2.2, 1.1 + (segment % 2) * 0.35, 7.6),
        segment % 2 === 0 ? materials.bioStoneDark : materials.blackMetal,
      );
      parapet.position.set(side * (16.8 + segment * 0.28), 0.58, -22 + segment * 8.5);
      parapet.rotation.y = side * 0.035 * segment;
      trenchworks.add(parapet);
    }
  }
  const gate = new THREE.Group();
  gate.name = 'EidolonCrownGate';
  gate.position.set(0, 0, -34);
  for (let horn = -3; horn <= 3; horn += 1) {
    if (horn === 0) continue;
    const height = 10 + (3 - Math.abs(horn)) * 3.5;
    const spike = mesh(new THREE.ConeGeometry(1.1, height, 9, 4), materials.chitin);
    spike.position.set(horn * 3.1, height / 2, 0);
    spike.rotation.z = horn * -0.07;
    gate.add(spike);
    if (horn < 3) {
      const chain = createPointedArch(
        3.1,
        4.2 + (3 - Math.abs(horn)) * 0.7,
        0.13,
        budget.archSegments,
        materials.tarnishedMetal,
      );
      chain.position.set(horn * 3.1 + 1.55, 4.8, 0.1);
      gate.add(chain);
    }
  }
  root.add(gate);

  for (let rib = -4; rib <= 4; rib += 1) {
    const arch = createPointedArch(
      28 + (rib % 2) * 2,
      13 + Math.abs(rib) * 0.35,
      0.34,
      budget.archSegments,
      rib % 2 === 0 ? materials.chitin : materials.blackMetal,
    );
    arch.position.set(0, 0, rib * 8.5);
    trenchworks.add(arch);
  }
  addCover(root, materials, obstacles, -15, 4, 8, 1.8, 2.5);
  addCover(root, materials, obstacles, 15, -4, 8, 1.8, 2.5);
}

function createRootChoir(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  obstacles: ArenaObstacle[],
): void {
  const budget = chapterDetailBudget(quality);
  const pilgrimage = new THREE.Group();
  pilgrimage.name = 'ChoirPilgrimage';
  for (let step = 0; step < 11; step += 1) {
    const angle = Math.sin(step * 0.83) * 0.32;
    const disc = mesh(
      new THREE.CylinderGeometry(
        3.5 - step * 0.08,
        3.8 - step * 0.08,
        0.48 + (step % 3) * 0.08,
        budget.radialSegments,
        2,
      ),
      step % 3 === 0 ? materials.hostileGlass : materials.bioStone,
    );
    disc.position.set(Math.sin(angle) * 10, 0.05 + step * 0.06, 24 - step * 5.3);
    disc.rotation.y = step * 0.37;
    pilgrimage.add(disc);
    const rim = mesh(
      new THREE.TorusGeometry(3.58 - step * 0.08, 0.11, 6, budget.radialSegments),
      step % 2 === 0 ? materials.tarnishedMetal : materials.hostileGlass,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.copy(disc.position).add(new THREE.Vector3(0, 0.3, 0));
    pilgrimage.add(rim);
    if (step % 2 === 1) {
      for (let fissure = 0; fissure < 2; fissure += 1) {
        const vein = mesh(
          new THREE.BoxGeometry(0.035, 0.022, 2.8 + fissure * 0.75),
          materials.tarnishedMetal,
        );
        vein.position
          .copy(disc.position)
          .add(new THREE.Vector3((fissure - 0.5) * 0.42, 0.34, fissure * 0.27));
        vein.rotation.y = fissure * 1.17 + step * 0.21;
        pilgrimage.add(vein);
      }
    }
  }
  root.add(pilgrimage);

  const canopy = new THREE.Group();
  canopy.name = 'ChoirNeuralCanopy';
  for (let rootIndex = 0; rootIndex < 12; rootIndex += 1) {
    const angle = (rootIndex / 12) * TAU;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(angle) * 42, 1, Math.sin(angle) * 42),
      new THREE.Vector3(
        Math.cos(angle + 0.4) * 30,
        11 + (rootIndex % 3) * 4,
        Math.sin(angle + 0.4) * 30,
      ),
      new THREE.Vector3(
        Math.cos(angle + 0.9) * 13,
        19 + (rootIndex % 4) * 3,
        Math.sin(angle + 0.9) * 13,
      ),
      new THREE.Vector3(0, 25 + (rootIndex % 3) * 2, -18),
    ]);
    const neuralRoot = mesh(
      new THREE.TubeGeometry(curve, quality === 'low' ? 24 : 48, 0.24 + (rootIndex % 4) * 0.06, 8),
      rootIndex % 3 === 0 ? materials.hostileGlass : materials.chitin,
    );
    canopy.add(neuralRoot);
    if (rootIndex % 2 === 0) {
      const branchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle + 0.18) * 38, 1.2, Math.sin(angle + 0.18) * 38),
        new THREE.Vector3(
          Math.cos(angle + 0.48) * 27,
          6 + (rootIndex % 3) * 2,
          Math.sin(angle + 0.48) * 27,
        ),
        new THREE.Vector3(
          Math.cos(angle + 0.72) * 19,
          10 + (rootIndex % 4) * 1.5,
          Math.sin(angle + 0.72) * 19,
        ),
      ]);
      canopy.add(
        mesh(
          new THREE.TubeGeometry(branchCurve, Math.max(16, budget.archSegments - 4), 0.16, 6),
          materials.hostileGlass,
        ),
      );
    }
  }
  root.add(canopy);
  const crown = mesh(new THREE.TorusKnotGeometry(5.5, 0.72, 96, 12, 2, 5), materials.vein);
  crown.name = 'ChoirCrown';
  crown.position.set(0, 22, -24);
  crown.rotation.x = Math.PI / 2;
  crown.userData.choirCrown = true;
  root.add(crown);

  const nave = new THREE.Group();
  nave.name = 'ChoirNave';
  for (let bay = -3; bay <= 3; bay += 1) {
    const x = bay * 10.2;
    const height = 16.5 + (3 - Math.abs(bay)) * 2.6;
    if (bay !== 0) {
      addSpiredPier(nave, materials, x, -35, height, budget.radialSegments);
    }
    if (bay < 3 && bay !== -1 && bay !== 0) {
      const arch = createPointedArch(
        10.2,
        10.5 + (3 - Math.abs(bay)) * 1.1,
        0.42,
        budget.archSegments,
        bay % 2 === 0 ? materials.chitin : materials.bioStoneDark,
      );
      arch.position.set(x + 5.1, 4.5, -35);
      nave.add(arch);
    }
    if (bay % 2 === 0) {
      const reliquary = mesh(
        new THREE.IcosahedronGeometry(1.1 + (bay === 0 ? 0.4 : 0), 1),
        materials.hostileGlass,
      );
      reliquary.position.set(x, height - 1.4, -34.8);
      nave.add(reliquary);
    }
  }
  root.add(nave);
  obstacles.push({ center: new THREE.Vector3(0, 0, -24), radius: 4.2 });
}

function createPointedArch(
  width: number,
  height: number,
  tubeRadius: number,
  segments: number,
  material: THREE.Material,
): THREE.Mesh {
  const halfWidth = width / 2;
  const path = new THREE.CurvePath<THREE.Vector3>();
  const apex = new THREE.Vector3(0, height, 0);
  path.add(
    new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-halfWidth, 0, 0),
      new THREE.Vector3(-halfWidth * 0.95, height * 0.7, 0),
      apex,
    ),
  );
  path.add(
    new THREE.QuadraticBezierCurve3(
      apex,
      new THREE.Vector3(halfWidth * 0.95, height * 0.7, 0),
      new THREE.Vector3(halfWidth, 0, 0),
    ),
  );
  return mesh(new THREE.TubeGeometry(path, segments, tubeRadius, 7, false), material);
}

function beamBetween(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  radialSegments: number,
): THREE.Mesh {
  const direction = end.clone().sub(start);
  const beam = mesh(
    new THREE.CylinderGeometry(radius * 0.88, radius, direction.length(), radialSegments, 1),
    material,
  );
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return beam;
}

function addSpiredPier(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  x: number,
  z: number,
  height: number,
  radialSegments: number,
): void {
  const base = mesh(new THREE.BoxGeometry(2.25, 0.8, 2.25), materials.bioStoneDark);
  base.position.set(x, 0.4, z);
  root.add(base);
  const shaft = mesh(
    new THREE.CylinderGeometry(0.72, 1.02, height - 2.1, radialSegments, 3),
    materials.bioStone,
  );
  shaft.position.set(x, (height - 2.1) / 2 + 0.8, z);
  root.add(shaft);
  for (let collarIndex = 0; collarIndex < 3; collarIndex += 1) {
    const collar = mesh(
      new THREE.TorusGeometry(0.92 - collarIndex * 0.08, 0.11, 6, radialSegments),
      collarIndex % 2 === 0 ? materials.tarnishedMetal : materials.blackMetal,
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.set(x, 3.2 + collarIndex * (height * 0.22), z);
    root.add(collar);
  }
  const spire = mesh(new THREE.ConeGeometry(0.82, 3.6, radialSegments), materials.chitin);
  spire.position.set(x, height + 0.75, z);
  root.add(spire);
}

function addCover(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  obstacles: ArenaObstacle[],
  x: number,
  z: number,
  width: number,
  height: number,
  depth: number,
): void {
  const cover = new THREE.Group();
  cover.name = 'ArmoredReliquaryCover';
  cover.position.set(x, 0, z);
  const shell = mesh(new THREE.BoxGeometry(width, height, depth), materials.blackMetal);
  shell.position.y = height / 2;
  cover.add(shell);
  const cap = mesh(
    new THREE.BoxGeometry(width * 1.035, 0.14, depth * 1.045),
    materials.tarnishedMetal,
  );
  cap.position.y = height + 0.03;
  cover.add(cap);
  const face = mesh(
    new THREE.BoxGeometry(width * 0.62, height * 0.48, 0.09),
    materials.bioStoneDark,
  );
  face.position.set(0, height * 0.51, depth / 2 + 0.05);
  cover.add(face);
  for (const side of [-1, 1]) {
    const rail = mesh(new THREE.BoxGeometry(0.16, height * 0.92, 0.18), materials.tarnishedMetal);
    rail.position.set(side * (width / 2 - 0.18), height * 0.5, depth / 2 + 0.08);
    cover.add(rail);
    const sidePlate = mesh(
      new THREE.BoxGeometry(0.08, height * 0.58, depth * 0.62),
      materials.bioStoneDark,
    );
    sidePlate.position.set(side * (width / 2 + 0.04), height * 0.48, 0);
    cover.add(sidePlate);
  }
  root.add(cover);
  obstacles.push({ center: new THREE.Vector3(x, 0, z), radius: Math.max(width, depth) * 0.52 });
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const result = new THREE.Mesh(geometry, material);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}
