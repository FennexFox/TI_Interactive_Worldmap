import { expect, test } from '@playwright/test';

async function chooseNation(page, query, tag) {
  await page.locator('#search').fill(query);
  await page.locator('#nationDropdown .searchOption')
    .filter({ has: page.locator('.searchOptionTag', { hasText: tag }) })
    .first()
    .click();
}

test('language selector switches static and dynamic UI copy', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await expect(page.locator('#languageSel')).toHaveValue('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Terra Invicta Claim / Unification Map');
  await expect(page.locator('#search')).toHaveAttribute('placeholder', 'Enter a nation tag, region, or project: CHN, Korea, Greater India...');
  await expect(page.locator('#claimMode option[value="project"]')).toHaveText('Selected project only');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');

  await page.locator('#search').click();
  await expect(page.locator('#nationDropdown')).toBeVisible();
  await expect(page.locator('#nationDropdown .searchOption').first()).toBeVisible();

  await page.selectOption('#languageSel', 'ko');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('h1')).toHaveText('Terra Invicta 영유권 / 통합 지도');
  await expect(page.locator('#search')).toHaveAttribute('placeholder', '국가 태그, 지역명, 프로젝트명 입력: CHN, Korea, Greater India...');
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

test('nation search uses catalog names and keeps region names separate', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  const search = page.locator('#search');
  const options = page.locator('#nationDropdown .searchOption');
  const nationOption = (tag) => options.filter({ has: page.locator('.searchOptionTag', { hasText: tag }) });
  const regionOption = options.filter({ has: page.locator('.searchOptionTag', { hasText: 'REGION' }) });

  await search.fill('Canada');
  await expect(nationOption('CAN').first()).toContainText('Canada');

  await search.fill('캐나다');
  await expect(nationOption('CAN').first()).toBeVisible();

  await search.fill('United States');
  await expect(nationOption('USA').first()).toBeVisible();

  await search.fill('China');
  await expect(nationOption('CHN').first()).toContainText('China');

  await search.fill('SEN');
  await expect(options.first().locator('.searchOptionTag')).toHaveText('SEG');
  await expect(nationOption('SEG').first()).toContainText('Senegal');
  await expect(nationOption('SEN')).toHaveCount(0);

  await search.fill('Senegambia');
  await expect(regionOption.filter({ hasText: 'Dakar' }).first()).toContainText('SEG');
  await expect(nationOption('SEN')).toHaveCount(0);

  await search.fill('Denver');
  await expect(regionOption.filter({ hasText: 'Denver' }).first()).toContainText('USA');

  await search.fill('Seoul');
  await expect(regionOption.filter({ hasText: 'Seoul' }).first()).toContainText('KOR');

  await search.fill('Saudi Arabia');
  await expect(nationOption('SAU').first()).toContainText('Saudi Arabia');
  await expect(nationOption('SAU').first()).not.toContainText('formable');

  await search.fill('Guatemala');
  await expect(nationOption('GTM').first()).toContainText('Guatemala');
  await expect(regionOption.filter({ hasText: 'Guatemala City' }).first()).toContainText('GTM');
  await expect(nationOption('GUA')).toHaveCount(0);

  await search.fill('Liangguang');
  await expect(nationOption('GUA').first()).toContainText('Liangguang');
  await expect(nationOption('GUA').first()).not.toContainText('Guatemala');
});

test('nation search matches claim project names to claimant nations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  const search = page.locator('#search');
  const options = page.locator('#nationDropdown .searchOption');
  const nationOption = (tag) => options.filter({ has: page.locator('.searchOptionTag', { hasText: tag }) });

  await search.fill('United Turkestan');
  await expect(nationOption('TUR').first()).toBeVisible();

  await search.fill('Greater India');
  await expect(nationOption('IND').first()).toBeVisible();

  await search.fill('연합된 투르키스탄');
  await expect(nationOption('TUR').first()).toBeVisible();
});


test('selected nation marks its capital region with a fillable star', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await page.locator('#regions .region[data-region="Amazonia"]').hover();
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
  await expect(page.locator('#hoverOutlines .selection-dot[data-region="Amazonia"]')).toHaveCount(0);
  await expect(page.locator('#hoverOutlines .selection-label[data-region="Amazonia"]')).toHaveCount(0);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).not.toHaveClass(/is-selected/);

  await page.locator('#search').fill('Brazil');
  await page.locator('#nationDropdown .searchOption').filter({ has: page.locator('.searchOptionTag', { hasText: 'BRA' }) }).first().click();

  await expect(page.locator('#nationInfo')).toContainText('Capital region');
  await expect(page.locator('#nationInfo')).toContainText('Brasilia');
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers text')).toHaveCount(0);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).not.toHaveClass(/is-selected/);

  await page.locator('#regions .region[data-region="Amazonia"]').hover();
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="BRA"]')).toHaveCount(0);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).not.toHaveClass(/is-selected/);

  await page.locator('#regions .region[data-region="Amazonia"]').click();
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).not.toHaveClass(/is-selected/);

  await page.locator('#regions .region[data-region="Ontario"]').hover();
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Ontario"]')).toHaveCount(0);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"][data-region="Ontario"]')).toHaveCount(1);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"]')).not.toHaveCount(0);
  const foreignHoverOverlay = page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"]').first();
  await expect(foreignHoverOverlay).toHaveCSS('mix-blend-mode', 'normal');
  await expect(foreignHoverOverlay).toHaveAttribute('fill-opacity', /^(0\.|1)/);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).not.toHaveClass(/is-selected/);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Ontario"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Ontario"]')).toHaveClass(/is-selected/);

  await page.locator('#regions .region[data-region="Bolivia"]').hover();
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Bolivia"]')).toHaveCount(1);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="BOL"][data-region="Brasilia"]')).toHaveCount(0);

  await page.locator('#regions .region[data-region="Brasilia"]').hover();
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveClass(/is-selected/);

  await page.locator('#regions .region[data-region="Brasilia"]').click();
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#selectionOutlines .selection-dot[data-region="Brasilia"]')).toHaveCount(0);
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Brasilia"]')).toHaveText('Brasilia');

  await page.locator('#regions .region[data-region="FrenchGuiana"]').hover();
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveClass(/is-selected/);

  await page.locator('#regions .region[data-region="Ontario"]').hover();
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Ontario"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Ontario"]')).toHaveClass(/is-selected/);
});

test('selected nation claim controls update overlays without losing state', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);
  await expect(page.locator('#projectSel option')).toHaveCount(3);

  await page.selectOption('#projectSel', 'Project_GranColombia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#projectSel')).toHaveValue('Project_GranColombia');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 5, research tiers 1');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(14);
  await expect(page.locator('.claimListItem.active[data-claim-kind="outgoing"]')).toHaveCount(1);

  await page.selectOption('#claimMode', 'all');
  await page.selectOption('#claimKind', 'hostile');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 11, research tiers 1');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(20);
  await expect(page.locator('.claimListItem[data-claim-kind="outgoing"]')).toHaveCount(1);

  await page.selectOption('#claimKind', 'all');
  await page.selectOption('#claimMode', 'off');
  await expect(page.locator('#claimMode')).toHaveValue('off');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 0, research tiers 0');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#nationInfo')).toContainText('Display mode');
  await expect(page.locator('#nationInfo')).toContainText('Off');
});

test('claim cards synchronize map overlays, panel state, and empty map clear', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await page.locator('#regions .region[data-region="Amazonia"]').click();
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText('Manaus');
  await expect(page.locator('.claimListItem[data-claim-kind="incoming"]')).toHaveCount(4);

  await page.locator('.claimListItem[data-claim-kind="outgoing"]').first().click();
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#projectSel')).toHaveValue('Project_GranColombia');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 5, research tiers 1');
  await expect(page.locator('.claimListItem.active[data-claim-kind="outgoing"]')).toHaveCount(1);
  await expect(page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]').first()).toBeVisible();

  await page.locator('.claimListItem[data-claim-kind="incoming"]').first().click();
  await expect(page.locator('#search')).toHaveValue(/Bolivia/);
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#projectSel')).toHaveValue('');
  await expect(page.locator('#claimPill')).toHaveText('Bolivia: territory 1, claims 25, research tiers 0');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);
  await expect(page.locator('.claimListItem.active[data-claim-kind="outgoing"]')).toHaveCount(1);

  await page.locator('#grid .graticule').first().click({ force: true });
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#claimMode')).toHaveValue('all');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
});
