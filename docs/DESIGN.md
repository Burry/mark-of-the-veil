# Mark of the Veil: production design

## Product promise

A complete, replayable 10–15 minute science-fantasy combat mission starring **Mark**, a
battle-worn anthropomorphic purple unicorn, former starfighter pilot, and escapee from the
Eidolon Crown's prison beneath Vespera City.

The authored run is: break free and recover Mark's carrot talisman → activate three seals in a
flooded cathedral-city arena → choose one relic upgrade → defeat the Hollow Regent → infiltrate the
alien Root Choir → receive total knowledge, lose the fiction of being a unicorn, cease to exist →
receive a score and rank.

## Generated visual targets

- [`concepts/gameplay-spec.jpg`](./concepts/gameplay-spec.jpg): primary play-surface, camera,
  enemy language, palette, material, VFX, and HUD specification.
- [`concepts/menu-spec.jpg`](./concepts/menu-spec.jpg): title, menu, focus state, and settings
  specification.

These images were generated during development as visual targets. They are not gameplay screenshots
and are separate from the original concept image supplied by a friend.

The supplied source art is inspiration only and is intentionally excluded from this repository.
Shipped art consists of project-specific generated imagery, code-authored geometry, procedural
audio and VFX, and the compact CC0 photoscan and HDR assets itemized in
`THIRD_PARTY_NOTICES.md`.

## Design system

| Token        | Value     | Role                                  |
| ------------ | --------- | ------------------------------------- |
| Void         | `#05070c` | Background and ink panels             |
| Basalt       | `#10151b` | Environment surfaces                  |
| Bone         | `#e7d7b0` | Primary UI text and engraved rules    |
| Ash          | `#9a9ba0` | Secondary UI text                     |
| Ember        | `#ff673f` | Hostile energy and selected controls  |
| Ward         | `#76c9f4` | Player shield                         |
| Resolve      | `#f0ede4` | Player health                         |
| Mark energy  | `#9a78ff` | Horn abilities and player projectiles |
| Carrot amber | `#f3a24f` | Objective/recovery affordances        |

Typography is a local/system stack: `Arial Narrow`, `Avenir Next Condensed`, `Inter`, and
sans-serif fallbacks. Display copy is uppercase with broad tracking; body and captions remain
mixed case for readability. UI geometry uses fine clipped-corner rules and open bands, never
rounded card grids.

## Runtime asset inventory

- `public/assets/title-background.jpg`: generated full-bleed title plate, no baked UI.
- `public/assets/storm-city.jpg`: generated distant city/Crown backplate for the arena.
- `public/assets/bio-gothic-surface.jpg`: generated alien masonry albedo; it does not embed
  the user's inspiration art.
- `public/assets/pbr/stone_tiles_03/`: Poly Haven CC0 1K photoscan diffuse, OpenGL normal, and
  roughness maps for the flooded nave.
- `public/assets/hdri/rooftop-night-1k.hdr`: Poly Haven CC0 HDR image-based lighting source.
- `public/assets/materials/mark-fur-*`: generated 1K albedo, height, and roughness maps based on a
  cross-polarized fur material study; the v2 albedo is contrast-graded for the
  runtime's HDR lighting response.
- `public/assets/materials/mark-armor-*`: generated 1K albedo, height, and roughness maps for
  chipped black oxide, scratched blued steel, soot, and restrained oxidation on Mark's tactical
  harness and Sunlance.
- `public/assets/materials/hive-chitin-*`: generated 1K albedo, height, and roughness maps for
  wet biomechanical chitin, ribbed plates, tissue seams, mineral pitting, and iridescent wear.
- Mark, enemies, seals, cover, weapon, ship, particles, HUD icons, and animation are authored as
  procedural Three.js/CSS/SVG systems so they work from every camera angle.
- Music and sound effects are synthesized at runtime with Web Audio and require no licensed media.

## Camera and controls

Both views share an authoritative center-screen aim ray. `V` / gamepad `Y` switches between a
62-degree shoulder camera and a 76-degree first-person camera without changing the target.
Keyboard/mouse and standard-mapped gamepads are first-class. Haptics use controller dual-rumble,
with `navigator.vibrate` as a best-effort fallback.

## Accessibility and performance

Settings include separate volume buses, sensitivity, FOV, quality, captions, high-contrast
reticle, reduced motion, reduced flashes, camera shake, and haptics. Important threats combine
shape, color, animation, caption, sound, and optional haptic cues.

Reduced flashes is applied live at the event sources: storm lightning is disabled, rapid light
flutter is replaced by slow low-amplitude ambience, and additive weapon, impact, and pulse effects
use lower opacity, normal blending, and fewer particles. Gameplay timing and threat readability are
unchanged.

Quality tiers cap device pixel ratio and particle density. The production target is 60 FPS on a
modern desktop at medium quality and a usable 30 FPS low tier. Renderer effects update live. Arena
density and particle-pool changes apply when the next mission starts.
