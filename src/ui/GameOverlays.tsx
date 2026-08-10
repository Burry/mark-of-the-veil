import type { BestRun, GameSnapshot, RunStats, UpgradeId } from '../game/types/GameTypes';
import { CarrotIcon, OverdriveIcon, PulseIcon, ResolveIcon, SigilIcon } from './Icons';
import { Frame, MenuButton } from './Frame';

export function LoadingScreen({
  progress,
  chapterTitle,
}: {
  progress: number;
  chapterTitle?: string;
}) {
  const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));
  const status =
    percentage < 35
      ? 'PREPARING CHAPTER'
      : percentage < 75
        ? 'ASSEMBLING THE VEIL'
        : 'SYNCHRONIZING COMBAT SYSTEMS';
  return (
    <main className="loading-screen screen-layer" aria-live="polite" aria-busy="true">
      <div className="loading-sigil" aria-hidden="true">
        <SigilIcon />
        <span />
        <i />
      </div>
      <h2>{chapterTitle ? `${status} // ${chapterTitle}` : status}</h2>
      <div
        className="loading-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p>{percentage}%</p>
      <small>Pulse the horn to expose Crown weak points.</small>
    </main>
  );
}

interface UpgradeScreenProps {
  onChoose: (id: UpgradeId) => void;
}

const UPGRADES: Array<{
  id: UpgradeId;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'ace',
    title: 'ACE INSTINCT',
    subtitle: 'THE PILOT REMEMBERS',
    description: 'Sunlance rounds hit harder and cycle faster. Reload sooner with a 48-round belt.',
    icon: <OverdriveIcon />,
  },
  {
    id: 'survivor',
    title: "SURVIVOR'S OATH",
    subtitle: 'THE PRISON BREAKS',
    description: 'Increase maximum Resolve and Ward. Recover Resolve once the Ward can regenerate.',
    icon: <ResolveIcon />,
  },
  {
    id: 'stormhorn',
    title: 'STORMHORN COVENANT',
    subtitle: 'THE VEIL ANSWERS',
    description: 'Horn Pulse hits harder, reaches farther, and recharges dramatically faster.',
    icon: <PulseIcon />,
  },
];

export function UpgradeScreen({ onChoose }: UpgradeScreenProps) {
  return (
    <main className="modal-screen screen-layer" aria-labelledby="upgrade-title">
      <Frame className="upgrade-panel" label="Choose a relic upgrade">
        <div className="section-heading">
          <span className="section-heading__line" aria-hidden="true" />
          <SigilIcon />
          <span>RELIC CONVERGENCE</span>
          <span className="section-heading__line" aria-hidden="true" />
        </div>
        <h2 id="upgrade-title">CHOOSE YOUR MARK</h2>
        <p>One oath survives the crossing. The others are lost to the Veil.</p>
        <div className="upgrade-grid">
          {UPGRADES.map((upgrade, index) => (
            <button
              type="button"
              key={upgrade.id}
              className="upgrade-card"
              onClick={() => onChoose(upgrade.id)}
              data-menu-item
              data-autofocus={index === 0 ? 'true' : undefined}
            >
              <span className="upgrade-card__number">0{index + 1}</span>
              <span className="upgrade-card__crest">{upgrade.icon}</span>
              <small>{upgrade.subtitle}</small>
              <strong>{upgrade.title}</strong>
              <span>{upgrade.description}</span>
              <i>CLAIM RELIC</i>
            </button>
          ))}
        </div>
      </Frame>
    </main>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

function ResultStats({ stats }: { stats: RunStats | null }) {
  if (!stats) return <p className="result-no-stats">The Veil swallowed the mission record.</p>;
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
  return (
    <div className="result-stats">
      <div>
        <span>SCORE</span>
        <strong>{stats.score.toLocaleString()}</strong>
      </div>
      <div>
        <span>TIME</span>
        <strong>{formatTime(stats.elapsedSeconds)}</strong>
      </div>
      <div>
        <span>HOSTILES</span>
        <strong>{stats.kills}</strong>
      </div>
      <div>
        <span>ACCURACY</span>
        <strong>{accuracy}%</strong>
      </div>
      <div>
        <span>DAMAGE TAKEN</span>
        <strong>{Math.round(stats.damageTaken)}</strong>
      </div>
    </div>
  );
}

interface ResultScreenProps {
  victory: boolean;
  stats: RunStats | null;
  bestRun: BestRun;
  onReplay: () => void;
  onTitle: () => void;
}

export function ResultScreen({ victory, stats, bestRun, onReplay, onTitle }: ResultScreenProps) {
  return (
    <main className={`result-screen screen-layer ${victory ? 'is-victory' : 'is-defeat'}`}>
      <Frame className="result-panel" label={victory ? 'Mission complete' : 'Mission failed'}>
        {victory ? (
          <CarrotIcon className="result-emblem" />
        ) : (
          <SigilIcon className="result-emblem" />
        )}
        <p>{victory ? 'INTEGRATION COMPLETE' : 'THE VEIL CLAIMS ANOTHER'}</p>
        <h2>{victory ? 'MARK IS NOT HERE' : 'MARK FALLS'}</h2>
        <span className="result-copy">
          {victory
            ? 'The Choir remembers every thought he carried. It remembers the unicorn called Mark, even though no unicorn ever existed.'
            : 'The Crown closes over Vespera, but a broken oath can be sworn again.'}
        </span>
        {stats && (
          <div className="result-rank" aria-label={`Rank ${stats.rank}`}>
            <span>{stats.rank}</span>
          </div>
        )}
        <ResultStats stats={stats} />
        {bestRun.score > 0 && (
          <div className="result-best" aria-label="Personal best">
            <span>PERSONAL BEST</span>
            <strong>RANK {bestRun.rank}</strong>
            <span>{bestRun.score.toLocaleString()} PTS</span>
            <span>{formatTime(bestRun.elapsedSeconds)}</span>
          </div>
        )}
        <div className="panel-actions panel-actions--center">
          <MenuButton onClick={onReplay} primary autoFocus>
            {victory ? 'ENTER CHOIR MEMORY' : 'RISE AGAIN'}
          </MenuButton>
          <MenuButton onClick={onTitle}>RETURN TO TITLE</MenuButton>
        </div>
      </Frame>
    </main>
  );
}

export function UnsupportedScreen({
  snapshot,
  onRetry,
  onTitle,
}: {
  snapshot: GameSnapshot;
  onRetry: () => void;
  onTitle: () => void;
}) {
  return (
    <main className="modal-screen screen-layer">
      <Frame className="unsupported-panel" label="Runtime unavailable">
        <SigilIcon className="unsupported-icon" />
        <p>WAYFARER SYSTEM FAULT</p>
        <h2>THE VEIL WILL NOT OPEN</h2>
        <span>{snapshot.caption ?? 'WebGL 2 could not start on this device.'}</span>
        <ul>
          <li>Reload once to request a fresh runtime and asset manifest.</li>
          <li>Use a current desktop browser with WebGL 2 and hardware acceleration enabled.</li>
          <li>If the fault persists, update the browser and graphics driver.</li>
        </ul>
        <div className="panel-actions panel-actions--center">
          <MenuButton onClick={onRetry} primary autoFocus>
            RELOAD RUNTIME
          </MenuButton>
          <MenuButton onClick={onTitle}>RETURN TO TITLE</MenuButton>
        </div>
      </Frame>
    </main>
  );
}
