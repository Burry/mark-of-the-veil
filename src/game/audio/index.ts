export { AudioDirector } from './AudioDirector';
export { HapticsDirector } from './HapticsDirector';
export { deriveAdaptiveAudioMix, volumeToGain } from './audioMath';
export { HAPTIC_PATTERNS, resolveHapticPattern } from './hapticPatterns';
export type { HapticsEnvironment } from './HapticsDirector';
export type { AdaptiveAudioMix } from './audioMath';
export type { HapticPattern, ResolvedHapticPattern } from './hapticPatterns';
export type {
  AudioEvent,
  AudioSpatialPosition,
  FeedbackSettingsSource,
  HapticEvent,
  SemanticFeedbackEvent,
} from './types';
