import * as THREE from 'three';
import type { Quality } from '../types/GameTypes';
import { disposeObject, TAU } from '../utils/math';

interface TracerState {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

interface RingState {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  growth: number;
}

export class EffectsDirector {
  readonly root = new THREE.Group();
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly velocities: Float32Array;
  private readonly lives: Float32Array;
  private readonly particleMaterial: THREE.PointsMaterial;
  private readonly particles: THREE.Points;
  private readonly tracers: TracerState[] = [];
  private readonly rings: RingState[] = [];
  private particleCursor = 0;
  private tracerCursor = 0;
  private ringCursor = 0;
  private readonly particleCount: number;
  private reducedFlashes: boolean;

  constructor(scene: THREE.Scene, quality: Quality, reducedFlashes = false) {
    this.root.name = 'PooledEffects';
    scene.add(this.root);
    this.reducedFlashes = reducedFlashes;
    this.particleCount = quality === 'high' ? 620 : quality === 'medium' ? 380 : 190;
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.lives = new Float32Array(this.particleCount);
    for (let index = 0; index < this.particleCount; index += 1) {
      this.positions[index * 3 + 1] = -1000;
      this.colors[index * 3] = 1;
      this.colors[index * 3 + 1] = 0.4;
      this.colors[index * 3 + 2] = 0.2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.particleMaterial = new THREE.PointsMaterial({
      size: quality === 'low' ? 0.12 : 0.1,
      vertexColors: true,
      transparent: true,
      opacity: reducedFlashes ? 0.28 : 0.94,
      blending: reducedFlashes ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.particles.frustumCulled = false;
    this.root.add(this.particles);

    const tracerGeometry = new THREE.CylinderGeometry(0.016, 0.04, 1, 7, 1, true);
    for (let index = 0; index < 24; index += 1) {
      const materialInstance = new THREE.MeshBasicMaterial({
        color: 0xbba4ff,
        transparent: true,
        opacity: 0,
        blending: reducedFlashes ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(tracerGeometry, materialInstance);
      mesh.visible = false;
      this.root.add(mesh);
      this.tracers.push({ mesh, life: 0, maxLife: 0.075 });
    }

    const ringGeometry = new THREE.RingGeometry(0.86, 1, 64);
    for (let index = 0; index < 12; index += 1) {
      const materialInstance = new THREE.MeshBasicMaterial({
        color: 0x9b78ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: reducedFlashes ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeometry, materialInstance);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.root.add(mesh);
      this.rings.push({ mesh, life: 0, maxLife: 0.6, growth: 10 });
    }
  }

  tracer(from: THREE.Vector3, to: THREE.Vector3, color = 0xbba4ff): void {
    const state = this.tracers[this.tracerCursor++ % this.tracers.length];
    const direction = _direction.subVectors(to, from);
    const length = Math.max(0.01, direction.length());
    direction.multiplyScalar(1 / length);
    state.mesh.position.copy(from).add(to).multiplyScalar(0.5);
    state.mesh.quaternion.setFromUnitVectors(_up, direction);
    state.mesh.scale.set(1, length, 1);
    const material = state.mesh.material;
    if (material instanceof THREE.MeshBasicMaterial) {
      material.color.setHex(color);
      material.opacity = this.reducedFlashes ? 0.26 : 0.94;
    }
    state.life = state.maxLife;
    state.mesh.visible = true;
  }

  burst(
    position: THREE.Vector3,
    color: THREE.ColorRepresentation,
    count = 18,
    speed = 5,
    lift = 1.5,
  ): void {
    _color.set(color);
    const requestedCount = this.reducedFlashes ? Math.max(1, Math.ceil(count * 0.42)) : count;
    const capped = Math.min(requestedCount, Math.floor(this.particleCount * 0.22));
    for (let particle = 0; particle < capped; particle += 1) {
      const index = this.particleCursor++ % this.particleCount;
      const stride = index * 3;
      const angle = ((particle * 2.399963) % TAU) + Math.random() * 0.3;
      const vertical = Math.random() * 1.5 - 0.25;
      const velocity = speed * (0.35 + Math.random() * 0.65);
      this.positions[stride] = position.x;
      this.positions[stride + 1] = position.y;
      this.positions[stride + 2] = position.z;
      this.velocities[stride] = Math.cos(angle) * velocity;
      this.velocities[stride + 1] = vertical * velocity + lift;
      this.velocities[stride + 2] = Math.sin(angle) * velocity;
      this.colors[stride] = _color.r;
      this.colors[stride + 1] = _color.g;
      this.colors[stride + 2] = _color.b;
      this.lives[index] = 0.35 + Math.random() * 0.65;
    }
    this.markParticlesDirty();
  }

  pulse(position: THREE.Vector3, radius: number, color = 0x9b78ff, duration = 0.72): void {
    const state = this.rings[this.ringCursor++ % this.rings.length];
    state.mesh.position.copy(position);
    state.mesh.position.y = Math.max(0.11, state.mesh.position.y);
    state.mesh.scale.setScalar(0.4);
    state.growth = radius;
    state.maxLife = duration;
    state.life = duration;
    state.mesh.visible = true;
    const material = state.mesh.material;
    if (material instanceof THREE.MeshBasicMaterial) {
      material.color.setHex(color);
      material.opacity = this.reducedFlashes ? 0.2 : 0.92;
    }
  }

  muzzle(position: THREE.Vector3, direction: THREE.Vector3): void {
    this.burst(position, 0xc7b6ff, 8, 2.5, 0.2);
    const end = _end.copy(direction).multiplyScalar(1.15).add(position);
    this.tracer(position, end, 0xe7dcff);
  }

  update(delta: number): void {
    let particleDirty = false;
    for (let index = 0; index < this.particleCount; index += 1) {
      const life = this.lives[index];
      if (life <= 0) continue;
      const stride = index * 3;
      this.lives[index] = Math.max(0, life - delta);
      this.velocities[stride] *= Math.exp(-delta * 1.4);
      this.velocities[stride + 1] -= delta * 5.7;
      this.velocities[stride + 2] *= Math.exp(-delta * 1.4);
      this.positions[stride] += this.velocities[stride] * delta;
      this.positions[stride + 1] += this.velocities[stride + 1] * delta;
      this.positions[stride + 2] += this.velocities[stride + 2] * delta;
      if (this.lives[index] <= 0 || this.positions[stride + 1] < 0)
        this.positions[stride + 1] = -1000;
      particleDirty = true;
    }
    if (particleDirty) this.markParticlesDirty();

    this.tracers.forEach((state) => {
      if (state.life <= 0) return;
      state.life = Math.max(0, state.life - delta);
      const material = state.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        const peakOpacity = this.reducedFlashes ? 0.26 : 1;
        material.opacity = (state.life / state.maxLife) * peakOpacity;
      }
      if (state.life <= 0) state.mesh.visible = false;
    });

    this.rings.forEach((state) => {
      if (state.life <= 0) return;
      state.life = Math.max(0, state.life - delta);
      const progress = 1 - state.life / state.maxLife;
      const scale = THREE.MathUtils.lerp(0.4, state.growth, 1 - Math.pow(1 - progress, 3));
      state.mesh.scale.setScalar(scale);
      const material = state.mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        const peakOpacity = this.reducedFlashes ? 0.2 : 0.82;
        material.opacity = (1 - progress) * peakOpacity;
      }
      if (state.life <= 0) state.mesh.visible = false;
    });
  }

  setReducedFlashes(reducedFlashes: boolean): void {
    if (this.reducedFlashes === reducedFlashes) return;
    this.reducedFlashes = reducedFlashes;
    this.particleMaterial.opacity = reducedFlashes ? 0.28 : 0.94;
    this.applyBlendMode(this.particleMaterial);

    this.tracers.forEach((state) => {
      const material = state.mesh.material;
      if (!(material instanceof THREE.MeshBasicMaterial)) return;
      this.applyBlendMode(material);
      if (state.life > 0) {
        const peakOpacity = reducedFlashes ? 0.26 : 1;
        material.opacity = (state.life / state.maxLife) * peakOpacity;
      }
    });
    this.rings.forEach((state) => {
      const material = state.mesh.material;
      if (!(material instanceof THREE.MeshBasicMaterial)) return;
      this.applyBlendMode(material);
      if (state.life > 0) {
        const peakOpacity = reducedFlashes ? 0.2 : 0.82;
        material.opacity = (state.life / state.maxLife) * peakOpacity;
      }
    });
  }

  clear(): void {
    this.lives.fill(0);
    for (let index = 0; index < this.particleCount; index += 1)
      this.positions[index * 3 + 1] = -1000;
    this.tracers.forEach((state) => {
      state.life = 0;
      state.mesh.visible = false;
    });
    this.rings.forEach((state) => {
      state.life = 0;
      state.mesh.visible = false;
    });
    this.markParticlesDirty();
  }

  dispose(): void {
    this.root.removeFromParent();
    disposeObject(this.root);
  }

  private markParticlesDirty(): void {
    (this.particles.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.particles.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }

  private applyBlendMode(material: THREE.Material): void {
    const blending = this.reducedFlashes ? THREE.NormalBlending : THREE.AdditiveBlending;
    if (material.blending === blending) return;
    material.blending = blending;
    material.needsUpdate = true;
  }
}

const _up = new THREE.Vector3(0, 1, 0);
const _direction = new THREE.Vector3();
const _end = new THREE.Vector3();
const _color = new THREE.Color();
