import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ForwardLightBudget } from '../../src/game/render/ForwardLightBudget';

describe('forward light budget', () => {
  it('keeps only the most influential world-visible point lights active', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 2, 0);
    const lights = Array.from({ length: 9 }, (_, index) => {
      const light = new THREE.PointLight(0xffffff, 8 + index, 18, 2);
      light.position.set(index * 4, 2, 0);
      scene.add(light);
      return light;
    });
    const hiddenParent = new THREE.Group();
    hiddenParent.visible = false;
    const hiddenLight = new THREE.PointLight(0xffffff, 100, 18, 2);
    hiddenParent.add(hiddenLight);
    scene.add(hiddenParent);

    const budget = new ForwardLightBudget(scene, camera);
    budget.update(1, 4);

    expect(lights.filter((light) => light.visible)).toHaveLength(4);
    expect(hiddenLight.visible).toBe(false);
    expect(budget.diagnostics()).toEqual({ active: 4, eligible: 9, total: 10 });
  });

  it('restores the authored light rig while suspended and on disposal', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const lights = Array.from({ length: 6 }, (_, index) => {
      const light = new THREE.PointLight(0xffffff, 8, 18, 2);
      light.position.x = index * 3;
      scene.add(light);
      return light;
    });
    const authoredHidden = new THREE.PointLight();
    authoredHidden.visible = false;
    scene.add(authoredHidden);
    const budget = new ForwardLightBudget(scene, camera);

    budget.update(1, 2);
    expect(lights.filter((light) => light.visible)).toHaveLength(2);
    budget.setSuspended(true);
    expect(lights.every((light) => light.visible)).toBe(true);
    expect(authoredHidden.visible).toBe(false);

    budget.setSuspended(false);
    budget.update(1, 2);
    budget.dispose();
    expect(lights.every((light) => light.visible)).toBe(true);
    expect(authoredHidden.visible).toBe(false);
  });
});
