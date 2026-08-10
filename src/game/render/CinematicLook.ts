import type { ChapterId } from '../campaign/types';

export interface CinematicLook {
  readonly exposure: number;
  readonly bloomStrength: number;
  readonly bloomRadius: number;
  readonly bloomThreshold: number;
  readonly environmentIntensity: number;
  readonly hemisphereIntensity: number;
  readonly practicalIntensityScale: number;
  readonly veinEmissiveIntensity: number;
}

const CHAPTER_LOOKS: Record<ChapterId, CinematicLook> = {
  'ashes-of-home': {
    exposure: 0.82,
    bloomStrength: 0.18,
    bloomRadius: 0.2,
    bloomThreshold: 1.35,
    environmentIntensity: 0.46,
    hemisphereIntensity: 0.12,
    practicalIntensityScale: 0.84,
    veinEmissiveIntensity: 1.9,
  },
  'the-root-vault': {
    exposure: 0.78,
    bloomStrength: 0.15,
    bloomRadius: 0.18,
    bloomThreshold: 1.48,
    environmentIntensity: 0.38,
    hemisphereIntensity: 0.1,
    practicalIntensityScale: 0.62,
    veinEmissiveIntensity: 1.5,
  },
  'vespera-in-black': {
    exposure: 0.8,
    bloomStrength: 0.17,
    bloomRadius: 0.19,
    bloomThreshold: 1.4,
    environmentIntensity: 0.44,
    hemisphereIntensity: 0.11,
    practicalIntensityScale: 0.72,
    veinEmissiveIntensity: 1.7,
  },
  'the-drowned-cathedral': {
    exposure: 0.78,
    bloomStrength: 0.18,
    bloomRadius: 0.2,
    bloomThreshold: 1.4,
    environmentIntensity: 0.42,
    hemisphereIntensity: 0.11,
    practicalIntensityScale: 0.72,
    veinEmissiveIntensity: 1.8,
  },
  'the-silent-orbit': {
    exposure: 0.84,
    bloomStrength: 0.15,
    bloomRadius: 0.17,
    bloomThreshold: 1.52,
    environmentIntensity: 0.48,
    hemisphereIntensity: 0.12,
    practicalIntensityScale: 0.68,
    veinEmissiveIntensity: 1.45,
  },
  'the-memory-forge': {
    exposure: 0.82,
    bloomStrength: 0.13,
    bloomRadius: 0.16,
    bloomThreshold: 1.62,
    environmentIntensity: 0.42,
    hemisphereIntensity: 0.1,
    practicalIntensityScale: 0.56,
    veinEmissiveIntensity: 1.2,
  },
  'crown-of-eidolon': {
    exposure: 0.73,
    bloomStrength: 0.14,
    bloomRadius: 0.17,
    bloomThreshold: 1.58,
    environmentIntensity: 0.36,
    hemisphereIntensity: 0.09,
    practicalIntensityScale: 0.58,
    veinEmissiveIntensity: 1.25,
  },
  'the-root-choir': {
    exposure: 0.76,
    bloomStrength: 0.11,
    bloomRadius: 0.14,
    bloomThreshold: 1.74,
    environmentIntensity: 0.36,
    hemisphereIntensity: 0.09,
    practicalIntensityScale: 0.48,
    veinEmissiveIntensity: 1,
  },
};

/**
 * Returns the authored camera and light-energy response for one chapter.
 * Reduced-flash mode keeps the same palette while reducing transient bloom.
 */
export function selectCinematicLook(chapterId: ChapterId, reducedFlashes: boolean): CinematicLook {
  const look = CHAPTER_LOOKS[chapterId];
  if (!reducedFlashes) return look;
  return {
    ...look,
    exposure: Math.max(0.6, look.exposure * 0.9),
    bloomStrength: look.bloomStrength * 0.45,
    bloomRadius: look.bloomRadius * 0.75,
    bloomThreshold: Math.min(2.1, look.bloomThreshold + 0.2),
    practicalIntensityScale: look.practicalIntensityScale * 0.88,
    veinEmissiveIntensity: look.veinEmissiveIntensity * 0.72,
  };
}
