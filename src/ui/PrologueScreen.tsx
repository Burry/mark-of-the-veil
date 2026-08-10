import { useEffect, useState } from 'react';
import { MenuButton } from './Frame';

interface PrologueScreenProps {
  onComplete: () => void;
}

const PROLOGUE_BEATS = [
  {
    code: 'NINE YEARS BEFORE THE FALL',
    title: 'THE PILOT IN THE CROWN SHIP',
    body: 'The Wayfarer fell out of the Eidolon Crown above Vespera. Sable Vale opened its cockpit and found Mark: wounded, fully grown, and certain he was the last unicorn from a world called Palea. She repaired his ship, gave him a Vesperan carrot for luck, and became the first person he chose to trust.',
  },
  {
    code: 'LANTERN FLEET // FINAL HARVEST',
    title: 'A BROKEN OATH',
    body: 'Mark became Commander Rook’s finest pilot. Sable became his mechanic, wingmate, and family. After one escape from the Crown, Mark promised her he would never enter it again. When the Crown descended for Vespera’s final harvest, Rook ordered every ship to retreat.',
  },
  {
    code: 'WAYFARER FLIGHT RECORD // 00:00:17',
    title: 'THE TURN BACK',
    body: 'A civilian barge lost power beneath the Crown. Mark turned the Wayfarer back. Sable said, “You promised.” Mark answered, “I promised them too.” The rescue succeeded. A Crown strike tore Sable from the ship and drove the Wayfarer into the stormglass below.',
  },
] as const;

export function PrologueScreen({ onComplete }: PrologueScreenProps) {
  const [stage, setStage] = useState(0);
  const finalStage = stage === PROLOGUE_BEATS.length - 1;
  const beat = PROLOGUE_BEATS[stage] ?? PROLOGUE_BEATS[0];

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      document.querySelector<HTMLElement>('.prologue-screen [data-menu-item]')?.focus();
    }, 50);
    return () => window.clearTimeout(focusTimer);
  }, [stage]);

  return (
    <main
      className="revelation-screen prologue-screen screen-layer"
      aria-labelledby="prologue-title"
    >
      <div className="revelation-rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <article key={stage} className="revelation-signal" aria-live="polite" aria-atomic="true">
        <div className="revelation-progress" aria-label={`Memory ${stage + 1} of 3`}>
          <span>{String(stage + 1).padStart(2, '0')}</span>
          <i />
          <span>03</span>
        </div>
        <p>{beat.code}</p>
        <h2 id="prologue-title">{beat.title}</h2>
        <span>{beat.body}</span>
        <div className="revelation-actions">
          <MenuButton
            onClick={
              finalStage
                ? onComplete
                : () => setStage((current) => Math.min(current + 1, PROLOGUE_BEATS.length - 1))
            }
            primary={finalStage}
            autoFocus
          >
            {finalStage ? 'BEGIN ASHES OF HOME' : 'CONTINUE MEMORY'}
          </MenuButton>
        </div>
      </article>
      <small className="revelation-footer">THE FLIGHT RECORD BEGINS BEFORE THE CRASH</small>
    </main>
  );
}
