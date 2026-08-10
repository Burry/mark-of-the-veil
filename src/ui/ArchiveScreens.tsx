import { Frame, Keycap, MenuButton } from './Frame';
import { SigilIcon } from './Icons';

interface ArchiveScreenProps {
  onBack: () => void;
}

const KEYBOARD_CONTROLS = [
  ['MOVE', 'W A S D'],
  ['LOOK / AIM', 'MOUSE'],
  ['FIRE SUNLANCE', 'LMB'],
  ['HORN PULSE', 'Q'],
  ['HOOF DASH', 'SPACE'],
  ['RELOAD', 'R'],
  ['INTERACT', 'E'],
  ['SWITCH VIEW', 'V'],
  ['PAUSE', 'ESC'],
];

const GAMEPAD_CONTROLS = [
  ['MOVE', 'LEFT STICK'],
  ['LOOK / AIM', 'RIGHT STICK'],
  ['FIRE SUNLANCE', 'RT'],
  ['HORN PULSE', 'LB'],
  ['HOOF DASH', 'A'],
  ['RELOAD', 'X'],
  ['INTERACT', 'X'],
  ['SWITCH VIEW', 'Y'],
  ['PAUSE', 'START'],
];

function ControlColumn({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="control-column">
      <h3>{title}</h3>
      <dl>
        {rows.map(([action, input]) => (
          <div key={action}>
            <dt>{action}</dt>
            <dd>
              <Keycap>{input}</Keycap>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ControlsScreen({ onBack }: ArchiveScreenProps) {
  return (
    <main className="archive-screen screen-layer" aria-labelledby="controls-title">
      <Frame className="archive-panel controls-panel" label="Controls">
        <div className="section-heading">
          <span className="section-heading__line" aria-hidden="true" />
          <SigilIcon />
          <h2 id="controls-title">CONTROLS</h2>
          <span className="section-heading__line" aria-hidden="true" />
        </div>
        <p className="archive-intro">
          Both cameras share one center-screen aim ray. Switching view never changes your target.
        </p>
        <div className="controls-grid">
          <ControlColumn title="KEYBOARD + MOUSE" rows={KEYBOARD_CONTROLS} />
          <ControlColumn title="GAMEPAD" rows={GAMEPAD_CONTROLS} />
        </div>
        <div className="controls-note">
          <span>AIM</span> Hold before firing for tighter spread and shoulder alignment.
          <span>FOCUS</span> Arrow keys, D-pad, Enter / A, and Escape / B navigate every menu.
        </div>
        <div className="panel-actions panel-actions--center">
          <MenuButton onClick={onBack} primary autoFocus>
            RETURN
          </MenuButton>
        </div>
      </Frame>
    </main>
  );
}

export function CreditsScreen({ onBack }: ArchiveScreenProps) {
  return (
    <main className="archive-screen screen-layer" aria-labelledby="credits-title">
      <Frame className="archive-panel credits-panel" label="Credits">
        <div className="section-heading">
          <span className="section-heading__line" aria-hidden="true" />
          <SigilIcon />
          <h2 id="credits-title">CREDITS</h2>
          <span className="section-heading__line" aria-hidden="true" />
        </div>
        <blockquote>
          “A broken oath is still a path home.”
          <cite>— Mark, last pilot of the Wayfarer</cite>
        </blockquote>
        <div className="credit-roll">
          <div>
            <span>CREATED FOR THE OPEN WEB</span>
            <strong>MARK OF THE VEIL</strong>
          </div>
          <div>
            <span>PROTAGONIST</span>
            <strong>MARK</strong>
          </div>
          <div>
            <span>RENDERING</span>
            <strong>THREE.JS · WEBGL 2</strong>
          </div>
          <div>
            <span>STONE PHOTOSCAN + HDRI</span>
            <strong>POLY HAVEN · CC0</strong>
          </div>
          <div>
            <span>SOUND + SCORE</span>
            <strong>GENERATIVE WEB AUDIO</strong>
          </div>
          <div>
            <span>DESIGN + ENGINEERING</span>
            <strong>OPENAI CODEX</strong>
          </div>
        </div>
        <p className="credits-legal">
          An original science-fantasy game. Project-authored imagery, geometry, sound, music, and UI
          are joined by the credited public-domain environment sources. Full provenance ships with
          the repository.
        </p>
        <div className="panel-actions panel-actions--center">
          <MenuButton onClick={onBack} primary autoFocus>
            RETURN
          </MenuButton>
        </div>
      </Frame>
    </main>
  );
}
