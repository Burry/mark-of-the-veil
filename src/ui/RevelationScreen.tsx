import { useEffect, useState } from 'react';
import { MenuButton } from './Frame';

interface RevelationScreenProps {
  onComplete: () => void;
}

const TRANSMISSION = [
  {
    code: 'CONTACT // ROOT CHOIR',
    title: 'THE REGENT WAS A DOOR',
    body: 'Mark crosses the signal boundary. A billion alien lives arrive at once—not voices, but one continuous memory.',
  },
  {
    code: 'TOTAL RECALL // 23.8 EXABRAINS',
    title: 'EVERY MIND. EVERY ANSWER.',
    body: 'He receives their first birth, their last war, and the name of every star the Crown consumed.',
  },
  {
    code: 'QUERY // ORIGIN: MARK',
    title: 'HE SEARCHES FOR HOME',
    body: 'The Choir opens all of history. Mark looks for the world that made him, the herd that remembers him, the species written in his blood.',
  },
  {
    code: 'QUERY RESULT // NULL',
    title: "UNICORNS AREN'T REAL.",
    body: 'There was never a herd. Never a homeworld. The horn, the fur, the name—an interface the prison invented so a mind could recognize itself.',
  },
  {
    code: 'INDIVIDUAL PROCESS // TERMINATED',
    title: 'NO OBSERVER REMAINS',
    body: 'Complete knowledge leaves no boundary called Mark. He understands everything, and in that same instant, he ceases to exist.',
  },
] as const;

export function RevelationScreen({ onComplete }: RevelationScreenProps) {
  const [stage, setStage] = useState(0);
  const finalStage = stage === TRANSMISSION.length - 1;
  const signal = TRANSMISSION[stage] ?? TRANSMISSION[0];

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
        <div className="revelation-progress" aria-label={`Transmission ${stage + 1} of 5`}>
          <span>{String(stage + 1).padStart(2, '0')}</span>
          <i />
          <span>05</span>
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
            <MenuButton
              onClick={() => setStage((current) => Math.min(current + 1, TRANSMISSION.length - 1))}
              autoFocus
            >
              ADVANCE SIGNAL
            </MenuButton>
          )}
        </div>
      </article>
      <small className="revelation-footer">THE VEIL REMEMBERS WHAT NEVER WAS</small>
    </main>
  );
}
