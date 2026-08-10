import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EffectsDirector } from '../../src/game/render/EffectsDirector';
import { EnemySystem } from '../../src/game/systems/EnemySystem';
import { SeededRandom } from '../../src/game/utils/SeededRandom';

function effectsStub(): EffectsDirector {
  return {
    burst: vi.fn(),
    pulse: vi.fn(),
  } as unknown as EffectsDirector;
}

function mockTextureLoading(): void {
  vi.spyOn(THREE.TextureLoader.prototype, 'load').mockReturnValue(new THREE.Texture());
}

afterEach(() => vi.restoreAllMocks());

describe('enemy arena constraints', () => {
  it('orbits a Regent around its authored spawn instead of world origin', () => {
    mockTextureLoading();
    const scene = new THREE.Scene();
    const enemies = new EnemySystem(scene, effectsStub(), 'normal', new SeededRandom(14));
    const boss = enemies.spawn('regent', new THREE.Vector3(0, 0, -15));
    boss.attackCooldown = 999;
    boss.phase = 0;

    enemies.update(0.5, 0, new THREE.Vector3(0, 0, 20), true);

    expect(boss.home.z).toBe(-15);
    expect(boss.rig.root.position.z).toBeLessThan(-12);
    enemies.dispose();
  });

  it('pushes ground enemies out of authored scenery collision volumes', () => {
    mockTextureLoading();
    const scene = new THREE.Scene();
    const obstacle = { center: new THREE.Vector3(4, 0, 3), radius: 3 };
    const enemies = new EnemySystem(
      scene,
      effectsStub(),
      'normal',
      new SeededRandom(22),
      [obstacle],
      20,
    );
    const actor = enemies.spawn('chainling', obstacle.center.clone());
    actor.stagger = 10;

    enemies.update(0.1, 0, new THREE.Vector3(0, 0, 0), true);

    const clearance =
      Math.hypot(
        actor.rig.root.position.x - obstacle.center.x,
        actor.rig.root.position.z - obstacle.center.z,
      ) -
      (obstacle.radius + actor.radius * 0.82);
    expect(clearance).toBeGreaterThan(-0.000_001);
    enemies.dispose();
  });
});
