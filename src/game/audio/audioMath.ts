import type { GameSettings } from '../types/GameTypes';

export interface AdaptiveAudioMix {
  master: number;
  music: number;
  effects: number;
  ambience: number;
  drone: number;
  choir: number;
  percussion: number;
  reverb: number;
  musicFilterHz: number;
  tempo: number;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** A perceptual volume curve gives the lower half of sliders useful resolution. */
export function volumeToGain(volume: number): number {
  return clamp01(volume) ** 1.65;
}

export function deriveAdaptiveAudioMix(
  settings: Pick<GameSettings, 'masterVolume' | 'musicVolume' | 'effectsVolume' | 'ambienceVolume'>,
  intensity: number,
): AdaptiveAudioMix {
  const energy = clamp01(intensity);

  return {
    master: volumeToGain(settings.masterVolume),
    music: volumeToGain(settings.musicVolume),
    effects: volumeToGain(settings.effectsVolume),
    ambience: volumeToGain(settings.ambienceVolume),
    drone: 0.2 + energy * 0.22,
    choir: 0.025 + energy * energy * 0.15,
    percussion: 0.12 + energy * 0.5,
    reverb: 0.16 + energy * 0.07,
    musicFilterHz: 620 + energy * 2_800,
    tempo: 52 + energy * 44,
  };
}

export function deterministicUnit(seed: number): number {
  let value = seed | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}
