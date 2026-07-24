// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  blankMapPoint,
  chooseNation,
  dispatchPointerClick,
  dispatchPointerDragAndClick,
  dragMap,
  expect,
  expectProjectedCopies,
  expectProjectedGroupedRegion,
  expectProjectedRegion,
  groupedVisualRegionCount,
  hoverWrappedRegion,
  mapViewBox,
  pathWithQueryParam,
  regionHit,
  test,
  waitForAnimationFrames,
  waitForHoverPreviewFrame,
  waitForSingleCopyMap,
  waitForWrappedMap,
} from '../fixtures/app.js';

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
  await expect.poll(async () => wrapToggle.evaluate(el => {
    const color = getComputedStyle(el).backgroundColor;
    const alphaMatch = color.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
    return alphaMatch ? Number(alphaMatch[1]) : 1;
  })).toBeGreaterThan(0.8);
  await expect(page.locator('#regions .region-copy')).toHaveCount(3);
  await expect(page.locator('#hitRegions .hit-copy')).toHaveCount(3);
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).toHaveCount(3);
  await expectProjectedCopies(page.locator('#hitRegions .region-hit[data-region="Amazonia"]'));
});

test('debug render stats reset preserves current world-wrap state', async ({ page }) => {
  await waitForSingleCopyMap(page, '/?worldWrap=0&debugRenderStats=1');

  const wrapToggle = page.locator('[data-map-view-wrap-toggle]');
  await expect(wrapToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#regions .region-copy')).toHaveCount(0);

  await wrapToggle.click();
  await expect(wrapToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#regions .region-copy')).toHaveCount(3);

  const stats = await page.evaluate(() => {
    window.__TI_DEBUG_RENDER_STATS__.reset();
    return {...window.__TI_DEBUG_RENDER_STATS__};
  });

  expect(stats.worldWrapDisabled).toBe(0);
  expect(stats.worldCopyContextCount).toBe(3);
});

test('debug render stats sample single-copy region geometry counters', async ({ page }) => {
  await waitForSingleCopyMap(page, '/?worldWrap=0&debugRenderStats=1');

  const counters = await page.evaluate(() => {
    const count = selector => document.querySelectorAll(selector).length;
    const dBytes = selector => [...document.querySelectorAll(selector)]
      .reduce((sum, element) => sum + String(element.getAttribute('d') || '').length, 0);
    const stats = {...window.__TI_DEBUG_RENDER_STATS__};
    return {
      stats,
      actual: {
        baseRegionPathCount: count('#regions path.region'),
        baseRegionUseCount: count('#regions use.region'),
        hitPathCount: count('#hitRegions path.region-hit'),
        hitUseCount: count('#hitRegions use.region-hit'),
        worldCopyBasePathCount: count('#regions path.region[data-wrap-canonical="0"]'),
        worldCopyHitPathCount: count('#hitRegions path.region-hit[data-wrap-canonical="0"]'),
        baseRegionPathDBytes: dBytes('#regions path.region'),
        hitPathDBytes: dBytes('#hitRegions path.region-hit'),
        canonicalRegionPathCount: count('#regions path.region[data-wrap-canonical="1"]'),
        canonicalHitPathCount: count('#hitRegions path.region-hit[data-wrap-canonical="1"]'),
      },
    };
  });

  expect(counters.stats.baseRegionPathCount).toBe(counters.actual.baseRegionPathCount);
  expect(counters.stats.baseRegionUseCount).toBe(0);
  expect(counters.stats.hitPathCount).toBe(counters.actual.hitPathCount);
  expect(counters.stats.hitUseCount).toBe(0);
  expect(counters.stats.worldCopyBasePathCount).toBe(0);
  expect(counters.stats.worldCopyHitPathCount).toBe(0);
  expect(counters.stats.baseRegionPathCount).toBeGreaterThan(300);
  expect(counters.stats.hitPathCount).toBe(counters.stats.baseRegionPathCount);
  expect(counters.stats.baseRegionPathDBytes).toBe(counters.actual.baseRegionPathDBytes);
  expect(counters.stats.hitPathDBytes).toBe(counters.actual.hitPathDBytes);
  expect(counters.stats.totalRegionPathDBytes).toBe(counters.actual.baseRegionPathDBytes + counters.actual.hitPathDBytes);
  expect(counters.stats.canonicalRegionPathCount).toBe(counters.actual.canonicalRegionPathCount);
  expect(counters.stats.canonicalHitPathCount).toBe(counters.actual.canonicalHitPathCount);
});

test('debug render stats sample wrapped region geometry counters', async ({ page }) => {
  await waitForWrappedMap(page, '/?debugRenderStats=1');

  const counters = await page.evaluate(() => {
    const count = selector => document.querySelectorAll(selector).length;
    const dBytes = selector => [...document.querySelectorAll(selector)]
      .reduce((sum, element) => sum + String(element.getAttribute('d') || '').length, 0);
    const stats = {...window.__TI_DEBUG_RENDER_STATS__};
    return {
      stats,
      actual: {
        baseRegionPathCount: count('#regions path.region'),
        baseRegionUseCount: count('#regions use.region'),
        hitPathCount: count('#hitRegions path.region-hit'),
        hitUseCount: count('#hitRegions use.region-hit'),
        worldCopyBasePathCount: count('#regions path.region[data-wrap-canonical="0"]'),
        worldCopyHitPathCount: count('#hitRegions path.region-hit[data-wrap-canonical="0"]'),
        baseRegionPathDBytes: dBytes('#regions path.region'),
        hitPathDBytes: dBytes('#hitRegions path.region-hit'),
        canonicalRegionPathDBytes: dBytes('#regions path.region[data-wrap-canonical="1"]'),
        canonicalHitPathDBytes: dBytes('#hitRegions path.region-hit[data-wrap-canonical="1"]'),
      },
    };
  });

  expect(counters.stats.worldCopyContextCount).toBe(3);
  expect(counters.stats.baseRegionPathCount).toBe(counters.actual.baseRegionPathCount);
  expect(counters.stats.baseRegionUseCount).toBe(0);
  expect(counters.stats.hitPathCount).toBe(counters.actual.hitPathCount);
  expect(counters.stats.hitUseCount).toBe(0);
  expect(counters.stats.worldCopyBasePathCount).toBe(counters.actual.worldCopyBasePathCount);
  expect(counters.stats.worldCopyHitPathCount).toBe(counters.actual.worldCopyHitPathCount);
  expect(counters.stats.worldCopyBasePathCount).toBeGreaterThan(0);
  expect(counters.stats.worldCopyHitPathCount).toBeGreaterThan(0);
  expect(counters.stats.baseRegionPathDBytes).toBe(counters.actual.baseRegionPathDBytes);
  expect(counters.stats.hitPathDBytes).toBe(counters.actual.hitPathDBytes);
  expect(counters.stats.totalRegionPathDBytes).toBe(counters.actual.baseRegionPathDBytes + counters.actual.hitPathDBytes);
  expect(counters.stats.baseRegionPathDBytes).toBeGreaterThan(counters.actual.canonicalRegionPathDBytes);
  expect(counters.stats.hitPathDBytes).toBeGreaterThan(counters.actual.canonicalHitPathDBytes);
});

test('debug canonical hit paths preserve single-copy hover and click', async ({ page }) => {
  await waitForSingleCopyMap(page, '/?worldWrap=0&debugRenderStats=1&debugUseCanonicalHitPaths=1');

  await expect(page.locator('#hitRegions path.region-hit')).toHaveCount(0);
  const hitUses = page.locator('#hitRegions use.region-hit');
  await expect(hitUses.first()).toBeVisible();
  await expect(page.locator('#hitRegions path.region-hit-geometry')).toHaveCount(await hitUses.count());

  const amazon = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-canonical="1"]');
  await amazon.hover();
  await expect(page.locator('#hoverPill')).toHaveText('Hover: BRA · Manaus');

  await amazon.dispatchEvent('click', { bubbles: true });
  await expect(page.locator('#search')).toHaveValue(/Brazil/);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.debugCanonicalHitPaths).toBe(1);
  expect(stats.hitPathCount).toBe(0);
  expect(stats.hitUseCount).toBeGreaterThan(300);
  expect(stats.hitGeometryDefPathCount).toBe(stats.hitUseCount);
  expect(stats.hitGeometryDefPathDBytes).toBeGreaterThan(0);
  expect(stats.totalHitGeometryDBytes).toBe(stats.hitGeometryDefPathDBytes);
});

test('debug canonical hit paths preserve wrapped seam hover and click', async ({ page }) => {
  await waitForWrappedMap(page, '/?debugRenderStats=1&debugUseCanonicalHitPaths=1');

  await expectProjectedCopies(page.locator('#hitRegions .region-hit[data-region="Amazonia"]'));
  await expect(page.locator('#hitRegions path.region-hit')).toHaveCount(0);
  await expect(page.locator('#hitRegions use.region-hit[data-region="Amazonia"]')).toHaveCount(3);

  const copiedAmazonia = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-copy="-1"]');
  await hoverWrappedRegion(page, 'Amazonia', '-1');
  await expect(page.locator('#hoverPill')).toHaveText('Hover: BRA · Manaus');

  await dispatchPointerClick(copiedAmazonia);
  await expect(page.locator('#search')).toHaveValue(/Brazil/);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.debugCanonicalHitPaths).toBe(1);
  expect(stats.worldCopyHitPathCount).toBe(0);
  expect(stats.worldCopyHitUseCount).toBeGreaterThan(0);
  expect(stats.hitGeometryDefPathCount).toBeGreaterThan(300);
  expect(stats.totalHitGeometryDBytes).toBeLessThan(stats.baseRegionPathDBytes);
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
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group')).toBe(78);
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'Amazonia');
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
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group', 'Moskva');

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
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'Alaska');
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'AmericanPacific');

  await chooseNation(page, 'Russia', 'RUS');
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'Kamchatka');
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'RussianFarEast');
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'SakhalinKurils');
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
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group')).toBe(78);
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'Amazonia');
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group', 'FrenchGuiana');

  await page.selectOption('#claimKind', 'peaceful');
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'Amazonia');

  await page.selectOption('#claimKind', 'all');
  await page.selectOption('#projectSel', 'Project_GranColombia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group')).toBe(42);
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'Amazonia');
});
