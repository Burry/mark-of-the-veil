import type { GameSettings, InputDevice } from '../types/GameTypes';
import { clamp } from '../utils/math';

export interface InputFrame {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  fireHeld: boolean;
  aimHeld: boolean;
  dashPressed: boolean;
  pulsePressed: boolean;
  reloadPressed: boolean;
  interactPressed: boolean;
  perspectivePressed: boolean;
}

interface InputCallbacks {
  pointerLockChanged: (locked: boolean) => void;
  deviceChanged: (device: InputDevice) => void;
}

const BLOCKED_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyQ',
  'KeyE',
  'KeyR',
  'KeyV',
  'Digit1',
  'Digit2',
  'Space',
  'ShiftLeft',
  'ShiftRight',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

export class InputController {
  private readonly keys = new Set<string>();
  private readonly pressedKeys = new Set<string>();
  private readonly mouseButtons = new Set<number>();
  private readonly callbacks: InputCallbacks;
  private readonly settings: () => GameSettings;
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private pointerLocked = false;
  private activeDevice: InputDevice = 'keyboard';
  private previousButtons: boolean[] = [];
  private connected = true;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    settings: () => GameSettings,
    callbacks: InputCallbacks,
  ) {
    this.settings = settings;
    this.callbacks = callbacks;
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('gamepadconnected', this.onGamepadConnection);
    window.addEventListener('gamepaddisconnected', this.onGamepadConnection);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    canvas.addEventListener('contextmenu', this.onContextMenu);
    canvas.addEventListener('click', this.onCanvasClick);
  }

  sample(delta: number): InputFrame {
    const settings = this.settings();
    const gamepad = this.getGamepad();
    const keyboardX =
      Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) -
      Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const keyboardY =
      Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) -
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));

    let moveX = keyboardX;
    let moveY = keyboardY;
    let lookX = this.mouseDeltaX * 0.00075 * (0.3 + settings.mouseSensitivity * 2.2);
    let lookY = this.mouseDeltaY * 0.00075 * (0.3 + settings.mouseSensitivity * 2.2);
    let fireHeld = this.pointerLocked && this.mouseButtons.has(0);
    let aimHeld = this.pointerLocked && this.mouseButtons.has(2);
    let dashPressed =
      this.consumeKey('Space') ||
      this.consumeKey('ShiftLeft') ||
      this.consumeKey('ShiftRight') ||
      this.consumeKey('Digit1');
    let pulsePressed = this.consumeKey('KeyQ') || this.consumeKey('Digit2');
    let reloadPressed = this.consumeKey('KeyR');
    let interactPressed = this.consumeKey('KeyE');
    let perspectivePressed = this.consumeKey('KeyV');

    if (gamepad) {
      const stickX = applyDeadzone(gamepad.axes[0] ?? 0, settings.gamepadDeadzone);
      const stickY = applyDeadzone(gamepad.axes[1] ?? 0, settings.gamepadDeadzone);
      const viewX = applyDeadzone(gamepad.axes[2] ?? 0, settings.gamepadDeadzone);
      const viewY = applyDeadzone(gamepad.axes[3] ?? 0, settings.gamepadDeadzone);
      if (Math.abs(stickX) + Math.abs(stickY) > 0.05) {
        moveX = stickX;
        moveY = -stickY;
      }
      const gamepadLookScale = 0.9 + settings.gamepadSensitivity * 3.6;
      lookX += viewX * gamepadLookScale * delta;
      lookY += viewY * gamepadLookScale * delta;
      fireHeld ||= (gamepad.buttons[7]?.value ?? 0) > 0.18;
      aimHeld ||= (gamepad.buttons[6]?.value ?? 0) > 0.18;
      dashPressed ||= this.gamepadPressed(gamepad, 0);
      reloadPressed ||= this.gamepadPressed(gamepad, 2);
      interactPressed ||= this.gamepadPressed(gamepad, 2);
      perspectivePressed ||= this.gamepadPressed(gamepad, 3);
      pulsePressed ||= this.gamepadPressed(gamepad, 4);

      const gamepadActive =
        Math.abs(stickX) + Math.abs(stickY) + Math.abs(viewX) + Math.abs(viewY) > 0.1 ||
        gamepad.buttons.some((button) => button.pressed || button.value > 0.15);
      if (gamepadActive) this.setDevice('gamepad');
      this.previousButtons = gamepad.buttons.map((button) => button.pressed || button.value > 0.5);
    } else {
      this.previousButtons = [];
    }

    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.pressedKeys.clear();

    const length = Math.hypot(moveX, moveY);
    if (length > 1) {
      moveX /= length;
      moveY /= length;
    }

    if (settings.invertY) lookY *= -1;
    return {
      moveX,
      moveY,
      lookX,
      lookY,
      fireHeld,
      aimHeld,
      dashPressed,
      pulsePressed,
      reloadPressed,
      interactPressed,
      perspectivePressed,
    };
  }

  requestPointerLock(): void {
    if (!this.connected || document.pointerLockElement === this.canvas) return;
    try {
      const result = this.canvas.requestPointerLock();
      if (result instanceof Promise) void result.catch(() => undefined);
    } catch {
      // Pointer lock is optional; gamepad play remains available.
    }
  }

  exitPointerLock(): void {
    if (document.pointerLockElement === this.canvas) void document.exitPointerLock();
  }

  isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  clearHeld(): void {
    this.keys.clear();
    this.pressedKeys.clear();
    this.mouseButtons.clear();
    this.previousButtons =
      this.getGamepad()?.buttons.map((button) => button.pressed || button.value > 0.5) ?? [];
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  getGamepad(): Gamepad | null {
    if (!('getGamepads' in navigator)) return null;
    return (
      [...navigator.getGamepads()].find((gamepad): gamepad is Gamepad =>
        Boolean(gamepad?.connected),
      ) ?? null
    );
  }

  dispose(): void {
    this.connected = false;
    this.exitPointerLock();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('gamepadconnected', this.onGamepadConnection);
    window.removeEventListener('gamepaddisconnected', this.onGamepadConnection);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.removeEventListener('click', this.onCanvasClick);
    this.keys.clear();
    this.pressedKeys.clear();
    this.mouseButtons.clear();
  }

  private consumeKey(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  private gamepadPressed(gamepad: Gamepad, index: number): boolean {
    const current = Boolean(
      gamepad.buttons[index]?.pressed || (gamepad.buttons[index]?.value ?? 0) > 0.5,
    );
    return current && !this.previousButtons[index];
  }

  private setDevice(device: InputDevice): void {
    if (device === this.activeDevice) return;
    this.activeDevice = device;
    this.callbacks.deviceChanged(device);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (BLOCKED_KEYS.has(event.code) && (this.pointerLocked || event.target === this.canvas))
      event.preventDefault();
    if (!this.keys.has(event.code)) this.pressedKeys.add(event.code);
    this.keys.add(event.code);
    this.setDevice('keyboard');
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (!this.pointerLocked) return;
    this.mouseDeltaX += clamp(event.movementX, -160, 160);
    this.mouseDeltaY += clamp(event.movementY, -160, 160);
    this.setDevice('keyboard');
  };

  private readonly onMouseDown = (event: MouseEvent): void => {
    if (this.pointerLocked) this.mouseButtons.add(event.button);
    this.setDevice('keyboard');
  };

  private readonly onMouseUp = (event: MouseEvent): void => {
    this.mouseButtons.delete(event.button);
  };

  private readonly onPointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.canvas;
    if (!this.pointerLocked) this.clearHeld();
    this.callbacks.pointerLockChanged(this.pointerLocked);
  };

  private readonly onCanvasClick = (): void => {
    if (!this.pointerLocked) this.requestPointerLock();
  };

  private readonly onContextMenu = (event: MouseEvent): void => event.preventDefault();

  private readonly onGamepadConnection = (): void => {
    this.previousButtons = [];
  };
}

function applyDeadzone(value: number, deadzone: number): number {
  const magnitude = Math.abs(value);
  if (magnitude <= deadzone) return 0;
  return Math.sign(value) * ((magnitude - deadzone) / (1 - deadzone));
}
