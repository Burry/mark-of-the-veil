import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, EMPTY_BEST_RUN } from '../../src/app/defaults';
import { loadBestRun, loadSettings, saveBestRun, saveSettings } from '../../src/app/storage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('persistent game data', () => {
  it('uses defaults during server rendering', () => {
    vi.stubGlobal('window', undefined);
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(loadBestRun()).toEqual(EMPTY_BEST_RUN);
  });

  it('merges stored partial settings with current defaults', () => {
    const getItem = vi.fn((key: string) =>
      key.includes('settings') ? JSON.stringify({ musicVolume: 0.21, captions: false }) : null,
    );
    vi.stubGlobal('window', { localStorage: { getItem } });

    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      musicVolume: 0.21,
      captions: false,
    });
  });

  it('falls back when persisted JSON is corrupt', () => {
    vi.stubGlobal('window', {
      localStorage: { getItem: vi.fn(() => '{not-json') },
    });

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(loadBestRun()).toEqual(EMPTY_BEST_RUN);
  });

  it('rejects wrong field types and clamps settings to supported ranges', () => {
    const getItem = vi.fn((key: string) =>
      key.includes('settings')
        ? JSON.stringify({
            masterVolume: 8,
            musicVolume: -4,
            mouseSensitivity: 'fast',
            gamepadDeadzone: 0.9,
            fieldOfView: 140,
            quality: 'cinematic',
            captions: 'yes',
            haptics: false,
          })
        : null,
    );
    vi.stubGlobal('window', { localStorage: { getItem } });

    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      masterVolume: 1,
      musicVolume: 0,
      gamepadDeadzone: 0.35,
      fieldOfView: 100,
      haptics: false,
    });
  });

  it('validates and bounds every persisted best-run field', () => {
    const records = [
      JSON.stringify({ score: -12, elapsedSeconds: Number.MAX_VALUE, rank: 'legendary' }),
      JSON.stringify({ score: 'many', elapsedSeconds: null, rank: 'S' }),
      JSON.stringify([]),
    ];
    const getItem = vi.fn(() => records.shift() ?? null);
    vi.stubGlobal('window', { localStorage: { getItem } });

    expect(loadBestRun()).toEqual({
      score: 0,
      elapsedSeconds: Number.MAX_SAFE_INTEGER,
      rank: 'C',
    });
    expect(loadBestRun()).toEqual({ ...EMPTY_BEST_RUN, rank: 'S' });
    expect(loadBestRun()).toEqual(EMPTY_BEST_RUN);
  });

  it('saves settings and best runs under versioned keys', () => {
    const setItem = vi.fn();
    vi.stubGlobal('window', { localStorage: { setItem } });
    const best = { score: 9_200, elapsedSeconds: 82, rank: 'A' as const };

    saveSettings(DEFAULT_SETTINGS);
    saveBestRun(best);

    expect(setItem).toHaveBeenCalledWith(
      'mark-of-the-veil:settings:v1',
      JSON.stringify(DEFAULT_SETTINGS),
    );
    expect(setItem).toHaveBeenCalledWith('mark-of-the-veil:best-run:v1', JSON.stringify(best));
  });

  it('treats storage write failures as non-fatal', () => {
    vi.stubGlobal('window', {
      localStorage: {
        setItem: vi.fn(() => {
          throw new DOMException('blocked', 'SecurityError');
        }),
      },
    });

    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
    expect(() => saveBestRun(EMPTY_BEST_RUN)).not.toThrow();
  });
});
