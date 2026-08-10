# Game design: Mark of the Veil

## Premise

Mark is a scarred purple unicorn, former starfighter ace, and the last pilot able to breach the
Eidolon Crown, a moon-sized machine turning Vespera's living minds into one broadcast. His fighter,
the **Wayfarer**, falls into a stormglass basin as the Crown begins its final harvest.

Mark follows Sable Vale's signal from the crash, through the prison beneath Vespera, across the
occupied city, into orbit, and finally inside the alien Root Choir. Each chapter challenges his
belief that origin determines identity. The tone is earnest cosmic fantasy with dry warmth. A carrot
given to Mark by Sable starts as a joke, becomes proof of their shared history, and ends as a symbol
of a life whose meaning does not depend on a true origin story.

## Story arc

| Act                    | Chapters | Dramatic movement                                                                                                                                       |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I: The self remembered | 01 to 03 | Mark survives the crash, escapes a prison that already knows him, reunites with Vespera, and hears one alien voice separate from the Choir.             |
| II: The origin breaks  | 04 to 06 | The Hollow Regent releases stolen names, the orbital archive ties Wayfarer to the Crown, and the Memory Forge finds no species origin for Mark.         |
| III: The chosen self   | 07 to 08 | Mark frees the Crown's captive minds, enters the Root Choir by choice, learns unicorns never existed, and gives up the boundary that made him separate. |

The final reveal is fixed. Mark receives the Choir's total knowledge and finds no unicorns anywhere
in it. He ceases to exist because complete knowledge leaves no border between the knower and
everything known. The liberated Choir retains the memory of the impossible person who entered it.

## Eight playable chapters

|   # | Chapter                   | Playable arena                             | Narrative turn                                                                     | Boss identity     |
| --: | ------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- | ----------------- |
|  01 | **Ashes of Home**         | crash basin and observatory                | The Wayfarer's record begins at impact, and the prison signal recognizes Mark.     | Stormglass Hunter |
|  02 | **The Root Vault**        | living prison and fungal aqueduct          | Mark's carrot predates his remembered birth; Sable calls him the pilot.            | Root Gaoler       |
|  03 | **Vespera in Black**      | rain-black rooftops and relay towers       | Nacre separates from the hostile broadcast and says "I."                           | Skybell Seraph    |
|  04 | **The Drowned Cathedral** | flooded nave and three Veil seals          | The Regent's stolen names point to an orbital root.                                | Hollow Regent     |
|  05 | **The Silent Orbit**      | lift spine, rings, and debris field        | Wayfarer's origin resolves inside the Eidolon Crown.                               | Gravity Widow     |
|  06 | **The Memory Forge**      | reconstructed archive and memory engine    | Palea was authored, but Mark rejects the obedience built into its perfect version. | The False Mark    |
|  07 | **Crown of Eidolon**      | moon-root conduit trenches and living gate | Nacre is accepted as an individual and Mark opens the path into the whole.         | Eidolon Gate      |
|  08 | **The Root Choir**        | memory ocean and convergence crown         | Mark frees separate voices, receives total knowledge, and ceases to be separate.   | The Last I        |

These are eight compact, replayable combat arenas. They share a movement model, enemy set, combat
rules, and encounter grammar. Layout, hero geometry, recovery prop, palette, particles, score,
dialogue, wave composition, boss silhouette, and extraction context change by chapter. The campaign
manifest is the canonical source for every boss ID, name, and subtitle.

## Playable chapter structure

Each runtime level uses one clear action spine:

1. Recover the chapter prop: flight recorder, carrot memory, relay key, navigation cell, or Wayfarer
   core.
2. Travel to the first landmark, interact, and clear its wave.
3. Repeat for the second and third landmarks with increasing pressure.
4. Choose Ace's Capacitor, Survivor's Appetite, or Stormhorn Resonance for the current run.
5. Defeat the chapter's named boss.
6. Reach the extraction point and complete the chapter.

Briefings present seven authored story objectives per chapter. The 56-objective campaign manifest is
a design and narrative model with 13 objective categories. The current combat runtime condenses that
material into the shared milestone structure above. Escort, investigation, defense timers, escape
timers, infiltration nodes, and revelation beats in the manifest do not each have separate simulation
systems.

Completing a level marks its seven manifest objectives complete as one transaction, unlocks the next
chapter, and opens a chapter results screen. A failed run restarts its current arena. Closing the page
during a run returns to the start of that chapter on the next visit.

## Combat kit

- **Sunlance carbine:** accurate automatic fire, 36-round magazine, reload, hitscan impacts, recoil,
  muzzle light, and mechanical crystalline sound.
- **Comet Dash:** omnidirectional burst with a short invulnerability window and a cooldown of roughly
  three seconds.
- **Horn Pulse:** close-range shockwave that damages and knocks back regular enemies. Its base
  cooldown is 8.5 seconds.
- **Ward and Resolve:** 50 regenerating shield over 100 health. Ward recovery begins after roughly
  four seconds without damage.
- **Perspective:** third person emphasizes Mark's silhouette and spatial awareness. First person
  tightens the view around furred forearms, the weapon, and horn-energy effects. Both use the same
  aim ray and damage model.

## Enemy set

- **Chainling:** fast quadrupedal hunter with a telegraphed lunge.
- **Needlewing:** airborne standoff unit with a visible targeting wedge and plasma attack.
- **Ruin Warden:** armored heavy that charges and exposes a rear core.
- **Regent family:** the boss combat rig uses radial fire, shockwaves, summons, and an exposed central
  core.

Ground and airborne enemies are clamped to the current arena and pushed away from authored scenery
collision volumes after movement. The eight bosses share the Regent behavior family, but each adds a
distinct procedural silhouette, material treatment, scale, and deterministic animation hooks. They
do not have eight independent AI movesets. Every threat combines shape, motion, sound, color,
optional captions, and optional haptics.

## Relic choices

- **Ace's Capacitor:** 48-round magazine, harder shots, faster fire, and quicker reloads.
- **Survivor's Appetite:** higher maximum Resolve and Ward, immediate recovery, and a shorter dash
  cooldown.
- **Stormhorn Resonance:** wider, stronger Horn Pulse with a shorter cooldown.

A relic applies to the active chapter run. Campaign storage remembers which relic types the player
has selected, but a newly loaded chapter starts from base combat tuning and presents another choice.

## Difficulty, scoring, and results

Story, Descent, and Nightmare adjust incoming damage, enemy movement, and combat pressure without
changing chapter order or story content.

Fast kills build a multiplier up to 4x. Health damage breaks the chain. Chapter results report time,
accuracy, kills, score, damage taken, and C to S rank. The best run record is stored locally and uses
score, rank, then elapsed time as its comparison order.

## Shipped boundaries

The browser release includes eight chapter arenas, ordered local progression, briefings, in-engine
transmissions, chapter results, and the fixed final revelation. It does not include multiplayer,
dialogue trees, inventory management, character creation, touch-first play, companion AI, crowds,
flight control, variable gravity, stealth, cinematic facial performance, a continuous open world, or
mid-chapter checkpoint resume.

[`CAMPAIGN.md`](./CAMPAIGN.md) and [`WORLD_AUDIO_BIBLE.md`](./WORLD_AUDIO_BIBLE.md) preserve the
larger narrative, art, cinematography, music, and future production target. Their scene counts,
mechanics, content durations, and asset plans describe future production direction. They are not
current-build features.
