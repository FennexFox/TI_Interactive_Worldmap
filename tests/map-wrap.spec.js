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

async function waitForSingleCopyMap(page, path = '/?worldWrap=0') {
  await page.goto(path);
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('body')).not.toContainText('Failed to load generated Terra Invicta map data.');
}

async function waitForWrappedMap(page, path = '/') {
  await page.goto(path);
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('body')).not.toContainText('Failed to load generated Terra Invicta map data.');
}

function regionHit(page, regionName) {
  return page.locator(`#hitRegions .region-hit[data-region="${regionName}"]`);
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
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
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
  await expect(page.locator('#search')).toHaveValue('');

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
  await expectProjectedCopies(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"][data-region="Ontario"]'));
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
