import * as THREE from 'three';
import type { EnemyKind } from './WorldTypes';

export type RunPhase =
  'opening' | 'travel' | 'encounter' | 'upgrade' | 'boss' | 'extraction' | 'ended';

export type EncounterEvent =
  | { type: 'carrot' }
  | { type: 'wave'; index: number; enemies: readonly EnemyKind[] }
  | { type: 'seal'; index: number }
  | { type: 'upgrade' }
  | { type: 'victory' };

export interface EncounterPresentation {
  objective: string;
  detail: string;
  prompt: string | null;
}

const WAVES: ReadonlyArray<readonly EnemyKind[]> = [
  ['chainling', 'chainling', 'chainling', 'chainling', 'chainling'],
  ['needlewing', 'needlewing', 'needlewing', 'needlewing', 'chainling', 'chainling'],
  [
    'heavy',
    'heavy',
    'needlewing',
    'needlewing',
    'needlewing',
    'chainling',
    'chainling',
    'chainling',
  ],
];

export class EncounterDirector {
  phase: RunPhase = 'opening';
  sealsBroken = 0;
  private phaseTime = 0;

  constructor(
    private readonly sealPositions: readonly THREE.Vector3[],
    private readonly carrotPosition: THREE.Vector3,
    private readonly extractionPosition: THREE.Vector3,
  ) {}

  reset(): void {
    this.phase = 'opening';
    this.sealsBroken = 0;
    this.phaseTime = 0;
  }

  update(
    delta: number,
    playerPosition: THREE.Vector3,
    enemyCount: number,
    interactPressed: boolean,
  ): EncounterEvent[] {
    this.phaseTime += delta;
    const events: EncounterEvent[] = [];
    if (this.phase === 'opening') {
      if (playerPosition.distanceToSquared(this.carrotPosition) <= 3.2 ** 2 && interactPressed) {
        this.phase = 'travel';
        this.phaseTime = 0;
        events.push({ type: 'carrot' });
      }
    } else if (this.phase === 'travel') {
      const seal = this.sealPositions[this.sealsBroken];
      if (seal && playerPosition.distanceToSquared(seal) <= 4.0 ** 2 && interactPressed) {
        this.phase = 'encounter';
        this.phaseTime = 0;
        events.push({ type: 'wave', index: this.sealsBroken, enemies: WAVES[this.sealsBroken] });
      }
    } else if (this.phase === 'encounter' && this.phaseTime > 0.65 && enemyCount === 0) {
      const index = this.sealsBroken;
      this.sealsBroken += 1;
      events.push({ type: 'seal', index });
      this.phaseTime = 0;
      if (this.sealsBroken >= this.sealPositions.length) {
        this.phase = 'upgrade';
        events.push({ type: 'upgrade' });
      } else {
        this.phase = 'travel';
      }
    } else if (this.phase === 'extraction') {
      if (
        playerPosition.distanceToSquared(this.extractionPosition) <= 4.2 ** 2 &&
        interactPressed
      ) {
        this.phase = 'ended';
        events.push({ type: 'victory' });
      }
    }
    return events;
  }

  beginBoss(): boolean {
    if (this.phase !== 'upgrade') return false;
    this.phase = 'boss';
    this.phaseTime = 0;
    return true;
  }

  bossDefeated(): void {
    if (this.phase !== 'boss') return;
    this.phase = 'extraction';
    this.phaseTime = 0;
  }

  end(): void {
    this.phase = 'ended';
  }

  presentation(playerPosition: THREE.Vector3): EncounterPresentation {
    if (this.phase === 'opening') {
      const near = playerPosition.distanceToSquared(this.carrotPosition) <= 3.2 ** 2;
      return {
        objective: 'RECOVER THE TALISMAN',
        detail: near
          ? 'Mark found the last bright thing in the Root Vault.'
          : 'Retrieve Mark’s carrot before breaching the city.',
        prompt: near ? '[E / X] RECOVER CARROT' : null,
      };
    }
    if (this.phase === 'travel') {
      const seal = this.sealPositions[this.sealsBroken];
      const near = Boolean(seal && playerPosition.distanceToSquared(seal) <= 4.0 ** 2);
      return {
        objective: 'BREAK THE THREE SEALS',
        detail: `Reach Veil Seal ${this.sealsBroken + 1} of ${this.sealPositions.length}.`,
        prompt: near ? '[E / X] BREACH SEAL' : null,
      };
    }
    if (this.phase === 'encounter') {
      return {
        objective: `SEAL ${this.sealsBroken + 1}: HOLD THE LINE`,
        detail: 'Destroy every Crown-form bound to this seal.',
        prompt: null,
      };
    }
    if (this.phase === 'upgrade') {
      return {
        objective: 'THE VEIL RECOILS',
        detail: 'Choose one memory to carry into the Regent’s court.',
        prompt: null,
      };
    }
    if (this.phase === 'boss') {
      return {
        objective: 'KILL THE HOLLOW REGENT',
        detail: 'Shatter the Crown’s living gatekeeper.',
        prompt: null,
      };
    }
    if (this.phase === 'extraction') {
      const near = playerPosition.distanceToSquared(this.extractionPosition) <= 4.2 ** 2;
      return {
        objective: 'ENTER THE ROOT CHOIR',
        detail: 'The Regent’s mind is open. Ride the Wayfarer signal into the alien Crown.',
        prompt: near ? '[E / X] INFILTRATE HIVE-MIND' : null,
      };
    }
    return { objective: 'RUN COMPLETE', detail: 'The Veil remembers Mark.', prompt: null };
  }
}
