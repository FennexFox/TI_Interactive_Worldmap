// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  chooseNation,
  clearMap,
  clickRegion,
  debugRenderStats,
  expect,
  groupedClaimRegionCount,
  hoverRegion,
  pinReachableCapitalCandidates,
  resetDebugRenderStats,
  test,
  waitForAnimationFrames,
  waitForHoverPreviewFrame,
} from '../fixtures/app.js';

test('pinned expansion nodes update compact rows and map markers through clicks', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await chooseNation(page, 'Brazil', 'BRA');
  await clickRegion(page, 'Amazonia');
  await expect(page.locator('[data-pin-focused-region]')).toHaveCount(0);
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Amazonia"]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group[data-region="Amazonia"]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-label[data-region="Amazonia"]')).toHaveCount(0);
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText('Manaus');
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).toHaveClass(/pinned-node/);

  await page.locator('.claimListItem[data-claim-kind="outgoing"]').first().click();
  await expect(page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]').first()).toBeVisible();
  const frenchGuianaRow = page.locator('.legendRegionRow')
    .filter({has: page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]')});
  const frenchGuianaItem = frenchGuianaRow.locator('.legendRegionItem');
  await expect(frenchGuianaRow.locator('.legendRegionPin')).toHaveCount(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await frenchGuianaItem.click();
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region]')).toHaveCount(2);
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="FrenchGuiana"]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group[data-region="FrenchGuiana"]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-label[data-region="Amazonia"]')).toHaveText('Manaus');
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-label[data-region="FrenchGuiana"]')).toHaveCount(0);
  await expect(page.locator('#selectionOutlines .selection-label[data-region="FrenchGuiana"]')).toHaveText('Kourou');
  await expect(page.locator('#regions .region[data-region="FrenchGuiana"]')).toHaveClass(/pinned-node/);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.pinnedRegionMarkerRebuilds).toBeGreaterThan(0);

  await page.locator('#pinnedRegionsPanel [data-pinned-unpin="FrenchGuiana"]').click();
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group[data-region="FrenchGuiana"]')).toHaveCount(0);
  await expect(page.locator('#regions .region[data-region="FrenchGuiana"]')).not.toHaveClass(/pinned-node/);

  await page.locator('[data-pinned-clear]').click();
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region]')).toHaveCount(0);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group')).toHaveCount(0);
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).not.toHaveClass(/pinned-node/);
});

test('map region clicks toggle pinned expansion nodes', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await chooseNation(page, 'Brazil', 'BRA');
  await clickRegion(page, 'Amazonia');
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Amazonia"]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group[data-region="Amazonia"]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-label[data-region="Amazonia"]')).toHaveCount(0);
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText('Manaus');
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).toHaveClass(/pinned-node/);

  await clickRegion(page, 'Amazonia');
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Amazonia"]')).toHaveCount(0);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group[data-region="Amazonia"]')).toHaveCount(0);
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).not.toHaveClass(/pinned-node/);
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveCount(1);
});

test('empty map clicks clear pinned regions and selection together', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await chooseNation(page, 'Brazil', 'BRA');
  await clickRegion(page, 'Amazonia');
  await page.locator('.claimListItem[data-claim-kind="outgoing"]').first().click();
  await expect(page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]').first()).toBeVisible();
  await page.locator('.legendRegionRow')
    .filter({has: page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]')})
    .locator('.legendRegionItem')
    .click();
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region]')).toHaveCount(2);
  await expect(page.locator('#selectionOutlines > *')).not.toHaveCount(0);

  await clearMap(page);
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group')).toHaveCount(0);
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
});

test('manual recursive envelope renders pinned capital claimant depths and overlaps', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await chooseNation(page, 'China', 'CHN');
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline')).toHaveCount(0);

  await page.selectOption('#projectSel', 'Project_GreaterPanAsia');
  await expect(page.locator('.legendRegionItem[data-region-name="NorthHonshu"]').first()).toBeVisible();
  const northHonshuRow = page.locator('.legendRegionRow')
    .filter({has: page.locator('.legendRegionItem[data-region-name="NorthHonshu"]')});

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await northHonshuRow.locator('.legendRegionItem').click();

  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="NorthHonshu"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-region="Beijing"][data-envelope-depth="0"][data-envelope-claimant="CHN"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-region="NorthHonshu"][data-envelope-depth="0"][data-envelope-claimant="CHN"][data-envelope-source-count="2"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap[data-region="NorthHonshu"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap-marker')).toHaveCount(0);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap-count')).toHaveCount(0);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap-dot')).toHaveCount(0);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.manualEnvelopeRebuilds).toBeGreaterThan(0);

  await page.selectOption('#claimMode', 'all');
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-region="Luzon"][data-envelope-depth="1"][data-envelope-claimant="JPN"]')).toHaveCount(1);

  await page.locator('#pinnedRegionsPanel [data-pinned-unpin="NorthHonshu"]').click();
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline')).toHaveCount(0);
});

test('manual recursive envelope does not put overlap dots on Paris claims after selecting Moscow', async ({page}) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await clickRegion(page, 'Paris');
  await clickRegion(page, 'Moskva');

  await expect(page.locator('#search')).toHaveValue(/France/);
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Paris"]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Moskva"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap[data-region="Paris"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap-marker')).toHaveCount(0);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap-dot')).toHaveCount(0);
});

test('manual recursive envelope hatches claims inherited through a hostile parent path', async ({page}) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await chooseNation(page, 'Russia', 'RUS');
  await clickRegion(page, 'Paris');

  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Paris"]')).toHaveCount(1);
  const franceViaRussiaHatch = page.locator('#manualEnvelopeOverlays .manual-envelope-hostile-hatch[data-envelope-claimant="EUA"][data-envelope-parent="RUS"][data-envelope-via-capital="Paris"][data-regions~="Azores"]');
  await expect(franceViaRussiaHatch).toHaveCount(1);

  await clickRegion(page, 'England');
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="England"]')).toHaveCount(1);
  const ukViaEuropeHatch = page.locator('#manualEnvelopeOverlays .manual-envelope-hostile-hatch[data-envelope-claimant="GBR"][data-envelope-parent="EUA"][data-envelope-via-capital="England"][data-regions~="NewSouthWales"]');
  await expect(ukViaEuropeHatch).toHaveCount(1);

  await clickRegion(page, 'NewSouthWales');
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="NewSouthWales"]')).toHaveCount(1);
  const australiaViaUkHatch = page.locator('#manualEnvelopeOverlays .manual-envelope-hostile-hatch[data-envelope-claimant="AUS"][data-envelope-parent="GBR"][data-envelope-via-capital="NewSouthWales"][data-regions~="EastTimor"]');
  const nzViaUkHatch = page.locator('#manualEnvelopeOverlays .manual-envelope-hostile-hatch[data-envelope-claimant="GBR"][data-envelope-parent="EUA"][data-envelope-via-capital="England"][data-regions~="NewZealand"]');
  await expect(australiaViaUkHatch).toHaveCount(1);
  await expect(nzViaUkHatch).toHaveCount(1);
  expect(await groupedClaimRegionCount(page, '#manualEnvelopeOverlays .manual-envelope-hostile-hatch')).toBeGreaterThan(70);

  await page.selectOption('#claimKind', 'hostile');
  await expect(franceViaRussiaHatch).toHaveCount(1);
  await expect(ukViaEuropeHatch).toHaveCount(1);
  await expect(australiaViaUkHatch).toHaveCount(1);
  await expect(nzViaUkHatch).toHaveCount(1);
  expect(await groupedClaimRegionCount(page, '#manualEnvelopeOverlays .manual-envelope-hostile-hatch')).toBeGreaterThan(70);
});

test('formable capital hover does not show the current owner capital marker', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await clickRegion(page, 'Anatolia');
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Anatolia"]')).toHaveText('Ankara');
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Anatolia"]')).toHaveCount(1);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Novosibirsk"]')).toHaveCount(1);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Novosibirsk"]')).toHaveCount(1);

  await hoverRegion(page, 'Novosibirsk');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('RUS');
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-preview="secondary-capital"][data-nation="SIB"]')).not.toHaveCount(0);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Anatolia"][data-nation="TUR"]')).toHaveCount(1);
  await expect(page.locator('#capitalMarkers .capital-marker[data-region="Moskva"][data-nation="RUS"]')).toHaveCount(0);
});

test('reachable capital button shows capital markers that pin without plus buttons', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await chooseNation(page, 'China', 'CHN');
  const toggle = page.locator('#reachableCapitalsBtn');
  await expect(toggle).toHaveText('Hide reachable capitals');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  await expect(page.locator('#reachableCandidatesPanel')).toContainText('candidate capitals');
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Assam"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="NorthHonshu"]')).toHaveCount(1);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="NorthHonshu"]')).toHaveCount(1);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate-star[data-candidate-focus="NorthHonshu"]')).toHaveCount(1);
  await expect(page.locator('#reachableCapitalCandidates [data-candidate-pin]')).toHaveCount(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await clickRegion(page, 'NorthHonshu');
  await expect(page.locator('#selectionOutlines .selection-label[data-region="NorthHonshu"]')).toHaveText('Tokyo');
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="NorthHonshu"]')).toHaveCount(1);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="NorthHonshu"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="NorthHonshu"]')).toHaveCount(0);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group[data-region="NorthHonshu"]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-label[data-region="NorthHonshu"]')).toHaveCount(0);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.reachableCapitalCandidateRebuilds).toBeGreaterThan(0);
  expect(stats.fullVisualStateApplications).toBe(0);
  expect(stats.boundedVisualStateApplications).toBeGreaterThan(0);
  expect(stats.manualEnvelopeModelBuilds).toBeLessThanOrEqual(2);
  expect(stats.manualEnvelopeModelCacheHits).toBeGreaterThan(0);
  expect(stats.reachableCapitalCandidateDescriptorBuilds).toBeLessThanOrEqual(1);
  expect(stats.reachableCapitalCandidateDescriptorCacheHits).toBeGreaterThan(0);

  await toggle.click();
  await expect(toggle).toHaveText('Show reachable capitals');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate')).toHaveCount(0);
});

test('reachable capital activation requires the claimant capital to match the displayed region', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  const capitalData = await page.evaluate(async () => {
    const data = await window.TI_DATA_PROMISE;
    const claims = data.claimMap.claimsByNation || {};
    return {
      chinaCapitals: claims.CHN?.capitalRegions || [],
      shanghaiCapitalNations: Object.entries(claims)
        .filter(([, nation]) => (nation.capitalRegions || []).includes('Shanghai'))
        .map(([tag]) => tag)
        .sort(),
    };
  });
  expect(capitalData.chinaCapitals).toContain('Beijing');
  expect(capitalData.chinaCapitals).not.toContain('Shanghai');
  expect(capitalData.shanghaiCapitalNations.length).toBeGreaterThan(0);
  expect(capitalData.shanghaiCapitalNations).not.toContain('CHN');

  await chooseNation(page, 'Taiwan', 'TWN');
  const shanghaiClaimants = await page.locator('#reachableCandidatesPanel [data-candidate-row="Shanghai"] [data-candidate-focus]')
    .evaluateAll(buttons => buttons.map(button => button.dataset.candidateNation).filter(Boolean));
  expect(shanghaiClaimants).not.toContain('CHN');
  const beijingButton = page.locator('#reachableCandidatesPanel [data-candidate-row="Beijing"] [data-candidate-focus]').first();
  await expect(beijingButton).toHaveAttribute('data-candidate-focus', 'Beijing');
  await expect(beijingButton).toHaveAttribute('data-candidate-nation', 'CHN');

  await beijingButton.evaluate(button => {
    button.dataset.candidateFocus = 'Shanghai';
  });
  await beijingButton.click();
  await waitForAnimationFrames(page, 2);

  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Shanghai"]')).toHaveCount(0);
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Shanghai"]')).toHaveCount(0);

  await clickRegion(page, 'Shanghai');
  await waitForAnimationFrames(page, 2);
  await expect(page.locator('#search')).toHaveValue(/Taiwan/);
  await expect(page.locator('#claimPill')).toContainText('Taiwan');
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Shanghai"]')).toHaveCount(1);

  await page.locator('#pinnedRegionsPanel [data-pinned-unpin="Shanghai"]').click();
  await waitForAnimationFrames(page, 2);

  await beijingButton.evaluate(button => {
    button.dataset.candidateFocus = 'Beijing';
  });
  await beijingButton.click();
  await waitForAnimationFrames(page, 2);

  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Beijing"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-envelope-claimant="CHN"][data-envelope-via-capital="Beijing"]')).not.toHaveCount(0);
});

test('reachable capital hover keeps candidate marker DOM stable after multiple pins', async ({page}) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await chooseNation(page, 'China', 'CHN');
  await pinReachableCapitalCandidates(page, 3);
  const candidateRegions = await page.locator('#reachableCapitalCandidates .reachable-capital-candidate')
    .evaluateAll(nodes => [...new Set(nodes.map(node => node.dataset.candidateRegion).filter(Boolean))].slice(0, 2));
  expect(candidateRegions.length).toBeGreaterThanOrEqual(2);

  await resetDebugRenderStats(page);
  await hoverRegion(page, candidateRegions[0]);
  await expect(page.locator(`#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="${candidateRegions[0]}"]`)).toHaveClass(/is-selected/);

  await hoverRegion(page, candidateRegions[1]);
  await expect(page.locator(`#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="${candidateRegions[0]}"]`)).not.toHaveClass(/is-selected/);
  await expect(page.locator(`#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="${candidateRegions[1]}"]`)).toHaveClass(/is-selected/);

  const stats = await debugRenderStats(page);
  expect(stats.reachableCapitalCandidateDescriptorBuilds).toBe(0);
  expect(stats.reachableCapitalCandidateRebuilds).toBe(0);
});
