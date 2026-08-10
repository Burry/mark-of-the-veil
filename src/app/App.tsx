import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { gameHost, setScreen } from './GameHost';
import { buildBriefingDialogue, buildPlayableMissionPath } from './campaignPresentation';
import { gameStore } from './gameStore';
import { loadBestRun, loadSettings, saveSettings } from './storage';
import { CAMPAIGN_CHAPTERS, getChapter, type ChapterId } from '../game/campaign';
import { CHAPTER_ENCOUNTERS } from '../game/systems/ChapterDirector';
import type { Difficulty, GameScreen, GameSettings, UpgradeId } from '../game/types/GameTypes';
import { CreditsScreen, ControlsScreen } from '../ui/ArchiveScreens';
import {
  CampaignMapScreen,
  ChapterBriefingScreen,
  ChapterCompleteScreen,
  type CampaignCardModel,
  type ChapterBriefingModel,
} from '../ui/CampaignScreens';
import { LoadingScreen, ResultScreen, UnsupportedScreen, UpgradeScreen } from '../ui/GameOverlays';
import { HUD } from '../ui/HUD';
import { PrologueScreen } from '../ui/PrologueScreen';
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
  'chapterComplete',
  'revelation',
  'victory',
  'defeat',
]);

const CHAPTER_ART: Partial<Record<ChapterId, string>> = {
  'ashes-of-home': '/assets/campaign/vespera-in-black.webp',
  'the-root-vault': '/assets/title-background.jpg',
  'vespera-in-black': '/assets/campaign/vespera-in-black.webp',
  'the-drowned-cathedral': '/assets/title-background.jpg',
  'the-silent-orbit': '/assets/campaign/vespera-in-black.webp',
  'the-memory-forge': '/assets/campaign/the-memory-forge.webp',
  'crown-of-eidolon': '/assets/campaign/the-root-choir.webp',
  'the-root-choir': '/assets/campaign/the-root-choir.webp',
};

export function App() {
  const snapshot = useSyncExternalStore(
    gameStore.subscribe,
    gameStore.getSnapshot,
    gameStore.getSnapshot,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => gameHost.getCampaignProgress().difficulty,
  );
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
  }, [setSettingsTab]);

  const returnToCampaign = useCallback(() => {
    setSettingsTab('gameplay');
    gameHost.returnToCampaign();
  }, [setSettingsTab]);

  const handleBack = useCallback(() => {
    switch (snapshot.screen) {
      case 'playing':
        gameHost.pause();
        break;
      case 'paused':
        gameHost.resume();
        break;
      case 'campaign':
        returnToTitle();
        break;
      case 'prologue':
        break;
      case 'chapterBriefing':
      case 'chapterComplete':
        returnToCampaign();
        break;
      case 'settings':
      case 'controls':
      case 'credits':
      case 'unsupported':
      case 'victory':
      case 'defeat':
        returnToTitle();
        break;
      case 'revelation':
        break;
      default:
        break;
    }
  }, [returnToCampaign, returnToTitle, snapshot.screen]);

  const pause = useCallback(() => gameHost.pause(), []);
  const resume = useCallback(() => gameHost.resume(), []);

  useMenuNavigation({
    screen: snapshot.screen,
    onBack: handleBack,
    onPause: pause,
    onResume: resume,
  });

  const progress = gameHost.getCampaignProgress();
  const selectedChapter = getChapter(gameHost.getSelectedChapterId());
  const currentIndex = CAMPAIGN_CHAPTERS.findIndex(
    (chapter) => chapter.id === progress.currentChapterId,
  );
  const campaignCards: CampaignCardModel[] = CAMPAIGN_CHAPTERS.map((chapter, index) => ({
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    location: chapter.location,
    logline: chapter.subtitle,
    image: CHAPTER_ART[chapter.id],
    unlocked:
      index <= currentIndex ||
      progress.completedChapterIds.includes(chapter.id) ||
      progress.phase === 'campaign-complete',
    completed: progress.completedChapterIds.includes(chapter.id),
    current: chapter.id === progress.currentChapterId,
  }));
  const briefing: ChapterBriefingModel = {
    id: selectedChapter.id,
    number: selectedChapter.number,
    title: selectedChapter.title,
    location: selectedChapter.location,
    operation: `ACT ${selectedChapter.act} // OPERATION ${selectedChapter.number.toString().padStart(2, '0')}`,
    logline: selectedChapter.narrative.premise,
    image: CHAPTER_ART[selectedChapter.id],
    objectives: buildPlayableMissionPath(CHAPTER_ENCOUNTERS[selectedChapter.id]),
    dialogue: buildBriefingDialogue(selectedChapter, CHAPTER_ENCOUNTERS[selectedChapter.id]),
  };

  const deploy = () => {
    if (!canvasRef.current) return;
    void gameHost.start(canvasRef.current, settings, difficulty, selectedChapter.id);
  };

  const chooseUpgrade = (id: UpgradeId) => gameHost.chooseUpgrade(id);
  const canvasVisible = CANVAS_SCREENS.has(snapshot.screen);
  const showTitleBackdrop = !canvasVisible || snapshot.screen === 'unsupported';
  const canContinue =
    progress.phase === 'chapter-complete' && selectedChapter.id === progress.currentChapterId;
  const nextChapter =
    canContinue && selectedChapter.nextChapterId ? getChapter(selectedChapter.nextChapterId) : null;

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
            onBegin={() => gameHost.openCampaign()}
            hasCampaign={
              progress.completedChapterIds.length > 0 ||
              progress.currentChapterId !== 'ashes-of-home'
            }
            onSettings={() => setScreen('settings')}
            onControls={() => setScreen('controls')}
            onCredits={() => setScreen('credits')}
          />
        )}

        {snapshot.screen === 'prologue' && (
          <PrologueScreen onComplete={() => gameHost.completePrologue()} />
        )}

        {snapshot.screen === 'campaign' && (
          <CampaignMapScreen
            chapters={campaignCards}
            onSelect={(chapterId) => {
              if (
                chapterId === progress.currentChapterId &&
                progress.phase === 'chapter-complete'
              ) {
                gameHost.continueCampaign();
                return;
              }
              gameHost.selectChapter(chapterId as ChapterId);
            }}
            onNewCampaign={() => gameHost.newCampaign(difficulty)}
            onBack={returnToTitle}
          />
        )}

        {snapshot.screen === 'chapterBriefing' && (
          <ChapterBriefingScreen
            chapter={briefing}
            difficulty={difficulty}
            onDifficultyChange={(nextDifficulty) => {
              setDifficulty(nextDifficulty);
              gameHost.setDifficulty(nextDifficulty);
            }}
            onDeploy={deploy}
            onBack={returnToCampaign}
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

        {snapshot.screen === 'loading' && (
          <LoadingScreen progress={snapshot.loadingProgress} chapterTitle={snapshot.chapterTitle} />
        )}

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
              onReturnToCampaign={returnToCampaign}
              activeTab={settingsTab}
              onTabChange={setSettingsTab}
            />
          </main>
        )}

        {snapshot.screen === 'upgrade' && <UpgradeScreen onChoose={chooseUpgrade} />}

        {snapshot.screen === 'chapterComplete' && (
          <ChapterCompleteScreen
            chapterNumber={selectedChapter.number}
            chapterTitle={selectedChapter.title}
            nextTitle={nextChapter?.title}
            epilogue={selectedChapter.narrative.closing}
            stats={snapshot.runStats}
            onContinue={() => gameHost.continueCampaign()}
            onReplay={() => gameHost.restart()}
            onMap={returnToCampaign}
          />
        )}

        {snapshot.screen === 'revelation' && (
          <RevelationScreen
            initialStage={progress.revelationStage ?? 0}
            onStageChange={(stage) => gameHost.setRevelationStage(stage)}
            onComplete={() => {
              if (progress.phase === 'revelation-pending') gameHost.completeRevelation();
              else setScreen('victory');
            }}
          />
        )}

        {(snapshot.screen === 'victory' || snapshot.screen === 'defeat') && (
          <ResultScreen
            victory={snapshot.screen === 'victory'}
            stats={snapshot.runStats}
            bestRun={loadBestRun()}
            onReplay={() =>
              snapshot.screen === 'victory' ? gameHost.replayFinalChapter() : gameHost.restart()
            }
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
