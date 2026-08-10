import { HeadphonesIcon, SigilIcon } from './Icons';
import { Keycap, MenuButton } from './Frame';

interface TitleScreenProps {
  onBegin: () => void;
  onSettings: () => void;
  onControls: () => void;
  onCredits: () => void;
}

export function TitleScreen({ onBegin, onSettings, onControls, onCredits }: TitleScreenProps) {
  return (
    <main className="title-screen screen-layer" aria-labelledby="game-title">
      <div className="title-ornament title-ornament--left" aria-hidden="true" />
      <div className="title-ornament title-ornament--right" aria-hidden="true" />
      <div className="title-content">
        <h1 id="game-title" className="wordmark" aria-label="Mark of the Veil">
          <span className="wordmark__major">MARK</span>
          <span className="wordmark__diamond">
            <span className="wordmark__diamond-text">
              <span>OF</span>
              <span>THE</span>
            </span>
          </span>
          <span className="wordmark__major">VEIL</span>
        </h1>
        <p className="title-tagline">A BROKEN OATH. A LIVING WORLD.</p>

        <nav className="main-menu" aria-label="Main menu">
          <MenuButton onClick={onBegin} primary autoFocus>
            BEGIN DESCENT
          </MenuButton>
          <MenuButton onClick={onSettings}>SETTINGS</MenuButton>
          <MenuButton onClick={onControls}>CONTROLS</MenuButton>
          <MenuButton onClick={onCredits}>CREDITS</MenuButton>
        </nav>
      </div>

      <footer className="title-footer">
        <span className="footer-hint">
          <SigilIcon />
          <Keycap>V</Keycap>
          <span className="hint-divider">/</span>
          <Keycap>Y</Keycap>
          <span>SWITCH VIEW</span>
        </span>
        <span className="footer-hint">
          <HeadphonesIcon />
          <span>HEADPHONES RECOMMENDED</span>
        </span>
      </footer>
    </main>
  );
}
