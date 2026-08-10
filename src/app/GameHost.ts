import { gameStore } from './gameStore';
import { loadBestRun, saveBestRun } from './storage';
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

class GameHost {
  private runtime: GameRuntimePort | null = null;
  private loadingToken = 0;

  async start(
    canvas: HTMLCanvasElement,
    settings: GameSettings,
    difficulty: Difficulty,
  ): Promise<void> {
    const token = ++this.loadingToken;
    let startedRuntime: GameRuntimePort | null = null;
    this.disposeRuntime();
    gameStore.reset({ screen: 'loading', loadingProgress: 0.08 });

    try {
      const { GameRuntime } = await import('../game/GameRuntime');
      if (token !== this.loadingToken) return;
      gameStore.patch({ loadingProgress: 0.42 });
      const runtime: GameRuntimePort = new GameRuntime({
        canvas,
        settings,
        difficulty,
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

  chooseUpgrade(id: UpgradeId): void {
    this.runtime?.chooseUpgrade(id);
    gameStore.patch({ screen: 'playing', selectedUpgrade: id });
    this.runtime?.requestPointerLock();
  }

  updateSettings(settings: GameSettings): void {
    this.runtime?.updateSettings(settings);
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

  private onRunEnded(stats: RunStats, victory: boolean): void {
    if (victory) {
      const candidate = {
        score: stats.score,
        elapsedSeconds: stats.elapsedSeconds,
        rank: stats.rank,
      };
      if (isBetterRun(candidate, loadBestRun())) saveBestRun(candidate);
    }
    gameStore.patch({ screen: victory ? 'revelation' : 'defeat', runStats: stats });
  }

  private disposeRuntime(): void {
    this.runtime?.dispose();
    this.runtime = null;
    if (document.pointerLockElement) void document.exitPointerLock();
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
