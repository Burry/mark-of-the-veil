import { useEffect, useRef } from 'react';
import type { GameScreen } from '../game/types/GameTypes';

const MENU_SCREENS = new Set<GameScreen>([
  'title',
  'prologue',
  'campaign',
  'chapterBriefing',
  'chapterComplete',
  'paused',
  'upgrade',
  'revelation',
  'victory',
  'defeat',
  'settings',
  'controls',
  'credits',
  'unsupported',
]);

function focusableMenuItems(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-menu-item]:not(:disabled):not([aria-hidden="true"])',
    ),
  ).filter((element) => element.offsetParent !== null);
}

function moveFocus(direction: 1 | -1): void {
  const items = focusableMenuItems();
  if (!items.length) return;
  const activeIndex = items.indexOf(document.activeElement as HTMLElement);
  const nextIndex = activeIndex < 0 ? 0 : (activeIndex + direction + items.length) % items.length;
  items[nextIndex]?.focus();
}

function adjustRange(direction: 1 | -1): boolean {
  const input = document.activeElement;
  if (!(input instanceof HTMLInputElement) || input.type !== 'range') return false;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const step = Number(input.step || 1);
  const next = Math.min(max, Math.max(min, Number(input.value) + direction * step));
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  valueSetter?.call(input, String(next));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

interface MenuNavigationOptions {
  screen: GameScreen;
  onBack: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function useMenuNavigation({
  screen,
  onBack,
  onPause,
  onResume,
}: MenuNavigationOptions): void {
  const gamepadState = useRef({
    previousButtons: [] as boolean[],
    previousAxisDirection: 0,
    lastAxisMove: 0,
    startArmed: false,
  });

  useEffect(() => {
    if (!MENU_SCREENS.has(screen)) return;
    const focusTimer = window.setTimeout(() => {
      const preferred = document.querySelector<HTMLElement>('[data-autofocus="true"]');
      (preferred ?? focusableMenuItems()[0])?.focus();
    }, 50);
    return () => window.clearTimeout(focusTimer);
  }, [screen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (screen === 'playing') {
        if (event.code === 'Escape') onPause();
        return;
      }
      if (screen === 'loading') return;
      if (event.code === 'Escape') {
        event.preventDefault();
        onBack();
        return;
      }
      if (!MENU_SCREENS.has(screen)) return;
      const target = event.target;
      const isRange = target instanceof HTMLInputElement && target.type === 'range';
      if (isRange) return;
      if (event.code === 'ArrowDown' || event.code === 'ArrowRight') {
        event.preventDefault();
        moveFocus(1);
      }
      if (event.code === 'ArrowUp' || event.code === 'ArrowLeft') {
        event.preventDefault();
        moveFocus(-1);
      }
      if (event.code === 'Home') {
        event.preventDefault();
        focusableMenuItems()[0]?.focus();
      }
      if (event.code === 'End') {
        event.preventDefault();
        focusableMenuItems().at(-1)?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, onPause, screen]);

  useEffect(() => {
    let animationFrame = 0;
    gamepadState.current.startArmed = false;

    const poll = (now: number) => {
      const state = gamepadState.current;
      const gamepad = navigator.getGamepads?.().find((pad) => pad?.connected) ?? null;
      if (gamepad) {
        const pressed = gamepad.buttons.map((button) => button.pressed);
        const justPressed = (index: number) =>
          Boolean(pressed[index] && !state.previousButtons[index]);
        if (!pressed[9]) state.startArmed = true;
        const startPressed = justPressed(9) && state.startArmed;

        if (screen === 'playing' && startPressed) onPause();
        if (screen === 'paused' && startPressed) onResume();

        if (MENU_SCREENS.has(screen)) {
          const axisY = gamepad.axes[1] ?? 0;
          const axisX = gamepad.axes[0] ?? 0;
          const axisDirection = Math.abs(axisY) > 0.62 ? Math.sign(axisY) : 0;
          let movedVertically = false;
          if (justPressed(13) || (axisDirection === 1 && state.previousAxisDirection !== 1)) {
            moveFocus(1);
            state.lastAxisMove = now;
            movedVertically = true;
          }
          if (justPressed(12) || (axisDirection === -1 && state.previousAxisDirection !== -1)) {
            moveFocus(-1);
            state.lastAxisMove = now;
            movedVertically = true;
          }
          if (!movedVertically && axisDirection !== 0 && now - state.lastAxisMove > 360) {
            moveFocus(axisDirection as 1 | -1);
            state.lastAxisMove = now;
          }

          if (justPressed(14) || (axisX < -0.7 && now - state.lastAxisMove > 240)) {
            if (!adjustRange(-1)) moveFocus(-1);
            state.lastAxisMove = now;
          }
          if (justPressed(15) || (axisX > 0.7 && now - state.lastAxisMove > 240)) {
            if (!adjustRange(1)) moveFocus(1);
            state.lastAxisMove = now;
          }
          if (justPressed(0)) (document.activeElement as HTMLElement | null)?.click();
          if (justPressed(1)) onBack();
          state.previousAxisDirection = axisDirection;
        }
        state.previousButtons = pressed;
      } else {
        state.previousButtons = [];
        state.previousAxisDirection = 0;
      }
      animationFrame = window.requestAnimationFrame(poll);
    };
    animationFrame = window.requestAnimationFrame(poll);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [onBack, onPause, onResume, screen]);
}
