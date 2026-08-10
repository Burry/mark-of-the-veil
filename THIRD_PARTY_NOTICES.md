# Third-party notices

The runtime uses the following open-source packages:

- **React** and **React DOM**: MIT License, Meta Platforms, Inc. and affiliates.
- **Three.js**: MIT License, three.js authors.
- **three-gpu-pathtracer**: MIT License, Garrett Johnson and contributors. Lazy-loaded for
  progressive path-traced presentation frames.
- **three-mesh-bvh**: MIT License, Garrett Johnson and contributors. BVH acceleration for the path
  tracer.
- **xatlas-web**: MIT License, Juan Linietsky, Thekla, Inc., and contributors. Peer support for
  path-tracing scene preparation.

Development and verification use Vite, TypeScript, ESLint, Prettier, Vitest, and Playwright under
their respective open-source licenses. Exact versions and transitive packages are recorded in
`package-lock.json`.

No third-party fonts, stock music, stock sound effects, or character models are bundled. The user's
inspiration images are not included in the repository or distribution. Locally bundled environment
and material assets are itemized below. Poly Haven publishes these assets under the
[CC0 1.0 Universal license](https://polyhaven.com/license):

- **Stone Tiles 03** by eye-candy.xyz: 1K diffuse, OpenGL normal, and roughness maps used for the
  flooded cathedral floor and weathered stonework. Source:
  [polyhaven.com/a/stone_tiles_03](https://polyhaven.com/a/stone_tiles_03). Runtime files are under
  `public/assets/pbr/stone_tiles_03/`.
- **Rooftop Night** by Greg Zaal: 1K Radiance HDR environment used for physically based reflections
  and image-based lighting. Source:
  [polyhaven.com/a/rooftop_night](https://polyhaven.com/a/rooftop_night). Runtime file:
  `public/assets/hdri/rooftop-night-1k.hdr`.

Several project-specific image plates and PBR maps were generated with image tools during
development, then processed for runtime use. This includes `bio-gothic-surface.jpg` and the 1K fur,
tactical-armor, and hive-chitin map sets under `public/assets/materials/`. The original inspiration
image is not included or embedded in any runtime asset.
