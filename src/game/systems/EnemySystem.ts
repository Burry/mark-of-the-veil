import * as THREE from 'three';
import type { Difficulty } from '../types/GameTypes';
import { createEnemyRig } from '../render/ActorFactory';
import type { EffectsDirector } from '../render/EffectsDirector';
import type {
  EnemyActor,
  EnemyDamageResult,
  EnemyFrameResult,
  EnemyKind,
  HitResult,
  HostileProjectile,
} from './WorldTypes';
import { SeededRandom } from '../utils/SeededRandom';
import {
  circlePushOut,
  clamp,
  distanceToRay,
  disposeObject,
  shortestAngleDifference,
  TAU,
} from '../utils/math';

interface DifficultyProfile {
  health: number;
  damage: number;
  speed: number;
  fireRate: number;
}

const DIFFICULTY: Record<Difficulty, DifficultyProfile> = {
  story: { health: 0.74, damage: 0.58, speed: 0.84, fireRate: 0.78 },
  normal: { health: 1, damage: 1, speed: 1, fireRate: 1 },
  nightmare: { health: 1.34, damage: 1.42, speed: 1.14, fireRate: 1.25 },
};

const ENEMY_STATS: Record<EnemyKind, { health: number; radius: number; speed: number }> = {
  chainling: { health: 54, radius: 0.86, speed: 5.0 },
  needlewing: { health: 72, radius: 1.05, speed: 4.3 },
  heavy: { health: 250, radius: 1.55, speed: 2.3 },
  regent: { health: 1_350, radius: 2.1, speed: 2.1 },
};

export class EnemySystem {
  private readonly enemies: EnemyActor[] = [];
  private readonly projectiles: HostileProjectile[] = [];
  private readonly profile: DifficultyProfile;
  private nextId = 1;
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly effects: EffectsDirector,
    difficulty: Difficulty,
    private readonly random: SeededRandom,
    private readonly obstacles: ReadonlyArray<{ center: THREE.Vector3; radius: number }> = [],
    private readonly playRadius = 38,
  ) {
    this.profile = DIFFICULTY[difficulty];
  }

  spawn(kind: EnemyKind, position: THREE.Vector3): EnemyActor {
    const stats = ENEMY_STATS[kind];
    const rig = createEnemyRig(kind);
    rig.root.position.copy(position);
    if (kind === 'regent') rig.root.position.y = 6.2;
    if (kind === 'needlewing') rig.root.position.y = Math.max(3.7, position.y);
    rig.root.name = `${kind}-${this.nextId}`;
    this.scene.add(rig.root);
    const maxHealth = Math.round(stats.health * this.profile.health);
    const actor: EnemyActor = {
      id: this.nextId++,
      kind,
      rig,
      home: rig.root.position.clone(),
      health: maxHealth,
      maxHealth,
      radius: stats.radius,
      speed: stats.speed * this.profile.speed,
      attackCooldown: this.random.range(0.45, 1.2),
      stagger: 0,
      age: this.random.range(0, 4),
      phase: this.random.range(0, TAU),
      summonStage: 0,
      alive: true,
    };
    this.enemies.push(actor);
    return actor;
  }

  spawnWave(kinds: readonly EnemyKind[], center: THREE.Vector3, minimumRadius = 7.5): EnemyActor[] {
    return kinds.map((kind, index) => {
      const angle = (index / Math.max(1, kinds.length)) * TAU + this.random.range(-0.4, 0.4);
      const radius = minimumRadius + this.random.range(0, 5.5);
      _spawnPosition.set(
        center.x + Math.cos(angle) * radius,
        0,
        center.z + Math.sin(angle) * radius,
      );
      const arenaDistance = Math.hypot(_spawnPosition.x, _spawnPosition.z);
      const spawnRadius = Math.max(4, this.playRadius - 2);
      if (arenaDistance > spawnRadius) _spawnPosition.multiplyScalar(spawnRadius / arenaDistance);
      return this.spawn(kind, _spawnPosition.clone());
    });
  }

  update(
    delta: number,
    time: number,
    playerPosition: THREE.Vector3,
    invulnerable: boolean,
  ): EnemyFrameResult {
    const result: EnemyFrameResult = { damage: 0, damageOrigins: [], attacks: [], spawned: [] };
    const summons: Array<{ kind: EnemyKind; position: THREE.Vector3 }> = [];

    for (const actor of this.enemies) {
      if (!actor.alive) continue;
      actor.age += delta;
      actor.attackCooldown -= delta;
      actor.stagger = Math.max(0, actor.stagger - delta);
      if (actor.stagger <= 0) {
        if (actor.kind === 'chainling')
          this.updateChainling(actor, delta, playerPosition, result, invulnerable);
        else if (actor.kind === 'needlewing')
          this.updateNeedlewing(actor, delta, playerPosition, result);
        else if (actor.kind === 'heavy')
          this.updateHeavy(actor, delta, playerPosition, result, invulnerable);
        else this.updateRegent(actor, delta, time, playerPosition, result, summons);
      }
      this.animateActor(actor, time);
    }

    this.separateEnemies();
    this.constrainActorsToArena();
    summons.forEach(({ kind, position }) => {
      this.spawnWave([kind], position, 4.5);
      result.spawned.push(kind);
    });
    this.updateProjectiles(delta, playerPosition, invulnerable, result);
    return result;
  }

  acquireHit(origin: THREE.Vector3, direction: THREE.Vector3, aimAssist: number): HitResult | null {
    let best: HitResult | null = null;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.rig.core.getWorldPosition(_corePosition);
      const ray = distanceToRay(_corePosition, origin, direction);
      if (ray.along <= 0 || ray.along > 90) continue;
      const assistRadius =
        enemy.radius + clamp(aimAssist, 0, 1) * (enemy.kind === 'regent' ? 0.5 : 0.32);
      if (ray.distance > assistRadius) continue;
      const surfaceOffset = Math.sqrt(
        Math.max(0, assistRadius * assistRadius - ray.distance * ray.distance),
      );
      const distance = Math.max(0, ray.along - surfaceOffset);
      if (best && distance >= best.distance) continue;
      best = {
        enemy,
        point: origin.clone().addScaledVector(direction, distance),
        critical: ray.distance < enemy.radius * 0.28,
        distance,
      };
    }
    return best;
  }

  damage(enemy: EnemyActor, amount: number, critical = false): EnemyDamageResult {
    if (!enemy.alive) {
      return {
        killed: false,
        bossKilled: false,
        position: enemy.rig.root.position.clone(),
        kind: enemy.kind,
      };
    }
    const appliedDamage = amount * (critical ? 1.72 : 1);
    enemy.health = Math.max(0, enemy.health - appliedDamage);
    enemy.stagger = Math.max(enemy.stagger, critical ? 0.16 : 0.055);
    enemy.rig.core.getWorldPosition(_impactPosition);
    this.effects.burst(
      _impactPosition,
      critical ? 0xffd47a : 0xff6945,
      critical ? 22 : 11,
      critical ? 7 : 4.5,
    );
    enemy.rig.glowMaterials.forEach((material) => {
      material.emissiveIntensity = critical ? 8 : 5.4;
    });
    const killed = enemy.health <= 0;
    if (killed) this.killActor(enemy);
    return {
      killed,
      bossKilled: killed && enemy.kind === 'regent',
      position: _impactPosition.clone(),
      kind: enemy.kind,
    };
  }

  pulse(center: THREE.Vector3, radius: number, damage: number): EnemyDamageResult[] {
    const results: EnemyDamageResult[] = [];
    for (const enemy of [...this.enemies]) {
      if (!enemy.alive) continue;
      const distance = enemy.rig.root.position.distanceTo(center);
      if (distance > radius + enemy.radius) continue;
      const falloff = THREE.MathUtils.lerp(0.48, 1, 1 - clamp(distance / radius, 0, 1));
      enemy.stagger = enemy.kind === 'regent' ? 0.35 : 1.05;
      _away.subVectors(enemy.rig.root.position, center).setY(0);
      if (_away.lengthSq() > 0.001 && enemy.kind !== 'regent') {
        enemy.rig.root.position.addScaledVector(_away.normalize(), 1.3 * falloff);
      }
      results.push(this.damage(enemy, damage * falloff, false));
    }
    return results;
  }

  get count(): number {
    return this.enemies.reduce((total, enemy) => total + Number(enemy.alive), 0);
  }

  get regularCount(): number {
    return this.enemies.reduce(
      (total, enemy) => total + Number(enemy.alive && enemy.kind !== 'regent'),
      0,
    );
  }

  get boss(): EnemyActor | null {
    return this.enemies.find((enemy) => enemy.alive && enemy.kind === 'regent') ?? null;
  }

  clear(): void {
    this.enemies.splice(0).forEach((enemy) => {
      enemy.alive = false;
      enemy.rig.root.removeFromParent();
      disposeObject(enemy.rig.root);
    });
    this.projectiles.splice(0).forEach((projectile) => this.removeProjectile(projectile));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clear();
  }

  private updateChainling(
    actor: EnemyActor,
    delta: number,
    player: THREE.Vector3,
    result: EnemyFrameResult,
    invulnerable: boolean,
  ): void {
    const distance = horizontalDirection(actor.rig.root.position, player, _direction);
    faceDirection(actor.rig.root, _direction, delta * 10);
    if (distance > 1.65) {
      const sprint = distance > 8 ? 1.18 : 1;
      actor.rig.root.position.addScaledVector(_direction, actor.speed * sprint * delta);
    } else if (actor.attackCooldown <= 0) {
      actor.attackCooldown = this.random.range(1.0, 1.42) / this.profile.fireRate;
      actor.rig.root.position.addScaledVector(_direction, 0.62);
      result.attacks.push(actor.rig.root.position.clone());
      if (!invulnerable) {
        result.damage += 9 * this.profile.damage;
        result.damageOrigins.push(actor.rig.root.position.clone());
      }
    }
  }

  private updateNeedlewing(
    actor: EnemyActor,
    delta: number,
    player: THREE.Vector3,
    result: EnemyFrameResult,
  ): void {
    const root = actor.rig.root;
    const desiredHeight = 4.2 + Math.sin(actor.age * 1.7 + actor.phase) * 1.15;
    root.position.y = THREE.MathUtils.lerp(
      root.position.y,
      desiredHeight,
      1 - Math.exp(-delta * 2.6),
    );
    horizontalDirection(root.position, player, _direction);
    faceDirection(root, _direction, delta * 5);
    const distance = horizontalDistance(root.position, player);
    _strafe
      .set(-_direction.z, 0, _direction.x)
      .multiplyScalar(Math.sin(actor.age * 0.75 + actor.phase));
    if (distance > 12) root.position.addScaledVector(_direction, actor.speed * delta);
    else if (distance < 7) root.position.addScaledVector(_direction, -actor.speed * 0.7 * delta);
    root.position.addScaledVector(_strafe, actor.speed * 0.6 * delta);
    if (actor.attackCooldown <= 0 && distance < 28) {
      actor.attackCooldown = this.random.range(1.55, 2.15) / this.profile.fireRate;
      actor.rig.core.getWorldPosition(_corePosition);
      this.fireAt(_corePosition, player, 12.5, 8 * this.profile.damage, 0x58ffab, 0.18);
      result.attacks.push(_corePosition.clone());
    }
  }

  private updateHeavy(
    actor: EnemyActor,
    delta: number,
    player: THREE.Vector3,
    result: EnemyFrameResult,
    invulnerable: boolean,
  ): void {
    const distance = horizontalDirection(actor.rig.root.position, player, _direction);
    faceDirection(actor.rig.root, _direction, delta * 4.5);
    if (distance > 3.2) actor.rig.root.position.addScaledVector(_direction, actor.speed * delta);
    if (actor.attackCooldown > 0) return;
    if (distance <= 3.5) {
      actor.attackCooldown = 2.35 / this.profile.fireRate;
      this.effects.pulse(actor.rig.root.position, 3.7, 0xff5b38, 0.45);
      result.attacks.push(actor.rig.root.position.clone());
      if (!invulnerable) {
        result.damage += 22 * this.profile.damage;
        result.damageOrigins.push(actor.rig.root.position.clone());
      }
    } else if (distance < 25) {
      actor.attackCooldown = 2.1 / this.profile.fireRate;
      actor.rig.core.getWorldPosition(_corePosition);
      this.fireAt(_corePosition, player, 9, 16 * this.profile.damage, 0xff6b36, 0.28);
      result.attacks.push(_corePosition.clone());
    }
  }

  private updateRegent(
    actor: EnemyActor,
    delta: number,
    time: number,
    player: THREE.Vector3,
    result: EnemyFrameResult,
    summons: Array<{ kind: EnemyKind; position: THREE.Vector3 }>,
  ): void {
    const root = actor.rig.root;
    const healthRatio = actor.health / actor.maxHealth;
    const orbitRadius = healthRatio > 0.48 ? 9 : 12;
    _desired.set(
      actor.home.x + Math.cos(time * 0.16 + actor.phase) * orbitRadius,
      actor.home.y + Math.sin(time * 0.55) * 1.3,
      actor.home.z + Math.sin(time * 0.16 + actor.phase) * orbitRadius,
    );
    root.position.lerp(_desired, 1 - Math.exp(-delta * actor.speed * 0.34));
    root.rotation.y += delta * (0.45 + (1 - healthRatio) * 0.8);

    const healthStage = healthRatio < 0.3 ? 3 : healthRatio < 0.58 ? 2 : healthRatio < 0.82 ? 1 : 0;
    while (actor.summonStage < healthStage) {
      actor.summonStage += 1;
      summons.push({
        kind: actor.summonStage === 2 ? 'heavy' : 'chainling',
        position: root.position.clone().setY(0),
      });
      summons.push({ kind: 'needlewing', position: root.position.clone().setY(0) });
      this.effects.pulse(root.position, 8, 0xff3d25, 0.9);
    }

    if (actor.attackCooldown > 0) return;
    actor.rig.core.getWorldPosition(_corePosition);
    const pattern = Math.floor(actor.age * 0.4) % 3;
    if (pattern === 0) {
      for (let index = 0; index < 10; index += 1) {
        const angle = (index / 10) * TAU + time * 0.18;
        _projectileDirection.set(Math.cos(angle), -0.08, Math.sin(angle)).normalize();
        this.fireDirection(
          _corePosition,
          _projectileDirection,
          8.5,
          12 * this.profile.damage,
          0xff3d2a,
          0.26,
        );
      }
      actor.attackCooldown = 3.0 / this.profile.fireRate;
    } else {
      const shots = healthRatio < 0.5 ? 4 : 2;
      for (let index = 0; index < shots; index += 1) {
        _target
          .copy(player)
          .add(new THREE.Vector3(this.random.range(-1.2, 1.2), 1.0, this.random.range(-1.2, 1.2)));
        this.fireAt(
          _corePosition,
          _target,
          11.5 + index * 0.6,
          17 * this.profile.damage,
          0xff3d24,
          0.32,
        );
      }
      actor.attackCooldown = this.random.range(1.3, 1.85) / this.profile.fireRate;
    }
    result.attacks.push(_corePosition.clone());
  }

  private updateProjectiles(
    delta: number,
    player: THREE.Vector3,
    invulnerable: boolean,
    result: EnemyFrameResult,
  ): void {
    for (const projectile of this.projectiles) {
      if (!projectile.alive) continue;
      projectile.age += delta;
      projectile.mesh.position.addScaledVector(projectile.velocity, delta);
      projectile.mesh.rotation.x += delta * 4;
      projectile.mesh.rotation.y += delta * 6;
      if (projectile.mesh.position.y < -0.2 || projectile.age >= projectile.lifetime) {
        projectile.alive = false;
        continue;
      }
      _playerCenter.copy(player).setY(player.y + 1.25);
      if (
        projectile.mesh.position.distanceToSquared(_playerCenter) <=
        (projectile.radius + 0.7) ** 2
      ) {
        projectile.alive = false;
        this.effects.burst(projectile.mesh.position, 0xff4a2f, 14, 4.5);
        if (!invulnerable) {
          result.damage += projectile.damage;
          result.damageOrigins.push(projectile.mesh.position.clone());
        }
      }
    }
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      if (this.projectiles[index].alive) continue;
      const projectile = this.projectiles[index];
      this.projectiles.splice(index, 1);
      this.removeProjectile(projectile);
    }
  }

  private fireAt(
    origin: THREE.Vector3,
    target: THREE.Vector3,
    speed: number,
    damage: number,
    color: number,
    radius: number,
  ): void {
    _projectileDirection
      .copy(target)
      .setY(target.y + 1.1)
      .sub(origin)
      .normalize();
    this.fireDirection(origin, _projectileDirection, speed, damage, color, radius);
  }

  private fireDirection(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number,
    color: number,
    radius: number,
  ): void {
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 4.8,
      roughness: 0.05,
    });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 1), material);
    mesh.position.copy(origin);
    mesh.castShadow = false;
    this.scene.add(mesh);
    this.projectiles.push({
      mesh,
      velocity: direction.clone().multiplyScalar(speed),
      damage,
      radius,
      age: 0,
      lifetime: 7,
      alive: true,
    });
  }

  private animateActor(actor: EnemyActor, time: number): void {
    const cycle = time * (actor.kind === 'chainling' ? 9 : 4.5) + actor.phase;
    actor.rig.limbs.forEach((limb, index) => {
      if (actor.kind === 'regent') limb.rotation.x = Math.sin(cycle * 0.35 + index) * 0.18;
      else limb.rotation.x = Math.sin(cycle + index * 1.7) * (actor.kind === 'heavy' ? 0.22 : 0.48);
    });
    actor.rig.wings.forEach((wing, index) => {
      if (actor.kind === 'regent') {
        const baseRotation = Number(wing.userData.baseRotationZ ?? 0);
        wing.rotation.z = baseRotation + Math.sin(time * 1.7 + index * 1.83) * 0.085;
        wing.rotation.x = Math.sin(time * 1.15 + index * 0.91) * 0.045;
      } else wing.rotation.z = Math.sin(time * 12 + index * Math.PI) * 0.42;
    });
    const pulse = 1 + Math.sin(time * 5.4 + actor.phase) * 0.08;
    actor.rig.core.scale.setScalar(pulse);
    actor.rig.glowMaterials.forEach((material) => {
      material.emissiveIntensity += (4.1 - material.emissiveIntensity) * 0.08;
    });
    if (actor.kind === 'chainling') actor.rig.root.position.y = Math.abs(Math.sin(cycle)) * 0.08;
  }

  private constrainActorsToArena(): void {
    for (const actor of this.enemies) {
      if (!actor.alive) continue;
      const position = actor.rig.root.position;
      const radialDistance = Math.hypot(position.x, position.z);
      const maximumRadius = Math.max(2, this.playRadius - actor.radius);
      if (radialDistance > maximumRadius) {
        position.x *= maximumRadius / radialDistance;
        position.z *= maximumRadius / radialDistance;
      }
      this.obstacles.forEach((obstacle) =>
        circlePushOut(position, obstacle.center, obstacle.radius + actor.radius * 0.82),
      );
    }
  }

  private separateEnemies(): void {
    for (let firstIndex = 0; firstIndex < this.enemies.length; firstIndex += 1) {
      const first = this.enemies[firstIndex];
      if (!first.alive || first.kind === 'regent') continue;
      for (let secondIndex = firstIndex + 1; secondIndex < this.enemies.length; secondIndex += 1) {
        const second = this.enemies[secondIndex];
        if (!second.alive || second.kind === 'regent') continue;
        _separation.subVectors(first.rig.root.position, second.rig.root.position).setY(0);
        const minDistance = (first.radius + second.radius) * 0.62;
        const distanceSquared = _separation.lengthSq();
        if (distanceSquared >= minDistance * minDistance || distanceSquared < 0.0001) continue;
        const push = (minDistance - Math.sqrt(distanceSquared)) * 0.25;
        _separation.normalize().multiplyScalar(push);
        first.rig.root.position.add(_separation);
        second.rig.root.position.sub(_separation);
      }
    }
  }

  private killActor(actor: EnemyActor): void {
    actor.alive = false;
    actor.rig.root.getWorldPosition(_deathPosition);
    this.effects.burst(
      _deathPosition,
      actor.kind === 'needlewing' ? 0x5dffb0 : 0xff5034,
      actor.kind === 'regent' ? 80 : 34,
      8,
      3,
    );
    this.effects.pulse(
      _deathPosition,
      actor.kind === 'regent' ? 15 : 3.4,
      actor.kind === 'regent' ? 0xffe0bd : 0xff5435,
      0.72,
    );
    actor.rig.root.removeFromParent();
    disposeObject(actor.rig.root);
    const index = this.enemies.indexOf(actor);
    if (index >= 0) this.enemies.splice(index, 1);
  }

  private removeProjectile(projectile: HostileProjectile): void {
    projectile.mesh.removeFromParent();
    projectile.mesh.geometry.dispose();
    const material = projectile.mesh.material;
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else material.dispose();
  }
}

function horizontalDirection(
  from: THREE.Vector3,
  to: THREE.Vector3,
  result: THREE.Vector3,
): number {
  result.subVectors(to, from).setY(0);
  const distance = result.length();
  if (distance > 0.0001) result.multiplyScalar(1 / distance);
  return distance;
}

function horizontalDistance(first: THREE.Vector3, second: THREE.Vector3): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

function faceDirection(root: THREE.Object3D, direction: THREE.Vector3, amount: number): void {
  if (direction.lengthSq() < 0.001) return;
  const targetYaw = Math.atan2(-direction.x, -direction.z);
  root.rotation.y += shortestAngleDifference(root.rotation.y, targetYaw) * clamp(amount, 0, 1);
}

const _direction = new THREE.Vector3();
const _strafe = new THREE.Vector3();
const _corePosition = new THREE.Vector3();
const _impactPosition = new THREE.Vector3();
const _deathPosition = new THREE.Vector3();
const _spawnPosition = new THREE.Vector3();
const _projectileDirection = new THREE.Vector3();
const _playerCenter = new THREE.Vector3();
const _separation = new THREE.Vector3();
const _away = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _target = new THREE.Vector3();
