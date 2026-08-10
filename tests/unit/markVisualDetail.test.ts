import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  animateMark,
  createFirstPersonWeapon,
  createMark,
} from '../../src/game/render/ActorFactory';
import { createMarkMaterials } from '../../src/game/render/CharacterMaterials';

beforeEach(() => {
  vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(() => new THREE.Texture());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Mark visual detail stack', () => {
  it('uses distinct mapped, silhouette, organic, and battle-wear material layers', () => {
    const materials = createMarkMaterials();

    expect(materials.fur.map).toBeInstanceOf(THREE.Texture);
    expect(materials.fur.bumpMap).toBeInstanceOf(THREE.Texture);
    expect(materials.fur.roughnessMap).toBeInstanceOf(THREE.Texture);
    expect(materials.fur.sheen).toBeGreaterThanOrEqual(0.6);
    expect(materials.fur.anisotropy).toBeGreaterThan(0);
    expect(materials.fur.userData.markMaterialLayer).toBe('mapped-coat');
    expect(materials.fur.userData.markCoatMicrodetail).toEqual({ strength: 0.14, seed: 1.7 });

    expect(materials.guardFur.map).toBeNull();
    expect(materials.guardFur.sheen).toBeGreaterThanOrEqual(0.5);
    expect(materials.guardFur.roughness).toBeGreaterThan(materials.fur.roughness);
    expect(materials.guardFur.userData.markMaterialLayer).toBe('silhouette-fiber');
    expect(materials.guardFur.userData.markCoatMicrodetail).toBeUndefined();
    expect(materials.maneEdge.userData.markMaterialLayer).toBe('silhouette-fiber');

    expect(materials.skin.bumpMap).toBeInstanceOf(THREE.Texture);
    expect(materials.skin.clearcoat).toBeGreaterThan(0);
    expect(materials.skin.userData.markMaterialLayer).toBe('porous-skin');

    expect(materials.armor.emissiveMap).toBe(materials.armor.map);
    expect(materials.armor.userData.markMaterialLayer).toBe('worn-metal');
    expect(materials.armorEdge.roughness).toBeLessThan(materials.armor.roughness);
    expect(materials.armorWear.userData.markMaterialLayer).toBe('battle-wear');
    expect(materials.hornGroove.roughness).toBeGreaterThan(materials.horn.roughness);
  });

  it('builds guard hairs and identity accents without changing the animation contract', () => {
    const rig = createMark();
    const guardCoatLayers: THREE.InstancedMesh[] = [];

    rig.root.traverse((object) => {
      if (object instanceof THREE.InstancedMesh && object.name.startsWith('Mark guard coat')) {
        guardCoatLayers.push(object);
      }
    });

    expect(guardCoatLayers).toHaveLength(9);
    expect(guardCoatLayers.reduce((count, layer) => count + layer.count, 0)).toBe(516);
    expect(guardCoatLayers.every((layer) => layer.instanceColor !== null)).toBe(true);
    expect(rig.root.getObjectByName('Mark-blindfold')).toBeDefined();
    expect(rig.root.getObjectByName('Mark-armor-abrasion-inlays')).toBeDefined();
    expect(rig.root.getObjectByName('Mark-mane-flyaways')).toBeDefined();
    expect(rig.root.getObjectByName('Mark-tail-flyaways')).toBeDefined();
    expect(rig.mane).toHaveLength(4);

    animateMark(rig, 1, 0, 0, false, true);
    expect(rig.root.visible).toBe(false);
    animateMark(rig, 1, 0.5, 0.1, false, false);
    expect(rig.root.visible).toBe(true);
  });

  it('carries the layered coat into the first-person hands', () => {
    const weapon = createFirstPersonWeapon().root;
    const guardHairCounts: number[] = [];

    weapon.traverse((object) => {
      if (
        object instanceof THREE.InstancedMesh &&
        object.name.startsWith('Mark first-person guard coat')
      ) {
        guardHairCounts.push(object.count);
      }
    });

    expect(guardHairCounts).toEqual([24, 24]);
  });
});
