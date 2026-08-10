import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { disposeObject } from '../../src/game/utils/math';

describe('shared character material lifecycle', () => {
  it('keeps page-lifetime atlases alive while disposing per-actor resources', () => {
    const sharedAtlas = new THREE.Texture();
    sharedAtlas.userData.shared = true;
    const sharedDispose = vi.spyOn(sharedAtlas, 'dispose');

    const firstGeometry = new THREE.BoxGeometry();
    const firstMaterial = new THREE.MeshStandardMaterial({ map: sharedAtlas });
    const firstGeometryDispose = vi.spyOn(firstGeometry, 'dispose');
    const firstMaterialDispose = vi.spyOn(firstMaterial, 'dispose');
    disposeObject(new THREE.Mesh(firstGeometry, firstMaterial));

    expect(firstGeometryDispose).toHaveBeenCalledOnce();
    expect(firstMaterialDispose).toHaveBeenCalledOnce();
    expect(sharedDispose).not.toHaveBeenCalled();

    const recreatedGeometry = new THREE.SphereGeometry();
    const recreatedMaterial = new THREE.MeshPhysicalMaterial({ map: sharedAtlas });
    disposeObject(new THREE.Mesh(recreatedGeometry, recreatedMaterial));

    expect(sharedDispose).not.toHaveBeenCalled();
    expect(recreatedMaterial.map).toBe(sharedAtlas);
  });

  it('still releases actor-local textures', () => {
    const localTexture = new THREE.Texture();
    const localDispose = vi.spyOn(localTexture, 'dispose');
    const material = new THREE.MeshStandardMaterial({ bumpMap: localTexture });

    disposeObject(new THREE.Mesh(new THREE.BoxGeometry(), material));

    expect(localDispose).toHaveBeenCalledOnce();
  });
});
