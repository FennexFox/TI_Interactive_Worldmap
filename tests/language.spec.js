import { expect, test } from '@playwright/test';

async function chooseNation(page, query, tag) {
  await page.locator('#search').fill(query);
  await page.locator('#nationDropdown .searchOption')
    .filter({ has: page.locator('.searchOptionTag', { hasText: tag }) })
    .first()
    .click();
}

function regionTarget(page, regionName) {
  return page.locator(`#hitRegions .region-hit[data-region="${regionName}"][data-wrap-canonical="1"]`);
}

async function hoverRegion(page, regionName) {
  const target = regionTarget(page, regionName);
  await target.dispatchEvent('pointerover', { bubbles: true, clientX: 120, clientY: 120, pointerType: 'mouse' });
  await target.dispatchEvent('pointermove', { bubbles: true, clientX: 126, clientY: 126, pointerType: 'mouse' });
}

async function hoverRegionWithMouse(page, regionName) {
  await regionTarget(page, regionName).hover();
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

async function clickRegion(page, regionName) {
  await regionTarget(page, regionName).dispatchEvent('click', { bubbles: true });
}

async function mapViewBox(page) {
  const value = await page.locator('#map').getAttribute('viewBox');
  return String(value || '').split(/\s+/).map(Number);
}

async function debugRenderStats(page) {
  return page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
}

async function resetDebugRenderStats(page) {
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
}

async function pinFirstReachableCapitalCandidate(page) {
  const candidate = page.locator('#reachableCandidatesPanel [data-candidate-focus]').first();
  await expect(candidate).toBeVisible();
  const region = await candidate.getAttribute('data-candidate-focus');
  await candidate.click();
  await waitForAnimationFrames(page, 3);
  return region;
}

async function pinReachableCapitalCandidates(page, count) {
  const pinned = [];
  for (let index = 0; index < count; index += 1) {
    pinned.push(await pinFirstReachableCapitalCandidate(page));
  }
  return pinned;
}

async function clearMap(page) {
  await page.locator('#hitRegions').dispatchEvent('click', { bubbles: true });
}

test('language selector switches static and dynamic UI copy', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await expect(page.locator('#languageSel')).toHaveValue('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Terra Invicta Claim / Unification Map');
  await expect(page.locator('#search')).toHaveAttribute('placeholder', 'Enter a nation tag, region, or project: CHN, Korea, Greater India...');
  await expect(page.locator('#claimMode option[value="project"]')).toHaveText('Selected project only');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');

  await page.locator('#search').click();
  await expect(page.locator('#nationDropdown')).toBeVisible();
  await expect(page.locator('#nationDropdown .searchOption').first()).toBeVisible();

  await page.selectOption('#languageSel', 'ko');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('h1')).toHaveText('Terra Invicta 영유권 / 통합 지도');
  await expect(page.locator('#search')).toHaveAttribute('placeholder', '국가 태그, 지역명, 프로젝트명 입력: CHN, Korea, Greater India...');
  await expect(page.locator('#claimPill')).toHaveText('영유권: -');
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('고정된 확장 노드가 없습니다.');

  await page.selectOption('#languageSel', 'en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
});

test('sidebar falls back when persisted settings have unexpected JSON types', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ti-map-language', 'en');
    localStorage.setItem('ti-map-aside-card-order', JSON.stringify('selected'));
    localStorage.setItem('ti-map-aside-card-collapsed', JSON.stringify(42));
    localStorage.setItem('ti-map-nation-info-sections', JSON.stringify(null));
  });

  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  const cards = page.locator('#asideCardList .sideCard');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toHaveAttribute('data-aside-card', 'explore');
  await expect(cards.nth(1)).toHaveAttribute('data-aside-card', 'expansionNodes');
  await expect(cards.nth(2)).toHaveAttribute('data-aside-card', 'selected');
  await expect(cards.nth(0).locator('.sideCardBody')).toBeVisible();
  await expect(cards.nth(1).locator('.sideCardBody')).toBeVisible();
  await expect(cards.nth(1).locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(cards.nth(2).locator('.sideCardBody')).toBeVisible();
});

test('nation search uses catalog names and keeps region names separate', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  const search = page.locator('#search');
  const options = page.locator('#nationDropdown .searchOption');
  const nationOption = (tag) => options.filter({ has: page.locator('.searchOptionTag', { hasText: tag }) });
  const regionOption = options.filter({ has: page.locator('.searchOptionTag', { hasText: 'REGION' }) });

  await search.fill('Canada');
  await expect(nationOption('CAN').first()).toContainText('Canada');

  await search.fill('캐나다');
  await expect(nationOption('CAN').first()).toBeVisible();

  await search.fill('United States');
  await expect(nationOption('USA').first()).toBeVisible();

  await search.fill('China');
  await expect(nationOption('CHN').first()).toContainText('China');

  await search.fill('SEN');
  await expect(options.first().locator('.searchOptionTag')).toHaveText('SEG');
  await expect(nationOption('SEG').first()).toContainText('Senegal');
  await expect(nationOption('SEN')).toHaveCount(0);

  await search.fill('Senegambia');
  await expect(regionOption.filter({ hasText: 'Dakar' }).first()).toContainText('SEG');
  await expect(nationOption('SEN')).toHaveCount(0);

  await search.fill('Denver');
  await expect(regionOption.filter({ hasText: 'Denver' }).first()).toContainText('USA');

  await search.fill('Seoul');
  await expect(regionOption.filter({ hasText: 'Seoul' }).first()).toContainText('KOR');

  await search.fill('Saudi Arabia');
  await expect(nationOption('SAU').first()).toContainText('Saudi Arabia');
  await expect(nationOption('SAU').first()).not.toContainText('formable');

  await search.fill('Guatemala');
  await expect(nationOption('GTM').first()).toContainText('Guatemala');
  await expect(regionOption.filter({ hasText: 'Guatemala City' }).first()).toContainText('GTM');
  await expect(nationOption('GUA')).toHaveCount(0);

  await search.fill('Liangguang');
  await expect(nationOption('GUA').first()).toContainText('Liangguang');
  await expect(nationOption('GUA').first()).not.toContainText('Guatemala');
});

test('nation search matches claim project names to claimant nations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  const search = page.locator('#search');
  const options = page.locator('#nationDropdown .searchOption');
  const nationOption = (tag) => options.filter({ has: page.locator('.searchOptionTag', { hasText: tag }) });

  await search.fill('United Turkestan');
  await expect(nationOption('TUR').first()).toBeVisible();

  await search.fill('Greater India');
  await expect(nationOption('IND').first()).toBeVisible();

  await search.fill('연합된 투르키스탄');
  await expect(nationOption('TUR').first()).toBeVisible();
});


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
  expect(stats.capitalMarkerRebuilds).toBeGreaterThan(0);
});

test('simple selected-overlay claim hover movement uses bounded visual updates', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);

  await hoverRegionWithMouse(page, 'Amazonia');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Amazonia"]')).toHaveCount(1);
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());

  await hoverRegionWithMouse(page, 'FrenchGuiana');
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="FrenchGuiana"]')).toHaveCount(1);
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);

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
  await expect(page.locator('#claimOverlays .claim-overlay.owned-territory[data-region="Bolivia"]')).toHaveCount(1);
  await expect(page.locator('#nationInfo')).toContainText('Bolivia');
});

test('secondary capital hover previews a foreign nation inside selected expansion range', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'France', 'EUA');
  await expect(page.locator('#claimPill')).toContainText('France');
  await expect(page.locator('#claimOverlays .claim-overlay[data-region="Paris"]')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-overlay[data-region="Moskva"]')).toHaveCount(1);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await hoverRegion(page, 'Moskva');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('RUS');
  await expect(page.locator('#claimPill')).toContainText('France');
  await expect(page.locator('#claimOverlays .claim-overlay[data-region="Paris"]')).toHaveCount(1);
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-preview="secondary-capital"][data-nation="RUS"]')).not.toHaveCount(0);
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-region="Moskva"][data-nation="RUS"]')).toHaveCount(1);
  let stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBe(0);
  expect(stats.foreignHoverDescriptorBuilds).toBeGreaterThan(0);

  await hoverRegion(page, 'Kharkiv');
  await waitForHoverPreviewFrame(page);
  await expect(page.locator('#hoverPill')).toContainText('UKR');
  await expect(page.locator('#claimPill')).toContainText('France');
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview')).toHaveCount(0);
  await expect(page.locator('#hoverOutlines .hover-fill[data-region="Kharkiv"]')).toHaveCount(1);
  await expect(page.locator('#claimOverlays .claim-overlay[data-region="Paris"]')).toHaveCount(1);

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
  await expect(page.locator('#claimOverlays .claim-overlay[data-region="Amazonia"]')).toHaveCount(1);
  await expect(page.locator('#nationInfo')).toContainText('Brazil');
});

test('overlay model cache reuses unchanged inputs and misses changed filters', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);

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
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(14);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBeGreaterThan(0);
  expect(stats.overlayModelCacheHits).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.selectOption('#claimMode', 'all');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 17, research tiers 2');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelCacheHits).toBeGreaterThan(0);
  expect(stats.overlayModelBuilds).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await page.selectOption('#claimKind', 'hostile');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 11, research tiers 1');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(20);
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
  await expect(page.locator('.claimListItem[data-claim-kind="incoming"]')).toHaveCount(4);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelBuilds).toBeGreaterThan(0);
  expect(stats.overlayModelCacheHits).toBe(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('.claimListItem[data-claim-kind="incoming"]')).toHaveCount(4);
  stats = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
  expect(stats.overlayModelCacheHits).toBeGreaterThan(0);
  expect(stats.overlayModelBuilds).toBe(0);
});

test('overlay render skip keys avoid unchanged DOM replacement', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);
  await expect(page.locator('#claimLabels .claim-label')).not.toHaveCount(0);

  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
  await chooseNation(page, 'Brazil', 'BRA');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);
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
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(14);
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
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-region="Bolivia"]')).toHaveCount(0);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="BOL"][data-region="Bolivia"]')).toHaveCount(0);
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
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="CAN"][data-region="Ontario"]')).toHaveCount(1);
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
  await expect(page.locator('#secondaryHoverOverlays .secondary-capital-preview[data-region="Bolivia"]')).toHaveCount(0);
  await expect(page.locator('#foreignHoverOverlays .foreign-hover-overlay[data-nation="BOL"][data-region="Brasilia"]')).toHaveCount(0);

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
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);
  await expect(page.locator('#projectSel option')).toHaveCount(3);

  await page.selectOption('#projectSel', 'Project_GranColombia');
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#projectSel')).toHaveValue('Project_GranColombia');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 5, research tiers 1');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(14);
  await expect(page.locator('.claimListItem.active[data-claim-kind="outgoing"]')).toHaveCount(1);

  await page.selectOption('#claimMode', 'all');
  await page.selectOption('#claimKind', 'hostile');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 11, research tiers 1');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(20);
  await expect(page.locator('.claimListItem[data-claim-kind="outgoing"]')).toHaveCount(1);

  await page.selectOption('#claimKind', 'all');
  await page.selectOption('#claimMode', 'off');
  await expect(page.locator('#claimMode')).toHaveValue('off');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 0, research tiers 0');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#nationInfo')).toContainText('Display mode');
  await expect(page.locator('#nationInfo')).toContainText('Off');
});

test('pinned expansion nodes update compact rows and map markers through clicks', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

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
    .filter({ has: page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]') });
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
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(page.locator('#pinnedRegionMarkers .pinned-node-marker-group')).toHaveCount(0);
  await expect(page.locator('#regions .region[data-region="Amazonia"]')).not.toHaveClass(/pinned-node/);
});

test('map region clicks toggle pinned expansion nodes', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

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

test('empty map clicks clear pinned regions and selection together', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await clickRegion(page, 'Amazonia');
  await page.locator('.claimListItem[data-claim-kind="outgoing"]').first().click();
  await expect(page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]').first()).toBeVisible();
  await page.locator('.legendRegionRow')
    .filter({ has: page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]') })
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

test('manual recursive envelope renders pinned capital claimant depths and overlaps', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'China', 'CHN');
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline')).toHaveCount(0);

  await page.selectOption('#projectSel', 'Project_GreaterPanAsia');
  await expect(page.locator('.legendRegionItem[data-region-name="NorthHonshu"]').first()).toBeVisible();
  const northHonshuRow = page.locator('.legendRegionRow')
    .filter({ has: page.locator('.legendRegionItem[data-region-name="NorthHonshu"]') });

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

test('manual recursive envelope does not put overlap dots on Paris claims after selecting Moscow', async ({ page }) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await clickRegion(page, 'Paris');
  await clickRegion(page, 'Moskva');

  await expect(page.locator('#search')).toHaveValue(/France/);
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Paris"]')).toHaveCount(1);
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Moskva"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap[data-region="Paris"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap-marker')).toHaveCount(0);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-overlap-dot')).toHaveCount(0);
});

test('formable capital hover does not show the current owner capital marker', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

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

test('reachable capital button shows capital markers that pin without plus buttons', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

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

test('reachable capital hover keeps candidate marker DOM stable after multiple pins', async ({ page }) => {
  await page.goto('/?worldWrap=0&debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

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

test('map pan after multiple reachable capital pins avoids hover and marker churn during drag', async ({ page }) => {
  await page.goto('/?debugRenderStats=1');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

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
  expect(duringStats.reachableCapitalCandidateRebuilds).toBe(0);
  expect(duringStats.capitalMarkerRebuilds).toBe(0);
  expect(duringStats.manualEnvelopeRebuilds).toBe(0);
  expect(duringStats.hoverOutlineReplacements).toBe(0);
  expect(duringStats.foreignHoverOverlayReplacements).toBe(0);
  expect(duringStats.fullVisualStateApplications).toBe(0);

  await page.mouse.up();
  await waitForAnimationFrames(page, 3);
  await hoverRegion(page, 'Moskva');
  await expect(page.locator('#hoverPill')).not.toHaveText('Hover: -');
});

test('reachable capitals omit nations fully included in the selected regions claims', async ({ page }) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await clickRegion(page, 'Paris');
  await expect(page.locator('#search')).toHaveValue(/France/);

  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="EastGermany"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Poland"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Kiev"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="BasqueCountry"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Katowice"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Milan"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="EastGermany"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Poland"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Kiev"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="BasqueCountry"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Katowice"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Milan"]')).toHaveCount(0);

  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Moskva"]')).toHaveCount(1);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Moskva"]')).toHaveCount(1);

  await clickRegion(page, 'Moskva');
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Moskva"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-region="Irkutsk"][data-envelope-depth="1"][data-envelope-claimant="RUS"]')).toHaveCount(1);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Portugal"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Irkutsk"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Portugal"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Irkutsk"]')).toHaveCount(0);
});

test('claim cards synchronize map overlays, panel state, and empty map clear', async ({ page }) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({ timeout: 10000 });

  await chooseNation(page, 'Brazil', 'BRA');
  await clickRegion(page, 'Amazonia');
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText('Manaus');
  await expect(page.locator('.claimListItem[data-claim-kind="incoming"]')).toHaveCount(4);

  await page.locator('.claimListItem[data-claim-kind="outgoing"]').first().click();
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#projectSel')).toHaveValue('Project_GranColombia');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 5, research tiers 1');
  await expect(page.locator('.claimListItem.active[data-claim-kind="outgoing"]')).toHaveCount(1);
  await expect(page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]').first()).toBeVisible();

  await page.locator('.claimListItem[data-claim-kind="incoming"]').first().click();
  await expect(page.locator('#search')).toHaveValue(/Bolivia/);
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#projectSel')).toHaveValue('');
  await expect(page.locator('#claimPill')).toHaveText('Bolivia: territory 1, claims 25, research tiers 0');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(26);
  await expect(page.locator('.claimListItem.active[data-claim-kind="outgoing"]')).toHaveCount(1);

  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region]')).toHaveCount(1);
  await clearMap(page);
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#claimMode')).toHaveValue('all');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
});
