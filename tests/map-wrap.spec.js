// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

const SEAM_CANDIDATES = [
  'Alaska',
  'AmericanPacific',
  'FrenchPacific',
  'Micronesia',
  'Polynesia',
  'Kamchatka',
  'RussianFarEast',
  'SakhalinKurils',
];

function pathWithQueryParam(path, name, value) {
  const url = new URL(path, 'http://localhost');
  url.searchParams.set(name, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

async function waitForSingleCopyMap(page, path = '/') {
  await page.goto(path);
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('body')).not.toContainText('Failed to load generated Terra Invicta map data.');
}

async function waitForWrappedMap(page, path = '/') {
  await page.goto(pathWithQueryParam(path, 'worldWrap', '1'));
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('body')).not.toContainText('Failed to load generated Terra Invicta map data.');
}

async function waitForAnimationFrames(page, frameCount) {
  await page.evaluate(count => new Promise(resolve => {
    let remaining = count;
    function step() {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }), frameCount);
}

async function waitForHoverPreviewFrame(page) {
  await waitForAnimationFrames(page, 2);
}

function regionHit(page, regionName) {
  return page.locator(`#hitRegions .region-hit[data-region="${regionName}"]`);
}

async function hoverWrappedRegion(page, regionName, copy = '0') {
  const target = page.locator(`#hitRegions .region-hit[data-region="${regionName}"][data-wrap-copy="${copy}"]`);
  await target.dispatchEvent('pointerover', { bubbles: true, clientX: 120, clientY: 120, pointerType: 'mouse' });
  await target.dispatchEvent('pointermove', { bubbles: true, clientX: 126, clientY: 126, pointerType: 'mouse' });
}

async function expectProjectedCopies(locator, copies = ['-1', '0', '1']) {
  await expect(locator).toHaveCount(copies.length);
  await expect.poll(async () => locator.evaluateAll(nodes => nodes.map(node => node.dataset.wrapCopy))).toEqual(copies);
}

async function expectProjectedRegion(page, layerSelector, regionName, copies = ['-1', '0', '1']) {
  await expectProjectedCopies(page.locator(`${layerSelector}[data-region="${regionName}"]`), copies);
}

async function mapViewBox(page) {
  const value = await page.locator('#map').getAttribute('viewBox');
  return String(value || '').split(/\s+/).map(Number);
}

async function dragMap(page, start, end, steps = 8) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, {steps});
  await page.mouse.up();
}

async function blankMapPoint(page) {
  return page.evaluate(() => {
    const map = document.querySelector('#map');
    const rect = map.getBoundingClientRect();
    for (let gy = 1; gy <= 9; gy += 1) {
      for (let gx = 1; gx <= 9; gx += 1) {
        const x = rect.left + (rect.width * gx) / 10;
        const y = rect.top + (rect.height * gy) / 10;
        const hit = document.elementFromPoint(x, y);
        if (hit === map || hit?.id === 'grid' || hit?.id === 'hitRegions' || hit?.classList?.contains('graticule')) {
          return {x, y};
        }
      }
    }
    return {x: rect.left + rect.width * 0.12, y: rect.top + rect.height * 0.46};
  });
}

async function dispatchPointerClick(locator, point = {x: 120, y: 120}) {
  await locator.dispatchEvent('pointerdown', {bubbles: true, button: 0, pointerId: 7, clientX: point.x, clientY: point.y, pointerType: 'mouse'});
  await locator.dispatchEvent('pointerup', {bubbles: true, button: 0, pointerId: 7, clientX: point.x, clientY: point.y, pointerType: 'mouse'});
  await locator.dispatchEvent('click', {bubbles: true, clientX: point.x, clientY: point.y});
}

async function dispatchPointerDragAndClick(locator, start = {x: 120, y: 120}, end = {x: 152, y: 120}) {
  await locator.dispatchEvent('pointerdown', {bubbles: true, button: 0, pointerId: 8, clientX: start.x, clientY: start.y, pointerType: 'mouse'});
  await locator.dispatchEvent('pointermove', {bubbles: true, button: 0, pointerId: 8, clientX: end.x, clientY: end.y, pointerType: 'mouse'});
  await locator.dispatchEvent('pointerup', {bubbles: true, button: 0, pointerId: 8, clientX: end.x, clientY: end.y, pointerType: 'mouse'});
  await locator.dispatchEvent('click', {bubbles: true, clientX: end.x, clientY: end.y});
}

async function chooseNation(page, query, tag) {
  await page.locator('#search').fill(query);
  await page.locator('#nationDropdown .searchOption')
    .filter({ has: page.locator('.searchOptionTag', { hasText: tag }) })
    .first()
    .click();
}

test('world-wrap pan keeps hover feedback active while dragging', async ({ page }) => {
  await waitForWrappedMap(page);

  const hit = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-copy="0"]');
  await expect(hit).toBeVisible();
  const box = await hit.boundingBox();
  expect(box).toBeTruthy();

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await expect(page.locator('#hoverPill')).not.toHaveText('Hover: -');

  await page.mouse.down();
  await page.mouse.move(x + 16, y + 8, {steps: 4});
  await expect(page.locator('#hoverPill')).not.toHaveText('Hover: -');
  await page.mouse.up();
});

test('world-wrap default real mouse click selects a region without being captured as map pan', async ({ page }) => {
  await waitForWrappedMap(page);

  const hit = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-copy="0"]');
  await expect(hit).toBeVisible();
  const box = await hit.boundingBox();
  expect(box).toBeTruthy();

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await expect(page.locator('#search')).toHaveValue(/Brazil/);
  await expect(page.locator('#hoverPill')).toHaveText('Hover: BRA · Manaus');
  await expectProjectedCopies(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]'));
});

test('baseline hit layer resolves one canonical region for hover and click', async ({ page }) => {
  await waitForSingleCopyMap(page);

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
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
});

test('world-wrap defaults off and can be enabled from map controls', async ({ page }) => {
  await waitForSingleCopyMap(page);

  await expect(page.locator('#regions .region-copy')).toHaveCount(0);
  await expect(page.locator('#hitRegions .hit-copy')).toHaveCount(0);
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).toHaveCount(1);
  const wrapToggle = page.locator('[data-map-view-wrap-toggle]');
  await expect(wrapToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(wrapToggle).toHaveAttribute('title', /reduce performance/);

  await wrapToggle.click();

  await expect(wrapToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#regions .region-copy')).toHaveCount(3);
  await expect(page.locator('#hitRegions .hit-copy')).toHaveCount(3);
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).toHaveCount(3);
  await expectProjectedCopies(page.locator('#hitRegions .region-hit[data-region="Amazonia"]'));
});

test('single-copy grouped base fills preserve region-specific hit paths and filtering', async ({ page }) => {
  await waitForSingleCopyMap(page);

  const regionCount = await page.locator('#hitRegions .region-hit').count();
  const nationFillStats = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('#normalRegionColors .normal-region-color')];
    return {
      groupCount: groups.length,
      hasRegionDataset: groups.some(group => !!group.dataset.region),
      totalGroupedRegions: groups.reduce((sum, group) => sum + Number(group.dataset.visualGroupSize || 0), 0),
    };
  });

  expect(nationFillStats.groupCount).toBeGreaterThan(1);
  expect(nationFillStats.groupCount).toBeLessThan(regionCount);
  expect(nationFillStats.hasRegionDataset).toBe(false);
  expect(nationFillStats.totalGroupedRegions).toBe(regionCount);

  await page.selectOption('#baseMode', 'plain');
  const plainFillStats = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('#normalRegionColors .normal-region-color')];
    return {
      groupCount: groups.length,
      groupSize: Number(groups[0]?.dataset.visualGroupSize || 0),
      pointerEvents: groups[0] ? getComputedStyle(groups[0]).pointerEvents : '',
    };
  });

  expect(plainFillStats.groupCount).toBe(1);
  expect(plainFillStats.groupSize).toBe(regionCount);
  expect(plainFillStats.pointerEvents).toBe('none');

  await page.locator('#search').fill('Amazonia');
  const filteredStats = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('#normalRegionColors .normal-region-color')];
    const hits = [...document.querySelectorAll('#hitRegions .region-hit')];
    return {
      groupCount: groups.length,
      groupedRegions: groups.reduce((sum, group) => sum + Number(group.dataset.visualGroupSize || 0), 0),
      hiddenHitCount: hits.filter(hit => hit.classList.contains('hidden')).length,
      amazoniaHidden: document.querySelector('#hitRegions .region-hit[data-region="Amazonia"]')?.classList.contains('hidden') || false,
      ontarioHidden: document.querySelector('#hitRegions .region-hit[data-region="Ontario"]')?.classList.contains('hidden') || false,
    };
  });

  expect(filteredStats.groupCount).toBe(1);
  expect(filteredStats.groupedRegions).toBeLessThan(regionCount);
  expect(filteredStats.hiddenHitCount).toBeGreaterThan(0);
  expect(filteredStats.amazoniaHidden).toBe(false);
  expect(filteredStats.ontarioHidden).toBe(true);
});

test('claim grouped fills preserve per-region semantic outline paths', async ({ page }) => {
  await waitForSingleCopyMap(page);

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);

  const claimFillStats = await page.evaluate(() => {
    const fills = [...document.querySelectorAll('#claimOverlays .claim-fill-group')];
    const hatches = [...document.querySelectorAll('#claimOverlays .claim-hatch-group')];
    const outlines = [...document.querySelectorAll('#claimOverlays .claim-overlay')];
    return {
      fillGroupCount: fills.length,
      hatchGroupCount: hatches.length,
      outlineCount: outlines.length,
      fillGroupsWithRegion: fills.filter(fill => !!fill.dataset.region).length,
      groupedRegions: fills.reduce((sum, fill) => sum + Number(fill.dataset.visualGroupSize || 0), 0),
      hatchedRegions: hatches.reduce((sum, hatch) => sum + Number(hatch.dataset.visualGroupSize || 0), 0),
      ownedFillGroups: fills.filter(fill => fill.classList.contains('owned-territory')).length,
      ownedOutlines: outlines.filter(outline => outline.classList.contains('owned-territory')).length,
      peacefulOutlines: outlines.filter(outline => outline.classList.contains('peaceful')).length,
      hostileOutlines: outlines.filter(outline => outline.classList.contains('hostile')).length,
      allOutlinesFillNone: outlines.every(outline => outline.getAttribute('fill') === 'none'),
      hostileHatchesHaveLines: hatches
        .filter(hatch => hatch.classList.contains('hostile'))
        .every(hatch => hatch.querySelectorAll('.claim-hatch-line').length === 1 && hatch.querySelectorAll('.claim-hatch-line-shadow').length === 0),
      peacefulHatches: hatches.filter(hatch => hatch.classList.contains('peaceful')).length,
      ownedHatches: hatches.filter(hatch => hatch.classList.contains('owned-territory')).length,
      hostileOutlinesUseRetiredRedStroke: outlines
        .filter(outline => outline.classList.contains('hostile'))
        .some(outline => getComputedStyle(outline).stroke === 'rgb(255, 180, 168)'),
    };
  });

  expect(claimFillStats.fillGroupCount).toBeGreaterThan(0);
  expect(claimFillStats.hatchGroupCount).toBeGreaterThan(0);
  expect(claimFillStats.fillGroupCount).toBeLessThan(claimFillStats.outlineCount);
  expect(claimFillStats.fillGroupsWithRegion).toBe(0);
  expect(claimFillStats.groupedRegions).toBe(claimFillStats.outlineCount);
  expect(claimFillStats.ownedFillGroups).toBeGreaterThan(0);
  expect(claimFillStats.ownedOutlines).toBeGreaterThan(0);
  expect(claimFillStats.peacefulOutlines).toBeGreaterThan(0);
  expect(claimFillStats.hostileOutlines).toBeGreaterThan(0);
  expect(claimFillStats.allOutlinesFillNone).toBe(true);
  expect(claimFillStats.hatchedRegions).toBe(claimFillStats.hostileOutlines);
  expect(claimFillStats.hostileHatchesHaveLines).toBe(true);
  expect(claimFillStats.peacefulHatches).toBe(0);
  expect(claimFillStats.ownedHatches).toBe(0);
  expect(claimFillStats.hostileOutlinesUseRetiredRedStroke).toBe(false);

  await regionHit(page, 'Amazonia').hover();
  await expect(page.locator('#hoverPill')).toHaveText('Hover: BRA · Manaus');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
});

test('project-specific hostile claims render hatch and follow claim kind filters', async ({ page }) => {
  await waitForSingleCopyMap(page);

  await chooseNation(page, 'China', 'CHN');
  await page.selectOption('#projectSel', 'Project_GreaterPanAsia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#claimKind')).toHaveValue('all');
  await expect(page.locator('#claimOverlays .claim-overlay.hostile')).toHaveCount(5);
  await expect(page.locator('#claimOverlays .claim-overlay.peaceful')).toHaveCount(25);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile')).toHaveCount(5);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile[data-region="Hokkaido"] .claim-hatch-line')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile[data-region="NorthHonshu"] .claim-hatch-line')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-overlay.hostile[data-region="Hokkaido"]')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-overlay.hostile[data-region="NorthHonshu"]')).toHaveCount(1);

  await page.selectOption('#claimKind', 'peaceful');
  await expect(page.locator('#claimOverlays .claim-overlay.hostile')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-overlay.peaceful')).toHaveCount(25);

  await page.selectOption('#claimKind', 'hostile');
  await expect(page.locator('#claimOverlays .claim-overlay.hostile')).toHaveCount(5);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile')).toHaveCount(5);
  await expect(page.locator('#claimOverlays .claim-overlay.peaceful')).toHaveCount(0);
});

test('hostile hatch can be disabled for performance diagnostics', async ({ page }) => {
  await waitForSingleCopyMap(page, '/?worldWrap=0&debugRenderStats=1&disableHostileHatch=1');

  await chooseNation(page, 'China', 'CHN');
  await page.selectOption('#projectSel', 'Project_GreaterPanAsia');
  await expect(page.locator('#claimOverlays .claim-overlay.hostile')).toHaveCount(5);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-overlay.hostile[data-region="Hokkaido"]')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-overlay.hostile[data-region="NorthHonshu"]')).toHaveCount(1);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.hostileHatchDisabled).toBe(1);
  expect(stats.worldWrapDisabled).toBe(1);
});

test('baseline selected overlays stay canonical across hover and claim controls', async ({ page }) => {
  await waitForSingleCopyMap(page);

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

test('world-wrap default renders base, grid, label, and hit copies', async ({ page }) => {
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

test('world-wrap default projects grouped base and claim fill copies', async ({ page }) => {
  await waitForWrappedMap(page);

  await page.selectOption('#baseMode', 'plain');
  await expectProjectedCopies(page.locator('#normalRegionColors .normal-region-color'));

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expectProjectedCopies(page.locator('#claimOverlays .claim-fill-group.owned-territory[data-fill-key^="owned:"]'));
  await expectProjectedCopies(page.locator('#claimOverlays .claim-overlay.owned-territory[data-region="Amazonia"]'));
});

test('world-wrap default projects pinned node markers from row clicks', async ({ page }) => {
  await waitForWrappedMap(page, '/?debugRenderStats=1');

  await chooseNation(page, 'Brazil', 'BRA');
  await page.locator('.claimListItem[data-claim-kind="outgoing"]').first().click();
  await expect(page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]').first()).toBeVisible();
  const frenchGuianaRow = page.locator('.legendRegionRow')
    .filter({ has: page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]') });
  const frenchGuianaItem = frenchGuianaRow.locator('.legendRegionItem');
  await expect(frenchGuianaRow.locator('.legendRegionPin')).toHaveCount(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await frenchGuianaItem.click();

  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="FrenchGuiana"]')).toHaveCount(1);
  await expectProjectedCopies(page.locator('#pinnedRegionMarkers .pinned-node-marker-group[data-region="FrenchGuiana"]'));
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-label[data-region="FrenchGuiana"]')).toHaveCount(0);
  await expectProjectedCopies(page.locator('#selectionOutlines .selection-label[data-region="FrenchGuiana"]'));
  await expect(page.locator('#selectionOutlines .selection-label[data-region="FrenchGuiana"]')).toHaveText(['Kourou', 'Kourou', 'Kourou']);
  await expectProjectedCopies(page.locator('#pinnedRegionMarkers .pinned-outline[data-region="FrenchGuiana"]'));
  await expectProjectedCopies(page.locator('#regions .region[data-region="FrenchGuiana"]'));
  await expect(page.locator('#regions .region[data-region="FrenchGuiana"]')).toHaveClass([/pinned-node/, /pinned-node/, /pinned-node/]);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.pinnedRegionMarkerRebuilds).toBeGreaterThan(0);
});

test('world-wrap default projects manual recursive envelope copies', async ({ page }) => {
  await waitForWrappedMap(page);

  await chooseNation(page, 'China', 'CHN');
  await page.selectOption('#projectSel', 'Project_GreaterPanAsia');
  await expect(page.locator('.legendRegionItem[data-region-name="NorthHonshu"]').first()).toBeVisible();
  const northHonshuRow = page.locator('.legendRegionRow')
    .filter({ has: page.locator('.legendRegionItem[data-region-name="NorthHonshu"]') });
  await northHonshuRow.locator('.legendRegionItem').click();
  await page.selectOption('#claimMode', 'all');

  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-region="NorthHonshu"][data-envelope-depth="0"][data-envelope-source-count="2"]'));
  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap[data-region="NorthHonshu"]'));
  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-region="Luzon"][data-envelope-depth="1"][data-envelope-claimant="JPN"]'));
  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-fill[data-envelope-depth="0"]'));
  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-fill[data-envelope-depth="1"]'));
});

test('world-wrap default projects reachable capital candidate markers', async ({ page }) => {
  await waitForWrappedMap(page);

  await chooseNation(page, 'China', 'CHN');
  await expect(page.locator('#reachableCapitalsBtn')).toHaveText('Hide reachable capitals');
  await expect(page.locator('#reachableCapitalsBtn')).toHaveAttribute('aria-pressed', 'true');

  await expectProjectedCopies(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="NorthHonshu"]'));
  await expectProjectedCopies(page.locator('#reachableCapitalCandidates .reachable-capital-candidate-star[data-candidate-focus="NorthHonshu"]'));
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Assam"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates [data-candidate-pin]')).toHaveCount(0);
});

test('world-wrap default resolves copied hit paths to canonical region state', async ({ page }) => {
  await waitForWrappedMap(page);

  const copiedAmazonia = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-copy="-1"]');
  await copiedAmazonia.dispatchEvent('pointerover', { bubbles: true, clientX: 120, clientY: 120, pointerType: 'mouse' });
  await copiedAmazonia.dispatchEvent('pointermove', { bubbles: true, clientX: 126, clientY: 126, pointerType: 'mouse' });
  await expect(page.locator('#hoverPill')).toHaveText('Hover: BRA · Manaus');
  await expectProjectedCopies(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]'));

  await copiedAmazonia.dispatchEvent('click', { bubbles: true });
  await expect(page.locator('#search')).toHaveValue(/Brazil/);
  await expectProjectedCopies(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]'));
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText(['Manaus', 'Manaus', 'Manaus']);
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
});

test('world-wrap default applies search filtering to every copy without duplicating canonical state', async ({ page }) => {
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

test('world-wrap default panning updates viewBox and keeps horizontal offset bounded', async ({ page }) => {
  await waitForWrappedMap(page);

  const baseViewBox = await mapViewBox(page);
  const mapBox = await page.locator('#map').boundingBox();
  expect(mapBox).toBeTruthy();
  const start = {x: mapBox.x + mapBox.width * 0.45, y: mapBox.y + mapBox.height * 0.50};
  const east = {x: start.x + mapBox.width * 0.75, y: start.y};
  const west = {x: start.x - mapBox.width * 0.75, y: start.y};
  const minX = baseViewBox[0] - baseViewBox[2] / 2 - 0.0001;
  const maxX = baseViewBox[0] + baseViewBox[2] / 2 + 0.0001;
  let sawChangedX = false;

  for (let i = 0; i < 5; i += 1) {
    await dragMap(page, start, east);
    const nextViewBox = await mapViewBox(page);
    sawChangedX ||= Math.abs(nextViewBox[0] - baseViewBox[0]) > 0.01;
    expect(nextViewBox[0]).toBeGreaterThanOrEqual(minX);
    expect(nextViewBox[0]).toBeLessThan(maxX);
    expect(nextViewBox[1]).toBeCloseTo(baseViewBox[1], 6);
  }

  for (let i = 0; i < 5; i += 1) {
    await dragMap(page, start, west);
    const nextViewBox = await mapViewBox(page);
    sawChangedX ||= Math.abs(nextViewBox[0] - baseViewBox[0]) > 0.01;
    expect(nextViewBox[0]).toBeGreaterThanOrEqual(minX);
    expect(nextViewBox[0]).toBeLessThan(maxX);
    expect(nextViewBox[1]).toBeCloseTo(baseViewBox[1], 6);
  }

  expect(sawChangedX).toBe(true);
});

test('world-wrap default panning preserves click selection but suppresses drag selection', async ({ page }) => {
  await waitForWrappedMap(page);

  const amazon = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-copy="0"]');
  await dispatchPointerClick(amazon);
  await expect(page.locator('#search')).toHaveValue(/Brazil/);
  await expectProjectedCopies(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]'));
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText(['Manaus', 'Manaus', 'Manaus']);

  await page.locator('#hitRegions').dispatchEvent('click', {bubbles: true});
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);

  await dispatchPointerDragAndClick(amazon);
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
});

test('world-wrap default projects claim overlays and markers without pan churn', async ({ page }) => {
  await waitForWrappedMap(page, '/?debugRenderStats=1');

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(78);
  await expectProjectedCopies(page.locator('#claimOverlays .claim-overlay.owned-territory[data-region="Amazonia"]'));
  await expectProjectedCopies(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]'));

  const mapBox = await page.locator('#map').boundingBox();
  expect(mapBox).toBeTruthy();
  const start = await blankMapPoint(page);
  const end = {x: Math.min(mapBox.x + mapBox.width - 10, start.x + mapBox.width * 0.35), y: start.y};
  await page.mouse.move(start.x, start.y);
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, {steps: 8});
  await page.mouse.up();

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBe(0);
  expect(stats.claimOverlayDomReplacements).toBe(0);
  expect(stats.claimLabelDomReplacements).toBe(0);
  expect(stats.hoverOutlineReplacements).toBe(0);
  expect(stats.foreignHoverOverlayReplacements).toBe(0);
  expect(stats.capitalMarkerRebuilds).toBe(0);
});

test('world-wrap default hover claim overlays reuse cached descriptors across borders', async ({ page }) => {
  await waitForWrappedMap(page, '/?debugRenderStats=1');

  await hoverWrappedRegion(page, 'Amazonia');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#claimPill')).toContainText('Brazil');
  await expectProjectedCopies(page.locator('#hoverClaimPreviewOverlays .claim-overlay.owned-territory[data-preview="hover-claim"][data-region="Amazonia"]'));

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await hoverWrappedRegion(page, 'Bolivia');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#claimPill')).toContainText('Bolivia');
  await expectProjectedCopies(page.locator('#hoverClaimPreviewOverlays .claim-overlay.owned-territory[data-preview="hover-claim"][data-region="Bolivia"]'));

  await hoverWrappedRegion(page, 'Amazonia');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#claimPill')).toContainText('Brazil');
  await expectProjectedCopies(page.locator('#hoverClaimPreviewOverlays .claim-overlay.owned-territory[data-preview="hover-claim"][data-region="Amazonia"]'));

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelCacheHits).toBeGreaterThan(0);
  expect(stats.claimOverlayDescriptorCacheHits).toBeGreaterThan(0);
  expect(stats.claimLabelDescriptorCacheHits).toBe(0);
  expect(stats.claimOverlayInactiveBufferRebuilds).toBe(0);
  expect(stats.claimLabelInactiveBufferRebuilds).toBe(0);
  expect(stats.claimOverlayBufferSwaps).toBe(0);
  expect(stats.claimLabelBufferSwaps).toBe(0);
  expect(stats.claimOverlayStaleRenderSkips).toBe(0);
  expect(stats.claimLabelStaleRenderSkips).toBe(0);
});

test('world-wrap default secondary capital hover projects foreign preview copies', async ({ page }) => {
  await waitForWrappedMap(page, '/?debugRenderStats=1');

  await chooseNation(page, 'France', 'EUA');
  await expectProjectedCopies(page.locator('#claimOverlays .claim-overlay[data-region="Moskva"]'));

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await hoverWrappedRegion(page, 'Moskva', '1');
  await waitForHoverPreviewFrame(page);

  await expect(page.locator('#claimPill')).toContainText('France');
  await expectProjectedCopies(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-preview="secondary-capital"][data-nation="RUS"][data-regions~="Moskva"]'));
  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBe(0);
  expect(stats.secondaryHoverOverlayReplacements).toBeGreaterThan(0);
  expect(stats.secondaryHoverOverlayPathCount).toBeGreaterThan(0);
  expect(stats.secondaryHoverOverlayPathCount).toBeLessThan(stats.secondaryHoverOverlayRegionCount);
});

test('world-wrap default projects hover, selection, and foreign hover overlays', async ({ page }) => {
  await waitForWrappedMap(page);

  await chooseNation(page, 'Brazil', 'BRA');
  const copiedAmazonia = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-copy="-1"]');
  await copiedAmazonia.dispatchEvent('pointerover', { bubbles: true, clientX: 120, clientY: 120, pointerType: 'mouse' });
  await copiedAmazonia.dispatchEvent('pointermove', { bubbles: true, clientX: 126, clientY: 126, pointerType: 'mouse' });
  await expectProjectedCopies(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]'));

  await copiedAmazonia.dispatchEvent('click', { bubbles: true });
  await expectProjectedCopies(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]'));

  const copiedOntario = page.locator('#hitRegions .region-hit[data-region="Ontario"][data-wrap-copy="1"]');
  await copiedOntario.dispatchEvent('pointerover', { bubbles: true, clientX: 140, clientY: 140, pointerType: 'mouse' });
  await copiedOntario.dispatchEvent('pointermove', { bubbles: true, clientX: 146, clientY: 146, pointerType: 'mouse' });
  await expectProjectedCopies(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"][data-regions~="Ontario"]'));
});

test('world-wrap seam candidate geometry stays split into local subpaths', async ({ page }) => {
  await waitForWrappedMap(page);

  const geometry = await page.evaluate((candidateNames) => {
    function pointsForSubpath(subpath) {
      const numbers = [...subpath.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0]));
      const points = [];
      for (let i = 0; i < numbers.length - 1; i += 2) points.push({x: numbers[i], y: numbers[i + 1]});
      return points;
    }
    function pathSummary(region) {
      const subpaths = String(region.path || '')
        .split(/(?=M\s)/)
        .map(part => pointsForSubpath(part))
        .filter(points => points.length);
      const allX = subpaths.flatMap(points => points.map(point => point.x));
      const subpathSpans = subpaths.map(points => {
        const xs = points.map(point => point.x);
        return Math.max(...xs) - Math.min(...xs);
      });
      return {
        regionName: region.regionName,
        overallSpan: Math.max(...allX) - Math.min(...allX),
        maxSubpathSpan: Math.max(...subpathSpans),
        subpaths: subpaths.length,
      };
    }
    const regionPaths = [...document.querySelectorAll('#regions .region[data-wrap-copy="0"]')];
    const worldWidth = Number(document.querySelector('#regions .region-copy[data-wrap-copy="1"]')?.dataset.wrapOffset)
      || document.querySelector('#map').viewBox.baseVal.width;
    const byName = new Map(regionPaths.map(path => [path.dataset.region, {
      regionName: path.dataset.region,
      path: path.getAttribute('d') || '',
    }]));
    return {
      worldWidth,
      candidates: candidateNames.map(name => pathSummary(byName.get(name))),
      wideRegions: [...byName.values()]
        .map(pathSummary)
        .filter(summary => summary.overallSpan > worldWidth * 0.75)
        .sort((a, b) => b.overallSpan - a.overallSpan),
    };
  }, SEAM_CANDIDATES);

  expect(geometry.candidates.map(summary => summary.regionName)).toEqual(SEAM_CANDIDATES);
  for (const summary of geometry.candidates) {
    expect(summary.subpaths).toBeGreaterThan(0);
    expect(summary.maxSubpathSpan).toBeLessThan(geometry.worldWidth / 2);
  }
  expect(geometry.wideRegions.map(summary => summary.regionName)).toEqual([
    'Melanesia',
    'Alaska',
    'NewZealand',
    'FrenchPacific',
    'AmericanPacific',
    'Micronesia',
  ]);
  for (const summary of geometry.wideRegions) {
    expect(summary.maxSubpathSpan).toBeLessThan(geometry.worldWidth / 2);
  }
});

test('world-wrap seam candidates keep hit, selection, and claim overlays projected', async ({ page }) => {
  await waitForWrappedMap(page);

  for (const regionName of SEAM_CANDIDATES) {
    await expectProjectedRegion(page, '#regions .region', regionName);
    await expectProjectedRegion(page, '#hitRegions .region-hit', regionName);

    const copiedHit = page.locator(`#hitRegions .region-hit[data-region="${regionName}"][data-wrap-copy="-1"]`);
    await copiedHit.dispatchEvent('pointerover', { bubbles: true, clientX: 120, clientY: 120, pointerType: 'mouse' });
    await copiedHit.dispatchEvent('pointermove', { bubbles: true, clientX: 126, clientY: 126, pointerType: 'mouse' });
    await expectProjectedRegion(page, '#hoverOutlines .hover-fill', regionName);

    await copiedHit.dispatchEvent('click', { bubbles: true });
    await expectProjectedRegion(page, '#selectionOutlines .selection-label', regionName);
    await page.locator('#hitRegions').dispatchEvent('click', { bubbles: true });
    await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
    await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
  }

  await chooseNation(page, 'United States', 'USA');
  await expectProjectedRegion(page, '#claimOverlays .claim-overlay.owned-territory', 'Alaska');
  await expectProjectedRegion(page, '#claimOverlays .claim-overlay.owned-territory', 'AmericanPacific');

  await chooseNation(page, 'Russia', 'RUS');
  await expectProjectedRegion(page, '#claimOverlays .claim-overlay.owned-territory', 'Kamchatka');
  await expectProjectedRegion(page, '#claimOverlays .claim-overlay.owned-territory', 'RussianFarEast');
  await expectProjectedRegion(page, '#claimOverlays .claim-overlay.owned-territory', 'SakhalinKurils');
});

test('world-wrap panning is disabled through the fallback query flag', async ({ page }) => {
  await waitForSingleCopyMap(page);

  const baseViewBox = await mapViewBox(page);
  const mapBox = await page.locator('#map').boundingBox();
  expect(mapBox).toBeTruthy();
  const start = {x: mapBox.x + mapBox.width * 0.45, y: mapBox.y + mapBox.height * 0.50};
  await dragMap(page, start, {x: start.x + mapBox.width * 0.75, y: start.y});
  expect(await mapViewBox(page)).toEqual(baseViewBox);
});

test('issue #2 acceptance: horizontal panning passes west and east map edges without a hard stop', async ({ page }) => {
  await waitForWrappedMap(page);

  await expect(page.locator('#regions .region-copy')).toHaveCount(3);
  await expect(page.locator('#hitRegions .hit-copy')).toHaveCount(3);
  const baseViewBox = await mapViewBox(page);
  const mapBox = await page.locator('#map').boundingBox();
  expect(mapBox).toBeTruthy();
  const start = {x: mapBox.x + mapBox.width * 0.50, y: mapBox.y + mapBox.height * 0.52};
  const east = {x: start.x + mapBox.width * 0.95, y: start.y};
  const west = {x: start.x - mapBox.width * 0.95, y: start.y};
  const minX = baseViewBox[0] - baseViewBox[2] / 2 - 0.0001;
  const maxX = baseViewBox[0] + baseViewBox[2] / 2 + 0.0001;
  const samples = [];

  for (let i = 0; i < 8; i += 1) {
    await dragMap(page, start, east, 10);
    samples.push(await mapViewBox(page));
  }
  for (let i = 0; i < 8; i += 1) {
    await dragMap(page, start, west, 10);
    samples.push(await mapViewBox(page));
  }

  for (const viewBox of samples) {
    expect(viewBox[0]).toBeGreaterThanOrEqual(minX);
    expect(viewBox[0]).toBeLessThan(maxX);
    expect(viewBox[1]).toBeCloseTo(baseViewBox[1], 6);
  }
  const distinctXValues = new Set(samples.map(viewBox => viewBox[0].toFixed(3)));
  expect(distinctXValues.size).toBeGreaterThan(3);
  expect(samples.some(viewBox => Math.abs(viewBox[0] - baseViewBox[0]) > 0.1)).toBe(true);
});

test('issue #2 acceptance: wrapped copy hover and click resolve to the same canonical region', async ({ page }) => {
  await waitForWrappedMap(page);

  for (const copy of ['-1', '1']) {
    const copiedAmazonia = page.locator(`#hitRegions .region-hit[data-region="Amazonia"][data-wrap-copy="${copy}"]`);
    await copiedAmazonia.dispatchEvent('pointerover', { bubbles: true, clientX: 120, clientY: 120, pointerType: 'mouse' });
    await copiedAmazonia.dispatchEvent('pointermove', { bubbles: true, clientX: 126, clientY: 126, pointerType: 'mouse' });
    await expect(page.locator('#hoverPill')).toHaveText(/Hover: BRA .* Manaus/);
    await expectProjectedCopies(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]'));

    await copiedAmazonia.dispatchEvent('click', { bubbles: true });
    await expect(page.locator('#search')).toHaveValue(/Brazil/);
    await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
    await expectProjectedCopies(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]'));

    await page.locator('#hitRegions').dispatchEvent('click', { bubbles: true });
    await expect(page.locator('#search')).toHaveValue('');
    await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
  }
});

test('issue #2 acceptance: selected claim overlays render on every visible world copy', async ({ page }) => {
  await waitForWrappedMap(page);

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(78);
  await expectProjectedCopies(page.locator('#claimOverlays .claim-overlay.owned-territory[data-region="Amazonia"]'));
  await expectProjectedCopies(page.locator('#claimOverlays .claim-overlay[data-region="FrenchGuiana"]'));

  await page.selectOption('#claimKind', 'peaceful');
  await expectProjectedCopies(page.locator('#claimOverlays .claim-overlay.owned-territory[data-region="Amazonia"]'));

  await page.selectOption('#claimKind', 'all');
  await page.selectOption('#projectSel', 'Project_GranColombia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(42);
  await expectProjectedCopies(page.locator('#claimOverlays .claim-overlay.owned-territory[data-region="Amazonia"]'));
});
