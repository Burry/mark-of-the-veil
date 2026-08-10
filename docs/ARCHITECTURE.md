# Architecture

## System boundary

React owns low-frequency product state: title, campaign map, chapter briefing, loading, HUD
snapshots, pause, settings, relic choice, chapter completion, defeat, and the final revelation.
`GameRuntime` owns the Three.js scene, simulation loop, input sampling, AI, combat, cameras,
particles, audio events, and GPU resources. React never receives per-object transforms or per-frame
particle state.

`GameHost` connects those layers. It loads and validates campaign progress, controls chapter
selection, lazy-loads the engine after deployment, creates one runtime for the selected chapter, and
translates runtime callbacks into the external `gameStore`. The UI subscribes with
`useSyncExternalStore`.

```text
Campaign UI ── commands ──> GameHost ── chapter options ──> GameRuntime
     ^                         │                                │
     │                         ├── localStorage                 ├── Three.js scene
     └──── gameStore patches ──┴──── runtime callbacks ─────────┤
                                                              ├── input and AI
                                                              └── audio and haptics
```

Changing chapters disposes the current runtime before another scene is loaded. Only one chapter
arena, enemy population, render pipeline, and audio graph is active at a time.

## Campaign data

`src/game/campaign/manifest.ts` is the ordered story manifest. It defines eight linked chapters,
seven objectives per chapter, canonical boss identity, narrative copy, level identity, and typed
checkpoint locations. Its 56 objectives cover tutorial, traversal, interaction, elimination,
defense, destruction, survival, escort, investigation, boss, escape, infiltration, and revelation
language.

The manifest is broader than the current simulation. It drives the campaign map, briefings, ordered
unlocks, and completion records. It does not imply that all 13 objective types have bespoke runtime
mechanics.

`ChapterDirector` owns the playable encounter state machine for each arena:

```text
recover chapter prop
  -> travel to anchor 1 -> combat wave 1
  -> travel to anchor 2 -> combat wave 2
  -> travel to anchor 3 -> combat wave 3
  -> relic choice -> named boss -> extraction -> chapter complete
```

Each encounter script supplies unique objective copy, transmissions, three enemy rosters, and
extraction text to that shared structure. Boss ID, name, and subtitle come from the campaign
manifest. When extraction succeeds, `GameHost` advances all seven design-manifest objectives in
order and records the chapter as complete. This atomic boundary keeps narrative progression
consistent with a completed runtime level.

## Campaign persistence

Settings, best-run data, and campaign progress use separate versioned `localStorage` records. Reads
validate data and fail open when storage is blocked or malformed.

Campaign saves record:

- current chapter and phase
- completed chapters and manifest objectives
- selected difficulty
- relic types selected during play

Progress is written when a campaign starts, difficulty changes, a relic is acquired, a chapter is
completed, or the player continues to the next chapter. A reload returns the player to the current
chapter boundary. It does not restore health, ammo, enemies, or position from a run in progress.

`CampaignCheckpointDefinition`, `createCheckpoint`, and `restoreCheckpoint` provide typed,
unit-tested groundwork for finer saves. No checkpoint record is currently written by `GameHost` or
restored by `GameRuntime`, so mid-chapter resume is outside the shipped feature set.

## Chapter worlds

`Arena` supplies shared materials, floor composition, landmarks, environmental lighting, particles,
collision obstacles, and the object slots used by `ChapterDirector`. `ChapterRecovery` builds the
flight recorder, carrot memory, relay key, navigation cell, or Wayfarer core selected for each
chapter. `ChapterScenery` adds one authored layout and hero-scene function per chapter:

| Chapter | Hero scenery                                             | Atmosphere                            |
| ------: | -------------------------------------------------------- | ------------------------------------- |
|      01 | crashed Wayfarer, observatory dish, stormglass shards    | blue storm, rain, orange wreck light  |
|      02 | barred root gates, fungal aqueduct, prison cover         | dense green fog, drifting ash         |
|      03 | vertical rooftop ring, relay neon, skybridge cover       | cyan rain, hostile coral signal       |
|      04 | bio-gothic nave, organ pipes, flooded floor              | moonlit rain, ember and blue accents  |
|      05 | orbital lift, concentric halos, moving debris            | sparse fog, stars, hard white rim     |
|      06 | rotating memory engine, suspended archive shards         | warm false light, memory particles    |
|      07 | paired conduit trenches and Crown gate spines            | red ash, bone metal, violet signal    |
|      08 | stepped memory causeway, neural roots, convergence crown | violet void, memory motes, amber core |

The chapters reuse the movement controller, combat arena contract, enemy actors, materials, and
effects. They are separate compact arenas, not streamed zones in one continuous world.

## Simulation and combat

Gameplay uses a clamped variable timestep. The authoritative player pose is independent of the
camera. First-person and third-person rigs consume the same pose and center-screen aim ray. The
third-person camera eases toward an offset shoulder position; first person hides Mark's world mesh
and presents an isolated arm and weapon rig.

Enemies share a small actor contract with distinct steering and telegraphs for Chainling,
Needlewing, and heavy variants. After movement, every enemy is clamped inside the chapter play radius
and pushed out of authored scenery collision volumes. Chapter bosses retain the Regent behavior set,
then receive one of eight procedural silhouette kits with deterministic animation hooks. Their
canonical name and subtitle come from the campaign manifest. Projectiles and VFX are pooled or
capped. No combat system depends on React rendering.

## Input

Keyboard, mouse, and standard-mapped gamepads feed one canonical action frame. Mouse deltas are
accumulated between ticks. Each gamepad axis uses a signed deadzone and normalized response curve.
The last meaningful input device controls prompt glyphs, so stick drift cannot repeatedly switch the
UI.

Pointer lock is requested only from a player action. Losing focus, visibility, or pointer lock pauses
the run after capture. A lost WebGL context moves to a supported failure screen instead of allowing
the simulation to continue invisibly.

## Audio and feedback

One gesture-authorized `AudioContext` routes music, ambience, SFX, and UI buses through a master
compressor. Every chapter selects a dedicated profile with its own tempo range, meter, harmony,
motif, ambience filter, deterministic noise seed, percussion, and mix targets. Combat intensity
modulates the shared procedural graph. The graph uses no recorded stems.

Spatial panners place combat events in the world. Semantic haptic events are rate-limited and
capability-gated. Gameplay never depends on vibration.

## Rendering and budgets

- Moving gameplay uses `THREE.WebGLRenderer` on WebGL 2 with HDR composition, screen-space
  reflections, GTAO, soft shadows, bloom, antialiasing, and cinematic grading.
- An optional progressive path-tracing presentation can refine supported frozen high-quality
  scenes. It is separate from moving combat and is disabled for software rendering and automation.
- One shadow-casting key light is the normal budget. Emissive materials and selected practical
  lights supply local accents.
- Device pixel ratio is capped by quality tier. Pressure states reduce screen-space effects, forward
  lights, bloom, and internal resolution before dropping core readability features.
- Repeated character and arena details are instanced or merged within stable animation groups.
- Restart resets run state inside the existing renderer. Returning to the map or title disposes
  scene-owned GPU resources, DOM listeners, animation loops, audio nodes, and haptics.

## Verification

- Vitest covers campaign ordering, manifest integrity, progression reducers, storage validation,
  chapter encounter state, recovery props, boss silhouettes and animation, enemy arena constraints,
  visual profiles, audio profiles, input transforms, ranking, and feedback.
- Playwright covers title, campaign map, chapter briefing, loading, rendered WebGL, perspective
  switching, pause, settings, and public metadata against the production build.
- Render budget and scenery tests keep chapter landmarks inside movement bounds and lock one visual
  and audio profile to every campaign chapter.
