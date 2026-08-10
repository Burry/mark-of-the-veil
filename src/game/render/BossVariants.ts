import * as THREE from 'three';
import type { ChapterEnvironmentId } from './ChapterScenery';

type BossVariantMotion =
  'breathe' | 'counter-spin' | 'hinge' | 'orbit' | 'pulse' | 'recoil' | 'spin' | 'sway';

interface BossVariantHookData {
  bossVariantHook: true;
  hookId: string;
  motion: BossVariantMotion;
  speed: number;
  amplitude: number;
  basePosition: [number, number, number];
  baseRotation: [number, number, number];
  baseScale: [number, number, number];
}

interface BossVariantMaterials {
  shell: THREE.MeshPhysicalMaterial;
  trim: THREE.MeshPhysicalMaterial;
  accent: THREE.MeshStandardMaterial;
  veil: THREE.MeshPhysicalMaterial;
  void: THREE.MeshStandardMaterial;
}

interface InstanceTransform {
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  scale?: readonly [number, number, number];
}

type VariantBuilder = (materials: BossVariantMaterials) => THREE.Group;

const VARIANT_BUILDERS: Record<ChapterEnvironmentId, VariantBuilder> = {
  'ashes-of-home': createStormglassHunter,
  'the-root-vault': createRootGaoler,
  'vespera-in-black': createSkybellSeraph,
  'the-drowned-cathedral': createHollowRegent,
  'the-silent-orbit': createGravityWidow,
  'the-memory-forge': createFalseMark,
  'crown-of-eidolon': createEidolonGate,
  'the-root-choir': createLastBoundary,
};

/**
 * Adds a chapter-specific silhouette kit to the shared Regent combat rig.
 * Attachments are self-contained, disposable, and tagged for future animation.
 */
export function applyBossVariant(
  root: THREE.Group,
  chapterId: ChapterEnvironmentId,
  accentColor: number,
): void {
  removeExistingVariant(root);

  const materials = createMaterials(chapterId, accentColor);
  const variant = VARIANT_BUILDERS[chapterId](materials);
  variant.name = `BossVariant-${chapterId}`;
  variant.userData.bossVariant = true;
  variant.userData.chapterId = chapterId;
  variant.userData.accentColor = accentColor;
  variant.userData.triangleBudget = 36_000;

  const animationHooks: string[] = [];
  variant.traverse((object) => {
    if (object.userData.bossVariantHook !== true) return;
    const hookData = object.userData as BossVariantHookData;
    hookData.basePosition = object.position.toArray();
    hookData.baseRotation = [object.rotation.x, object.rotation.y, object.rotation.z];
    hookData.baseScale = object.scale.toArray();
    animationHooks.push(hookData.hookId);
  });
  variant.userData.animationHooks = animationHooks;

  root.add(variant);
  root.userData.bossVariantChapterId = chapterId;
  root.userData.bossVariantAccentColor = accentColor;
  root.userData.bossVariantAnimationHooks = animationHooks;
}

export function animateBossVariant(root: THREE.Group, time: number): void {
  root.traverse((object) => {
    if (object.userData.bossVariantHook !== true) return;
    const hook = object.userData as BossVariantHookData;
    const phase = time * hook.speed;
    object.position.fromArray(hook.basePosition);
    object.rotation.set(...hook.baseRotation);
    object.scale.fromArray(hook.baseScale);

    if (hook.motion === 'spin' || hook.motion === 'counter-spin' || hook.motion === 'orbit') {
      const direction = hook.motion === 'counter-spin' ? -1 : 1;
      object.rotation.y += phase * direction;
      if (hook.motion === 'orbit') object.rotation.z += phase * direction * 0.38;
    } else if (hook.motion === 'hinge') {
      object.rotation.x += Math.sin(phase) * hook.amplitude * 0.08;
    } else if (hook.motion === 'breathe' || hook.motion === 'pulse') {
      const amount = 1 + Math.sin(phase) * Math.min(0.12, hook.amplitude * 0.025);
      object.scale.multiplyScalar(amount);
    } else if (hook.motion === 'recoil') {
      object.position.z += Math.max(0, Math.sin(phase)) * hook.amplitude * 0.045;
    } else if (hook.motion === 'sway') {
      object.rotation.z += Math.sin(phase) * hook.amplitude * 0.06;
    }
  });
}

function createStormglassHunter(materials: BossVariantMaterials): THREE.Group {
  const variant = createVariantGroup('stormglass-hunter', 'lance-predator');

  const lance = createHook('hunter-lance', 'recoil', 0.16, 9.2);
  lance.add(
    createStrut(
      new THREE.Vector3(0, 0.22, -1.25),
      new THREE.Vector3(0, 0.22, -4.15),
      0.13,
      materials.trim,
      'Stormglass-lance-spine',
    ),
  );
  const lanceTip = makeMesh(
    new THREE.ConeGeometry(0.28, 1.55, 7, 2),
    materials.accent,
    'Stormglass-lance-tip',
  );
  lanceTip.rotation.x = -Math.PI / 2;
  lanceTip.position.set(0, 0.22, -4.78);
  lance.add(lanceTip);
  variant.add(lance);

  const sensorFan = createHook('hunter-sensor-fan', 'hinge', 0.18, 1.6);
  const hornGeometry = new THREE.ConeGeometry(0.16, 2.55, 6, 1);
  sensorFan.add(
    createInstances(
      hornGeometry,
      materials.shell,
      [
        { position: [-1.2, 1.2, -1.65], rotation: [-0.58, 0, 1.02] },
        { position: [1.2, 1.2, -1.65], rotation: [-0.58, 0, -1.02] },
        { position: [-1.72, 0.72, -0.95], rotation: [-0.36, 0, 1.2], scale: [0.8, 1, 0.8] },
        { position: [1.72, 0.72, -0.95], rotation: [-0.36, 0, -1.2], scale: [0.8, 1, 0.8] },
      ],
      'Stormglass-swept-antlers',
    ),
  );
  variant.add(sensorFan);

  const dorsal = createHook('hunter-dorsal-array', 'pulse', 0.08, 2.3);
  const finGeometry = new THREE.ConeGeometry(0.19, 1.15, 5, 1);
  dorsal.add(
    createInstances(
      finGeometry,
      materials.accent,
      Array.from({ length: 7 }, (_, index) => ({
        position: [0, 1.35 + Math.sin((index / 6) * Math.PI) * 0.8, -0.65 + index * 0.55] as const,
        rotation: [0.18, 0, 0] as const,
        scale: [1 - Math.abs(index - 3) * 0.08, 1, 0.62] as const,
      })),
      'Stormglass-dorsal-fins',
    ),
  );
  variant.add(dorsal);

  const sight = makeMesh(
    new THREE.TorusGeometry(0.56, 0.075, 8, 32),
    materials.accent,
    'Stormglass-targeting-eye',
  );
  sight.position.set(0, 0.58, -2.02);
  sight.rotation.y = Math.PI / 2;
  variant.add(sight);
  return variant;
}

function createRootGaoler(materials: BossVariantMaterials): THREE.Group {
  const variant = createVariantGroup('root-gaoler', 'restraint-cage');
  const cage = createHook('gaoler-cage', 'breathe', 0.14, 1.15);

  const postGeometry = new THREE.CylinderGeometry(0.16, 0.24, 6.8, 8, 1);
  cage.add(
    createInstances(
      postGeometry,
      materials.shell,
      [
        { position: [-2.15, 0.05, -0.72] },
        { position: [2.15, 0.05, -0.72] },
        { position: [-2.15, 0.05, 0.9] },
        { position: [2.15, 0.05, 0.9] },
      ],
      'Gaoler-restraint-posts',
    ),
  );
  for (const y of [-2.72, 0.55, 3.12]) {
    cage.add(
      createStrut(
        new THREE.Vector3(-2.18, y, -0.76),
        new THREE.Vector3(2.18, y, -0.76),
        0.15,
        materials.trim,
        `Gaoler-crossbar-${y}`,
      ),
    );
  }
  const crownRing = makeMesh(
    new THREE.TorusGeometry(2.18, 0.18, 9, 48),
    materials.trim,
    'Gaoler-crown-clamp',
  );
  crownRing.rotation.x = Math.PI / 2;
  crownRing.position.y = 2.85;
  cage.add(crownRing);
  variant.add(cage);

  const shackles = createHook('gaoler-shackles', 'sway', 0.24, 1.35);
  for (const side of [-1, 1]) {
    const chainTransforms: InstanceTransform[] = Array.from({ length: 6 }, (_, index) => ({
      position: [side * 1.62, -1.25 - index * 0.43, 0.22],
      rotation: [Math.PI / 2, index % 2 ? Math.PI / 2 : 0, 0],
      scale: [0.72, 0.72, 0.72],
    }));
    shackles.add(
      createInstances(
        new THREE.TorusGeometry(0.24, 0.06, 6, 14),
        materials.trim,
        chainTransforms,
        `Gaoler-chain-${side < 0 ? 'left' : 'right'}`,
      ),
    );
    const cuff = makeMesh(
      new THREE.TorusGeometry(0.54, 0.14, 8, 24),
      materials.accent,
      `Gaoler-cuff-${side < 0 ? 'left' : 'right'}`,
    );
    cuff.position.set(side * 1.62, -3.86, 0.22);
    cuff.rotation.x = Math.PI / 2;
    shackles.add(cuff);
  }
  variant.add(shackles);

  const spikeTransforms: InstanceTransform[] = Array.from({ length: 7 }, (_, index) => ({
    position: [-1.72 + index * 0.57, -3.18, -1.08],
    rotation: [0, 0, Math.PI],
    scale: [0.85, 1 + (index % 2) * 0.28, 0.85],
  }));
  variant.add(
    createInstances(
      new THREE.ConeGeometry(0.16, 1.2, 7, 1),
      materials.shell,
      spikeTransforms,
      'Gaoler-portcullis-teeth',
    ),
  );
  return variant;
}

function createSkybellSeraph(materials: BossVariantMaterials): THREE.Group {
  const variant = createVariantGroup('skybell-seraph', 'winged-bell');

  const bell = createHook('seraph-bell', 'sway', 0.12, 1.7);
  const bellBody = makeMesh(
    new THREE.CylinderGeometry(0.68, 1.46, 2.15, 20, 3, true),
    materials.shell,
    'Seraph-resonance-bell',
  );
  bellBody.position.y = -1.35;
  bell.add(bellBody);
  const bellLip = makeMesh(
    new THREE.TorusGeometry(1.46, 0.13, 8, 40),
    materials.trim,
    'Seraph-bell-lip',
  );
  bellLip.rotation.x = Math.PI / 2;
  bellLip.position.y = -2.43;
  bell.add(bellLip);
  bell.add(
    createStrut(
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(0, -2.85, 0),
      0.075,
      materials.accent,
      'Seraph-clapper-stem',
    ),
  );
  const clapper = makeMesh(
    new THREE.IcosahedronGeometry(0.28, 1),
    materials.accent,
    'Seraph-clapper',
  );
  clapper.position.y = -2.98;
  bell.add(clapper);
  variant.add(bell);

  for (const side of [-1, 1]) {
    const wing = createHook(`seraph-wing-${side < 0 ? 'left' : 'right'}`, 'hinge', 0.2, 2.15);
    wing.position.set(side * 0.46, 0.38, 0.32);
    const feathers: InstanceTransform[] = Array.from({ length: 6 }, (_, index) => {
      const angle = THREE.MathUtils.lerp(0.3, 1.28, index / 5);
      return {
        position: [side * (1.2 + index * 0.72), 0.55 + Math.sin(angle) * 1.7, index * 0.13],
        rotation: [0.08 * index, 0, side * (-Math.PI / 2 + angle * 0.52)],
        scale: [1 - index * 0.055, 1.2 - index * 0.035, 0.72],
      };
    });
    wing.add(
      createInstances(
        new THREE.ConeGeometry(0.28, 2.35, 5, 1),
        indexMaterial(side, materials),
        feathers,
        `Seraph-blade-feathers-${side < 0 ? 'left' : 'right'}`,
      ),
    );
    variant.add(wing);
  }

  const halo = createHook('seraph-halo', 'spin', 0.38, 0.42);
  const haloMesh = makeMesh(
    new THREE.TorusGeometry(1.42, 0.1, 9, 48),
    materials.accent,
    'Seraph-signal-halo',
  );
  haloMesh.position.y = 2.54;
  halo.add(haloMesh);
  variant.add(halo);
  return variant;
}

function createHollowRegent(materials: BossVariantMaterials): THREE.Group {
  const variant = createVariantGroup('hollow-regent', 'cathedral-organ');
  const organ = createHook('regent-organ', 'breathe', 0.1, 0.88);

  const pipeTransforms: InstanceTransform[] = Array.from({ length: 11 }, (_, index) => {
    const offset = index - 5;
    const height = 2.25 + (5 - Math.abs(offset)) * 0.52;
    return {
      position: [offset * 0.47, 0.45 + height * 0.5, 0.78 + Math.abs(offset) * 0.05],
      scale: [0.82 + (index % 2) * 0.16, height / 4.85, 0.82 + (index % 2) * 0.16],
    };
  });
  organ.add(
    createInstances(
      new THREE.CylinderGeometry(0.13, 0.19, 4.85, 8, 1),
      materials.shell,
      pipeTransforms,
      'Regent-organ-pipes',
    ),
  );
  organ.add(
    createInstances(
      new THREE.ConeGeometry(0.2, 0.85, 7, 1),
      materials.trim,
      pipeTransforms.map((_, index) => {
        const offset = index - 5;
        const height = 2.25 + (5 - Math.abs(offset)) * 0.52;
        return {
          position: [offset * 0.47, 0.88 + height, 0.78 + Math.abs(offset) * 0.05],
          scale: [0.82 + (index % 2) * 0.16, 0.9, 0.82 + (index % 2) * 0.16],
        };
      }),
      'Regent-organ-spires',
    ),
  );
  variant.add(organ);

  const crown = createHook('regent-crown', 'hinge', 0.11, 1.02);
  for (const radius of [1.65, 2.14, 2.62]) {
    const arch = makeMesh(
      new THREE.TorusGeometry(radius, 0.08, 7, 36, Math.PI),
      radius === 2.14 ? materials.accent : materials.trim,
      `Regent-flying-buttress-${radius}`,
    );
    arch.position.y = 0.42;
    crown.add(arch);
  }
  variant.add(crown);

  const mantle = makeMesh(createMantleGeometry(3.4, 4.2), materials.veil, 'Regent-mourning-mantle');
  mantle.position.set(0, 0.58, 1.02);
  variant.add(mantle);
  return variant;
}

function createGravityWidow(materials: BossVariantMaterials): THREE.Group {
  const variant = createVariantGroup('gravity-widow', 'orbital-orrery');
  const ringData: ReadonlyArray<{
    radius: number;
    rotation: readonly [number, number, number];
    motion: BossVariantMotion;
  }> = [
    { radius: 4.12, rotation: [0.18, 0.42, 0.1], motion: 'spin' },
    { radius: 3.48, rotation: [Math.PI / 2, 0.28, 0.54], motion: 'counter-spin' },
    { radius: 2.76, rotation: [0.72, Math.PI / 2, 0.24], motion: 'orbit' },
  ];
  ringData.forEach(({ radius, rotation, motion }, index) => {
    const hook = createHook(
      `widow-orbit-${index + 1}`,
      motion,
      0.42 - index * 0.08,
      0.34 + index * 0.12,
    );
    hook.rotation.set(...rotation);
    const ring = makeMesh(
      new THREE.TorusGeometry(radius, 0.105 + index * 0.018, 8, 64),
      index === 1 ? materials.accent : materials.trim,
      `Widow-gravity-ring-${index + 1}`,
    );
    hook.add(ring);
    variant.add(hook);
  });

  const pods = createHook('widow-gravity-pods', 'orbit', 0.34, 0.52);
  pods.add(
    createInstances(
      new THREE.IcosahedronGeometry(0.38, 1),
      materials.shell,
      Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return {
          position: [Math.cos(angle) * 4.12, Math.sin(angle) * 4.12, 0.18],
          rotation: [angle * 0.5, angle, angle],
          scale: [1, 1.55, 0.72],
        };
      }),
      'Widow-orbital-eggs',
    ),
  );
  variant.add(pods);

  const lens = makeMesh(
    new THREE.SphereGeometry(1.08, 24, 16),
    materials.void,
    'Widow-gravity-lens',
  );
  lens.scale.z = 0.22;
  lens.position.z = -1.42;
  variant.add(lens);
  return variant;
}

function createFalseMark(materials: BossVariantMaterials): THREE.Group {
  const variant = createVariantGroup('false-mark', 'counterfeit-unicorn');
  const shoulders = createHook('false-mark-shoulders', 'breathe', 0.08, 1.35);
  const shoulderGeometry = new THREE.IcosahedronGeometry(0.72, 1);
  shoulders.add(
    createInstances(
      shoulderGeometry,
      materials.shell,
      [
        { position: [-1.34, 1.44, -0.16], scale: [1.36, 0.72, 0.88] },
        { position: [1.34, 1.44, -0.16], scale: [1.36, 0.72, 0.88] },
      ],
      'False-Mark-pauldrons',
    ),
  );
  shoulders.add(
    createStrut(
      new THREE.Vector3(-1.32, 1.4, 0),
      new THREE.Vector3(1.32, 1.4, 0),
      0.25,
      materials.trim,
      'False-Mark-shoulder-yoke',
    ),
  );
  variant.add(shoulders);

  const mask = makeMesh(
    new THREE.IcosahedronGeometry(0.7, 2),
    materials.shell,
    'False-Mark-unicorn-mask',
  );
  mask.scale.set(0.76, 0.9, 1.18);
  mask.position.set(0, 2.14, -0.72);
  variant.add(mask);
  const horn = makeMesh(
    new THREE.ConeGeometry(0.2, 2.45, 10, 5),
    materials.accent,
    'False-Mark-horn',
  );
  horn.position.set(0, 3.5, -1.02);
  horn.rotation.x = -0.24;
  variant.add(horn);

  const limbs = createHook('false-mark-limbs', 'sway', 0.1, 1.05);
  for (const side of [-1, 1]) {
    limbs.add(
      createStrut(
        new THREE.Vector3(side * 1.36, 1.25, -0.05),
        new THREE.Vector3(side * 1.94, -0.9, -0.34),
        0.25,
        materials.shell,
        `False-Mark-upper-arm-${side}`,
      ),
    );
    limbs.add(
      createStrut(
        new THREE.Vector3(side * 1.94, -0.9, -0.34),
        new THREE.Vector3(side * 1.52, -2.72, -0.7),
        0.21,
        materials.trim,
        `False-Mark-forearm-${side}`,
      ),
    );
    limbs.add(
      createStrut(
        new THREE.Vector3(side * 0.52, -0.35, 0.08),
        new THREE.Vector3(side * 0.66, -2.35, 0.12),
        0.32,
        materials.shell,
        `False-Mark-thigh-${side}`,
      ),
    );
    limbs.add(
      createStrut(
        new THREE.Vector3(side * 0.66, -2.35, 0.12),
        new THREE.Vector3(side * 0.82, -4.0, -0.62),
        0.25,
        materials.trim,
        `False-Mark-shin-${side}`,
      ),
    );
    const hoof = makeMesh(
      new THREE.SphereGeometry(0.38, 14, 9),
      materials.void,
      `False-Mark-hoof-${side}`,
    );
    hoof.scale.set(1.05, 0.52, 1.55);
    hoof.position.set(side * 0.82, -4.13, -0.88);
    limbs.add(hoof);
  }
  variant.add(limbs);

  const weapon = createHook('false-mark-sunlance', 'recoil', 0.13, 8.4);
  weapon.add(
    createStrut(
      new THREE.Vector3(0.7, -0.42, -0.82),
      new THREE.Vector3(0.7, -0.42, -4.26),
      0.16,
      materials.trim,
      'False-Mark-counterfeit-Sunlance',
    ),
  );
  const muzzle = makeMesh(
    new THREE.TorusGeometry(0.28, 0.08, 7, 20),
    materials.accent,
    'False-Mark-Sunlance-muzzle',
  );
  muzzle.rotation.y = Math.PI / 2;
  muzzle.position.set(0.7, -0.42, -4.24);
  weapon.add(muzzle);
  variant.add(weapon);
  return variant;
}

function createEidolonGate(materials: BossVariantMaterials): THREE.Group {
  const variant = createVariantGroup('eidolon-gate', 'monolithic-portal');
  const gate = createHook('eidolon-gate', 'pulse', 0.08, 0.74);
  const pylonGeometry = new THREE.BoxGeometry(0.76, 7.2, 0.82, 2, 7, 2);
  gate.add(
    createInstances(
      pylonGeometry,
      materials.shell,
      [
        { position: [-3.15, 0.05, 0.52], rotation: [0, 0.08, -0.025] },
        { position: [3.15, 0.05, 0.52], rotation: [0, -0.08, 0.025] },
      ],
      'Eidolon-gate-pylons',
    ),
  );
  const arch = makeMesh(
    new THREE.TorusGeometry(3.16, 0.38, 10, 56, Math.PI),
    materials.trim,
    'Eidolon-crown-arch',
  );
  arch.position.set(0, 3.62, 0.52);
  gate.add(arch);
  const crownSpikes: InstanceTransform[] = Array.from({ length: 9 }, (_, index) => {
    const angle = (index / 8) * Math.PI;
    return {
      position: [Math.cos(angle) * 3.17, 3.62 + Math.sin(angle) * 3.17, 0.52],
      rotation: [0, 0, angle - Math.PI / 2],
      scale: [0.75, 0.8 + Math.sin(angle) * 0.72, 0.75],
    };
  });
  gate.add(
    createInstances(
      new THREE.ConeGeometry(0.2, 1.18, 6, 1),
      materials.accent,
      crownSpikes,
      'Eidolon-crown-keys',
    ),
  );
  variant.add(gate);

  const portal = createHook('eidolon-portal', 'counter-spin', 0.5, 0.32);
  const outer = makeMesh(
    new THREE.TorusGeometry(1.62, 0.13, 8, 48),
    materials.accent,
    'Eidolon-portal-ring',
  );
  outer.position.set(0, 0.92, -0.72);
  portal.add(outer);
  const iris = makeMesh(
    new THREE.RingGeometry(0.28, 1.32, 32, 3),
    materials.veil,
    'Eidolon-portal-iris',
    false,
  );
  iris.position.set(0, 0.92, -0.68);
  portal.add(iris);
  variant.add(portal);
  return variant;
}

function createLastBoundary(materials: BossVariantMaterials): THREE.Group {
  const variant = createVariantGroup('the-last-i', 'split-boundary');
  const axis = createHook('last-i-axis', 'pulse', 0.06, 0.62);
  axis.add(
    createStrut(
      new THREE.Vector3(0, -4.35, 0.4),
      new THREE.Vector3(0, 5.1, 0.4),
      0.18,
      materials.accent,
      'Last-I-luminous-axis',
    ),
  );
  axis.add(
    createStrut(
      new THREE.Vector3(-2.48, 4.82, 0.4),
      new THREE.Vector3(2.48, 4.82, 0.4),
      0.22,
      materials.trim,
      'Last-I-crown-bar',
    ),
  );
  axis.add(
    createStrut(
      new THREE.Vector3(-2.48, -4.08, 0.4),
      new THREE.Vector3(2.48, -4.08, 0.4),
      0.22,
      materials.trim,
      'Last-I-root-bar',
    ),
  );
  variant.add(axis);

  for (const side of [-1, 1]) {
    const half = createHook(
      `last-i-half-${side < 0 ? 'left' : 'right'}`,
      side < 0 ? 'hinge' : 'counter-spin',
      0.12,
      0.48,
    );
    const crescent = makeMesh(
      new THREE.TorusGeometry(3.15, 0.13, 8, 42, Math.PI * 1.12),
      side < 0 ? materials.shell : materials.trim,
      `Last-I-broken-halo-${side}`,
    );
    crescent.rotation.z = side < 0 ? Math.PI * 0.44 : -Math.PI * 0.56;
    crescent.position.set(side * 0.24, 0.54, 0.72);
    half.add(crescent);
    variant.add(half);
  }

  const roots = createHook('last-i-roots', 'sway', 0.2, 0.82);
  const rootTransforms: InstanceTransform[] = Array.from({ length: 12 }, (_, index) => {
    const side = index < 6 ? -1 : 1;
    const rank = index % 6;
    return {
      position: [side * (0.48 + rank * 0.62), -3.88 + rank * 0.12, 0.52 + rank * 0.05],
      rotation: [0.12 * rank, 0, side * (0.58 + rank * 0.1)],
      scale: [0.55 + rank * 0.05, 0.72 + rank * 0.11, 0.55 + rank * 0.05],
    };
  });
  roots.add(
    createInstances(
      new THREE.ConeGeometry(0.13, 2.35, 6, 1),
      materials.shell,
      rootTransforms,
      'Last-I-root-filaments',
    ),
  );
  variant.add(roots);

  const voidCore = makeMesh(
    new THREE.SphereGeometry(0.78, 20, 14),
    materials.void,
    'Last-I-absence',
  );
  voidCore.scale.z = 0.18;
  voidCore.position.set(0, 0.45, -1.5);
  variant.add(voidCore);
  return variant;
}

function createVariantGroup(silhouette: string, archetype: string): THREE.Group {
  const group = new THREE.Group();
  group.userData.silhouette = silhouette;
  group.userData.archetype = archetype;
  return group;
}

function createHook(
  hookId: string,
  motion: BossVariantMotion,
  amplitude: number,
  speed: number,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `BossHook-${hookId}`;
  group.userData = {
    bossVariantHook: true,
    hookId,
    motion,
    amplitude,
    speed,
    basePosition: [0, 0, 0],
    baseRotation: [0, 0, 0],
    baseScale: [1, 1, 1],
  } satisfies BossVariantHookData;
  return group;
}

function createMaterials(
  chapterId: ChapterEnvironmentId,
  accentColor: number,
): BossVariantMaterials {
  const accent = new THREE.Color(accentColor);
  const shellColor = accent.clone().lerp(new THREE.Color(0x08090d), 0.82);
  const trimColor = accent.clone().lerp(new THREE.Color(0x242832), 0.62);
  const shell = new THREE.MeshPhysicalMaterial({
    color: shellColor,
    roughness: 0.42,
    metalness: 0.58,
    clearcoat: 0.46,
    clearcoatRoughness: 0.26,
    iridescence: 0.18,
    envMapIntensity: 1.18,
  });
  const trim = new THREE.MeshPhysicalMaterial({
    color: trimColor,
    roughness: 0.28,
    metalness: 0.88,
    clearcoat: 0.32,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.32,
  });
  const emissive = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 2.8,
    roughness: 0.24,
    metalness: 0.46,
  });
  const veil = new THREE.MeshPhysicalMaterial({
    color: accent.clone().lerp(new THREE.Color(0x0b0b14), 0.48),
    emissive: accent,
    emissiveIntensity: 0.38,
    roughness: 0.36,
    metalness: 0.12,
    transmission: 0.08,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const voidMaterial = new THREE.MeshStandardMaterial({
    color: 0x020205,
    emissive: accent.clone().multiplyScalar(0.12),
    emissiveIntensity: 0.8,
    roughness: 0.08,
    metalness: 0.92,
  });
  shell.name = `BossVariant-${chapterId}-shell`;
  trim.name = `BossVariant-${chapterId}-trim`;
  emissive.name = `BossVariant-${chapterId}-accent`;
  veil.name = `BossVariant-${chapterId}-veil`;
  voidMaterial.name = `BossVariant-${chapterId}-void`;
  [shell, trim, emissive, veil, voidMaterial].forEach((material) => {
    material.userData.bossVariantMaterial = true;
    material.userData.chapterId = chapterId;
  });
  return { shell, trim, accent: emissive, veil, void: voidMaterial };
}

function makeMesh<TGeometry extends THREE.BufferGeometry, TMaterial extends THREE.Material>(
  geometry: TGeometry,
  material: TMaterial,
  name: string,
  shadows = true,
): THREE.Mesh<TGeometry, TMaterial> {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  mesh.userData.bossVariantAttachment = true;
  return mesh;
}

function createInstances(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  transforms: readonly InstanceTransform[],
  name: string,
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  transforms.forEach((transform, index) => {
    position.set(...transform.position);
    rotation.set(...(transform.rotation ?? [0, 0, 0]));
    quaternion.setFromEuler(rotation);
    scale.set(...(transform.scale ?? [1, 1, 1]));
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.bossVariantAttachment = true;
  return mesh;
}

function createStrut(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  name: string,
): THREE.Mesh {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const strut = makeMesh(
    new THREE.CylinderGeometry(radius, radius * 0.88, length, 8, 1),
    material,
    name,
  );
  strut.position.copy(start).add(end).multiplyScalar(0.5);
  strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return strut;
}

function createMantleGeometry(width: number, height: number): THREE.BufferGeometry {
  const halfWidth = width * 0.5;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        -halfWidth,
        height * 0.45,
        0,
        halfWidth,
        height * 0.45,
        0,
        halfWidth * 0.72,
        -height * 0.55,
        0,
        0,
        -height * 0.38,
        -0.18,
        -halfWidth * 0.72,
        -height * 0.55,
        0,
      ],
      3,
    ),
  );
  geometry.setIndex([0, 1, 3, 0, 3, 4, 1, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

function indexMaterial(side: number, materials: BossVariantMaterials): THREE.Material {
  return side < 0 ? materials.shell : materials.trim;
}

function removeExistingVariant(root: THREE.Group): void {
  const existing = root.children.filter((child) => child.userData.bossVariant === true);
  existing.forEach((variant) => {
    root.remove(variant);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    variant.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      meshMaterials.forEach((material) => materials.add(material));
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  });
}
