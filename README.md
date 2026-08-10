# Mark of the Veil

**Mark of the Veil** is a complete, cinematic browser action game starring Mark, a grizzled
purple-unicorn starfighter pilot fighting his way out of a living alien city.

It is built with React, TypeScript, Three.js, Web Audio, the Gamepad API, and optional haptics. No
server, account, external asset CDN, or runtime API key is required.

High-quality gameplay uses an HDR hybrid renderer with screen-space ray-marched reflections, GTAO,
soft shadows, bloom, and cinematic color management. On hardware GPUs, a frozen high-quality scene
can lazy-load a worker-backed four-bounce GPU path tracer while retaining the raster image as a
fallback. Moving combat is never presented as hardware ray tracing. See
[`docs/RENDERING.md`](./docs/RENDERING.md) for the exact capability ladder, adaptive-quality rules,
software fallback, and ray-tracing boundary.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL, choose **Begin Descent**, and click the play surface when prompted to capture
the mouse.

## Controls

| Action             | Keyboard / mouse   | Gamepad                  |
| ------------------ | ------------------ | ------------------------ |
| Move / look        | WASD / mouse       | Left stick / right stick |
| Fire / focus       | Left / right mouse | RT / LT                  |
| Dash               | Space              | A / Cross                |
| Horn pulse         | Q                  | LB                       |
| Reload             | R                  | X / Square               |
| Interact           | E                  | X / Square               |
| Switch perspective | V                  | Y / Triangle             |
| Pause              | Escape             | Menu / Start             |

## Quality gates

```bash
npm run check
npm run test:e2e
```

## Deploy to Vercel

Import this repository in Vercel. The included `vercel.json` uses `npm run build` and serves the
static `dist/` output. No environment variables are required.

## Art and audio provenance

The user's reference images are not shipped. The title and skyline plates, character material maps,
alien surface maps, 3D geometry, VFX, music, and sound effects were authored specifically for this
project. The flooded stone and HDR environment source are compact CC0 assets from Poly Haven. See
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) and [`docs/DESIGN.md`](./docs/DESIGN.md) for the
complete inventory and provenance.

<details>
<summary>Narrative ending — spoiler</summary>

After defeating the Hollow Regent, Mark infiltrates the Root Choir and receives the alien
hive-mind's total knowledge. He searches that knowledge for his origin, discovers that unicorns
were never real, and loses the boundary between himself and everything known. Mark ceases to exist;
the Choir remembers the impossible unicorn who entered it.

</details>
