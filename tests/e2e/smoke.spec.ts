import { expect, test } from '@playwright/test';

const IS_CI = Boolean(process.env.CI);

test.describe('Mark of the Veil production shell', () => {
  test('title navigation and settings persistence work', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Mark of the Veil — Cinematic Science-Fantasy Game');
    await expect(page.getByRole('heading', { name: 'Mark of the Veil' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'BEGIN DESCENT' })).toBeVisible();

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
      'https://mark-of-the-veil.vercel.app/',
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://mark-of-the-veil.vercel.app/og-image.jpg',
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

  test('live mission boot, cameras, pause, movement, and interaction respond', async ({ page }) => {
    test.setTimeout(IS_CI ? 180_000 : 150_000);
    if (IS_CI) await page.setViewportSize({ width: 800, height: 450 });
    await page.goto('/');
    // CI browsers use CPU-backed SwiftShader. The Essential profile still boots the real scene and
    // simulation while hardware Cinematic quality is covered by the native visual acceptance pass.
    await page.evaluate(() => {
      window.localStorage.setItem(
        'mark-of-the-veil:settings:v1',
        JSON.stringify({ quality: 'low' }),
      );
    });
    await page.reload();
    await page.getByRole('button', { name: 'BEGIN DESCENT' }).click();
    await expect(page.getByRole('heading', { name: 'THE VEIL BELOW' })).toBeVisible();
    await page.getByRole('button', { name: 'STORY' }).click();
    await page.getByRole('button', { name: 'ENTER THE ROOT VAULT' }).click();

    await expect(page.locator('#game-canvas')).toHaveClass(/is-visible/);
    await expect(page.getByText('RECOVER THE TALISMAN')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText('THIRD', { exact: true })).toBeVisible();

    // GitHub's CPU-backed SwiftShader reliably validates the real arena boot, but sustained
    // interaction can starve or terminate its software GPU process. Hardware-backed local/native
    // acceptance retains the complete controls path below.
    if (IS_CI) return;

    await page.keyboard.press('KeyV');
    await expect(page.getByText('FIRST', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'PAUSED' })).toBeVisible();
    await page.getByRole('button', { name: 'RESUME' }).click();
    await expect(page.getByText('RECOVER THE TALISMAN')).toBeVisible();
    await page.keyboard.press('KeyV');
    await expect(page.getByText('THIRD', { exact: true })).toBeVisible();

    const nextObjective = page.getByText('BREAK THE THREE SEALS');
    for (let step = 0; step < 10 && (await nextObjective.count()) === 0; step += 1) {
      await page.keyboard.down('w');
      await page.waitForTimeout(120);
      await page.keyboard.up('w');
      await page.keyboard.press('e');
    }

    await expect(nextObjective).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Reach Veil Seal 1 of 3.')).toBeVisible();
  });
});
