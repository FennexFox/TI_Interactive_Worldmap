// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

// Build and serve docs first. Counts real layer replacements, not paint latency.
// node tools/measure_base_color_updates.mjs OUTPUT.json [BASE_URL]
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

if (!process.argv[2]) throw new Error('Expected output JSON path and optional base URL');
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}
    : {}),
});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  const runs = [];
  for (const wrap of [false, true]) {
    const url = new URL(process.argv[3] || 'http://127.0.0.1:4178');
    url.searchParams.set('worldWrap', wrap ? '1' : '0');
    url.searchParams.set('debugRenderStats', '1');
    await page.goto(url.href);
    await page.locator('#normalRegionColors .normal-region-color').first().waitFor();
    runs.push(await page.evaluate(wrap => {
      const layer = document.querySelector('#normalRegionColors');
      const search = document.querySelector('#search');
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
        const dispatchMs = performance.now() - started;
        return {
          name,
          childListMutations: observer.takeRecords().length,
          identityPreserved: layer.firstElementChild === before,
          calls: stats.baseColorRenderCalls,
          rebuilds: stats.baseColorRebuilds ?? null,
          skips: stats.baseColorRenderSkips ?? null,
          dispatchMs,
          pathDBytes: [...layer.querySelectorAll('path')].reduce((n, path) => n + (path.getAttribute('d') || '').length, 0),
          groupCount: layer.querySelectorAll('.normal-region-color').length,
        };
      };
      const input = query => {
        search.value = query;
        search.dispatchEvent(new Event('input', {bubbles: true}));
      };
      const warmup = sample('warmup-all', () => input(''));
      const sameVisibility = Array.from({length: 5}, () => sample('same-all', () => input('')));
      const changedVisibility = sample('filter-Ontario', () => input('Ontario'));
      const sameFiltered = Array.from({length: 5}, () => sample('same-Ontario', () => input('Ontario')));
      input('');
      const languageRefresh = sample('language-refresh', () => {
        language.value = language.value === 'ko' ? 'en' : 'ko';
        language.dispatchEvent(new Event('change', {bubbles: true}));
      });
      observer.disconnect();
      return {wrap, warmup, sameVisibility, changedVisibility, sameFiltered, languageRefresh};
    }, wrap));
  }
  const result = {chromium: browser.version(), viewport: {width: 1440, height: 900}, debug: true, runs};
  await writeFile(process.argv[2], JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
