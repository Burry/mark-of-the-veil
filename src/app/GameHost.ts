import { gameStore } from './gameStore';
import {
  clearCampaignProgress,
  hasSeenPrologue,
  loadBestRun,
  loadCampaignProgress,
  saveBestRun,
  saveCampaignProgress,
  savePrologueSeen,
} from './storage';
import {
  CAMPAIGN_CHAPTERS,
  createCampaignProgress,
  getChapter,
  reduceCampaign,
  type CampaignProgress,
  type ChapterId,
} from '../game/campaign';
import type {
  BestRun,
  Difficulty,
  GameRuntimePort,
  GameScreen,
  GameSettings,
  GameSnapshot,
  RunStats,
  UpgradeId,
} from '../game/types/GameTypes';

export class GameHost {
  private runtime: GameRuntimePort | null = null;
  private loadingToken = 0;
  private prologueCompletedThisSession = false;
  private campaignProgress: CampaignProgress =
    loadCampaignProgress() ?? createCampaignProgress('normal');
  private selectedChapterId: ChapterId = this.campaignProgress.currentChapterId;

  getCampaignProgress(): CampaignProgress {
    return this.campaignProgress;
  }

  getSelectedChapterId(): ChapterId {
    return this.selectedChapterId;
  }

  openCampaign(): void {
    this.loadingToken += 1;
    this.disposeRuntime();
    if (this.shouldShowPrologue()) {
      gameStore.reset({ screen: 'prologue' });
      return;
    }
    if (this.campaignProgress.phase === 'campaign-complete') {
      this.selectedChapterId = 'the-root-choir';
    } else {
      this.selectedChapterId = this.campaignProgress.currentChapterId;
    }
    const chapter = getChapter(this.selectedChapterId);
    gameStore.reset({
      screen: this.campaignProgress.phase === 'revelation-pending' ? 'revelation' : 'campaign',
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
    });
  }

  completePrologue(): void {
    this.prologueCompletedThisSession = true;
    savePrologueSeen();
    this.openCampaign();
  }

  newCampaign(difficulty: Difficulty): void {
    this.loadingToken += 1;
    this.disposeRuntime();
    clearCampaignProgress();
    this.campaignProgress = createCampaignProgress(difficulty);
    this.selectedChapterId = this.campaignProgress.currentChapterId;
    saveCampaignProgress(this.campaignProgress);
    const chapter = getChapter(this.selectedChapterId);
    gameStore.reset({
      screen: 'campaign',
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
    });
  }

  selectChapter(chapterId: ChapterId): boolean {
    if (!this.isChapterUnlocked(chapterId)) return false;
    this.selectedChapterId = chapterId;
    const chapter = getChapter(chapterId);
    gameStore.patch({
      screen: 'chapterBriefing',
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      objective: chapter.objectives[0]?.title ?? 'AWAIT ORDERS',
      objectiveDetail: chapter.narrative.premise,
    });
    return true;
  }

  setDifficulty(difficulty: Difficulty): void {
    if (this.campaignProgress.difficulty === difficulty) return;
    this.campaignProgress = { ...this.campaignProgress, difficulty };
    saveCampaignProgress(this.campaignProgress);
  }

  async start(
    canvas: HTMLCanvasElement,
    settings: GameSettings,
    difficulty: Difficulty,
    chapterId: ChapterId = this.selectedChapterId,
  ): Promise<void> {
    if (!this.isChapterUnlocked(chapterId)) return;
    this.selectedChapterId = chapterId;
    this.setDifficulty(difficulty);
    const chapter = getChapter(chapterId);
    const token = ++this.loadingToken;
    let startedRuntime: GameRuntimePort | null = null;
    this.disposeRuntime();
    gameStore.reset({
      screen: 'loading',
      loadingProgress: 0.08,
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
    });

    try {
      const { GameRuntime } = await import('../game/GameRuntime');
      if (token !== this.loadingToken) return;
      gameStore.patch({ loadingProgress: 0.42 });
      const runtime: GameRuntimePort = new GameRuntime({
        canvas,
        settings,
        difficulty,
        chapterId,
        callbacks: {
          publish: (patch: Partial<GameSnapshot>) => gameStore.patch(patch),
          requestScreen: (screen: GameScreen) => gameStore.patch({ screen }),
          requestUpgrade: () => gameStore.patch({ screen: 'upgrade' }),
          runEnded: (stats: RunStats, victory: boolean) => this.onRunEnded(stats, victory),
        },
      });
      startedRuntime = runtime;
      this.runtime = runtime;
      await runtime.start();
      if (token !== this.loadingToken) return;
      gameStore.patch({ screen: 'playing', loadingProgress: 1 });
    } catch (error) {
      if (startedRuntime && this.runtime === startedRuntime) this.disposeRuntime();
      if (token !== this.loadingToken) return;
      console.error('Unable to start the game runtime', error);
      gameStore.patch({
        screen: 'unsupported',
        caption: startupFailureCaption(error),
      });
    }
  }

  pause(): void {
    if (!this.runtime) return;
    this.runtime.pause();
    gameStore.patch({ screen: 'paused', pointerLocked: false });
  }

  resume(): void {
    if (!this.runtime) return;
    this.runtime.resume();
    gameStore.patch({ screen: 'playing' });
    this.runtime.requestPointerLock();
  }

  restart(): void {
    if (!this.runtime) return;
    this.runtime.restart();
    gameStore.patch({ screen: 'playing', runStats: null });
    this.runtime.requestPointerLock();
  }

  replayFinalChapter(): void {
    this.loadingToken += 1;
    this.disposeRuntime();
    this.selectedChapterId = 'the-root-choir';
    const chapter = getChapter(this.selectedChapterId);
    gameStore.reset({
      screen: 'chapterBriefing',
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      objective: chapter.objectives[0]?.title ?? 'AWAIT ORDERS',
      objectiveDetail: chapter.narrative.premise,
    });
  }

  chooseUpgrade(id: UpgradeId): void {
    this.runtime?.chooseUpgrade(id);
    if (!this.campaignProgress.upgrades.includes(id)) {
      this.campaignProgress = reduceCampaign(this.campaignProgress, {
        type: 'upgrade-acquired',
        upgradeId: id,
      });
      saveCampaignProgress(this.campaignProgress);
    }
    gameStore.patch({ screen: 'playing', selectedUpgrade: id });
    this.runtime?.requestPointerLock();
  }

  setRevelationStage(stage: number): void {
    const next = reduceCampaign(this.campaignProgress, {
      type: 'revelation-stage-changed',
      stage,
    });
    if (next === this.campaignProgress) return;
    this.campaignProgress = next;
    saveCampaignProgress(this.campaignProgress);
  }

  completeRevelation(): void {
    const next = reduceCampaign(this.campaignProgress, { type: 'revelation-completed' });
    if (next === this.campaignProgress) return;
    this.campaignProgress = next;
    saveCampaignProgress(this.campaignProgress);
    gameStore.patch({ screen: 'victory' });
  }

  continueCampaign(): void {
    if (
      this.selectedChapterId !== this.campaignProgress.currentChapterId ||
      this.campaignProgress.phase !== 'chapter-complete'
    ) {
      this.openCampaign();
      return;
    }
    this.campaignProgress = reduceCampaign(this.campaignProgress, { type: 'continue-campaign' });
    saveCampaignProgress(this.campaignProgress);
    this.selectedChapterId = this.campaignProgress.currentChapterId;
    const chapter = getChapter(this.selectedChapterId);
    this.disposeRuntime();
    gameStore.reset({
      screen: 'chapterBriefing',
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
    });
  }

  updateSettings(settings: GameSettings): void {
    this.runtime?.updateSettings(settings);
  }

  returnToCampaign(): void {
    this.loadingToken += 1;
    this.disposeRuntime();
    const chapter = getChapter(this.campaignProgress.currentChapterId);
    gameStore.reset({
      screen: 'campaign',
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
    });
  }

  returnToTitle(): void {
    this.loadingToken += 1;
    this.disposeRuntime();
    gameStore.reset({ screen: 'title' });
  }

  dispose(): void {
    this.loadingToken += 1;
    this.disposeRuntime();
  }

  private isChapterUnlocked(chapterId: ChapterId): boolean {
    const chapterIndex = CAMPAIGN_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
    const currentIndex = CAMPAIGN_CHAPTERS.findIndex(
      (chapter) => chapter.id === this.campaignProgress.currentChapterId,
    );
    return (
      chapterIndex >= 0 &&
      (chapterIndex <= currentIndex ||
        this.campaignProgress.completedChapterIds.includes(chapterId))
    );
  }

  private onRunEnded(stats: RunStats, victory: boolean): void {
    if (victory) {
      const candidate = {
        score: stats.score,
        elapsedSeconds: stats.elapsedSeconds,
        rank: stats.rank,
      };
      if (isBetterRun(candidate, loadBestRun())) saveBestRun(candidate);

      if (
        this.selectedChapterId === this.campaignProgress.currentChapterId &&
        this.campaignProgress.phase === 'active'
      ) {
        const chapter = getChapter(this.campaignProgress.currentChapterId);
        for (const objective of chapter.objectives) {
          if (objective.type === 'revelation') break;
          if (this.campaignProgress.completedObjectiveIds.includes(objective.id)) continue;
          this.campaignProgress = reduceCampaign(this.campaignProgress, {
            type: 'objective-completed',
            objectiveId: objective.id,
          });
        }
        if (
          chapter.id === 'the-root-choir' &&
          chapter.objectives.some(
            (objective) =>
              objective.type === 'revelation' &&
              objective.id === this.campaignProgress.currentObjectiveId,
          )
        ) {
          this.campaignProgress = reduceCampaign(this.campaignProgress, {
            type: 'revelation-started',
          });
        }
        saveCampaignProgress(this.campaignProgress);
      }
    }

    const finalVictory =
      victory &&
      this.selectedChapterId === 'the-root-choir' &&
      this.campaignProgress.phase === 'revelation-pending';
    gameStore.patch({
      screen: finalVictory ? 'revelation' : victory ? 'chapterComplete' : 'defeat',
      runStats: stats,
    });
  }

  private disposeRuntime(): void {
    this.runtime?.dispose();
    this.runtime = null;
    if (document.pointerLockElement) void document.exitPointerLock();
  }

  private shouldShowPrologue(): boolean {
    const firstChapter = CAMPAIGN_CHAPTERS[0];
    return (
      !this.prologueCompletedThisSession &&
      !hasSeenPrologue() &&
      this.campaignProgress.phase === 'active' &&
      this.campaignProgress.currentChapterId === firstChapter.id &&
      this.campaignProgress.currentObjectiveId === firstChapter.objectives[0].id &&
      this.campaignProgress.completedChapterIds.length === 0 &&
      this.campaignProgress.completedObjectiveIds.length === 0
    );
  }
}

const RANK_VALUE: Record<BestRun['rank'], number> = { C: 0, B: 1, A: 2, S: 3 };

function startupFailureCaption(error: unknown): string {
  if (error instanceof Error && /WebGL\s*2/i.test(error.message)) {
    return 'WebGL 2 could not start on this device.';
  }
  return 'The game runtime or one of its assets failed to load. Reload to request a fresh deployment.';
}

function isBetterRun(candidate: BestRun, current: BestRun): boolean {
  if (candidate.score !== current.score) return candidate.score > current.score;
  if (RANK_VALUE[candidate.rank] !== RANK_VALUE[current.rank]) {
    return RANK_VALUE[candidate.rank] > RANK_VALUE[current.rank];
  }
  if (candidate.elapsedSeconds <= 0) return false;
  return current.elapsedSeconds <= 0 || candidate.elapsedSeconds < current.elapsedSeconds;
}

export const gameHost = new GameHost();

export function setScreen(screen: GameScreen): void {
  gameStore.patch({ screen });
}
