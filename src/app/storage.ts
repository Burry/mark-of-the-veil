import { DEFAULT_SETTINGS, EMPTY_BEST_RUN } from './defaults';
import type { BestRun, GameSettings } from '../game/types/GameTypes';

const SETTINGS_KEY = 'mark-of-the-veil:settings:v1';
const BEST_RUN_KEY = 'mark-of-the-veil:best-run:v1';
const MAX_STORED_NUMBER = Number.MAX_SAFE_INTEGER;

type StoredRecord = Record<string, unknown>;

function readRecord(key: string): StoredRecord | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as StoredRecord)
      : null;
  } catch {
    return null;
  }
}

function numberField(
  record: StoredRecord,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function booleanField(record: StoredRecord, key: string, fallback: boolean): boolean {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = readRecord(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;

  const quality = stored.quality;
  return {
    masterVolume: numberField(stored, 'masterVolume', DEFAULT_SETTINGS.masterVolume, 0, 1),
    musicVolume: numberField(stored, 'musicVolume', DEFAULT_SETTINGS.musicVolume, 0, 1),
    effectsVolume: numberField(stored, 'effectsVolume', DEFAULT_SETTINGS.effectsVolume, 0, 1),
    ambienceVolume: numberField(stored, 'ambienceVolume', DEFAULT_SETTINGS.ambienceVolume, 0, 1),
    mouseSensitivity: numberField(
      stored,
      'mouseSensitivity',
      DEFAULT_SETTINGS.mouseSensitivity,
      0.1,
      1,
    ),
    gamepadSensitivity: numberField(
      stored,
      'gamepadSensitivity',
      DEFAULT_SETTINGS.gamepadSensitivity,
      0.1,
      1,
    ),
    gamepadDeadzone: numberField(
      stored,
      'gamepadDeadzone',
      DEFAULT_SETTINGS.gamepadDeadzone,
      0.05,
      0.35,
    ),
    fieldOfView: numberField(stored, 'fieldOfView', DEFAULT_SETTINGS.fieldOfView, 60, 100),
    quality:
      quality === 'low' || quality === 'medium' || quality === 'high'
        ? quality
        : DEFAULT_SETTINGS.quality,
    captions: booleanField(stored, 'captions', DEFAULT_SETTINGS.captions),
    highContrastReticle: booleanField(
      stored,
      'highContrastReticle',
      DEFAULT_SETTINGS.highContrastReticle,
    ),
    haptics: booleanField(stored, 'haptics', DEFAULT_SETTINGS.haptics),
    reducedMotion: booleanField(stored, 'reducedMotion', DEFAULT_SETTINGS.reducedMotion),
    reducedFlashes: booleanField(stored, 'reducedFlashes', DEFAULT_SETTINGS.reducedFlashes),
    cameraShake: numberField(stored, 'cameraShake', DEFAULT_SETTINGS.cameraShake, 0, 1),
    aimAssist: numberField(stored, 'aimAssist', DEFAULT_SETTINGS.aimAssist, 0, 1),
    invertY: booleanField(stored, 'invertY', DEFAULT_SETTINGS.invertY),
  };
}

export function saveSettings(settings: GameSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage is an enhancement; private browsing must never block play.
  }
}

export function loadBestRun(): BestRun {
  if (typeof window === 'undefined') return EMPTY_BEST_RUN;
  const stored = readRecord(BEST_RUN_KEY);
  if (!stored) return EMPTY_BEST_RUN;

  const rank = stored.rank;
  return {
    score: numberField(stored, 'score', EMPTY_BEST_RUN.score, 0, MAX_STORED_NUMBER),
    elapsedSeconds: numberField(
      stored,
      'elapsedSeconds',
      EMPTY_BEST_RUN.elapsedSeconds,
      0,
      MAX_STORED_NUMBER,
    ),
    rank: rank === 'S' || rank === 'A' || rank === 'B' || rank === 'C' ? rank : EMPTY_BEST_RUN.rank,
  };
}

export function saveBestRun(best: BestRun): void {
  try {
    window.localStorage.setItem(BEST_RUN_KEY, JSON.stringify(best));
  } catch {
    // Ignore quota/security failures.
  }
}
