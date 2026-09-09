// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

// Build and serve docs first. Counts SVG mutations; does not measure paint.
// node tools/measure_selection_updates.mjs OUTPUT.json [BASE_URL]
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

if (!process.argv[2]) throw new Error('Expected output JSON path');
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {}),
});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  const runs = [];
  for (const wrap of [false, true]) {
    const url = new URL(process.argv[3] || 'http://127.0.0.1:4178');
    url.searchParams.set('worldWrap', wrap ? '1' : '0');
    url.searchParams.set('debugRenderStats', '1');
    await page.goto(url.href);
    const target = page.locator('#hitRegions .region-hit[data-region="Amazonia"][data-wrap-canonical="1"]');
    await target.waitFor();
    await target.dispatchEvent('click', {bubbles: true});
    runs.push(await page.evaluate(wrap => {
      const layer = document.querySelector('#selectionOutlines');
      const language = document.querySelector('#languageSel');
      const stats = window.__TI_DEBUG_RENDER_STATS__;
      const observer = new window.MutationObserver(() => {});
      observer.observe(layer, {childList: true});
      const sample = (name, action) => {
        stats.reset();
        observer.takeRecords();
        const before = layer.firstElementChild;
        const started = performance.now();
        action();
        return {
          name, dispatchMs: performance.now() - started,
          childListMutations: observer.takeRecords().length,
          identityPreserved: before === layer.firstElementChild,
          rebuilds: stats.selectionOutlineRebuilds ?? null,
          skips: stats.selectionOutlineRenderSkips ?? null,
          paths: [...layer.querySelectorAll('path')].map(node => ({region: node.dataset.region, d: node.getAttribute('d')})),
          labels: [...layer.querySelectorAll('.selection-label')].map(node => node.textContent),
        };
      };
      const refresh = () => language.dispatchEvent(new Event('change', {bubbles: true}));
      const warmup = sample('same-language-warmup', refresh);
      const repeated = Array.from({length: 5}, () => sample('same-language', refresh));
      const changedLanguage = sample('changed-language', () => {
        language.value = language.value === 'ko' ? 'en' : 'ko';
        refresh();
      });
      const changedWrap = sample('changed-wrap', () => document.querySelector('[data-map-view-wrap-toggle]').click());
      observer.disconnect();
      return {wrap, warmup, repeated, changedLanguage, changedWrap};
    }, wrap));
  }
  const result = {chromium: browser.version(), viewport: {width: 1440, height: 900}, debug: true, runs};
  await writeFile(process.argv[2], JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, (key, value) => key === 'paths' ? value.length : value));
} finally {
  await browser.close();
}
