// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

async function chooseNation(page, query, tag) {
  await page.locator('#search').fill(query);
  await page.locator('#nationDropdown .searchOption')
    .filter({ has: page.locator('.searchOptionTag', { hasText: tag }) })
    .first()
    .click();
}

async function groupedClaimRegionCount(page) {
  return page.locator('#claimOverlays .claim-fill-group').evaluateAll(nodes => nodes.reduce((sum, node) => (
    sum + Number(node.dataset.visualGroupSize || 0)
  ), 0));
}

async function baseColorAudit(page) {
  return page.evaluate(() => {
    const fillsByRegion = new Map();
    for (const node of document.querySelectorAll('#normalRegionColors .normal-region-color[data-wrap-canonical="1"]')) {
      const fill = node.getAttribute('fill') || '';
      for (const regionName of String(node.dataset.regions || '').split(/\s+/).filter(Boolean)) {
        if (!fillsByRegion.has(regionName)) fillsByRegion.set(regionName, new Set());
        fillsByRegion.get(regionName).add(fill);
      }
    }

    const fillsByNation = new Map();
    const missingRegions = [];
    for (const node of document.querySelectorAll('#regions .region[data-wrap-canonical="1"]')) {
      const nation = String(node.dataset.nation || '');
      if (!nation) continue;
      const regionName = String(node.dataset.region || '');
      const fills = fillsByRegion.get(regionName) || new Set();
      if (fills.size !== 1) missingRegions.push({regionName, fills: [...fills]});
      if (!fillsByNation.has(nation)) fillsByNation.set(nation, new Set());
      for (const fill of fills) fillsByNation.get(nation).add(fill);
    }

    return {
      missingRegions,
      inconsistentNations: [...fillsByNation]
        .filter(([, fills]) => fills.size !== 1)
        .map(([nation, fills]) => ({nation, fills: [...fills]})),
    };
  });
}

async function canonicalRegionBaseState(page, regionName) {
  return page.evaluate(name => {
    const region = document.querySelector(
      `#regions .region[data-wrap-canonical="1"][data-region="${CSS.escape(name)}"]`
    );
    const fills = new Set();
    for (const node of document.querySelectorAll('#normalRegionColors .normal-region-color[data-wrap-canonical="1"]')) {
      const regions = String(node.dataset.regions || '').split(/\s+/);
      if (regions.includes(name)) fills.add(node.getAttribute('fill') || '');
    }
    return {
      nation: String(region?.dataset.nation || ''),
      fills: [...fills],
    };
  }, regionName);
}

test('scenario selector switches supported start scenarios and keeps map workflows usable', async ({ page }) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await expect(page.locator('#scenarioSel')).toHaveValue('2026');
  await expect(page.locator('#scenarioSel option')).toHaveText(['2022', '2026', '2070']);

  await page.locator('#scenarioSel').selectOption('2022');
  await expect(page.locator('#scenarioSel')).toHaveValue('2022');

  await chooseNation(page, 'Canada', 'CAN');
  await expect(page.locator('#search')).toHaveValue(/Canada/);
  await expect(page.locator('#claimPill')).toContainText('Canada: territory');
  await expect(page.locator('#nationInfo')).toContainText('Canada');
  await expect(page.locator('#map')).toHaveClass(/claims-active/);
  await expect.poll(async () => groupedClaimRegionCount(page)).toBeGreaterThan(0);

  await page.locator('#scenarioSel').selectOption('2070');
  await expect(page.locator('#scenarioSel')).toHaveValue('2070');
  await expect(page.locator('#map')).toHaveClass(/claims-active/);

  await chooseNation(page, 'Saudi Arabia', 'SAU');
  await expect(page.locator('#search')).toHaveValue(/Saudi Arabia/);
  await expect(page.locator('#claimPill')).toContainText('Saudi Arabia: territory');
  await expect(page.locator('#nationInfo')).toContainText('Saudi Arabia');
  await expect.poll(async () => groupedClaimRegionCount(page)).toBeGreaterThan(0);

  await page.locator('#scenarioSel').selectOption('2026');
  await expect(page.locator('#scenarioSel')).toHaveValue('2026');

  await chooseNation(page, 'Canada', 'CAN');
  await expect(page.locator('#claimPill')).toContainText('Canada: territory');
  await expect(page.locator('#nationInfo')).toContainText('Canada');
});

test('scenario ownership drives one consistent base fill per nation', async ({ page }) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region[data-wrap-canonical="1"]').first()).toBeVisible({ timeout: 10000 });

  for (const scenario of ['2022', '2026', '2070']) {
    await page.locator('#scenarioSel').selectOption(scenario);
    await expect(page.locator('#scenarioSel')).toHaveValue(scenario);
    const audit = await baseColorAudit(page);
    expect(audit.missingRegions, `${scenario} regions without exactly one base fill`).toEqual([]);
    expect(audit.inconsistentNations, `${scenario} nations with inconsistent base fills`).toEqual([]);
  }

  // Installed game data assigns Crimea to RUS in 2026 and EUA in 2070.
  await page.locator('#scenarioSel').selectOption('2026');
  const state2026 = await canonicalRegionBaseState(page, 'Crimea');
  expect(state2026.nation).toBe('RUS');
  expect(state2026.fills).toHaveLength(1);

  await page.locator('#scenarioSel').selectOption('2070');
  await expect(
    page.locator('#regions .region[data-wrap-canonical="1"][data-region="Crimea"]')
  ).toHaveAttribute('data-nation', 'EUA');
  const state2070 = await canonicalRegionBaseState(page, 'Crimea');
  expect(state2070.nation).toBe('EUA');
  expect(state2070.fills).toHaveLength(1);
  expect(state2070.fills[0]).not.toBe(state2026.fills[0]);

  await page.locator('#scenarioSel').selectOption('2026');
  const restored = await canonicalRegionBaseState(page, 'Crimea');
  expect(restored).toEqual(state2026);
});
