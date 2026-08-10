import { DEFAULT_SETTINGS, EMPTY_BEST_RUN } from './defaults';
import {
  CAMPAIGN_CHAPTERS,
  CAMPAIGN_SCHEMA_VERSION,
  isCampaignProgressValid,
} from '../game/campaign';
import type { CampaignPhase, CampaignProgress, ChapterId } from '../game/campaign';
import type { BestRun, GameSettings } from '../game/types/GameTypes';

const SETTINGS_KEY = 'mark-of-the-veil:settings:v1';
const BEST_RUN_KEY = 'mark-of-the-veil:best-run:v1';
const CAMPAIGN_KEY = 'mark-of-the-veil:campaign:v1';
const PROLOGUE_KEY = 'mark-of-the-veil:prologue:v1';
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

export function hasSeenPrologue(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PROLOGUE_KEY) === 'seen';
  } catch {
    return false;
  }
}

export function savePrologueSeen(): void {
  try {
    window.localStorage.setItem(PROLOGUE_KEY, 'seen');
  } catch {
    // GameHost retains an in-memory fallback so denied storage never blocks play.
  }
}

export function loadCampaignProgress(): CampaignProgress | null {
  if (typeof window === 'undefined') return null;
  const stored = readRecord(CAMPAIGN_KEY);
  if (!stored || stored.schemaVersion !== CAMPAIGN_SCHEMA_VERSION) return null;

  const chapterIds = new Set<string>(CAMPAIGN_CHAPTERS.map((chapter) => chapter.id));
  const objectiveIds = new Set<string>(
    CAMPAIGN_CHAPTERS.flatMap((chapter) => chapter.objectives.map((objective) => objective.id)),
  );
  const currentChapterId = stored.currentChapterId;
  const currentObjectiveId = stored.currentObjectiveId;
  const revelationStage = stored.revelationStage ?? null;
  const difficulty = stored.difficulty;
  const phase = stored.phase;
  const completedChapterIds = stringArray(stored.completedChapterIds);
  const completedObjectiveIds = stringArray(stored.completedObjectiveIds);
  const upgrades = stringArray(stored.upgrades);

  if (
    typeof currentChapterId !== 'string' ||
    !chapterIds.has(currentChapterId) ||
    !isCampaignPhase(phase) ||
    (difficulty !== 'story' && difficulty !== 'normal' && difficulty !== 'nightmare') ||
    !completedChapterIds ||
    completedChapterIds.some((id) => !chapterIds.has(id)) ||
    !completedObjectiveIds ||
    completedObjectiveIds.some((id) => !objectiveIds.has(id)) ||
    !upgrades ||
    upgrades.some((id) => id !== 'ace' && id !== 'survivor' && id !== 'stormhorn') ||
    (revelationStage !== null &&
      (typeof revelationStage !== 'number' || !Number.isInteger(revelationStage)))
  ) {
    return null;
  }

  const validCurrentObjective =
    currentObjectiveId === null ||
    (typeof currentObjectiveId === 'string' && objectiveIds.has(currentObjectiveId));
  if (!validCurrentObjective || (phase === 'active' && currentObjectiveId === null)) return null;

  const progress: CampaignProgress = {
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    phase,
    difficulty,
    currentChapterId: currentChapterId as ChapterId,
    currentObjectiveId: currentObjectiveId as CampaignProgress['currentObjectiveId'],
    revelationStage: revelationStage as CampaignProgress['revelationStage'],
    completedChapterIds: completedChapterIds as ChapterId[],
    completedObjectiveIds: completedObjectiveIds as CampaignProgress['completedObjectiveIds'],
    upgrades: upgrades as CampaignProgress['upgrades'],
  };
  return isCampaignProgressValid(progress) ? progress : null;
}

export function saveCampaignProgress(progress: CampaignProgress): void {
  try {
    window.localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(progress));
  } catch {
    // Campaign saves are best-effort when browser storage is unavailable.
  }
}

export function clearCampaignProgress(): void {
  try {
    window.localStorage.removeItem(CAMPAIGN_KEY);
  } catch {
    // Private browsing may deny storage writes.
  }
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? [...value]
    : null;
}

function isCampaignPhase(value: unknown): value is CampaignPhase {
  return (
    value === 'active' ||
    value === 'chapter-complete' ||
    value === 'revelation-pending' ||
    value === 'campaign-complete'
  );
}
