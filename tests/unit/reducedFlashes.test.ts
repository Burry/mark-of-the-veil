import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  animateArena,
  applyArenaCinematicLook,
  applyArenaFlashProfile,
  type ArenaRig,
} from '../../src/game/render/Arena';
import { EffectsDirector } from '../../src/game/render/EffectsDirector';
import type { ExtractionRig, SealRig } from '../../src/game/render/ActorFactory';
import { CHAPTER_VISUALS } from '../../src/game/render/ChapterScenery';

function createParticleField(y: number): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, y, 0]), 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial());
}

function createArenaRig(): ArenaRig {
  const sealLight = new THREE.PointLight(0xffffff, 10);
  sealLight.userData.baseIntensity = 10;
  const sealRing = new THREE.Mesh();
  const seal: SealRig = {
    root: new THREE.Group(),
    core: new THREE.Mesh(),
    rings: [sealRing],
    beam: new THREE.Mesh(),
    light: sealLight,
  };
  const extraction: ExtractionRig = {
    root: new THREE.Group(),
    beam: new THREE.Mesh(),
    ship: new THREE.Group(),
    light: new THREE.PointLight(),
  };
  const practical = new THREE.PointLight(0xffffff, 20);
  practical.userData.authoredIntensity = 20;
  practical.userData.baseIntensity = 20;

  const orbit = new THREE.Group();
  orbit.userData.orbitSpeed = 1;
  const memoryRing = new THREE.Group();
  memoryRing.userData.memoryRing = 0;
  const memoryShard = new THREE.Group();
  memoryShard.userData.memoryShard = 0;
  const choirCrown = new THREE.Group();
  choirCrown.userData.choirCrown = true;

  return {
    root: new THREE.Group(),
    chapterId: 'the-drowned-cathedral',
    profile: CHAPTER_VISUALS['the-drowned-cathedral'],
    playerStart: new THREE.Vector3(0, 0, 16.5),
    bossPosition: new THREE.Vector3(0, 0, -1),
    playRadius: 39.5,
    animatedScenery: [orbit, memoryRing, memoryShard, choirCrown],
    seals: [seal],
    recovery: new THREE.Group(),
    extraction,
    obstacles: [],
    rain: createParticleField(10),
    embers: createParticleField(1),
    lightning: new THREE.DirectionalLight(),
    practicalLights: [practical],
    surfaceTextures: [],
    removeRenderDiagnostics: () => undefined,
  };
}

function findPoints(director: EffectsDirector): THREE.Points {
  const points = director.root.children.find((child) => child instanceof THREE.Points);
  if (!(points instanceof THREE.Points)) throw new Error('Effects particle pool was not created.');
  return points;
}

function findVisibleMesh<T extends THREE.BufferGeometry>(
  director: EffectsDirector,
  geometryType: new (...args: never[]) => T,
): THREE.Mesh<T, THREE.MeshBasicMaterial> {
  const mesh = director.root.children.find(
    (child) =>
      child instanceof THREE.Mesh && child.visible && child.geometry instanceof geometryType,
  );
  if (!(mesh instanceof THREE.Mesh) || !(mesh.material instanceof THREE.MeshBasicMaterial)) {
    throw new Error('Expected pooled effect mesh was not activated.');
  }
  return mesh as THREE.Mesh<T, THREE.MeshBasicMaterial>;
}

describe('rendering accessibility profiles', () => {
  it('removes lightning and replaces rapid arena flutter with low-amplitude ambience', () => {
    const normalArena = createArenaRig();
    animateArena(normalArena, 11, 0, false);
    expect(normalArena.lightning.intensity).toBe(4.2);

    applyArenaFlashProfile(normalArena, 11, true);
    expect(normalArena.lightning.intensity).toBe(0);
    expect(normalArena.seals[0]?.light.intensity).toBeGreaterThanOrEqual(9.25);
    expect(normalArena.seals[0]?.light.intensity).toBeLessThanOrEqual(9.55);
    expect(normalArena.extraction.light.intensity).toBeGreaterThanOrEqual(23.25);
    expect(normalArena.extraction.light.intensity).toBeLessThanOrEqual(24.75);
    expect(normalArena.practicalLights[0]?.intensity).toBeGreaterThanOrEqual(18.5);
    expect(normalArena.practicalLights[0]?.intensity).toBeLessThanOrEqual(19.1);
  });

  it('softens active additive effects immediately when enabled during play', () => {
    const director = new EffectsDirector(new THREE.Scene(), 'high');
    const origin = new THREE.Vector3(0, 1, 0);
    director.tracer(origin, new THREE.Vector3(0, 1, -4));
    director.pulse(origin, 8);

    const particles = findPoints(director);
    const particleMaterial = particles.material;
    const tracer = findVisibleMesh(director, THREE.CylinderGeometry);
    const ring = findVisibleMesh(director, THREE.RingGeometry);
    expect(particleMaterial).toBeInstanceOf(THREE.PointsMaterial);
    expect((particleMaterial as THREE.PointsMaterial).blending).toBe(THREE.AdditiveBlending);
    expect(tracer.material.opacity).toBe(0.94);
    expect(ring.material.opacity).toBe(0.92);

    director.setReducedFlashes(true);

    expect((particleMaterial as THREE.PointsMaterial).blending).toBe(THREE.NormalBlending);
    expect((particleMaterial as THREE.PointsMaterial).opacity).toBe(0.28);
    expect(tracer.material.blending).toBe(THREE.NormalBlending);
    expect(tracer.material.opacity).toBe(0.26);
    expect(ring.material.blending).toBe(THREE.NormalBlending);
    expect(ring.material.opacity).toBe(0.2);
    director.dispose();
  });

  it('restores authored practical-light energy after live accessibility toggles', () => {
    const arena = createArenaRig();
    const vein = new THREE.MeshStandardMaterial({ emissiveIntensity: 1 });
    arena.root.userData.veinMaterial = vein;

    applyArenaCinematicLook(arena, false);
    const standardIntensity = arena.practicalLights[0]?.intensity ?? 0;
    const standardEmission = vein.emissiveIntensity;
    applyArenaCinematicLook(arena, true);
    const reducedIntensity = arena.practicalLights[0]?.intensity ?? 0;
    const reducedEmission = vein.emissiveIntensity;
    applyArenaCinematicLook(arena, false);

    expect(reducedIntensity).toBeLessThan(standardIntensity);
    expect(reducedEmission).toBeLessThan(standardEmission);
    expect(arena.practicalLights[0]?.intensity).toBeCloseTo(standardIntensity, 8);
    expect(arena.practicalLights[0]?.userData.baseIntensity).toBeCloseTo(standardIntensity, 8);
    expect(vein.emissiveIntensity).toBeCloseTo(standardEmission, 8);
    vein.dispose();
  });

  it('emits fewer particles while preserving impact direction and timing', () => {
    const normal = new EffectsDirector(new THREE.Scene(), 'high');
    const reduced = new EffectsDirector(new THREE.Scene(), 'high', true);
    const position = new THREE.Vector3(3, 2, -1);
    normal.burst(position, 0xffffff, 20);
    reduced.burst(position, 0xffffff, 20);

    const activeParticleCount = (director: EffectsDirector): number => {
      const positions = findPoints(director).geometry.getAttribute('position');
      let active = 0;
      for (let index = 0; index < positions.count; index += 1) {
        if (positions.getY(index) > -999) active += 1;
      }
      return active;
    };

    expect(activeParticleCount(normal)).toBe(20);
    expect(activeParticleCount(reduced)).toBe(9);
    normal.dispose();
    reduced.dispose();
  });

  it('substantially reduces ambient world motion without changing gameplay time', () => {
    const normal = createArenaRig();
    const reduced = createArenaRig();
    const time = 7;
    const delta = 0.1;

    animateArena(normal, time, delta, false, false);
    animateArena(reduced, time, delta, false, true);

    const normalRainTravel = 10 - normal.rain.geometry.getAttribute('position').getY(0);
    const reducedRainTravel = 10 - reduced.rain.geometry.getAttribute('position').getY(0);
    expect(reducedRainTravel).toBeLessThan(normalRainTravel * 0.1);
    expect(reduced.seals[0]?.core.rotation.y).toBeLessThan(
      (normal.seals[0]?.core.rotation.y ?? 0) * 0.1,
    );
    expect(reduced.animatedScenery[0]?.rotation.y).toBeLessThan(
      (normal.animatedScenery[0]?.rotation.y ?? 0) * 0.1,
    );
    expect(Math.abs(reduced.recovery.position.y - 0.08)).toBeLessThan(
      Math.abs(normal.recovery.position.y - 0.08) * 0.2,
    );
    expect(Math.abs(reduced.extraction.ship.position.y - 17)).toBeLessThan(
      Math.abs(normal.extraction.ship.position.y - 17) * 0.2,
    );
    expect(Math.abs((reduced.animatedScenery[3]?.scale.x ?? 1) - 1)).toBeLessThan(
      Math.abs((normal.animatedScenery[3]?.scale.x ?? 1) - 1) * 0.2,
    );

    // Reduced Motion changes only presentation. Flash safety remains an independent setting.
    expect(reduced.lightning.intensity).toBe(normal.lightning.intensity);
  });
});
