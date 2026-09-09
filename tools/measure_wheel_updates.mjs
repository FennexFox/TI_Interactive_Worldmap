// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

// Build and serve docs first, then run:
// node tools/measure_wheel_updates.mjs OUTPUT.json [BASE_URL]
// Counts high-frequency wheel event viewBox writes and a bounded debug-off CDP trace.
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

if (!process.argv[2]) throw new Error('Usage: node tools/measure_wheel_updates.mjs OUTPUT.json [BASE_URL]');

const baseUrl = process.argv[3] || 'http://127.0.0.1:4178';
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}
    : {}),
});

async function dispatchWheelBurst(page, {events = 40} = {}) {
  return page.evaluate(async eventCount => {
    const svg = document.querySelector('#map');
    const rect = svg.getBoundingClientRect();
    const before = svg.getAttribute('viewBox');
    let writes = 0;
    const setAttribute = svg.setAttribute.bind(svg);
    svg.setAttribute = (name, value) => {
      if (name === 'viewBox') writes += 1;
      return setAttribute(name, value);
    };
    for (let index = 0; index < eventCount; index += 1) {
      svg.dispatchEvent(new window.WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width * (0.2 + index * 0.015),
        clientY: rect.top + rect.height * 0.55,
        deltaY: -100,
      }));
    }
    const writesBeforeFrame = writes;
    await new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    const after = svg.getAttribute('viewBox');
    svg.setAttribute = setAttribute;
    return {eventCount, before, after, writes, writesBeforeFrame};
  }, events);
}

async function traceWheelBurst(page) {
  const cdp = await page.context().newCDPSession(page);
  const traceEvents = [];
  cdp.on('Tracing.dataCollected', event => traceEvents.push(...event.value));
  const completed = new Promise(resolve => {
    cdp.once('Tracing.tracingComplete', resolve);
  });
  await cdp.send('Tracing.start', {categories: 'devtools.timeline', transferMode: 'ReportEvents'});
  await dispatchWheelBurst(page);
  await cdp.send('Tracing.end');
  await completed;
  const count = name => traceEvents.filter(event => event.name === name).length;
  return {
    traceEventCount: traceEvents.length,
    layoutCount: count('Layout'),
    updateLayoutTreeCount: count('UpdateLayoutTree'),
    paintCount: count('Paint'),
    wheelDispatchCount: count('EventDispatch'),
  };
}

try {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  const runs = [];
  for (const worldWrap of [false, true]) {
    for (const debug of [false, true]) {
      const url = new URL(baseUrl);
      url.searchParams.set('worldWrap', worldWrap ? '1' : '0');
      if (debug) url.searchParams.set('debugRenderStats', '1');
      await page.goto(url.href);
      await page.locator('#regions .region').first().waitFor();
      if (debug) await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.reset());
      const burst = await dispatchWheelBurst(page);
      runs.push({
        worldWrap,
        debug,
        ...burst,
        wheelViewBoxApplyCount: debug
          ? await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.wheelViewBoxApplyCount)
          : null,
      });
    }
  }
  const traceUrl = new URL(baseUrl);
  traceUrl.searchParams.set('worldWrap', '0');
  await page.goto(traceUrl.href);
  await page.locator('#regions .region').first().waitFor();
  const trace = await traceWheelBurst(page);
  const result = {chromium: browser.version(), viewport: {width: 1440, height: 900}, runs, trace};
  await writeFile(process.argv[2], JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
