import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { applyBossVariant } from '../../src/game/render/BossVariants';
import { CHAPTER_VISUALS, type ChapterEnvironmentId } from '../../src/game/render/ChapterScenery';

const CHAPTERS: ChapterEnvironmentId[] = [
  'ashes-of-home',
  'the-root-vault',
  'vespera-in-black',
  'the-drowned-cathedral',
  'the-silent-orbit',
  'the-memory-forge',
  'crown-of-eidolon',
  'the-root-choir',
];

interface VariantStats {
  drawCalls: number;
  hooks: number;
  meshes: number;
  triangles: number;
  size: THREE.Vector3;
}

describe('campaign boss variants', () => {
  it('builds one named, animation-ready silhouette for every campaign chapter', () => {
    const silhouettes = new Set<string>();
    const shapeSignatures = new Set<string>();

    CHAPTERS.forEach((chapterId) => {
      const root = new THREE.Group();
      const accentColor = CHAPTER_VISUALS[chapterId].accentColor;
      applyBossVariant(root, chapterId, accentColor);

      const variant = root.getObjectByName(`BossVariant-${chapterId}`);
      expect(variant).toBeInstanceOf(THREE.Group);
      expect(variant?.userData.chapterId).toBe(chapterId);
      expect(variant?.userData.accentColor).toBe(accentColor);
      expect(variant?.userData.bossVariant).toBe(true);
      expect(typeof variant?.userData.silhouette).toBe('string');
      silhouettes.add(variant?.userData.silhouette as string);

      const stats = collectStats(variant as THREE.Group);
      expect(stats.hooks).toBeGreaterThanOrEqual(2);
      expect(stats.meshes).toBeGreaterThanOrEqual(4);
      expect(stats.size.x).toBeGreaterThan(2.5);
      expect(stats.size.y).toBeGreaterThan(2);

      const rootHooks = root.userData.bossVariantAnimationHooks as string[];
      expect(rootHooks).toHaveLength(stats.hooks);
      expect(new Set(rootHooks).size).toBe(stats.hooks);
      shapeSignatures.add(
        [stats.meshes, stats.hooks, stats.size.x, stats.size.y, stats.size.z]
          .map((value) => (typeof value === 'number' ? value.toFixed(1) : value))
          .join(':'),
      );
    });

    expect(silhouettes.size).toBe(CHAPTERS.length);
    expect(shapeSignatures.size).toBe(CHAPTERS.length);
  });

  it('keeps procedural attachments inside a browser-scale render budget', () => {
    CHAPTERS.forEach((chapterId) => {
      const root = new THREE.Group();
      applyBossVariant(root, chapterId, CHAPTER_VISUALS[chapterId].accentColor);
      const variant = root.getObjectByName(`BossVariant-${chapterId}`) as THREE.Group;
      const stats = collectStats(variant);

      expect(stats.drawCalls, `${chapterId} draw calls`).toBeLessThanOrEqual(20);
      expect(stats.meshes, `${chapterId} meshes`).toBeLessThanOrEqual(20);
      expect(stats.triangles, `${chapterId} triangles`).toBeLessThanOrEqual(36_000);
    });
  });

  it('uses local materials, no texture assets, and consistent shadow metadata', () => {
    const firstRoot = new THREE.Group();
    const secondRoot = new THREE.Group();
    const chapterId: ChapterEnvironmentId = 'the-silent-orbit';
    const accentColor = CHAPTER_VISUALS[chapterId].accentColor;
    applyBossVariant(firstRoot, chapterId, accentColor);
    applyBossVariant(secondRoot, chapterId, accentColor);

    const firstMaterials = collectMaterials(firstRoot);
    const secondMaterials = collectMaterials(secondRoot);
    expect(firstMaterials.size).toBeGreaterThanOrEqual(3);
    expect(secondMaterials.size).toBe(firstMaterials.size);
    firstMaterials.forEach((material) => {
      expect(secondMaterials.has(material)).toBe(false);
      expect(material.userData.bossVariantMaterial).toBe(true);
      expect(material.userData.chapterId).toBe(chapterId);
      const textureValues = Object.values(material).filter(
        (value) => value instanceof THREE.Texture,
      );
      expect(textureValues).toHaveLength(0);
    });

    let attachmentCount = 0;
    firstRoot.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      attachmentCount += 1;
      expect(object.name.length).toBeGreaterThan(0);
      expect(object.userData.bossVariantAttachment).toBe(true);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const opaque = materials.every((material) => !material.transparent);
      if (opaque) {
        expect(object.castShadow).toBe(true);
        expect(object.receiveShadow).toBe(true);
      }
    });
    expect(attachmentCount).toBeGreaterThan(0);
  });

  it('replaces and disposes an existing kit instead of stacking variants', () => {
    const root = new THREE.Group();
    applyBossVariant(root, 'ashes-of-home', CHAPTER_VISUALS['ashes-of-home'].accentColor);
    const firstVariant = root.children.find((child) => child.userData.bossVariant === true);
    const firstMesh = firstVariant?.getObjectByProperty('type', 'Mesh') as THREE.Mesh;
    const disposeGeometry = vi.spyOn(firstMesh.geometry, 'dispose');
    const material = Array.isArray(firstMesh.material) ? firstMesh.material[0] : firstMesh.material;
    const disposeMaterial = vi.spyOn(material, 'dispose');

    applyBossVariant(root, 'the-memory-forge', CHAPTER_VISUALS['the-memory-forge'].accentColor);

    expect(root.children.filter((child) => child.userData.bossVariant === true)).toHaveLength(1);
    expect(root.getObjectByName('BossVariant-ashes-of-home')).toBeUndefined();
    expect(root.getObjectByName('BossVariant-the-memory-forge')).toBeDefined();
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
  });
});

function collectStats(root: THREE.Group): VariantStats {
  const stats: VariantStats = {
    drawCalls: 0,
    hooks: 0,
    meshes: 0,
    triangles: 0,
    size: new THREE.Vector3(),
  };
  root.updateMatrixWorld(true);
  new THREE.Box3().setFromObject(root).getSize(stats.size);
  root.traverse((object) => {
    if (object.userData.bossVariantHook === true) {
      stats.hooks += 1;
      expect(object.name).toMatch(/^BossHook-/);
      expect(typeof object.userData.motion).toBe('string');
      expect(object.userData.speed).toBeGreaterThan(0);
      expect(object.userData.amplitude).toBeGreaterThan(0);
      expect(object.userData.basePosition).toHaveLength(3);
      expect(object.userData.baseRotation).toHaveLength(3);
    }
    if (!(object instanceof THREE.Mesh)) return;
    stats.meshes += 1;
    stats.drawCalls += Array.isArray(object.material) ? object.material.length : 1;
    const instances = object instanceof THREE.InstancedMesh ? object.count : 1;
    const primitives = object.geometry.index
      ? object.geometry.index.count / 3
      : object.geometry.attributes.position.count / 3;
    stats.triangles += Math.round(primitives * instances);
  });
  return stats;
}

function collectMaterials(root: THREE.Group): Set<THREE.Material> {
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    meshMaterials.forEach((material) => materials.add(material));
  });
  return materials;
}
