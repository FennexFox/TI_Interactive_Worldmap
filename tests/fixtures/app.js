// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import { expect, test as base } from '@playwright/test';

export function pathWithQueryParam(path, name, value) {
  const url = new URL(path, 'http://localhost');
  url.searchParams.set(name, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function waitForAppReady(page, path = '/') {
  await page.goto(path);
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});
  await expect(page.locator('body')).not.toContainText('Failed to load generated Terra Invicta map data.');
}

export async function waitForSingleCopyMap(page, path = '/') {
  await waitForAppReady(page, path);
}

export async function waitForWrappedMap(page, path = '/') {
  await waitForAppReady(page, pathWithQueryParam(path, 'worldWrap', '1'));
}

export async function chooseNation(page, query, tag) {
  await page.locator('#search').fill(query);
  await page.locator('#nationDropdown .searchOption')
    .filter({has: page.locator('.searchOptionTag', {hasText: tag})})
    .first()
    .click();
}

export function regionTarget(page, regionName, copy = 'canonical') {
  const copySelector = copy === 'canonical'
    ? '[data-wrap-canonical="1"]'
    : copy === null
      ? ''
      : `[data-wrap-copy="${copy}"]`;
  return page.locator(`#hitRegions .region-hit[data-region="${regionName}"]${copySelector}`);
}

export function regionHit(page, regionName) {
  return regionTarget(page, regionName, null);
}

export async function hoverRegion(page, regionName, copy = 'canonical') {
  const target = regionTarget(page, regionName, copy);
  await target.dispatchEvent('pointerover', {
    bubbles: true,
    clientX: 120,
    clientY: 120,
    pointerType: 'mouse',
  });
  await target.dispatchEvent('pointermove', {
    bubbles: true,
    clientX: 126,
    clientY: 126,
    pointerType: 'mouse',
  });
}

export async function hoverWrappedRegion(page, regionName, copy = '0') {
  await hoverRegion(page, regionName, copy);
}

export async function clickRegion(page, regionName, copy = 'canonical') {
  await regionTarget(page, regionName, copy).dispatchEvent('click', {bubbles: true});
}

export async function waitForAnimationFrames(page, frameCount = 1) {
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

export async function waitForHoverPreviewFrame(page) {
  await waitForAnimationFrames(page, 2);
}

export async function hoverRegionWithMouse(page, regionName, copy = 'canonical') {
  await regionTarget(page, regionName, copy).hover();
}

export async function blankMapPoint(page) {
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

export async function mapViewBox(page) {
  const value = await page.locator('#map').getAttribute('viewBox');
  return String(value || '').split(/\s+/).map(Number);
}

export async function debugRenderStats(page) {
  return page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
}

export async function resetDebugRenderStats(page) {
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
}

export async function zoomInMap(page, count = 7) {
  for (let index = 0; index < count; index += 1) {
    await page.locator('[data-map-view-action="zoomIn"]').click();
    await waitForAnimationFrames(page, 1);
  }
}

export async function pinFirstReachableCapitalCandidate(page) {
  const candidate = page.locator('#reachableCandidatesPanel [data-candidate-focus]').first();
  await expect(candidate).toBeVisible();
  const region = await candidate.getAttribute('data-candidate-focus');
  await candidate.click();
  await waitForAnimationFrames(page, 3);
  return region;
}

export async function pinReachableCapitalCandidates(page, count) {
  const pinned = [];
  for (let index = 0; index < count; index += 1) {
    pinned.push(await pinFirstReachableCapitalCandidate(page));
  }
  return pinned;
}

export async function clearMap(page) {
  await page.locator('#hitRegions').dispatchEvent('click', {bubbles: true});
}

export async function groupedClaimRegionCount(page, selector = '#claimOverlays .claim-fill-group') {
  return page.locator(selector).evaluateAll(nodes => nodes.reduce((sum, node) => (
    sum + Number(node.dataset.visualGroupSize || 0)
  ), 0));
}

export async function expectGroupedClaimRegion(
  page,
  regionName,
  selector = '#claimOverlays .claim-fill-group',
) {
  await expect(page.locator(`${selector}[data-regions~="${regionName}"]`)).not.toHaveCount(0);
}

export async function expectProjectedCopies(locator, copies = ['-1', '0', '1']) {
  await expect(locator).toHaveCount(copies.length);
  await expect.poll(
    async () => locator.evaluateAll(nodes => nodes.map(node => node.dataset.wrapCopy)),
  ).toEqual(copies);
}

export async function expectProjectedRegion(
  page,
  layerSelector,
  regionName,
  copies = ['-1', '0', '1'],
) {
  await expectProjectedCopies(page.locator(`${layerSelector}[data-region="${regionName}"]`), copies);
}

export async function expectProjectedGroupedRegion(
  page,
  layerSelector,
  regionName,
  copies = ['-1', '0', '1'],
) {
  await expectProjectedCopies(page.locator(`${layerSelector}[data-regions~="${regionName}"]`), copies);
}

export async function groupedVisualRegionCount(page, layerSelector) {
  return page.locator(layerSelector).evaluateAll(nodes => nodes.reduce((sum, node) => (
    sum + Number(node.dataset.visualGroupSize || 0)
  ), 0));
}

export async function dragMap(page, start, end, steps = 8) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, {steps});
  await page.mouse.up();
}

export async function dispatchPointerClick(locator, point = {x: 120, y: 120}) {
  await locator.dispatchEvent('pointerdown', {
    bubbles: true,
    button: 0,
    pointerId: 7,
    clientX: point.x,
    clientY: point.y,
    pointerType: 'mouse',
  });
  await locator.dispatchEvent('pointerup', {
    bubbles: true,
    button: 0,
    pointerId: 7,
    clientX: point.x,
    clientY: point.y,
    pointerType: 'mouse',
  });
  await locator.dispatchEvent('click', {bubbles: true, clientX: point.x, clientY: point.y});
}

export async function dispatchPointerDragAndClick(
  locator,
  start = {x: 120, y: 120},
  end = {x: 152, y: 120},
) {
  await locator.dispatchEvent('pointerdown', {
    bubbles: true,
    button: 0,
    pointerId: 8,
    clientX: start.x,
    clientY: start.y,
    pointerType: 'mouse',
  });
  await locator.dispatchEvent('pointermove', {
    bubbles: true,
    button: 0,
    pointerId: 8,
    clientX: end.x,
    clientY: end.y,
    pointerType: 'mouse',
  });
  await locator.dispatchEvent('pointerup', {
    bubbles: true,
    button: 0,
    pointerId: 8,
    clientX: end.x,
    clientY: end.y,
    pointerType: 'mouse',
  });
  await locator.dispatchEvent('click', {bubbles: true, clientX: end.x, clientY: end.y});
}

export const test = base.extend({
  appReady: async ({page}, use) => {
    await use((path = '/') => waitForAppReady(page, path));
  },
  nationSelection: async ({page}, use) => {
    await use((query, tag) => chooseNation(page, query, tag));
  },
  regionHover: async ({page}, use) => {
    await use((regionName, copy = 'canonical') => hoverRegion(page, regionName, copy));
  },
  regionClick: async ({page}, use) => {
    await use((regionName, copy = 'canonical') => clickRegion(page, regionName, copy));
  },
  animationFrames: async ({page}, use) => {
    await use((frameCount = 1) => waitForAnimationFrames(page, frameCount));
  },
});

export {expect};
