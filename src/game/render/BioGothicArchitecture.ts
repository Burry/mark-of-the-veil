import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Quality } from '../types/GameTypes';
import { SeededRandom } from '../utils/SeededRandom';
import { TAU } from '../utils/math';
import type { ArenaMaterialLibrary } from './ArenaMaterials';

export interface ArchitectureObstacle {
  center: THREE.Vector3;
  radius: number;
}

interface DetailBudget {
  bayCount: number;
  archSegments: number;
  radialRibs: number;
  rubble: number;
  roots: number;
  chainLinks: number;
  coverGreebles: number;
}

const COVER_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [-9, -4],
  [10, 4],
  [-13, 16],
  [14, -18],
  [5, -21],
  [-22, 5],
  [23, 13],
];

export const STATIC_ARENA_BATCH_CELL_SIZE = 20;
const STATIC_ARENA_BATCH_MAX_HORIZONTAL_SPAN = STATIC_ARENA_BATCH_CELL_SIZE * 1.5;

interface StaticBatchCandidate {
  mesh: THREE.Mesh;
  transform: THREE.Matrix4;
  cellX: number;
  cellZ: number;
}

export function createBioGothicArchitecture(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  quality: Quality,
  random: SeededRandom,
  obstacles: ArchitectureObstacle[],
): void {
  const budget = detailBudget(quality);
  createPerimeter(root, materials, budget, random, obstacles);
  createReliquaryCover(root, materials, budget, random, obstacles);
  createCentralCrown(root, materials, budget);
  createNaveFloor(root, materials, budget, random);
  createRubbleField(root, materials, budget, random);
  createCreepingRoots(root, materials, budget, random);
  createHangingChains(root, materials, budget, random);
}

export function batchStaticArenaGeometry(root: THREE.Group, materials: ArenaMaterialLibrary): void {
  batchStaticArchitecture(root, materials);
}

function detailBudget(quality: Quality): DetailBudget {
  if (quality === 'high') {
    return {
      bayCount: 16,
      archSegments: 44,
      radialRibs: 8,
      rubble: 180,
      roots: 26,
      chainLinks: 96,
      coverGreebles: 9,
    };
  }
  if (quality === 'medium') {
    return {
      bayCount: 14,
      archSegments: 30,
      radialRibs: 6,
      rubble: 110,
      roots: 16,
      chainLinks: 64,
      coverGreebles: 6,
    };
  }
  return {
    bayCount: 12,
    archSegments: 20,
    radialRibs: 4,
    rubble: 52,
    roots: 8,
    chainLinks: 36,
    coverGreebles: 3,
  };
}

function createPerimeter(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  budget: DetailBudget,
  random: SeededRandom,
  obstacles: ArchitectureObstacle[],
): void {
  const radius = 43.2;
  const ambulatoryWall = new THREE.Mesh(
    new THREE.CylinderGeometry(45.2, 45.7, 12.4, budget.bayCount * 3, 3, true),
    materials.vaultWall,
  );
  ambulatoryWall.name = 'TexturedInnerAmbulatory';
  ambulatoryWall.position.y = 6.05;
  ambulatoryWall.receiveShadow = true;
  root.add(ambulatoryWall);
  const upperFrieze = new THREE.Mesh(
    new THREE.TorusGeometry(44.2, 0.72, 10, budget.bayCount * 6),
    materials.bioStone,
  );
  upperFrieze.rotation.x = Math.PI / 2;
  upperFrieze.position.y = 11.85;
  setShadow(upperFrieze);
  root.add(upperFrieze);

  const positions: THREE.Vector3[] = [];
  const heights: number[] = [];
  for (let index = 0; index < budget.bayCount; index += 1) {
    const angle = (index / budget.bayCount) * TAU;
    const height = 16 + random.range(-1.4, 4.8);
    const position = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    positions.push(position);
    heights.push(height);
    const pier = createCompoundPier(materials, height, index, budget, random);
    pier.position.copy(position);
    pier.rotation.y = -angle;
    root.add(pier);
    obstacles.push({ center: position.clone().setY(0), radius: 2.05 });
  }

  for (let index = 0; index < budget.bayCount; index += 1) {
    const next = (index + 1) % budget.bayCount;
    const start = positions[index].clone().setY(heights[index] * 0.75);
    const end = positions[next].clone().setY(heights[next] * 0.75);
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const apex = midpoint.clone().setY(Math.max(start.y, end.y) + 6.2 + (index % 3) * 0.55);
    apex.multiplyScalar(0.95).setY(Math.max(start.y, end.y) + 6.2 + (index % 3) * 0.55);
    const archCurve = pointedArchCurve(start, apex, end);
    const arch = new THREE.Mesh(
      new THREE.TubeGeometry(archCurve, budget.archSegments, 0.72, 10, false),
      materials.bioStone,
    );
    arch.castShadow = true;
    arch.receiveShadow = true;
    root.add(arch);

    if (budget.bayCount > 12 || index % 2 === 0) {
      const inset = new THREE.Mesh(
        new THREE.TubeGeometry(archCurve, budget.archSegments, 0.13, 6, false),
        materials.tarnishedMetal,
      );
      inset.castShadow = true;
      root.add(inset);
    }

    if (index % 2 === 0) {
      for (let tooth = 1; tooth <= 5; tooth += 1) {
        const point = archCurve.getPointAt(tooth / 6);
        const pendant = new THREE.Mesh(
          new THREE.ConeGeometry(0.14 + (tooth % 2) * 0.05, 0.9 + (tooth % 3) * 0.26, 7),
          tooth === 3 ? materials.hostileGlass : materials.chitin,
        );
        pendant.position.copy(point).add(new THREE.Vector3(0, -0.62, 0));
        pendant.rotation.z = Math.PI;
        setShadow(pendant);
        root.add(pendant);
      }
    }

    createWallBay(root, materials, positions[index], positions[next], index, budget);
    if (index % Math.max(2, Math.round(budget.bayCount / budget.radialRibs)) === 0) {
      createCeilingRib(root, materials, midpoint, apex.y, budget);
    }
  }

  createRosePortal(root, materials, budget);
}

function createCompoundPier(
  materials: ArenaMaterialLibrary,
  height: number,
  variant: number,
  budget: DetailBudget,
  random: SeededRandom,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `WeatheredNavePier-${variant + 1}`;
  const core = new THREE.Mesh(createErodedPierGeometry(height, variant), materials.bioStone);
  core.position.y = height / 2;
  setShadow(core);
  group.add(core);

  const baseProfiles: ReadonlyArray<readonly [number, number, number]> = [
    [2.42, 0.5, 0.25],
    [2.12, 0.42, 0.7],
    [1.82, 0.34, 1.08],
  ];
  baseProfiles.forEach(([radius, thickness, y], index) => {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.04, thickness, 16, 1),
      index === 1 ? materials.tarnishedMetal : materials.bioStoneDark,
    );
    base.position.y = y;
    setShadow(base);
    group.add(base);
  });

  const ribCount = budget.bayCount >= 14 ? 6 : 4;
  for (let rib = 0; rib < ribCount; rib += 1) {
    const angle = (rib / ribCount) * TAU;
    const ribHeight = height * (0.78 + (rib % 2) * 0.08);
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.29, ribHeight, 7, 6),
      rib % 2 === 0 ? materials.tarnishedMetal : materials.chitin,
    );
    spine.position.set(Math.cos(angle) * 1.45, ribHeight / 2 + 0.56, Math.sin(angle) * 1.45);
    spine.rotation.z = Math.cos(angle) * 0.025;
    spine.rotation.x = -Math.sin(angle) * 0.025;
    setShadow(spine);
    group.add(spine);
  }

  for (let collar = 0; collar < 4; collar += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.55 + collar * 0.045, 0.12 + (collar % 2) * 0.055, 7, 26),
      collar % 2 === 0 ? materials.blackMetal : materials.tarnishedMetal,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2.4 + collar * (height * 0.19);
    setShadow(ring);
    group.add(ring);
  }

  for (let buttress = 0; buttress < 4; buttress += 1) {
    const angle = (buttress / 4) * TAU + Math.PI / 4;
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 4.8, 1.38, 2, 5, 2),
      buttress % 2 === 0 ? materials.bioStoneDark : materials.chitin,
    );
    foot.position.set(Math.cos(angle) * 1.85, 2.18, Math.sin(angle) * 1.85);
    foot.rotation.y = -angle;
    foot.rotation.z = Math.cos(angle) * -0.2;
    foot.rotation.x = Math.sin(angle) * 0.2;
    setShadow(foot);
    group.add(foot);
  }

  const capital = new THREE.Mesh(
    new THREE.CylinderGeometry(2.62, 1.52, 1.05, 12, 2),
    materials.bioStone,
  );
  capital.position.y = height - 0.25;
  setShadow(capital);
  group.add(capital);
  const capitalRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.15, 0.2, 7, 26),
    materials.tarnishedMetal,
  );
  capitalRing.rotation.x = Math.PI / 2;
  capitalRing.position.y = height - 0.76;
  setShadow(capitalRing);
  group.add(capitalRing);

  for (let horn = 0; horn < 4; horn += 1) {
    const angle = (horn / 4) * TAU + Math.PI / 4;
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 2.1 + (horn % 2) * 0.4, 7, 4),
      materials.chitin,
    );
    spike.position.set(Math.cos(angle) * 1.95, height + 0.58, Math.sin(angle) * 1.95);
    spike.rotation.z = Math.cos(angle) * -0.42;
    spike.rotation.x = Math.sin(angle) * 0.42;
    spike.rotation.y = random.range(-0.15, 0.15);
    setShadow(spike);
    group.add(spike);
  }

  const wound = new THREE.Mesh(new THREE.PlaneGeometry(0.12, height * 0.38, 1, 12), materials.vein);
  wound.position.set(0, height * 0.5, 1.615);
  wound.rotation.z = ((variant % 3) - 1) * 0.08;
  group.add(wound);
  return group;
}

function createErodedPierGeometry(height: number, variant: number): THREE.CylinderGeometry {
  const geometry = new THREE.CylinderGeometry(1.38, 1.82, height, 16, 9, false);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const radial = Math.hypot(x, z);
    if (radial < 0.2) continue;
    const erosion =
      Math.sin(x * 7.1 + y * 2.3 + variant) * 0.025 +
      Math.sin(z * 11.7 - y * 1.6) * 0.018 +
      (Math.sin(y * 8.8 + variant * 2.1) > 0.82 ? -0.045 : 0);
    positions.setXYZ(index, x * (1 + erosion), y, z * (1 + erosion));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createWallBay(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  start: THREE.Vector3,
  end: THREE.Vector3,
  index: number,
  budget: DetailBudget,
): void {
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const width = start.distanceTo(end) * 0.86;
  const radialAngle = Math.atan2(midpoint.z, midpoint.x);
  const lowerShape = brokenWallShape(width, 6.2 + (index % 3) * 0.6, index);
  const wall = new THREE.Mesh(
    new THREE.ExtrudeGeometry(lowerShape, {
      depth: 0.72,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.16,
      bevelThickness: 0.18,
      curveSegments: 2,
    }),
    materials.bioStoneDark,
  );
  wall.geometry.translate(0, 0, -0.36);
  wall.position.copy(midpoint).setY(0.1);
  wall.rotation.y = -Math.PI / 2 - radialAngle;
  setShadow(wall);
  root.add(wall);

  if (index % 3 !== 1 || budget.bayCount <= 12) return;
  const windowShape = pointedWindowShape(width * 0.47, 7.6);
  const membrane = new THREE.Mesh(new THREE.ShapeGeometry(windowShape, 18), materials.hostileGlass);
  membrane.position.copy(midpoint).multiplyScalar(1.015).setY(6.35);
  membrane.rotation.y = -Math.PI / 2 - radialAngle;
  root.add(membrane);

  const windowRotation = -Math.PI / 2 - radialAngle;
  const horizontal = new THREE.Vector3(Math.cos(windowRotation), 0, -Math.sin(windowRotation));
  for (let rib = -2; rib <= 2; rib += 1) {
    const ribHeight = 4.8 + (2 - Math.abs(rib)) * 0.72;
    const tracery = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.11, ribHeight, 7),
      rib === 0 ? materials.tarnishedMetal : materials.blackMetal,
    );
    tracery.position
      .copy(membrane.position)
      .addScaledVector(horizontal, rib * width * 0.092)
      .add(new THREE.Vector3(0, ribHeight * 0.5 + 0.28, 0));
    tracery.position.addScaledVector(midpoint.clone().setY(0).normalize(), -0.08);
    setShadow(tracery);
    root.add(tracery);
  }

  const windowFrame = new THREE.Mesh(
    new THREE.TorusGeometry(width * 0.245, 0.18, 7, 28, Math.PI),
    materials.tarnishedMetal,
  );
  windowFrame.position.copy(membrane.position).setY(10.05);
  windowFrame.rotation.set(0, -Math.PI / 2 - radialAngle, Math.PI);
  windowFrame.scale.y = 1.45;
  setShadow(windowFrame);
  root.add(windowFrame);
}

function createCeilingRib(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  perimeterPoint: THREE.Vector3,
  perimeterHeight: number,
  budget: DetailBudget,
): void {
  const direction = perimeterPoint.clone().setY(0).normalize();
  const start = perimeterPoint.clone().setY(perimeterHeight - 0.5);
  const end = direction.multiplyScalar(7.4).setY(27.5);
  const control = start.clone().lerp(end, 0.52).setY(31.5);
  const curve = new THREE.QuadraticBezierCurve3(start, control, end);
  const rib = new THREE.Mesh(
    new THREE.TubeGeometry(curve, budget.archSegments, 0.32, 7, false),
    materials.blackMetal,
  );
  setShadow(rib);
  root.add(rib);
  const bone = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(12, budget.archSegments - 8), 0.09, 5, false),
    materials.tarnishedMetal,
  );
  root.add(bone);
}

function createRosePortal(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  budget: DetailBudget,
): void {
  const portal = new THREE.Group();
  portal.name = 'HiveRosePortal';
  portal.position.set(0, 15.7, -42.25);
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(6.4, 0.72, 10, budget.archSegments * 2),
    materials.bioStone,
  );
  setShadow(outer);
  portal.add(outer);
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(4.9, 0.22, 7, budget.archSegments),
    materials.tarnishedMetal,
  );
  setShadow(inner);
  portal.add(inner);
  const iris = new THREE.Mesh(
    new THREE.CircleGeometry(4.72, budget.archSegments),
    new THREE.MeshPhysicalMaterial({
      color: 0x0d1119,
      emissive: 0x07192a,
      emissiveIntensity: 1.6,
      roughness: 0.24,
      metalness: 0.74,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      transparent: true,
      opacity: 0.88,
    }),
  );
  iris.position.z = 0.12;
  portal.add(iris);
  const spokeGeometry = new THREE.CylinderGeometry(0.105, 0.17, 4.65, 7);
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * TAU;
    const spoke = new THREE.Mesh(
      spokeGeometry,
      index % 2 ? materials.chitin : materials.blackMetal,
    );
    spoke.position.set(Math.cos(angle) * 2.28, Math.sin(angle) * 2.28, 0.22);
    spoke.rotation.z = angle - Math.PI / 2;
    setShadow(spoke);
    portal.add(spoke);
  }
  const pupil = new THREE.Mesh(new THREE.OctahedronGeometry(1.22, 2), materials.hostileGlass);
  pupil.scale.y = 2.1;
  pupil.position.z = 0.55;
  portal.add(pupil);
  root.add(portal);
}

function createReliquaryCover(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  budget: DetailBudget,
  random: SeededRandom,
  obstacles: ArchitectureObstacle[],
): void {
  COVER_POSITIONS.forEach(([x, z], index) => {
    const height = random.range(2.8, 4.7);
    const depth = random.range(4.3, 7.1);
    const rotation = random.range(-Math.PI, Math.PI);
    const group = new THREE.Group();
    group.name = `ShatteredReliquary-${index + 1}`;
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const shell = new THREE.Mesh(createRuinGeometry(3, height, depth, index), materials.bioStone);
    shell.position.y = height / 2;
    setShadow(shell);
    group.add(shell);

    const carapace = new THREE.Mesh(
      new THREE.SphereGeometry(1, 26, 12, 0, TAU, 0, Math.PI / 2),
      index % 2 === 0 ? materials.bioStoneDark : materials.chitin,
    );
    carapace.name = `ReliquaryCarapace-${index + 1}`;
    carapace.scale.set(1.72, height * 0.66, depth * 0.47);
    carapace.position.y = height * 0.42;
    carapace.rotation.y = index % 2 ? 0.035 : -0.035;
    setShadow(carapace);
    group.add(carapace);

    for (let rib = -2; rib <= 2; rib += 1) {
      const z = (rib / 2.35) * depth * 0.42;
      const ribCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-1.7, height * 0.5, z),
        new THREE.Vector3(0, height * 1.13 - Math.abs(rib) * 0.08, z),
        new THREE.Vector3(1.7, height * 0.5, z),
      );
      const carapaceRib = new THREE.Mesh(
        new THREE.TubeGeometry(ribCurve, 18, 0.13 + (rib === 0 ? 0.055 : 0), 7, false),
        rib % 2 === 0 ? materials.chitin : materials.blackMetal,
      );
      setShadow(carapaceRib);
      group.add(carapaceRib);
    }

    for (const side of [-1, 1]) {
      const shoulderHorn = new THREE.Mesh(
        new THREE.ConeGeometry(0.33, 2.65, 8, 4),
        side === 1 ? materials.chitin : materials.bioStone,
      );
      shoulderHorn.position.set(side * 1.75, height + 0.55, -depth * 0.18);
      shoulderHorn.rotation.z = side * -0.68;
      shoulderHorn.rotation.x = (index % 2 ? 1 : -1) * 0.12;
      setShadow(shoulderHorn);
      group.add(shoulderHorn);
    }

    for (let band = 0; band < 3; band += 1) {
      const x = (band - 1) * 0.72;
      const longitudinalCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, height * 0.48, -depth * 0.48),
        new THREE.Vector3(x, height * (0.96 - Math.abs(x) * 0.075), 0),
        new THREE.Vector3(x, height * 0.48, depth * 0.48),
      ]);
      const brace = new THREE.Mesh(
        new THREE.TubeGeometry(longitudinalCurve, 24, 0.11 + band * 0.018, 7, false),
        band === 1 ? materials.blackMetal : materials.tarnishedMetal,
      );
      setShadow(brace);
      group.add(brace);
    }

    const panelCount = budget.coverGreebles;
    for (let detail = 0; detail < panelCount; detail += 1) {
      const side = detail % 2 === 0 ? 1 : -1;
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.36 + (detail % 3) * 0.09, 0.08, 0.7 + (detail % 4) * 0.21),
        detail % 3 === 0 ? materials.chitin : materials.blackMetal,
      );
      panel.position.set(
        side * (1.52 + (detail % 3) * 0.015),
        0.62 + (detail % 4) * 0.72,
        -depth * 0.35 + ((detail * 1.37) % (depth * 0.7)),
      );
      panel.rotation.z = Math.PI / 2;
      setShadow(panel);
      group.add(panel);

      const bolt = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 8, 6),
        detail % 2 === 0 ? materials.tarnishedMetal : materials.hostileGlass,
      );
      bolt.position.copy(panel.position);
      bolt.position.x += side * 0.07;
      group.add(bolt);
    }

    for (let shard = 0; shard < 5; shard += 1) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.19 + (shard % 2) * 0.09, 1.5 + shard * 0.22, 7, 3),
        shard % 2 ? materials.chitin : materials.hostileGlass,
      );
      spike.position.set(
        (shard - 2) * 0.55,
        height * 0.57 + shard * 0.1,
        (index % 2 ? 1 : -1) * depth * 0.54,
      );
      spike.rotation.z = (shard - 2) * 0.11;
      setShadow(spike);
      group.add(spike);
    }

    const soot = new THREE.Mesh(new THREE.CircleGeometry(2, 28), materials.soot);
    soot.scale.set(1.18, depth / 4.4, 1);
    soot.rotation.x = -Math.PI / 2;
    soot.position.set(0.1, 0.028, 0);
    group.add(soot);

    root.add(group);
    obstacles.push({ center: new THREE.Vector3(x, 0, z), radius: 2.4 });
  });
}

function createRuinGeometry(
  width: number,
  height: number,
  depth: number,
  variant: number,
): THREE.ExtrudeGeometry {
  const direction = variant % 2 === 0 ? 1 : -1;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height * (0.15 + (variant % 3) * 0.06));
  shape.lineTo(direction * width * 0.24, height / 2);
  shape.lineTo(-direction * width * 0.04, height * 0.36);
  shape.lineTo(-direction * width * 0.28, height * 0.46);
  shape.lineTo(-width / 2, height * 0.23);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.16,
    bevelThickness: 0.14,
    curveSegments: 2,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createCentralCrown(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  budget: DetailBudget,
): void {
  const crown = new THREE.Group();
  crown.name = 'ChoirOfTheHollowRegent';
  const stepProfiles: ReadonlyArray<readonly [number, number, number]> = [
    [6.5, 0.28, 0.12],
    [5.95, 0.27, 0.36],
    [5.45, 0.24, 0.59],
  ];
  stepProfiles.forEach(([radius, height, y], index) => {
    const step = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius + 0.18, height, budget.archSegments),
      index === 1 ? materials.floorEdge : materials.bioStoneDark,
    );
    step.position.y = y;
    setShadow(step);
    crown.add(step);
  });

  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * TAU;
    const height = 2.4 + (index % 4) * 0.48;
    const radial = 5.1 + (index % 2) * 0.28;
    const needle = new THREE.Mesh(
      new THREE.ConeGeometry(0.16 + (index % 3) * 0.04, height, 7, 4),
      index % 3 === 0 ? materials.hostileGlass : materials.chitin,
    );
    needle.position.set(Math.cos(angle) * radial, height * 0.47 + 0.72, Math.sin(angle) * radial);
    needle.rotation.z = Math.cos(angle) * 0.28;
    needle.rotation.x = -Math.sin(angle) * 0.28;
    setShadow(needle);
    crown.add(needle);
  }

  for (const radius of [2.15, 3.42, 4.55]) {
    const inlay = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.075, 6, budget.archSegments * 2),
      radius === 3.42 ? materials.vein : materials.tarnishedMetal,
    );
    inlay.rotation.x = Math.PI / 2;
    inlay.position.y = 0.74;
    crown.add(inlay);
  }

  const altar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.42, 2.7, 9, 4),
    materials.bioStone,
  );
  altar.position.y = 1.9;
  setShadow(altar);
  crown.add(altar);
  const altarCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.56, 2), materials.hostileGlass);
  altarCore.position.y = 3.62;
  altarCore.scale.y = 1.8;
  crown.add(altarCore);
  root.add(crown);
}

function createNaveFloor(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  budget: DetailBudget,
  random: SeededRandom,
): void {
  const slabCount = budget.bayCount + 10;
  for (let index = 0; index < slabCount; index += 1) {
    const z = 34 - index * (64 / Math.max(1, slabCount - 1));
    const width = 4.5 + random.range(-0.35, 0.5);
    const depth = 2.2 + random.range(-0.2, 0.34);
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.09 + (index % 3) * 0.018, depth, 2, 1, 2),
      index % 5 === 0 ? materials.bioStoneDark : materials.floorEdge,
    );
    slab.position.set(random.range(-0.16, 0.16), 0.055, z);
    slab.rotation.y = random.range(-0.018, 0.018);
    slab.receiveShadow = true;
    root.add(slab);

    if (index % 2 === 0) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.035, depth * 0.94),
        index % 4 === 0 ? materials.vein : materials.tarnishedMetal,
      );
      rail.position.set(width * 0.39, 0.12, z);
      rail.rotation.y = slab.rotation.y;
      root.add(rail);
    }
  }

  for (let index = 0; index < 17; index += 1) {
    const puddle = new THREE.Mesh(
      irregularPoolGeometry(1.4 + (index % 4) * 0.45, 16, index),
      index % 3 === 0 ? materials.blood : materials.water,
    );
    const angle = ((index * 2.39) % TAU) + 0.3;
    const radius = 7 + ((index * 7.7) % 31);
    puddle.position.set(Math.cos(angle) * radius, 0.125, Math.sin(angle) * radius);
    puddle.rotation.x = -Math.PI / 2;
    puddle.rotation.z = angle * 0.7;
    puddle.scale.y = 0.42 + (index % 4) * 0.09;
    root.add(puddle);
  }

  const transept = new THREE.Mesh(
    new THREE.TorusGeometry(18.5, 0.075, 6, budget.archSegments * 3, Math.PI * 1.72),
    materials.tarnishedMetal,
  );
  transept.rotation.x = Math.PI / 2;
  transept.rotation.z = -Math.PI * 0.38;
  transept.position.y = 0.135;
  root.add(transept);
}

function createRubbleField(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  budget: DetailBudget,
  random: SeededRandom,
): void {
  const geometry = new THREE.DodecahedronGeometry(0.52, 1);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < positions.count; index += 1) {
    const scale = 0.76 + ((index * 37) % 13) / 25;
    positions.setXYZ(
      index,
      positions.getX(index) * scale,
      positions.getY(index) * (0.65 + ((index * 11) % 7) / 18),
      positions.getZ(index) * (0.82 + ((index * 17) % 9) / 24),
    );
  }
  geometry.computeVertexNormals();
  const rubbleMaterial = materials.floorEdge.clone();
  rubbleMaterial.vertexColors = true;
  const rubble = new THREE.InstancedMesh(geometry, rubbleMaterial, budget.rubble);
  rubble.name = 'InstancedCathedralRubble';
  rubble.castShadow = true;
  rubble.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const euler = new THREE.Euler();
  for (let index = 0; index < budget.rubble; index += 1) {
    const edgeScatter = index % 4 !== 0;
    const radius = edgeScatter ? random.range(32, 45) : random.range(8, 34);
    const angle = random.range(0, TAU);
    position.set(Math.cos(angle) * radius, random.range(0.12, 0.34), Math.sin(angle) * radius);
    euler.set(random.range(-0.5, 0.5), random.range(0, TAU), random.range(-0.5, 0.5));
    quaternion.setFromEuler(euler);
    const size = random.range(0.22, edgeScatter ? 1.1 : 0.58);
    scale.set(
      size * random.range(0.65, 1.3),
      size * random.range(0.45, 1),
      size * random.range(0.7, 1.45),
    );
    matrix.compose(position, quaternion, scale);
    rubble.setMatrixAt(index, matrix);
    rubble.setColorAt(
      index,
      new THREE.Color().setHSL(0.68 + random.range(-0.035, 0.025), 0.08, random.range(0.08, 0.2)),
    );
  }
  rubble.instanceMatrix.needsUpdate = true;
  if (rubble.instanceColor) rubble.instanceColor.needsUpdate = true;
  root.add(rubble);
}

function createCreepingRoots(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  budget: DetailBudget,
  random: SeededRandom,
): void {
  for (let index = 0; index < budget.roots; index += 1) {
    const startAngle = random.range(0, TAU);
    const startRadius = random.range(31, 43);
    const length = random.range(5, 13);
    const inward = new THREE.Vector3(-Math.cos(startAngle), 0, -Math.sin(startAngle));
    const tangent = new THREE.Vector3(-Math.sin(startAngle), 0, Math.cos(startAngle));
    const start = new THREE.Vector3(
      Math.cos(startAngle) * startRadius,
      0.16,
      Math.sin(startAngle) * startRadius,
    );
    const points = [start];
    for (let segment = 1; segment <= 4; segment += 1) {
      points.push(
        start
          .clone()
          .addScaledVector(inward, (length * segment) / 4)
          .addScaledVector(tangent, Math.sin(segment * 2.4 + index) * random.range(0.25, 1.15))
          .setY(0.12 + Math.sin(segment * 1.8 + index) * 0.1),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const rootMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, random.range(0.07, 0.2), 6, false),
      index % 5 === 0 ? materials.vein : materials.chitin,
    );
    rootMesh.castShadow = true;
    root.add(rootMesh);
  }
}

function createHangingChains(
  root: THREE.Group,
  materials: ArenaMaterialLibrary,
  budget: DetailBudget,
  random: SeededRandom,
): void {
  const chainRuns = budget.bayCount >= 14 ? 4 : 2;
  const linksPerRun = Math.floor(budget.chainLinks / chainRuns);
  const totalLinks = chainRuns * linksPerRun;
  const geometry = new THREE.TorusGeometry(0.27, 0.055, 5, 10);
  const chains = new THREE.InstancedMesh(geometry, materials.blackMetal, totalLinks);
  chains.name = 'HangingReliquaryChains';
  chains.castShadow = true;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1.28, 1);
  let instance = 0;
  for (let run = 0; run < chainRuns; run += 1) {
    const z = -26 + run * (52 / Math.max(1, chainRuns - 1));
    const startX = run % 2 === 0 ? -39 : -34;
    const endX = run % 2 === 0 ? -14 : 15;
    const startY = 17 + random.range(-1, 2);
    const endY = 13 + random.range(-1, 3);
    for (let link = 0; link < linksPerRun; link += 1) {
      const t = link / Math.max(1, linksPerRun - 1);
      const sag = Math.sin(t * Math.PI) * 6.5;
      const position = new THREE.Vector3(
        THREE.MathUtils.lerp(startX, endX, t),
        THREE.MathUtils.lerp(startY, endY, t) - sag,
        z + Math.sin(t * Math.PI * 2) * 0.45,
      );
      quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, link % 2 === 0 ? 0 : Math.PI / 2, 0));
      matrix.compose(position, quaternion, scale);
      chains.setMatrixAt(instance, matrix);
      instance += 1;
    }
  }
  chains.instanceMatrix.needsUpdate = true;
  root.add(chains);
}

function pointedArchCurve(
  start: THREE.Vector3,
  apex: THREE.Vector3,
  end: THREE.Vector3,
): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const leftControl = start
    .clone()
    .lerp(apex, 0.48)
    .add(apex.clone().sub(end).multiplyScalar(0.14));
  const rightControl = end
    .clone()
    .lerp(apex, 0.48)
    .add(apex.clone().sub(start).multiplyScalar(0.14));
  path.add(new THREE.QuadraticBezierCurve3(start, leftControl, apex));
  path.add(new THREE.QuadraticBezierCurve3(apex, rightControl, end));
  return path;
}

function brokenWallShape(width: number, height: number, variant: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, height * (0.7 + (variant % 2) * 0.1));
  shape.lineTo(width * 0.29, height * (0.82 + (variant % 3) * 0.04));
  shape.lineTo(width * 0.08, height * (0.68 + (variant % 2) * 0.09));
  shape.lineTo(-width * 0.12, height);
  shape.lineTo(-width * 0.31, height * (0.72 + (variant % 3) * 0.05));
  shape.lineTo(-width / 2, height * 0.78);
  shape.closePath();
  return shape;
}

function pointedWindowShape(width: number, height: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, height * 0.58);
  shape.quadraticCurveTo(width * 0.4, height * 0.82, 0, height);
  shape.quadraticCurveTo(-width * 0.4, height * 0.82, -width / 2, height * 0.58);
  shape.closePath();
  return shape;
}

function irregularPoolGeometry(
  radius: number,
  segments: number,
  seed: number,
): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * TAU;
    const ripple = 0.78 + Math.sin(angle * 3 + seed) * 0.11 + Math.sin(angle * 7 - seed) * 0.07;
    const x = Math.cos(angle) * radius * ripple;
    const y = Math.sin(angle) * radius * ripple;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 12);
}

function setShadow(mesh: THREE.Mesh): void {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function batchStaticArchitecture(root: THREE.Group, materials: ArenaMaterialLibrary): void {
  root.updateMatrixWorld(true);
  const rootInverse = root.matrixWorld.clone().invert();
  const opaqueMaterials: THREE.Material[] = [
    materials.floor,
    materials.floorEdge,
    materials.bioStone,
    materials.bioStoneDark,
    materials.vaultWall,
    materials.chitin,
    materials.tarnishedMetal,
    materials.blackMetal,
    materials.vein,
    materials.blood,
    materials.water,
    materials.hostileGlass,
    materials.soot,
  ];

  opaqueMaterials.forEach((material) => {
    const cells = new Map<string, StaticBatchCandidate[]>();
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh) return;
      if (object.material !== material) return;
      if (belongsToAnimatedScenery(object, root)) return;
      const candidate = createStaticBatchCandidate(object, rootInverse);
      if (!candidate) return;
      const cellKey = `${candidate.cellX}:${candidate.cellZ}`;
      const cell = cells.get(cellKey);
      if (cell) cell.push(candidate);
      else cells.set(cellKey, [candidate]);
    });

    cells.forEach((candidates) => {
      if (candidates.length < 2) return;
      const geometries = candidates.map(({ mesh, transform }) => {
        const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        geometry.applyMatrix4(transform);
        return geometry;
      });
      const mergedGeometry = mergeGeometries(geometries, false);
      geometries.forEach((geometry) => geometry.dispose());
      if (!mergedGeometry) return;

      candidates.forEach(({ mesh }) => {
        mesh.removeFromParent();
        mesh.geometry.dispose();
      });
      mergedGeometry.computeBoundingBox();
      mergedGeometry.computeBoundingSphere();
      const [{ cellX, cellZ }] = candidates;
      const batch = new THREE.Mesh(mergedGeometry, material);
      batch.name = `StaticArchitectureBatch-${material.uuid.slice(0, 8)}-${cellX}-${cellZ}`;
      batch.castShadow =
        material !== materials.floor &&
        material !== materials.blood &&
        material !== materials.water &&
        material !== materials.soot;
      batch.receiveShadow = true;
      batch.frustumCulled = true;
      batch.userData.staticBatchCell = {
        x: cellX,
        z: cellZ,
        size: STATIC_ARENA_BATCH_CELL_SIZE,
      };
      batch.userData.staticBatchSourceCount = candidates.length;
      root.add(batch);
    });
  });
}

function createStaticBatchCandidate(
  mesh: THREE.Mesh,
  rootInverse: THREE.Matrix4,
): StaticBatchCandidate | null {
  const transform = rootInverse.clone().multiply(mesh.matrixWorld);
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const sourceBounds = mesh.geometry.boundingBox;
  if (!sourceBounds) return null;

  const localBounds = sourceBounds.clone().applyMatrix4(transform);
  const size = localBounds.getSize(new THREE.Vector3());
  if (
    size.x > STATIC_ARENA_BATCH_MAX_HORIZONTAL_SPAN ||
    size.z > STATIC_ARENA_BATCH_MAX_HORIZONTAL_SPAN
  ) {
    return null;
  }

  const center = localBounds.getCenter(new THREE.Vector3());
  if (![center.x, center.y, center.z].every(Number.isFinite)) return null;
  return {
    mesh,
    transform,
    cellX: Math.floor((center.x + STATIC_ARENA_BATCH_CELL_SIZE / 2) / STATIC_ARENA_BATCH_CELL_SIZE),
    cellZ: Math.floor((center.z + STATIC_ARENA_BATCH_CELL_SIZE / 2) / STATIC_ARENA_BATCH_CELL_SIZE),
  };
}

function belongsToAnimatedScenery(object: THREE.Object3D, root: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current && current !== root) {
    if (
      typeof current.userData.orbitSpeed === 'number' ||
      typeof current.userData.memoryRing === 'number' ||
      typeof current.userData.memoryShard === 'number' ||
      current.userData.choirCrown === true ||
      current.userData.preserveFromStaticBatch === true
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}
