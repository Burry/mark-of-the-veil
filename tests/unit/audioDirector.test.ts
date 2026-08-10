import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/app/defaults';
import { AudioDirector } from '../../src/game/audio/AudioDirector';
import type { AudioEvent } from '../../src/game/audio/types';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AudioDirector capability handling', () => {
  it('keeps unsupported environments silent and safe', async () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    const director = new AudioDirector(DEFAULT_SETTINGS);
    const events: AudioEvent[] = [
      'shot',
      'hit',
      'critical',
      'reload',
      'dash',
      'pulse',
      'playerDamage',
      'enemyAttack',
      'enemyDeath',
      'seal',
      'boss',
      'victory',
      'defeat',
      'ui',
    ];

    await expect(director.start()).resolves.toBeUndefined();
    for (const event of events) director.play(event, { x: 1, y: 2, z: 3 });
    director.setListener({ x: 0, y: 1, z: 2 });
    director.setIntensity(2);
    director.updateSettings({ ...DEFAULT_SETTINGS, masterVolume: 0 });
    director.pause();
    await expect(director.resume()).resolves.toBeUndefined();
    expect(() => {
      director.dispose();
      director.dispose();
    }).not.toThrow();
  });

  it('does not construct an audio context until start is called', async () => {
    let constructions = 0;
    const close = vi.fn(async () => undefined);
    class IncompleteAudioContext {
      readonly state = 'suspended';

      constructor() {
        constructions += 1;
      }

      close = close;
    }
    vi.stubGlobal('AudioContext', IncompleteAudioContext);
    vi.stubGlobal('webkitAudioContext', undefined);

    const director = new AudioDirector(DEFAULT_SETTINGS);
    expect(constructions).toBe(0);
    await expect(director.start()).resolves.toBeUndefined();
    expect(constructions).toBe(1);
    expect(close).toHaveBeenCalledTimes(1);
    director.dispose();
  });
});
