import { expect, test } from '@playwright/test';

test.describe('Mark of the Veil production shell', () => {
  test('title navigation and settings persistence work', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Mark of the Veil');
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

  test('live mission boot, cameras, pause, movement, and interaction respond', async ({ page }) => {
    test.setTimeout(150_000);
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
