import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { ArenaMaterialLibrary } from '../../src/game/render/ArenaMaterials';
import {
  batchStaticArenaGeometry,
  STATIC_ARENA_BATCH_CELL_SIZE,
} from '../../src/game/render/BioGothicArchitecture';

function materialLibrary(): ArenaMaterialLibrary {
  return {
    floor: new THREE.MeshPhysicalMaterial(),
    floorEdge: new THREE.MeshPhysicalMaterial(),
    bioStone: new THREE.MeshPhysicalMaterial(),
    bioStoneDark: new THREE.MeshPhysicalMaterial(),
    vaultWall: new THREE.MeshPhysicalMaterial(),
    chitin: new THREE.MeshPhysicalMaterial(),
    tarnishedMetal: new THREE.MeshPhysicalMaterial(),
    blackMetal: new THREE.MeshPhysicalMaterial(),
    vein: new THREE.MeshStandardMaterial(),
    blood: new THREE.MeshPhysicalMaterial(),
    water: new THREE.MeshPhysicalMaterial(),
    hostileGlass: new THREE.MeshPhysicalMaterial(),
    soot: new THREE.MeshBasicMaterial(),
    cityTexture: new THREE.Texture(),
    textures: [],
  };
}

describe('static arena batching', () => {
  it('merges static scenery into local culling cells while preserving animated chapter meshes', () => {
    const materials = materialLibrary();
    const root = new THREE.Group();
    const staticA = new THREE.Mesh(new THREE.BoxGeometry(), materials.bioStone);
    const staticB = new THREE.Mesh(new THREE.BoxGeometry(), materials.bioStone);
    const staticFarA = new THREE.Mesh(new THREE.BoxGeometry(), materials.bioStone);
    const staticFarB = new THREE.Mesh(new THREE.BoxGeometry(), materials.bioStone);
    const animated = new THREE.Mesh(new THREE.TorusGeometry(), materials.bioStone);
    animated.userData.memoryRing = 1;
    staticB.position.x = 2;
    staticFarA.position.x = 40;
    staticFarB.position.x = 42;
    root.add(staticA, staticB, staticFarA, staticFarB, animated);

    batchStaticArenaGeometry(root, materials);

    const batches = root.children.filter(
      (child): child is THREE.Mesh =>
        child instanceof THREE.Mesh && child.name.startsWith('StaticArchitectureBatch-'),
    );
    expect(animated.parent).toBe(root);
    expect(batches).toHaveLength(2);
    expect(new Set(batches.map((batch) => batch.userData.staticBatchCell.x))).toEqual(
      new Set([0, 2]),
    );
    batches.forEach((batch) => {
      expect(batch.frustumCulled).toBe(true);
      expect(batch.userData.staticBatchCell.size).toBe(STATIC_ARENA_BATCH_CELL_SIZE);
      expect(batch.userData.staticBatchSourceCount).toBe(2);
      expect(batch.geometry.boundingBox).not.toBeNull();
      expect(batch.geometry.boundingSphere).not.toBeNull();
      const horizontalSize = batch.geometry.boundingBox?.getSize(new THREE.Vector3());
      expect(horizontalSize?.x).toBeLessThan(STATIC_ARENA_BATCH_CELL_SIZE);
      expect(horizontalSize?.z).toBeLessThan(STATIC_ARENA_BATCH_CELL_SIZE);
    });
    expect(staticA.parent).toBeNull();
    expect(staticB.parent).toBeNull();
    expect(staticFarA.parent).toBeNull();
    expect(staticFarB.parent).toBeNull();
  });

  it('leaves chapter-spanning silhouettes standalone so their bounds remain independently culled', () => {
    const materials = materialLibrary();
    const root = new THREE.Group();
    const wideA = new THREE.Mesh(new THREE.BoxGeometry(42, 2, 2), materials.vaultWall);
    const wideB = new THREE.Mesh(new THREE.BoxGeometry(42, 2, 2), materials.vaultWall);
    wideB.position.z = 12;
    root.add(wideA, wideB);

    batchStaticArenaGeometry(root, materials);

    expect(wideA.parent).toBe(root);
    expect(wideB.parent).toBe(root);
    expect(root.children.some((child) => child.name.startsWith('StaticArchitectureBatch-'))).toBe(
      false,
    );
  });
});
