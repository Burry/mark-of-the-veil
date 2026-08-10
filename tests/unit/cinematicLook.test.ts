import { describe, expect, it } from 'vitest';
import type { ChapterId } from '../../src/game/campaign';
import { selectCinematicLook } from '../../src/game/render/CinematicLook';

const CHAPTERS: readonly ChapterId[] = [
  'ashes-of-home',
  'the-root-vault',
  'vespera-in-black',
  'the-drowned-cathedral',
  'the-silent-orbit',
  'the-memory-forge',
  'crown-of-eidolon',
  'the-root-choir',
];

describe('cinematic chapter look', () => {
  it.each(CHAPTERS)('keeps %s exposure and bloom inside the authored HDR envelope', (chapterId) => {
    const look = selectCinematicLook(chapterId, false);

    expect(look.exposure).toBeGreaterThanOrEqual(0.64);
    expect(look.exposure).toBeLessThanOrEqual(0.86);
    expect(look.bloomStrength).toBeGreaterThanOrEqual(0.08);
    expect(look.bloomStrength).toBeLessThanOrEqual(0.2);
    expect(look.bloomThreshold).toBeGreaterThanOrEqual(1.3);
    expect(look.bloomRadius).toBeLessThanOrEqual(0.22);
    expect(look.environmentIntensity).toBeLessThanOrEqual(0.5);
    expect(look.practicalIntensityScale).toBeLessThanOrEqual(0.9);
    expect(look.veinEmissiveIntensity).toBeGreaterThanOrEqual(0.9);
    expect(look.veinEmissiveIntensity).toBeLessThanOrEqual(2);
  });

  it.each(CHAPTERS)('makes reduced-flash %s no brighter than the standard look', (chapterId) => {
    const standard = selectCinematicLook(chapterId, false);
    const reduced = selectCinematicLook(chapterId, true);

    expect(reduced.exposure).toBeLessThanOrEqual(standard.exposure);
    expect(reduced.bloomStrength).toBeLessThan(standard.bloomStrength);
    expect(reduced.bloomRadius).toBeLessThan(standard.bloomRadius);
    expect(reduced.bloomThreshold).toBeGreaterThan(standard.bloomThreshold);
    expect(reduced.practicalIntensityScale).toBeLessThan(standard.practicalIntensityScale);
    expect(reduced.veinEmissiveIntensity).toBeLessThan(standard.veinEmissiveIntensity);
  });

  it('gives the two most emissive memory spaces the strongest highlight restraint', () => {
    const ashes = selectCinematicLook('ashes-of-home', false);
    const forge = selectCinematicLook('the-memory-forge', false);
    const choir = selectCinematicLook('the-root-choir', false);

    expect(forge.bloomStrength).toBeLessThan(ashes.bloomStrength);
    expect(forge.veinEmissiveIntensity).toBeLessThan(ashes.veinEmissiveIntensity);
    expect(choir.exposure).toBeLessThan(forge.exposure);
    expect(choir.bloomThreshold).toBeGreaterThan(forge.bloomThreshold);
    expect(choir.veinEmissiveIntensity).toBeLessThan(forge.veinEmissiveIntensity);
  });
});
