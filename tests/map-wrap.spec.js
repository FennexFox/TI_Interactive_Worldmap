import { expect, test } from '@playwright/test';

async function waitForMap(page) {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('body')).not.toContainText('Failed to load generated Terra Invicta map data.');
}

async function waitForWrappedMap(page) {
  await page.goto('/?worldWrap=1');
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

test('world-wrap review flag renders base, grid, label, and hit copies', async ({ page }) => {
  await waitForWrappedMap(page);

  await expect(page.locator('#regions .region-copy')).toHaveCount(3);
  await expect(page.locator('#hitRegions .hit-copy')).toHaveCount(3);
  await expect(page.locator('#grid .grid-copy')).toHaveCount(3);
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).toHaveCount(3);
  await expect(page.locator('#hitRegions .region-hit[data-region="Amazonia"]')).toHaveCount(3);

  const copySummary = await page.evaluate(() => {
    const regionCopies = [...document.querySelectorAll('#regions .region-copy')].map(group => ({
      copy: group.dataset.wrapCopy,
      offset: group.dataset.wrapOffset,
      canonical: group.dataset.wrapCanonical,
      transform: group.getAttribute('transform') || '',
    }));
    const amazoniaHits = [...document.querySelectorAll('#hitRegions .region-hit[data-region="Amazonia"]')]
      .map(path => ({copy: path.dataset.wrapCopy, canonical: path.dataset.wrapCanonical}));
    return {regionCopies, amazoniaHits};
  });

  expect(copySummary.regionCopies.map(copy => copy.copy)).toEqual(['-1', '0', '1']);
  expect(copySummary.regionCopies.map(copy => copy.canonical)).toEqual(['0', '1', '0']);
  expect(copySummary.regionCopies[0].transform).toContain('translate(-6.52568676 0)');
  expect(copySummary.regionCopies[1].transform).toBe('');
  expect(copySummary.regionCopies[2].transform).toContain('translate(6.52568676 0)');
  expect(copySummary.amazoniaHits.map(hit => hit.copy)).toEqual(['-1', '0', '1']);

  await page.locator('#showLabels').click();
  await expect(page.locator('#labels .label-copy')).toHaveCount(3);
  await expect(page.locator('#labels .label[data-region="Amazonia"]')).toHaveCount(3);
});

test('world-wrap review flag resolves copied hit paths to canonical region state', async ({ page }) => {
  await waitForWrappedMap(page);

  const copiedAmazonia = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-copy="-1"]');
  await copiedAmazonia.dispatchEvent('pointerover', { bubbles: true, clientX: 120, clientY: 120, pointerType: 'mouse' });
  await copiedAmazonia.dispatchEvent('pointermove', { bubbles: true, clientX: 126, clientY: 126, pointerType: 'mouse' });
  await expect(page.locator('#hoverPill')).toHaveText('Hover: BRA · Manaus');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);

  await copiedAmazonia.dispatchEvent('click', { bubbles: true });
  await expect(page.locator('#search')).toHaveValue(/Brazil/);
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText('Manaus');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
});

test('world-wrap review flag applies search filtering to every copy without duplicating canonical state', async ({ page }) => {
  await waitForWrappedMap(page);

  await page.locator('#search').fill('Amazonia');
  const filterStats = await page.locator('#regions .region').evaluateAll(paths => {
    const stats = {amazonia: 0, amazoniaHidden: 0, ontario: 0, ontarioHidden: 0};
    for (const path of paths) {
      if (path.dataset.region === 'Amazonia') {
        stats.amazonia += 1;
        if (path.classList.contains('hidden')) stats.amazoniaHidden += 1;
      }
      if (path.dataset.region === 'Ontario') {
        stats.ontario += 1;
        if (path.classList.contains('hidden')) stats.ontarioHidden += 1;
      }
    }
    return stats;
  });

  expect(filterStats).toEqual({amazonia: 3, amazoniaHidden: 0, ontario: 3, ontarioHidden: 3});
});

test.skip('issue #2 acceptance: horizontal panning passes west and east map edges without a hard stop', async () => {});

test.skip('issue #2 acceptance: wrapped copy hover and click resolve to the same canonical region', async () => {});

test.skip('issue #2 acceptance: selected claim overlays render on every visible world copy', async () => {});
