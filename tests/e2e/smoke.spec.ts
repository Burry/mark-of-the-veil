import { expect, test, type Page } from '@playwright/test';
import { CAMPAIGN_CHAPTERS, CAMPAIGN_SCHEMA_VERSION } from '../../src/game/campaign';
import { CHAPTER_LAYOUTS } from '../../src/game/render/ChapterScenery';

const IS_CI = Boolean(process.env.CI);

async function moveToWorldPosition(
  page: Page,
  targetX: number,
  targetZ: number,
  tolerance = 3.15,
): Promise<void> {
  const readPosition = () =>
    page.locator('#game-canvas').evaluate((canvas) => ({
      x: Number((canvas as HTMLCanvasElement).dataset.playerX),
      z: Number((canvas as HTMLCanvasElement).dataset.playerZ),
    }));
  await expect.poll(async () => Number.isFinite((await readPosition()).x)).toBe(true);

  for (let attempt = 0; attempt < 36; attempt += 1) {
    const position = await readPosition();
    const dx = targetX - position.x;
    const dz = targetZ - position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= tolerance) return;

    const keys: string[] = [];
    if (Math.abs(dx) > tolerance * 0.35) keys.push(dx > 0 ? 'KeyD' : 'KeyA');
    if (Math.abs(dz) > tolerance * 0.35) keys.push(dz < 0 ? 'KeyW' : 'KeyS');
    const duration = Math.min(320, Math.max(100, (distance / 6.2) * 300));

    try {
      await Promise.all(keys.map((key) => page.keyboard.down(key)));
      await page.waitForTimeout(duration);
    } finally {
      await Promise.all(keys.map((key) => page.keyboard.up(key)));
    }
    await page.waitForTimeout(70);
  }

  const position = await readPosition();
  throw new Error(
    `Unable to reach ${targetX},${targetZ}; player stopped at ${position.x},${position.z}`,
  );
}

test.describe('Mark of the Veil production shell', () => {
  test('title navigation and settings persistence work', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Mark of the Veil | Cinematic Science-Fantasy Game');
    await expect(page.getByRole('heading', { name: 'Mark of the Veil' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'BEGIN CAMPAIGN' })).toBeVisible();

    await page.getByRole('button', { name: 'SETTINGS' }).click();
    await expect(page.getByRole('heading', { name: 'SETTINGS' })).toBeVisible();
    await page.getByRole('tab', { name: 'AUDIO' }).click();

    const masterVolume = page
      .locator('label.setting-row')
      .filter({ hasText: 'MASTER VOLUME' })
      .locator('input[type="range"]');
    await masterVolume.fill('0.35');
    await expect(masterVolume).toHaveValue('0.35');

    await page.getByRole('button', { name: 'RETURN' }).click();
    await page.reload();
    await page.getByRole('button', { name: 'SETTINGS' }).click();
    await page.getByRole('tab', { name: 'AUDIO' }).click();
    await expect(
      page
        .locator('label.setting-row')
        .filter({ hasText: 'MASTER VOLUME' })
        .locator('input[type="range"]'),
    ).toHaveValue('0.35');

    await page.getByRole('button', { name: 'RETURN' }).click();
    await page.getByRole('button', { name: 'CONTROLS' }).click();
    await expect(page.getByRole('heading', { name: 'CONTROLS' })).toBeVisible();
    await expect(page.getByText('Both cameras share one center-screen aim ray.')).toBeVisible();
  });

  test('production metadata and install assets are discoverable', async ({ page, request }) => {
    await page.goto('/');

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://mark-of-the-veil.burry.io/',
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://mark-of-the-veil.burry.io/og-image.jpg',
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );

    for (const asset of [
      '/manifest.webmanifest',
      '/robots.txt',
      '/sitemap.xml',
      '/og-image.jpg',
      '/apple-touch-icon.png',
      '/pwa-192x192.png',
      '/pwa-512x512.png',
      '/pwa-maskable-512x512.png',
    ]) {
      expect((await request.get(asset)).ok(), `${asset} should be served`).toBe(true);
    }

    const socialImageSize = await page.evaluate(
      () =>
        new Promise<{ height: number; width: number }>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => reject(new Error('Unable to load the OpenGraph image.'));
          image.src = '/og-image.jpg';
        }),
    );
    expect(socialImageSize).toEqual({ width: 1200, height: 630 });
  });

  test('chapter boundaries, final briefing, and completed campaign routing stay coherent', async ({
    page,
  }) => {
    const firstChapter = CAMPAIGN_CHAPTERS[0];
    await page.goto('/');
    await page.evaluate(({ key, value }) => window.localStorage.setItem(key, value), {
      key: 'mark-of-the-veil:campaign:v1',
      value: JSON.stringify({
        schemaVersion: CAMPAIGN_SCHEMA_VERSION,
        phase: 'chapter-complete',
        difficulty: 'normal',
        currentChapterId: firstChapter.id,
        currentObjectiveId: null,
        revelationStage: null,
        completedChapterIds: [firstChapter.id],
        completedObjectiveIds: firstChapter.objectives.map((objective) => objective.id),
        upgrades: ['ace'],
      }),
    });
    await page.reload();
    await page.getByRole('button', { name: 'CONTINUE CAMPAIGN' }).click();
    await expect(page.getByRole('heading', { name: 'THE VESPERA CAMPAIGN' })).toBeVisible();
    await page.getByRole('button', { name: 'CONTINUE CAMPAIGN' }).click();
    await expect(page.getByRole('heading', { name: 'THE ROOT VAULT' })).toBeVisible();

    const finalChapter = CAMPAIGN_CHAPTERS.at(-1);
    if (!finalChapter) throw new Error('Expected a final campaign chapter');
    const priorChapters = CAMPAIGN_CHAPTERS.slice(0, -1);
    const finalActiveProgress = {
      schemaVersion: CAMPAIGN_SCHEMA_VERSION,
      phase: 'active',
      difficulty: 'normal',
      currentChapterId: finalChapter.id,
      currentObjectiveId: finalChapter.objectives[0].id,
      revelationStage: null,
      completedChapterIds: priorChapters.map((chapter) => chapter.id),
      completedObjectiveIds: priorChapters.flatMap((chapter) =>
        chapter.objectives.map((objective) => objective.id),
      ),
      upgrades: ['ace', 'survivor', 'stormhorn'],
    };
    await page.evaluate(
      (progress) =>
        window.localStorage.setItem('mark-of-the-veil:campaign:v1', JSON.stringify(progress)),
      finalActiveProgress,
    );
    await page.reload();
    await page.getByRole('button', { name: 'CONTINUE CAMPAIGN' }).click();
    await page.getByRole('button', { name: /THE ROOT CHOIR/ }).click();
    const finalBriefing = page.locator('main.chapter-briefing');
    await expect(finalBriefing).toBeVisible();
    await expect(finalBriefing).not.toContainText(/unicorns? (?:are|were|never)|ceases? to exist/i);

    const finalRevelation = finalChapter.objectives.find(
      (objective) => objective.type === 'revelation',
    );
    if (!finalRevelation || finalRevelation.type !== 'revelation') {
      throw new Error('Expected the final revelation objective');
    }
    const pendingRevelation = {
      ...finalActiveProgress,
      phase: 'revelation-pending' as const,
      currentObjectiveId: finalRevelation.id,
      revelationStage: 2,
      completedObjectiveIds: [
        ...finalActiveProgress.completedObjectiveIds,
        ...finalChapter.objectives.slice(0, -1).map((objective) => objective.id),
      ],
    };
    await page.evaluate(
      (progress) =>
        window.localStorage.setItem('mark-of-the-veil:campaign:v1', JSON.stringify(progress)),
      pendingRevelation,
    );
    await page.reload();
    await page.getByRole('button', { name: 'CONTINUE CAMPAIGN' }).click();
    await expect(page.getByRole('heading', { name: 'HE SEARCHES FOR HOME' })).toBeVisible();
    await page.getByRole('button', { name: 'ADVANCE SIGNAL' }).click();
    await expect(page.getByRole('heading', { name: "UNICORNS AREN'T REAL." })).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: 'CONTINUE CAMPAIGN' }).click();
    await expect(page.getByRole('heading', { name: "UNICORNS AREN'T REAL." })).toBeVisible();
    for (let stage = 4; stage < finalRevelation.transmissionIds.length; stage += 1) {
      await page.getByRole('button', { name: 'ADVANCE SIGNAL' }).click();
    }
    await expect(page.getByRole('heading', { name: 'VESPERA REMEMBERS' })).toBeVisible();
    await expect(page.getByText(/Sable waits beside the empty cockpit/)).toBeVisible();
    await page.getByRole('button', { name: 'LET MARK GO' }).click();
    await expect(page.getByRole('heading', { name: 'MARK IS NOT HERE' })).toBeVisible();

    await page.getByRole('button', { name: 'RETURN TO TITLE' }).click();
    await page.getByRole('button', { name: 'CONTINUE CAMPAIGN' }).click();
    await page.getByRole('button', { name: 'REPLAY CHOIR MEMORY' }).click();
    await expect(page.getByRole('heading', { name: 'THE ROOT CHOIR' })).toBeVisible();
  });

  test('live mission boot, cameras, pause, movement, and interaction respond', async ({ page }) => {
    test.setTimeout(240_000);
    if (IS_CI) await page.setViewportSize({ width: 800, height: 450 });
    await page.goto('/?diagnostics=1');
    // CI browsers use CPU-backed SwiftShader. The Essential profile still boots the real scene and
    // simulation. Visual review and hardware performance qualification are separate workflows.
    await page.evaluate(() => {
      window.localStorage.setItem(
        'mark-of-the-veil:settings:v1',
        JSON.stringify({ quality: 'low' }),
      );
    });
    await page.reload();
    await page.getByRole('button', { name: 'BEGIN CAMPAIGN' }).click();
    await expect(page.getByRole('heading', { name: 'THE PILOT IN THE CROWN SHIP' })).toBeVisible();
    await page.getByRole('button', { name: 'CONTINUE MEMORY' }).click();
    await expect(page.getByRole('heading', { name: 'A BROKEN OATH' })).toBeVisible();
    await page.getByRole('button', { name: 'CONTINUE MEMORY' }).click();
    await expect(page.getByRole('heading', { name: 'THE TURN BACK' })).toBeVisible();
    await page.getByRole('button', { name: 'BEGIN ASHES OF HOME' }).click();
    await expect(page.getByRole('heading', { name: 'THE VESPERA CAMPAIGN' })).toBeVisible();
    await expect(page.locator('.chapter-card')).toHaveCount(8);
    await page.getByRole('button', { name: /ASHES OF HOME/ }).click();
    await expect(page.getByRole('heading', { name: 'ASHES OF HOME' })).toBeVisible();
    await page.getByRole('button', { name: 'STORY' }).click();
    await page.getByRole('button', { name: 'DEPLOY // ASHES OF HOME' }).click();

    await expect(page.locator('#game-canvas')).toHaveClass(/is-visible/);
    await expect(page.getByText('REACH THE WAYFARER')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText('THIRD', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'PAUSED' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'PAUSED' })).toBeHidden();
    await expect(page.getByText('REACH THE WAYFARER')).toBeVisible();

    // GitHub's CPU-backed SwiftShader reliably validates the real arena boot, but sustained
    // interaction can starve or terminate its software GPU process. The non-CI E2E path below
    // retains complete controls coverage; hardware performance is qualified outside Playwright.
    if (IS_CI) return;

    await page.keyboard.press('KeyV');
    await expect(page.getByText('FIRST', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'PAUSED' })).toBeVisible();
    await page.getByRole('button', { name: 'RESUME' }).click();
    await expect(page.getByText('REACH THE WAYFARER')).toBeVisible();
    await page.keyboard.press('KeyV');
    await expect(page.getByText('THIRD', { exact: true })).toBeVisible();

    const nextObjective = page.getByText('STABILIZE THE WRECK');
    const [recoveryX, recoveryZ] = CHAPTER_LAYOUTS['ashes-of-home'].recovery;
    await moveToWorldPosition(page, recoveryX, recoveryZ);
    await expect(page.getByText('RECOVER FLIGHT RECORDER')).toBeVisible();
    await page.keyboard.press('e');

    await expect(nextObjective).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Restore the Wayfarer’s emergency lattice.')).toBeVisible();
  });
});
