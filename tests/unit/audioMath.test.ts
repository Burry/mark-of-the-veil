import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/app/defaults';
import {
  clamp01,
  deriveAdaptiveAudioMix,
  deterministicUnit,
  volumeToGain,
} from '../../src/game/audio/audioMath';

describe('audio mix math', () => {
  it('clamps invalid and out-of-range intensity values', () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(5)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('maps volume through a perceptual, bounded gain curve', () => {
    expect(volumeToGain(0)).toBe(0);
    expect(volumeToGain(1)).toBe(1);
    expect(volumeToGain(0.5)).toBeGreaterThan(0);
    expect(volumeToGain(0.5)).toBeLessThan(0.5);
    expect(volumeToGain(-1)).toBe(0);
    expect(volumeToGain(4)).toBe(1);
  });

  it('raises musical energy without changing user bus settings', () => {
    const quiet = deriveAdaptiveAudioMix(DEFAULT_SETTINGS, 0);
    const combat = deriveAdaptiveAudioMix(DEFAULT_SETTINGS, 1);

    expect(combat.master).toBe(quiet.master);
    expect(combat.music).toBe(quiet.music);
    expect(combat.effects).toBe(quiet.effects);
    expect(combat.ambience).toBe(quiet.ambience);
    expect(combat.drone).toBeGreaterThan(quiet.drone);
    expect(combat.choir).toBeGreaterThan(quiet.choir);
    expect(combat.percussion).toBeGreaterThan(quiet.percussion);
    expect(combat.reverb).toBeGreaterThan(quiet.reverb);
    expect(combat.musicFilterHz).toBeGreaterThan(quiet.musicFilterHz);
    expect(combat.tempo).toBeGreaterThan(quiet.tempo);
  });

  it('produces repeatable procedural variation from an integer seed', () => {
    expect(deterministicUnit(42)).toBe(deterministicUnit(42));
    expect(deterministicUnit(42)).not.toBe(deterministicUnit(43));
    expect(deterministicUnit(42)).toBeGreaterThanOrEqual(0);
    expect(deterministicUnit(42)).toBeLessThanOrEqual(1);
  });
});
