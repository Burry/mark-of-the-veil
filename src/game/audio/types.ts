import type { GameSettings } from '../types/GameTypes';

export type SemanticFeedbackEvent =
  | 'shot'
  | 'hit'
  | 'critical'
  | 'reload'
  | 'dash'
  | 'pulse'
  | 'playerDamage'
  | 'enemyAttack'
  | 'enemyDeath'
  | 'seal'
  | 'boss'
  | 'victory'
  | 'defeat'
  | 'ui';

export type AudioEvent = SemanticFeedbackEvent;
export type HapticEvent = SemanticFeedbackEvent;

export interface AudioSpatialPosition {
  x: number;
  y: number;
  z: number;
}

export type FeedbackSettingsSource = GameSettings | (() => GameSettings);
