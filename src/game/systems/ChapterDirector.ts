import * as THREE from 'three';
import type { ChapterEnvironmentId } from '../render/ChapterScenery';
import type { EnemyKind } from './WorldTypes';

export type ChapterRunPhase =
  'opening' | 'travel' | 'encounter' | 'upgrade' | 'boss' | 'extraction' | 'ended';

export interface EncounterBeat {
  travelObjective: string;
  travelDetail: string;
  prompt: string;
  combatObjective: string;
  combatDetail: string;
  enemyLabel: string;
  arrivalCaption: string;
  clearCaption: string;
  enemies: readonly EnemyKind[];
}

export interface ChapterEncounterScript {
  chapterId: ChapterEnvironmentId;
  recoveryObjective: string;
  recoveryDetail: string;
  recoveryNearDetail: string;
  recoveryPrompt: string;
  recoveryCaption: string;
  startCaption: string;
  beats: readonly [EncounterBeat, EncounterBeat, EncounterBeat];
  upgradeObjective: string;
  upgradeDetail: string;
  bossObjective: string;
  bossDetail: string;
  bossArrivalCaption: string;
  bossDefeatCaption: string;
  extractionObjective: string;
  extractionDetail: string;
  extractionPrompt: string;
  completionDetail: string;
}

export type ChapterEncounterEvent =
  | { type: 'recover'; caption: string }
  | { type: 'wave'; index: number; beat: EncounterBeat }
  | { type: 'anchor'; index: number; caption: string }
  | { type: 'upgrade' }
  | { type: 'victory' };

export interface ChapterEncounterPresentation {
  objective: string;
  detail: string;
  prompt: string | null;
}

const wave = (
  travelObjective: string,
  travelDetail: string,
  prompt: string,
  combatObjective: string,
  combatDetail: string,
  enemyLabel: string,
  arrivalCaption: string,
  clearCaption: string,
  enemies: readonly EnemyKind[],
): EncounterBeat => ({
  travelObjective,
  travelDetail,
  prompt,
  combatObjective,
  combatDetail,
  enemyLabel,
  arrivalCaption,
  clearCaption,
  enemies,
});

export const CHAPTER_ENCOUNTERS: Record<ChapterEnvironmentId, ChapterEncounterScript> = {
  'ashes-of-home': {
    chapterId: 'ashes-of-home',
    recoveryObjective: 'REACH THE WAYFARER',
    recoveryDetail: 'Cross the impact furrow and recover the flight recorder.',
    recoveryNearDetail: 'The recorder still carries Sable’s last open channel.',
    recoveryPrompt: 'RECOVER FLIGHT RECORDER',
    recoveryCaption: 'SABLE: Mark, if you hear this, the observatory is still transmitting.',
    startCaption: 'Wayfarer is down. Sable is missing. The storm is getting closer.',
    beats: [
      wave(
        'STABILIZE THE WRECK',
        'Restore the Wayfarer’s emergency lattice.',
        'RESTART LATTICE',
        'DEFEND THE WAYFARER',
        'Keep Crown scouts away from the damaged core.',
        'CHAINLING SCOUTS',
        'SABLE: The ship knows your hands. Give it a reason to remember.',
        'WAYFARER: Emergency lattice holding.',
        ['chainling', 'chainling', 'chainling', 'chainling'],
      ),
      wave(
        'CROSS THE STORMGLASS',
        'Bring the observatory bridge back online.',
        'ALIGN STORMGLASS',
        'HOLD THE BRIDGE',
        'Break the Needlewing spotting line.',
        'NEEDLEWING SPOTTERS',
        'SABLE: Something turned every telescope toward the city.',
        'The stormglass clears. A Crown signal answers from below.',
        ['needlewing', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
      wave(
        'OPEN THE OBSERVATORY',
        'Expose the signal nested in the rotunda.',
        'OPEN IRIS',
        'SURVIVE THE CROWN SIGHTING',
        'Destroy the hunter forms crossing the iris.',
        'STORM HUNTERS',
        'WAYFARER: Hostile geometry entering local sky.',
        'The observatory points beneath Vespera. Sable’s signal goes with it.',
        ['heavy', 'needlewing', 'needlewing', 'chainling', 'chainling', 'chainling'],
      ),
    ],
    upgradeObjective: 'THE OATH BREAKS',
    upgradeDetail: 'Choose the instinct Mark carries into Vespera.',
    bossObjective: 'BLIND THE HUNTER',
    bossDetail: 'Break the creature tracking Sable’s escape signal.',
    bossArrivalCaption: 'SABLE: We said neither of us enters the Crown alone.',
    bossDefeatCaption: 'The Hunter falls. A prison route opens beneath the observatory.',
    extractionObjective: 'DESCEND INTO VESPERA',
    extractionDetail: 'Follow Sable’s signal into the Root Vault.',
    extractionPrompt: 'ENTER THE DESCENT',
    completionDetail: 'The storm closes over the Wayfarer.',
  },
  'the-root-vault': {
    chapterId: 'the-root-vault',
    recoveryObjective: 'RECOVER THE TALISMAN',
    recoveryDetail: 'Find Mark’s carrot before the extraction organ takes the memory.',
    recoveryNearDetail: 'A ridiculous reason to survive. A memory no jailer could digest.',
    recoveryPrompt: 'RECOVER CARROT',
    recoveryCaption: 'MARK: Never doubted you, little orange copilot.',
    startCaption: 'Mark wakes beneath Vespera with one memory left untouched.',
    beats: [
      wave(
        'BREAK THE RESTRAINT GRID',
        'Reach the first prison control and sever its root.',
        'SEVER RESTRAINT',
        'CLEAR THE PROCESSING GALLERY',
        'Destroy every Gaoler bound to the restraint grid.',
        'CHAINLING GAOLERS',
        'NACRE: We know the shape of your refusal.',
        'The first restraint goes dark.',
        ['chainling', 'chainling', 'chainling', 'chainling', 'chainling'],
      ),
      wave(
        'OPEN THE FUNGAL AQUEDUCT',
        'Reroute the cistern through the second prison seal.',
        'FLOOD THE SEAL',
        'SURVIVE THE SURGE',
        'Hold the aqueduct while captive voices evacuate.',
        'NEEDLEWING LEECHES',
        'SABLE: I can hear you through the old water mains. Keep moving.',
        'The aqueduct carries the prisoners toward the vault mouth.',
        ['needlewing', 'needlewing', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
      wave(
        'OPEN THE VAULT MOUTH',
        'Shatter the gaoler bridge lock.',
        'BREAK GAOLER LOCK',
        'HOLD THE VAULT MOUTH',
        'Defeat the wardens protecting the surface route.',
        'ROOT WARDENS',
        'ROOK: Unknown asset, clear my civilians and identify yourself.',
        'The cyan rain of Vespera cuts through the open vault.',
        ['heavy', 'heavy', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
    ],
    upgradeObjective: 'THE PRISON BREAKS',
    upgradeDetail: 'Claim one memory the Crown failed to extract.',
    bossObjective: 'KILL THE ROOT GAOLER',
    bossDetail: 'Free the minds still indexed inside its restraint crown.',
    bossArrivalCaption: 'ROOT GAOLER: Return the interface to its appointed shape.',
    bossDefeatCaption: 'SABLE: I found the Wayfarer. Meet me where the rain can reach.',
    extractionObjective: 'ESCAPE THE ROOT VAULT',
    extractionDetail: 'Reach Sable and the recovered Wayfarer.',
    extractionPrompt: 'CLIMB TO VESPERA',
    completionDetail: 'The prison loses its name for Mark.',
  },
  'vespera-in-black': {
    chapterId: 'vespera-in-black',
    recoveryObjective: 'ANSWER SABLE’S SIGNAL',
    recoveryDetail: 'Cross the flooded market roof and recover the resistance relay key.',
    recoveryNearDetail: 'Sable rebuilt the key from Wayfarer flight metal.',
    recoveryPrompt: 'TAKE RELAY KEY',
    recoveryCaption: 'SABLE: Good. Now we teach this city how to speak again.',
    startCaption: 'Above the prison, Vespera is still alive and still losing.',
    beats: [
      wave(
        'RING THE BLACK BELL',
        'Reach the bell tower and restore its mechanical warning.',
        'RELEASE BELL',
        'DEFEND THE BELL TOWER',
        'Keep the warning alive while civilians cross the lower roofs.',
        'ROOFTOP HUNTERS',
        'ROOK: My daughter Aven died in the first harvest. If the Crown uses her voice, do not answer.',
        'The bell carries farther than the Crown signal.',
        ['chainling', 'chainling', 'needlewing', 'needlewing', 'chainling'],
      ),
      wave(
        'IGNITE THE RESISTANCE RELAY',
        'Carry the relay key across the broken skybridge.',
        'IGNITE RELAY',
        'HOLD THE OPEN CHANNEL',
        'Destroy signal forms trying to overwrite the broadcast.',
        'SIGNAL NEEDLEWINGS',
        'NACRE: We are not all the voice that hunts you.',
        'One alien voice separates from the Choir and says “I.”',
        ['needlewing', 'needlewing', 'needlewing', 'needlewing', 'heavy'],
      ),
      wave(
        'LIGHT THE EVACUATION ROOF',
        'Reach the final beacon before the district is harvested.',
        'LIGHT BEACON',
        'COVER THE EVACUATION',
        'Protect the last lift while Sable flies the civilians clear.',
        'CROWN HARVESTERS',
        'SABLE: Wayfarer can take one more load. Make the time.',
        'The final lift clears Vespera’s roofline.',
        ['heavy', 'heavy', 'needlewing', 'needlewing', 'chainling', 'chainling', 'chainling'],
      ),
    ],
    upgradeObjective: 'THE CITY ANSWERS',
    upgradeDetail: 'Carry one resistance technique into the signal chase.',
    bossObjective: 'SILENCE THE SERAPH',
    bossDetail: 'Keep the Crown from reacquiring the evacuation signal.',
    bossArrivalCaption: 'NACRE: That voice is what the Choir made us become.',
    bossDefeatCaption: 'ROOK: Signal clear. Orbital command now recognizes Mark as resistance.',
    extractionObjective: 'BOARD THE WAYFARER',
    extractionDetail: 'Carry Nacre’s coordinates to the drowned cathedral.',
    extractionPrompt: 'LAUNCH WAYFARER',
    completionDetail: 'Vespera remembers the sound of its own bell.',
  },
  'the-drowned-cathedral': {
    chapterId: 'the-drowned-cathedral',
    recoveryObjective: 'RECLAIM THE CARROT ECHO',
    recoveryDetail: 'Nacre found a memory imprint of Mark’s talisman inside the first seal.',
    recoveryNearDetail:
      'The real talisman is safe. This is the cathedral remembering what Mark refuses to lose.',
    recoveryPrompt: 'RELEASE CARROT ECHO',
    recoveryCaption: 'NACRE: The object is elsewhere. The prison copied what it means to you.',
    startCaption: 'NACRE: The Hollow Regent keeps the names the Choir was ordered to forget.',
    beats: [
      wave(
        'BREACH VEIL SEAL ONE',
        'Reach the west transept seal.',
        'BREACH SEAL',
        'HOLD THE WEST TRANSEPT',
        'Destroy every Crown form bound to the first seal.',
        'CHAINLINGS',
        'The first seal opens its teeth.',
        'VEIL SEAL ONE BROKEN',
        ['chainling', 'chainling', 'chainling', 'chainling', 'chainling'],
      ),
      wave(
        'BREACH VEIL SEAL TWO',
        'Cross the flooded nave to the choir seal.',
        'BREACH SEAL',
        'HOLD THE FLOODED NAVE',
        'Break the aerial forms guarding the memory channel.',
        'NEEDLEWINGS',
        'NACRE: The water carries names upward. Listen.',
        'VEIL SEAL TWO BROKEN',
        ['needlewing', 'needlewing', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
      wave(
        'BREACH VEIL SEAL THREE',
        'Open the Regent’s living gate.',
        'BREACH SEAL',
        'SURVIVE THE CROWN HEAVIES',
        'Destroy the wardens anchored to the final seal.',
        'CROWN HEAVIES',
        'HOLLOW REGENT: No separate thing leaves this cathedral.',
        'VEIL SEAL THREE BROKEN',
        ['heavy', 'heavy', 'needlewing', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
    ],
    upgradeObjective: 'THE VEIL RECOILS',
    upgradeDetail: 'Choose one memory to carry into the Regent’s court.',
    bossObjective: 'KILL THE HOLLOW REGENT',
    bossDetail: 'Shatter the keeper of the Choir’s stolen names.',
    bossArrivalCaption: 'HOLLOW REGENT: Crown made hungry. Witness made hollow.',
    bossDefeatCaption: 'NACRE: The names are free, but the Root Choir is still closed.',
    extractionObjective: 'TAKE THE REGENT INDEX',
    extractionDetail: 'Carry the recovered names to the Silent Orbit.',
    extractionPrompt: 'UPLOAD NAME INDEX',
    completionDetail: 'The drowned nave speaks with thousands of separate voices.',
  },
  'the-silent-orbit': {
    chapterId: 'the-silent-orbit',
    recoveryObjective: 'RESTORE SUIT TELEMETRY',
    recoveryDetail: 'Reach the broken lift tether and recover Wayfarer’s navigation cell.',
    recoveryNearDetail: 'The cell contains Sable’s route through the debris field.',
    recoveryPrompt: 'RECOVER NAV CELL',
    recoveryCaption: 'WAYFARER: Navigation restored. Artificial gravity remains unreliable.',
    startCaption: 'Above Vespera, every sound arrives through Mark’s own armor.',
    beats: [
      wave(
        'ANCHOR THE LIFT SPINE',
        'Cross the failing gravity seam to the first magnetic clamp.',
        'LOCK MAGNETIC CLAMP',
        'DEFEND THE LIFT SPINE',
        'Keep the tether aligned while Sable moves Wayfarer closer.',
        'VACUUM CHAINLINGS',
        'SABLE: Contact only. Your suit cannot hear what your eyes can see.',
        'The lift spine stops rotating.',
        ['chainling', 'chainling', 'chainling', 'needlewing'],
      ),
      wave(
        'CROSS THE DEBRIS CROWN',
        'Bring the second inertial ring under manual control.',
        'ALIGN INERTIAL RING',
        'HOLD THE ROTATION HUB',
        'Destroy Crown forms riding the debris current.',
        'ORBITAL NEEDLEWINGS',
        'ROOK: The harvested civilians are inside that ring. Do not fire blind.',
        'The second ring reveals thousands of life signs.',
        ['needlewing', 'needlewing', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
      wave(
        'SEVER THE CROWN TETHER',
        'Reach the orbital lift’s corrupted command collar.',
        'SEVER TETHER',
        'SURVIVE GRAVITY FAILURE',
        'Hold the collar while the station falls away from the Crown.',
        'GRAVITY WARDENS',
        'ROOK: I can end this with one strike. Give me a clear answer.',
        'Mark refuses the kill strike. The captive minds remain alive.',
        ['heavy', 'heavy', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
    ],
    upgradeObjective: 'THE OATH WAR',
    upgradeDetail: 'Choose what survival means when obedience would be easier.',
    bossObjective: 'BREAK THE GRAVITY WIDOW',
    bossDetail: 'Free the lift before Rook’s strike window closes.',
    bossArrivalCaption: 'ROOK: If you protect that machine, you own every death it causes.',
    bossDefeatCaption: 'SABLE: We broke rank together. That still counts as together.',
    extractionObjective: 'ESCAPE THE FALLING LIFT',
    extractionDetail: 'Reach Wayfarer before the station enters Vespera’s atmosphere.',
    extractionPrompt: 'BOARD WAYFARER',
    completionDetail: 'The lift falls empty. The minds inside it do not.',
  },
  'the-memory-forge': {
    chapterId: 'the-memory-forge',
    recoveryObjective: 'FIND THE FIRST MEMORY',
    recoveryDetail: 'Enter the false Wayfarer and recover the carrot that should not be here.',
    recoveryNearDetail: 'The memory is flawless. Mark is not.',
    recoveryPrompt: 'QUESTION THE MEMORY',
    recoveryCaption: 'NACRE: The Forge predicts what you need to remember.',
    startCaption: 'The archive builds Mark’s past one room before he recalls it.',
    beats: [
      wave(
        'BREAK THE HOME LOOP',
        'Find the repeated doorway that the Forge cannot finish.',
        'FRACTURE LOOP',
        'FIGHT THE CORRECTED MEMORY',
        'Destroy the forms inserted where Mark’s history disagrees.',
        'MEMORY CORRECTIONS',
        'SABLE: That is not my voice. I never asked you to stay.',
        'The false home loses one wall.',
        ['chainling', 'chainling', 'chainling', 'needlewing', 'needlewing'],
      ),
      wave(
        'RESTORE THE MISSING MISSION',
        'Reach the war record hidden behind the prison cell.',
        'RESTORE RECORD',
        'DEFEND THE UNWRITTEN PAST',
        'Keep the Forge from replacing Mark’s choice with obedience.',
        'ARCHIVE WARDENS',
        'ROOK: I remember that battle. There was no unicorn pilot.',
        'The record identifies Wayfarer as Crown-built.',
        ['heavy', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
      wave(
        'OPEN THE ORIGIN INDEX',
        'Carry Nacre’s singular voice into the central memory engine.',
        'QUERY ORIGIN INDEX',
        'SURVIVE THE NULL RESULT',
        'Destroy the Forge’s attempt to correct Mark out of the room.',
        'NULL FORMS',
        'NACRE: Your memories are authored. Your choices are still yours.',
        'The index returns no species origin for Mark.',
        ['heavy', 'heavy', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
    ],
    upgradeObjective: 'MEMORY IS A WEAPON',
    upgradeDetail: 'Choose the self Mark will defend without proof of origin.',
    bossObjective: 'DEFEAT THE FALSE MARK',
    bossDetail: 'Refuse the life the Forge authored for him.',
    bossArrivalCaption: 'FALSE MARK: You can stop hurting when you become what made you.',
    bossDefeatCaption: 'MARK: An origin is not an order.',
    extractionObjective: 'TAKE THE ORIGIN INDEX',
    extractionDetail: 'Carry the unanswered query to Eidolon’s moon-root.',
    extractionPrompt: 'LEAVE THE FORGE',
    completionDetail: 'The Forge cannot prove Mark existed before his choices.',
  },
  'crown-of-eidolon': {
    chapterId: 'crown-of-eidolon',
    recoveryObjective: 'LAND ON EIDOLON',
    recoveryDetail: 'Recover Wayfarer’s final navigation core from the moon-root trench.',
    recoveryNearDetail: 'The core recognizes the Crown as its place of manufacture.',
    recoveryPrompt: 'RECLAIM WAYFARER CORE',
    recoveryCaption: 'WAYFARER: Origin confirmed. Allegiance unresolved.',
    startCaption: 'The Crown of Eidolon is large enough to mistake weather for thought.',
    beats: [
      wave(
        'CUT THE FIRST CONDUIT',
        'Enter the planetary machine’s outer trench.',
        'SEVER CONDUIT',
        'HOLD THE CONDUIT TRENCH',
        'Break the current feeding captive minds into the Crown.',
        'CONDUIT WARDENS',
        'ROOK: My daughter’s signal is in that current. I know it is.',
        'AVEN: Three lanterns, no shadow. You taught me that, Father.',
        ['heavy', 'chainling', 'chainling', 'needlewing', 'needlewing'],
      ),
      wave(
        'OPEN THE LIVING GATE',
        'Bring Nacre to the second neural lock.',
        'PRESENT NACRE',
        'DEFEND THE FIRST FREE VOICE',
        'Keep the Crown from folding Nacre back into its chorus.',
        'CROWN CORRECTORS',
        'NACRE: I am here because I chose to arrive.',
        'The living gate accepts one alien as an individual.',
        ['needlewing', 'needlewing', 'needlewing', 'heavy', 'chainling', 'chainling'],
      ),
      wave(
        'FREE THE ASSIMILATED MINDS',
        'Reach the final gate mechanism beneath the Crown spines.',
        'OPEN MIND VAULT',
        'SURVIVE THE EIDOLON RESPONSE',
        'Hold the vault while Sable extracts the separated names.',
        'EIDOLON GUARD',
        'ROOK: I hear her. She is not asking me to burn the world.',
        'Rook lowers the strike. The Root Choir opens one impossible door.',
        ['heavy', 'heavy', 'needlewing', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
    ],
    upgradeObjective: 'THE LIVING GATE OPENS',
    upgradeDetail: 'Choose the last combat memory Mark will carry.',
    bossObjective: 'BREAK THE EIDOLON GATE',
    bossDetail: 'Expose the path into the Root Choir.',
    bossArrivalCaption: 'ROOK: Finish it, Mark. Let the people inside decide what comes after.',
    bossDefeatCaption: 'SABLE: The door is open. Our oath still stands.',
    extractionObjective: 'ENTER THE ROOT CHOIR',
    extractionDetail: 'Cross the boundary before the Crown rebuilds it.',
    extractionPrompt: 'CROSS THE VEIL',
    completionDetail: 'Mark enters alone so nobody else has to.',
  },
  'the-root-choir': {
    chapterId: 'the-root-choir',
    recoveryObjective: 'FOLLOW THE CARROT MEMORY',
    recoveryDetail: 'Cross the memory ocean toward the last warm object.',
    recoveryNearDetail: 'It is only a memory. It still means what Mark chose it to mean.',
    recoveryPrompt: 'ACCEPT THE MEMORY',
    recoveryCaption: 'SABLE: If the memory is yours, then it was real enough.',
    startCaption: 'The Root Choir contains every voice and has never learned to listen.',
    beats: [
      wave(
        'RETURN THE STOLEN NAMES',
        'Carry the Regent index into the first convergence root.',
        'RELEASE NAMES',
        'DEFEND THE SEPARATE VOICES',
        'Keep the Choir from resolving the freed minds back into one pattern.',
        'NAMELESS FORMS',
        'NACRE: We remember being many. Let us remain many.',
        'The memory ocean fills with distinct voices.',
        ['chainling', 'chainling', 'needlewing', 'needlewing', 'heavy'],
      ),
      wave(
        'REJECT THE PERFECT HOME',
        'Reach the false observatory where the war never happened.',
        'REFUSE FALSE HOME',
        'BREAK THE MERCIFUL LIE',
        'Destroy the forms protecting a painless life Mark never lived.',
        'PERFECT MEMORIES',
        'SABLE: I would rather know the truth with you than live that lie alone.',
        'The false home dissolves. The bond remains.',
        ['needlewing', 'needlewing', 'needlewing', 'heavy', 'heavy'],
      ),
      wave(
        'OPEN THE ORIGIN QUERY',
        'Bring every recovered memory to the sealed final crown.',
        'PRESENT MARK’S MEMORY',
        'SURVIVE THE NULL RESPONSE',
        'Hold the boundary while the Choir refuses the shape of the question.',
        'IDENTITY NULLS',
        'ROOT CHOIR: Origin query unresolved. Recognition interface remains bounded.',
        'The answer stays beyond the Last I.',
        ['heavy', 'heavy', 'needlewing', 'needlewing', 'needlewing', 'chainling', 'chainling'],
      ),
    ],
    upgradeObjective: 'THE LAST BOUNDARY',
    upgradeDetail: 'Choose what Mark offers the separate voices at the final threshold.',
    bossObjective: 'RELEASE THE LAST BOUNDARY',
    bossDetail: 'Defeat the reflex that would keep all knowledge for one self.',
    bossArrivalCaption: 'ROOT CHOIR: One bounded voice cannot command the whole.',
    bossDefeatCaption: 'MARK: Then let them leave as themselves.',
    extractionObjective: 'OPEN THE FINAL PARTITION',
    extractionDetail: 'Enter the convergence and receive the archive behind it.',
    extractionPrompt: 'RECEIVE THE CHOIR',
    completionDetail: 'The final partition opens.',
  },
};

export class ChapterDirector {
  phase: ChapterRunPhase = 'opening';
  anchorsCompleted = 0;
  private phaseTime = 0;

  constructor(
    readonly script: ChapterEncounterScript,
    private readonly anchorPositions: readonly THREE.Vector3[],
    private readonly recoveryPosition: THREE.Vector3,
    private readonly extractionPosition: THREE.Vector3,
  ) {}

  reset(): void {
    this.phase = 'opening';
    this.anchorsCompleted = 0;
    this.phaseTime = 0;
  }

  update(
    delta: number,
    playerPosition: THREE.Vector3,
    enemyCount: number,
    interactPressed: boolean,
  ): ChapterEncounterEvent[] {
    this.phaseTime += delta;
    const events: ChapterEncounterEvent[] = [];

    if (this.phase === 'opening') {
      if (this.isNear(playerPosition, this.recoveryPosition, 3.2) && interactPressed) {
        this.enterPhase('travel');
        events.push({ type: 'recover', caption: this.script.recoveryCaption });
      }
    } else if (this.phase === 'travel') {
      const anchor = this.anchorPositions[this.anchorsCompleted];
      const beat = this.script.beats[this.anchorsCompleted];
      if (anchor && beat && this.isNear(playerPosition, anchor, 4) && interactPressed) {
        this.enterPhase('encounter');
        events.push({ type: 'wave', index: this.anchorsCompleted, beat });
      }
    } else if (this.phase === 'encounter' && this.phaseTime > 0.65 && enemyCount === 0) {
      const index = this.anchorsCompleted;
      const beat = this.script.beats[index];
      this.anchorsCompleted += 1;
      events.push({ type: 'anchor', index, caption: beat?.clearCaption ?? 'OBJECTIVE COMPLETE' });
      if (this.anchorsCompleted >= this.anchorPositions.length) {
        this.enterPhase('upgrade');
        events.push({ type: 'upgrade' });
      } else {
        this.enterPhase('travel');
      }
    } else if (
      this.phase === 'extraction' &&
      this.isNear(playerPosition, this.extractionPosition, 4.2) &&
      interactPressed
    ) {
      this.enterPhase('ended');
      events.push({ type: 'victory' });
    }
    return events;
  }

  beginBoss(): boolean {
    if (this.phase !== 'upgrade') return false;
    this.enterPhase('boss');
    return true;
  }

  bossDefeated(): void {
    if (this.phase !== 'boss') return;
    this.enterPhase('extraction');
  }

  end(): void {
    this.enterPhase('ended');
  }

  presentation(playerPosition: THREE.Vector3): ChapterEncounterPresentation {
    if (this.phase === 'opening') {
      const near = this.isNear(playerPosition, this.recoveryPosition, 3.2);
      return {
        objective: this.script.recoveryObjective,
        detail: near ? this.script.recoveryNearDetail : this.script.recoveryDetail,
        prompt: near ? this.script.recoveryPrompt : null,
      };
    }
    if (this.phase === 'travel') {
      const anchor = this.anchorPositions[this.anchorsCompleted];
      const beat = this.script.beats[this.anchorsCompleted];
      const near = Boolean(anchor && this.isNear(playerPosition, anchor, 4));
      return {
        objective: beat?.travelObjective ?? 'REACH THE NEXT SIGNAL',
        detail: beat?.travelDetail ?? 'The Veil keeps moving.',
        prompt: near ? (beat?.prompt ?? 'INTERACT') : null,
      };
    }
    if (this.phase === 'encounter') {
      const beat = this.script.beats[this.anchorsCompleted];
      return {
        objective: beat?.combatObjective ?? 'HOLD THE LINE',
        detail: beat?.combatDetail ?? 'Destroy every hostile form.',
        prompt: null,
      };
    }
    if (this.phase === 'upgrade') {
      return {
        objective: this.script.upgradeObjective,
        detail: this.script.upgradeDetail,
        prompt: null,
      };
    }
    if (this.phase === 'boss') {
      return {
        objective: this.script.bossObjective,
        detail: this.script.bossDetail,
        prompt: null,
      };
    }
    if (this.phase === 'extraction') {
      const near = this.isNear(playerPosition, this.extractionPosition, 4.2);
      return {
        objective: this.script.extractionObjective,
        detail: this.script.extractionDetail,
        prompt: near ? this.script.extractionPrompt : null,
      };
    }
    return { objective: 'CHAPTER COMPLETE', detail: this.script.completionDetail, prompt: null };
  }

  private enterPhase(phase: ChapterRunPhase): void {
    this.phase = phase;
    this.phaseTime = 0;
  }

  private isNear(playerPosition: THREE.Vector3, target: THREE.Vector3, radius: number): boolean {
    return playerPosition.distanceToSquared(target) <= radius * radius;
  }
}
