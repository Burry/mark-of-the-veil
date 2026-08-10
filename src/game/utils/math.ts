import * as THREE from 'three';

export const TAU = Math.PI * 2;

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function saturate(value: number): number {
  return clamp(value, 0, 1);
}

export function damp(current: number, target: number, smoothing: number, delta: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta));
}

export function dampVector(
  current: THREE.Vector3,
  target: THREE.Vector3,
  smoothing: number,
  delta: number,
): THREE.Vector3 {
  return current.lerp(target, 1 - Math.exp(-smoothing * delta));
}

export function shortestAngleDifference(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export function distanceToRay(
  point: THREE.Vector3,
  origin: THREE.Vector3,
  direction: THREE.Vector3,
): { distance: number; along: number } {
  const toPoint = _toPoint.subVectors(point, origin);
  const along = toPoint.dot(direction);
  _closest.copy(direction).multiplyScalar(Math.max(0, along)).add(origin);
  return { distance: _closest.distanceTo(point), along };
}

export function circlePushOut(
  position: THREE.Vector3,
  center: THREE.Vector3,
  combinedRadius: number,
): void {
  const dx = position.x - center.x;
  const dz = position.z - center.z;
  const distanceSquared = dx * dx + dz * dz;
  if (distanceSquared >= combinedRadius * combinedRadius) return;
  if (distanceSquared < 0.000001) {
    position.x = center.x + combinedRadius;
    position.z = center.z;
    return;
  }
  const distance = Math.max(0.001, Math.sqrt(distanceSquared));
  const scale = combinedRadius / distance;
  position.x = center.x + dx * scale;
  position.z = center.z + dz * scale;
}

export function disposeObject(root: THREE.Object3D): void {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();
  const disposedTextures = new Set<THREE.Texture>();

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
    if (!disposedGeometries.has(object.geometry)) {
      object.geometry.dispose();
      disposedGeometries.add(object.geometry);
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (disposedMaterials.has(material)) return;
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture && !disposedTextures.has(value)) {
          if (value.userData.shared === true) return;
          value.dispose();
          disposedTextures.add(value);
        }
      });
      material.dispose();
      disposedMaterials.add(material);
    });
  });
}

const _toPoint = new THREE.Vector3();
const _closest = new THREE.Vector3();
