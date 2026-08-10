import { expect, test, type Page } from '@playwright/test';

import {
  CAMPAIGN_CHAPTERS,
  CAMPAIGN_SCHEMA_VERSION,
  type CampaignProgress,
  type ChapterId,
} from '../../src/game/campaign';

const captureVisuals = process.env.CAPTURE_VISUALS === '1';
const visualOutputDirectory = process.env.VISUAL_OUTPUT_DIR ?? 'docs/screenshots';
const visualChapterIds = [
  'ashes-of-home',
  'the-memory-forge',
  'the-root-choir',
] as const satisfies readonly ChapterId[];

function progressForChapter(chapterId: ChapterId): CampaignProgress {
  const chapterIndex = CAMPAIGN_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
  const chapter = CAMPAIGN_CHAPTERS[chapterIndex];
  const previousChapters = CAMPAIGN_CHAPTERS.slice(0, chapterIndex);

  return {
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    phase: 'active',
    difficulty: 'normal',
    currentChapterId: chapterId,
    currentObjectiveId: chapter.objectives[0].id,
    revelationStage: null,
    completedChapterIds: previousChapters.map(({ id }) => id),
    completedObjectiveIds: previousChapters.flatMap(({ objectives }) =>
      objectives.map(({ id }) => id),
    ),
    upgrades: [],
  };
}

interface ImageVariance {
  meanLuminance: number;
  luminanceRange: number;
  variance: number;
  occupiedBuckets: number;
}

async function measureImageVariance(page: Page, encodedJpeg: string): Promise<ImageVariance> {
  return page.evaluate(async (encoded) => {
    const image = new Image();
    image.src = `data:image/jpeg;base64,${encoded}`;
    await image.decode();

    const probe = document.createElement('canvas');
    probe.width = 48;
    probe.height = 27;
    const context = probe.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Unable to create visual-variance probe.');
    context.drawImage(image, 0, 0, probe.width, probe.height);
    const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
    let sum = 0;
    let sumSquares = 0;
    let minimum = 255;
    let maximum = 0;
    const buckets = new Set<number>();

    for (let offset = 0; offset < pixels.length; offset += 4) {
      const luminance =
        (pixels[offset] ?? 0) * 0.2126 +
        (pixels[offset + 1] ?? 0) * 0.7152 +
        (pixels[offset + 2] ?? 0) * 0.0722;
      sum += luminance;
      sumSquares += luminance * luminance;
      minimum = Math.min(minimum, luminance);
      maximum = Math.max(maximum, luminance);
      buckets.add(Math.floor(luminance / 8));
    }

    const sampleCount = pixels.length / 4;
    const meanLuminance = sum / sampleCount;
    return {
      meanLuminance,
      luminanceRange: maximum - minimum,
      variance: sumSquares / sampleCount - meanLuminance * meanLuminance,
      occupiedBuckets: buckets.size,
    };
  }, encodedJpeg);
}

test.describe('campaign raster visual review', () => {
  test.skip(
    !captureVisuals,
    'Set CAPTURE_VISUALS=1 to render diagnostics-backed WebGL review plates.',
  );

  for (const chapterId of visualChapterIds) {
    test(`${chapterId} identifies the production raster path and produces a nonblank capture`, async ({
      page,
    }) => {
      test.setTimeout(240_000);
      const browserErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(message.text());
      });
      page.on('pageerror', (error) => browserErrors.push(error.message));

      const chapterIndex = CAMPAIGN_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
      const chapter = CAMPAIGN_CHAPTERS[chapterIndex];
      const progress = progressForChapter(chapterId);

      await page.setViewportSize({ width: 1672, height: 941 });
      await page.goto('/?diagnostics=1');
      await expect(page).toHaveTitle(/Mark of the Veil/i);
      await page.evaluate(
        ({ campaignProgress }) => {
          localStorage.setItem('mark-of-the-veil:campaign:v1', JSON.stringify(campaignProgress));
          localStorage.setItem('mark-of-the-veil:prologue:v1', 'seen');
          localStorage.setItem('mark-of-the-veil:settings:v1', JSON.stringify({ quality: 'high' }));
        },
        { campaignProgress: progress },
      );
      await page.reload();

      await page
        .getByRole('button', {
          name: chapterIndex === 0 ? 'BEGIN CAMPAIGN' : 'CONTINUE CAMPAIGN',
        })
        .click();
      await page.getByRole('button', { name: new RegExp(chapter.title) }).click();
      await page.getByRole('button', { name: `DEPLOY // ${chapter.title}` }).click();

      await page.locator('.objective-panel').waitFor({ timeout: 120_000 });
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toHaveAttribute('data-engine', /^three\.js r\d+$/);
      await expect(canvas).toHaveAttribute('data-render-api', 'webgl2');
      await expect(canvas).toHaveAttribute('data-lighting-model', 'hybrid-pbr-ssr-gtao');
      await expect(canvas).toHaveAttribute('data-render-tier', /^(cinematic|enhanced)$/);
      await expect(canvas).toHaveAttribute('data-adaptive-render-level', /^[012]$/);
      await expect(canvas).toHaveAttribute('data-internal-resolution-scale', /^(1|0\.84|0\.76)$/);
      await expect(canvas).toHaveAttribute('data-path-tracing-policy', 'diagnostics-disabled');

      expect(
        await page.evaluate(() => {
          const serialized = localStorage.getItem('mark-of-the-veil:settings:v1');
          return serialized ? (JSON.parse(serialized) as { quality?: string }).quality : null;
        }),
      ).toBe('high');

      // Headless Chromium cannot retain pointer lock and uses a software WebGL renderer. Hide only
      // those harness artifacts from review plates; FPS and render-load assertions remain active.
      await page.locator('.focus-game-prompt').evaluate((element) => {
        (element as HTMLElement).style.display = 'none';
      });
      await page.addStyleTag({ content: '.performance-warning { display: none !important; }' });
      await page.waitForTimeout(5_000);

      const fps = Number(await canvas.getAttribute('data-fps'));
      const renderCalls = Number(await canvas.getAttribute('data-render-calls'));
      const renderTriangles = Number(await canvas.getAttribute('data-render-triangles'));
      expect(fps).toBeGreaterThan(0);
      expect(renderCalls).toBeGreaterThan(0);
      expect(renderTriangles).toBeGreaterThan(0);

      const canvasCapture = await canvas.screenshot({ type: 'jpeg', quality: 82 });
      expect(canvasCapture.byteLength).toBeGreaterThan(8_000);
      const variance = await measureImageVariance(page, canvasCapture.toString('base64'));
      expect(variance.meanLuminance).toBeGreaterThan(1);
      expect(variance.luminanceRange).toBeGreaterThan(8);
      expect(variance.variance).toBeGreaterThan(3);
      expect(variance.occupiedBuckets).toBeGreaterThan(4);

      await page.screenshot({
        path: `${visualOutputDirectory}/${chapter.id}.jpg`,
        type: 'jpeg',
        quality: 92,
      });

      // This gate deliberately exercises moving raster output. Optional frozen-scene path tracing
      // requires a separate controlled hardware run and is not certified by Playwright.
      expect(browserErrors).toEqual([]);
    });
  }
});
