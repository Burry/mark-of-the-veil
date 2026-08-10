# Architecture

## Runtime boundary

React owns low-frequency product state: title/briefing, menus, settings, HUD snapshots, upgrade
choice, and results. `GameRuntime` owns the Three.js scene, the clamped simulation loop, input sampling,
AI, combat, cameras, particles, audio events, and disposal. React never receives per-object
transforms or per-frame particle state.

`GameHost` is the lifecycle seam. It lazy-loads the engine only after **Begin Descent**, passes an
HTML canvas and immutable startup options, and translates runtime callbacks into the external
`gameStore`. The UI subscribes with `useSyncExternalStore`.

```text
React UI ──commands──> GameHost ──lifecycle──> GameRuntime / Three.js
    ^                       ^                       │
    └──── HUD snapshot ─────┴──── callbacks ───────┘
```

This keeps the title payload small, makes repeated starts idempotent, and lets the engine release
GPU, audio, input, and animation-loop resources in one place.

## Simulation

Gameplay uses a clamped variable timestep and keeps the authoritative player pose independent of
the camera. First- and third-person rigs consume the same pose and center-screen aim ray. The third-
person camera uses a spring offset and world ray tests to avoid geometry; the first-person rig
hides Mark's world mesh and presents an isolated arm/weapon rig.

Mission progression is a finite-state machine:

```text
carrot escape → seal 1 wave → seal 2 wave → seal 3 wave
             → relic choice → Hollow Regent → Root Choir infiltration
             → five-beat Revelation → ranked integration results
```

Enemies share a small actor contract but have distinct steering and telegraphs. Projectiles and
VFX are pooled or capped; no gameplay system depends on React rendering.

## Input

Keyboard, mouse, and standard-mapped gamepads feed a canonical action frame. Mouse deltas are
accumulated between ticks. Each gamepad axis uses a signed deadzone and normalized response curve.
The last meaningful input device controls prompt glyphs; stick drift cannot repeatedly switch the
UI. Pointer lock is requested only from an explicit user action and loss of focus/pointer lock
pauses safely.

## Audio and feedback

One user-gesture-created `AudioContext` feeds music, ambience, SFX, and UI buses into a master
compressor. Procedural oscillators, deterministic noise buffers, spatial panners, and a small
adaptive sequencer provide all sound and music. Semantic haptic events are rate-limited and
capability-gated; gameplay never relies on vibration.

## Rendering and budgets

- WebGL 2 gameplay through `THREE.WebGLRenderer` and an HDR composer with SSR, GTAO, soft shadows,
  bloom, antialiasing, AgX/ACES display output, and cinematic grading.
- Frozen high-quality scenes can lazy-load a worker-built trace LOD for genuine four-bounce GPU
  path tracing. Software renderers and automation sessions stay on the raster compositor without
  attempting BVH construction.
- One shadow-casting key light; emissive practicals and local rim lights do not cast shadows.
- DPR is capped by quality tier. The first pressure level disables SSR, trims forward lights and
  bloom, and renders at 84% while retaining GTAO/SMAA. The emergency level disables GTAO, switches
  to FXAA, trims again, and renders at 76%; low quality also reduces scene detail and particles.
- Runtime art is approximately 9.3 MB, including compact 1K PBR character/environment maps and an
  HDR reflection source. Three.js and the gameplay renderer remain lazy-loaded after Start.
- Repeated fasteners, teeth, cartridges, fur clumps, arena props, and enemy details are instanced or
  merged by material within stable animation groups. Character budget tests cap Mark at 80 actor
  submissions and a representative mixed wave at 650 while retaining authored silhouettes.
- Restart reuses the initialized renderer and shared character atlases while resetting all run
  state. Title navigation or runtime replacement disposes scene-owned GPU resources, DOM listeners,
  timers, audio nodes, and animation loops; cached character atlases live for the page lifetime.

## Persistence and failure modes

Settings and best-run data are versioned in `localStorage` and fail open when storage is blocked.
Unsupported WebGL devices receive a real fallback screen. Tab hiding, blur, and context problems
pause the simulation, preventing invisible damage and runaway audio.

## Verification strategy

- Vitest covers pure state, storage fallbacks, input transforms, ranking, and feedback routing.
- Browser smoke tests cover title → start → rendered canvas → perspective toggle → pause/resume.
- Browser smoke tests run against the production preview.
- Visual QA compares the accepted gameplay/menu concepts with native 1672×941 screenshots, a
  hardware-path acceptance pass, and mobile portrait/landscape safety checks.
