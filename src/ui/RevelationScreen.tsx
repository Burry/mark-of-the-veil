import { useEffect, useState } from 'react';
import { MenuButton } from './Frame';
import { REVELATION_TRANSMISSIONS } from './revelationNarrative';

interface RevelationScreenProps {
  initialStage: number;
  onStageChange: (stage: number) => void;
  onComplete: () => void;
}

export function RevelationScreen({
  initialStage,
  onStageChange,
  onComplete,
}: RevelationScreenProps) {
  const [stage, setStage] = useState(() =>
    Math.min(Math.max(0, initialStage), REVELATION_TRANSMISSIONS.length - 1),
  );
  const finalStage = stage === REVELATION_TRANSMISSIONS.length - 1;
  const signal = REVELATION_TRANSMISSIONS[stage] ?? REVELATION_TRANSMISSIONS[0];

  const advance = () => {
    const nextStage = Math.min(stage + 1, REVELATION_TRANSMISSIONS.length - 1);
    setStage(nextStage);
    onStageChange(nextStage);
  };

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      document.querySelector<HTMLElement>('.revelation-actions [data-menu-item]')?.focus();
    }, 50);
    return () => window.clearTimeout(focusTimer);
  }, [stage]);

  return (
    <main className="revelation-screen screen-layer" aria-labelledby="revelation-title">
      <div className="revelation-rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <article key={stage} className="revelation-signal" aria-live="polite" aria-atomic="true">
        <div
          className="revelation-progress"
          aria-label={`Transmission ${stage + 1} of ${REVELATION_TRANSMISSIONS.length}`}
        >
          <span>{String(stage + 1).padStart(2, '0')}</span>
          <i />
          <span>{String(REVELATION_TRANSMISSIONS.length).padStart(2, '0')}</span>
        </div>
        <p>{signal.code}</p>
        <h2 id="revelation-title">{signal.title}</h2>
        <span>{signal.body}</span>
        <div className="revelation-actions">
          {finalStage ? (
            <MenuButton onClick={onComplete} primary autoFocus>
              LET MARK GO
            </MenuButton>
          ) : (
            <MenuButton onClick={advance} autoFocus>
              ADVANCE SIGNAL
            </MenuButton>
          )}
        </div>
      </article>
      <small className="revelation-footer">THE VEIL REMEMBERS WHAT NEVER WAS</small>
    </main>
  );
}
