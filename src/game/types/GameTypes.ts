export type GameScreen =
  | 'title'
  | 'briefing'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'upgrade'
  | 'revelation'
  | 'victory'
  | 'defeat'
  | 'settings'
  | 'controls'
  | 'credits'
  | 'unsupported';

export type Difficulty = 'story' | 'normal' | 'nightmare';
export type Quality = 'low' | 'medium' | 'high';
export type Perspective = 'first' | 'third';
export type InputDevice = 'keyboard' | 'gamepad';
export type UpgradeId = 'ace' | 'survivor' | 'stormhorn';

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  ambienceVolume: number;
  mouseSensitivity: number;
  gamepadSensitivity: number;
  gamepadDeadzone: number;
  fieldOfView: number;
  quality: Quality;
  captions: boolean;
  highContrastReticle: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  reducedFlashes: boolean;
  cameraShake: number;
  aimAssist: number;
  invertY: boolean;
}

export interface RunStats {
  score: number;
  elapsedSeconds: number;
  kills: number;
  shotsFired: number;
  shotsHit: number;
  damageTaken: number;
  rank: 'S' | 'A' | 'B' | 'C';
}

export interface GameSnapshot {
  screen: GameScreen;
  loadingProgress: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  ammo: number;
  magazineSize: number;
  reserveAmmo: number;
  weaponName: string;
  dashCooldown: number;
  pulseCooldown: number;
  perspective: Perspective;
  objective: string;
  objectiveDetail: string;
  seals: number;
  totalSeals: number;
  enemiesRemaining: number;
  bossName: string | null;
  bossHealth: number;
  bossMaxHealth: number;
  score: number;
  multiplier: number;
  hitMarker: number;
  damageDirection: number | null;
  caption: string | null;
  interactPrompt: string | null;
  pointerLocked: boolean;
  inputDevice: InputDevice;
  selectedUpgrade: UpgradeId | null;
  runStats: RunStats | null;
  fps: number;
}

export interface BestRun {
  score: number;
  elapsedSeconds: number;
  rank: RunStats['rank'];
}

export interface GameCallbacks {
  publish: (patch: Partial<GameSnapshot>) => void;
  requestScreen: (screen: GameScreen) => void;
  requestUpgrade: () => void;
  runEnded: (stats: RunStats, victory: boolean) => void;
}

export interface GameRuntimePort {
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  restart(): void;
  chooseUpgrade(id: UpgradeId): void;
  updateSettings(settings: GameSettings): void;
  requestPointerLock(): void;
  dispose(): void;
}

export interface RuntimeOptions {
  canvas: HTMLCanvasElement;
  difficulty: Difficulty;
  settings: GameSettings;
  callbacks: GameCallbacks;
  seed?: number;
}
