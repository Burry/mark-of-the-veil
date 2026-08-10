import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { gameHost, setScreen } from './GameHost';
import { gameStore } from './gameStore';
import { loadSettings, saveSettings } from './storage';
import type { Difficulty, GameScreen, GameSettings, UpgradeId } from '../game/types/GameTypes';
import { CreditsScreen, ControlsScreen } from '../ui/ArchiveScreens';
import { BriefingScreen } from '../ui/BriefingScreen';
import { LoadingScreen, ResultScreen, UnsupportedScreen, UpgradeScreen } from '../ui/GameOverlays';
import { HUD } from '../ui/HUD';
import { RevelationScreen } from '../ui/RevelationScreen';
import { RotateDevice } from '../ui/RotateDevice';
import { SettingsPanel, type SettingsTab } from '../ui/SettingsPanel';
import { TitleScreen } from '../ui/TitleScreen';
import { useMenuNavigation } from '../ui/useMenuNavigation';

const CANVAS_SCREENS = new Set<GameScreen>([
  'loading',
  'playing',
  'paused',
  'upgrade',
  'revelation',
  'victory',
  'defeat',
]);

export function App() {
  const snapshot = useSyncExternalStore(
    gameStore.subscribe,
    gameStore.getSnapshot,
    gameStore.getSnapshot,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('gameplay');

  useEffect(() => {
    saveSettings(settings);
    gameHost.updateSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      new URLSearchParams(window.location.search).get('preview') === 'ending'
    ) {
      setScreen('revelation');
    }
  }, []);

  useEffect(() => () => gameHost.dispose(), []);

  const returnToTitle = useCallback(() => {
    setSettingsTab('gameplay');
    gameHost.returnToTitle();
  }, []);

  const handleBack = useCallback(() => {
    switch (snapshot.screen) {
      case 'playing':
        gameHost.pause();
        break;
      case 'paused':
        gameHost.resume();
        break;
      case 'briefing':
      case 'settings':
      case 'controls':
      case 'credits':
      case 'unsupported':
        returnToTitle();
        break;
      case 'victory':
      case 'defeat':
        returnToTitle();
        break;
      case 'revelation':
        break;
      default:
        break;
    }
  }, [returnToTitle, snapshot.screen]);

  const pause = useCallback(() => gameHost.pause(), []);
  const resume = useCallback(() => gameHost.resume(), []);

  useMenuNavigation({
    screen: snapshot.screen,
    onBack: handleBack,
    onPause: pause,
    onResume: resume,
  });

  const beginMission = () => setScreen('briefing');

  const deploy = () => {
    if (!canvasRef.current) return;
    void gameHost.start(canvasRef.current, settings, difficulty);
  };

  const chooseUpgrade = (id: UpgradeId) => gameHost.chooseUpgrade(id);
  const canvasVisible = CANVAS_SCREENS.has(snapshot.screen);
  const showTitleBackdrop = !canvasVisible || snapshot.screen === 'unsupported';

  return (
    <div
      className={`app-shell screen-${snapshot.screen} ${settings.reducedMotion ? 'reduce-motion' : ''} ${settings.reducedFlashes ? 'reduce-flashes' : ''}`}
    >
      <a className="skip-link" href="#primary-interface">
        Skip to game interface
      </a>

      <canvas
        ref={canvasRef}
        id="game-canvas"
        className={canvasVisible ? 'game-canvas is-visible' : 'game-canvas'}
        aria-label="Mark of the Veil WebGL game world"
        aria-hidden={!canvasVisible}
      />

      <div
        className={showTitleBackdrop ? 'title-backdrop is-visible' : 'title-backdrop'}
        aria-hidden="true"
      />
      <div id="primary-interface" className="interface-root" tabIndex={-1}>
        {snapshot.screen === 'title' && (
          <TitleScreen
            onBegin={beginMission}
            onSettings={() => setScreen('settings')}
            onControls={() => setScreen('controls')}
            onCredits={() => setScreen('credits')}
          />
        )}

        {snapshot.screen === 'briefing' && (
          <BriefingScreen
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            onDeploy={deploy}
            onBack={returnToTitle}
          />
        )}

        {snapshot.screen === 'settings' && (
          <main className="settings-screen screen-layer" aria-label="Settings">
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              mode="title"
              onBack={returnToTitle}
              activeTab={settingsTab}
              onTabChange={setSettingsTab}
            />
          </main>
        )}

        {snapshot.screen === 'controls' && <ControlsScreen onBack={returnToTitle} />}
        {snapshot.screen === 'credits' && <CreditsScreen onBack={returnToTitle} />}

        {snapshot.screen === 'loading' && <LoadingScreen progress={snapshot.loadingProgress} />}

        {(snapshot.screen === 'playing' ||
          snapshot.screen === 'paused' ||
          snapshot.screen === 'upgrade') && (
          <HUD snapshot={snapshot} settings={settings} muted={snapshot.screen !== 'playing'} />
        )}

        {snapshot.screen === 'playing' &&
          !snapshot.pointerLocked &&
          snapshot.inputDevice === 'keyboard' && (
            <button
              type="button"
              className="focus-game-prompt"
              onClick={resume}
              aria-label="Focus the game and capture mouse input"
            >
              <span>CLICK TO FOCUS</span>
              <small>Mouse input is released</small>
            </button>
          )}

        {snapshot.screen === 'paused' && (
          <main className="pause-screen screen-layer" aria-label="Game paused">
            <div className="pause-scrim" aria-hidden="true" />
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              mode="pause"
              onResume={resume}
              onRestart={() => gameHost.restart()}
              onReturnToTitle={returnToTitle}
              activeTab={settingsTab}
              onTabChange={setSettingsTab}
            />
          </main>
        )}

        {snapshot.screen === 'upgrade' && <UpgradeScreen onChoose={chooseUpgrade} />}

        {snapshot.screen === 'revelation' && (
          <RevelationScreen onComplete={() => setScreen('victory')} />
        )}

        {(snapshot.screen === 'victory' || snapshot.screen === 'defeat') && (
          <ResultScreen
            victory={snapshot.screen === 'victory'}
            stats={snapshot.runStats}
            onReplay={() => gameHost.restart()}
            onTitle={returnToTitle}
          />
        )}

        {snapshot.screen === 'unsupported' && (
          <UnsupportedScreen
            snapshot={snapshot}
            onRetry={() => window.location.reload()}
            onTitle={returnToTitle}
          />
        )}
      </div>

      <RotateDevice />
      <div className="global-grain" aria-hidden="true" />
    </div>
  );
}
