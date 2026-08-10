import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { bridgeUnsupportedScenePrimitives } from '../../src/game/render/PathTracedPresentation';

describe('path tracing scene compatibility bridge', () => {
  it('bakes instances temporarily and restores every live-scene mutation', () => {
    const scene = new THREE.Scene();
    const instanceGeometry = new THREE.BoxGeometry(1, 1, 1);
    const instanceMaterial = new THREE.MeshStandardMaterial({ color: 0x7755aa });
    const instances = new THREE.InstancedMesh(instanceGeometry, instanceMaterial, 2);
    instances.name = 'TestInstances';
    instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(1, 0, 0));
    instances.setMatrixAt(1, new THREE.Matrix4().makeTranslation(-1, 0, 0));
    scene.add(instances);

    const points = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute([0, 1, 0], 3),
      ),
      new THREE.PointsMaterial(),
    );
    scene.add(points);

    const shaderMaterial = new THREE.ShaderMaterial();
    const shaderMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shaderMaterial);
    scene.add(shaderMesh);

    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    const canvas = { dataset: {} } as unknown as HTMLCanvasElement;
    const bridge = bridgeUnsupportedScenePrimitives(scene, camera, canvas);
    const proxyRoot = scene.getObjectByName('PathTracing.InstanceExpansion');
    const fallbackMaterial = shaderMesh.material;
    const fallbackDispose = vi.fn();
    fallbackMaterial.addEventListener('dispose', fallbackDispose);

    expect(instances.visible).toBe(false);
    expect(points.visible).toBe(false);
    expect(proxyRoot?.children).toHaveLength(2);
    expect(shaderMesh.material).not.toBe(shaderMaterial);
    expect(canvas.dataset.pathTracingExpandedInstances).toBe('2');
    expect(canvas.dataset.pathTracingRasterOnlyPrimitives).toBe('1');
    expect(canvas.dataset.pathTracingSubstitutedMaterials).toBe('1');

    bridge.restore();
    bridge.restore();

    expect(instances.visible).toBe(true);
    expect(points.visible).toBe(true);
    expect(scene.getObjectByName('PathTracing.InstanceExpansion')).toBeUndefined();
    expect(shaderMesh.material).toBe(shaderMaterial);
    expect(fallbackDispose).toHaveBeenCalledOnce();

    instanceGeometry.dispose();
    instanceMaterial.dispose();
    points.geometry.dispose();
    (points.material as THREE.Material).dispose();
    shaderMesh.geometry.dispose();
    shaderMaterial.dispose();
  });
});
