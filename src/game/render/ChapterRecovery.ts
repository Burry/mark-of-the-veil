import * as THREE from 'three';
import { createCarrot } from './ActorFactory';
import type { ChapterEnvironmentId } from './ChapterScenery';

export type RecoveryPropKind =
  'flight-recorder' | 'carrot-memory' | 'relay-key' | 'navigation-cell' | 'wayfarer-core';

const RECOVERY_KIND: Record<ChapterEnvironmentId, RecoveryPropKind> = {
  'ashes-of-home': 'flight-recorder',
  'the-root-vault': 'carrot-memory',
  'vespera-in-black': 'relay-key',
  'the-drowned-cathedral': 'carrot-memory',
  'the-silent-orbit': 'navigation-cell',
  'the-memory-forge': 'carrot-memory',
  'crown-of-eidolon': 'wayfarer-core',
  'the-root-choir': 'carrot-memory',
};

export function getRecoveryPropKind(chapterId: ChapterEnvironmentId): RecoveryPropKind {
  return RECOVERY_KIND[chapterId];
}

export function createChapterRecovery(chapterId: ChapterEnvironmentId): THREE.Group {
  const kind = getRecoveryPropKind(chapterId);
  const recovery =
    kind === 'carrot-memory'
      ? createCarrot()
      : kind === 'flight-recorder'
        ? createFlightRecorder()
        : kind === 'relay-key'
          ? createRelayKey()
          : kind === 'navigation-cell'
            ? createNavigationCell()
            : createWayfarerCore();
  recovery.name = `ChapterRecovery-${kind}`;
  recovery.userData.recoveryKind = kind;
  recovery.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  return recovery;
}

function createFlightRecorder(): THREE.Group {
  const root = new THREE.Group();
  const shell = physical(0x3b3029, 0.72, 0.46);
  const armor = physical(0xb84d28, 0.48, 0.34);
  const glass = luminous(0xff9f55, 2.8);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.76, 1.02, 3, 2, 3), shell);
  body.rotation.set(0.08, -0.22, -0.04);
  root.add(body);
  [-0.48, 0.48].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.93, 1.17), armor);
    rail.position.x = x;
    rail.rotation.copy(body.rotation);
    root.add(rail);
  });
  const memoryStrip = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.7), glass);
  memoryStrip.position.set(0, 0.43, 0);
  memoryStrip.rotation.y = -0.22;
  root.add(memoryStrip);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.9, 7), armor);
  antenna.position.set(0.54, 0.78, -0.3);
  antenna.rotation.z = -0.28;
  root.add(antenna);
  return root;
}

function createRelayKey(): THREE.Group {
  const root = new THREE.Group();
  const frame = physical(0x29333d, 0.8, 0.24);
  const signal = luminous(0x48dcff, 3.4);
  for (let side = 0; side < 3; side += 1) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.35, 0.18), frame);
    strut.position.set(
      Math.cos((side / 3) * Math.PI * 2) * 0.54,
      0.22,
      Math.sin((side / 3) * Math.PI * 2) * 0.54,
    );
    strut.rotation.z = Math.PI / 6;
    strut.rotation.y = -(side / 3) * Math.PI * 2;
    root.add(strut);
  }
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 1), signal);
  core.position.y = 0.2;
  root.add(core);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.06, 8, 28), frame);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.35;
  root.add(ring);
  return root;
}

function createNavigationCell(): THREE.Group {
  const root = new THREE.Group();
  const casing = physical(0x687483, 0.9, 0.2);
  const dark = physical(0x171d27, 0.64, 0.42);
  const charge = luminous(0x78e9ff, 3.8);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.55, 18), dark);
  body.rotation.z = Math.PI / 2;
  root.add(body);
  [-0.58, 0.58].forEach((x) => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.24, 18), casing);
    cap.position.x = x;
    cap.rotation.z = Math.PI / 2;
    root.add(cap);
  });
  for (let index = -2; index <= 2; index += 1) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 7, 20), charge);
    band.position.x = index * 0.24;
    band.rotation.y = Math.PI / 2;
    root.add(band);
  }
  return root;
}

function createWayfarerCore(): THREE.Group {
  const root = new THREE.Group();
  const armor = physical(0x2a3039, 0.88, 0.24);
  const worn = physical(0x715846, 0.72, 0.42);
  const heart = luminous(0xffae62, 4.2);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.58, 2), heart);
  root.add(core);
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.52, 0.27), armor);
    strut.position.set(Math.cos(angle) * 0.62, 0, Math.sin(angle) * 0.62);
    strut.rotation.set(Math.sin(angle) * 0.38, -angle, Math.cos(angle) * 0.38);
    root.add(strut);
    const contact = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 7), worn);
    contact.position.set(Math.cos(angle) * 1.02, 0, Math.sin(angle) * 1.02);
    contact.rotation.z = Math.PI / 2;
    contact.rotation.y = -angle;
    root.add(contact);
  }
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.055, 8, 32), worn);
  orbit.rotation.set(Math.PI / 2.8, 0.42, 0.12);
  root.add(orbit);
  return root;
}

function physical(color: number, metalness: number, roughness: number): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    clearcoat: 0.28,
    clearcoatRoughness: 0.34,
    envMapIntensity: 1.15,
  });
}

function luminous(color: number, emissiveIntensity: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity,
    metalness: 0.3,
    roughness: 0.18,
    toneMapped: false,
  });
}
