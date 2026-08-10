import type { Difficulty } from '../game/types/GameTypes';
import { CarrotIcon, SigilIcon } from './Icons';
import { Frame, MenuButton } from './Frame';

interface BriefingScreenProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onDeploy: () => void;
  onBack: () => void;
}

const DIFFICULTIES: Array<{
  id: Difficulty;
  label: string;
  description: string;
}> = [
  { id: 'story', label: 'STORY', description: 'Forgiving combat · lower enemy pressure' },
  { id: 'normal', label: 'DESCENT', description: 'The intended experience' },
  { id: 'nightmare', label: 'NIGHTMARE', description: 'Faster threats · no mercy' },
];

export function BriefingScreen({
  difficulty,
  onDifficultyChange,
  onDeploy,
  onBack,
}: BriefingScreenProps) {
  return (
    <main className="briefing-screen screen-layer" aria-labelledby="briefing-title">
      <Frame className="briefing-panel" label="Mission briefing">
        <div className="section-heading">
          <span className="section-heading__line" aria-hidden="true" />
          <SigilIcon />
          <span>MISSION BRIEF</span>
          <span className="section-heading__line" aria-hidden="true" />
        </div>
        <p className="briefing-code">VESPERA / ROOT VAULT / SIGNAL 03</p>
        <h2 id="briefing-title">THE VEIL BELOW</h2>
        <p className="briefing-lede">
          Mark escaped the Crown once. Tonight, the prison beneath Vespera opens again.
        </p>

        <div className="mission-path" aria-label="Mission objectives">
          <div className="mission-path__step">
            <span>01</span>
            <strong>BREAK FREE</strong>
            <small>Recover Mark&apos;s carrot talisman.</small>
          </div>
          <div className="mission-path__step">
            <span>02</span>
            <strong>OPEN THE VEIL</strong>
            <small>Activate three seals in the drowned cathedral.</small>
          </div>
          <div className="mission-path__step">
            <span>03</span>
            <strong>ENTER THE CHOIR</strong>
            <small>Break the Regent and infiltrate the Crown&apos;s root-mind.</small>
          </div>
        </div>

        <div className="talisman-note">
          <CarrotIcon />
          <span>
            <strong>THE CARROT REMEMBERS</strong>
            An old pilot&apos;s charm. A ridiculous reason to survive.
          </span>
        </div>

        <fieldset className="difficulty-picker">
          <legend>CHOOSE YOUR DESCENT</legend>
          {DIFFICULTIES.map((entry) => (
            <button
              type="button"
              key={entry.id}
              className={difficulty === entry.id ? 'difficulty is-selected' : 'difficulty'}
              aria-pressed={difficulty === entry.id}
              onClick={() => onDifficultyChange(entry.id)}
              data-menu-item
            >
              <span className="difficulty__diamond" aria-hidden="true" />
              <strong>{entry.label}</strong>
              <small>{entry.description}</small>
            </button>
          ))}
        </fieldset>

        <div className="panel-actions">
          <MenuButton onClick={onBack}>BACK</MenuButton>
          <MenuButton onClick={onDeploy} primary autoFocus>
            ENTER THE ROOT VAULT
          </MenuButton>
        </div>
      </Frame>
    </main>
  );
}
