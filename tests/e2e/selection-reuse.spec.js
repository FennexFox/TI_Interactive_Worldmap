// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {clearMap, clickRegion, expect, test} from '../fixtures/app.js';

async function rememberSelection(page) {
  await page.evaluate(() => {
    const layer = document.querySelector('#selectionOutlines');
    layer.previousSelectionNode = layer.firstElementChild;
    window.__TI_DEBUG_RENDER_STATS__.reset();
  });
}

async function selectionStats(page) {
  return page.evaluate(() => {
    const layer = document.querySelector('#selectionOutlines');
    const stats = window.__TI_DEBUG_RENDER_STATS__;
    return {
      sameNode: layer.previousSelectionNode === layer.firstElementChild,
      rebuilds: stats.selectionOutlineRebuilds,
      skips: stats.selectionOutlineRenderSkips,
    };
  });
}

async function refreshSameLanguage(page) {
  await page.locator('#languageSel').evaluate(element => {
    element.dispatchEvent(new Event('change', {bubbles: true}));
  });
}

test('selection reuse preserves labels, pins, capital markers, wrap and scenario geometry', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});
  await page.selectOption('#languageSel', 'en');
  await clickRegion(page, 'Amazonia');
  const labels = page.locator('#selectionOutlines .selection-label');
  await expect(labels).toHaveText(['Manaus']);
  await expect(page.locator('#selectionOutlines .selection-dot')).toHaveCount(1);

  await rememberSelection(page);
  await refreshSameLanguage(page);
  expect(await selectionStats(page)).toEqual({sameNode: true, rebuilds: 0, skips: 1});

  await rememberSelection(page);
  await page.selectOption('#languageSel', 'ko');
  await expect(labels).toHaveText(['마나우스']);
  expect(await selectionStats(page)).toEqual({sameNode: false, rebuilds: 1, skips: 0});

  await rememberSelection(page);
  await page.locator('[data-map-view-wrap-toggle]').click();
  await expect(labels).toHaveText(['마나우스', '마나우스', '마나우스']);
  expect(await selectionStats(page)).toEqual({sameNode: false, rebuilds: 1, skips: 1});
  await rememberSelection(page);
  await refreshSameLanguage(page);
  expect(await selectionStats(page)).toEqual({sameNode: true, rebuilds: 0, skips: 1});

  await page.locator('[data-pinned-unpin="Amazonia"]').click();
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group')).toHaveCount(0);
  await expect(labels).toHaveCount(3);
  await expect(page.locator('#selectionOutlines .selection-dot')).toHaveCount(3);

  await rememberSelection(page);
  await page.selectOption('#scenarioSel', '2070');
  expect((await selectionStats(page)).rebuilds).toBeGreaterThan(0);
  await expect(labels).toHaveCount(3);
  const geometryMatches = await page.evaluate(() => {
    const selection = document.querySelector('#selectionOutlines .selection-outline[data-wrap-canonical="1"]');
    const region = document.querySelector('#regions .region[data-region="Amazonia"][data-wrap-canonical="1"]');
    return selection?.getAttribute('d') === region?.getAttribute('d');
  });
  expect(geometryMatches).toBe(true);
  await rememberSelection(page);
  await refreshSameLanguage(page);
  expect(await selectionStats(page)).toEqual({sameNode: true, rebuilds: 0, skips: 1});

  await clearMap(page);
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
  await page.selectOption('#scenarioSel', '2026');
  await clickRegion(page, 'Beijing');
  await expect(page.locator('#selectionOutlines .selection-dot')).toHaveCount(0);
  await expect(page.locator('#pinnedRegionMarkers .capital-star')).toHaveCount(3);
  await rememberSelection(page);
  await refreshSameLanguage(page);
  expect(await selectionStats(page)).toEqual({sameNode: true, rebuilds: 0, skips: 1});
});
