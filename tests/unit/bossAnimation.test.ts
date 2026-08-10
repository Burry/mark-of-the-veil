import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { animateBossVariant, applyBossVariant } from '../../src/game/render/BossVariants';

describe('boss variant animation', () => {
  it('animates authored hooks deterministically without moving the combat root', () => {
    const root = new THREE.Group();
    root.position.set(-4, 6.2, -15);
    applyBossVariant(root, 'the-silent-orbit', 0x72e9ff);
    const hook = root.getObjectByName('BossHook-widow-orbit-1');
    if (!hook) throw new Error('Expected the Gravity Widow orbit hook');
    const initialRotation = hook.rotation.clone();
    const rootPosition = root.position.clone();

    animateBossVariant(root, 5);
    const animatedRotation = hook.rotation.clone();
    expect(animatedRotation.equals(initialRotation)).toBe(false);
    expect(root.position).toEqual(rootPosition);

    animateBossVariant(root, 5);
    expect(hook.rotation.x).toBeCloseTo(animatedRotation.x);
    expect(hook.rotation.y).toBeCloseTo(animatedRotation.y);
    expect(hook.rotation.z).toBeCloseTo(animatedRotation.z);
  });
});
