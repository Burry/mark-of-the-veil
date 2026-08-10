import type { HapticEvent } from './types';
import { clamp01 } from './audioMath';

export interface HapticPattern {
  durationMs: number;
  weakMagnitude: number;
  strongMagnitude: number;
  vibrate: readonly number[];
  cooldownMs: number;
}

export interface ResolvedHapticPattern extends HapticPattern {
  weakMagnitude: number;
  strongMagnitude: number;
  vibrate: readonly number[];
}

export const HAPTIC_PATTERNS: Readonly<Record<HapticEvent, HapticPattern>> = {
  shot: {
    durationMs: 38,
    weakMagnitude: 0.32,
    strongMagnitude: 0.08,
    vibrate: [24],
    cooldownMs: 28,
  },
  hit: {
    durationMs: 52,
    weakMagnitude: 0.2,
    strongMagnitude: 0.34,
    vibrate: [34],
    cooldownMs: 42,
  },
  critical: {
    durationMs: 112,
    weakMagnitude: 0.62,
    strongMagnitude: 0.74,
    vibrate: [38, 24, 54],
    cooldownMs: 95,
  },
  reload: {
    durationMs: 92,
    weakMagnitude: 0.34,
    strongMagnitude: 0.1,
    vibrate: [18, 30, 30],
    cooldownMs: 180,
  },
  dash: {
    durationMs: 130,
    weakMagnitude: 0.55,
    strongMagnitude: 0.42,
    vibrate: [76],
    cooldownMs: 180,
  },
  pulse: {
    durationMs: 220,
    weakMagnitude: 0.7,
    strongMagnitude: 0.78,
    vibrate: [72, 26, 102],
    cooldownMs: 240,
  },
  playerDamage: {
    durationMs: 180,
    weakMagnitude: 0.42,
    strongMagnitude: 0.9,
    vibrate: [116],
    cooldownMs: 120,
  },
  enemyAttack: {
    durationMs: 84,
    weakMagnitude: 0.18,
    strongMagnitude: 0.35,
    vibrate: [50],
    cooldownMs: 90,
  },
  enemyDeath: {
    durationMs: 94,
    weakMagnitude: 0.48,
    strongMagnitude: 0.38,
    vibrate: [58],
    cooldownMs: 62,
  },
  seal: {
    durationMs: 420,
    weakMagnitude: 0.72,
    strongMagnitude: 0.88,
    vibrate: [92, 42, 118, 36, 92],
    cooldownMs: 600,
  },
  boss: {
    durationMs: 520,
    weakMagnitude: 0.65,
    strongMagnitude: 1,
    vibrate: [180, 50, 240],
    cooldownMs: 750,
  },
  victory: {
    durationMs: 920,
    weakMagnitude: 0.68,
    strongMagnitude: 0.46,
    vibrate: [42, 30, 68, 38, 112, 54, 185, 90, 18],
    cooldownMs: 1_300,
  },
  defeat: {
    durationMs: 480,
    weakMagnitude: 0.26,
    strongMagnitude: 0.82,
    vibrate: [240, 70, 150],
    cooldownMs: 900,
  },
  ui: {
    durationMs: 24,
    weakMagnitude: 0.16,
    strongMagnitude: 0,
    vibrate: [12],
    cooldownMs: 32,
  },
};

export function resolveHapticPattern(
  event: HapticEvent,
  directorIntensity: number,
  eventStrength = 1,
): ResolvedHapticPattern {
  const base = HAPTIC_PATTERNS[event];
  const scale = clamp01(directorIntensity) * clamp01(eventStrength);

  return {
    ...base,
    weakMagnitude: clamp01(base.weakMagnitude * scale),
    strongMagnitude: clamp01(base.strongMagnitude * scale),
    vibrate: base.vibrate.map((milliseconds, index) =>
      index % 2 === 0
        ? Math.max(1, Math.round(milliseconds * (0.55 + scale * 0.45)))
        : milliseconds,
    ),
  };
}
