import type { Quality } from '../types/GameTypes';

export type RenderingTier = 'essential' | 'enhanced' | 'cinematic';

export interface GraphicsCapabilities {
  hdrRenderTargets: boolean;
  floatTextureFiltering: boolean;
  timerQueries: boolean;
  maxSamples: number;
  maxTextureSize: number;
  webgpuAvailable: boolean;
}

export interface RenderingProfile {
  tier: RenderingTier;
  hdr: boolean;
  screenSpaceReflections: boolean;
  ambientOcclusion: boolean;
  bloom: boolean;
  smaa: boolean;
  multisamples: number;
  maxPointLights: number;
  bloomResolutionScale: number;
  reflectionScale: number;
  grainAmount: number;
  vignetteStrength: number;
  sharpenStrength: number;
}

export interface RenderBudgetChange {
  level: 0 | 1 | 2;
  reason: 'degraded' | 'recovered';
}

/**
 * Selects a deterministic feature profile from explicit player quality and GPU
 * capabilities. The quality setting is authoritative; capability checks only
 * remove effects that cannot be represented safely on the current device.
 */
export function selectRenderingProfile(
  quality: Quality,
  capabilities: GraphicsCapabilities,
): RenderingProfile {
  const hdr = quality !== 'low' && capabilities.hdrRenderTargets;
  // The compositor already owns edge reconstruction through SMAA/FXAA. A
  // multisampled HDR scene target would resolve the same edges a second time
  // while multiplying color/depth bandwidth, so post-processed tiers stay
  // single-sampled deliberately.
  const multisamples = 0;

  if (quality === 'high' && hdr) {
    return {
      tier: 'cinematic',
      hdr,
      screenSpaceReflections: true,
      ambientOcclusion: true,
      bloom: true,
      smaa: true,
      multisamples,
      maxPointLights: 7,
      bloomResolutionScale: 0.72,
      reflectionScale: 0.5,
      grainAmount: 0.018,
      vignetteStrength: 0.34,
      sharpenStrength: 0.2,
    };
  }

  if (quality !== 'low') {
    return {
      tier: 'enhanced',
      hdr,
      screenSpaceReflections: false,
      ambientOcclusion: hdr,
      bloom: hdr,
      smaa: hdr,
      multisamples,
      maxPointLights: 6,
      bloomResolutionScale: 0.66,
      reflectionScale: 0,
      grainAmount: 0.012,
      vignetteStrength: 0.28,
      sharpenStrength: 0.16,
    };
  }

  return {
    tier: 'essential',
    hdr: false,
    screenSpaceReflections: false,
    ambientOcclusion: false,
    bloom: false,
    smaa: false,
    multisamples: 0,
    maxPointLights: 4,
    bloomResolutionScale: 0.58,
    reflectionScale: 0,
    grainAmount: 0.006,
    vignetteStrength: 0.2,
    sharpenStrength: 0.08,
  };
}

/**
 * Hysteretic frame-budget controller. It drops screen-space reflections first,
 * then GTAO, and only restores a feature after a long period of healthy frames.
 * This prevents a high quality preset from thrashing between modes.
 */
export class AdaptiveRenderBudget {
  private averageFrameMs = 16.7;
  private slowSeconds = 0;
  private healthySeconds = 0;
  private level: 0 | 1 | 2 = 0;

  sample(deltaSeconds: number, allowAdaptation: boolean): RenderBudgetChange | null {
    if (!allowAdaptation || deltaSeconds <= 0 || deltaSeconds > 0.1) return null;
    const frameMs = deltaSeconds * 1_000;
    this.averageFrameMs += (frameMs - this.averageFrameMs) * 0.035;

    const slowThreshold = this.level === 0 ? 27 : 34;
    if (this.averageFrameMs > slowThreshold) {
      this.slowSeconds += deltaSeconds;
      this.healthySeconds = 0;
    } else if (this.averageFrameMs < 18.5) {
      this.healthySeconds += deltaSeconds;
      this.slowSeconds = Math.max(0, this.slowSeconds - deltaSeconds * 0.5);
    } else {
      this.slowSeconds = Math.max(0, this.slowSeconds - deltaSeconds * 0.25);
      this.healthySeconds = 0;
    }

    if (this.slowSeconds >= 2.5 && this.level < 2) {
      this.level = (this.level + 1) as 1 | 2;
      this.slowSeconds = 0;
      this.healthySeconds = 0;
      return { level: this.level, reason: 'degraded' };
    }

    if (this.healthySeconds >= 8 && this.level > 0) {
      this.level = (this.level - 1) as 0 | 1;
      this.slowSeconds = 0;
      this.healthySeconds = 0;
      return { level: this.level, reason: 'recovered' };
    }

    return null;
  }

  reset(): void {
    this.averageFrameMs = 16.7;
    this.slowSeconds = 0;
    this.healthySeconds = 0;
    this.level = 0;
  }

  get currentLevel(): 0 | 1 | 2 {
    return this.level;
  }
}
