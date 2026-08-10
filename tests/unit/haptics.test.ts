import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/app/defaults';
import { HapticsDirector } from '../../src/game/audio/HapticsDirector';
import { HAPTIC_PATTERNS, resolveHapticPattern } from '../../src/game/audio/hapticPatterns';
import type { GameSettings } from '../../src/game/types/GameTypes';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('haptic patterns', () => {
  it('defines a valid pattern for every semantic feedback event', () => {
    expect(Object.keys(HAPTIC_PATTERNS)).toEqual([
      'shot',
      'hit',
      'critical',
      'reload',
      'dash',
      'pulse',
      'playerDamage',
      'enemyAttack',
      'enemyDeath',
      'seal',
      'boss',
      'victory',
      'defeat',
      'ui',
    ]);

    for (const pattern of Object.values(HAPTIC_PATTERNS)) {
      expect(pattern.durationMs).toBeGreaterThan(0);
      expect(pattern.cooldownMs).toBeGreaterThan(0);
      expect(pattern.weakMagnitude).toBeGreaterThanOrEqual(0);
      expect(pattern.weakMagnitude).toBeLessThanOrEqual(1);
      expect(pattern.strongMagnitude).toBeGreaterThanOrEqual(0);
      expect(pattern.strongMagnitude).toBeLessThanOrEqual(1);
      expect(pattern.vibrate.length).toBeGreaterThan(0);
    }
  });

  it('scales magnitude and pulse time while preserving cooldown gaps', () => {
    const full = resolveHapticPattern('critical', 1, 1);
    const reduced = resolveHapticPattern('critical', 0.5, 0.5);

    expect(reduced.weakMagnitude).toBeCloseTo(full.weakMagnitude * 0.25);
    expect(reduced.strongMagnitude).toBeCloseTo(full.strongMagnitude * 0.25);
    expect(reduced.vibrate[0]).toBeLessThan(full.vibrate[0] ?? 0);
    expect(reduced.vibrate[1]).toBe(full.vibrate[1]);
  });
});

describe('HapticsDirector', () => {
  it('uses dual-rumble and rate-limits repeated semantic events', () => {
    let now = 100;
    const playEffect = vi.fn(async () => 'complete');
    const reset = vi.fn(async () => 'complete');
    const gamepad = {
      connected: true,
      vibrationActuator: { playEffect, reset },
    } as unknown as Gamepad;
    const vibrate = vi.fn(() => true);
    const director = new HapticsDirector(DEFAULT_SETTINGS, {
      now: () => now,
      gamepads: () => [gamepad],
      vibrate,
    });

    director.play('shot');
    now += 10;
    director.play('shot');
    expect(playEffect).toHaveBeenCalledTimes(1);
    expect(playEffect).toHaveBeenCalledWith(
      'dual-rumble',
      expect.objectContaining({ duration: HAPTIC_PATTERNS.shot.durationMs }),
    );

    now += HAPTIC_PATTERNS.shot.cooldownMs;
    director.play('shot');
    expect(playEffect).toHaveBeenCalledTimes(2);

    director.dispose();
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('uses vibration fallback and respects pause and haptics settings', () => {
    let now = 1_000;
    const vibrate = vi.fn(() => true);
    const settings: GameSettings = { ...DEFAULT_SETTINGS };
    const director = new HapticsDirector(() => settings, {
      now: () => now,
      gamepads: () => [],
      vibrate,
    });

    director.setIntensity(0.5);
    director.play('pulse');
    expect(vibrate).toHaveBeenLastCalledWith(expect.any(Array));

    director.pause();
    now += 1_000;
    director.play('pulse');
    expect(vibrate).toHaveBeenLastCalledWith(0);

    director.resume();
    settings.haptics = false;
    director.play('pulse');
    expect(vibrate).toHaveBeenLastCalledWith(0);
  });

  it('is safe when no haptic APIs are available', () => {
    const director = new HapticsDirector(DEFAULT_SETTINGS, {
      now: () => 100,
      gamepads: () => [],
      vibrate: () => false,
    });

    expect(() => {
      director.play('ui');
      director.pause();
      director.resume();
      director.dispose();
      director.dispose();
    }).not.toThrow();
  });

  it('falls back when a controller disconnects during an effect call', () => {
    const vibrate = vi.fn(() => true);
    const gamepad = {
      connected: true,
      vibrationActuator: {
        playEffect: vi.fn(() => {
          throw new DOMException('disconnected', 'InvalidStateError');
        }),
      },
    } as unknown as Gamepad;
    const director = new HapticsDirector(DEFAULT_SETTINGS, {
      now: () => 100,
      gamepads: () => [gamepad],
      vibrate,
    });

    expect(() => director.play('playerDamage')).not.toThrow();
    expect(vibrate).toHaveBeenCalledWith(expect.any(Array));
    expect(() => director.dispose()).not.toThrow();
  });
});
