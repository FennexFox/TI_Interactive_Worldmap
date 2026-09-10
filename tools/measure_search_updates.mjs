// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

// Build docs first, serve it locally, then run:
// node tools/measure_search_updates.mjs OUTPUT.json [BASE_URL]
// Measures synchronous JS dispatch and direct dropdown child-list mutations,
// not browser paint latency. One warm-up is excluded from five samples.
import {chromium} from "playwright";
import {writeFile} from "node:fs/promises";
if (!process.argv[2]) throw new Error('Usage: node tools/measure_search_updates.mjs OUTPUT.json [BASE_URL]');
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}
    : {}),
});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  await page.goto(process.argv[3] || "http://127.0.0.1:4176/");
  await page.locator("#regions .region").first().waitFor();
  await page.locator("#search").focus();
  const samples = [];
  for (const query of ["Can", "Canada", "Chi", "China", "Seoul", "Canada"]) {
    samples.push(await page.evaluate(query => {
      const search = document.querySelector("#search");
      const dropdown = document.querySelector("#nationDropdown");
      const observer = new window.MutationObserver(() => {});
      observer.observe(dropdown, {childList:true});
      search.value = query;
      const start = performance.now();
      search.dispatchEvent(new Event("input", {bubbles:true}));
      const inputMs = performance.now() - start;
      const inputReplacements = observer.takeRecords().length;
      const first = dropdown.firstElementChild;
      const arrowStart = performance.now();
      search.dispatchEvent(new window.KeyboardEvent("keydown", {key:"ArrowDown", bubbles:true}));
      const arrowMs = performance.now() - arrowStart;
      const arrowReplacements = observer.takeRecords().length;
      const identityPreserved = dropdown.firstElementChild === first;
      observer.disconnect();
      return {query, inputMs, inputReplacements, arrowMs, arrowReplacements, identityPreserved, optionCount:dropdown.querySelectorAll(".searchOption").length};
    }, query));
  }
  const output = {chromium:browser.version(), viewport:{width:1440,height:900}, debug:false, cpuThrottling:false, warmup:samples[0], samples:samples.slice(1)};
  await writeFile(process.argv[2], JSON.stringify(output,null,2));
  console.log(JSON.stringify(output));
} finally {
  await browser.close();
}
