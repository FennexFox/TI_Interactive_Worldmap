// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  chooseNation,
  expect,
  expectProjectedCopies,
  expectProjectedGroupedRegion,
  groupedVisualRegionCount,
  regionHit,
  test,
  waitForSingleCopyMap,
  waitForWrappedMap,
} from '../fixtures/app.js';

test('single-copy grouped base fills preserve region-specific hit paths and filtering', async ({page}) => {
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

test('claim grouped fills preserve per-region semantic outline paths', async ({page}) => {
  await waitForSingleCopyMap(page);

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group')).toBe(26);

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
      hostileFillRegions: fills
        .filter(fill => fill.classList.contains('research-claim') || fill.classList.contains('basic-claim'))
        .reduce((sum, fill) => sum + Number(fill.dataset.visualGroupSize || 0), 0),
      hostileHatchesHaveLines: hatches
        .filter(hatch => hatch.classList.contains('hostile'))
        .every(hatch => /^url\(#hostile-claim-hatch-pattern-/.test(hatch.getAttribute('fill') || '')),
      hatchPatternLineCount: document.querySelectorAll('#claimOverlays pattern .claim-hatch-line').length,
      clipPathCount: document.querySelectorAll('#claimOverlays clipPath').length,
      peacefulHatches: hatches.filter(hatch => hatch.classList.contains('peaceful')).length,
      ownedHatches: hatches.filter(hatch => hatch.classList.contains('owned-territory')).length,
    };
  });

  expect(claimFillStats.fillGroupCount).toBeGreaterThan(0);
  expect(claimFillStats.hatchGroupCount).toBeGreaterThan(0);
  expect(claimFillStats.outlineCount).toBe(0);
  expect(claimFillStats.fillGroupsWithRegion).toBe(0);
  expect(claimFillStats.groupedRegions).toBe(26);
  expect(claimFillStats.ownedFillGroups).toBeGreaterThan(0);
  expect(claimFillStats.hostileFillRegions).toBeGreaterThan(0);
  expect(claimFillStats.hatchedRegions).toBeGreaterThan(0);
  expect(claimFillStats.hatchGroupCount).toBeLessThan(claimFillStats.hatchedRegions);
  expect(claimFillStats.hostileHatchesHaveLines).toBe(true);
  expect(claimFillStats.hatchPatternLineCount).toBe(claimFillStats.hatchGroupCount);
  expect(claimFillStats.clipPathCount).toBe(0);
  expect(claimFillStats.peacefulHatches).toBe(0);
  expect(claimFillStats.ownedHatches).toBe(0);

  await regionHit(page, 'Amazonia').hover();
  await expect(page.locator('#hoverPill')).toHaveText('Hover: BRA · Manaus');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
});

test('project-specific hostile claims render hatch and follow claim kind filters', async ({page}) => {
  await waitForSingleCopyMap(page);

  await chooseNation(page, 'China', 'CHN');
  await page.selectOption('#projectSel', 'Project_GreaterPanAsia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#claimKind')).toHaveValue('all');
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group.research-claim')).toBe(30);
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile[data-regions~="Hokkaido"]')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile[data-regions~="NorthHonshu"]')).toHaveCount(1);
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-hatch-group.hostile')).toBe(5);
  await expect(page.locator('#claimOverlays clipPath')).toHaveCount(0);

  await page.selectOption('#claimKind', 'peaceful');
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile')).toHaveCount(0);
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group.research-claim')).toBe(25);

  await page.selectOption('#claimKind', 'hostile');
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile')).toHaveCount(1);
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-hatch-group.hostile')).toBe(5);
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group.research-claim')).toBe(5);
});

test('all-mode hostile claims render hatch and follow claim kind filters', async ({page}) => {
  await waitForSingleCopyMap(page, '/?worldWrap=0');

  await chooseNation(page, 'Caliphate', 'CPH');
  await expect(page.locator('#claimMode')).toHaveValue('all');
  await expect(page.locator('#claimPill')).toHaveText('Caliphate: territory 0, claims 95, research tiers 3');
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile[data-regions~="Tehran"]')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile[data-regions~="Aceh"]')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-fill-group[data-regions~="Aceh"]')).toHaveCount(1);
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-hatch-group.hostile')).toBe(6);

  await page.selectOption('#claimKind', 'hostile');
  await expect(page.locator('#claimPill')).toHaveText('Caliphate: territory 0, claims 6, research tiers 3');
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile[data-regions~="Tehran"]')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile[data-regions~="Aceh"]')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-fill-group[data-regions~="Aceh"]')).toHaveCount(0);
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group')).toBe(6);

  await page.selectOption('#claimKind', 'peaceful');
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile[data-regions~="Tehran"]')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-fill-group[data-regions~="Tehran"]')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-fill-group[data-regions~="Aceh"]')).toHaveCount(1);
});

test('hostile hatch can be disabled for performance diagnostics', async ({page}) => {
  await waitForSingleCopyMap(page, '/?worldWrap=0&debugRenderStats=1&disableHostileHatch=1');

  await chooseNation(page, 'China', 'CHN');
  await page.selectOption('#projectSel', 'Project_GreaterPanAsia');
  await expect(page.locator('#claimOverlays .claim-hatch-group.hostile')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#claimOverlays .claim-fill-group.research-claim[data-regions~="Hokkaido"]')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-fill-group.research-claim[data-regions~="NorthHonshu"]')).toHaveCount(1);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.hostileHatchDisabled).toBe(1);
  expect(stats.worldWrapDisabled).toBe(1);
});

test('baseline selected overlays stay canonical across hover and claim controls', async ({page}) => {
  await waitForSingleCopyMap(page);

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group')).toBe(26);

  await regionHit(page, 'Amazonia').hover();
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);

  await regionHit(page, 'FrenchGuiana').hover();
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="FrenchGuiana"]')).toHaveCount(1);
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group')).toBe(26);

  await page.selectOption('#projectSel', 'Project_GranColombia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 5, research tiers 1');
  expect(await groupedVisualRegionCount(page, '#claimOverlays .claim-fill-group')).toBe(14);
});

test('world-wrap default renders base, grid, label, and hit copies', async ({page}) => {
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

test('debug label-disable flag suppresses rendered label nodes', async ({page}) => {
  await waitForSingleCopyMap(page, '/?worldWrap=0&debugRenderStats=1&debugDisableLabels=1');

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.locator('#showLabels').click();

  await expect(page.locator('#labels text.label')).toHaveCount(0);

  const stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.debugLabelsDisabled).toBe(1);
  expect(stats.labelVisibleState).toBe(1);
  expect(stats.labelCount).toBe(0);
  expect(stats.labelCopyGroupCount).toBe(0);
  expect(stats.wrappedLabelCopyCount).toBe(0);
  expect(stats.labelRenderCalls).toBeGreaterThan(0);
  expect(stats.labelDomReplacements).toBeGreaterThan(0);
  expect(stats.labelRenderSkippedByDebug).toBeGreaterThan(0);
});

test('debug label-disable flag is inert outside debug render stats mode', async ({page}) => {
  await waitForSingleCopyMap(page, '/?worldWrap=0&debugDisableLabels=1');

  await page.locator('#showLabels').click();

  await expect(page.locator('#labels text.label')).not.toHaveCount(0);
  expect(await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__)).toBeUndefined();
});

test('world-wrap default projects grouped base and claim fill copies', async ({page}) => {
  await waitForWrappedMap(page);

  await page.selectOption('#baseMode', 'plain');
  await expectProjectedCopies(page.locator('#normalRegionColors .normal-region-color'));

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expectProjectedCopies(page.locator('#claimOverlays .claim-fill-group.owned-territory[data-fill-key^="owned:"]'));
  await expectProjectedGroupedRegion(page, '#claimOverlays .claim-fill-group.owned-territory', 'Amazonia');
});

test('world-wrap default projects pinned node markers from row clicks', async ({page}) => {
  await waitForWrappedMap(page, '/?debugRenderStats=1');

  await chooseNation(page, 'Brazil', 'BRA');
  await page.locator('.claimListItem[data-claim-kind="outgoing"]').first().click();
  await expect(page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]').first()).toBeVisible();
  const frenchGuianaRow = page.locator('.legendRegionRow')
    .filter({has: page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]')});
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

test('world-wrap default projects manual recursive envelope copies', async ({page}) => {
  await waitForWrappedMap(page);

  await chooseNation(page, 'China', 'CHN');
  await page.selectOption('#projectSel', 'Project_GreaterPanAsia');
  await expect(page.locator('.legendRegionItem[data-region-name="NorthHonshu"]').first()).toBeVisible();
  const northHonshuRow = page.locator('.legendRegionRow')
    .filter({has: page.locator('.legendRegionItem[data-region-name="NorthHonshu"]')});
  await northHonshuRow.locator('.legendRegionItem').click();
  await page.selectOption('#claimMode', 'all');

  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-region="NorthHonshu"][data-envelope-depth="0"][data-envelope-source-count="2"]'));
  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap[data-region="NorthHonshu"]'));
  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-region="Luzon"][data-envelope-depth="1"][data-envelope-claimant="JPN"]'));
  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-fill[data-envelope-depth="0"]'));
  await expectProjectedCopies(page.locator('#manualEnvelopeOverlays .manual-envelope-fill[data-envelope-depth="1"]'));
});

test('world-wrap default projects reachable capital candidate markers', async ({page}) => {
  await waitForWrappedMap(page);

  await chooseNation(page, 'China', 'CHN');
  await expect(page.locator('#reachableCapitalsBtn')).toHaveText('Hide reachable capitals');
  await expect(page.locator('#reachableCapitalsBtn')).toHaveAttribute('aria-pressed', 'true');

  await expectProjectedCopies(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="NorthHonshu"]'));
  await expectProjectedCopies(page.locator('#reachableCapitalCandidates .reachable-capital-candidate-star[data-candidate-focus="NorthHonshu"]'));
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Assam"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates [data-candidate-pin]')).toHaveCount(0);
});

test('world-wrap default resolves copied hit paths to canonical region state', async ({page}) => {
  await waitForWrappedMap(page);

  const copiedAmazonia = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-copy="-1"]');
  await copiedAmazonia.dispatchEvent('pointerover', {bubbles: true, clientX: 120, clientY: 120, pointerType: 'mouse'});
  await copiedAmazonia.dispatchEvent('pointermove', {bubbles: true, clientX: 126, clientY: 126, pointerType: 'mouse'});
  await expect(page.locator('#hoverPill')).toHaveText('Hover: BRA · Manaus');
  await expectProjectedCopies(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]'));

  await copiedAmazonia.dispatchEvent('click', {bubbles: true});
  await expect(page.locator('#search')).toHaveValue(/Brazil/);
  await expectProjectedCopies(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]'));
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText(['Manaus', 'Manaus', 'Manaus']);
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
});

test('world-wrap default applies search filtering to every copy without duplicating canonical state', async ({page}) => {
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
