import { describe, expect, it } from 'vitest';
import {
  buildBriefingDialogue,
  buildPlayableMissionPath,
} from '../../src/app/campaignPresentation';
import { CAMPAIGN_CHAPTERS, getChapter } from '../../src/game/campaign';
import { CHAPTER_ENCOUNTERS } from '../../src/game/systems/ChapterDirector';
import { REVELATION_TRANSMISSIONS } from '../../src/ui/revelationNarrative';

describe('campaign presentation', () => {
  it('keeps the final revelation out of the Chapter 8 briefing', () => {
    const chapter = getChapter('the-root-choir');
    const briefing = buildBriefingDialogue(chapter, CHAPTER_ENCOUNTERS[chapter.id])
      .map((cue) => cue.line)
      .join(' ');

    expect(briefing).not.toMatch(/unicorns? (?:are|were|never)|ceases? to exist|total knowledge/i);
    expect(briefing).toContain('THE LAST I');
  });

  it('briefs the playable encounter grammar instead of unimplemented manifest mechanics', () => {
    CAMPAIGN_CHAPTERS.forEach((chapter) => {
      const script = CHAPTER_ENCOUNTERS[chapter.id];
      expect(buildPlayableMissionPath(script)).toEqual([
        script.recoveryObjective,
        ...script.beats.map((beat) => beat.travelObjective),
        script.upgradeObjective,
        script.bossObjective,
        script.extractionObjective,
      ]);
    });

    expect(buildPlayableMissionPath(CHAPTER_ENCOUNTERS['the-root-vault'])).not.toContain(
      'FREE SABLE VALE',
    );
    expect(buildPlayableMissionPath(CHAPTER_ENCOUNTERS['the-silent-orbit'])).not.toContain(
      'RECOVER THE BLACK BOX',
    );
  });

  it('reveals the truth before dissolution and reserves the liberated-world epilogue for after it', () => {
    expect(REVELATION_TRANSMISSIONS.map((transmission) => transmission.title)).toEqual([
      'THE REGENT WAS A DOOR',
      'EVERY MIND. EVERY ANSWER.',
      'HE SEARCHES FOR HOME',
      "UNICORNS AREN'T REAL.",
      'NO OBSERVER REMAINS',
      'THE MANY RETURN',
      'VESPERA REMEMBERS',
    ]);
  });
});
