import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CAMPAIGN_CHAPTERS } from '../../src/game/campaign';
import { CHAPTER_ENCOUNTERS, ChapterDirector } from '../../src/game/systems/ChapterDirector';

const ANCHORS = [
  new THREE.Vector3(10, 0, 0),
  new THREE.Vector3(20, 0, 0),
  new THREE.Vector3(30, 0, 0),
];
const RECOVERY = new THREE.Vector3(2, 0, 0);
const EXTRACTION = new THREE.Vector3(38, 0, 0);

describe('ChapterDirector', () => {
  it.each(Object.values(CHAPTER_ENCOUNTERS).map((script) => [script.chapterId, script] as const))(
    'runs the complete %s encounter script deterministically',
    (_chapterId, script) => {
      const director = new ChapterDirector(script, ANCHORS, RECOVERY, EXTRACTION);
      const player = RECOVERY.clone();

      expect(director.presentation(player).prompt).toBe(script.recoveryPrompt);
      expect(director.update(0.1, player, 0, true)).toEqual([
        { type: 'recover', caption: script.recoveryCaption },
      ]);

      script.beats.forEach((beat, index) => {
        player.copy(ANCHORS[index] as THREE.Vector3);
        expect(director.presentation(player).prompt).toBe(beat.prompt);
        expect(director.update(0.1, player, 0, true)).toEqual([{ type: 'wave', index, beat }]);
        expect(director.presentation(player)).toMatchObject({
          objective: beat.combatObjective,
          detail: beat.combatDetail,
        });
        expect(director.update(0.66, player, 1, false)).toEqual([]);
        expect(director.update(0.01, player, 0, false)[0]).toEqual({
          type: 'anchor',
          index,
          caption: beat.clearCaption,
        });
      });

      expect(director.phase).toBe('upgrade');
      expect(director.beginBoss()).toBe(true);
      expect(director.presentation(player).objective).toBe(script.bossObjective);
      director.bossDefeated();
      player.copy(EXTRACTION);
      expect(director.presentation(player).prompt).toBe(script.extractionPrompt);
      expect(director.update(0.1, player, 0, true)).toEqual([{ type: 'victory' }]);
      expect(director.phase).toBe('ended');
    },
  );

  it('keeps the eight chapter voices and bosses distinct', () => {
    const scripts = Object.values(CHAPTER_ENCOUNTERS);
    expect(new Set(CAMPAIGN_CHAPTERS.map((chapter) => chapter.boss.name)).size).toBe(8);
    expect(new Set(scripts.map((script) => script.startCaption)).size).toBe(8);
    expect(
      new Set(scripts.flatMap((script) => script.beats.map((beat) => beat.enemyLabel))).size,
    ).toBe(24);
  });

  it('protects the final fate until revelation and keeps continuity clues explicit', () => {
    const finalScript = CHAPTER_ENCOUNTERS['the-root-choir'];
    const preRevelationCopy = [
      finalScript.upgradeDetail,
      finalScript.bossArrivalCaption,
      finalScript.extractionObjective,
      finalScript.extractionDetail,
      finalScript.extractionPrompt,
      finalScript.completionDetail,
    ].join(' ');

    expect(preRevelationCopy).not.toMatch(
      /before he is gone|leave no border|cease to be|no longer there/i,
    );
    expect(CHAPTER_ENCOUNTERS['the-drowned-cathedral'].recoveryObjective).toContain('ECHO');

    const eidolonCaptions = CHAPTER_ENCOUNTERS['crown-of-eidolon'].beats.flatMap((beat) => [
      beat.arrivalCaption,
      beat.clearCaption,
    ]);
    expect(eidolonCaptions.findIndex((caption) => caption.startsWith('AVEN:'))).toBeLessThan(
      eidolonCaptions.findIndex((caption) => caption.includes('Rook lowers the strike')),
    );
  });
});
