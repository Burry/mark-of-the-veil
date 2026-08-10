import { afterEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_SNAPSHOT } from '../../src/app/defaults';
import { gameStore } from '../../src/app/gameStore';

afterEach(() => {
  gameStore.reset();
});

describe('gameStore', () => {
  it('publishes immutable snapshot patches to subscribers', () => {
    const listener = vi.fn();
    const before = gameStore.getSnapshot();
    const unsubscribe = gameStore.subscribe(listener);

    gameStore.patch({ health: 71, score: 400 });
    const after = gameStore.getSnapshot();

    expect(after).not.toBe(before);
    expect(after.health).toBe(71);
    expect(after.score).toBe(400);
    expect(after.weaponName).toBe(INITIAL_SNAPSHOT.weaponName);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    gameStore.patch({ score: 800 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('resets state while preserving explicit host-owned values', () => {
    gameStore.patch({ health: 1, perspective: 'first', inputDevice: 'gamepad' });
    gameStore.reset({ perspective: 'first', inputDevice: 'gamepad' });

    expect(gameStore.getSnapshot()).toEqual({
      ...INITIAL_SNAPSHOT,
      perspective: 'first',
      inputDevice: 'gamepad',
    });
  });
});
