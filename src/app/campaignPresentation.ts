import type { CampaignChapter } from '../game/campaign';
import type { ChapterEncounterScript } from '../game/systems/ChapterDirector';

export interface BriefingCue {
  speaker: string;
  line: string;
}

export function buildBriefingDialogue(
  chapter: CampaignChapter,
  script: ChapterEncounterScript,
): BriefingCue[] {
  return [
    { speaker: 'WAYFARER ARCHIVE', line: chapter.narrative.opening },
    {
      speaker: 'FIELD INTELLIGENCE',
      line: script.recoveryDetail,
    },
    {
      speaker: 'THREAT INDEX',
      line: `${chapter.boss.name}. ${chapter.boss.subtitle}.`,
    },
  ];
}

export function buildPlayableMissionPath(script: ChapterEncounterScript): string[] {
  return [
    script.recoveryObjective,
    ...script.beats.map((beat) => beat.travelObjective),
    script.upgradeObjective,
    script.bossObjective,
    script.extractionObjective,
  ];
}
