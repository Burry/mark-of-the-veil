import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/app/defaults';
import { GameHost, gameHost } from '../../src/app/GameHost';
import { gameStore } from '../../src/app/gameStore';
import { CAMPAIGN_CHAPTERS } from '../../src/game/campaign';
import type { RunStats, RuntimeOptions } from '../../src/game/types/GameTypes';

const runtimeMocks = vi.hoisted(() => {
  const construct = vi.fn();
  const start = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();
  const restart = vi.fn();
  const chooseUpgrade = vi.fn();
  const updateSettings = vi.fn();
  const requestPointerLock = vi.fn();
  const dispose = vi.fn();

  class MockGameRuntime {
    constructor(options: unknown) {
      construct(options);
    }

    start = start;
    pause = pause;
    resume = resume;
    restart = restart;
    chooseUpgrade = chooseUpgrade;
    updateSettings = updateSettings;
    requestPointerLock = requestPointerLock;
    dispose = dispose;
  }

  return {
    MockGameRuntime,
    chooseUpgrade,
    construct,
    dispose,
    pause,
    requestPointerLock,
    restart,
    resume,
    start,
    updateSettings,
  };
});

vi.mock('../../src/game/GameRuntime', () => ({ GameRuntime: runtimeMocks.MockGameRuntime }));

const STATS: RunStats = {
  score: 8_000,
  elapsedSeconds: 100,
  kills: 24,
  shotsFired: 200,
  shotsHit: 120,
  damageTaken: 30,
  rank: 'A',
};

beforeEach(() => {
  vi.clearAllMocks();
  runtimeMocks.start.mockResolvedValue(undefined);
  gameStore.reset();
  vi.stubGlobal('document', {
    pointerLockElement: null,
    exitPointerLock: vi.fn(async () => undefined),
  });
  gameHost.newCampaign('normal');
  gameStore.reset();
});

afterEach(() => {
  gameHost.dispose();
  gameStore.reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('GameHost lifecycle', () => {
  it('shows the cold open once before entering the campaign map', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => values.set(key, value)),
        removeItem: vi.fn((key: string) => values.delete(key)),
      },
    });
    gameHost.newCampaign('normal');

    gameHost.openCampaign();
    expect(gameStore.getSnapshot().screen).toBe('prologue');

    gameHost.completePrologue();
    expect(gameStore.getSnapshot().screen).toBe('campaign');
    expect(values.get('mark-of-the-veil:prologue:v1')).toBe('seen');

    gameHost.returnToTitle();
    gameHost.openCampaign();
    expect(gameStore.getSnapshot().screen).toBe('campaign');
  });

  it('advances past the prologue for the session when browser storage is denied', () => {
    const deniedHost = new GameHost();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new DOMException('blocked', 'SecurityError');
        }),
        removeItem: vi.fn(() => {
          throw new DOMException('blocked', 'SecurityError');
        }),
      },
    });
    deniedHost.newCampaign('normal');

    deniedHost.openCampaign();
    expect(gameStore.getSnapshot().screen).toBe('prologue');

    expect(() => deniedHost.completePrologue()).not.toThrow();
    expect(gameStore.getSnapshot().screen).toBe('campaign');

    deniedHost.returnToTitle();
    deniedHost.openCampaign();
    expect(gameStore.getSnapshot().screen).toBe('campaign');
    deniedHost.dispose();
  });

  it('disposes a partially started runtime before showing the fallback screen', async () => {
    const error = new Error('renderer initialization failed');
    runtimeMocks.start.mockRejectedValueOnce(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await gameHost.start({} as HTMLCanvasElement, DEFAULT_SETTINGS, 'normal');

    expect(runtimeMocks.dispose).toHaveBeenCalledTimes(1);
    expect(runtimeMocks.pause).not.toHaveBeenCalled();
    expect(gameStore.getSnapshot()).toMatchObject({
      screen: 'unsupported',
      caption:
        'The game runtime or one of its assets failed to load. Reload to request a fresh deployment.',
    });
    expect(consoleError).toHaveBeenCalledWith('Unable to start the game runtime', error);
  });

  it('identifies a WebGL 2 capability failure without mislabeling other startup errors', async () => {
    const error = new Error('WebGL 2 is required to enter Vespera.');
    runtimeMocks.start.mockRejectedValueOnce(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await gameHost.start({} as HTMLCanvasElement, DEFAULT_SETTINGS, 'normal');

    expect(gameStore.getSnapshot()).toMatchObject({
      screen: 'unsupported',
      caption: 'WebGL 2 could not start on this device.',
    });
    expect(consoleError).toHaveBeenCalledWith('Unable to start the game runtime', error);
  });

  it('does not let an obsolete startup failure replace a newer title state', async () => {
    let rejectStart: ((reason: Error) => void) | undefined;
    runtimeMocks.start.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectStart = reject;
        }),
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const startPromise = gameHost.start({} as HTMLCanvasElement, DEFAULT_SETTINGS, 'normal');
    await vi.waitFor(() => expect(runtimeMocks.construct).toHaveBeenCalledTimes(1));

    gameHost.returnToTitle();
    rejectStart?.(new Error('disposed during startup'));
    await startPromise;

    expect(runtimeMocks.dispose).toHaveBeenCalledTimes(1);
    expect(gameStore.getSnapshot().screen).toBe('title');
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('keeps the highest-scoring run and uses rank then time as tie-breakers', async () => {
    const current = { score: 8_000, elapsedSeconds: 100, rank: 'A' as const };
    const getItem = vi.fn((key: string) =>
      key.includes('best-run') ? JSON.stringify(current) : null,
    );
    const setItem = vi.fn();
    vi.stubGlobal('window', { localStorage: { getItem, setItem } });
    await gameHost.start({} as HTMLCanvasElement, DEFAULT_SETTINGS, 'normal');
    const options = runtimeMocks.construct.mock.calls[0]?.[0] as RuntimeOptions;

    options.callbacks.runEnded({ ...STATS, score: 7_999, rank: 'S' }, true);
    expect(setItem.mock.calls.filter(([key]) => String(key).includes('best-run'))).toHaveLength(0);
    expect(gameStore.getSnapshot().screen).toBe('chapterComplete');

    options.callbacks.runEnded({ ...STATS, score: 8_000, rank: 'S' }, true);
    expect(setItem.mock.calls).toContainEqual([
      'mark-of-the-veil:best-run:v1',
      JSON.stringify({ score: 8_000, elapsedSeconds: 100, rank: 'S' }),
    ]);

    setItem.mockClear();
    options.callbacks.runEnded({ ...STATS, elapsedSeconds: 99 }, true);
    expect(setItem).toHaveBeenLastCalledWith(
      'mark-of-the-veil:best-run:v1',
      JSON.stringify({ score: 8_000, elapsedSeconds: 99, rank: 'A' }),
    );
  });

  it('routes a successful chapter through debrief and reuses the runtime for replay', async () => {
    const setItem = vi.fn();
    vi.stubGlobal('window', {
      localStorage: { getItem: vi.fn(() => null), setItem },
    });
    await gameHost.start({} as HTMLCanvasElement, DEFAULT_SETTINGS, 'normal');
    const options = runtimeMocks.construct.mock.calls[0]?.[0] as RuntimeOptions;

    options.callbacks.runEnded(STATS, true);
    expect(gameStore.getSnapshot()).toMatchObject({ screen: 'chapterComplete', runStats: STATS });

    gameHost.restart();
    expect(runtimeMocks.restart).toHaveBeenCalledTimes(1);
    expect(runtimeMocks.requestPointerLock).toHaveBeenCalledTimes(1);
    expect(gameStore.getSnapshot()).toMatchObject({ screen: 'playing', runStats: null });
  });

  it('persists the final transmission before completing the campaign', async () => {
    const values = new Map<string, string>([['mark-of-the-veil:prologue:v1', 'seen']]);
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => values.set(key, value)),
        removeItem: vi.fn((key: string) => values.delete(key)),
      },
    });
    gameHost.newCampaign('normal');

    for (let chapterIndex = 0; chapterIndex < CAMPAIGN_CHAPTERS.length; chapterIndex += 1) {
      await gameHost.start({} as HTMLCanvasElement, DEFAULT_SETTINGS, 'normal');
      const options = runtimeMocks.construct.mock.calls.at(-1)?.[0] as RuntimeOptions;
      options.callbacks.runEnded(STATS, true);
      if (chapterIndex < CAMPAIGN_CHAPTERS.length - 1) gameHost.continueCampaign();
    }

    const revelation = CAMPAIGN_CHAPTERS.at(-1)?.objectives.find(
      (objective) => objective.type === 'revelation',
    );
    if (!revelation || revelation.type !== 'revelation') {
      throw new Error('Expected the final revelation objective');
    }

    expect(gameStore.getSnapshot().screen).toBe('revelation');
    expect(gameHost.getCampaignProgress()).toMatchObject({
      phase: 'revelation-pending',
      currentObjectiveId: revelation.id,
      revelationStage: 0,
    });
    expect(gameHost.getCampaignProgress().completedObjectiveIds).not.toContain(revelation.id);

    gameHost.setRevelationStage(3);
    gameHost.returnToTitle();
    gameHost.openCampaign();
    expect(gameStore.getSnapshot().screen).toBe('revelation');
    expect(gameHost.getCampaignProgress().revelationStage).toBe(3);

    gameHost.completeRevelation();
    expect(gameHost.getCampaignProgress().phase).toBe('revelation-pending');

    gameHost.setRevelationStage(revelation.transmissionIds.length - 1);
    gameHost.completeRevelation();
    expect(gameStore.getSnapshot().screen).toBe('victory');
    expect(gameHost.getCampaignProgress()).toMatchObject({
      phase: 'campaign-complete',
      currentObjectiveId: null,
      revelationStage: null,
    });
    expect(gameHost.getCampaignProgress().completedObjectiveIds).toContain(revelation.id);

    gameHost.replayFinalChapter();
    expect(gameStore.getSnapshot()).toMatchObject({
      screen: 'chapterBriefing',
      chapterId: 'the-root-choir',
    });
  });
});
