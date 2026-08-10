import { expect, test, type Page } from '@playwright/test';
import { CAMPAIGN_CHAPTERS } from '../../src/game/campaign';
import { CHAPTER_LAYOUTS } from '../../src/game/render/ChapterScenery';
import { RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY } from '../../src/game/runtimeDiagnostics';

const CAMPAIGN_STORAGE_KEY = 'mark-of-the-veil:campaign:v1';
const RUNTIME_READY_TIMEOUT_MS = 120_000;

test.skip(
  Boolean(process.env.CI),
  'Sustained movement-to-completion UAT requires hardware WebGL; CI retains the real SwiftShader boot path.',
);

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
  await expect
    .poll(async () => Number.isFinite((await readPosition()).x), {
      timeout: RUNTIME_READY_TIMEOUT_MS,
    })
    .toBe(true);

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

test('diagnostics integration bridge carries a live chapter through production completion', async ({
  page,
}) => {
  test.setTimeout(360_000);
  await page.setViewportSize({ width: 800, height: 450 });
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  const firstChapter = CAMPAIGN_CHAPTERS[0];
  const secondChapter = CAMPAIGN_CHAPTERS[1];
  await page.goto('/?diagnostics=1');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('mark-of-the-veil:prologue:v1', 'seen');
    window.localStorage.setItem(
      'mark-of-the-veil:settings:v1',
      JSON.stringify({ quality: 'low', reducedMotion: true, reducedFlashes: true }),
    );
  });
  await page.reload();

  await page.getByRole('button', { name: 'BEGIN CAMPAIGN' }).click();
  await page.getByRole('button', { name: /ASHES OF HOME/ }).click();
  await page.getByRole('button', { name: 'STORY' }).click();
  await page.getByRole('button', { name: 'DEPLOY // ASHES OF HOME' }).click();
  await expect(page.getByText('REACH THE WAYFARER')).toBeVisible({ timeout: 120_000 });

  await expect
    .poll(
      () =>
        page.evaluate((key) => {
          const bridge = (
            window as unknown as Record<string, { readonly kind?: string } | undefined>
          )[key];
          return bridge?.kind;
        }, RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY),
      { timeout: RUNTIME_READY_TIMEOUT_MS },
    )
    .toBe('chapter-completion-integration-bridge');

  const [recoveryX, recoveryZ] = CHAPTER_LAYOUTS['ashes-of-home'].recovery;
  await moveToWorldPosition(page, recoveryX, recoveryZ);
  await expect(page.getByText('RECOVER FLIGHT RECORDER')).toBeVisible();
  await page.keyboard.press('KeyE');
  await expect(page.getByText('STABILIZE THE WRECK')).toBeVisible({ timeout: 5_000 });

  // This diagnostics bridge does not simulate combat. It exercises the production runtime to
  // host victory boundary after a real world interaction has advanced the live chapter.
  const completionAccepted = await page.evaluate((key) => {
    const bridge = (
      window as unknown as Record<string, { completeCurrentChapter?: () => boolean } | undefined>
    )[key];
    return bridge?.completeCurrentChapter?.() ?? false;
  }, RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY);
  expect(completionAccepted).toBe(true);

  await expect(page.getByText('CHAPTER 01 COMPLETE')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ASHES OF HOME' })).toBeVisible();
  await expect(page.getByText('THE ROOT VAULT', { exact: true })).toBeVisible();

  const completedProgress = await page.evaluate((key) => {
    const serialized = window.localStorage.getItem(key);
    return serialized ? (JSON.parse(serialized) as unknown) : null;
  }, CAMPAIGN_STORAGE_KEY);
  expect(completedProgress).toMatchObject({
    phase: 'chapter-complete',
    difficulty: 'story',
    currentChapterId: firstChapter.id,
    currentObjectiveId: null,
    revelationStage: null,
    completedChapterIds: [firstChapter.id],
    completedObjectiveIds: firstChapter.objectives.map((objective) => objective.id),
  });

  await page.getByRole('button', { name: 'CONTINUE CAMPAIGN' }).click();
  await expect(page.getByRole('heading', { name: secondChapter.title })).toBeVisible();

  expect(
    await page.evaluate(
      (key) => (window as unknown as Record<string, unknown>)[key] === undefined,
      RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY,
    ),
  ).toBe(true);

  const continuedProgress = await page.evaluate((key) => {
    const serialized = window.localStorage.getItem(key);
    return serialized ? (JSON.parse(serialized) as unknown) : null;
  }, CAMPAIGN_STORAGE_KEY);
  expect(continuedProgress).toMatchObject({
    phase: 'active',
    difficulty: 'story',
    currentChapterId: secondChapter.id,
    currentObjectiveId: secondChapter.objectives[0].id,
    revelationStage: null,
    completedChapterIds: [firstChapter.id],
    completedObjectiveIds: firstChapter.objectives.map((objective) => objective.id),
  });

  await page.getByRole('button', { name: 'CAMPAIGN MAP' }).click();
  const unlockedChapter = page.getByRole('button', { name: secondChapter.title, exact: true });
  await expect(unlockedChapter).toBeEnabled();
  await expect(unlockedChapter).toContainText('CURRENT SIGNAL');
  await unlockedChapter.click();
  await expect(page.getByRole('heading', { name: secondChapter.title })).toBeVisible();
  expect(browserErrors).toEqual([]);
});
