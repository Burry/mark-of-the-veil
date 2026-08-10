import { describe, expect, it } from 'vitest';
import { CAMPAIGN_CHAPTERS, getChapter, getObjective } from '../../src/game/campaign/manifest';

describe('campaign manifest', () => {
  it('defines one ordered, linked eight-chapter campaign', () => {
    expect(CAMPAIGN_CHAPTERS).toHaveLength(8);
    expect(CAMPAIGN_CHAPTERS.map((chapter) => chapter.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

    CAMPAIGN_CHAPTERS.forEach((chapter, index) => {
      expect(chapter.nextChapterId).toBe(CAMPAIGN_CHAPTERS[index + 1]?.id ?? null);
      expect(chapter.objectives.length).toBeGreaterThanOrEqual(6);
      expect(chapter.estimatedMinutes[0]).toBeGreaterThanOrEqual(8);
      expect(chapter.estimatedMinutes[1]).toBeGreaterThan(chapter.estimatedMinutes[0]);
    });
  });

  it('keeps objective and checkpoint identifiers unique and internally valid', () => {
    const objectiveIds = CAMPAIGN_CHAPTERS.flatMap((chapter) =>
      chapter.objectives.map((objective) => objective.id),
    );
    const checkpointIds = CAMPAIGN_CHAPTERS.flatMap((chapter) =>
      chapter.checkpoints.map((checkpoint) => checkpoint.id),
    );

    expect(new Set(objectiveIds).size).toBe(objectiveIds.length);
    expect(new Set(checkpointIds).size).toBe(checkpointIds.length);

    CAMPAIGN_CHAPTERS.forEach((chapter) => {
      const chapterObjectiveIds = new Set<string>(
        chapter.objectives.map((objective) => objective.id),
      );
      chapter.objectives.forEach((objective) => {
        expect(objective.id.startsWith(`${chapter.id}:`)).toBe(true);
      });
      chapter.checkpoints.forEach((checkpoint) => {
        expect(checkpoint.id.startsWith(`${chapter.id}:checkpoint:`)).toBe(true);
        expect(chapterObjectiveIds.has(checkpoint.resumeObjectiveId)).toBe(true);
      });
    });
  });

  it('owns one canonical boss identity per chapter', () => {
    expect(new Set(CAMPAIGN_CHAPTERS.map((chapter) => chapter.boss.id)).size).toBe(8);
    expect(new Set(CAMPAIGN_CHAPTERS.map((chapter) => chapter.boss.name)).size).toBe(8);

    CAMPAIGN_CHAPTERS.forEach((chapter) => {
      chapter.objectives.forEach((objective) => {
        if (objective.type === 'boss') expect(objective.bossId).toBe(chapter.boss.id);
      });
    });
  });

  it('covers traversal, combat, story, and finale objective families', () => {
    const types = new Set(
      CAMPAIGN_CHAPTERS.flatMap((chapter) => chapter.objectives.map((objective) => objective.type)),
    );

    expect(types).toEqual(
      new Set([
        'tutorial',
        'reach',
        'interact',
        'eliminate',
        'defend',
        'destroy',
        'survive',
        'escort',
        'investigate',
        'boss',
        'escape',
        'infiltrate',
        'revelation',
      ]),
    );
  });

  it('provides stable lookup helpers and is plain JSON data', () => {
    const chapter = getChapter('the-drowned-cathedral');
    const objective = getObjective(chapter.id, 'the-drowned-cathedral:kill-the-hollow-regent');

    expect(chapter.title).toBe('THE DROWNED CATHEDRAL');
    expect(objective).toMatchObject({ type: 'boss', bossId: 'hollow-regent', phases: 3 });
    expect(JSON.parse(JSON.stringify(CAMPAIGN_CHAPTERS))).toEqual(CAMPAIGN_CHAPTERS);
  });
});
