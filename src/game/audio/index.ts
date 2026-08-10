export { AudioDirector } from './AudioDirector';
export { HapticsDirector } from './HapticsDirector';
export { deriveAdaptiveAudioMix, volumeToGain } from './audioMath';
export {
  CHAPTER_AUDIO_IDS,
  CHAPTER_AUDIO_PROFILES,
  DEFAULT_CHAPTER_AUDIO_ID,
  chapterBarLength,
  chapterMotifFrequency,
  chapterTempo,
  isChapterAccent,
} from './chapterAudio';
export { HAPTIC_PATTERNS, resolveHapticPattern } from './hapticPatterns';
export type { HapticsEnvironment } from './HapticsDirector';
export type { AdaptiveAudioMix } from './audioMath';
export type { ChapterAudioId, ChapterAudioProfile } from './chapterAudio';
export type { HapticPattern, ResolvedHapticPattern } from './hapticPatterns';
export type {
  AudioEvent,
  AudioSpatialPosition,
  FeedbackSettingsSource,
  HapticEvent,
  SemanticFeedbackEvent,
} from './types';
