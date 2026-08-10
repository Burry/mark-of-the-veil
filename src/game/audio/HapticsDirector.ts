import type { GameSettings } from '../types/GameTypes';
import { clamp01 } from './audioMath';
import { HAPTIC_PATTERNS, resolveHapticPattern } from './hapticPatterns';
import type { FeedbackSettingsSource, HapticEvent } from './types';

interface DualRumbleParameters {
  startDelay: number;
  duration: number;
  weakMagnitude: number;
  strongMagnitude: number;
}

interface HapticActuator {
  playEffect?: (effect: 'dual-rumble', parameters: DualRumbleParameters) => Promise<unknown>;
  pulse?: (magnitude: number, duration: number) => Promise<unknown>;
  reset?: () => Promise<unknown>;
}

type HapticGamepad = Gamepad & {
  vibrationActuator?: HapticActuator;
  hapticActuators?: readonly HapticActuator[];
};

export interface HapticsEnvironment {
  now: () => number;
  gamepads: () => readonly (Gamepad | null)[];
  vibrate: (pattern: number | number[]) => boolean;
}

function defaultEnvironment(): HapticsEnvironment {
  return {
    now: () => globalThis.performance?.now?.() ?? Date.now(),
    gamepads: () => {
      if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function')
        return [];
      return Array.from(navigator.getGamepads());
    },
    vibrate: (pattern) => {
      if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
      return navigator.vibrate(pattern);
    },
  };
}

function actuatorFor(gamepad: Gamepad | null | undefined): HapticActuator | null {
  if (!gamepad || gamepad.connected === false) return null;
  const hapticGamepad = gamepad as HapticGamepad;
  return hapticGamepad.vibrationActuator ?? hapticGamepad.hapticActuators?.[0] ?? null;
}

export class HapticsDirector {
  private settings: GameSettings;
  private readonly settingsGetter: (() => GameSettings) | null;
  private readonly environment: HapticsEnvironment;
  private readonly lastPlayedAt = new Map<HapticEvent, number>();
  private intensity = 1;
  private paused = false;
  private disposed = false;

  constructor(
    settings: FeedbackSettingsSource,
    environment: HapticsEnvironment = defaultEnvironment(),
  ) {
    this.settingsGetter = typeof settings === 'function' ? settings : null;
    this.settings = typeof settings === 'function' ? settings() : settings;
    this.environment = environment;
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    if (!settings.haptics) this.stop();
  }

  setIntensity(intensity: number): void {
    this.intensity = clamp01(intensity);
  }

  play(event: HapticEvent, strength = 1, preferredGamepad?: Gamepad): void {
    if (this.disposed || this.paused || !this.currentSettings().haptics || this.intensity <= 0)
      return;

    const now = this.safeNow();
    const lastPlayed = this.lastPlayedAt.get(event);
    if (lastPlayed !== undefined && now - lastPlayed < HAPTIC_PATTERNS[event].cooldownMs) return;
    this.lastPlayedAt.set(event, now);

    const pattern = resolveHapticPattern(event, this.intensity, strength);
    const gamepad =
      actuatorFor(preferredGamepad) !== null
        ? preferredGamepad
        : this.safeGamepads().find((candidate) => actuatorFor(candidate) !== null);
    const actuator = actuatorFor(gamepad);

    if (actuator?.playEffect) {
      try {
        void Promise.resolve(
          actuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: pattern.durationMs,
            weakMagnitude: pattern.weakMagnitude,
            strongMagnitude: pattern.strongMagnitude,
          }),
        ).catch(() => this.vibrateFallback(pattern.vibrate));
      } catch {
        this.vibrateFallback(pattern.vibrate);
      }
      return;
    }

    if (actuator?.pulse) {
      try {
        void Promise.resolve(
          actuator.pulse(
            Math.max(pattern.weakMagnitude, pattern.strongMagnitude),
            pattern.durationMs,
          ),
        ).catch(() => this.vibrateFallback(pattern.vibrate));
      } catch {
        this.vibrateFallback(pattern.vibrate);
      }
      return;
    }

    this.vibrateFallback(pattern.vibrate);
  }

  pause(): void {
    if (this.disposed) return;
    this.paused = true;
    this.stop();
  }

  resume(): void {
    if (this.disposed) return;
    this.paused = false;
  }

  dispose(): void {
    if (this.disposed) return;
    this.stop();
    this.lastPlayedAt.clear();
    this.disposed = true;
  }

  private currentSettings(): GameSettings {
    if (!this.settingsGetter) return this.settings;
    try {
      return this.settingsGetter();
    } catch {
      return this.settings;
    }
  }

  private safeGamepads(): readonly (Gamepad | null)[] {
    try {
      return this.environment.gamepads();
    } catch {
      return [];
    }
  }

  private safeNow(): number {
    try {
      const now = this.environment.now();
      return Number.isFinite(now) ? now : Date.now();
    } catch {
      return Date.now();
    }
  }

  private vibrateFallback(pattern: readonly number[]): void {
    if (this.disposed || this.paused || !this.currentSettings().haptics) return;
    try {
      this.environment.vibrate([...pattern]);
    } catch {
      // Haptics are progressive enhancement and must never interrupt gameplay.
    }
  }

  private stop(): void {
    try {
      this.environment.vibrate(0);
    } catch {
      // Ignore capability and permissions changes.
    }

    for (const gamepad of this.safeGamepads()) {
      const actuator = actuatorFor(gamepad);
      if (actuator?.reset) {
        try {
          void Promise.resolve(actuator.reset()).catch(() => undefined);
        } catch {
          // A disconnected controller can throw synchronously.
        }
      } else if (actuator?.playEffect) {
        try {
          void Promise.resolve(
            actuator.playEffect('dual-rumble', {
              startDelay: 0,
              duration: 0,
              weakMagnitude: 0,
              strongMagnitude: 0,
            }),
          ).catch(() => undefined);
        } catch {
          // A disconnected controller can throw synchronously.
        }
      }
    }
  }
}
