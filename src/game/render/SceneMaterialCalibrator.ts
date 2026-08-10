import * as THREE from 'three';
import type { RenderingProfile } from './RenderingQuality';

export class SceneMaterialCalibrator {
  private readonly calibratedMaterials = new WeakSet<THREE.Material>();
  private readonly baseEnvironmentIntensity = new WeakMap<THREE.Material, number>();

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
  ) {}

  update(profile: RenderingProfile): void {
    const maxAnisotropy = Math.min(
      profile.tier === 'cinematic' ? 16 : profile.tier === 'enhanced' ? 8 : 2,
      this.renderer.capabilities.getMaxAnisotropy(),
    );

    this.scene.traverse((object) => {
      if (object instanceof THREE.Light && 'shadow' in object) {
        this.calibrateShadow(object as THREE.Light & { shadow: THREE.LightShadow }, profile);
      }
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => this.calibrateMaterial(material, maxAnisotropy, profile));
    });
  }

  private calibrateMaterial(
    material: THREE.Material,
    maxAnisotropy: number,
    profile: RenderingProfile,
  ): void {
    const isNewMaterial = !this.calibratedMaterials.has(material);
    if (isNewMaterial) {
      this.calibratedMaterials.add(material);
      material.dithering = true;
      material.precision = 'highp';
    }

    if (material instanceof THREE.MeshStandardMaterial) {
      if (!this.baseEnvironmentIntensity.has(material)) {
        this.baseEnvironmentIntensity.set(material, material.envMapIntensity);
      }
      const baseIntensity = this.baseEnvironmentIntensity.get(material) ?? 1;
      material.envMapIntensity =
        baseIntensity *
        (profile.tier === 'cinematic' ? 1.18 : profile.tier === 'enhanced' ? 1.06 : 1);
      const textures: Array<THREE.Texture | null> = [
        material.map,
        material.normalMap,
        material.roughnessMap,
        material.metalnessMap,
        material.bumpMap,
        material.aoMap,
        material.emissiveMap,
      ];
      if (material instanceof THREE.MeshPhysicalMaterial) {
        textures.push(
          material.clearcoatMap,
          material.clearcoatNormalMap,
          material.clearcoatRoughnessMap,
        );
      }
      textures.forEach((texture) => {
        if (texture) this.calibrateTexture(texture, maxAnisotropy);
      });
    } else if (material instanceof THREE.MeshBasicMaterial && material.map) {
      this.calibrateTexture(material.map, maxAnisotropy);
    }

    if (isNewMaterial) material.needsUpdate = true;
  }

  private calibrateTexture(texture: THREE.Texture, maxAnisotropy: number): void {
    // TextureLoader returns a live Texture before its image arrives. Marking
    // that placeholder for upload causes one WebGL warning per material use.
    // The periodic calibrator will revisit it after the image is populated.
    if (!texture.image) return;
    if (texture.anisotropy < maxAnisotropy) {
      texture.anisotropy = maxAnisotropy;
      texture.needsUpdate = true;
    }
  }

  private calibrateShadow(
    light: THREE.Light & { shadow: THREE.LightShadow },
    profile: RenderingProfile,
  ): void {
    if (!light.castShadow) return;
    light.shadow.normalBias = profile.tier === 'cinematic' ? 0.028 : 0.018;
    light.shadow.bias = Math.min(light.shadow.bias, -0.00018);
    light.shadow.radius = profile.tier === 'cinematic' ? 2.35 : 1;
    // PCF/PCF-soft do not use the VSM blur stage. Keeping blurSamples at its
    // minimum also prevents accidental variance-shadow work if a downstream
    // renderer changes the shadow type without recalibrating the scene.
    light.shadow.blurSamples = 1;
  }
}
