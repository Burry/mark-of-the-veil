import { INITIAL_SNAPSHOT } from './defaults';
import type { GameSnapshot } from '../game/types/GameTypes';

type Listener = () => void;

class GameStore {
  private snapshot: GameSnapshot = { ...INITIAL_SNAPSHOT };
  private readonly listeners = new Set<Listener>();

  getSnapshot = (): GameSnapshot => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  patch(patch: Partial<GameSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  reset(preserve: Partial<GameSnapshot> = {}): void {
    this.snapshot = { ...INITIAL_SNAPSHOT, ...preserve };
    this.listeners.forEach((listener) => listener());
  }
}

export const gameStore = new GameStore();
