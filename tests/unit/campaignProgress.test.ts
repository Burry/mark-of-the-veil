import { describe, expect, it } from 'vitest';
import { CAMPAIGN_CHAPTERS } from '../../src/game/campaign/manifest';
import {
  createCampaignProgress,
  createCheckpoint,
  getNextChapterId,
  isCampaignProgressValid,
  reduceCampaign,
  restoreCheckpoint,
} from '../../src/game/campaign/progress';
import type { CampaignPlayerSnapshot } from '../../src/game/campaign/types';

const PLAYER: CampaignPlayerSnapshot = {
  health: 82,
  maxHealth: 100,
  shield: 35,
  maxShield: 50,
  ammo: 24,
  magazineSize: 36,
  reserveAmmo: 144,
  perspective: 'third',
  score: 4200,
};

describe('campaign progress', () => {
  it('starts at the first objective and ignores out-of-order completion', () => {
    const progress = createCampaignProgress('normal');

    expect(progress).toMatchObject({
      schemaVersion: 1,
      phase: 'active',
      difficulty: 'normal',
      currentChapterId: 'ashes-of-home',
      currentObjectiveId: 'ashes-of-home:wake-in-the-wreck',
    });

    const unchanged = reduceCampaign(progress, {
      type: 'objective-completed',
      objectiveId: 'ashes-of-home:recover-the-sunlance',
    });
    expect(unchanged).toBe(progress);
  });

  it('advances deterministically through all objectives and chapter interstitials', () => {
    let progress = createCampaignProgress('story');

    CAMPAIGN_CHAPTERS.forEach((chapter, chapterIndex) => {
      expect(progress.currentChapterId).toBe(chapter.id);
      expect(progress.currentObjectiveId).toBe(chapter.objectives[0].id);

      chapter.objectives.forEach((objective) => {
        const previous = progress;
        if (objective.type === 'revelation') {
          expect(
            reduceCampaign(progress, { type: 'objective-completed', objectiveId: objective.id }),
          ).toBe(progress);
          progress = reduceCampaign(progress, { type: 'revelation-started' });
          expect(progress).toMatchObject({ phase: 'revelation-pending', revelationStage: 0 });
          expect(reduceCampaign(progress, { type: 'revelation-completed' })).toBe(progress);
          for (let stage = 1; stage < objective.transmissionIds.length; stage += 1) {
            progress = reduceCampaign(progress, { type: 'revelation-stage-changed', stage });
          }
          expect(isCampaignProgressValid(progress)).toBe(true);
          progress = reduceCampaign(progress, { type: 'revelation-completed' });
          expect(previous.completedObjectiveIds).not.toContain(objective.id);
          expect(progress.completedObjectiveIds).toContain(objective.id);
          return;
        }
        progress = reduceCampaign(progress, {
          type: 'objective-completed',
          objectiveId: objective.id,
        });
        expect(previous.completedObjectiveIds).not.toContain(objective.id);
        expect(progress.completedObjectiveIds).toContain(objective.id);
      });

      if (chapterIndex < CAMPAIGN_CHAPTERS.length - 1) {
        expect(progress.phase).toBe('chapter-complete');
        expect(progress.currentObjectiveId).toBeNull();
        expect(getNextChapterId(progress)).toBe(CAMPAIGN_CHAPTERS[chapterIndex + 1]?.id);
        progress = reduceCampaign(progress, { type: 'continue-campaign' });
      }
    });

    expect(progress.phase).toBe('campaign-complete');
    expect(progress.completedChapterIds).toEqual(CAMPAIGN_CHAPTERS.map((chapter) => chapter.id));
    expect(progress.completedObjectiveIds).toHaveLength(56);
    expect(reduceCampaign(progress, { type: 'continue-campaign' })).toBe(progress);
  });

  it('validates and advances only bounded pending revelation stages', () => {
    let progress = createCampaignProgress('normal');
    for (const chapter of CAMPAIGN_CHAPTERS) {
      for (const objective of chapter.objectives) {
        if (objective.type === 'revelation') break;
        progress = reduceCampaign(progress, {
          type: 'objective-completed',
          objectiveId: objective.id,
        });
      }
      if (progress.phase === 'chapter-complete') {
        progress = reduceCampaign(progress, { type: 'continue-campaign' });
      }
    }

    progress = reduceCampaign(progress, { type: 'revelation-started' });
    expect(progress.phase).toBe('revelation-pending');
    expect(isCampaignProgressValid(progress)).toBe(true);
    expect(reduceCampaign(progress, { type: 'revelation-stage-changed', stage: -1 })).toBe(
      progress,
    );
    expect(reduceCampaign(progress, { type: 'revelation-stage-changed', stage: 99 })).toBe(
      progress,
    );
  });

  it('deduplicates upgrades and resets only the active chapter', () => {
    let progress = createCampaignProgress('nightmare');
    const firstChapter = CAMPAIGN_CHAPTERS[0];

    firstChapter.objectives.forEach((objective) => {
      progress = reduceCampaign(progress, {
        type: 'objective-completed',
        objectiveId: objective.id,
      });
    });
    progress = reduceCampaign(progress, { type: 'continue-campaign' });
    progress = reduceCampaign(progress, { type: 'upgrade-acquired', upgradeId: 'stormhorn' });
    progress = reduceCampaign(progress, { type: 'upgrade-acquired', upgradeId: 'stormhorn' });

    const secondChapter = CAMPAIGN_CHAPTERS[1];
    progress = reduceCampaign(progress, {
      type: 'objective-completed',
      objectiveId: secondChapter.objectives[0].id,
    });
    progress = reduceCampaign(progress, { type: 'restart-chapter' });

    expect(progress.currentObjectiveId).toBe(secondChapter.objectives[0].id);
    expect(progress.completedChapterIds).toEqual([firstChapter.id]);
    expect(progress.completedObjectiveIds).toEqual(firstChapter.objectives.map(({ id }) => id));
    expect(progress.upgrades).toEqual(['stormhorn']);
  });

  it('creates validated serializable checkpoints and restores a defensive copy', () => {
    const progress = createCampaignProgress('normal');
    const checkpoint = createCheckpoint(progress, 'ashes-of-home:checkpoint:wreck', PLAYER);

    expect(checkpoint).not.toBeNull();
    expect(JSON.parse(JSON.stringify(checkpoint))).toEqual(checkpoint);
    expect(createCheckpoint(progress, 'ashes-of-home:checkpoint:observatory', PLAYER)).toBeNull();

    if (!checkpoint) throw new Error('Expected a valid checkpoint');
    const restored = restoreCheckpoint(checkpoint);
    expect(restored).toEqual(progress);
    expect(restored).not.toBe(checkpoint.progress);
    expect(restored.completedObjectiveIds).not.toBe(checkpoint.progress.completedObjectiveIds);
  });
});
