import * as THREE from 'three';

export type EnemyKind = 'chainling' | 'needlewing' | 'heavy' | 'regent';

export interface EnemyRig {
  root: THREE.Group;
  core: THREE.Object3D;
  limbs: THREE.Object3D[];
  wings: THREE.Object3D[];
  glowMaterials: THREE.MeshStandardMaterial[];
}

export interface EnemyActor {
  id: number;
  kind: EnemyKind;
  rig: EnemyRig;
  home: THREE.Vector3;
  health: number;
  maxHealth: number;
  radius: number;
  speed: number;
  attackCooldown: number;
  stagger: number;
  age: number;
  phase: number;
  summonStage: number;
  alive: boolean;
}

export interface HostileProjectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  radius: number;
  age: number;
  lifetime: number;
  alive: boolean;
}

export interface HitResult {
  enemy: EnemyActor;
  point: THREE.Vector3;
  critical: boolean;
  distance: number;
}

export interface EnemyDamageResult {
  killed: boolean;
  bossKilled: boolean;
  position: THREE.Vector3;
  kind: EnemyKind;
}

export interface EnemyFrameResult {
  damage: number;
  damageOrigins: THREE.Vector3[];
  attacks: THREE.Vector3[];
  spawned: EnemyKind[];
}
