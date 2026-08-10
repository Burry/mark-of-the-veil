import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEnemyRig, createMark } from '../../src/game/render/ActorFactory';

interface RenderStats {
  drawCalls: number;
  meshes: number;
  triangles: number;
  visibleInstances: number;
}

beforeEach(() => {
  vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(() => new THREE.Texture());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('character render budgets', () => {
  it('keeps hero and enemy detail inside browser-scale draw and triangle budgets', () => {
    const stats = {
      mark: collectStats(createMark().root),
      chainling: collectStats(createEnemyRig('chainling').root),
      needlewing: collectStats(createEnemyRig('needlewing').root),
      heavy: collectStats(createEnemyRig('heavy').root),
      regent: collectStats(createEnemyRig('regent').root),
    };
    const representativeWave = combineStats([
      stats.mark,
      ...Array.from({ length: 4 }, () => stats.chainling),
      ...Array.from({ length: 2 }, () => stats.needlewing),
      stats.heavy,
    ]);

    // Intentionally logged: these budgets are part of visual-performance QA evidence.
    console.info(`character-render-budgets ${JSON.stringify({ ...stats, representativeWave })}`);

    expect(stats.mark.drawCalls).toBeLessThanOrEqual(90);
    expect(stats.mark.triangles).toBeLessThanOrEqual(80_000);
    expect(stats.mark.visibleInstances).toBeGreaterThanOrEqual(600);
    expect(stats.chainling.drawCalls).toBeLessThanOrEqual(70);
    expect(stats.needlewing.drawCalls).toBeLessThanOrEqual(70);
    expect(stats.heavy.drawCalls).toBeLessThanOrEqual(100);
    expect(stats.regent.drawCalls).toBeLessThanOrEqual(100);
    expect(stats.regent.triangles).toBeLessThanOrEqual(140_000);
    expect(representativeWave.drawCalls).toBeLessThanOrEqual(650);
    expect(representativeWave.triangles).toBeLessThanOrEqual(220_000);
  });
});

function collectStats(root: THREE.Object3D): RenderStats {
  const stats: RenderStats = { drawCalls: 0, meshes: 0, triangles: 0, visibleInstances: 0 };
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    stats.meshes += 1;
    stats.drawCalls += Array.isArray(object.material) ? object.material.length : 1;
    const instances = object instanceof THREE.InstancedMesh ? object.count : 1;
    stats.visibleInstances += instances;
    const primitives = object.geometry.index
      ? object.geometry.index.count / 3
      : object.geometry.attributes.position.count / 3;
    stats.triangles += Math.round(primitives * instances);
  });
  return stats;
}

function combineStats(entries: RenderStats[]): RenderStats {
  return entries.reduce<RenderStats>(
    (combined, entry) => ({
      drawCalls: combined.drawCalls + entry.drawCalls,
      meshes: combined.meshes + entry.meshes,
      triangles: combined.triangles + entry.triangles,
      visibleInstances: combined.visibleInstances + entry.visibleInstances,
    }),
    { drawCalls: 0, meshes: 0, triangles: 0, visibleInstances: 0 },
  );
}
