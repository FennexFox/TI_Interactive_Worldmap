// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  expect,
  test,
  waitForAnimationFrames,
} from '../fixtures/app.js';

async function inspectMarkerContrast(page, selector, label) {
  const marker = await page.evaluate(selector => {
    const node = document.querySelector(selector);
    const star = node?.querySelector('.capital-star');
    const shadow = node?.querySelector('.capital-star-shadow');
    const starStyle = star ? getComputedStyle(star) : null;
    const shadowStyle = shadow ? getComputedStyle(shadow) : null;
    return {
      count: document.querySelectorAll(selector).length,
      points: star?.getAttribute('points') || '',
      shadowPoints: shadow?.getAttribute('points') || '',
      stroke: shadowStyle?.stroke || '',
      strokeOpacity: shadowStyle?.strokeOpacity || '',
      strokeWidth: shadowStyle?.strokeWidth || '',
      starStrokeWidth: starStyle?.strokeWidth || '',
      vectorEffect: shadowStyle?.vectorEffect || '',
    };
  }, selector);
  expect(marker.count, `${label} marker count`).toBeGreaterThan(0);
  expect(marker.points, `${label} polygon geometry`).toBe(marker.shadowPoints);
  expect(marker.stroke, `${label} shadow stroke`).not.toBe('none');
  const channels = marker.stroke.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  expect(channels.length).toBeGreaterThanOrEqual(3);
  expect(channels[3] ?? 1, `${label} stroke alpha`).toBeGreaterThan(0);
  expect(Math.max(...channels.slice(0, 3)), `${label} shadow darkness`).toBeLessThan(100);
  expect(parseFloat(marker.strokeOpacity), `${label} shadow opacity`).toBeGreaterThan(0);
  expect(marker.vectorEffect, `${label} stroke scaling`).toBe('non-scaling-stroke');
  expect(parseFloat(marker.strokeWidth), `${label} outer width`)
    .toBeGreaterThan(parseFloat(marker.starStrokeWidth));
}

async function selectFourCapitalChain(page) {
  await page.locator('#hitRegions .region-hit[data-region="Beijing"][data-wrap-canonical="1"]')
    .dispatchEvent('click', {bubbles: true});
  await waitForAnimationFrames(page, 2);
  await inspectMarkerContrast(page, '#capitalMarkers .capital-marker', 'normal capital');
  await inspectMarkerContrast(page, '#reachableCapitalCandidates .reachable-capital-candidate', 'reachable candidate');
  for (const region of ['SouthThailand', 'MalayPeninsula', 'Java']) {
    await page.locator(`#reachableCandidatesPanel [data-candidate-focus="${region}"]`).click();
    await waitForAnimationFrames(page, 2);
  }
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group[data-wrap-canonical="1"]')).toHaveCount(4);
}

async function inspectEnvelopeAndMarkers(page) {
  const result = await page.evaluate(() => {
    const first = selector => document.querySelector(selector);
    const style = node => node ? getComputedStyle(node) : null;
    const outline = first('#manualEnvelopeOverlays .manual-envelope-region-outline');
    const overlap = first('#manualEnvelopeOverlays .manual-envelope-overlap');
    const depth0 = first('#manualEnvelopeOverlays .manual-envelope-region-outline[data-envelope-depth="0"]');
    const depth1 = first('#manualEnvelopeOverlays .manual-envelope-region-outline[data-envelope-depth="1"]');
    const selectedStar = first('#pinnedRegionMarkers .capital-marker.is-selected .capital-star');
    const selectedShadow = first('#pinnedRegionMarkers .capital-marker.is-selected .capital-star-shadow');
    return {
      outlineDash: style(outline)?.strokeDasharray || '',
      outlineVectorEffect: style(outline)?.vectorEffect || '',
      overlapDash: style(overlap)?.strokeDasharray || '',
      depth0Stroke: style(depth0)?.stroke || '',
      depth1Stroke: style(depth1)?.stroke || '',
      selectedFill: style(selectedStar)?.fill || '',
      selectedStroke: style(selectedStar)?.stroke || '',
      selectedFilter: style(selectedStar)?.filter || '',
      selectedPoints: selectedStar?.getAttribute('points') || '',
      selectedShadowPoints: selectedShadow?.getAttribute('points') || '',
      selectedShadowCount: document.querySelectorAll('#pinnedRegionMarkers .capital-marker.is-selected .capital-star-shadow').length,
      hostileHatches: [...document.querySelectorAll('#manualEnvelopeOverlays .manual-envelope-hostile-hatch')]
        .slice(0, 3)
        .map(node => ({opacity: style(node)?.opacity || '', fill: style(node)?.fill || ''})),
    };
  });
  expect(result.outlineDash.replace(/\s+/g, '')).toBe('4px,3px');
  expect(result.outlineVectorEffect).toBe('non-scaling-stroke');
  expect(result.overlapDash.replace(/\s+/g, '')).toBe('1px,3px');
  expect(result.selectedFill).not.toBe('none');
  expect(result.selectedStroke).not.toBe('none');
  expect(result.selectedFilter).toBe('none');
  expect(result.selectedPoints).toBe(result.selectedShadowPoints);
  expect(result.selectedShadowCount).toBeGreaterThan(0);
  expect(result.depth0Stroke).not.toBe('');
  expect(result.depth1Stroke).not.toBe('');
  expect(result.depth0Stroke).not.toBe(result.depth1Stroke);
  expect(result.hostileHatches.length).toBeGreaterThan(0);
  for (const hatch of result.hostileHatches) {
    expect(hatch.opacity).not.toBe('0');
    expect(hatch.fill).toContain('url(');
  }
}

async function dragMap(page) {
  const box = await page.locator('#map').boundingBox();
  const x = box.x + box.width * 0.42;
  const y = box.y + box.height * 0.52;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let index = 1; index <= 12; index += 1) await page.mouse.move(x + index * 2, y + index);
  await expect(page.locator('#map')).toHaveClass(/(^|\s)is-panning(\s|$)/);
  const duringPan = await page.evaluate(() => {
    const shadow = document.querySelector('#pinnedRegionMarkers .capital-star-shadow');
    return shadow ? getComputedStyle(shadow).display : '';
  });
  expect(duringPan).toBe('none');
  await page.mouse.up();
  await waitForAnimationFrames(page, 3);
  await expect(page.locator('#map')).not.toHaveClass(/(^|\s)is-panning(\s|$)/);
  await expect.poll(() => page.evaluate(() => {
    const shadow = document.querySelector('#pinnedRegionMarkers .capital-star-shadow');
    return shadow ? getComputedStyle(shadow).display : '';
  })).not.toBe('none');
}

for (const worldWrap of ['0', '1']) {
  test(`recursive interaction paint semantics survive zoom, drag, wheel, and cleanup (wrap ${worldWrap})`, async ({page}) => {
    await page.goto(`/?worldWrap=${worldWrap}&debugRenderStats=1`);
    await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});
    await page.selectOption('#scenarioSel', '2026');
    await selectFourCapitalChain(page);

    await inspectEnvelopeAndMarkers(page);
    for (const zoomCount of [3, 3]) {
      for (let index = 0; index < zoomCount; index += 1) {
        await page.locator('[data-map-view-action="zoomIn"]').click();
        await waitForAnimationFrames(page, 1);
      }
      await inspectEnvelopeAndMarkers(page);
    }

    await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
    await dragMap(page);
    for (let index = 0; index < 12; index += 1) {
      await page.mouse.wheel(0, Math.floor(index / 3) % 2 ? 100 : -100);
    }
    await waitForAnimationFrames(page, 4);
    const afterWheel = await page.evaluate(() => ({
      stats: {...window.__TI_DEBUG_RENDER_STATS__},
      filters: [...document.querySelectorAll('#pinnedRegionMarkers .capital-star')]
        .map(node => getComputedStyle(node).filter),
    }));
    expect(afterWheel.stats.manualEnvelopeRebuilds).toBe(0);
    expect(afterWheel.stats.manualEnvelopeModelBuilds).toBe(0);
    expect(afterWheel.stats.wheelViewBoxApplyCount).toBeGreaterThan(0);
    expect(afterWheel.filters.every(filter => filter === 'none')).toBe(true);

    await page.locator('#pinnedRegionsPanel .pinnedRegionUnpin').first().click();
    await waitForAnimationFrames(page, 2);
    await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group[data-wrap-canonical="1"]')).toHaveCount(3);

    const scenarios = await page.locator('#scenarioSel option').evaluateAll(options => options.map(option => option.value));
    if (scenarios.length > 1) {
      await page.selectOption('#scenarioSel', scenarios.at(-1));
      await expect(page.locator('#regions .region').first()).toBeVisible();
      await page.selectOption('#scenarioSel', '2026');
      await expect(page.locator('#regions .region').first()).toBeVisible();
    }
  });
}
