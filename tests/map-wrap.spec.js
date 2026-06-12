import { expect, test } from '@playwright/test';

async function waitForMap(page) {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('body')).not.toContainText('Failed to load generated Terra Invicta map data.');
}

function regionHit(page, regionName) {
  return page.locator(`#hitRegions .region-hit[data-region="${regionName}"]`);
}

async function chooseNation(page, query, tag) {
  await page.locator('#search').fill(query);
  await page.locator('#nationDropdown .searchOption')
    .filter({ has: page.locator('.searchOptionTag', { hasText: tag }) })
    .first()
    .click();
}

test('baseline hit layer resolves one canonical region for hover and click', async ({ page }) => {
  await waitForMap(page);

  const regionRegistry = await page.evaluate(() => {
    const hitRegions = [...document.querySelectorAll('#hitRegions .region-hit')]
      .map(path => path.dataset.region)
      .filter(Boolean);
    const visualRegions = [...document.querySelectorAll('#regions .region')]
      .map(path => path.dataset.region)
      .filter(Boolean);
    return {
      hitCount: hitRegions.length,
      visualCount: visualRegions.length,
      uniqueHitCount: new Set(hitRegions).size,
      uniqueVisualCount: new Set(visualRegions).size,
      amazoniaHitCount: hitRegions.filter(region => region === 'Amazonia').length,
      amazoniaVisualCount: visualRegions.filter(region => region === 'Amazonia').length,
    };
  });

  expect(regionRegistry.hitCount).toBeGreaterThan(300);
  expect(regionRegistry.hitCount).toBe(regionRegistry.uniqueHitCount);
  expect(regionRegistry.visualCount).toBe(regionRegistry.uniqueVisualCount);
  expect(regionRegistry.amazoniaHitCount).toBe(1);
  expect(regionRegistry.amazoniaVisualCount).toBe(1);

  await expect(regionHit(page, 'Amazonia')).toHaveAttribute('data-wrap-copy', '0');
  await expect(regionHit(page, 'Amazonia')).toHaveAttribute('data-wrap-canonical', '1');
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).toHaveAttribute('data-wrap-copy', '0');
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).toHaveAttribute('data-wrap-canonical', '1');

  await regionHit(page, 'Amazonia').hover();
  await expect(page.locator('#hoverPill')).toHaveText('Hover: BRA · Manaus');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);

  await regionHit(page, 'Amazonia').dispatchEvent('click', { bubbles: true });
  await expect(page.locator('#search')).toHaveValue(/Brazil/);
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText('Manaus');

  await page.locator('#hitRegions').dispatchEvent('click', { bubbles: true });
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
});

test('baseline selected overlays stay canonical across hover and claim controls', async ({ page }) => {
  await waitForMap(page);

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);

  await regionHit(page, 'Amazonia').hover();
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);

  await regionHit(page, 'FrenchGuiana').hover();
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="FrenchGuiana"]')).toHaveCount(1);
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);

  await page.selectOption('#projectSel', 'Project_GranColombia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 5, research tiers 1');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(14);
});

test.skip('issue #2 acceptance: horizontal panning passes west and east map edges without a hard stop', async () => {});

test.skip('issue #2 acceptance: wrapped copy hover and click resolve to the same canonical region', async () => {});

test.skip('issue #2 acceptance: selected claim overlays render on every visible world copy', async () => {});
