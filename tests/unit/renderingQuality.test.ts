import { describe, expect, it } from 'vitest';
import {
  AdaptiveRenderBudget,
  selectRenderingProfile,
  type GraphicsCapabilities,
} from '../../src/game/render/RenderingQuality';

const CAPABILITIES: GraphicsCapabilities = {
  hdrRenderTargets: true,
  floatTextureFiltering: true,
  timerQueries: true,
  maxSamples: 8,
  maxTextureSize: 16_384,
  webgpuAvailable: true,
};

describe('rendering profile selection', () => {
  it('reserves the full hybrid lighting pipeline for high quality HDR devices', () => {
    expect(selectRenderingProfile('high', CAPABILITIES)).toMatchObject({
      tier: 'cinematic',
      hdr: true,
      screenSpaceReflections: true,
      ambientOcclusion: true,
      bloom: true,
      multisamples: 0,
      maxPointLights: 7,
      bloomResolutionScale: 0.72,
    });
  });

  it('falls back deterministically when HDR render targets are unavailable', () => {
    expect(
      selectRenderingProfile('high', { ...CAPABILITIES, hdrRenderTargets: false }),
    ).toMatchObject({
      tier: 'enhanced',
      hdr: false,
      screenSpaceReflections: false,
      ambientOcclusion: false,
      bloom: false,
    });
  });

  it('honors low quality even on a high-end GPU', () => {
    expect(selectRenderingProfile('low', CAPABILITIES)).toMatchObject({
      tier: 'essential',
      screenSpaceReflections: false,
      ambientOcclusion: false,
      bloom: false,
      multisamples: 0,
    });
  });
});

describe('adaptive rendering budget', () => {
  it('degrades expensive effects only after sustained slow frames', () => {
    const budget = new AdaptiveRenderBudget();
    let change = null;
    for (let frame = 0; frame < 220 && change === null; frame += 1) {
      change = budget.sample(1 / 24, true) ?? change;
    }
    expect(change).toEqual({ level: 1, reason: 'degraded' });
  });

  it('does not adapt when the pipeline tier disallows it', () => {
    const budget = new AdaptiveRenderBudget();
    for (let frame = 0; frame < 600; frame += 1) budget.sample(1 / 20, false);
    expect(budget.currentLevel).toBe(0);
  });

  it('recovers slowly after frame times remain healthy', () => {
    const budget = new AdaptiveRenderBudget();
    for (let frame = 0; frame < 220 && budget.currentLevel === 0; frame += 1) {
      budget.sample(1 / 24, true);
    }
    expect(budget.currentLevel).toBe(1);

    let recovered = null;
    for (let frame = 0; frame < 700; frame += 1) {
      recovered = budget.sample(1 / 75, true) ?? recovered;
    }
    expect(recovered).toEqual({ level: 0, reason: 'recovered' });
  });
});
