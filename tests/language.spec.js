import { expect, test } from '@playwright/test';

test('language selector switches static and dynamic UI copy', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await expect(page.locator('#languageSel')).toHaveValue('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Terra Invicta Claim / Unification Map');
  await expect(page.locator('#search')).toHaveAttribute('placeholder', 'Enter a nation tag or region name: CHN, Korea, Taiwan...');
  await expect(page.locator('#claimMode option[value="project"]')).toHaveText('Selected project only');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');

  await page.locator('#search').click();
  await expect(page.locator('#nationDropdown')).toBeVisible();
  await expect(page.locator('#nationDropdown .searchOption').first()).toBeVisible();

  await page.selectOption('#languageSel', 'ko');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('h1')).toHaveText('Terra Invicta 영유권 / 통합 지도');
  await expect(page.locator('#search')).toHaveAttribute('placeholder', '국가 태그 또는 지역명 입력: CHN, Korea, Taiwan...');
  await expect(page.locator('#claimPill')).toHaveText('영유권: -');

  await page.selectOption('#languageSel', 'en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
});

test('sidebar falls back when persisted settings have unexpected JSON types', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ti-map-language', 'en');
    localStorage.setItem('ti-map-aside-card-order', JSON.stringify('selected'));
    localStorage.setItem('ti-map-aside-card-collapsed', JSON.stringify(42));
    localStorage.setItem('ti-map-nation-info-sections', JSON.stringify(null));
  });

  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  const cards = page.locator('#asideCardList .sideCard');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toHaveAttribute('data-aside-card', 'explore');
  await expect(cards.nth(1)).toHaveAttribute('data-aside-card', 'selected');
  await expect(cards.nth(0).locator('.sideCardBody')).toBeVisible();
  await expect(cards.nth(1).locator('.sideCardBody')).toBeVisible();
});
