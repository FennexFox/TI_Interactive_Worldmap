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
  'worldCopyContextCount',
  'hostileHatchDisabled',
  'setupSelectionOutlinePathCount',
  'setupPinnedRegionMarkerCount',
  'setupPinnedRegionsPanelChildCount',
  'setupClaimOverlayPathCount',
  'setupManualEnvelopeOverlayPathCount',
  'setupForeignHoverOverlayPathCount',
  'setupSecondaryHoverOverlayPathCount',
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
  };
  for (const arg of argv) {
    if (arg === '--build') args.build = true;
    else if (arg === '--no-server') args.noServer = true;
    else if (arg === '--raw-json') args.rawJson = true;
    else if (arg === '--summary-json') args.summaryJson = true;
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
    const visiblePaths = [...document.querySelectorAll('#selectionOutlines path, #hoverOutlines path, #hitRegions path')]
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
      selector: `#${selected.group || 'unknown'} path`,
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

async function captureSetupStats(page) {
  return page.evaluate(() => {
    const count = selector => document.querySelectorAll(selector).length;
    const countVisible = selector => [...document.querySelectorAll(selector)]
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length;
    const panel = document.querySelector('#pinnedRegionsPanel');
    return {
      setupSelectionOutlinePathCount: countVisible('#selectionOutlines path'),
      setupPinnedRegionMarkerCount: countVisible('#pinnedRegionsPanel [data-region], #pinnedRegionsPanel [data-regions], #pinnedRegionsPanel li, #pinnedRegionsPanel button'),
      setupPinnedRegionsPanelChildCount: panel ? panel.querySelectorAll('*').length : 0,
      setupClaimOverlayPathCount: count('#claimOverlay path, #claimOverlays path, #claimOverlayLayer path, .claim-overlay path, .claimOverlay path, [data-layer="claim-overlay"] path'),
      setupManualEnvelopeOverlayPathCount: count('#manualEnvelopeOverlay path, #manualEnvelopeOverlays path, .manual-envelope-overlay path, [data-layer="manual-envelope-overlay"] path'),
      setupForeignHoverOverlayPathCount: count('#foreignHoverOverlay path, #foreignHoverOverlays path, .foreign-hover-overlay path, [data-layer="foreign-hover-overlay"] path'),
      setupSecondaryHoverOverlayPathCount: count('#secondaryHoverOverlay path, #secondaryHoverOverlays path, .secondary-hover-overlay path, [data-layer="secondary-hover-overlay"] path'),
    };
  });
}

function summarize(results) {
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
    worldCopyContextCount: item.stats?.worldCopyContextCount,
    hostileHatchDisabled: item.stats?.hostileHatchDisabled,
    setupSelectionOutlinePathCount: item.setupStats?.setupSelectionOutlinePathCount,
    setupPinnedRegionMarkerCount: item.setupStats?.setupPinnedRegionMarkerCount,
    setupPinnedRegionsPanelChildCount: item.setupStats?.setupPinnedRegionsPanelChildCount,
    setupClaimOverlayPathCount: item.setupStats?.setupClaimOverlayPathCount,
    setupManualEnvelopeOverlayPathCount: item.setupStats?.setupManualEnvelopeOverlayPathCount,
    setupForeignHoverOverlayPathCount: item.setupStats?.setupForeignHoverOverlayPathCount,
    setupSecondaryHoverOverlayPathCount: item.setupStats?.setupSecondaryHoverOverlayPathCount,
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
    const scenarios = [
      { name: 'wrap-off', query: 'debugRenderStats=1&worldWrap=0' },
      { name: 'wrap-off-disable-hatch', query: 'debugRenderStats=1&worldWrap=0&disableHostileHatch=1' },
      { name: 'wrap-on', query: 'debugRenderStats=1&worldWrap=1' },
      { name: 'wrap-on-disable-hatch', query: 'debugRenderStats=1&worldWrap=1&disableHostileHatch=1' },
    ];
    const results = [];

    for (const scenario of scenarios) {
      for (let repeat = 1; repeat <= args.repeats; repeat += 1) {
        for (const zoomSteps of args.zoomSteps) {
          await page.goto(scenarioUrl(baseUrl, scenario.query), { waitUntil: 'networkidle' });
          await page.waitForFunction(() => Boolean(window.__TI_DEBUG_RENDER_STATS__), null, { timeout: 10_000 });
          const setup = await configureClaimOverlay(page, args);
          const setupStats = await captureSetupStats(page);
          await resetStats(page);
          const center = await zoomMap(page, zoomSteps);
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
