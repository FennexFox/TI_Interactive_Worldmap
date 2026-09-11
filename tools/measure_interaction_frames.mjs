// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

// Build/serve docs first, then run:
// node tools/measure_interaction_frames.mjs OUTPUT.json [BASE_URL] [--repeats=3] [--variant=baseline]
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {measureFrameIntervals, poolIntervalSummaries} from './frame-intervals.mjs';

const positional = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
if (!positional[0]) throw new Error('Usage: node tools/measure_interaction_frames.mjs OUTPUT.json [BASE_URL] [--repeats=3] [--variant=baseline]');
const outputPath = positional[0];
const baseUrl = positional[1] || 'http://127.0.0.1:4178';
const repeats = Number(process.argv.find(arg => arg.startsWith('--repeats='))?.split('=')[1] || 3);
if (!Number.isInteger(repeats) || repeats < 1) throw new Error('--repeats must be a positive integer');
const variant = process.env.TI_FRAME_VARIANT
  || process.argv.find(arg => arg.startsWith('--variant='))?.split('=')[1]
  || 'baseline';
const variants = new Set(['baseline', 'dash-only', 'permanent-marker-filters-none', 'transient-marker-filters-none']);
if (!variants.has(variant)) throw new Error(`Unknown variant ${variant}`);

const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}
    : {}),
});

const sleepFrames = (page, count) => page.evaluate(frameCount => new Promise(resolve => {
  let remaining = frameCount;
  function step() {
    if (--remaining <= 0) resolve();
    else requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}), count);

async function installVariant(page) {
  if (variant === 'baseline') return;
  const dash = '.manual-envelope-region-outline { stroke-dasharray: 4 3 !important; } .manual-envelope-overlap { stroke-dasharray: 1 3 !important; }';
  const css = variant === 'dash-only' || variant === 'transient-marker-filters-none'
    ? dash
    : `${dash} .capital-star { filter: none !important; }`;
  await page.addStyleTag({content: css});
}

async function runInput(page, input) {
  if (variant === 'transient-marker-filters-none') {
    await page.addStyleTag({content: '.frame-measure-input .capital-star { filter: none !important; }'});
  }
  try {
    return await measureFrameIntervals(page, async () => {
      if (variant === 'transient-marker-filters-none') {
        await page.evaluate(() => document.querySelector('#map').classList.add('frame-measure-input'));
      }
      await input(page);
    });
  } finally {
    if (variant === 'transient-marker-filters-none') {
      await page.evaluate(() => document.querySelector('#map')?.classList.remove('frame-measure-input'));
    }
  }
}

async function setupPage(page, selected, worldWrap) {
  const url = new URL(baseUrl);
  url.searchParams.set('worldWrap', worldWrap ? '1' : '0');
  url.searchParams.set('debugRenderStats', '1');
  await page.goto(url.href);
  await page.locator('#regions .region').first().waitFor();
  const scenario = page.locator('#scenarioSel');
  if (await scenario.locator('option[value="2026"]').count()) await scenario.selectOption('2026');
  await page.locator('#claimMode').selectOption('all');
  if (selected) {
    await page.locator('#hitRegions .region-hit[data-region="Beijing"][data-wrap-canonical="1"]').dispatchEvent('click', {bubbles: true});
    for (const region of ['SouthThailand', 'MalayPeninsula', 'Java']) {
      await page.locator(`#reachableCandidatesPanel [data-candidate-focus="${region}"]`).click();
      await sleepFrames(page, 2);
    }
  }
  for (let index = 0; index < 3; index += 1) {
    await page.locator('[data-map-view-action="zoomIn"]').click();
    await sleepFrames(page, 1);
  }
  await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__?.reset?.());
  await installVariant(page);
  const pins = await page.locator('#pinnedRegionsPanel [data-pinned-region]').count();
  if (pins !== (selected ? 4 : 0)) throw new Error(`Unexpected pin count: ${pins}`);
  return {
    pins,
    manualEnvelopePaths: await page.locator('#manualEnvelopeOverlays path').count(),
  };
}

async function drag(page) {
  const rect = await page.locator('#map').boundingBox();
  const x = rect.x + rect.width * 0.42;
  const y = rect.y + rect.height * 0.55;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let index = 1; index <= 60; index += 1) {
    await page.mouse.move(x + index * 6, y + Math.sin(index / 60 * Math.PI) * 30);
  }
  await page.mouse.up();
}

async function wheel(page) {
  const rect = await page.locator('#map').boundingBox();
  const x = rect.x + rect.width * 0.52;
  const y = rect.y + rect.height * 0.5;
  for (let index = 0; index < 36; index += 1) {
    const block = Math.floor(index / 6) % 2;
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, block ? 100 : -100);
  }
}

const inputs = {drag60: drag, wheel36: wheel};
const samples = [];
try {
  const wrapArg = process.argv.find(arg => arg.startsWith('--wrap='))?.split('=')[1] || '0';
  if (!['0', '1', 'both'].includes(wrapArg)) throw new Error('--wrap must be 0, 1, or both');
  const wrapValues = wrapArg === 'both' ? [false, true] : [wrapArg === '1' || wrapArg === 'true'];
  for (const worldWrap of wrapValues) {
    for (let repeat = 1; repeat <= repeats; repeat += 1) {
      for (const selected of repeat % 2 ? [false, true] : [true, false]) {
        for (const [inputName, input] of Object.entries(inputs)) {
          const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
          try {
            const setup = await setupPage(page, selected, worldWrap);
            const beforeViewBox = await page.locator('#map').getAttribute('viewBox');
            const measurement = await runInput(page, input);
            const afterViewBox = await page.locator('#map').getAttribute('viewBox');
            const debug = await page.evaluate(() => ({...window.__TI_DEBUG_RENDER_STATS__}));
            if (!measurement.viewBoxMutations || !measurement.postUpdate.sampleCount) {
              throw new Error(`No map updates observed for ${inputName}`);
            }
            samples.push({worldWrap, selected, input: inputName, repeat, variant, setup, beforeViewBox, afterViewBox, measurement, debug});
            console.log(`${variant} wrap=${worldWrap} selected=${selected} ${inputName} repeat=${repeat}: P95=${measurement.postUpdate.p95} max=${measurement.postUpdate.max}`);
          } finally {
            await page.close();
          }
        }
      }
    }
  }
  const result = {
    tool: 'measure_interaction_frames',
    variant,
    baseUrl,
    repeats,
    viewport: {width: 1440, height: 1000},
    chromium: browser.version(),
    scenario: '2026',
    claimMode: 'all',
    zoomButtonSteps: 3,
    observation: 'Two priming RAFs excluded; action and two trailing RAFs included. postUpdate is first two intervals following a changed viewBox (overlapping windows deduplicated), covering same-frame observer/RAF order and subsequent paint. performance.now callback intervals; linear interpolated percentiles pooled from raw samples.',
    inputProtocol: '60 drag moves over 360px with 30px sine arc; 36 wheel events, delta +/-100 alternating six-event blocks, mouse moved to same anchor each event; no explicit sleep. Selection order alternates per repeat. Setup uses Beijing hit-layer click and three candidate-panel clicks.',
    sampleCount: samples.length,
    samples,
    pooled: Object.fromEntries([...new Set(samples.map(sample => `${sample.worldWrap ? 'wrap' : 'single'}:${sample.selected ? 'selected' : 'none'}:${sample.input}`))].map(key => {
      const matching = samples.filter(sample => `${sample.worldWrap ? 'wrap' : 'single'}:${sample.selected ? 'selected' : 'none'}:${sample.input}` === key);
      return [key, {
        fullInput: poolIntervalSummaries(matching.map(sample => ({intervals: sample.measurement.intervals}))),
        postUpdate: poolIntervalSummaries(matching.map(sample => ({intervals: sample.measurement.postUpdateIntervals}))),
      }];
    })),
  };
  await writeFile(outputPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({outputPath, chromium: result.chromium, pooled: result.pooled}, null, 2));
} finally {
  await browser.close();
}
