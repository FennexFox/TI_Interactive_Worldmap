// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  blankMapPoint,
  chooseNation,
  debugRenderStats,
  expect,
  hoverRegion,
  mapViewBox,
  pinReachableCapitalCandidates,
  regionTarget,
  resetDebugRenderStats,
  test,
  waitForAnimationFrames,
  zoomInMap,
} from '../fixtures/app.js';

test('pre-drag click hold still allows hit-layer hover updates', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await hoverRegion(page, 'Amazonia');
  await expect(page.locator('#hoverPill')).toContainText('BRA');

  await regionTarget(page, 'Amazonia').dispatchEvent('pointerdown', {
    bubbles: true,
    button: 0,
    pointerId: 41,
    pointerType: 'mouse',
    clientX: 200,
    clientY: 200,
  });
  await regionTarget(page, 'Bolivia').dispatchEvent('pointerover', {
    bubbles: true,
    pointerId: 41,
    pointerType: 'mouse',
    clientX: 201,
    clientY: 201,
  });
  await regionTarget(page, 'Bolivia').dispatchEvent('pointermove', {
    bubbles: true,
    pointerId: 41,
    pointerType: 'mouse',
    clientX: 201,
    clientY: 201,
  });

  await expect(page.locator('#hoverPill')).toContainText('BOL');
  await expect(page.locator('#map')).toHaveClass(/is-panning-ready/);
  await expect(page.locator('#map')).not.toHaveClass(/(^|\s)is-panning(\s|$)/);

  await page.locator('#map').dispatchEvent('pointerup', {
    bubbles: true,
    pointerId: 41,
    pointerType: 'mouse',
    clientX: 201,
    clientY: 201,
  });
  await expect(page.locator('#map')).not.toHaveClass(/is-panning-ready/);
});

test('zoomed plain map pan records counters without grid rebuilds', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await zoomInMap(page);
  await expect(page.locator('#grid .graticule')).toHaveCount(23);

  const mapBox = await page.locator('#map').boundingBox();
  expect(mapBox).toBeTruthy();
  const start = await blankMapPoint(page);
  const end = {x: Math.min(mapBox.x + mapBox.width - 20, start.x + 360), y: start.y + 18};
  const beforeViewBox = await mapViewBox(page);

  await page.mouse.move(start.x, start.y);
  await waitForAnimationFrames(page, 2);
  await resetDebugRenderStats(page);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, {steps: 12});
  await waitForAnimationFrames(page, 3);

  const duringStats = await debugRenderStats(page);
  const duringViewBox = await mapViewBox(page);
  expect(Math.abs(duringViewBox[0] - beforeViewBox[0])).toBeGreaterThan(0.01);
  expect(duringStats.panPointerMoveCount).toBeGreaterThan(0);
  expect(duringStats.panViewBoxApplyCount).toBeGreaterThan(0);
  expect(duringStats.panFrameMsCount).toBeGreaterThan(0);
  expect(duringStats.gridRebuildsDuringPan).toBe(0);
  expect(duringStats.panSvgRectReads).toBeLessThanOrEqual(1);
  expect(duringStats.visibleSvgNodeCount).toBeGreaterThan(0);
  expect(duringStats.gridRenderMsCount).toBe(0);

  await page.mouse.up();
  await waitForAnimationFrames(page, 3);
  await expect(page.locator('#grid .graticule')).toHaveCount(23);
});

test('map pan after multiple reachable capital pins avoids hover and marker churn during drag', async ({page}) => {
  await page.goto('/?debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await zoomInMap(page);
  await chooseNation(page, 'China', 'CHN');
  await pinReachableCapitalCandidates(page, 3);

  const mapBox = await page.locator('#map').boundingBox();
  expect(mapBox).toBeTruthy();
  const start = await blankMapPoint(page);
  const end = {x: Math.min(mapBox.x + mapBox.width - 20, start.x + 420), y: start.y + 20};
  const beforeViewBox = await mapViewBox(page);

  await page.mouse.move(start.x, start.y);
  await waitForAnimationFrames(page, 2);
  await resetDebugRenderStats(page);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, {steps: 12});
  await waitForAnimationFrames(page, 3);

  const duringStats = await debugRenderStats(page);
  const duringViewBox = await mapViewBox(page);
  expect(Math.abs(duringViewBox[0] - beforeViewBox[0])).toBeGreaterThan(0.01);
  expect(duringStats.panPointerMoveCount).toBeGreaterThan(0);
  expect(duringStats.panViewBoxApplyCount).toBeGreaterThan(0);
  expect(duringStats.panFrameMsCount).toBeGreaterThan(0);
  expect(duringStats.gridRebuildsDuringPan).toBe(0);
  expect(duringStats.panSvgRectReads).toBeLessThanOrEqual(1);
  expect(duringStats.visibleSvgNodeCount).toBeGreaterThan(0);
  expect(duringStats.gridRenderMsCount).toBe(0);
  expect(duringStats.reachableCapitalCandidateRebuilds).toBe(0);
  expect(duringStats.capitalMarkerRebuilds).toBe(0);
  expect(duringStats.manualEnvelopeRebuilds).toBe(0);
  expect(duringStats.hoverOutlineReplacements).toBe(0);
  expect(duringStats.foreignHoverOverlayReplacements).toBe(0);
  expect(duringStats.fullVisualStateApplications).toBe(0);

  await expect(page.locator('#map')).toHaveClass(/(^|\s)is-panning(\s|$)/);
  const panningMarkerPaint = await page.evaluate(() => {
    const styleFor = selector => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const style = getComputedStyle(node);
      return {display: style.display, filter: style.filter};
    };
    return {
      capitalStar: styleFor('#capitalMarkers .capital-star'),
      capitalShadow: styleFor('#capitalMarkers .capital-star-shadow'),
      pinnedCapitalShadow: styleFor('#pinnedRegionMarkers .capital-star-shadow'),
      pinnedGlow: styleFor('#pinnedRegionMarkers .pinned-outline-glow'),
      selectionGlow: styleFor('#selectionOutlines .selection-outline-glow'),
      reachableCapitalShadow: styleFor('#reachableCapitalCandidates .capital-star-shadow'),
    };
  });
  expect(panningMarkerPaint.capitalStar?.filter).toBe('none');
  expect(panningMarkerPaint.capitalShadow?.display).toBe('none');
  expect(panningMarkerPaint.pinnedCapitalShadow?.display).toBe('none');
  expect(panningMarkerPaint.pinnedGlow?.display).toBe('none');
  expect(panningMarkerPaint.selectionGlow?.display).toBe('none');
  expect(panningMarkerPaint.reachableCapitalShadow?.display).toBe('none');

  await page.mouse.up();
  await waitForAnimationFrames(page, 3);
  await hoverRegion(page, 'Moskva');
  await expect(page.locator('#hoverPill')).not.toHaveText('Hover: -');
});
