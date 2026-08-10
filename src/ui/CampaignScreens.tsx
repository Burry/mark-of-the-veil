import type { RunStats } from '../game/types/GameTypes';
import { CarrotIcon, SigilIcon } from './Icons';
import { Frame, MenuButton } from './Frame';

export interface CampaignCardModel {
  id: string;
  number: number;
  title: string;
  location: string;
  logline: string;
  image?: string;
  unlocked: boolean;
  completed: boolean;
  current: boolean;
  bestRank?: RunStats['rank'];
}

export interface ChapterBriefingModel {
  id: string;
  number: number;
  title: string;
  location: string;
  operation: string;
  logline: string;
  image?: string;
  objectives: readonly string[];
  dialogue: readonly {
    speaker: string;
    line: string;
  }[];
}

interface CampaignMapScreenProps {
  chapters: readonly CampaignCardModel[];
  onSelect: (id: string) => void;
  onNewCampaign: () => void;
  onBack: () => void;
}

export function CampaignMapScreen({
  chapters,
  onSelect,
  onNewCampaign,
  onBack,
}: CampaignMapScreenProps) {
  const completed = chapters.filter((chapter) => chapter.completed).length;
  const campaignComplete = completed === chapters.length;
  const current = chapters.find((chapter) => chapter.current) ?? chapters[0];

  return (
    <main className="campaign-screen screen-layer" aria-labelledby="campaign-title">
      <div className="campaign-skyline" aria-hidden="true" />
      <Frame className="campaign-panel" label="Campaign command">
        <header className="campaign-header">
          <div>
            <span>WAYFARER // CAMPAIGN ARCHIVE</span>
            <h2 id="campaign-title">THE VESPERA CAMPAIGN</h2>
            <p>Eight chapters. One broken oath. Every memory has a cost.</p>
          </div>
          <div className="campaign-progress" aria-label={`${completed} of 8 chapters complete`}>
            <strong>{completed.toString().padStart(2, '0')}</strong>
            <span>/ 08 COMPLETE</span>
          </div>
        </header>

        <ol className="chapter-grid" aria-label="Campaign chapters">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <button
                type="button"
                className={`chapter-card ${chapter.current ? 'is-current' : ''} ${chapter.completed ? 'is-complete' : ''}`}
                disabled={!chapter.unlocked}
                onClick={() => onSelect(chapter.id)}
                data-menu-item={chapter.unlocked ? true : undefined}
                data-autofocus={chapter.current ? 'true' : undefined}
                aria-label={`${chapter.title}${chapter.unlocked ? '' : ', locked'}`}
              >
                {chapter.image && (
                  <span
                    className="chapter-card__image"
                    style={{ backgroundImage: `url(${chapter.image})` }}
                    aria-hidden="true"
                  />
                )}
                <span className="chapter-card__scrim" aria-hidden="true" />
                <span className="chapter-card__number">
                  {chapter.number.toString().padStart(2, '0')}
                </span>
                <span className="chapter-card__state">
                  {chapter.completed
                    ? `CLEARED${chapter.bestRank ? ` // ${chapter.bestRank}` : ''}`
                    : chapter.unlocked
                      ? chapter.current
                        ? 'CURRENT SIGNAL'
                        : 'AVAILABLE'
                      : 'SIGNAL LOCKED'}
                </span>
                <strong>{chapter.title}</strong>
                <small>{chapter.location}</small>
                <span className="chapter-card__logline">{chapter.logline}</span>
                <i aria-hidden="true">{chapter.unlocked ? 'ENTER' : '◈'}</i>
              </button>
            </li>
          ))}
        </ol>

        <footer className="campaign-footer">
          <span>
            <SigilIcon />
            {current
              ? `${current.number.toString().padStart(2, '0')} // ${current.title}`
              : 'NO SIGNAL'}
          </span>
          <div className="panel-actions">
            <MenuButton onClick={onBack}>TITLE</MenuButton>
            {completed > 0 && <MenuButton onClick={onNewCampaign}>NEW CAMPAIGN</MenuButton>}
            {current?.unlocked && (
              <MenuButton onClick={() => onSelect(current.id)} primary>
                {campaignComplete
                  ? 'REPLAY CHOIR MEMORY'
                  : completed > 0
                    ? 'CONTINUE CAMPAIGN'
                    : 'BEGIN CAMPAIGN'}
              </MenuButton>
            )}
          </div>
        </footer>
      </Frame>
    </main>
  );
}

interface ChapterBriefingScreenProps {
  chapter: ChapterBriefingModel;
  difficulty: 'story' | 'normal' | 'nightmare';
  onDifficultyChange: (difficulty: 'story' | 'normal' | 'nightmare') => void;
  onDeploy: () => void;
  onBack: () => void;
}

const DIFFICULTIES = [
  { id: 'story', label: 'STORY', detail: 'Narrative focus and forgiving combat pressure' },
  { id: 'normal', label: 'DESCENT', detail: 'The intended campaign experience' },
  { id: 'nightmare', label: 'NIGHTMARE', detail: 'Faster threats and harsher recovery windows' },
] as const;

export function ChapterBriefingScreen({
  chapter,
  difficulty,
  onDifficultyChange,
  onDeploy,
  onBack,
}: ChapterBriefingScreenProps) {
  return (
    <main className="chapter-briefing screen-layer" aria-labelledby="chapter-briefing-title">
      {chapter.image && (
        <div
          className="chapter-briefing__plate"
          style={{ backgroundImage: `url(${chapter.image})` }}
          aria-hidden="true"
        />
      )}
      <div className="chapter-briefing__shade" aria-hidden="true" />
      <Frame className="chapter-briefing__panel" label="Chapter briefing">
        <div className="chapter-briefing__eyebrow">
          <span>CHAPTER {chapter.number.toString().padStart(2, '0')}</span>
          <i />
          <span>{chapter.location}</span>
        </div>
        <p className="chapter-briefing__operation">{chapter.operation}</p>
        <h2 id="chapter-briefing-title">{chapter.title}</h2>
        <p className="chapter-briefing__logline">{chapter.logline}</p>

        <div className="chapter-briefing__body">
          <section aria-labelledby="mission-path-title">
            <h3 id="mission-path-title">MISSION PATH</h3>
            <ol className="chapter-objectives">
              {chapter.objectives.map((objective, index) => (
                <li key={`${chapter.id}-${objective}`}>
                  <span>{(index + 1).toString().padStart(2, '0')}</span>
                  <strong>{objective}</strong>
                </li>
              ))}
            </ol>
          </section>

          <section className="chapter-comms" aria-labelledby="chapter-comms-title">
            <h3 id="chapter-comms-title">OPEN CHANNEL</h3>
            {chapter.dialogue.slice(0, 3).map((cue) => (
              <blockquote key={`${cue.speaker}-${cue.line}`}>
                <strong>{cue.speaker}</strong>
                <p>{cue.line}</p>
              </blockquote>
            ))}
          </section>
        </div>

        <fieldset className="chapter-difficulty">
          <legend>COMBAT PROFILE</legend>
          {DIFFICULTIES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={difficulty === entry.id ? 'is-selected' : ''}
              aria-pressed={difficulty === entry.id}
              onClick={() => onDifficultyChange(entry.id)}
              data-menu-item
            >
              <strong>{entry.label}</strong>
              <span>{entry.detail}</span>
            </button>
          ))}
        </fieldset>

        <div className="panel-actions">
          <MenuButton onClick={onBack}>CAMPAIGN MAP</MenuButton>
          <MenuButton onClick={onDeploy} primary autoFocus>
            DEPLOY // {chapter.title}
          </MenuButton>
        </div>
      </Frame>
    </main>
  );
}

interface ChapterCompleteScreenProps {
  chapterNumber: number;
  chapterTitle: string;
  nextTitle?: string;
  epilogue: string;
  stats: RunStats | null;
  onContinue: () => void;
  onReplay: () => void;
  onMap: () => void;
}

export function ChapterCompleteScreen({
  chapterNumber,
  chapterTitle,
  nextTitle,
  epilogue,
  stats,
  onContinue,
  onReplay,
  onMap,
}: ChapterCompleteScreenProps) {
  const accuracy =
    stats && stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
  return (
    <main className="chapter-complete screen-layer" aria-labelledby="chapter-complete-title">
      <Frame className="chapter-complete__panel" label="Chapter complete">
        <CarrotIcon className="chapter-complete__emblem" />
        <p>CHAPTER {chapterNumber.toString().padStart(2, '0')} COMPLETE</p>
        <h2 id="chapter-complete-title">{chapterTitle}</h2>
        <blockquote>{epilogue}</blockquote>
        {stats && (
          <div className="chapter-complete__stats">
            <div>
              <span>RANK</span>
              <strong>{stats.rank}</strong>
            </div>
            <div>
              <span>SCORE</span>
              <strong>{stats.score.toLocaleString()}</strong>
            </div>
            <div>
              <span>HOSTILES</span>
              <strong>{stats.kills}</strong>
            </div>
            <div>
              <span>ACCURACY</span>
              <strong>{accuracy}%</strong>
            </div>
          </div>
        )}
        {nextTitle && (
          <div className="chapter-complete__next">
            <span>NEXT SIGNAL ACQUIRED</span>
            <strong>{nextTitle}</strong>
          </div>
        )}
        <div className="panel-actions panel-actions--center">
          {nextTitle && (
            <MenuButton onClick={onContinue} primary autoFocus>
              CONTINUE CAMPAIGN
            </MenuButton>
          )}
          <MenuButton onClick={onReplay}>REPLAY CHAPTER</MenuButton>
          <MenuButton onClick={onMap}>CAMPAIGN MAP</MenuButton>
        </div>
      </Frame>
    </main>
  );
}
