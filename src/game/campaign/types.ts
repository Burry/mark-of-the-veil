import type { Difficulty, GameSnapshot, UpgradeId } from '../types/GameTypes';
import type { EnemyKind } from '../systems/WorldTypes';

export const CAMPAIGN_SCHEMA_VERSION = 1 as const;

export type ChapterId =
  | 'ashes-of-home'
  | 'the-root-vault'
  | 'vespera-in-black'
  | 'the-drowned-cathedral'
  | 'the-silent-orbit'
  | 'the-memory-forge'
  | 'crown-of-eidolon'
  | 'the-root-choir';

export type ObjectiveId = `${ChapterId}:${string}`;
export type CheckpointId = `${ChapterId}:checkpoint:${string}`;

export interface ObjectiveCopy {
  readonly title: string;
  readonly detail: string;
}

interface ObjectiveBase extends ObjectiveCopy {
  readonly id: ObjectiveId;
  readonly optional?: false;
}

export interface TutorialObjective extends ObjectiveBase {
  readonly type: 'tutorial';
  readonly lessons: readonly (
    'move' | 'look' | 'focus' | 'fire' | 'reload' | 'dash' | 'horn-pulse' | 'perspective'
  )[];
}

export interface ReachObjective extends ObjectiveBase {
  readonly type: 'reach';
  readonly destinationId: string;
  readonly radius: number;
}

export interface InteractObjective extends ObjectiveBase {
  readonly type: 'interact';
  readonly targetId: string;
  readonly interaction: 'recover' | 'activate' | 'decrypt' | 'free' | 'board' | 'interface';
}

export interface EliminateObjective extends ObjectiveBase {
  readonly type: 'eliminate';
  readonly encounterId: string;
  readonly count: number;
  readonly enemyKinds: readonly EnemyKind[];
}

export interface DefendObjective extends ObjectiveBase {
  readonly type: 'defend';
  readonly encounterId: string;
  readonly anchorId: string;
  readonly durationSeconds: number;
  readonly enemyKinds: readonly EnemyKind[];
}

export interface DestroyObjective extends ObjectiveBase {
  readonly type: 'destroy';
  readonly targetIds: readonly string[];
}

export interface SurviveObjective extends ObjectiveBase {
  readonly type: 'survive';
  readonly encounterId: string;
  readonly durationSeconds: number;
}

export interface EscortObjective extends ObjectiveBase {
  readonly type: 'escort';
  readonly subjectId: string;
  readonly destinationId: string;
  readonly maxSeparation: number;
}

export interface InvestigateObjective extends ObjectiveBase {
  readonly type: 'investigate';
  readonly evidenceIds: readonly string[];
}

export interface BossObjective extends ObjectiveBase {
  readonly type: 'boss';
  readonly bossId: string;
  readonly phases: number;
}

export interface EscapeObjective extends ObjectiveBase {
  readonly type: 'escape';
  readonly destinationId: string;
  readonly timeLimitSeconds?: number;
}

export interface InfiltrateObjective extends ObjectiveBase {
  readonly type: 'infiltrate';
  readonly nodeIds: readonly string[];
}

export interface RevelationObjective extends ObjectiveBase {
  readonly type: 'revelation';
  readonly transmissionIds: readonly string[];
}

export type CampaignObjective =
  | TutorialObjective
  | ReachObjective
  | InteractObjective
  | EliminateObjective
  | DefendObjective
  | DestroyObjective
  | SurviveObjective
  | EscortObjective
  | InvestigateObjective
  | BossObjective
  | EscapeObjective
  | InfiltrateObjective
  | RevelationObjective;

export interface CampaignCheckpointDefinition {
  readonly id: CheckpointId;
  readonly label: string;
  readonly spawnId: string;
  readonly resumeObjectiveId: ObjectiveId;
}

export interface CampaignNarrative {
  readonly premise: string;
  readonly opening: string;
  readonly reversal: string;
  readonly closing: string;
}

export interface CampaignBoss {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
}

export interface CampaignChapter {
  readonly id: ChapterId;
  readonly number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly act: 1 | 2 | 3;
  readonly title: string;
  readonly subtitle: string;
  readonly location: string;
  readonly sceneId: string;
  readonly estimatedMinutes: readonly [minimum: number, maximum: number];
  readonly boss: CampaignBoss;
  readonly narrative: CampaignNarrative;
  readonly objectives: readonly CampaignObjective[];
  readonly checkpoints: readonly CampaignCheckpointDefinition[];
  readonly nextChapterId: ChapterId | null;
}

export type CampaignPhase =
  'active' | 'chapter-complete' | 'revelation-pending' | 'campaign-complete';

export interface CampaignProgress {
  readonly schemaVersion: typeof CAMPAIGN_SCHEMA_VERSION;
  readonly phase: CampaignPhase;
  readonly difficulty: Difficulty;
  readonly currentChapterId: ChapterId;
  readonly currentObjectiveId: ObjectiveId | null;
  readonly revelationStage: number | null;
  readonly completedChapterIds: readonly ChapterId[];
  readonly completedObjectiveIds: readonly ObjectiveId[];
  readonly upgrades: readonly UpgradeId[];
}

export type CampaignPlayerSnapshot = Pick<
  GameSnapshot,
  | 'health'
  | 'maxHealth'
  | 'shield'
  | 'maxShield'
  | 'ammo'
  | 'magazineSize'
  | 'reserveAmmo'
  | 'perspective'
  | 'score'
>;

export interface CampaignCheckpoint {
  readonly schemaVersion: typeof CAMPAIGN_SCHEMA_VERSION;
  readonly id: CheckpointId;
  readonly progress: CampaignProgress;
  readonly player: CampaignPlayerSnapshot;
}

export type CampaignAction =
  | { readonly type: 'objective-completed'; readonly objectiveId: ObjectiveId }
  | { readonly type: 'continue-campaign' }
  | { readonly type: 'restart-chapter' }
  | { readonly type: 'revelation-started' }
  | { readonly type: 'revelation-stage-changed'; readonly stage: number }
  | { readonly type: 'revelation-completed' }
  | { readonly type: 'upgrade-acquired'; readonly upgradeId: UpgradeId };
