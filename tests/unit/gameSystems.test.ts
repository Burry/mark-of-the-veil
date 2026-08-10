import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { EncounterDirector } from '../../src/game/systems/EncounterDirector';
import { SeededRandom } from '../../src/game/utils/SeededRandom';
import {
  circlePushOut,
  clamp,
  damp,
  dampVector,
  distanceToRay,
  saturate,
  shortestAngleDifference,
} from '../../src/game/utils/math';

describe('SeededRandom', () => {
  it('replays an exact sequence after reset', () => {
    const random = new SeededRandom(123);
    const first = [random.next(), random.next(), random.next(), random.next()];

    expect(first).toEqual([
      0.7872516233474016, 0.1785435655619949, 0.49531551403924823, 0.23136196262203157,
    ]);

    random.reset(123);
    expect([random.next(), random.next(), random.next(), random.next()]).toEqual(first);
  });

  it('keeps range, integer, and sign helpers within their contracts', () => {
    const random = new SeededRandom(77);
    for (let index = 0; index < 100; index += 1) {
      const ranged = random.range(-4, 9);
      const integer = random.integer(2, 5);
      const sign = random.sign();
      expect(ranged).toBeGreaterThanOrEqual(-4);
      expect(ranged).toBeLessThan(9);
      expect(integer).toBeGreaterThanOrEqual(2);
      expect(integer).toBeLessThanOrEqual(5);
      expect([-1, 1]).toContain(sign);
    }
  });
});

describe('gameplay math', () => {
  it('clamps and saturates scalar values', () => {
    expect(clamp(-4, -1, 2)).toBe(-1);
    expect(clamp(1, -1, 2)).toBe(1);
    expect(clamp(7, -1, 2)).toBe(2);
    expect(saturate(-1)).toBe(0);
    expect(saturate(0.4)).toBe(0.4);
    expect(saturate(2)).toBe(1);
  });

  it('damps consistently when a time step is split', () => {
    const oneStep = damp(0, 10, 4, 1);
    const halfStep = damp(damp(0, 10, 4, 0.5), 10, 4, 0.5);
    expect(halfStep).toBeCloseTo(oneStep, 12);

    const oneVectorStep = dampVector(new THREE.Vector3(), new THREE.Vector3(6, -2, 9), 4, 1);
    const halfVectorStep = dampVector(
      dampVector(new THREE.Vector3(), new THREE.Vector3(6, -2, 9), 4, 0.5),
      new THREE.Vector3(6, -2, 9),
      4,
      0.5,
    );
    expect(halfVectorStep.distanceTo(oneVectorStep)).toBeLessThan(1e-10);
  });

  it('finds shortest wrapped angles and ray distances', () => {
    expect(shortestAngleDifference(Math.PI - 0.1, -Math.PI + 0.1)).toBeCloseTo(0.2);
    expect(shortestAngleDifference(-Math.PI + 0.1, Math.PI - 0.1)).toBeCloseTo(-0.2);

    const forward = distanceToRay(
      new THREE.Vector3(5, 3, 0),
      new THREE.Vector3(),
      new THREE.Vector3(1, 0, 0),
    );
    expect(forward.along).toBe(5);
    expect(forward.distance).toBe(3);

    const behind = distanceToRay(
      new THREE.Vector3(-2, 0, 0),
      new THREE.Vector3(),
      new THREE.Vector3(1, 0, 0),
    );
    expect(behind.along).toBe(-2);
    expect(behind.distance).toBe(2);
  });

  it('pushes overlapping circles to their collision boundary', () => {
    const position = new THREE.Vector3(1, 8, 0);
    circlePushOut(position, new THREE.Vector3(0, -5, 0), 2.5);
    expect(position.x).toBeCloseTo(2.5);
    expect(position.z).toBe(0);
    expect(position.y).toBe(8);

    const clear = new THREE.Vector3(4, 3, 0);
    circlePushOut(clear, new THREE.Vector3(), 2.5);
    expect(clear).toEqual(new THREE.Vector3(4, 3, 0));
  });
});

describe('EncounterDirector', () => {
  const seals = [
    new THREE.Vector3(10, 0, 0),
    new THREE.Vector3(20, 0, 0),
    new THREE.Vector3(30, 0, 0),
  ];
  const carrot = new THREE.Vector3(2, 0, 0);
  const extraction = new THREE.Vector3(40, 0, 0);

  it('runs the complete deterministic campaign progression', () => {
    const director = new EncounterDirector(seals, carrot, extraction);
    const player = new THREE.Vector3();

    expect(director.update(1, player, 0, true)).toEqual([{ type: 'carrot' }]);
    expect(director.phase).toBe('travel');

    seals.forEach((seal, sealIndex) => {
      player.copy(seal);
      const wave = director.update(0.1, player, 0, true);
      expect(wave).toHaveLength(1);
      expect(wave[0]).toMatchObject({ type: 'wave', index: sealIndex });
      expect(wave[0]?.type === 'wave' && wave[0].enemies.length).toBeGreaterThan(0);
      expect(director.phase).toBe('encounter');

      expect(director.update(0.7, player, 1, false)).toEqual([]);
      const clearEvents = director.update(0.01, player, 0, false);
      expect(clearEvents[0]).toEqual({ type: 'seal', index: sealIndex });
      if (sealIndex < seals.length - 1) {
        expect(director.phase).toBe('travel');
      } else {
        expect(clearEvents[1]).toEqual({ type: 'upgrade' });
        expect(director.phase).toBe('upgrade');
      }
    });

    expect(director.beginBoss()).toBe(true);
    expect(director.beginBoss()).toBe(false);
    director.bossDefeated();
    expect(director.phase).toBe('extraction');
    player.copy(extraction);
    expect(director.update(0.1, player, 0, true)).toEqual([{ type: 'victory' }]);
    expect(director.phase).toBe('ended');
  });

  it('gates prompts by proximity and resets progression', () => {
    const director = new EncounterDirector(seals, carrot, extraction);
    const far = new THREE.Vector3(100, 0, 100);

    expect(director.presentation(far).prompt).toBeNull();
    expect(director.presentation(carrot).prompt).toBe('RECOVER CARROT');
    director.update(0.1, carrot, 0, true);
    expect(director.presentation(seals[0] as THREE.Vector3).prompt).toBe('BREACH SEAL');

    director.end();
    expect(director.presentation(far).objective).toBe('RUN COMPLETE');
    director.reset();
    expect(director.phase).toBe('opening');
    expect(director.sealsBroken).toBe(0);
  });
});
