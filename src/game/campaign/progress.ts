import { CAMPAIGN_CHAPTERS, getChapter } from './manifest';
import {
  CAMPAIGN_SCHEMA_VERSION,
  type CampaignAction,
  type CampaignCheckpoint,
  type CampaignPlayerSnapshot,
  type CampaignProgress,
  type CheckpointId,
  type ChapterId,
} from './types';
import type { Difficulty } from '../types/GameTypes';

const FIRST_CHAPTER = CAMPAIGN_CHAPTERS[0];

function cloneProgress(progress: CampaignProgress): CampaignProgress {
  return {
    ...progress,
    completedChapterIds: [...progress.completedChapterIds],
    completedObjectiveIds: [...progress.completedObjectiveIds],
    upgrades: [...progress.upgrades],
  };
}

export function createCampaignProgress(difficulty: Difficulty): CampaignProgress {
  return {
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    phase: 'active',
    difficulty,
    currentChapterId: FIRST_CHAPTER.id,
    currentObjectiveId: FIRST_CHAPTER.objectives[0].id,
    revelationStage: null,
    completedChapterIds: [],
    completedObjectiveIds: [],
    upgrades: [],
  };
}

export function reduceCampaign(
  progress: CampaignProgress,
  action: CampaignAction,
): CampaignProgress {
  if (action.type === 'upgrade-acquired') {
    if (progress.upgrades.includes(action.upgradeId)) return progress;
    return { ...progress, upgrades: [...progress.upgrades, action.upgradeId] };
  }

  const finalChapter = CAMPAIGN_CHAPTERS[CAMPAIGN_CHAPTERS.length - 1];
  const revelation = finalChapter.objectives.find((objective) => objective.type === 'revelation');
  if (!revelation || revelation.type !== 'revelation') {
    throw new Error('The final campaign chapter requires one revelation objective.');
  }

  if (action.type === 'revelation-started') {
    if (
      progress.phase !== 'active' ||
      progress.currentChapterId !== finalChapter.id ||
      progress.currentObjectiveId !== revelation.id
    ) {
      return progress;
    }
    return { ...progress, phase: 'revelation-pending', revelationStage: 0 };
  }

  if (action.type === 'revelation-stage-changed') {
    if (
      progress.phase !== 'revelation-pending' ||
      !Number.isInteger(action.stage) ||
      action.stage < 0 ||
      action.stage >= revelation.transmissionIds.length
    ) {
      return progress;
    }
    return action.stage === progress.revelationStage
      ? progress
      : { ...progress, revelationStage: action.stage };
  }

  if (action.type === 'revelation-completed') {
    if (
      progress.phase !== 'revelation-pending' ||
      progress.currentChapterId !== finalChapter.id ||
      progress.currentObjectiveId !== revelation.id ||
      progress.revelationStage !== revelation.transmissionIds.length - 1
    ) {
      return progress;
    }
    return {
      ...progress,
      phase: 'campaign-complete',
      currentObjectiveId: null,
      revelationStage: null,
      completedChapterIds: progress.completedChapterIds.includes(finalChapter.id)
        ? progress.completedChapterIds
        : [...progress.completedChapterIds, finalChapter.id],
      completedObjectiveIds: progress.completedObjectiveIds.includes(revelation.id)
        ? progress.completedObjectiveIds
        : [...progress.completedObjectiveIds, revelation.id],
    };
  }

  if (action.type === 'restart-chapter') {
    if (progress.phase === 'campaign-complete' || progress.phase === 'revelation-pending') {
      return progress;
    }
    const chapter = getChapter(progress.currentChapterId);
    const chapterObjectiveIds = new Set(chapter.objectives.map((objective) => objective.id));
    return {
      ...progress,
      phase: 'active',
      currentObjectiveId: chapter.objectives[0].id,
      revelationStage: null,
      completedChapterIds: progress.completedChapterIds.filter((id) => id !== chapter.id),
      completedObjectiveIds: progress.completedObjectiveIds.filter(
        (id) => !chapterObjectiveIds.has(id),
      ),
    };
  }

  if (action.type === 'continue-campaign') {
    if (progress.phase !== 'chapter-complete') return progress;
    const nextChapterId = getChapter(progress.currentChapterId).nextChapterId;
    if (!nextChapterId) return { ...progress, phase: 'campaign-complete' };
    const nextChapter = getChapter(nextChapterId);
    return {
      ...progress,
      phase: 'active',
      currentChapterId: nextChapter.id,
      currentObjectiveId: nextChapter.objectives[0].id,
      revelationStage: null,
    };
  }

  if (progress.phase !== 'active' || progress.currentObjectiveId !== action.objectiveId) {
    return progress;
  }

  const chapter = getChapter(progress.currentChapterId);
  const objectiveIndex = chapter.objectives.findIndex(
    (objective) => objective.id === action.objectiveId,
  );
  if (objectiveIndex < 0) return progress;
  if (chapter.objectives[objectiveIndex]?.type === 'revelation') return progress;

  const completedObjectiveIds = progress.completedObjectiveIds.includes(action.objectiveId)
    ? progress.completedObjectiveIds
    : [...progress.completedObjectiveIds, action.objectiveId];
  const nextObjective = chapter.objectives[objectiveIndex + 1];

  if (nextObjective) {
    return { ...progress, currentObjectiveId: nextObjective.id, completedObjectiveIds };
  }

  const completedChapterIds = progress.completedChapterIds.includes(chapter.id)
    ? progress.completedChapterIds
    : [...progress.completedChapterIds, chapter.id];

  return {
    ...progress,
    phase: chapter.nextChapterId ? 'chapter-complete' : 'campaign-complete',
    currentObjectiveId: null,
    revelationStage: null,
    completedChapterIds,
    completedObjectiveIds,
  };
}

export function createCheckpoint(
  progress: CampaignProgress,
  id: CheckpointId,
  player: CampaignPlayerSnapshot,
): CampaignCheckpoint | null {
  if (progress.phase !== 'active' || !progress.currentObjectiveId) return null;
  const definition = getChapter(progress.currentChapterId).checkpoints.find(
    (checkpoint) => checkpoint.id === id,
  );
  if (!definition || definition.resumeObjectiveId !== progress.currentObjectiveId) return null;

  return {
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    id,
    progress: cloneProgress(progress),
    player: { ...player },
  };
}

export function restoreCheckpoint(checkpoint: CampaignCheckpoint): CampaignProgress {
  return cloneProgress(checkpoint.progress);
}

export function getNextChapterId(progress: CampaignProgress): ChapterId | null {
  return getChapter(progress.currentChapterId).nextChapterId;
}

export function isCampaignProgressValid(progress: CampaignProgress): boolean {
  if (progress.schemaVersion !== CAMPAIGN_SCHEMA_VERSION) return false;
  if (
    progress.difficulty !== 'story' &&
    progress.difficulty !== 'normal' &&
    progress.difficulty !== 'nightmare'
  ) {
    return false;
  }
  if (new Set(progress.upgrades).size !== progress.upgrades.length) return false;
  if (
    progress.revelationStage !== null &&
    (!Number.isInteger(progress.revelationStage) || progress.revelationStage < 0)
  ) {
    return false;
  }
  if (
    progress.upgrades.some(
      (upgrade) => upgrade !== 'ace' && upgrade !== 'survivor' && upgrade !== 'stormhorn',
    )
  ) {
    return false;
  }

  const chapterIndex = CAMPAIGN_CHAPTERS.findIndex(
    (chapter) => chapter.id === progress.currentChapterId,
  );
  if (chapterIndex < 0) return false;
  const chapter = CAMPAIGN_CHAPTERS[chapterIndex];
  const previousChapters = CAMPAIGN_CHAPTERS.slice(0, chapterIndex);
  const previousObjectives = previousChapters.flatMap((entry) =>
    entry.objectives.map((objective) => objective.id),
  );

  let expectedChapters: readonly ChapterId[];
  let expectedObjectives: readonly string[];
  if (progress.phase === 'campaign-complete') {
    if (chapterIndex !== CAMPAIGN_CHAPTERS.length - 1 || progress.currentObjectiveId !== null) {
      return false;
    }
    if (progress.revelationStage !== null) return false;
    expectedChapters = CAMPAIGN_CHAPTERS.map((entry) => entry.id);
    expectedObjectives = CAMPAIGN_CHAPTERS.flatMap((entry) =>
      entry.objectives.map((objective) => objective.id),
    );
  } else if (progress.phase === 'chapter-complete') {
    if (chapter.nextChapterId === null || progress.currentObjectiveId !== null) return false;
    if (progress.revelationStage !== null) return false;
    expectedChapters = [...previousChapters.map((entry) => entry.id), chapter.id];
    expectedObjectives = [
      ...previousObjectives,
      ...chapter.objectives.map((objective) => objective.id),
    ];
  } else if (progress.phase === 'revelation-pending') {
    const revelationIndex = chapter.objectives.findIndex(
      (objective) => objective.type === 'revelation',
    );
    const revelation = chapter.objectives[revelationIndex];
    if (
      chapterIndex !== CAMPAIGN_CHAPTERS.length - 1 ||
      !revelation ||
      revelation.type !== 'revelation' ||
      revelationIndex < 0 ||
      progress.currentObjectiveId !== revelation.id ||
      progress.revelationStage === null ||
      progress.revelationStage >= revelation.transmissionIds.length
    ) {
      return false;
    }
    expectedChapters = previousChapters.map((entry) => entry.id);
    expectedObjectives = [
      ...previousObjectives,
      ...chapter.objectives.slice(0, revelationIndex).map((objective) => objective.id),
    ];
  } else if (progress.phase === 'active') {
    if (progress.currentObjectiveId === null) return false;
    if (progress.revelationStage !== null) return false;
    const objectiveIndex = chapter.objectives.findIndex(
      (objective) => objective.id === progress.currentObjectiveId,
    );
    if (objectiveIndex < 0) return false;
    expectedChapters = previousChapters.map((entry) => entry.id);
    expectedObjectives = [
      ...previousObjectives,
      ...chapter.objectives.slice(0, objectiveIndex).map((objective) => objective.id),
    ];
  } else {
    return false;
  }

  return (
    orderedEqual(progress.completedChapterIds, expectedChapters) &&
    orderedEqual(progress.completedObjectiveIds, expectedObjectives)
  );
}

function orderedEqual(first: readonly string[], second: readonly string[]): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}
