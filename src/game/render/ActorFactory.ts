import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { EnemyKind, EnemyRig } from '../systems/WorldTypes';
import { TAU } from '../utils/math';
import {
  createHiveMaterials,
  createMarkMaterials,
  createWeaponMaterials,
  type HiveMaterials,
  type MarkMaterials,
  type WeaponMaterials,
} from './CharacterMaterials';

export interface MarkRig {
  root: THREE.Group;
  torso: THREE.Object3D;
  head: THREE.Object3D;
  arms: THREE.Object3D[];
  legs: THREE.Object3D[];
  mane: THREE.Object3D[];
  weapon: THREE.Group;
  muzzle: THREE.Object3D;
  horn: THREE.Mesh;
}

export interface SealRig {
  root: THREE.Group;
  core: THREE.Mesh;
  rings: THREE.Mesh[];
  beam: THREE.Mesh;
  light: THREE.PointLight;
}

export interface ExtractionRig {
  root: THREE.Group;
  beam: THREE.Mesh;
  ship: THREE.Group;
  light: THREE.PointLight;
}

export function createMark(): MarkRig {
  const root = new THREE.Group();
  root.name = 'Mark';
  root.add(createContactShadow());
  const materials = createMarkMaterials();
  const weaponMaterials = createWeaponMaterials();

  const pelvis = makeMesh(new THREE.SphereGeometry(0.58, 32, 22), materials.darkFur);
  pelvis.scale.set(1.08, 0.82, 0.82);
  pelvis.position.set(0, 1.4, 0.02);
  root.add(pelvis);
  const pelvisGuard = createFurTuftShell(
    materials.guardFur,
    74,
    new THREE.Vector3(0.62, 0.47, 0.49),
    41,
    'Mark guard coat | pelvis',
  );
  pelvisGuard.position.set(0, 1.4, 0.02);
  root.add(pelvisGuard);
  const abdomen = makeMesh(new THREE.CapsuleGeometry(0.5, 0.55, 10, 24), materials.fur);
  abdomen.position.set(0, 1.85, -0.02);
  abdomen.scale.set(1.08, 1, 0.78);
  root.add(abdomen);
  const abdomenGuard = createFurTuftShell(
    materials.guardFur,
    58,
    new THREE.Vector3(0.55, 0.62, 0.42),
    67,
    'Mark guard coat | abdomen',
  );
  abdomenGuard.position.set(0, 1.85, -0.02);
  root.add(abdomenGuard);

  const torso = new THREE.Group();
  torso.position.y = 2.4;
  const chest = makeMesh(new THREE.CapsuleGeometry(0.62, 0.8, 12, 28), materials.shortFur);
  chest.scale.set(1.2, 1, 0.76);
  torso.add(chest);
  for (const side of [-1, 1]) {
    const lat = makeMesh(new THREE.SphereGeometry(0.36, 24, 16), materials.fur);
    lat.position.set(side * 0.52, -0.08, 0.02);
    lat.scale.set(0.82, 1.2, 0.84);
    torso.add(lat);
  }
  addMarkArmor(torso, materials);
  torso.add(
    createFurTuftShell(
      materials.guardFur,
      108,
      new THREE.Vector3(0.69, 0.83, 0.53),
      97,
      'Mark guard coat | torso',
    ),
  );
  root.add(torso);

  const neck = makeMesh(new THREE.CapsuleGeometry(0.32, 0.48, 10, 20), materials.darkFur);
  neck.position.set(0, 3.04, 0.03);
  neck.rotation.x = -0.18;
  root.add(neck);
  const neckGuard = createFurTuftShell(
    materials.guardFur,
    38,
    new THREE.Vector3(0.34, 0.42, 0.31),
    113,
    'Mark guard coat | neck',
    0.045,
  );
  neckGuard.position.set(0, 3.04, 0.03);
  root.add(neckGuard);

  const head = new THREE.Group();
  head.position.set(0, 3.42, -0.22);
  const skull = makeMesh(new THREE.SphereGeometry(0.43, 32, 22), materials.shortFur);
  skull.scale.set(0.86, 1.08, 0.94);
  head.add(skull);
  const cheekLeft = makeMesh(new THREE.SphereGeometry(0.22, 20, 14), materials.fur);
  cheekLeft.position.set(-0.24, -0.08, -0.26);
  cheekLeft.scale.set(0.72, 0.9, 1.15);
  head.add(cheekLeft);
  const cheekRight = cheekLeft.clone();
  cheekRight.position.x = 0.24;
  head.add(cheekRight);
  const muzzle = makeMesh(new THREE.CapsuleGeometry(0.255, 0.62, 8, 22), materials.fur);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, -0.15, -0.58);
  muzzle.scale.set(0.92, 1, 0.74);
  head.add(muzzle);
  const nose = makeMesh(new THREE.SphereGeometry(0.24, 24, 16), materials.skin);
  nose.scale.set(0.9, 0.6, 0.43);
  nose.position.set(0, -0.16, -0.91);
  head.add(nose);
  for (const side of [-1, 1]) {
    const nostril = makeMesh(new THREE.SphereGeometry(0.037, 10, 7), materials.cloth);
    nostril.scale.set(1.2, 0.55, 0.45);
    nostril.position.set(side * 0.12, -0.1, -1.01);
    head.add(nostril);
    const eye = makeMesh(new THREE.SphereGeometry(0.062, 16, 12), materials.eye);
    eye.position.set(side * 0.31, 0.055, -0.315);
    head.add(eye);
    const eyeSocket = makeMesh(new THREE.TorusGeometry(0.09, 0.018, 8, 22), materials.skin);
    eyeSocket.position.copy(eye.position);
    eyeSocket.rotation.y = side * 0.18;
    head.add(eyeSocket);
    const ear = makeMesh(new THREE.ConeGeometry(0.17, 0.54, 16, 3), materials.darkFur);
    ear.position.set(side * 0.3, 0.5, -0.01);
    ear.rotation.z = side * -0.18;
    ear.rotation.x = -0.07;
    head.add(ear);
    const innerEar = makeMesh(new THREE.ConeGeometry(0.092, 0.34, 12, 2), materials.skin);
    innerEar.position.set(side * 0.3, 0.5, -0.055);
    innerEar.rotation.z = side * -0.18;
    innerEar.rotation.x = -0.07;
    head.add(innerEar);
  }
  head.add(createMarkBlindfold(materials));
  const browBand = makeMesh(
    new THREE.TorusGeometry(0.385, 0.052, 10, 42, Math.PI),
    materials.leather,
  );
  browBand.rotation.set(-0.16, 0, Math.PI);
  browBand.position.set(0, 0.2, -0.25);
  head.add(browBand);
  head.add(
    createInstancedDetail(
      new THREE.CylinderGeometry(0.025, 0.025, 0.018, 10),
      materials.bronze,
      Array.from({ length: 5 }, (_, index) => {
        const angle = -1.08 + index * 0.54;
        return {
          position: new THREE.Vector3(Math.sin(angle) * 0.34, 0.19 + Math.cos(angle) * 0.08, -0.36),
          rotation: new THREE.Euler(Math.PI / 2, 0, 0),
        };
      }),
      'brow-band-fasteners',
    ),
  );
  const horn = makeMesh(new THREE.ConeGeometry(0.135, 0.98, 28, 8), materials.horn);
  horn.rotation.x = -Math.PI / 2;
  horn.position.set(0, 0.38, -0.53);
  head.add(horn);
  const hornFerrule = makeMesh(new THREE.TorusGeometry(0.142, 0.026, 8, 28), materials.bronze);
  hornFerrule.position.set(0, 0.38, -0.51);
  hornFerrule.rotation.x = Math.PI / 2;
  head.add(hornFerrule);
  for (let ringIndex = 0; ringIndex < 7; ringIndex += 1) {
    const radius = 0.118 * (1 - ringIndex / 8.5);
    const spiral = makeMesh(new THREE.TorusGeometry(radius, 0.012, 6, 22), materials.hornGroove);
    spiral.position.set(0, 0.38 + ringIndex * 0.015, -0.6 - ringIndex * 0.105);
    spiral.rotation.x = Math.PI / 2;
    head.add(spiral);
  }
  head.add(
    createFurTuftShell(
      materials.guardFur,
      58,
      new THREE.Vector3(0.43, 0.5, 0.43),
      151,
      'Mark guard coat | head',
      0.048,
    ),
  );
  root.add(head);

  const mane: THREE.Object3D[] = [];
  addMane(root, materials, mane);

  const arms: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const shoulder = createMarkArm(side, materials);
    shoulder.position.set(side * 0.69, 0.47, -0.02);
    torso.add(shoulder);
    arms.push(shoulder);
  }

  const legs: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const hip = createMarkLeg(side, materials);
    hip.position.set(side * 0.35, 1.34, 0);
    root.add(hip);
    legs.push(hip);
  }

  const weapon = createCarbine(weaponMaterials, 1.12, false);
  weapon.position.set(0.77, 2.46, -0.63);
  weapon.rotation.set(0.08, -0.12, -0.06);
  root.add(weapon);
  const weaponMuzzle = weapon.getObjectByName('muzzle') ?? weapon;

  arms.forEach(batchDirectMeshesByMaterial);
  legs.forEach(batchDirectMeshesByMaterial);
  batchDirectMeshesByMaterial(torso);
  batchDirectMeshesByMaterial(head);
  batchDirectMeshesByMaterial(weapon);
  batchDirectMeshesByMaterial(root);
  root.scale.setScalar(0.95);
  return { root, torso, head, arms, legs, mane, weapon, muzzle: weaponMuzzle, horn };
}

export function createFirstPersonWeapon(): { root: THREE.Group; muzzle: THREE.Object3D } {
  const materials = createWeaponMaterials();
  const root = createCarbine(materials, 0.72, true);
  root.position.set(0.68, -0.66, -1.88);
  root.rotation.set(-0.045, -0.025, -0.018);
  const muzzle = root.getObjectByName('muzzle') ?? root;
  return { root, muzzle };
}

function createCarbine(
  materials: WeaponMaterials,
  scale: number,
  firstPerson: boolean,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SunlanceCarbine';
  const receiver = makeMesh(createBeveledBox(0.36, 0.34, 0.94, 0.055), materials.bronze);
  receiver.position.set(0, 0, -0.18);
  group.add(receiver);
  const casing = makeMesh(createBeveledBox(0.43, 0.18, 0.58, 0.035), materials.dark);
  casing.position.set(0, 0.16, -0.25);
  group.add(casing);
  const rearBlock = makeMesh(createBeveledBox(0.38, 0.27, 0.45, 0.045), materials.dark);
  rearBlock.position.set(0, -0.015, 0.43);
  group.add(rearBlock);
  const barrel = makeMesh(new THREE.CylinderGeometry(0.07, 0.09, 1.02, 24), materials.steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = -1.05;
  group.add(barrel);
  const barrelShroud = makeMesh(
    new THREE.CylinderGeometry(0.135, 0.15, 0.68, 12, 1, true),
    materials.dark,
  );
  barrelShroud.rotation.x = Math.PI / 2;
  barrelShroud.position.z = -0.86;
  group.add(barrelShroud);
  for (const side of [-1, 1]) {
    const rail = makeMesh(new THREE.CylinderGeometry(0.024, 0.024, 0.98, 10), materials.bronze);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(side * 0.14, -0.01, -0.91);
    group.add(rail);
    const sidePlate = makeMesh(createBeveledBox(0.052, 0.22, 0.62, 0.018), materials.bronze);
    sidePlate.position.set(side * 0.205, 0.015, -0.3);
    sidePlate.rotation.z = side * 0.08;
    group.add(sidePlate);
  }
  group.add(
    createInstancedDetail(
      new THREE.CylinderGeometry(0.019, 0.019, 0.018, 10),
      materials.steel,
      [-1, 1].flatMap((side) =>
        Array.from({ length: 4 }, (_, screwIndex) => ({
          position: new THREE.Vector3(side * 0.237, 0.04, -0.49 + screwIndex * 0.18),
          rotation: new THREE.Euler(0, 0, Math.PI / 2),
        })),
      ),
      'receiver-fasteners',
    ),
  );
  const grip = makeMesh(createBeveledBox(0.19, 0.52, 0.23, 0.035), materials.leather);
  grip.position.set(0, -0.32, 0.08);
  grip.rotation.x = -0.22;
  group.add(grip);
  group.add(
    createInstancedDetail(
      new THREE.TorusGeometry(0.118, 0.014, 6, 18),
      materials.bronze,
      Array.from({ length: 5 }, (_, wrapIndex) => ({
        position: new THREE.Vector3(0, -0.14 - wrapIndex * 0.075, 0.07 + wrapIndex * 0.018),
        rotation: new THREE.Euler(Math.PI / 2, 0, 0),
        scale: new THREE.Vector3(0.72, 1, 1),
      })),
      'grip-wraps',
    ),
  );
  const stock = makeMesh(createBeveledBox(0.29, 0.27, 0.68, 0.055), materials.dark);
  stock.position.set(0, -0.04, 0.56);
  stock.rotation.x = 0.1;
  group.add(stock);
  const butt = makeMesh(createBeveledBox(0.34, 0.38, 0.18, 0.05), materials.leather);
  butt.position.set(0, -0.01, 0.88);
  butt.rotation.x = 0.08;
  group.add(butt);
  const coil = makeMesh(new THREE.CylinderGeometry(0.055, 0.055, 0.52, 18), materials.energy);
  coil.rotation.x = Math.PI / 2;
  coil.position.set(0, 0.13, -0.42);
  group.add(coil);
  for (const parity of [0, 1]) {
    group.add(
      createInstancedDetail(
        new THREE.TorusGeometry(0.11, parity === 0 ? 0.014 : 0.022, 7, 22),
        parity === 0 ? materials.energy : materials.bronze,
        Array.from({ length: 3 }, (_, ringIndex) => ({
          position: new THREE.Vector3(0, 0, -0.61 - (ringIndex * 2 + parity) * 0.15),
        })),
        parity === 0 ? 'energy-coils' : 'coil-cages',
      ),
    );
  }
  group.add(
    createInstancedDetail(
      createBeveledBox(0.29, 0.025, 0.055, 0.008),
      materials.dark,
      Array.from({ length: 7 }, (_, finIndex) => ({
        position: new THREE.Vector3(0, 0.19, -0.76 - finIndex * 0.105),
      })),
      'barrel-cooling-fins',
    ),
  );
  const sight = makeMesh(createBeveledBox(0.09, 0.16, 0.36, 0.025), materials.dark);
  sight.position.set(0, 0.31, -0.16);
  group.add(sight);
  const sightGlass = makeMesh(new THREE.CylinderGeometry(0.065, 0.065, 0.045, 18), materials.glass);
  sightGlass.rotation.x = Math.PI / 2;
  sightGlass.position.set(0, 0.36, -0.35);
  group.add(sightGlass);
  const cable = createCable(
    [
      new THREE.Vector3(-0.18, 0.04, 0.23),
      new THREE.Vector3(-0.26, -0.12, 0.03),
      new THREE.Vector3(-0.23, -0.18, -0.38),
      new THREE.Vector3(-0.18, 0.02, -0.72),
    ],
    0.022,
    materials.dark,
  );
  group.add(cable);
  const muzzleBrake = makeMesh(new THREE.CylinderGeometry(0.12, 0.1, 0.22, 18), materials.bronze);
  muzzleBrake.rotation.x = Math.PI / 2;
  muzzleBrake.position.z = -1.54;
  group.add(muzzleBrake);
  group.add(
    createInstancedDetail(
      new THREE.BoxGeometry(0.026, 0.055, 0.08),
      materials.energy,
      Array.from({ length: 6 }, (_, portIndex) => {
        const angle = (portIndex / 6) * TAU;
        return {
          position: new THREE.Vector3(Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, -1.55),
          rotation: new THREE.Euler(0, 0, angle),
        };
      }),
      'muzzle-energy-ports',
    ),
  );
  if (!firstPerson) group.add(createAmmoBelt(materials));
  if (firstPerson) addFirstPersonHands(group, materials);
  const muzzle = new THREE.Object3D();
  muzzle.name = 'muzzle';
  muzzle.position.set(0, 0, -1.72);
  group.add(muzzle);
  group.scale.setScalar(scale);
  return group;
}

function createMarkBlindfold(materials: MarkMaterials): THREE.Group {
  const blindfold = new THREE.Group();
  blindfold.name = 'Mark-blindfold';

  for (const [bandIndex, verticalOffset] of [-0.056, 0, 0.056].entries()) {
    const wrap = createCable(
      [
        new THREE.Vector3(-0.4, 0.065 + verticalOffset, -0.31),
        new THREE.Vector3(-0.19, 0.075 + verticalOffset + (bandIndex % 2) * 0.008, -0.405),
        new THREE.Vector3(0.02, 0.06 + verticalOffset, -0.445),
        new THREE.Vector3(0.21, 0.076 + verticalOffset - (bandIndex % 2) * 0.008, -0.4),
        new THREE.Vector3(0.4, 0.065 + verticalOffset, -0.3),
      ],
      0.034,
      materials.cloth,
    );
    wrap.name = 'blindfold-woven-wrap';
    wrap.castShadow = false;
    blindfold.add(wrap);
  }
  for (const verticalOffset of [-0.086, 0.086]) {
    const binding = createCable(
      [
        new THREE.Vector3(-0.38, 0.065 + verticalOffset, -0.31),
        new THREE.Vector3(0, 0.072 + verticalOffset, -0.437),
        new THREE.Vector3(0.38, 0.065 + verticalOffset, -0.3),
      ],
      0.012,
      materials.leather,
    );
    binding.name = 'blindfold-braided-binding';
    binding.castShadow = false;
    blindfold.add(binding);
  }

  const knot = makeMesh(new THREE.IcosahedronGeometry(0.075, 1), materials.leather);
  knot.name = 'blindfold-knot';
  knot.position.set(-0.24, 0.06, 0.37);
  knot.scale.set(1.2, 0.82, 0.72);
  blindfold.add(knot);

  const tailPaths = [
    [
      new THREE.Vector3(-0.25, 0.06, 0.38),
      new THREE.Vector3(-0.43, -0.02, 0.52),
      new THREE.Vector3(-0.55, -0.2, 0.7),
      new THREE.Vector3(-0.48, -0.45, 0.84),
    ],
    [
      new THREE.Vector3(-0.2, 0.04, 0.37),
      new THREE.Vector3(-0.08, -0.1, 0.58),
      new THREE.Vector3(-0.17, -0.32, 0.75),
      new THREE.Vector3(-0.05, -0.57, 0.9),
    ],
  ];
  tailPaths.forEach((points, index) => {
    const tail = createCable(points, index === 0 ? 0.034 : 0.027, materials.cloth);
    tail.name = 'blindfold-trailing-wrap';
    tail.scale.x = index === 0 ? 1.18 : 0.9;
    tail.castShadow = false;
    blindfold.add(tail);
  });

  return blindfold;
}

function addMarkArmor(torso: THREE.Group, materials: MarkMaterials): void {
  const backPlate = makeMesh(createArmorPlateGeometry(0.82, 1.12, 0.13), materials.armor);
  backPlate.position.set(0, 0.08, 0.57);
  torso.add(backPlate);
  const spine = makeMesh(new THREE.CapsuleGeometry(0.085, 0.9, 7, 12), materials.armorEdge);
  spine.position.set(0, 0.02, 0.69);
  torso.add(spine);
  const backRivets: Array<{ position: THREE.Vector3 }> = [];
  for (let plateIndex = 0; plateIndex < 6; plateIndex += 1) {
    const plate = makeMesh(
      createArmorPlateGeometry(0.56 - plateIndex * 0.035, 0.24, 0.075),
      plateIndex % 2 === 0 ? materials.armor : materials.armorEdge,
    );
    plate.position.set(0, 0.49 - plateIndex * 0.2, 0.73 + Math.abs(plateIndex - 2.5) * 0.012);
    torso.add(plate);
    for (const side of [-1, 1]) {
      backRivets.push({
        position: new THREE.Vector3(
          side * (0.2 - plateIndex * 0.006),
          0.49 - plateIndex * 0.2,
          0.79,
        ),
      });
    }
  }
  torso.add(
    createInstancedDetail(
      new THREE.SphereGeometry(0.025, 10, 7),
      materials.bronze,
      backRivets,
      'backplate-fasteners',
    ),
  );
  torso.add(
    createInstancedDetail(
      createBeveledBox(0.3, 0.018, 0.024, 0.006),
      materials.armorWear,
      [
        {
          position: new THREE.Vector3(-0.14, 0.34, 0.81),
          rotation: new THREE.Euler(0, 0, -0.44),
          scale: new THREE.Vector3(1.1, 1, 1),
        },
        {
          position: new THREE.Vector3(0.11, 0.08, 0.82),
          rotation: new THREE.Euler(0, 0, 0.31),
          scale: new THREE.Vector3(0.72, 1, 1),
        },
        {
          position: new THREE.Vector3(-0.08, -0.23, 0.8),
          rotation: new THREE.Euler(0, 0, -0.18),
          scale: new THREE.Vector3(0.86, 1, 1),
        },
        {
          position: new THREE.Vector3(0.13, -0.42, 0.78),
          rotation: new THREE.Euler(0, 0, 0.48),
          scale: new THREE.Vector3(0.56, 1, 1),
        },
      ],
      'Mark-armor-abrasion-inlays',
    ),
  );
  for (const side of [-1, 1]) {
    const strap = makeMesh(createBeveledBox(0.13, 1.38, 0.055, 0.025), materials.leather);
    strap.position.set(side * 0.3, 0.04, 0.72);
    strap.rotation.z = side * -0.31;
    torso.add(strap);
    const buckle = makeMesh(new THREE.TorusGeometry(0.095, 0.018, 7, 20), materials.bronze);
    buckle.scale.y = 0.72;
    buckle.position.set(side * 0.43, -0.24, 0.78);
    torso.add(buckle);
    const shoulderPlate = makeMesh(createArmorPlateGeometry(0.47, 0.48, 0.11), materials.armor);
    shoulderPlate.position.set(side * 0.59, 0.42, 0.18);
    shoulderPlate.rotation.set(Math.PI / 2 - 0.2, side * -0.26, side * -0.12);
    torso.add(shoulderPlate);
    const shoulderLip = makeMesh(
      new THREE.TorusGeometry(0.25, 0.035, 7, 28, Math.PI),
      materials.bronze,
    );
    shoulderLip.position.set(side * 0.6, 0.47, 0.22);
    shoulderLip.rotation.set(Math.PI / 2, 0, side < 0 ? Math.PI * 0.18 : Math.PI * 0.82);
    torso.add(shoulderLip);
    for (let layerIndex = 0; layerIndex < 2; layerIndex += 1) {
      const scalePlate = makeMesh(
        createArmorPlateGeometry(0.36 - layerIndex * 0.06, 0.28, 0.07),
        layerIndex === 0 ? materials.armorEdge : materials.armorWear,
      );
      scalePlate.position.set(
        side * (0.66 + layerIndex * 0.025),
        0.29 - layerIndex * 0.16,
        0.21 + layerIndex * 0.035,
      );
      scalePlate.rotation.set(Math.PI / 2 - 0.18, side * -0.22, side * -0.09);
      torso.add(scalePlate);
    }
    if (side < 0) {
      for (let spikeIndex = 0; spikeIndex < 3; spikeIndex += 1) {
        const spike = makeMesh(
          new THREE.ConeGeometry(0.045 - spikeIndex * 0.006, 0.27 - spikeIndex * 0.035, 7, 2),
          materials.armorWear,
        );
        spike.name = 'Mark-asymmetric-shoulder-stud';
        spike.position.set(-0.72 - spikeIndex * 0.015, 0.54 - spikeIndex * 0.11, 0.21);
        spike.rotation.z = Math.PI / 2 + 0.18 + spikeIndex * 0.08;
        torso.add(spike);
      }
    }
  }
  const collar = makeMesh(
    new THREE.TorusGeometry(0.49, 0.075, 10, 40, Math.PI * 1.45),
    materials.leather,
  );
  collar.scale.x = 1.25;
  collar.rotation.set(Math.PI / 2, 0, -Math.PI * 0.23);
  collar.position.set(0, 0.58, 0.05);
  torso.add(collar);
  for (let stripIndex = 0; stripIndex < 5; stripIndex += 1) {
    const strip = makeMesh(
      createBeveledBox(0.13, 0.92 + stripIndex * 0.1, 0.025, 0.015),
      materials.cloth,
    );
    strip.position.set((stripIndex - 2) * 0.12, -0.62, 0.62 - Math.abs(stripIndex - 2) * 0.025);
    strip.rotation.z = (stripIndex - 2) * 0.045;
    torso.add(strip);
  }
}

function addMane(root: THREE.Group, materials: MarkMaterials, mane: THREE.Object3D[]): void {
  const maneLocks: THREE.BufferGeometry[] = [];
  for (let index = 0; index < 28; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const origin = new THREE.Vector3(
      side * (0.06 + (row % 3) * 0.035),
      3.7 - row * 0.17,
      0.06 + row * 0.055,
    );
    const length = 0.52 + row * 0.055 + (index % 3) * 0.05;
    const curve = new THREE.CatmullRomCurve3([
      origin,
      origin.clone().add(new THREE.Vector3(side * 0.12, -length * 0.33, 0.1)),
      origin.clone().add(new THREE.Vector3(side * (0.06 + (row % 2) * 0.1), -length * 0.68, 0.18)),
      origin.clone().add(new THREE.Vector3(side * 0.16, -length, 0.23)),
    ]);
    maneLocks.push(new THREE.TubeGeometry(curve, 12, 0.037 + (index % 4) * 0.006, 6, false));
  }
  const mergedMane = mergeGeometries(maneLocks, false);
  if (mergedMane) {
    const maneMesh = makeMesh(mergedMane, materials.mane);
    maneMesh.name = 'layered-mane-locks';
    maneMesh.userData.noBatch = true;
    root.add(maneMesh);
    mane.push(maneMesh);
  }
  const maneFlyaways: THREE.BufferGeometry[] = [];
  for (let index = 0; index < 18; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const origin = new THREE.Vector3(
      side * (0.08 + (row % 3) * 0.045),
      3.77 - row * 0.18,
      0.04 + row * 0.062,
    );
    const length = 0.58 + row * 0.07 + hashUnit(index, 317) * 0.16;
    const outward = side * (0.15 + hashUnit(index * 3, 331) * 0.18);
    const curve = new THREE.CatmullRomCurve3([
      origin,
      origin.clone().add(new THREE.Vector3(outward * 0.62, -length * 0.28, 0.08)),
      origin.clone().add(new THREE.Vector3(-outward * 0.18, -length * 0.66, 0.2)),
      origin.clone().add(new THREE.Vector3(outward, -length, 0.3)),
    ]);
    maneFlyaways.push(
      new THREE.TubeGeometry(curve, 9, 0.006 + hashUnit(index, 347) * 0.004, 5, false),
    );
  }
  const mergedFlyaways = mergeGeometries(maneFlyaways, false);
  if (mergedFlyaways) {
    const flyawayMesh = makeMesh(mergedFlyaways, materials.maneEdge);
    flyawayMesh.name = 'Mark-mane-flyaways';
    flyawayMesh.userData.noBatch = true;
    flyawayMesh.castShadow = false;
    root.add(flyawayMesh);
    mane.push(flyawayMesh);
  }
  const tailLocks: THREE.BufferGeometry[] = [];
  for (let index = 0; index < 15; index += 1) {
    const side = (index - 7) / 7;
    const origin = new THREE.Vector3(side * 0.14, 1.43 - Math.abs(side) * 0.06, 0.63);
    const curve = new THREE.CatmullRomCurve3([
      origin,
      origin.clone().add(new THREE.Vector3(side * 0.22, -0.18, 0.32)),
      origin.clone().add(new THREE.Vector3(side * 0.3, -0.48, 0.56)),
      origin.clone().add(new THREE.Vector3(side * 0.42, -0.76 - Math.abs(side) * 0.15, 0.65)),
    ]);
    tailLocks.push(new THREE.TubeGeometry(curve, 14, 0.045 + (index % 3) * 0.007, 7, false));
  }
  const mergedTail = mergeGeometries(tailLocks, false);
  if (mergedTail) {
    const tailMesh = makeMesh(mergedTail, materials.mane);
    tailMesh.name = 'layered-tail-locks';
    tailMesh.userData.noBatch = true;
    root.add(tailMesh);
    mane.push(tailMesh);
  }
  const tailFlyaways: THREE.BufferGeometry[] = [];
  for (let index = 0; index < 9; index += 1) {
    const side = (index - 4) / 4;
    const origin = new THREE.Vector3(side * 0.12, 1.45, 0.66);
    const curve = new THREE.CatmullRomCurve3([
      origin,
      origin.clone().add(new THREE.Vector3(side * 0.28, -0.2, 0.34)),
      origin.clone().add(new THREE.Vector3(-side * 0.12, -0.57, 0.64)),
      origin.clone().add(new THREE.Vector3(side * 0.55, -0.94, 0.78)),
    ]);
    tailFlyaways.push(
      new THREE.TubeGeometry(curve, 10, 0.007 + hashUnit(index, 373) * 0.004, 5, false),
    );
  }
  const mergedTailFlyaways = mergeGeometries(tailFlyaways, false);
  if (mergedTailFlyaways) {
    const tailFlyawayMesh = makeMesh(mergedTailFlyaways, materials.maneEdge);
    tailFlyawayMesh.name = 'Mark-tail-flyaways';
    tailFlyawayMesh.userData.noBatch = true;
    tailFlyawayMesh.castShadow = false;
    root.add(tailFlyawayMesh);
    mane.push(tailFlyawayMesh);
  }
}

function createMarkArm(side: number, materials: MarkMaterials): THREE.Group {
  const shoulder = new THREE.Group();
  const deltoid = makeMesh(new THREE.SphereGeometry(0.29, 24, 18), materials.fur);
  deltoid.scale.set(1.05, 1.13, 0.95);
  shoulder.add(deltoid);
  const upper = makeMesh(new THREE.CapsuleGeometry(0.225, 0.56, 9, 20), materials.fur);
  upper.position.y = -0.43;
  upper.rotation.z = side * -0.045;
  shoulder.add(upper);
  const pauldron = makeMesh(createArmorPlateGeometry(0.44, 0.46, 0.11), materials.armor);
  pauldron.position.set(side * 0.04, 0.02, 0.08);
  pauldron.rotation.set(Math.PI / 2 - 0.25, side * -0.2, side * -0.08);
  shoulder.add(pauldron);
  const pauldronEdge = makeMesh(
    new THREE.TorusGeometry(0.22, 0.028, 7, 26, Math.PI),
    materials.bronze,
  );
  pauldronEdge.position.set(side * 0.04, 0.12, 0.16);
  pauldronEdge.rotation.set(Math.PI / 2, 0, side < 0 ? 0.3 : Math.PI - 0.3);
  shoulder.add(pauldronEdge);
  const elbow = makeMesh(new THREE.SphereGeometry(0.205, 20, 14), materials.darkFur);
  elbow.position.set(side * -0.035, -0.83, -0.1);
  shoulder.add(elbow);
  const forearm = makeMesh(new THREE.CapsuleGeometry(0.19, 0.5, 9, 20), materials.fur);
  forearm.position.set(side * -0.045, -1.03, -0.23);
  forearm.rotation.x = -0.34;
  shoulder.add(forearm);
  const bracer = makeMesh(new THREE.CylinderGeometry(0.22, 0.17, 0.34, 16), materials.leather);
  bracer.position.set(side * -0.045, -1.13, -0.29);
  bracer.rotation.x = -0.34;
  shoulder.add(bracer);
  for (let ridgeIndex = 0; ridgeIndex < 3; ridgeIndex += 1) {
    const ridge = makeMesh(
      new THREE.TorusGeometry(0.19 - ridgeIndex * 0.012, 0.018, 7, 20),
      materials.bronze,
    );
    ridge.position.set(side * -0.045, -1.03 - ridgeIndex * 0.1, -0.25 - ridgeIndex * 0.035);
    ridge.rotation.x = Math.PI / 2 - 0.34;
    shoulder.add(ridge);
  }
  const hand = makeMesh(new THREE.SphereGeometry(0.19, 20, 14), materials.darkFur);
  hand.scale.set(0.9, 1.14, 0.74);
  hand.position.set(side * -0.05, -1.34, -0.38);
  shoulder.add(hand);
  const tufts = createFurTuftShell(
    materials.guardFur,
    38,
    new THREE.Vector3(0.24, 0.67, 0.24),
    side < 0 ? 211 : 223,
    side < 0 ? 'Mark guard coat | left arm' : 'Mark guard coat | right arm',
    0.048,
  );
  tufts.position.y = -0.55;
  shoulder.add(tufts);
  return shoulder;
}

function createMarkLeg(side: number, materials: MarkMaterials): THREE.Group {
  const hip = new THREE.Group();
  const thigh = makeMesh(new THREE.CapsuleGeometry(0.29, 0.7, 10, 22), materials.darkFur);
  thigh.position.y = -0.47;
  thigh.scale.set(1.05, 1, 0.92);
  hip.add(thigh);
  const knee = makeMesh(new THREE.SphereGeometry(0.25, 20, 14), materials.fur);
  knee.position.set(0, -0.86, -0.04);
  hip.add(knee);
  const shin = makeMesh(new THREE.CapsuleGeometry(0.22, 0.5, 9, 20), materials.fur);
  shin.position.set(0, -1.08, -0.08);
  shin.scale.set(0.92, 1, 0.86);
  hip.add(shin);
  const gaiter = makeMesh(new THREE.CylinderGeometry(0.245, 0.215, 0.43, 18), materials.leather);
  gaiter.position.set(0, -1.18, -0.07);
  hip.add(gaiter);
  const hoof = makeMesh(new THREE.CylinderGeometry(0.29, 0.25, 0.35, 20), materials.armor);
  hoof.position.set(0, -1.48, -0.14);
  hoof.scale.z = 1.2;
  hip.add(hoof);
  const hoofBand = makeMesh(new THREE.TorusGeometry(0.26, 0.026, 8, 24), materials.bronze);
  hoofBand.scale.z = 1.16;
  hoofBand.rotation.x = Math.PI / 2;
  hoofBand.position.set(0, -1.38, -0.11);
  hip.add(hoofBand);
  const pouch = makeMesh(createBeveledBox(0.25, 0.32, 0.16, 0.035), materials.leather);
  pouch.position.set(side * 0.29, -0.2, 0.11);
  hip.add(pouch);
  const legTufts = createFurTuftShell(
    materials.guardFur,
    52,
    new THREE.Vector3(0.31, 0.76, 0.28),
    side < 0 ? 251 : 269,
    side < 0 ? 'Mark guard coat | left leg' : 'Mark guard coat | right leg',
    0.052,
  );
  legTufts.position.y = -0.74;
  hip.add(legTufts);
  return hip;
}

function addFirstPersonHands(group: THREE.Group, weaponMaterials: WeaponMaterials): void {
  const markMaterials = createMarkMaterials();
  const poses = [
    { x: -0.23, y: -0.32, z: -0.62, rx: -0.7, rz: -0.22 },
    { x: 0.23, y: -0.31, z: 0.03, rx: -0.35, rz: 0.16 },
  ];
  poses.forEach((pose, index) => {
    const arm = new THREE.Group();
    arm.position.set(pose.x, pose.y, pose.z);
    arm.rotation.set(pose.rx, 0, pose.rz);
    const forearm = makeMesh(new THREE.CapsuleGeometry(0.13, 0.52, 8, 18), markMaterials.fur);
    forearm.position.y = -0.28;
    arm.add(forearm);
    const guardHairs = createFurTuftShell(
      markMaterials.guardFur,
      24,
      new THREE.Vector3(0.145, 0.4, 0.145),
      index === 0 ? 401 : 419,
      index === 0 ? 'Mark first-person guard coat | left' : 'Mark first-person guard coat | right',
      0.04,
      0.008,
    );
    guardHairs.position.y = -0.28;
    arm.add(guardHairs);
    const bracer = makeMesh(
      new THREE.CylinderGeometry(0.15, 0.13, 0.24, 16),
      weaponMaterials.leather,
    );
    bracer.position.y = -0.05;
    arm.add(bracer);
    const cuff = makeMesh(new THREE.TorusGeometry(0.145, 0.018, 7, 20), weaponMaterials.bronze);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = 0.08;
    arm.add(cuff);
    const hand = makeMesh(new THREE.SphereGeometry(0.145, 20, 14), markMaterials.darkFur);
    hand.scale.set(1, 0.85, 0.82);
    hand.position.set(index === 0 ? 0.04 : -0.03, 0.15, -0.02);
    arm.add(hand);
    for (let fingerIndex = 0; fingerIndex < 3; fingerIndex += 1) {
      const finger = makeMesh(new THREE.CapsuleGeometry(0.032, 0.16, 5, 10), markMaterials.darkFur);
      finger.position.set((fingerIndex - 1) * 0.055, 0.18, -0.09);
      finger.rotation.x = Math.PI / 2.8;
      arm.add(finger);
    }
    group.add(arm);
  });
}

function createAmmoBelt(materials: WeaponMaterials): THREE.Group {
  const belt = new THREE.Group();
  belt.name = 'Sunlance-ammunition-belt';
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.24, -0.02, 0.05),
    new THREE.Vector3(0.34, -0.42, 0.14),
    new THREE.Vector3(0.24, -0.95, 0.34),
    new THREE.Vector3(0.05, -1.45, 0.53),
    new THREE.Vector3(-0.18, -1.68, 0.47),
  ]);
  const cartridgeGeometry = new THREE.CylinderGeometry(0.033, 0.039, 0.16, 10);
  const count = 24;
  const cartridges = new THREE.InstancedMesh(cartridgeGeometry, materials.bronze, count);
  cartridges.name = 'belt-cartridges';
  cartridges.castShadow = false;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    curve.getPointAt(t, position);
    curve.getTangentAt(t, tangent).normalize();
    quaternion.setFromUnitVectors(up, tangent);
    matrix.compose(position, quaternion, scale);
    cartridges.setMatrixAt(index, matrix);
  }
  cartridges.instanceMatrix.needsUpdate = true;
  belt.add(cartridges);
  belt.add(createCable(curve.points, 0.018, materials.dark));
  return belt;
}

export function animateMark(
  rig: MarkRig,
  time: number,
  speed: number,
  aimPitch: number,
  firing: boolean,
  firstPerson: boolean,
): void {
  rig.root.visible = !firstPerson;
  if (firstPerson) return;
  const stride = Math.sin(time * (7.5 + speed * 2.5)) * Math.min(0.72, speed * 0.12);
  rig.legs[0].rotation.x = stride;
  rig.legs[1].rotation.x = -stride;
  rig.arms[0].rotation.x = 0.58 + aimPitch * 0.26 + stride * 0.12;
  rig.arms[1].rotation.x = 0.76 + aimPitch * 0.26 - stride * 0.12;
  rig.torso.rotation.x = aimPitch * 0.12;
  rig.head.rotation.x = aimPitch * 0.46;
  rig.weapon.rotation.x = aimPitch * 0.25 + (firing ? Math.sin(time * 58) * 0.018 : 0);
  rig.root.position.y = Math.abs(Math.sin(time * (7.5 + speed))) * Math.min(0.08, speed * 0.014);
  rig.mane.forEach((strand, index) => {
    strand.rotation.z += Math.sin(time * 3.4 + index * 0.62) * 0.0009 * (1 + speed);
  });
  const hornMaterial = rig.horn.material;
  if (hornMaterial instanceof THREE.MeshStandardMaterial) {
    hornMaterial.emissiveIntensity = 0.35 + Math.sin(time * 2.7) * 0.08;
  }
}

export function createEnemyRig(kind: EnemyKind): EnemyRig {
  if (kind === 'needlewing') return createNeedlewing();
  if (kind === 'heavy') return createHeavy();
  if (kind === 'regent') return createRegent();
  return createChainling();
}

function hostileMaterials(coreColor = 0xff4b2f): HiveMaterials {
  return createHiveMaterials(coreColor);
}

function createChainling(): EnemyRig {
  const materials = hostileMaterials();
  const root = new THREE.Group();
  root.name = 'Chainling';
  const body = makeMesh(new THREE.CapsuleGeometry(0.44, 1.15, 9, 22), materials.tendon);
  body.rotation.x = Math.PI / 2;
  body.scale.set(0.92, 1, 1.06);
  body.position.y = 0.68;
  root.add(body);
  for (let plateIndex = 0; plateIndex < 7; plateIndex += 1) {
    const plate = makeMesh(
      createArmorPlateGeometry(0.68 - plateIndex * 0.035, 0.52, 0.12),
      plateIndex % 2 === 0 ? materials.carapace : materials.edge,
    );
    plate.rotation.x = -Math.PI / 2;
    plate.position.set(0, 1.01 + Math.sin(plateIndex * 0.8) * 0.035, -0.44 + plateIndex * 0.23);
    root.add(plate);
    const spine = makeMesh(
      new THREE.ConeGeometry(0.07 + plateIndex * 0.004, 0.31 + plateIndex * 0.025, 7),
      materials.edge,
    );
    spine.position.set(0, 1.2, -0.43 + plateIndex * 0.23);
    spine.rotation.x = 0.12 * Math.sin(plateIndex);
    root.add(spine);
  }
  const head = new THREE.Group();
  head.position.set(0, 0.66, -0.93);
  const cranium = makeMesh(new THREE.IcosahedronGeometry(0.43, 2), materials.carapace);
  cranium.scale.set(0.92, 0.7, 1.18);
  head.add(cranium);
  const facePlate = makeMesh(createArmorPlateGeometry(0.58, 0.48, 0.12), materials.edge);
  facePlate.position.set(0, 0.04, -0.36);
  head.add(facePlate);
  for (const side of [-1, 1]) {
    const mandible = makeMesh(new THREE.ConeGeometry(0.1, 0.72, 8, 2), materials.carapace);
    mandible.rotation.x = -Math.PI / 2;
    mandible.rotation.z = side * 0.17;
    mandible.position.set(side * 0.21, -0.17, -0.59);
    head.add(mandible);
    for (let eyeIndex = 0; eyeIndex < 3; eyeIndex += 1) {
      const eye = makeMesh(
        new THREE.SphereGeometry(0.035 + eyeIndex * 0.005, 10, 8),
        materials.eye,
      );
      eye.position.set(side * (0.12 + eyeIndex * 0.075), 0.12 - eyeIndex * 0.05, -0.4);
      head.add(eye);
    }
  }
  const jaw = makeMesh(new THREE.SphereGeometry(0.29, 18, 12), materials.tendon);
  jaw.scale.set(1, 0.42, 1.15);
  jaw.position.set(0, -0.22, -0.4);
  head.add(jaw);
  addTeeth(head, materials, 8, 0.23, -0.28, -0.67, 0.18);
  root.add(head);
  const core = makeMesh(new THREE.SphereGeometry(0.105, 16, 12), materials.core);
  core.position.set(0, 0.74, -1.37);
  root.add(core);
  const limbs: THREE.Object3D[] = [];
  for (let index = 0; index < 8; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const pivot = createArachnidLimb(side, row, materials, 1);
    pivot.position.set(side * 0.42, 0.67, -0.56 + row * 0.41);
    root.add(pivot);
    limbs.push(pivot);
  }
  batchDirectMeshesByMaterial(head);
  limbs.forEach(batchDirectMeshesByMaterial);
  batchDirectMeshesByMaterial(root);
  return { root, core, limbs, wings: [], glowMaterials: [materials.core, materials.eye] };
}

function createNeedlewing(): EnemyRig {
  const materials = hostileMaterials(0x57ffad);
  const root = new THREE.Group();
  root.name = 'Needlewing';
  const body = makeMesh(new THREE.CapsuleGeometry(0.34, 1.35, 10, 24), materials.tendon);
  body.rotation.x = Math.PI / 2;
  root.add(body);
  for (let plateIndex = 0; plateIndex < 7; plateIndex += 1) {
    const plate = makeMesh(
      new THREE.SphereGeometry(0.37 - plateIndex * 0.012, 20, 12, 0, TAU, 0, Math.PI * 0.56),
      plateIndex % 2 === 0 ? materials.carapace : materials.edge,
    );
    plate.rotation.x = Math.PI;
    plate.scale.set(1.1, 0.46, 0.82);
    plate.position.set(0, 0.17, -0.57 + plateIndex * 0.2);
    root.add(plate);
  }
  const core = makeMesh(new THREE.IcosahedronGeometry(0.22, 2), materials.core);
  core.position.z = -0.12;
  root.add(core);
  const skull = makeMesh(new THREE.IcosahedronGeometry(0.31, 2), materials.carapace);
  skull.scale.set(0.85, 0.7, 1.22);
  skull.position.z = -0.82;
  root.add(skull);
  for (const side of [-1, 1]) {
    for (let eyeIndex = 0; eyeIndex < 3; eyeIndex += 1) {
      const eye = makeMesh(new THREE.SphereGeometry(0.036, 10, 8), materials.eye);
      eye.position.set(side * (0.12 + eyeIndex * 0.055), 0.07 - eyeIndex * 0.04, -1.04);
      root.add(eye);
    }
  }
  const needle = makeMesh(new THREE.ConeGeometry(0.13, 1.6, 16, 4), materials.edge);
  needle.rotation.x = -Math.PI / 2;
  needle.position.z = -1.62;
  root.add(needle);
  for (let ringIndex = 0; ringIndex < 5; ringIndex += 1) {
    const ring = makeMesh(
      new THREE.TorusGeometry(0.13 - ringIndex * 0.016, 0.018, 7, 18),
      materials.carapace,
    );
    ring.position.z = -1.07 - ringIndex * 0.16;
    root.add(ring);
  }
  const wings: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    for (let pair = 0; pair < 2; pair += 1) {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(side * 0.25, 0.05 - pair * 0.12, pair === 0 ? -0.2 : 0.3);
      const wing = makeMesh(createWingGeometry(side, pair), materials.membrane);
      wingPivot.add(wing);
      const span = pair === 0 ? 1.85 : 1.45;
      const leadingEdge = createCable(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(side * span * 0.42, 0.18, -0.08),
          new THREE.Vector3(side * span, 0.1, pair === 0 ? 0.32 : 0.5),
        ],
        0.032,
        materials.edge,
      );
      wingPivot.add(leadingEdge);
      for (let veinIndex = 1; veinIndex <= 3; veinIndex += 1) {
        const t = veinIndex / 4;
        const vein = createCable(
          [
            new THREE.Vector3(side * 0.18, 0, 0.02),
            new THREE.Vector3(side * span * t * 0.62, 0.03, 0.16 + pair * 0.08),
            new THREE.Vector3(side * span * t, -0.02, 0.38 + pair * 0.14),
          ],
          0.012,
          veinIndex === 2 ? materials.core : materials.edge,
        );
        wingPivot.add(vein);
      }
      root.add(wingPivot);
      wings.push(wingPivot);
    }
  }
  const limbs: THREE.Object3D[] = [];
  for (let index = 0; index < 6; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const tendrilPivot = new THREE.Group();
    tendrilPivot.position.set(side * 0.15, -0.18, -0.42 + row * 0.42);
    const tendril = createCable(
      [
        new THREE.Vector3(),
        new THREE.Vector3(side * 0.15, -0.3, 0.05),
        new THREE.Vector3(side * 0.26, -0.62, -0.08),
      ],
      0.035,
      materials.tendon,
    );
    tendrilPivot.add(tendril);
    root.add(tendrilPivot);
    limbs.push(tendrilPivot);
  }
  wings.forEach(batchDirectMeshesByMaterial);
  limbs.forEach(batchDirectMeshesByMaterial);
  batchDirectMeshesByMaterial(root);
  return { root, core, limbs, wings, glowMaterials: [materials.core, materials.eye] };
}

function createHeavy(): EnemyRig {
  const materials = hostileMaterials(0xff703d);
  const root = new THREE.Group();
  root.name = 'Gorewarden';
  const torso = makeMesh(new THREE.CapsuleGeometry(0.9, 1.48, 12, 28), materials.tendon);
  torso.position.y = 1.8;
  torso.scale.set(1.04, 1, 0.78);
  root.add(torso);
  for (const side of [-1, 1]) {
    const pectoral = makeMesh(new THREE.SphereGeometry(0.62, 24, 16), materials.tendon);
    pectoral.scale.set(1.08, 0.72, 0.62);
    pectoral.position.set(side * 0.48, 2.2, -0.34);
    root.add(pectoral);
  }
  for (let plateIndex = 0; plateIndex < 8; plateIndex += 1) {
    const column = plateIndex % 2 === 0 ? -1 : 1;
    const row = Math.floor(plateIndex / 2);
    const plate = makeMesh(
      createArmorPlateGeometry(0.78 - row * 0.07, 0.63, 0.16),
      row % 2 === 0 ? materials.carapace : materials.edge,
    );
    plate.position.set(column * (0.39 - row * 0.025), 2.43 - row * 0.45, -0.68);
    plate.rotation.z = column * (0.1 + row * 0.025);
    root.add(plate);
  }
  const head = new THREE.Group();
  head.position.set(0, 2.55, -0.78);
  const skull = makeMesh(new THREE.IcosahedronGeometry(0.58, 2), materials.carapace);
  skull.scale.set(0.88, 0.76, 1.16);
  head.add(skull);
  const crown = makeMesh(createArmorPlateGeometry(0.92, 0.68, 0.18), materials.edge);
  crown.position.set(0, 0.18, -0.4);
  head.add(crown);
  for (const side of [-1, 1]) {
    const eye = makeMesh(new THREE.SphereGeometry(0.08, 14, 10), materials.eye);
    eye.position.set(side * 0.28, 0.08, -0.5);
    head.add(eye);
    const upperMandible = makeMesh(new THREE.ConeGeometry(0.18, 0.9, 10, 3), materials.carapace);
    upperMandible.rotation.x = -Math.PI / 2;
    upperMandible.rotation.z = side * 0.17;
    upperMandible.position.set(side * 0.24, -0.23, -0.72);
    head.add(upperMandible);
  }
  const mouth = makeMesh(new THREE.SphereGeometry(0.4, 20, 14), materials.tendon);
  mouth.scale.set(1, 0.55, 1.2);
  mouth.position.set(0, -0.23, -0.45);
  head.add(mouth);
  addTeeth(head, materials, 12, 0.32, -0.25, -0.76, 0.27);
  root.add(head);
  const core = makeMesh(new THREE.IcosahedronGeometry(0.28, 2), materials.core);
  core.position.set(0, 2.28, -1.16);
  root.add(core);
  const limbs: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const arm = createHeavyArm(side, materials);
    arm.position.set(side * 1.0, 2.1, 0);
    root.add(arm);
    limbs.push(arm);
    const leg = createHeavyLeg(side, materials);
    leg.position.set(side * 0.48, 0.82, 0);
    root.add(leg);
    limbs.push(leg);
  }
  for (let index = 0; index < 9; index += 1) {
    const spike = makeMesh(
      new THREE.ConeGeometry(
        0.11 + (4 - Math.abs(index - 4)) * 0.015,
        0.62 + (4 - Math.abs(index - 4)) * 0.08,
        9,
        3,
      ),
      index % 2 === 0 ? materials.carapace : materials.edge,
    );
    spike.position.set((index - 4) * 0.23, 2.92 - Math.abs(index - 4) * 0.07, 0.14);
    spike.rotation.z = (index - 4) * -0.12;
    spike.rotation.x = -0.18;
    root.add(spike);
  }
  for (const side of [-1, 1]) {
    root.add(
      createCable(
        [
          new THREE.Vector3(side * 0.18, 2.75, -0.56),
          new THREE.Vector3(side * 0.32, 2.1, -0.73),
          new THREE.Vector3(side * 0.26, 1.42, -0.61),
        ],
        0.045,
        materials.tendon,
      ),
    );
  }
  batchDirectMeshesByMaterial(head);
  limbs.forEach(batchDirectMeshesByMaterial);
  batchDirectMeshesByMaterial(root);
  return { root, core, limbs, wings: [], glowMaterials: [materials.core, materials.eye] };
}

function createRegent(): EnemyRig {
  const materials = hostileMaterials(0xff3d27);
  const root = new THREE.Group();
  root.name = 'HollowRegent';
  const thorax = makeMesh(new THREE.CapsuleGeometry(0.86, 1.45, 12, 28), materials.tendon);
  thorax.rotation.x = Math.PI / 2;
  thorax.scale.set(0.9, 1, 1.18);
  root.add(thorax);
  for (let ribIndex = 0; ribIndex < 7; ribIndex += 1) {
    const rib = makeMesh(
      new THREE.TorusGeometry(0.78 - ribIndex * 0.035, 0.075, 8, 26, Math.PI * 1.35),
      ribIndex % 2 === 0 ? materials.carapace : materials.edge,
    );
    rib.scale.y = 0.72;
    rib.rotation.set(Math.PI / 2, 0, -Math.PI * 0.17);
    rib.position.set(0, 0.03, -0.58 + ribIndex * 0.2);
    root.add(rib);
  }
  const core = makeMesh(
    new THREE.IcosahedronGeometry(0.64, 3),
    new THREE.MeshPhysicalMaterial({
      color: 0xff6041,
      emissive: 0xff2d17,
      emissiveIntensity: 5.4,
      roughness: 0.08,
      metalness: 0.45,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 0.4,
      toneMapped: false,
    }),
  );
  core.position.set(0, 0.03, -0.74);
  root.add(core);
  const head = new THREE.Group();
  head.position.set(0, 0.28, -1.45);
  const skull = makeMesh(new THREE.IcosahedronGeometry(0.62, 3), materials.carapace);
  skull.scale.set(0.78, 0.68, 1.26);
  head.add(skull);
  const face = makeMesh(createArmorPlateGeometry(0.78, 0.62, 0.17), materials.edge);
  face.position.set(0, 0.03, -0.48);
  head.add(face);
  for (const side of [-1, 1]) {
    const eye = makeMesh(new THREE.SphereGeometry(0.09, 16, 12), materials.eye);
    eye.position.set(side * 0.25, 0.08, -0.55);
    head.add(eye);
    const jawBlade = makeMesh(new THREE.ConeGeometry(0.16, 1.05, 10, 3), materials.carapace);
    jawBlade.rotation.x = -Math.PI / 2;
    jawBlade.rotation.z = side * 0.19;
    jawBlade.position.set(side * 0.28, -0.24, -0.82);
    head.add(jawBlade);
  }
  const mouth = makeMesh(new THREE.SphereGeometry(0.4, 22, 15), materials.tendon);
  mouth.scale.set(1, 0.46, 1.24);
  mouth.position.set(0, -0.23, -0.5);
  head.add(mouth);
  addTeeth(head, materials, 14, 0.34, -0.25, -0.86, 0.3);
  for (let crownIndex = 0; crownIndex < 11; crownIndex += 1) {
    const offset = crownIndex - 5;
    const crownBlade = makeMesh(
      new THREE.ConeGeometry(
        0.09 + (5 - Math.abs(offset)) * 0.012,
        0.72 + (5 - Math.abs(offset)) * 0.13,
        8,
        3,
      ),
      crownIndex % 2 === 0 ? materials.edge : materials.carapace,
    );
    crownBlade.position.set(
      offset * 0.17,
      0.55 - Math.abs(offset) * 0.035,
      0.03 + Math.abs(offset) * 0.025,
    );
    crownBlade.rotation.z = offset * -0.1;
    crownBlade.rotation.x = -0.18;
    head.add(crownBlade);
  }
  root.add(head);
  const limbs: THREE.Object3D[] = [];
  const wings: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    for (let pair = 0; pair < 2; pair += 1) {
      const wing = createRegentWing(side, pair, materials);
      wing.position.set(side * 0.62, 0.28 - pair * 0.26, 0.12 + pair * 0.45);
      wing.userData.baseRotationZ = side * (pair === 0 ? -0.2 : -0.4);
      wing.rotation.z = wing.userData.baseRotationZ as number;
      root.add(wing);
      wings.push(wing);
    }
  }
  for (let index = 0; index < 8; index += 1) {
    const tendrilPivot = new THREE.Group();
    const angle = (index / 8) * TAU;
    tendrilPivot.rotation.y = angle;
    const tendril = createCable(
      [
        new THREE.Vector3(0, -0.48, 0.52),
        new THREE.Vector3(Math.sin(angle) * 0.18, -1.2, 0.76),
        new THREE.Vector3(Math.cos(angle) * 0.3, -2.15, 0.56),
        new THREE.Vector3(Math.sin(angle * 1.7) * 0.48, -3.0, 0.18),
      ],
      0.085,
      index % 2 === 0 ? materials.tendon : materials.carapace,
    );
    tendrilPivot.add(tendril);
    root.add(tendrilPivot);
    limbs.push(tendrilPivot);
  }
  const halo = makeMesh(new THREE.TorusGeometry(2.48, 0.065, 10, 64), materials.core);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 0.3, 0.4);
  root.add(halo);
  batchDirectMeshesByMaterial(head);
  wings.forEach(batchDirectMeshesByMaterial);
  limbs.forEach(batchDirectMeshesByMaterial);
  batchDirectMeshesByMaterial(root);
  return {
    root,
    core,
    limbs,
    wings,
    glowMaterials: [core.material as THREE.MeshStandardMaterial, materials.core, materials.eye],
  };
}

function createArachnidLimb(
  side: number,
  row: number,
  materials: HiveMaterials,
  scale: number,
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.rotation.z = side * (-0.72 - row * 0.09);
  pivot.rotation.x = (row - 1.5) * 0.1;
  const upper = makeMesh(
    new THREE.CapsuleGeometry(0.075 * scale, 0.54 * scale, 7, 12),
    materials.carapace,
  );
  upper.position.y = -0.31 * scale;
  pivot.add(upper);
  const joint = makeMesh(new THREE.SphereGeometry(0.115 * scale, 14, 10), materials.edge);
  joint.position.y = -0.64 * scale;
  pivot.add(joint);
  const lower = makeMesh(
    new THREE.CapsuleGeometry(0.055 * scale, 0.67 * scale, 7, 12),
    materials.tendon,
  );
  lower.position.set(side * 0.12 * scale, -0.93 * scale, 0.03);
  lower.rotation.z = side * -0.28;
  pivot.add(lower);
  const ankle = makeMesh(new THREE.SphereGeometry(0.075 * scale, 12, 8), materials.edge);
  ankle.position.set(side * 0.23 * scale, -1.27 * scale, 0.03);
  pivot.add(ankle);
  const talon = makeMesh(
    new THREE.ConeGeometry(0.065 * scale, 0.42 * scale, 8, 2),
    materials.carapace,
  );
  talon.position.set(side * 0.31 * scale, -1.43 * scale, -0.12);
  talon.rotation.set(0.24, 0, side * -0.42);
  pivot.add(talon);
  return pivot;
}

function createHeavyArm(side: number, materials: HiveMaterials): THREE.Group {
  const arm = new THREE.Group();
  arm.rotation.z = side * -0.25;
  const shoulder = makeMesh(new THREE.SphereGeometry(0.47, 24, 16), materials.tendon);
  shoulder.scale.set(1.08, 0.94, 0.86);
  arm.add(shoulder);
  const shoulderShell = makeMesh(createArmorPlateGeometry(0.72, 0.66, 0.16), materials.carapace);
  shoulderShell.position.set(side * 0.04, 0.08, -0.26);
  arm.add(shoulderShell);
  const upper = makeMesh(new THREE.CapsuleGeometry(0.31, 0.86, 10, 22), materials.tendon);
  upper.position.y = -0.65;
  arm.add(upper);
  for (let bandIndex = 0; bandIndex < 3; bandIndex += 1) {
    const band = makeMesh(
      new THREE.TorusGeometry(0.32 - bandIndex * 0.012, 0.04, 7, 22),
      materials.edge,
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = -0.34 - bandIndex * 0.22;
    arm.add(band);
  }
  const elbow = makeMesh(new THREE.IcosahedronGeometry(0.34, 1), materials.carapace);
  elbow.position.set(side * -0.03, -1.15, -0.08);
  arm.add(elbow);
  const forearm = makeMesh(new THREE.CapsuleGeometry(0.28, 0.82, 10, 22), materials.tendon);
  forearm.position.set(side * -0.08, -1.62, -0.18);
  forearm.rotation.x = -0.16;
  arm.add(forearm);
  const forearmPlate = makeMesh(createArmorPlateGeometry(0.56, 0.74, 0.14), materials.edge);
  forearmPlate.position.set(side * -0.08, -1.57, -0.46);
  arm.add(forearmPlate);
  const hand = makeMesh(new THREE.SphereGeometry(0.36, 22, 15), materials.tendon);
  hand.scale.set(1.1, 0.7, 0.92);
  hand.position.set(side * -0.1, -2.08, -0.28);
  arm.add(hand);
  for (let clawIndex = 0; clawIndex < 4; clawIndex += 1) {
    const claw = makeMesh(
      new THREE.ConeGeometry(0.08, 0.58 + clawIndex * 0.03, 9, 3),
      materials.teeth,
    );
    claw.rotation.x = -Math.PI / 2.35;
    claw.rotation.z = (clawIndex - 1.5) * 0.09;
    claw.position.set((clawIndex - 1.5) * 0.12, -2.25, -0.58 - Math.abs(clawIndex - 1.5) * 0.03);
    arm.add(claw);
  }
  return arm;
}

function createHeavyLeg(side: number, materials: HiveMaterials): THREE.Group {
  const leg = new THREE.Group();
  const thigh = makeMesh(new THREE.CapsuleGeometry(0.39, 0.76, 10, 22), materials.tendon);
  thigh.position.y = -0.4;
  leg.add(thigh);
  const knee = makeMesh(new THREE.IcosahedronGeometry(0.34, 1), materials.carapace);
  knee.position.set(0, -0.88, -0.18);
  leg.add(knee);
  const shin = makeMesh(new THREE.CapsuleGeometry(0.3, 0.66, 9, 20), materials.tendon);
  shin.position.set(0, -1.17, 0.03);
  shin.rotation.x = 0.15;
  leg.add(shin);
  const shinPlate = makeMesh(createArmorPlateGeometry(0.53, 0.62, 0.15), materials.edge);
  shinPlate.position.set(0, -1.16, -0.29);
  leg.add(shinPlate);
  const foot = makeMesh(new THREE.SphereGeometry(0.36, 22, 15), materials.carapace);
  foot.scale.set(0.9, 0.48, 1.32);
  foot.position.set(0, -1.59, -0.22);
  leg.add(foot);
  for (let toeIndex = 0; toeIndex < 3; toeIndex += 1) {
    const toe = makeMesh(new THREE.ConeGeometry(0.08, 0.5, 9, 3), materials.teeth);
    toe.rotation.x = -Math.PI / 2;
    toe.position.set((toeIndex - 1) * 0.16, -1.66, -0.63);
    leg.add(toe);
  }
  const hipSpike = makeMesh(new THREE.ConeGeometry(0.13, 0.76, 9, 3), materials.carapace);
  hipSpike.position.set(side * 0.22, 0.02, 0.1);
  hipSpike.rotation.z = side * -0.45;
  leg.add(hipSpike);
  return leg;
}

function addTeeth(
  root: THREE.Group,
  materials: HiveMaterials,
  count: number,
  width: number,
  y: number,
  z: number,
  height: number,
): void {
  const geometry = new THREE.ConeGeometry(0.04, height, 8, 2);
  const teeth = new THREE.InstancedMesh(geometry, materials.teeth, count);
  teeth.name = 'tooth-row';
  teeth.castShadow = false;
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  for (let index = 0; index < count; index += 1) {
    const column = index % Math.ceil(count / 2);
    const upper = index < Math.ceil(count / 2);
    const columns = Math.ceil(count / 2);
    const x = ((column + 0.5) / columns - 0.5) * width * 2;
    position.set(x, y + (upper ? 0.1 : -0.1), z + Math.abs(x) * 0.1);
    quaternion.setFromEuler(new THREE.Euler(0, 0, upper ? Math.PI : 0));
    scale.set(0.86 + (column % 2) * 0.2, 0.78 + (column % 3) * 0.1, 0.86 + (column % 2) * 0.2);
    matrix.compose(position, quaternion, scale);
    teeth.setMatrixAt(index, matrix);
  }
  teeth.instanceMatrix.needsUpdate = true;
  root.add(teeth);
}

function createRegentWing(side: number, pair: number, materials: HiveMaterials): THREE.Group {
  const group = new THREE.Group();
  const span = pair === 0 ? 3.65 : 3.0;
  const rise = pair === 0 ? 1.75 : 0.78;
  const points = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(side * span * 0.34, rise * 0.62),
    new THREE.Vector2(side * span, rise),
    new THREE.Vector2(side * span * 0.84, rise * 0.2),
    new THREE.Vector2(side * span * 0.72, -0.52 - pair * 0.2),
    new THREE.Vector2(side * span * 0.48, -0.15),
    new THREE.Vector2(side * span * 0.2, -0.64 - pair * 0.16),
  ];
  const membraneShape = new THREE.Shape(points);
  const membrane = makeMesh(new THREE.ShapeGeometry(membraneShape, 2), materials.membrane);
  membrane.position.z = 0.03;
  group.add(membrane);
  const leading = createCable(
    [
      new THREE.Vector3(),
      new THREE.Vector3(side * span * 0.36, rise * 0.64, 0),
      new THREE.Vector3(side * span, rise, 0),
    ],
    0.105,
    materials.carapace,
  );
  group.add(leading);
  for (let fingerIndex = 1; fingerIndex <= 5; fingerIndex += 1) {
    const t = fingerIndex / 6;
    const endX = side * span * (1 - t * 0.72);
    const endY = THREE.MathUtils.lerp(rise * 0.76, -0.62 - pair * 0.16, t);
    const finger = createCable(
      [
        new THREE.Vector3(side * 0.1, 0, 0.01),
        new THREE.Vector3(side * span * t * 0.44, rise * (0.32 - t * 0.2), 0.025),
        new THREE.Vector3(endX, endY, 0),
      ],
      0.052 - t * 0.02,
      fingerIndex === 3 ? materials.edge : materials.carapace,
    );
    group.add(finger);
  }
  for (let hookIndex = 0; hookIndex < 5; hookIndex += 1) {
    const hook = makeMesh(new THREE.ConeGeometry(0.07, 0.48, 8, 2), materials.edge);
    const t = (hookIndex + 1) / 6;
    hook.position.set(side * span * (1 - t * 0.7), THREE.MathUtils.lerp(rise, -0.52, t), 0);
    hook.rotation.z = side * (Math.PI / 2 + 0.25);
    group.add(hook);
  }
  return group;
}

function createWingGeometry(side: number, pair = 0): THREE.BufferGeometry {
  const span = pair === 0 ? 1.85 : 1.45;
  const vertices = new Float32Array([
    0,
    0,
    0,
    side * span * 0.48,
    0.18,
    -0.08,
    side * span,
    0.1,
    0.34 + pair * 0.12,
    0,
    0,
    0,
    side * span,
    0.1,
    0.34 + pair * 0.12,
    side * span * 0.74,
    -0.04,
    0.82 + pair * 0.18,
    0,
    0,
    0,
    side * span * 0.74,
    -0.04,
    0.82 + pair * 0.18,
    side * span * 0.24,
    -0.12,
    0.62 + pair * 0.16,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(
      new Float32Array([
        0, 0, 0.48, 0.12, 1, 0.32, 0, 0, 1, 0.32, 0.74, 0.9, 0, 0, 0.74, 0.9, 0.24, 0.7,
      ]),
      2,
    ),
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function createCarrot(): THREE.Group {
  const group = new THREE.Group();
  const carrotMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf18d32,
    emissive: 0x7a2b05,
    emissiveIntensity: 0.9,
    roughness: 0.42,
    clearcoat: 0.4,
  });
  const green = new THREE.MeshStandardMaterial({
    color: 0x5fbf69,
    roughness: 0.68,
    emissive: 0x113c16,
  });
  const body = makeMesh(new THREE.ConeGeometry(0.33, 1.35, 18, 3), carrotMaterial);
  body.position.y = 0.82;
  group.add(body);
  for (let index = 0; index < 5; index += 1) {
    const leaf = makeMesh(new THREE.ConeGeometry(0.075, 0.65, 7), green);
    leaf.position.set(Math.cos((index / 5) * TAU) * 0.13, 1.65, Math.sin((index / 5) * TAU) * 0.13);
    leaf.rotation.z = Math.cos((index / 5) * TAU) * 0.36;
    leaf.rotation.x = Math.sin((index / 5) * TAU) * 0.36;
    group.add(leaf);
  }
  const light = new THREE.PointLight(0xf3a24f, 9, 8, 2);
  light.position.y = 1;
  group.add(light);
  return group;
}

export function createSeal(index: number): SealRig {
  const root = new THREE.Group();
  const dormant = new THREE.MeshStandardMaterial({
    color: 0x392c23,
    roughness: 0.24,
    metalness: 0.86,
  });
  const energy = new THREE.MeshStandardMaterial({
    color: 0xff8955,
    emissive: 0xff3d17,
    emissiveIntensity: 2.5,
    roughness: 0.08,
  });
  const dais = makeMesh(new THREE.CylinderGeometry(2.2, 2.55, 0.38, 24), dormant);
  dais.position.y = 0.19;
  dais.receiveShadow = true;
  root.add(dais);
  const rings: THREE.Mesh[] = [];
  for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
    const ring = makeMesh(new THREE.TorusGeometry(1.25 + ringIndex * 0.34, 0.065, 8, 42), energy);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.43 + ringIndex * 0.035;
    root.add(ring);
    rings.push(ring);
  }
  const core = makeMesh(new THREE.OctahedronGeometry(0.5, 1), energy);
  core.position.y = 1.48;
  core.rotation.z = index * 0.45;
  root.add(core);
  const beam = makeMesh(
    new THREE.CylinderGeometry(0.06, 0.45, 12, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xff6740,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  beam.position.y = 6.25;
  root.add(beam);
  const light = new THREE.PointLight(0xff6038, 18, 14, 2);
  light.position.y = 1.5;
  root.add(light);
  return { root, core, rings, beam, light };
}

export function setSealState(seal: SealRig, state: 'dormant' | 'active' | 'broken'): void {
  seal.root.visible = state !== 'broken';
  const intensity = state === 'active' ? 4.4 : 0.55;
  seal.rings.forEach((ring) => {
    const material = ring.material;
    if (material instanceof THREE.MeshStandardMaterial) material.emissiveIntensity = intensity;
  });
  const coreMaterial = seal.core.material;
  if (coreMaterial instanceof THREE.MeshStandardMaterial)
    coreMaterial.emissiveIntensity = intensity;
  seal.light.intensity = state === 'active' ? 24 : 4;
  seal.light.userData.baseIntensity = seal.light.intensity;
  seal.beam.visible = state === 'active';
}

export function createExtraction(): ExtractionRig {
  const root = new THREE.Group();
  const beam = makeMesh(
    new THREE.CylinderGeometry(1.15, 3.5, 26, 28, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xb6e9ff,
      transparent: true,
      opacity: 0.17,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beam.position.y = 13;
  root.add(beam);
  const ring = makeMesh(
    new THREE.TorusGeometry(3.3, 0.09, 8, 56),
    new THREE.MeshBasicMaterial({ color: 0x9ddfff, transparent: true, opacity: 0.75 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.2;
  root.add(ring);
  const ship = new THREE.Group();
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0x39434b,
    roughness: 0.25,
    metalness: 0.9,
  });
  const cockpitMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x7ecce8,
    emissive: 0x143e5d,
    emissiveIntensity: 1.3,
    roughness: 0.08,
    metalness: 0.2,
    transmission: 0.15,
  });
  const hull = makeMesh(new THREE.CapsuleGeometry(0.8, 3.4, 8, 16), hullMaterial);
  hull.rotation.x = Math.PI / 2;
  ship.add(hull);
  const cockpit = makeMesh(new THREE.SphereGeometry(0.75, 16, 10), cockpitMaterial);
  cockpit.scale.set(0.78, 0.45, 1.2);
  cockpit.position.z = -1.42;
  ship.add(cockpit);
  for (const side of [-1, 1]) {
    const wing = makeMesh(new THREE.BoxGeometry(3.3, 0.12, 1.1), hullMaterial);
    wing.position.set(side * 1.58, -0.08, 0.35);
    wing.rotation.y = side * 0.12;
    ship.add(wing);
    const thruster = makeMesh(
      new THREE.CylinderGeometry(0.23, 0.3, 0.85, 12),
      new THREE.MeshStandardMaterial({ color: 0x191d21, emissive: 0x539cff, emissiveIntensity: 3 }),
    );
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(side * 1.25, 0, 1.72);
    ship.add(thruster);
  }
  ship.position.y = 17;
  ship.rotation.y = Math.PI;
  root.add(ship);
  const light = new THREE.PointLight(0x8ddcff, 28, 28, 1.5);
  light.position.y = 7;
  root.add(light);
  root.visible = false;
  return { root, beam, ship, light };
}

function createBeveledBox(
  width: number,
  height: number,
  depth: number,
  bevel: number,
): THREE.ExtrudeGeometry {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const radius = Math.min(bevel, halfWidth * 0.48, halfHeight * 0.48);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + radius, -halfHeight);
  shape.lineTo(halfWidth - radius, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
  shape.lineTo(halfWidth, halfHeight - radius);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
  shape.lineTo(-halfWidth + radius, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
  shape.lineTo(-halfWidth, -halfHeight + radius);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: Math.min(radius * 0.65, depth * 0.22),
    bevelThickness: Math.min(radius * 0.6, depth * 0.2),
    curveSegments: 3,
    steps: 1,
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function createContactShadow(): THREE.Mesh {
  const size = 96;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const dx = (x + 0.5) / size - 0.5;
      const dy = ((y + 0.5) / size - 0.5) * 1.55;
      const distance = Math.min(1, Math.hypot(dx, dy) * 2);
      const alpha = Math.pow(1 - distance, 2.35);
      pixels[offset] = 255;
      pixels[offset + 1] = 255;
      pixels[offset + 2] = 255;
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.NoColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    color: 0x020205,
    alphaMap: texture,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    toneMapped: false,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.35), material);
  shadow.name = 'Mark-contact-shadow';
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.018, 0.08);
  shadow.renderOrder = 1;
  shadow.castShadow = false;
  shadow.receiveShadow = false;
  return shadow;
}

function createArmorPlateGeometry(
  width: number,
  height: number,
  depth: number,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, height * 0.52);
  shape.lineTo(width * 0.46, height * 0.29);
  shape.lineTo(width * 0.5, -height * 0.24);
  shape.lineTo(width * 0.29, -height * 0.5);
  shape.lineTo(0, -height * 0.4);
  shape.lineTo(-width * 0.29, -height * 0.5);
  shape.lineTo(-width * 0.5, -height * 0.24);
  shape.lineTo(-width * 0.46, height * 0.29);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: Math.min(width, height) * 0.045,
    bevelThickness: depth * 0.2,
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function createCable(
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  return makeMesh(new THREE.TubeGeometry(curve, 22, radius, 7, false), material);
}

function batchDirectMeshesByMaterial(group: THREE.Group | THREE.Object3D): void {
  const batches = new Map<string, THREE.Mesh[]>();
  group.children.forEach((child) => {
    if (!(child instanceof THREE.Mesh) || child instanceof THREE.InstancedMesh) return;
    if (child.userData.noBatch === true || Array.isArray(child.material)) return;
    const batch = batches.get(child.material.uuid) ?? [];
    batch.push(child);
    batches.set(child.material.uuid, batch);
  });
  batches.forEach((meshes) => {
    if (meshes.length < 2) return;
    const transformed = meshes.map((mesh) => {
      mesh.updateMatrix();
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      return geometry.applyMatrix4(mesh.matrix);
    });
    const geometry = mergeGeometries(transformed, false);
    transformed.forEach((entry) => entry.dispose());
    if (!geometry) return;
    const material = meshes[0].material as THREE.Material;
    const combined = makeMesh(geometry, material);
    combined.name = `batched-${material.uuid.slice(0, 8)}`;
    combined.castShadow = meshes.some(
      (mesh) => mesh.castShadow && mesh.geometry.boundingSphere?.radius !== 0,
    );
    meshes.forEach((mesh) => group.remove(mesh));
    group.add(combined);
  });
}

function createInstancedDetail(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  transforms: Array<{
    position: THREE.Vector3;
    rotation?: THREE.Euler;
    scale?: THREE.Vector3;
  }>,
  name: string,
): THREE.InstancedMesh {
  const instanced = new THREE.InstancedMesh(geometry, material, transforms.length);
  instanced.name = name;
  instanced.castShadow = false;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const unitScale = new THREE.Vector3(1, 1, 1);
  transforms.forEach((transform, index) => {
    quaternion.setFromEuler(transform.rotation ?? new THREE.Euler());
    matrix.compose(transform.position, quaternion, transform.scale ?? unitScale);
    instanced.setMatrixAt(index, matrix);
  });
  instanced.instanceMatrix.needsUpdate = true;
  return instanced;
}

function createFurTuftShell(
  material: THREE.Material,
  count: number,
  radii: THREE.Vector3,
  seed: number,
  name = 'fur-silhouette',
  length = 0.048,
  thickness = 0.008,
): THREE.InstancedMesh {
  const geometry = new THREE.ConeGeometry(thickness, length, 5, 2);
  geometry.translate(0, length * 0.5, 0);
  const instanced = new THREE.InstancedMesh(geometry, material, count);
  instanced.name = name;
  instanced.castShadow = false;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const fiberDirection = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  for (let index = 0; index < count; index += 1) {
    const v = 1 - (2 * (index + 0.5)) / count;
    const radial = Math.sqrt(Math.max(0, 1 - v * v));
    const angle = index * 2.399963 + seed * 0.071;
    normal.set(Math.cos(angle) * radial, v, Math.sin(angle) * radial).normalize();
    const jitter = 0.92 + hashUnit(index, seed) * 0.15;
    position.set(normal.x * radii.x, normal.y * radii.y, normal.z * radii.z);
    position.multiplyScalar(jitter).addScaledVector(normal, 0.004);
    fiberDirection.copy(normal);
    fiberDirection.y -= 0.42;
    fiberDirection.normalize();
    quaternion.setFromUnitVectors(up, fiberDirection);
    const tuftScale = 0.56 + hashUnit(index * 3, seed + 9) * 0.56;
    scale.set(
      tuftScale * (0.82 + hashUnit(index * 11, seed + 3) * 0.3),
      tuftScale * (0.82 + hashUnit(index * 7, seed) * 0.38),
      tuftScale * (0.82 + hashUnit(index * 13, seed + 5) * 0.3),
    );
    matrix.compose(position, quaternion, scale);
    instanced.setMatrixAt(index, matrix);
    const shade = 0.68 + hashUnit(index * 17, seed + 23) * 0.18;
    color.setRGB(shade * 0.96, shade * 0.91, shade * 1.02);
    instanced.setColorAt(index, color);
  }
  instanced.instanceMatrix.needsUpdate = true;
  if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  return instanced;
}

function hashUnit(index: number, seed: number): number {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function makeMesh<TGeometry extends THREE.BufferGeometry, TMaterial extends THREE.Material>(
  geometry: TGeometry,
  material: TMaterial,
): THREE.Mesh<TGeometry, TMaterial> {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  return mesh;
}
