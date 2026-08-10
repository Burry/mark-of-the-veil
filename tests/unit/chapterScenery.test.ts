import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  CHAPTER_ENVIRONMENT_SIGNATURES,
  CHAPTER_LAYOUTS,
  CHAPTER_VISUALS,
  createChapterScenery,
  type ChapterEnvironmentId,
} from '../../src/game/render/ChapterScenery';
import type { ArenaMaterialLibrary } from '../../src/game/render/ArenaMaterials';
import {
  batchStaticArenaGeometry,
  createBioGothicArchitecture,
  STATIC_ARENA_BATCH_CELL_SIZE,
} from '../../src/game/render/BioGothicArchitecture';
import { SeededRandom } from '../../src/game/utils/SeededRandom';

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

describe('campaign chapter worlds', () => {
  it('provides one complete visual profile and layout for every chapter', () => {
    expect(Object.keys(CHAPTER_VISUALS)).toEqual(CHAPTERS);
    expect(Object.keys(CHAPTER_LAYOUTS)).toEqual(CHAPTERS);

    CHAPTERS.forEach((chapterId) => {
      expect(CHAPTER_VISUALS[chapterId].id).toBe(chapterId);
      expect(CHAPTER_LAYOUTS[chapterId].anchors).toHaveLength(3);
    });
  });

  it('keeps every gameplay landmark inside its authored movement boundary', () => {
    CHAPTERS.forEach((chapterId) => {
      const layout = CHAPTER_LAYOUTS[chapterId];
      const positions = [
        layout.start,
        layout.recovery,
        ...layout.anchors,
        layout.boss,
        layout.extraction,
      ];
      positions.forEach(([x, z]) => {
        expect(
          Math.hypot(x, z),
          `${chapterId} landmark at ${x},${z} exceeds the ${layout.playRadius}m play radius`,
        ).toBeLessThanOrEqual(layout.playRadius);
      });
    });
  });

  it('keeps every required interaction within reach outside collision volumes', () => {
    const playerRadius = 0.72;
    CHAPTERS.forEach((chapterId, chapterIndex) => {
      const root = new THREE.Group();
      const materials = materialLibrary();
      const obstacles: Array<{ center: THREE.Vector3; radius: number }> = [];
      const random = new SeededRandom(0x51a7 + chapterIndex);
      if (chapterId === 'the-root-vault' || chapterId === 'the-drowned-cathedral') {
        createBioGothicArchitecture(root, materials, 'low', random, obstacles);
      }
      createChapterScenery(root, materials, 'low', random, obstacles, chapterId);
      const layout = CHAPTER_LAYOUTS[chapterId];
      const interactions = [
        { label: 'recovery', position: layout.recovery, radius: 3.2 },
        ...layout.anchors.map((position, index) => ({
          label: `anchor ${index + 1}`,
          position,
          radius: 4,
        })),
        { label: 'extraction', position: layout.extraction, radius: 4.2 },
      ];

      interactions.forEach(({ label, position: [x, z], radius }) => {
        obstacles.forEach((obstacle) => {
          const centerDistance = Math.hypot(x - obstacle.center.x, z - obstacle.center.z);
          expect(
            centerDistance + radius,
            `${chapterId} ${label} is sealed inside obstacle ${obstacle.center.x},${obstacle.center.z}`,
          ).toBeGreaterThanOrEqual(obstacle.radius + playerRadius);
        });
      });
    });
  });

  it('gives the campaign a deliberate weather and particle arc', () => {
    expect(CHAPTER_VISUALS['ashes-of-home'].storm).toBe(true);
    expect(CHAPTER_VISUALS['the-drowned-cathedral'].particles).toBe('rain');
    expect(CHAPTER_VISUALS['the-silent-orbit'].particles).toBe('stars');
    expect(CHAPTER_VISUALS['the-root-choir'].particles).toBe('memory');
    expect(CHAPTER_VISUALS['the-root-choir'].storm).toBe(false);
  });

  it('authors a named silhouette and material signature for every chapter', () => {
    CHAPTERS.forEach((chapterId, chapterIndex) => {
      const root = new THREE.Group();
      const materials = materialLibrary();
      createChapterScenery(
        root,
        materials,
        'low',
        new SeededRandom(0x71c0 + chapterIndex),
        [],
        chapterId,
      );

      CHAPTER_ENVIRONMENT_SIGNATURES[chapterId].forEach((signature) => {
        expect(
          root.getObjectByName(signature),
          `${chapterId} is missing environment signature ${signature}`,
        ).toBeDefined();
      });
    });
  });

  it('keeps high-detail chapter scenery inside browser-scale geometry budgets', () => {
    const reports = CHAPTERS.map((chapterId, chapterIndex) => {
      const root = new THREE.Group();
      const materials = materialLibrary();
      createChapterScenery(
        root,
        materials,
        'high',
        new SeededRandom(0xc1a0 + chapterIndex),
        [],
        chapterId,
      );
      const authored = renderStats(root);
      batchStaticArenaGeometry(root, materials);
      const batched = renderStats(root);
      const staticBatches: THREE.Mesh[] = [];
      root.traverse((object) => {
        if (object instanceof THREE.Mesh && object.name.startsWith('StaticArchitectureBatch-')) {
          staticBatches.push(object);
        }
      });

      expect(authored.meshes, `${chapterId} authored meshes`).toBeLessThanOrEqual(240);
      expect(authored.triangles, `${chapterId} authored triangles`).toBeLessThanOrEqual(125_000);
      expect(batched.meshes, `${chapterId} batched meshes`).toBeLessThanOrEqual(90);
      expect(batched.meshes, `${chapterId} batching reduction`).toBeLessThanOrEqual(
        Math.ceil(authored.meshes * 0.55),
      );
      expect(batched.triangles, `${chapterId} batching lost visible geometry`).toBe(
        authored.triangles,
      );
      expect(staticBatches.length, `${chapterId} static batches`).toBeGreaterThan(0);
      staticBatches.forEach((batch) => {
        const cell = batch.userData.staticBatchCell as
          { x: number; z: number; size: number } | undefined;
        const bounds = batch.geometry.boundingBox;
        expect(cell?.size, `${chapterId} batch cell metadata`).toBe(STATIC_ARENA_BATCH_CELL_SIZE);
        expect(
          batch.userData.staticBatchSourceCount,
          `${chapterId} batch source count`,
        ).toBeGreaterThanOrEqual(2);
        expect(batch.frustumCulled, `${chapterId} batch frustum culling`).toBe(true);
        expect(bounds, `${chapterId} batch bounds`).not.toBeNull();
        const horizontalSize = bounds?.getSize(new THREE.Vector3());
        expect(
          Math.max(horizontalSize?.x ?? Infinity, horizontalSize?.z ?? Infinity),
          `${chapterId} batch exceeds its local culling envelope`,
        ).toBeLessThanOrEqual(STATIC_ARENA_BATCH_CELL_SIZE * 2.5 + 0.01);
      });
      return { chapterId, authored, batched };
    });

    console.info(`chapter-environment-budgets ${JSON.stringify(reports)}`);
  });
});

function renderStats(root: THREE.Object3D): { meshes: number; triangles: number } {
  let meshes = 0;
  let triangles = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.InstancedMesh)) return;
    meshes += 1;
    const geometry = object.geometry;
    const primitives = geometry.index
      ? geometry.index.count / 3
      : (geometry.getAttribute('position')?.count ?? 0) / 3;
    triangles += primitives * (object instanceof THREE.InstancedMesh ? object.count : 1);
  });
  return { meshes, triangles: Math.round(triangles) };
}

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
