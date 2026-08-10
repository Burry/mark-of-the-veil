# Rendering architecture

Mark of the Veil uses two deliberately separate lighting paths. Gameplay uses a stable hybrid
raster pipeline built for a moving scene; frozen high-quality scenes progressively converge with a
genuine multi-bounce GPU path tracer. The distinction is important: screen-space reflections are
ray-marched, but they are not hardware ray tracing.

## Capability findings

The implementation was checked against current primary documentation:

- The official Three.js [WebGPU renderer guide](https://threejs.org/manual/en/webgpurenderer)
  describes WebGPU with a WebGL 2 backend fallback, TSL materials, and a new post-processing stack.
  It also calls the renderer experimental and states that WebGL `EffectComposer` passes and custom
  `ShaderMaterial` effects do not migrate directly.
- The official Three.js [WebGPU SSGI example](https://threejs.org/examples/webgpu_postprocessing_ssgi.html)
  identifies its indirect light as screen-space information, not hardware path tracing.
- Three.js's official [path tracer example](https://threejs.org/examples/webgl_renderer_pathtracer.html)
  points to `three-gpu-pathtracer` for high-fidelity path tracing. This project uses the current
  `WebGLPathTracer` API from that implementation for frozen frames.
- The W3C [WebGPU specification](https://gpuweb.github.io/gpuweb/) standardizes render and compute
  pipelines. Its current feature list does not expose a hardware ray-tracing pipeline or RT-core
  feature, so browser support for native DXR/Vulkan/Metal ray-tracing acceleration cannot be
  assumed.
- The Three.js [color-management guide](https://threejs.org/manual/en/color-management.html)
  requires linear-sRGB work and an `OutputPass` for display conversion when post-processing is
  active. Both HDR and fallback pipelines follow that contract.

This evidence favors a production WebGL2 gameplay renderer today, with the newer WebGPU/TSL route
remaining a future migration rather than an unstable default.

## Runtime tiers

| Tier                     | Player setting and capability            | Lighting and composition                                                                                                                                                                                                                                                                    |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cinematic gameplay       | High + half-float render targets         | HDR linear-sRGB, single-sample scene color with SMAA, screen-space ray-marched reflections, GTAO contact lighting, 2048² PCF shadows, influence-budgeted practical lights, emissive bloom, AgX output, subtle split toning, temporal grain, vignette, and detail-preserving sharpening      |
| Enhanced gameplay        | Medium, or High without HDR targets      | PCF shadows, capability-safe GTAO/bloom/SMAA when HDR targets exist, cinematic grade, and ACES/AgX output as supported; no reflection ray march                                                                                                                                             |
| Essential gameplay       | Low or limited GPU                       | Direct PBR scene, compact grade, ACES output, FXAA, capped pixel density, and no costly AO/reflection passes                                                                                                                                                                                |
| Path-traced presentation | Frozen Cinematic scene on a hardware GPU | Lazy-loaded `WebGLPathTracer`, worker-built BVH acceleration, four light bounces, two transmission bounces, multiple-importance sampling, glossy-firefly filtering, raw HDR environment/light sampling, tiled progressive accumulation, and live raster fallback while compiling/converging |

The path-traced mode starts only after the high-quality scene has remained frozen for 650 ms, such
as Pause, Upgrade, Revelation, Victory, or Defeat. It immediately yields to the hybrid gameplay
pipeline when motion resumes. Rebuilding a BVH and resetting Monte Carlo accumulation every combat
frame would be slower and visibly noisier than the real-time path, so path tracing is never
misrepresented as the moving gameplay renderer.

BVH construction uses `GenerateMeshBVHWorker` and a 45-second production timeout. Before the worker
starts, a reversible compatibility bridge snapshots a bounded trace LOD: the camera-visible scene,
Mark, nearby key enemies, and major cathedral architecture are prioritized within a 450,000-triangle
budget. Screen particles, the far cyclorama, rubble, hanging-chain microdetail, and fake contact
shadows remain in the raster convergence underlay. Instanced foreground details are expanded into
correct world-space proxy meshes for the snapshot. Every visibility and material substitution is
restored immediately after the generator returns its worker promise, rather than remaining in the
live scene while the BVH builds.

## Performance and fallback behavior

- High-quality reflection ray marching runs at half resolution and uses distance attenuation,
  Fresnel weighting, a conservative 18 m range, and a rough blur.
- The forward PBR path evaluates at most seven influential point lights in full Cinematic mode,
  six after the first degradation, and five after the second. Selection is camera-relative and
  hysteretic, so local orange/blue practicals remain stable while distant lights no longer expand
  every material's fragment loop. Frozen path tracing restores the complete authored light rig
  before scene capture.
- HDR composer targets remain single-sampled because SMAA already reconstructs geometry edges.
  This avoids a redundant 4x color/depth allocation and resolve. The second degradation level
  replaces SMAA's multi-pass edge search with one FXAA pass while retaining the composite
  sharpener.
- Bloom remains enabled at every HDR tier, but its intentionally low-frequency buffers run at 72%
  of composer resolution in full Cinematic mode, 60.5% after the first degradation, and 50.4% at
  the second degradation level.
- Sustained frame time above budget disables reflections first and GTAO second. Hysteresis restores
  one feature only after eight seconds of healthy frames, preventing quality oscillation. The first
  degradation keeps GTAO and SMAA, renders scene color at 84% linear resolution, and evaluates the
  denoised AO signal at 52% of that buffer. The second degradation disables GTAO, switches to FXAA,
  and renders the internal compositor at 76% linear resolution while retaining the canvas's CSS
  size.
- All post-processing render targets are explicitly disposed, and the path-tracing dependency is a
  separate lazy chunk. Normal gameplay does not download or initialize its BVH code.
- WebGL2 remains the hard baseline. Missing half-float color support selects the Enhanced tier;
  path-tracing import, shader, or BVH failures are caught and fall back to the raster compositor.
- SwiftShader, llvmpipe, and automation sessions default to the hybrid compositor with an explicit
  `software-gpu-disabled` or `automation-gpu-disabled` reason; CPU-backed path tracing can otherwise
  starve the tab during texture packing. `?forcePathTracing=1` exists for controlled hardware QA,
  while `?diagnostics=1` keeps the complete Cinematic raster path but suppresses frozen tracing.
- Runtime diagnostics are exposed on the canvas through render tier/scale, lighting model,
  adaptation level, AA mode, shadow filter, composer sample count, bloom scale, active/eligible
  point lights, path status/reason/progress/build time, retained and culled trace triangles, path
  samples, FPS, accumulated calls/triangles/points, and GPU geometry/texture/program counts.

## Native performance verification

The rescue pass was measured in the hardware-backed Codex browser on an Apple M4 at a native
1672 × 941 canvas using the unchanged in-game half-second FPS sampler. `?diagnostics=1` disabled
only frozen-frame path tracing so the moving raster path could be compared consistently.

| State                                   | FPS   | Calls | Triangles | Adaptive level / scale |
| --------------------------------------- | ----- | ----: | --------: | ---------------------- |
| Before: opening, High                   | 21    |   293 |   723,720 | 2 / 0.76               |
| After: opening, High with GTAO + SMAA   | 37–38 |   466 | 1,201,346 | 1 / 0.84               |
| After: live five-enemy combat with GTAO | 37    | 1,162 | 1,491,566 | 1 / 0.84               |
| After: emergency raster fallback        | 46    |   283 |   722,738 | 2 / 0.76               |

The optimized High frame remains at the richer first degradation level. Its higher submitted-call
and triangle counts include GTAO's retained scene-normal pass; the old baseline had already disabled
GTAO. The gain therefore comes from reducing fragment-light loops, redundant sampling/resolves,
shadow filtering, and full-screen post-processing bandwidth rather than removing scene geometry or
altering the FPS counter.

## Material and shadow calibration

Every newly discovered material is rendered at high shader precision with dithering. PBR texture
maps receive capability-capped anisotropic filtering, while standard/physical materials receive a
small environment-light calibration. Shadow-casting lights use normal bias to prevent acne and a
calibrated PCF radius for stable penumbrae. This calibration is periodic so enemies spawned after
initial load receive the same treatment without coupling render code to gameplay factories.
