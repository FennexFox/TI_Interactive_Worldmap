// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const DEFAULT_PORT = 4175;
const DEFAULT_OUT_DIR = '.chatgpt/tool-tests/render-stats';
const DEFAULT_ZOOM_STEPS = [0, 3, 6];
const DEFAULT_EXTRA_NATIONS_BY_PRIMARY = new Map([
  ['CHN', ['JPN', 'THA']],
]);
const SUMMARY_COLUMNS = [
  'scenario',
  'repeat',
  'zoomSteps',
  'mapZoomArea',
  'mapViewWidth',
  'mapViewHeight',
  'panFrameMsCount',
  'panFrameMsTotal',
  'panFrameMsAvg',
  'panFrameMsMax',
  'mapViewApplyMsMax',
  'visibleSvgNodeCount',
  'claimOverlayPathCount',
  'claimOverlayUseCount',
  'claimFillPathCount',
  'claimFillUseCount',
  'claimOutlinePathCount',
  'claimOutlineUseCount',
  'claimHatchGroupCount',
  'claimHatchPathCount',
  'claimClipPathCount',
  'claimLabelCount',
  'baseRegionPathCount',
  'baseRegionUseCount',
  'hitPathCount',
  'hitUseCount',
  'hitGeometryDefPathCount',
  'hitGeometryDefPathDBytes',
  'totalHitGeometryDBytes',
  'worldCopyBasePathCount',
  'worldCopyBaseUseCount',
  'worldCopyHitPathCount',
  'worldCopyHitUseCount',
  'baseRegionPathDBytes',
  'hitPathDBytes',
  'totalRegionPathDBytes',
  'canonicalRegionPathCount',
  'canonicalRegionPathDBytes',
  'canonicalHitPathCount',
  'canonicalHitPathDBytes',
  'labelCount',
  'labelCopyGroupCount',
  'wrappedLabelCopyCount',
  'labelRenderCalls',
  'labelDomReplacements',
  'labelRenderSkippedByDebug',
  'labelRenderMsCount',
  'labelRenderMsTotal',
  'labelRenderMsMax',
  'labelVisibleState',
  'debugLabelsDisabled',
  'debugCanonicalHitPaths',
  'selectionOutlinePathCount',
  'hoverOutlinePathCount',
  'hoverClaimPreviewOverlayPathCount',
  'foreignHoverOverlayPathCount',
  'secondaryHoverOverlayPathCount',
  'manualEnvelopeOverlayPathCount',
  'pinnedRegionMarkerCount',
  'totalClipPathCount',
  'worldCopyContextCount',
  'hostileHatchDisabled',
  'setupSelectionOutlinePathCount',
  'setupPinnedRegionMarkerCount',
  'setupPinnedRegionsPanelChildCount',
  'setupClaimOverlayPathCount',
  'setupClaimOverlayUseCount',
  'setupClaimFillPathCount',
  'setupClaimFillUseCount',
  'setupClaimOutlinePathCount',
  'setupClaimOutlineUseCount',
  'setupClaimHatchGroupCount',
  'setupClaimHatchPathCount',
  'setupClaimClipPathCount',
  'setupClaimLabelCount',
  'setupBaseRegionPathCount',
  'setupBaseRegionUseCount',
  'setupHitPathCount',
  'setupHitUseCount',
  'setupHitGeometryDefPathCount',
  'setupHitGeometryDefPathDBytes',
  'setupTotalHitGeometryDBytes',
  'setupWorldCopyBasePathCount',
  'setupWorldCopyBaseUseCount',
  'setupWorldCopyHitPathCount',
  'setupWorldCopyHitUseCount',
  'setupBaseRegionPathDBytes',
  'setupHitPathDBytes',
  'setupTotalRegionPathDBytes',
  'setupCanonicalRegionPathCount',
  'setupCanonicalRegionPathDBytes',
  'setupCanonicalHitPathCount',
  'setupCanonicalHitPathDBytes',
  'setupLabelCount',
  'setupLabelCopyGroupCount',
  'setupWrappedLabelCopyCount',
  'setupLabelVisibleState',
  'setupDebugLabelsDisabled',
  'setupDebugCanonicalHitPaths',
  'setupManualEnvelopeOverlayPathCount',
  'setupForeignHoverOverlayPathCount',
  'setupForeignHoverOverlayUseCount',
  'setupSecondaryHoverOverlayPathCount',
  'setupSecondaryHoverOverlayUseCount',
  'setupHoverOutlinePathCount',
  'setupHoverClaimPreviewOverlayPathCount',
  'setupTotalClipPathCount',
  'claimOverlayDomReplacements',
  'claimOverlayInactiveBufferRebuilds',
  'claimOverlayBufferSwaps',
  'claimLabelDomReplacements',
  'foreignHoverOverlayReplacements',
  'secondaryHoverOverlayReplacements',
  'hoverOutlineReplacements',
  'zoomLabelRenderCalls',
  'zoomLabelDomReplacements',
  'zoomLabelRenderSkippedByDebug',
  'zoomLabelCount',
  'zoomWrappedLabelCopyCount',
  'hoverLabelRenderCalls',
  'hoverLabelDomReplacements',
  'hoverLabelRenderSkippedByDebug',
  'wrapToggleLabelRenderCalls',
  'wrapToggleLabelDomReplacements',
  'wrapToggleLabelRenderSkippedByDebug',
  'languageRefreshLabelRenderCalls',
  'languageRefreshLabelDomReplacements',
  'languageRefreshLabelRenderSkippedByDebug',
  'setupOk',
  'setupFailures',
];

function parseArgs(argv) {
  const args = {
    baseUrl: '',
    port: DEFAULT_PORT,
    outDir: DEFAULT_OUT_DIR,
    repeats: 1,
    zoomSteps: DEFAULT_ZOOM_STEPS,
    build: false,
    noServer: false,
    rawJson: false,
    summaryJson: false,
    nation: 'CHN',
    project: 'Project_GreaterPanAsia',
    extraNations: null,
    panSteps: 24,
    includeCanonicalHitPaths: false,
    canonicalHitPathsOnly: false,
  };
  for (const arg of argv) {
    if (arg === '--build') args.build = true;
    else if (arg === '--no-server') args.noServer = true;
    else if (arg === '--raw-json') args.rawJson = true;
    else if (arg === '--summary-json') args.summaryJson = true;
    else if (arg === '--include-canonical-hit-paths') args.includeCanonicalHitPaths = true;
    else if (arg === '--canonical-hit-paths-only') args.canonicalHitPathsOnly = true;
    else if (arg.startsWith('--base-url=')) args.baseUrl = arg.slice('--base-url='.length).replace(/\/$/, '');
    else if (arg.startsWith('--port=')) args.port = Number(arg.slice('--port='.length));
    else if (arg.startsWith('--out=')) args.outDir = arg.slice('--out='.length);
    else if (arg.startsWith('--repeats=')) args.repeats = Number(arg.slice('--repeats='.length));
    else if (arg.startsWith('--zoom-steps=')) args.zoomSteps = arg.slice('--zoom-steps='.length).split(',').map(Number).filter(Number.isFinite);
    else if (arg.startsWith('--nation=')) args.nation = arg.slice('--nation='.length);
    else if (arg.startsWith('--project=')) args.project = arg.slice('--project='.length);
    else if (arg.startsWith('--extra-nations=')) {
      const raw = arg.slice('--extra-nations='.length).trim();
      args.extraNations = raw ? raw.split(',').map(value => value.trim()).filter(Boolean) : [];
    }
    else if (arg.startsWith('--pan-steps=')) args.panSteps = Number(arg.slice('--pan-steps='.length));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(args.port) || args.port <= 0) throw new Error('--port must be a positive number.');
  if (!Number.isFinite(args.repeats) || args.repeats <= 0) throw new Error('--repeats must be a positive number.');
  if (!args.zoomSteps.length) throw new Error('--zoom-steps must include at least one finite number.');
  if (!Number.isFinite(args.panSteps) || args.panSteps <= 0) throw new Error('--pan-steps must be a positive number.');
  if (args.extraNations === null) args.extraNations = DEFAULT_EXTRA_NATIONS_BY_PRIMARY.get(args.nation) || [];
  return args;
}

function spawnCommand(command, args, options = {}) {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  return new Promise((resolvePromise, reject) => {
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function waitForServer(baseUrl, timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${baseUrl}`);
}

function startServer(port) {
  const child = spawn('python', ['-m', 'http.server', String(port), '--directory', 'docs'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  child.stdout.on('data', chunk => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on('data', chunk => process.stderr.write(`[server] ${chunk}`));
  return child;
}

function scenarioUrl(baseUrl, query) {
  return `${baseUrl}/?${query}`;
}

function canonicalHitPathScenario(scenario) {
  return {
    ...scenario,
    name: `${scenario.name}-canonical-hit-paths`,
    query: `${scenario.query}&debugUseCanonicalHitPaths=1`,
  };
}

async function selectSearchResult(page, requestedValue) {
  const search = page.locator('#search');
  await search.click();
  await search.fill(requestedValue);
  await search.dispatchEvent('input');
  await page.waitForTimeout(250);
  const result = await page.evaluate(({ requestedValue }) => {
    const dropdown = document.querySelector('#nationDropdown');
    if (!dropdown) return { ok: false, selector: '#nationDropdown', reason: 'missing dropdown' };
    const wanted = String(requestedValue || '').trim().toLowerCase();
    const candidates = [...dropdown.querySelectorAll('[role="option"], button, [data-value], [data-nation], [data-tag], div')]
      .filter(el => el && el.offsetParent !== null && (el.textContent || el.dataset?.value || el.dataset?.nation || el.dataset?.tag));
    const score = el => {
      const text = (el.textContent || '').trim().toLowerCase();
      const values = [
        el.getAttribute('data-value'),
        el.getAttribute('data-nation'),
        el.getAttribute('data-tag'),
        el.getAttribute('data-region'),
        el.getAttribute('data-id'),
        text,
      ].filter(Boolean).map(value => String(value).trim().toLowerCase());
      if (values.some(value => value === wanted)) return 4;
      if (values.some(value => value.startsWith(wanted))) return 3;
      if (values.some(value => value.includes(wanted))) return 2;
      return 0;
    };
    const target = candidates
      .map(el => ({ el, score: score(el) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.el;
    if (!target) {
      return {
        ok: false,
        selector: '#nationDropdown',
        reason: `missing option ${requestedValue}`,
        sample: (dropdown.textContent || '').trim().slice(0, 240),
      };
    }
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    target.click();
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    return {
      ok: true,
      selector: '#search',
      value: requestedValue,
      label: (target.textContent || '').trim().slice(0, 120),
    };
  }, { requestedValue });
  await page.waitForTimeout(250);
  return result;
}

async function setSelectValue(page, selector, requestedValue) {
  return page.evaluate(({ selector, requestedValue }) => {
    const el = document.querySelector(selector);
    if (!el || !('options' in el)) return { ok: false, selector, reason: 'missing select' };
    const option = [...el.options].find(candidate => candidate.value === requestedValue || candidate.textContent?.includes(requestedValue));
    if (!option) {
      return {
        ok: false,
        selector,
        reason: `missing option ${requestedValue}`,
        sample: [...el.options].slice(0, 20).map(candidate => candidate.value || candidate.textContent?.trim()).join('|'),
      };
    }
    el.value = option.value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, selector, value: option.value, label: option.textContent?.trim() || option.value };
  }, { selector, requestedValue });
}

async function clickSelectedRegionOnMap(page, label) {
  const target = await page.evaluate(({ label }) => {
    const describe = el => [
      el.id,
      el.getAttribute('data-region'),
      el.getAttribute('data-regions'),
      el.getAttribute('data-nation'),
      el.getAttribute('data-tag'),
      el.getAttribute('data-value'),
      el.getAttribute('aria-label'),
      el.getAttribute('title'),
      el.textContent,
      ...Object.values(el.dataset || {}),
    ].filter(Boolean).join(' ');
    const wanted = String(label || '').trim().toLowerCase();
    const visiblePaths = [...document.querySelectorAll('#selectionOutlines path, #hoverOutlines path, #hitRegions .region-hit')]
      .map(el => ({ el, rect: el.getBoundingClientRect(), text: describe(el).toLowerCase() }))
      .filter(item => item.rect.width > 0 && item.rect.height > 0);
    const scored = visiblePaths
      .map(item => {
        const group = item.el.closest('g')?.id || '';
        let score = 0;
        if (item.text === wanted) score += 100;
        if (item.text.includes(wanted)) score += 50;
        if (group === 'selectionOutlines') score += 30;
        if (group === 'hoverOutlines') score += 20;
        if (group === 'hitRegions') score += 10;
        const area = item.rect.width * item.rect.height;
        return { ...item, score, area, group };
      })
      .filter(item => item.score > 0 || item.group === 'selectionOutlines' || item.group === 'hoverOutlines');
    const selected = scored.sort((a, b) => b.score - a.score || b.area - a.area)[0];
    if (!selected) {
      return {
        ok: false,
        selector: '#selectionOutlines/#hoverOutlines/#hitRegions',
        value: label,
        reason: 'missing visible selected or hit region',
        sample: visiblePaths.slice(0, 10).map(item => `${item.el.closest('g')?.id || '?'}:${describe(item.el)}`).join(' | '),
      };
    }
    const x = selected.rect.left + selected.rect.width / 2;
    const y = selected.rect.top + selected.rect.height / 2;
    return {
      ok: true,
      selector: `#${selected.group || 'unknown'} .region-hit`,
      value: label,
      x,
      y,
      label: describe(selected.el).slice(0, 120) || `clicked map region for ${label}`,
    };
  }, { label });
  if (!target.ok) return target;
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(180);
  return {
    ok: true,
    selector: target.selector,
    value: label,
    label: target.label,
  };
}

async function configureClaimOverlay(page, { nation, project, extraNations = [] }) {
  const setup = [];
  setup.push(await selectSearchResult(page, nation));
  await page.waitForTimeout(250);
  setup.push(await setSelectValue(page, '#projectSel', project));
  await page.waitForTimeout(200);
  setup.push({
    ok: true,
    selector: '--extra-nations',
    value: extraNations.join(','),
    label: extraNations.length ? extraNations.join(', ') : 'none',
  });
  for (const extraNation of extraNations) {
    setup.push(await selectSearchResult(page, extraNation));
    await page.waitForTimeout(250);
    setup.push(await clickSelectedRegionOnMap(page, extraNation));
    await page.waitForTimeout(150);
  }
  if (extraNations.length) {
    setup.push(await selectSearchResult(page, nation));
    await page.waitForTimeout(250);
    setup.push(await setSelectValue(page, '#projectSel', project));
    await page.waitForTimeout(200);
  }
  return setup;
}

async function configureComplexOverlayState(page) {
  const setup = [];
  const hoverTarget = await primeHoverOverlay(page);
  setup.push(hoverTarget);
  return setup;
}

async function configureLabelState(page, enabled) {
  if (!enabled) {
    return { ok: true, selector: '#showLabels', value: 'off', label: 'labels left at default off' };
  }
  const labelResult = await page.evaluate(() => {
    const button = document.querySelector('#showLabels');
    const labels = document.querySelector('#labels');
    if (!button || !labels) return { ok: false, selector: '#showLabels', reason: 'missing label toggle' };
    const stats = window.__TI_DEBUG_RENDER_STATS__;
    if (stats?.labelVisibleState !== 1) button.click();
    return { ok: true, selector: '#showLabels', label: 'labels enabled' };
  });
  await page.waitForTimeout(180);
  return labelResult;
}

async function primeHoverOverlay(page) {
  const candidates = ['Amazonia', 'FrenchGuiana', 'Hokkaido', 'NorthHonshu', 'Beijing'];
  for (const region of candidates) {
    const target = await page.evaluate(({ region }) => {
      const selector = `#hitRegions .region-hit[data-region="${CSS.escape(region)}"][data-wrap-canonical="1"]`;
      const el = document.querySelector(selector);
      const rect = el?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        return { ok: false, selector, region, reason: 'missing visible hover target' };
      }
      return { ok: true, selector, region, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, { region });
    if (!target.ok) continue;
    await page.mouse.move(target.x, target.y);
    await page.waitForTimeout(250);
    const counts = await page.evaluate(() => ({
      hoverOutlinePathCount: document.querySelectorAll('#hoverOutlines path').length,
      hoverClaimPreviewOverlayPathCount: document.querySelectorAll('#hoverClaimPreviewOverlays path').length,
      foreignHoverOverlayPathCount: document.querySelectorAll('#foreignHoverOverlays path').length,
      secondaryHoverOverlayPathCount: document.querySelectorAll('#secondaryHoverOverlays path').length,
    }));
    const overlayPathCount = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
    if (overlayPathCount > 0) {
      return {
        ok: true,
        selector: target.selector,
        value: target.region,
        label: `hover overlay primed (${overlayPathCount} paths)`,
        ...counts,
      };
    }
  }
  return {
    ok: false,
    selector: '#hitRegions .region-hit',
    reason: `no hover overlays after candidates: ${candidates.join(', ')}`,
  };
}

async function resetStats(page) {
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__?.reset?.());
}

async function zoomMap(page, steps) {
  const map = page.locator('#map');
  const box = await map.boundingBox();
  if (!box) throw new Error('Could not locate #map bounding box.');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, -650);
    await page.waitForTimeout(60);
  }
  return { x, y };
}

async function panMap(page, { x, y }, steps) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i += 1) {
    const dx = (i / steps) * 360;
    const dy = Math.sin(i / steps * Math.PI) * 60;
    await page.mouse.move(x + dx, y + dy);
  }
  await page.mouse.up();
  await page.waitForTimeout(100);
}

async function captureStats(page) {
  return page.evaluate(() => {
    const stats = window.__TI_DEBUG_RENDER_STATS__;
    return stats ? { ...stats } : null;
  });
}

async function captureInteractionStats(page, action) {
  await resetStats(page);
  const setup = await action();
  await page.waitForTimeout(220);
  return {
    setup,
    stats: await captureStats(page),
  };
}

async function captureInteractionProbes(page, scenario) {
  const hover = await captureInteractionStats(page, () => primeHoverOverlay(page));
  const languageRefresh = await captureInteractionStats(page, async () => page.evaluate(() => {
    const select = document.querySelector('#languageSel');
    if (!select) return { ok: false, selector: '#languageSel', reason: 'missing language select' };
    select.value = select.value === 'ko' ? 'en' : 'ko';
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, selector: '#languageSel', value: select.value, label: 'language changed' };
  }));
  await page.evaluate(() => {
    const select = document.querySelector('#languageSel');
    if (!select || select.value === 'en') return;
    select.value = 'en';
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(220);
  const wrapToggle = await captureInteractionStats(page, async () => page.evaluate(() => {
    const button = document.querySelector('[data-map-view-wrap-toggle]');
    if (!button) return { ok: false, selector: '[data-map-view-wrap-toggle]', reason: 'missing wrap toggle' };
    button.click();
    return { ok: true, selector: '[data-map-view-wrap-toggle]', label: 'world wrap toggled' };
  }));
  await page.evaluate(({ restoreEnabled }) => {
    const button = document.querySelector('[data-map-view-wrap-toggle]');
    const currentlyEnabled = button?.getAttribute('aria-pressed') === 'true';
    if (button && currentlyEnabled !== restoreEnabled) button.click();
  }, { restoreEnabled: scenario.query.includes('worldWrap=1') });
  await page.waitForTimeout(220);
  return {
    hover,
    languageRefresh,
    wrapToggle,
  };
}

async function captureSetupStats(page) {
  return page.evaluate(() => {
    const count = selector => document.querySelectorAll(selector).length;
    const dBytes = selector => [...document.querySelectorAll(selector)]
      .reduce((sum, element) => sum + String(element.getAttribute('d') || '').length, 0);
    const countVisible = selector => [...document.querySelectorAll(selector)]
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length;
    const panel = document.querySelector('#pinnedRegionsPanel');
    const setupBaseRegionPathDBytes = dBytes('#regions path.region');
    const setupHitPathDBytes = dBytes('#hitRegions path.region-hit');
    const setupHitGeometryDefPathDBytes = dBytes('#hitRegions path.region-hit-geometry');
    const setupTotalHitGeometryDBytes = setupHitPathDBytes + setupHitGeometryDefPathDBytes;
    return {
      setupSelectionOutlinePathCount: countVisible('#selectionOutlines path'),
      setupPinnedRegionMarkerCount: countVisible('#pinnedRegionsPanel [data-region], #pinnedRegionsPanel [data-regions], #pinnedRegionsPanel li, #pinnedRegionsPanel button'),
      setupPinnedRegionsPanelChildCount: panel ? panel.querySelectorAll('*').length : 0,
      setupClaimOverlayPathCount: count('#claimOverlay path, #claimOverlays path, #claimOverlayLayer path, .claim-overlay path, .claimOverlay path, [data-layer="claim-overlay"] path'),
      setupClaimOverlayUseCount: count('#claimOverlays use, #claimOverlay use, #claimOverlayLayer use'),
      setupClaimFillPathCount: count('#claimOverlays path.claim-fill-group, #claimOverlay path.claim-fill-group, #claimOverlayLayer path.claim-fill-group'),
      setupClaimFillUseCount: count('#claimOverlays use.claim-fill-group, #claimOverlay use.claim-fill-group, #claimOverlayLayer use.claim-fill-group'),
      setupClaimOutlinePathCount: count('#claimOverlays path.claim-overlay, #claimOverlay path.claim-overlay, #claimOverlayLayer path.claim-overlay'),
      setupClaimOutlineUseCount: count('#claimOverlays use.claim-overlay, #claimOverlay use.claim-overlay, #claimOverlayLayer use.claim-overlay'),
      setupClaimHatchGroupCount: count('#claimOverlays .claim-hatch-group, #claimOverlay .claim-hatch-group, #claimOverlayLayer .claim-hatch-group'),
      setupClaimHatchPathCount: count('#claimOverlays .claim-hatch-line, #claimOverlay .claim-hatch-line, #claimOverlayLayer .claim-hatch-line'),
      setupClaimClipPathCount: count('#claimOverlays clipPath, #claimOverlay clipPath, #claimOverlayLayer clipPath'),
      setupClaimLabelCount: count('#claimLabels text.claim-label, #claimLabel text.claim-label, #claimLabelLayer text.claim-label'),
      setupBaseRegionPathCount: count('#regions path.region'),
      setupBaseRegionUseCount: count('#regions use.region'),
      setupHitPathCount: count('#hitRegions path.region-hit'),
      setupHitUseCount: count('#hitRegions use.region-hit'),
      setupHitGeometryDefPathCount: count('#hitRegions path.region-hit-geometry'),
      setupHitGeometryDefPathDBytes,
      setupTotalHitGeometryDBytes,
      setupWorldCopyBasePathCount: count('#regions path.region[data-wrap-canonical="0"]'),
      setupWorldCopyBaseUseCount: count('#regions use.region[data-wrap-canonical="0"]'),
      setupWorldCopyHitPathCount: count('#hitRegions path.region-hit[data-wrap-canonical="0"]'),
      setupWorldCopyHitUseCount: count('#hitRegions use.region-hit[data-wrap-canonical="0"]'),
      setupBaseRegionPathDBytes,
      setupHitPathDBytes,
      setupTotalRegionPathDBytes: setupBaseRegionPathDBytes + setupTotalHitGeometryDBytes,
      setupCanonicalRegionPathCount: count('#regions path.region[data-wrap-canonical="1"]'),
      setupCanonicalRegionPathDBytes: dBytes('#regions path.region[data-wrap-canonical="1"]'),
      setupCanonicalHitPathCount: count('#hitRegions path.region-hit[data-wrap-canonical="1"]'),
      setupCanonicalHitPathDBytes: dBytes('#hitRegions path.region-hit[data-wrap-canonical="1"]'),
      setupLabelCount: count('#labels text.label'),
      setupLabelCopyGroupCount: count('#labels .label-copy'),
      setupWrappedLabelCopyCount: count('#labels text.label[data-wrap-canonical="0"]'),
      setupLabelVisibleState: window.__TI_DEBUG_RENDER_STATS__?.labelVisibleState || 0,
      setupDebugLabelsDisabled: window.__TI_DEBUG_RENDER_STATS__?.debugLabelsDisabled || 0,
      setupDebugCanonicalHitPaths: window.__TI_DEBUG_RENDER_STATS__?.debugCanonicalHitPaths || 0,
      setupManualEnvelopeOverlayPathCount: count('#manualEnvelopeOverlay path, #manualEnvelopeOverlays path, .manual-envelope-overlay path, [data-layer="manual-envelope-overlay"] path'),
      setupForeignHoverOverlayPathCount: count('#foreignHoverOverlay path, #foreignHoverOverlays path, .foreign-hover-overlay path, [data-layer="foreign-hover-overlay"] path'),
      setupForeignHoverOverlayUseCount: count('#foreignHoverOverlay use, #foreignHoverOverlays use'),
      setupSecondaryHoverOverlayPathCount: count('#secondaryHoverOverlay path, #secondaryHoverOverlays path, .secondary-hover-overlay path, [data-layer="secondary-hover-overlay"] path'),
      setupSecondaryHoverOverlayUseCount: count('#secondaryHoverOverlay use, #secondaryHoverOverlays use'),
      setupHoverOutlinePathCount: count('#hoverOutlines path'),
      setupHoverClaimPreviewOverlayPathCount: count('#hoverClaimPreviewOverlays path'),
      setupTotalClipPathCount: count('clipPath'),
    };
  });
}

function summarize(results) {
  const stat = (source, key) => source?.[key];
  const probeStat = (item, probe, key) => stat(item.interactionStats?.[probe]?.stats, key);
  return results.map(item => ({
    scenario: item.scenario,
    repeat: item.repeat,
    zoomSteps: item.zoomSteps,
    mapZoomArea: item.stats?.mapZoomArea,
    mapViewWidth: item.stats?.mapViewWidth,
    mapViewHeight: item.stats?.mapViewHeight,
    panFrameMsCount: item.stats?.panFrameMsCount,
    panFrameMsTotal: item.stats?.panFrameMsTotal,
    panFrameMsAvg: item.stats?.panFrameMsCount ? Number((item.stats.panFrameMsTotal / item.stats.panFrameMsCount).toFixed(3)) : 0,
    panFrameMsMax: item.stats?.panFrameMsMax,
    mapViewApplyMsMax: item.stats?.mapViewApplyMsMax,
    visibleSvgNodeCount: item.stats?.visibleSvgNodeCount,
    claimOverlayPathCount: item.stats?.claimOverlayPathCount,
    claimOverlayUseCount: item.stats?.claimOverlayUseCount,
    claimFillPathCount: item.stats?.claimFillPathCount,
    claimFillUseCount: item.stats?.claimFillUseCount,
    claimOutlinePathCount: item.stats?.claimOutlinePathCount,
    claimOutlineUseCount: item.stats?.claimOutlineUseCount,
    claimHatchGroupCount: item.stats?.claimHatchGroupCount,
    claimHatchPathCount: item.stats?.claimHatchPathCount,
    claimClipPathCount: item.stats?.claimClipPathCount,
    claimLabelCount: item.stats?.claimLabelCount,
    baseRegionPathCount: item.stats?.baseRegionPathCount,
    baseRegionUseCount: item.stats?.baseRegionUseCount,
    hitPathCount: item.stats?.hitPathCount,
    hitUseCount: item.stats?.hitUseCount,
    hitGeometryDefPathCount: item.stats?.hitGeometryDefPathCount,
    hitGeometryDefPathDBytes: item.stats?.hitGeometryDefPathDBytes,
    totalHitGeometryDBytes: item.stats?.totalHitGeometryDBytes,
    worldCopyBasePathCount: item.stats?.worldCopyBasePathCount,
    worldCopyBaseUseCount: item.stats?.worldCopyBaseUseCount,
    worldCopyHitPathCount: item.stats?.worldCopyHitPathCount,
    worldCopyHitUseCount: item.stats?.worldCopyHitUseCount,
    baseRegionPathDBytes: item.stats?.baseRegionPathDBytes,
    hitPathDBytes: item.stats?.hitPathDBytes,
    totalRegionPathDBytes: item.stats?.totalRegionPathDBytes,
    canonicalRegionPathCount: item.stats?.canonicalRegionPathCount,
    canonicalRegionPathDBytes: item.stats?.canonicalRegionPathDBytes,
    canonicalHitPathCount: item.stats?.canonicalHitPathCount,
    canonicalHitPathDBytes: item.stats?.canonicalHitPathDBytes,
    labelCount: item.stats?.labelCount,
    labelCopyGroupCount: item.stats?.labelCopyGroupCount,
    wrappedLabelCopyCount: item.stats?.wrappedLabelCopyCount,
    labelRenderCalls: item.stats?.labelRenderCalls,
    labelDomReplacements: item.stats?.labelDomReplacements,
    labelRenderSkippedByDebug: item.stats?.labelRenderSkippedByDebug,
    labelRenderMsCount: item.stats?.labelRenderMsCount,
    labelRenderMsTotal: item.stats?.labelRenderMsTotal,
    labelRenderMsMax: item.stats?.labelRenderMsMax,
    labelVisibleState: item.stats?.labelVisibleState,
    debugLabelsDisabled: item.stats?.debugLabelsDisabled,
    debugCanonicalHitPaths: item.stats?.debugCanonicalHitPaths,
    selectionOutlinePathCount: item.stats?.selectionOutlinePathCount,
    hoverOutlinePathCount: item.stats?.hoverOutlinePathCount,
    hoverClaimPreviewOverlayPathCount: item.stats?.hoverClaimPreviewOverlayPathCount,
    foreignHoverOverlayPathCount: item.stats?.foreignHoverOverlayPathCount,
    secondaryHoverOverlayPathCount: item.stats?.secondaryHoverOverlayPathCount,
    manualEnvelopeOverlayPathCount: item.stats?.manualEnvelopeOverlayPathCount,
    pinnedRegionMarkerCount: item.stats?.pinnedRegionMarkerCount,
    totalClipPathCount: item.stats?.totalClipPathCount,
    worldCopyContextCount: item.stats?.worldCopyContextCount,
    hostileHatchDisabled: item.stats?.hostileHatchDisabled,
    setupSelectionOutlinePathCount: item.setupStats?.setupSelectionOutlinePathCount,
    setupPinnedRegionMarkerCount: item.setupStats?.setupPinnedRegionMarkerCount,
    setupPinnedRegionsPanelChildCount: item.setupStats?.setupPinnedRegionsPanelChildCount,
    setupClaimOverlayPathCount: item.setupStats?.setupClaimOverlayPathCount,
    setupClaimOverlayUseCount: item.setupStats?.setupClaimOverlayUseCount,
    setupClaimFillPathCount: item.setupStats?.setupClaimFillPathCount,
    setupClaimFillUseCount: item.setupStats?.setupClaimFillUseCount,
    setupClaimOutlinePathCount: item.setupStats?.setupClaimOutlinePathCount,
    setupClaimOutlineUseCount: item.setupStats?.setupClaimOutlineUseCount,
    setupClaimHatchGroupCount: item.setupStats?.setupClaimHatchGroupCount,
    setupClaimHatchPathCount: item.setupStats?.setupClaimHatchPathCount,
    setupClaimClipPathCount: item.setupStats?.setupClaimClipPathCount,
    setupClaimLabelCount: item.setupStats?.setupClaimLabelCount,
    setupBaseRegionPathCount: item.setupStats?.setupBaseRegionPathCount,
    setupBaseRegionUseCount: item.setupStats?.setupBaseRegionUseCount,
    setupHitPathCount: item.setupStats?.setupHitPathCount,
    setupHitUseCount: item.setupStats?.setupHitUseCount,
    setupHitGeometryDefPathCount: item.setupStats?.setupHitGeometryDefPathCount,
    setupHitGeometryDefPathDBytes: item.setupStats?.setupHitGeometryDefPathDBytes,
    setupTotalHitGeometryDBytes: item.setupStats?.setupTotalHitGeometryDBytes,
    setupWorldCopyBasePathCount: item.setupStats?.setupWorldCopyBasePathCount,
    setupWorldCopyBaseUseCount: item.setupStats?.setupWorldCopyBaseUseCount,
    setupWorldCopyHitPathCount: item.setupStats?.setupWorldCopyHitPathCount,
    setupWorldCopyHitUseCount: item.setupStats?.setupWorldCopyHitUseCount,
    setupBaseRegionPathDBytes: item.setupStats?.setupBaseRegionPathDBytes,
    setupHitPathDBytes: item.setupStats?.setupHitPathDBytes,
    setupTotalRegionPathDBytes: item.setupStats?.setupTotalRegionPathDBytes,
    setupCanonicalRegionPathCount: item.setupStats?.setupCanonicalRegionPathCount,
    setupCanonicalRegionPathDBytes: item.setupStats?.setupCanonicalRegionPathDBytes,
    setupCanonicalHitPathCount: item.setupStats?.setupCanonicalHitPathCount,
    setupCanonicalHitPathDBytes: item.setupStats?.setupCanonicalHitPathDBytes,
    setupLabelCount: item.setupStats?.setupLabelCount,
    setupLabelCopyGroupCount: item.setupStats?.setupLabelCopyGroupCount,
    setupWrappedLabelCopyCount: item.setupStats?.setupWrappedLabelCopyCount,
    setupLabelVisibleState: item.setupStats?.setupLabelVisibleState,
    setupDebugLabelsDisabled: item.setupStats?.setupDebugLabelsDisabled,
    setupDebugCanonicalHitPaths: item.setupStats?.setupDebugCanonicalHitPaths,
    setupManualEnvelopeOverlayPathCount: item.setupStats?.setupManualEnvelopeOverlayPathCount,
    setupForeignHoverOverlayPathCount: item.setupStats?.setupForeignHoverOverlayPathCount,
    setupForeignHoverOverlayUseCount: item.setupStats?.setupForeignHoverOverlayUseCount,
    setupSecondaryHoverOverlayPathCount: item.setupStats?.setupSecondaryHoverOverlayPathCount,
    setupSecondaryHoverOverlayUseCount: item.setupStats?.setupSecondaryHoverOverlayUseCount,
    setupHoverOutlinePathCount: item.setupStats?.setupHoverOutlinePathCount,
    setupHoverClaimPreviewOverlayPathCount: item.setupStats?.setupHoverClaimPreviewOverlayPathCount,
    setupTotalClipPathCount: item.setupStats?.setupTotalClipPathCount,
    claimOverlayDomReplacements: item.stats?.claimOverlayDomReplacements,
    claimOverlayInactiveBufferRebuilds: item.stats?.claimOverlayInactiveBufferRebuilds,
    claimOverlayBufferSwaps: item.stats?.claimOverlayBufferSwaps,
    claimLabelDomReplacements: item.stats?.claimLabelDomReplacements,
    foreignHoverOverlayReplacements: item.stats?.foreignHoverOverlayReplacements,
    secondaryHoverOverlayReplacements: item.stats?.secondaryHoverOverlayReplacements,
    hoverOutlineReplacements: item.stats?.hoverOutlineReplacements,
    zoomLabelRenderCalls: stat(item.zoomStats, 'labelRenderCalls'),
    zoomLabelDomReplacements: stat(item.zoomStats, 'labelDomReplacements'),
    zoomLabelRenderSkippedByDebug: stat(item.zoomStats, 'labelRenderSkippedByDebug'),
    zoomLabelCount: stat(item.zoomStats, 'labelCount'),
    zoomWrappedLabelCopyCount: stat(item.zoomStats, 'wrappedLabelCopyCount'),
    hoverLabelRenderCalls: probeStat(item, 'hover', 'labelRenderCalls'),
    hoverLabelDomReplacements: probeStat(item, 'hover', 'labelDomReplacements'),
    hoverLabelRenderSkippedByDebug: probeStat(item, 'hover', 'labelRenderSkippedByDebug'),
    wrapToggleLabelRenderCalls: probeStat(item, 'wrapToggle', 'labelRenderCalls'),
    wrapToggleLabelDomReplacements: probeStat(item, 'wrapToggle', 'labelDomReplacements'),
    wrapToggleLabelRenderSkippedByDebug: probeStat(item, 'wrapToggle', 'labelRenderSkippedByDebug'),
    languageRefreshLabelRenderCalls: probeStat(item, 'languageRefresh', 'labelRenderCalls'),
    languageRefreshLabelDomReplacements: probeStat(item, 'languageRefresh', 'labelDomReplacements'),
    languageRefreshLabelRenderSkippedByDebug: probeStat(item, 'languageRefresh', 'labelRenderSkippedByDebug'),
    setupOk: item.setup?.every(entry => entry?.ok !== false),
    setupFailures: item.setup?.filter(entry => entry?.ok === false).map(entry => `${entry.selector || entry.nation}: ${entry.reason}`).join(' | ') || '',
  }));
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) ? value.join('|') : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, columns = SUMMARY_COLUMNS) {
  const lines = [columns.map(csvEscape).join(',')];
  for (const row of rows) lines.push(columns.map(column => csvEscape(row[column])).join(','));
  return `${lines.join('\n')}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.build) await spawnCommand('npm', ['run', 'build']);

  const baseUrl = args.baseUrl || `http://127.0.0.1:${args.port}`;
  let server = null;
  if (!args.baseUrl && !args.noServer) {
    server = startServer(args.port);
  }

  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch({
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
    });
    const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
    const baseScenarios = [
      { name: 'wrap-off-labels', query: 'debugRenderStats=1&worldWrap=0', labels: true },
      { name: 'wrap-off-labels-disabled', query: 'debugRenderStats=1&worldWrap=0&debugDisableLabels=1', labels: true },
      { name: 'wrap-off-complex-overlays-labels', query: 'debugRenderStats=1&worldWrap=0', labels: true, complexOverlays: true },
      { name: 'wrap-off-complex-overlays-labels-disabled', query: 'debugRenderStats=1&worldWrap=0&debugDisableLabels=1', labels: true, complexOverlays: true },
      { name: 'wrap-on-labels', query: 'debugRenderStats=1&worldWrap=1', labels: true },
      { name: 'wrap-on-labels-disabled', query: 'debugRenderStats=1&worldWrap=1&debugDisableLabels=1', labels: true },
      { name: 'wrap-on-complex-overlays-labels', query: 'debugRenderStats=1&worldWrap=1', labels: true, complexOverlays: true },
      { name: 'wrap-on-complex-overlays-labels-disabled', query: 'debugRenderStats=1&worldWrap=1&debugDisableLabels=1', labels: true, complexOverlays: true },
    ];
    const canonicalHitPathScenarios = baseScenarios.map(canonicalHitPathScenario);
    const scenarios = args.canonicalHitPathsOnly
      ? canonicalHitPathScenarios
      : args.includeCanonicalHitPaths
        ? [...baseScenarios, ...canonicalHitPathScenarios]
        : baseScenarios;
    const results = [];

    for (const scenario of scenarios) {
      for (let repeat = 1; repeat <= args.repeats; repeat += 1) {
        for (const zoomSteps of args.zoomSteps) {
          await page.goto(scenarioUrl(baseUrl, scenario.query), { waitUntil: 'networkidle' });
          await page.waitForFunction(() => Boolean(window.__TI_DEBUG_RENDER_STATS__), null, { timeout: 10_000 });
          const setup = await configureClaimOverlay(page, args);
          setup.push(await configureLabelState(page, scenario.labels));
          if (scenario.complexOverlays) setup.push(...await configureComplexOverlayState(page));
          const setupStats = await captureSetupStats(page);
          const interactionStats = await captureInteractionProbes(page, scenario);
          await resetStats(page);
          const center = await zoomMap(page, zoomSteps);
          const zoomStats = await captureStats(page);
          await resetStats(page);
          await panMap(page, center, args.panSteps);
          const stats = await captureStats(page);
          const viewBox = await page.locator('#map').getAttribute('viewBox');
          results.push({
            capturedAt: new Date().toISOString(),
            scenario: scenario.name,
            url: scenarioUrl(baseUrl, scenario.query),
            repeat,
            zoomSteps,
            viewBox,
            setup,
            setupStats,
            interactionStats,
            zoomStats,
            stats,
          });
        }
      }
    }

    await browser.close();
    const outDir = resolve(args.outDir);
    await mkdir(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const summary = summarize(results);
    const csvPath = resolve(outDir, `debug-render-stats-${stamp}.summary.csv`);
    await writeFile(csvPath, toCsv(summary));
    console.table(summary);
    console.log(`Wrote ${csvPath}`);

    if (args.summaryJson) {
      const summaryJsonPath = resolve(outDir, `debug-render-stats-${stamp}.summary.json`);
      await writeFile(summaryJsonPath, JSON.stringify(summary, null, 2));
      console.log(`Wrote ${summaryJsonPath}`);
    }
    if (args.rawJson) {
      const jsonPath = resolve(outDir, `debug-render-stats-${stamp}.json`);
      await writeFile(jsonPath, JSON.stringify({ capturedAt: new Date().toISOString(), baseUrl, args, results }, null, 2));
      console.log(`Wrote ${jsonPath}`);
    }
  } finally {
    if (server) server.kill();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
