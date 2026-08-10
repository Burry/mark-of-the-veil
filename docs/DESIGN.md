# Mark of the Veil: production design

## Product promise

An eight-chapter science-fantasy combat campaign starring **Mark**, a battle-worn purple unicorn
pilot caught between occupied Vespera and the alien Eidolon Crown.

The experience is structured as eight compact arenas with a continuous narrative. Mark falls with
the Wayfarer, escapes the Root Vault, helps Vespera resist, follows the Choir into orbit, confronts
his authored past, and enters the hive-mind by choice. This browser build is a focused arena campaign,
not an open world or a conventional retail-scale production.

## Visual references

- [`concepts/gameplay-spec.jpg`](./concepts/gameplay-spec.jpg): primary play surface, camera, enemy
  language, material response, VFX, and HUD target
- [`concepts/menu-spec.jpg`](./concepts/menu-spec.jpg): title, menu, focus state, and settings target
- [`concepts/campaign/vespera-in-black.png`](./concepts/campaign/vespera-in-black.png): occupied city
  and relay-rooftop target
- [`concepts/campaign/the-memory-forge.png`](./concepts/campaign/the-memory-forge.png): fractured
  archive and false-memory target
- [`concepts/campaign/the-root-choir.png`](./concepts/campaign/the-root-choir.png): final convergence
  and memory-ocean target

These are generated visual targets, not gameplay screenshots. The original concept image supplied by
a friend remains separate from the repository. Runtime art combines generated image plates and
material studies, code-authored geometry and effects, and the CC0 assets listed in
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).

## Interface system

| Token        | Value     | Role                                 |
| ------------ | --------- | ------------------------------------ |
| Void         | `#05070c` | background and ink panels            |
| Basalt       | `#10151b` | environment surfaces                 |
| Bone         | `#e7d7b0` | primary UI text and engraved rules   |
| Ash          | `#9a9ba0` | secondary UI text                    |
| Ember        | `#ff673f` | hostile energy and selected controls |
| Ward         | `#76c9f4` | player shield                        |
| Resolve      | `#f0ede4` | player health                        |
| Mark energy  | `#9a78ff` | horn abilities and player effects    |
| Carrot amber | `#f3a24f` | shelter, memory, and recovery        |

Typography uses a local and system stack: `Arial Narrow`, `Avenir Next Condensed`, `Inter`, then
sans-serif fallbacks. Display copy is uppercase with wide tracking. Body copy and captions remain
mixed case for readability. Fine rules, clipped corners, open bands, and restrained scrims keep the
interface closer to flight instrumentation than a card dashboard.

The campaign map uses numbered chapter signals with locked, current, available, and cleared states.
Chapter briefings expose location, operation, seven manifest objectives, short narrative
transmissions, and difficulty. Results keep the focus on rank, score, hostiles, accuracy, and the next
signal.

## Chapter picture script

|                   Chapter | Spatial signature                       | Light and color                           | Motion layer                    |
| ------------------------: | --------------------------------------- | ----------------------------------------- | ------------------------------- |
|         01: Ashes of Home | open basin, wreck, telescope dish       | storm blue, wreck orange, cyan glass      | rain and lightning              |
|        02: The Root Vault | compressed gates and fungal aqueduct    | black-green, pale fungus, wet stone       | ash-like spores                 |
|      03: Vespera in Black | vertical rooftop ring and relay towers  | rain cyan, signal coral, blue-black metal | rain and distant storm          |
| 04: The Drowned Cathedral | radial nave, organ pipes, flooded floor | moon blue, tarnished bronze, Veil coral   | rain, embers, reflections       |
|      05: The Silent Orbit | lift cylinder, halos, drifting debris   | hard white rim, cyan systems, deep black  | stars and orbiting fragments    |
|      06: The Memory Forge | broken archive planes and ring engine   | false amber warmth, cold blue fracture    | memory motes and rotating rings |
|      07: Crown of Eidolon | axial trenches and living gate          | bone metal, coral current, violet signal  | ash and conduit pulse           |
|        08: The Root Choir | stepped causeway and neural crown       | violet void, bone light, final amber      | memory motes and rotating crown |

`ChapterScenery.ts` builds one hero-scene function for each row. The functions add physical geometry
and collision volumes to shared arena foundations. `CHAPTER_VISUALS` applies fog, key light, material
tints, energy accents, water color, storm state, and particles. `CHAPTER_LAYOUTS` moves player start,
recovery prop, objectives, boss, extraction, and movement radius so each level has its own route
through the common combat grammar.

## Runtime asset inventory

- `public/assets/title-background.jpg`: generated full-bleed title plate with no baked interface
- `public/assets/storm-city.jpg`: generated distant city and Crown backplate used by selected arenas
- `public/assets/bio-gothic-surface.jpg`: generated alien masonry albedo
- `public/assets/campaign/`: compressed campaign plates used by the Vespera, Memory Forge, and Root
  Choir briefing screens
- `public/assets/pbr/stone_tiles_03/`: Poly Haven CC0 1K stone diffuse, OpenGL normal, and roughness
- `public/assets/hdri/rooftop-night-1k.hdr`: Poly Haven CC0 HDR image-based lighting source
- `public/assets/materials/mark-fur-*`: generated 1K fur albedo, height, and roughness studies
- `public/assets/materials/mark-armor-*`: generated 1K chipped oxide, steel, soot, height, and roughness
  studies for Mark and the Sunlance
- `public/assets/materials/hive-chitin-*`: generated 1K wet chitin albedo, height, and roughness studies
- `ChapterRecovery.ts`: flight recorder, carrot memory, relay key, navigation cell, and Wayfarer core
  geometry mapped to the eight chapters
- `BossVariants.ts`: eight procedural silhouette kits with local materials and live animation hooks,
  attached to the shared Regent behavior rig
- Mark, regular enemies, seals, cover, weapon, ship, particles, HUD icons, and animation are
  procedural Three.js, CSS, or SVG systems
- Music, ambience, and sound effects are synthesized at runtime with Web Audio

## Camera and controls

Both perspectives share an authoritative center-screen aim ray. `V` or gamepad `Y` switches views
without changing the current target. The default field-of-view setting is 68 degrees; third person
applies a 5-degree reduction, first person adds 7 degrees, and focus narrows either view by 10 degrees
within a 48 to 94 degree clamp.

Third person uses an offset camera 5.25 meters behind Mark, or 4.15 meters while focused. First person
places the camera at eye height and swaps to a separate forearm and weapon rig. Keyboard and mouse
and standard-mapped gamepads are first-class. Haptics use controller dual-rumble with
`navigator.vibrate` as a best-effort fallback.

## Audio identity

All chapters use the same Web Audio graph and event vocabulary. Each selects a distinct authored
profile for stillness and combat tempo, meter, drone ratios, choir voicing, motif rests and pitches,
ambience filtering, deterministic noise, percussion accents, and reverb balance. Combat pressure
raises intensity. No licensed or streamed music is loaded.

The Crown's Chapter 7 meter uses an eleven-pulse 3 + 3 + 3 + 2 cycle. The Root Choir motif contains
audible rests as Mark's three-note identity breaks apart. These profiles are runtime data and are
covered by unit tests.

## Accessibility and performance

Settings include separate audio buses, mouse and gamepad sensitivity, gamepad deadzone, field of
view, quality, captions, high-contrast reticle, reduced motion, reduced flashes, camera shake,
haptics, aim assist, and inverted Y.

Reduced Flashes disables storm lightning, replaces rapid light changes with slower lower-amplitude
motion, and reduces additive weapon and impact energy. Threat timing remains unchanged. Important
events combine shape, movement, text, sound, color, and optional haptics.

Quality tiers cap device pixel ratio, particle count, geometry density, shadows, and antialiasing.
The compositor can lower internal resolution and expensive screen-space effects under sustained
frame pressure. Actual frame rate depends on browser, display resolution, GPU, and chapter.

## Scope boundary

The production bibles describe a larger cinematic target with bespoke traversal, companions,
streamed scenes, and expanded bosses. The current release translates that direction into eight
authored browser arenas, three regular enemy archetypes, eight procedural boss silhouettes over one
shared behavior family, chapter recovery props, procedural dialogue presentation, generated and
code-authored art, and local chapter progression. Concept targets are labeled as concepts, runtime
captures are labeled as gameplay, and frozen progressive rendering is kept distinct from moving
combat.
