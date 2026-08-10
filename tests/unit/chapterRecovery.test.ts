import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createChapterRecovery, getRecoveryPropKind } from '../../src/game/render/ChapterRecovery';
import { CHAPTER_LAYOUTS, type ChapterEnvironmentId } from '../../src/game/render/ChapterScenery';

const CHAPTERS = Object.keys(CHAPTER_LAYOUTS) as ChapterEnvironmentId[];

describe('chapter recovery props', () => {
  it('maps every chapter to an authored recovery prop', () => {
    expect(CHAPTERS.map(getRecoveryPropKind)).toEqual([
      'flight-recorder',
      'carrot-memory',
      'relay-key',
      'carrot-memory',
      'navigation-cell',
      'carrot-memory',
      'wayfarer-core',
      'carrot-memory',
    ]);
  });

  it('creates named, shadow-ready geometry for each prop', () => {
    CHAPTERS.forEach((chapterId) => {
      const recovery = createChapterRecovery(chapterId);
      let meshCount = 0;
      recovery.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        meshCount += 1;
        expect(object.castShadow).toBe(true);
        expect(object.receiveShadow).toBe(true);
      });
      expect(recovery.name).toBe(`ChapterRecovery-${getRecoveryPropKind(chapterId)}`);
      expect(meshCount).toBeGreaterThan(0);
    });
  });
});
