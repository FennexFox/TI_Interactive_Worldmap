// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  blankMapPoint,
  chooseNation,
  clearMap,
  clickRegion,
  debugRenderStats,
  expect,
  expectGroupedClaimRegion,
  groupedClaimRegionCount,
  hoverRegion,
  hoverRegionWithMouse,
  mapViewBox,
  pinFirstReachableCapitalCandidate,
  pinReachableCapitalCandidates,
  regionTarget,
  resetDebugRenderStats,
  test,
  waitForAnimationFrames,
  waitForHoverPreviewFrame,
  zoomInMap,
} from '../fixtures/app.js';

test('debug render stats capture real pointer hover baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.__TI_DEBUG_RENDER_STATS__))).toBe(false);

  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.__TI_DEBUG_RENDER_STATS__))).toBe(true);
  await expect.poll(() => page.evaluate(() => typeof window.__TI_DEBUG_RENDER_STATS__.reset)).toBe('function');
  await expect.poll(() => page.evaluate(() => Object.keys(window.__TI_DEBUG_RENDER_STATS__).includes('reset'))).toBe(false);
  await expect.poll(() => page.evaluate(() => Object.keys(window.__TI_DEBUG_RENDER_STATS__))).toEqual(expect.arrayContaining([
    'manualEnvelopeModelBuilds',
    'manualEnvelopeModelCacheHits',
    'reachableCapitalCandidateDescriptorBuilds',
    'reachableCapitalCandidateDescriptorCacheHits',
    'hostileHatchDisabled',
    'foreignHoverOverlayPathCount',
    'foreignHoverOverlayRegionCount',
    'secondaryHoverOverlayPathCount',
    'secondaryHoverOverlayRegionCount',
    'labelCount',
    'labelCopyGroupCount',
    'wrappedLabelCopyCount',
    'labelRenderCalls',
    'labelDomReplacements',
    'labelRenderSkippedByDebug',
    'labelVisibleState',
    'debugLabelsDisabled',
    'mapViewX',
    'mapViewY',
    'mapViewWidth',
    'mapViewHeight',
    'mapZoomX',
    'mapZoomY',
    'mapZoomArea',
  ]));
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toContainText('Brazil');

  await hoverRegionWithMouse(page, 'Amazonia');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);

  await hoverRegionWithMouse(page, 'Ontario');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Ontario"]')).toHaveCount(0);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"]')).not.toHaveCount(0);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.fullVisualStateApplications).toBeGreaterThan(0);
  expect(stats.boundedVisualStateApplications).toBeGreaterThan(0);
  expect(stats.visiblePathsTouched).toBeGreaterThan(0);
  expect(stats.hitPathsTouched).toBeGreaterThan(0);
  expect(stats.overlayModelBuilds).toBeGreaterThan(0);
  expect(stats.claimOverlayDomReplacements).toBeGreaterThan(0);
  expect(stats.claimLabelDomReplacements).toBeGreaterThan(0);
  expect(stats.hoverOutlineReplacements).toBeGreaterThan(0);
  expect(stats.foreignHoverOverlayReplacements).toBeGreaterThan(0);
  expect(stats.foreignHoverOverlayPathCount).toBeGreaterThan(0);
  expect(stats.foreignHoverOverlayPathCount).toBeLessThan(stats.foreignHoverOverlayRegionCount);
  expect(stats.capitalMarkerRebuilds).toBeGreaterThan(0);
});

test('simple selected-overlay claim hover movement uses bounded visual updates', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  expect(await groupedClaimRegionCount(page)).toBe(26);

  await hoverRegionWithMouse(page, 'Amazonia');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());

  await hoverRegionWithMouse(page, 'FrenchGuiana');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="FrenchGuiana"]')).toHaveCount(1);
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  expect(await groupedClaimRegionCount(page)).toBe(26);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.boundedVisualStateApplications).toBeGreaterThan(0);
  expect(stats.fullVisualStateApplications).toBe(0);
  expect(stats.visiblePathsTouched).toBeLessThanOrEqual(2);
  expect(stats.hitPathsTouched).toBeLessThanOrEqual(2);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  const blankPoint = await blankMapPoint(page);
  await page.mouse.move(blankPoint.x, blankPoint.y);
  await expect(page.locator('#hoverPill')).toHaveText('Hover: -');

  const clearStats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(clearStats.boundedVisualStateApplications).toBeGreaterThan(0);
  expect(clearStats.fullVisualStateApplications).toBe(0);
  expect(clearStats.visiblePathsTouched).toBeLessThanOrEqual(1);
  expect(clearStats.hitPathsTouched).toBeLessThanOrEqual(1);
});

test('settled same-nation hover preview uses bounded visual updates', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await hoverRegionWithMouse(page, 'Amazonia');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());

  await hoverRegionWithMouse(page, 'Belem');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Belem"]')).toHaveCount(1);
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.boundedVisualStateApplications).toBeGreaterThan(0);
  expect(stats.fullVisualStateApplications).toBe(0);
  expect(stats.overlayModelBuilds).toBe(0);
  expect(stats.visiblePathsTouched).toBeLessThanOrEqual(2);
  expect(stats.hitPathsTouched).toBeLessThanOrEqual(2);
});


test('border hover preview updates next frame using lightweight preview overlay', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await hoverRegion(page, 'Bolivia');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('BOL');
  await expect(page.locator('#claimPill')).toContainText('Bolivia');
  await expect(page.locator('#hoverClaimPreviewOverlays .claim-overlay[data-preview="hover-claim"][data-nation="BOL"]')).not.toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#claimLabels .claim-label')).toHaveCount(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await hoverRegion(page, 'Amazonia');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('BRA');
  await expect(page.locator('#claimPill')).toContainText('Brazil');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
  await expect(page.locator('#hoverClaimPreviewOverlays .claim-overlay[data-preview="hover-claim"][data-nation="BRA"]')).not.toHaveCount(0);

  await hoverRegion(page, 'Bolivia');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('BOL');
  await expect(page.locator('#claimPill')).toContainText('Bolivia');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Bolivia"]')).toHaveCount(1);
  await expect(page.locator('#hoverClaimPreviewOverlays .claim-overlay[data-preview="hover-claim"][data-nation="BOL"]')).not.toHaveCount(0);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBeGreaterThan(0);
  expect(stats.overlayModelCacheHits).toBeGreaterThan(0);
  expect(stats.foreignHoverDescriptorBuilds).toBe(0);
  expect(stats.foreignHoverDescriptorCacheHits).toBe(0);
  expect(stats.claimOverlayDescriptorBuilds).toBeGreaterThan(0);
  expect(stats.claimOverlayDescriptorCacheHits).toBeGreaterThan(0);
  expect(stats.claimLabelDescriptorBuilds).toBe(0);
  expect(stats.claimLabelDescriptorCacheHits).toBe(0);
  expect(stats.claimOverlayInactiveBufferRebuilds).toBe(0);
  expect(stats.claimLabelInactiveBufferRebuilds).toBe(0);
  expect(stats.claimOverlayBufferSwaps).toBe(0);
  expect(stats.claimLabelBufferSwaps).toBe(0);
});


test('unpinned hover preview leaves committed claim overlay empty until selection', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1&debugClaimOverlayDelayFrames=6');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await hoverRegion(page, 'Amazonia');
  await waitForAnimationFrames(page, 10);
  await expect(page.locator('#hoverPill')).toContainText('BRA');
  await expect(page.locator('#claimPill')).toContainText('Brazil');
  await expect(page.locator('#hoverClaimPreviewOverlays .claim-overlay[data-preview="hover-claim"][data-nation="BRA"]')).not.toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#claimLabels .claim-label')).toHaveCount(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await hoverRegion(page, 'Bolivia');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('BOL');
  await expect(page.locator('#claimPill')).toContainText('Bolivia');
  await expect(page.locator('#hoverClaimPreviewOverlays .claim-overlay[data-preview="hover-claim"][data-nation="BOL"]')).not.toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);

  let stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.claimOverlayInactiveBufferRebuilds).toBe(0);
  expect(stats.claimLabelInactiveBufferRebuilds).toBe(0);
  expect(stats.claimOverlayBufferSwaps).toBe(0);
  expect(stats.claimLabelBufferSwaps).toBe(0);

  await clickRegion(page, 'Bolivia');
  await expect(page.locator('#claimPill')).toContainText('Bolivia');
  await expectGroupedClaimRegion(page, 'Bolivia', '#claimOverlays .claim-fill-group.owned-territory');
  await expect(page.locator('#nationInfo')).toContainText('Bolivia');
});

test('secondary capital hover previews a foreign nation inside selected expansion range', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'France', 'EUA');
  await expect(page.locator('#claimPill')).toContainText('France');
  await expectGroupedClaimRegion(page, 'Paris');
  await expectGroupedClaimRegion(page, 'Moskva');

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await hoverRegion(page, 'Moskva');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('RUS');
  await expect(page.locator('#claimPill')).toContainText('France');
  await expectGroupedClaimRegion(page, 'Paris');
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-preview="secondary-capital"][data-nation="RUS"]')).not.toHaveCount(0);
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-regions~="Moskva"][data-nation="RUS"]')).toHaveCount(1);
  let stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBe(0);
  expect(stats.foreignHoverDescriptorBuilds).toBeGreaterThan(0);

  await hoverRegion(page, 'Kharkiv');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('UKR');
  await expect(page.locator('#claimPill')).toContainText('France');
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview')).toHaveCount(0);
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Kharkiv"]')).toHaveCount(1);
  await expectGroupedClaimRegion(page, 'Paris');

  await hoverRegion(page, 'Paris');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('EUA');
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview')).toHaveCount(0);
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Paris"]')).toHaveCount(1);

  await hoverRegion(page, 'Brasilia');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('BRA');
  await expect(page.locator('#claimPill')).toContainText('France');
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview')).toHaveCount(0);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="BRA"]')).not.toHaveCount(0);

  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBe(0);
});



test('unlocked hover preview uses lightweight overlay and leaves committed detail panel stable', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#nationInfo')).toContainText('Click a region on the map.');

  await hoverRegion(page, 'Amazonia');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#claimPill')).toContainText('Brazil');
  await expect(page.locator('#hoverClaimPreviewOverlays .claim-overlay[data-preview="hover-claim"][data-nation="BRA"]')).not.toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#nationInfo')).toContainText('Click a region on the map.');

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toContainText('Brazil');
  await expectGroupedClaimRegion(page, 'Amazonia');
  await expect(page.locator('#nationInfo')).toContainText('Brazil');
});

test('overlay model cache reuses unchanged inputs and misses changed filters', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  expect(await groupedClaimRegionCount(page)).toBe(26);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  let stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelCacheHits).toBeGreaterThan(0);
  expect(stats.overlayModelBuilds).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.selectOption('#projectSel', 'Project_GranColombia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 5, research tiers 1');
  expect(await groupedClaimRegionCount(page)).toBe(14);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBeGreaterThan(0);
  expect(stats.overlayModelCacheHits).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.selectOption('#claimMode', 'all');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  expect(await groupedClaimRegionCount(page)).toBe(26);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelCacheHits).toBeGreaterThan(0);
  expect(stats.overlayModelBuilds).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.selectOption('#claimKind', 'hostile');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 11, research tiers 1');
  expect(await groupedClaimRegionCount(page)).toBe(20);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBeGreaterThan(0);
  expect(stats.overlayModelCacheHits).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.selectOption('#claimKind', 'all');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelCacheHits).toBeGreaterThan(0);
  expect(stats.overlayModelBuilds).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await clickRegion(page, 'Amazonia');
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText('Manaus');
  await expect(page.locator('.claimListItem[data-claim-kind="incoming"]')).toHaveCount(3);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBeGreaterThan(0);
  expect(stats.overlayModelCacheHits).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('.claimListItem[data-claim-kind="incoming"]')).toHaveCount(3);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelCacheHits).toBeGreaterThan(0);
  expect(stats.overlayModelBuilds).toBe(0);
});

test('overlay render skip keys avoid unchanged DOM replacement', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  expect(await groupedClaimRegionCount(page)).toBe(26);
  await expect(page.locator('#claimLabels .claim-label')).not.toHaveCount(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await chooseNation(page, 'Brazil', 'BRA');
  expect(await groupedClaimRegionCount(page)).toBe(26);
  let stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.claimOverlayDomReplacements).toBe(0);
  expect(stats.claimLabelDomReplacements).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.selectOption('#languageSel', 'ko');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('#claimLabels .claim-label')).not.toHaveCount(0);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.claimOverlayDomReplacements).toBe(0);
  expect(stats.claimLabelDomReplacements).toBeGreaterThan(0);
  expect(stats.claimOverlayBufferSwaps).toBe(0);
  expect(stats.claimLabelBufferSwaps).toBeGreaterThan(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.selectOption('#languageSel', 'en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.claimOverlayDomReplacements).toBe(0);
  expect(stats.claimLabelDomReplacements).toBeGreaterThan(0);
  expect(stats.claimOverlayBufferSwaps).toBe(0);
  expect(stats.claimLabelBufferSwaps).toBeGreaterThan(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.selectOption('#projectSel', 'Project_GranColombia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  expect(await groupedClaimRegionCount(page)).toBe(14);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.claimOverlayDomReplacements).toBeGreaterThan(0);
  expect(stats.claimLabelDomReplacements).toBeGreaterThan(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await clearMap(page);
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#claimLabels .claim-label')).toHaveCount(0);
  await expect(page.locator('#claimOverlays [data-overlay-buffer-active="0"] .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#claimLabels [data-overlay-buffer-active="0"] .claim-label')).toHaveCount(0);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.claimOverlayDomReplacements).toBeGreaterThan(0);
  expect(stats.claimLabelDomReplacements).toBeGreaterThan(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await clearMap(page);
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#claimLabels .claim-label')).toHaveCount(0);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.claimOverlayDomReplacements).toBe(0);
  expect(stats.claimLabelDomReplacements).toBe(0);
});

test('hover overlay and capital marker keys avoid unchanged churn', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  const canadaRegions = await page.locator('#hitRegions .region-hit[data-nation="CAN"]').evaluateAll(paths => (
    paths.map(path => path.dataset.region).filter(Boolean)
  ));
  const firstCanadianRegion = canadaRegions.includes('Ontario') ? 'Ontario' : canadaRegions[0];
  const secondCanadianRegion = canadaRegions.find(region => region && region !== firstCanadianRegion);
  expect(firstCanadianRegion).toBeTruthy();
  expect(secondCanadianRegion).toBeTruthy();

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveCount(1);
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await chooseNation(page, 'Brazil', 'BRA');
  let stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.capitalMarkerRebuilds).toBe(0);

  await hoverRegionWithMouse(page, 'Amazonia');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await hoverRegionWithMouse(page, 'FrenchGuiana');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="FrenchGuiana"]')).toHaveCount(1);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.hoverOutlineReplacements).toBeGreaterThan(0);
  expect(stats.foreignHoverOverlayReplacements).toBe(0);

  await hoverRegionWithMouse(page, firstCanadianRegion);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"]')).not.toHaveCount(0);
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await hoverRegionWithMouse(page, secondCanadianRegion);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"]')).not.toHaveCount(0);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.foreignHoverOverlayReplacements).toBe(0);
  expect(stats.hoverOutlineReplacements).toBe(0);

  await hoverRegionWithMouse(page, 'Bolivia');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Bolivia"]')).toHaveCount(1);
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-regions~="Bolivia"]')).toHaveCount(0);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="BOL"][data-regions~="Bolivia"]')).toHaveCount(0);
  await hoverRegionWithMouse(page, 'Brasilia');
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveClass(/is-selected/);
});

test('selected nation marks its capital region with a fillable star', async ({ page }) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await hoverRegion(page, 'Amazonia');
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

  await hoverRegion(page, 'Amazonia');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="BRA"]')).toHaveCount(0);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).not.toHaveClass(/is-selected/);

  await clickRegion(page, 'Amazonia');
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).not.toHaveClass(/is-selected/);

  await hoverRegion(page, 'Ontario');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Ontario"]')).toHaveCount(0);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"][data-regions~="Ontario"]')).toHaveCount(1);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"]')).not.toHaveCount(0);
  const foreignHoverOverlay = page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"]').first();
  await expect(foreignHoverOverlay).toHaveCSS('mix-blend-mode', 'normal');
  await expect(foreignHoverOverlay).toHaveAttribute('fill-opacity', /^(0\.|1)/);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).not.toHaveClass(/is-selected/);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Ontario"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Ontario"]')).toHaveClass(/is-selected/);

  await hoverRegion(page, 'Bolivia');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Bolivia"]')).toHaveCount(1);
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-regions~="Bolivia"]')).toHaveCount(0);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="BOL"][data-regions~="Brasilia"]')).toHaveCount(0);

  await hoverRegion(page, 'Brasilia');
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveClass(/is-selected/);

  await clickRegion(page, 'Brasilia');
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveClass(/is-selected/);
  await expect(page.locator('#selectionOutlines .selection-dot[data-region="Brasilia"]')).toHaveCount(0);
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Brasilia"]')).toHaveText('Brasilia');

  await hoverRegion(page, 'FrenchGuiana');
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Brasilia"]')).toHaveClass(/is-selected/);

  await hoverRegion(page, 'Ontario');
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Ontario"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Ontario"]')).toHaveClass(/is-selected/);
});

test('selected nation claim controls update overlays without losing state', async ({ page }) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  expect(await groupedClaimRegionCount(page)).toBe(26);
  await expect(page.locator('#projectSel option')).toHaveCount(3);

  await page.selectOption('#projectSel', 'Project_GranColombia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#projectSel')).toHaveValue('Project_GranColombia');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 5, research tiers 1');
  expect(await groupedClaimRegionCount(page)).toBe(14);
  await expect(page.locator('.claimListItem.active[data-claim-kind="outgoing"]')).toHaveCount(1);

  await page.selectOption('#claimMode', 'all');
  await page.selectOption('#claimKind', 'hostile');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 11, research tiers 1');
  expect(await groupedClaimRegionCount(page)).toBe(20);
  await expect(page.locator('.claimListItem[data-claim-kind="outgoing"]')).toHaveCount(1);

  await page.selectOption('#claimKind', 'all');
  await page.selectOption('#claimMode', 'off');
  await expect(page.locator('#claimMode')).toHaveValue('off');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 0, research tiers 0');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#nationInfo')).not.toContainText('Display mode');
});
