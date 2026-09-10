// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  expect,
  mapViewBox,
  resetDebugRenderStats,
  test,
  waitForAnimationFrames,
} from '../fixtures/app.js';

const EXPECTED_BURST_VIEW_BOX = [-1.713348185, -0.298490727, 0.815710845, 0.323611201];

test.use({viewport: {width: 1440, height: 900}});

for (const worldWrap of [0, 1]) {
  for (const debug of [0, 1]) {
    test(`wheel burst batches viewBox writes with wrap=${worldWrap} debug=${debug}`, async ({page}) => {
      await page.goto(`/?worldWrap=${worldWrap}${debug ? '&debugRenderStats=1' : ''}`);
      await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});
      if (debug) await resetDebugRenderStats(page);

      const result = await page.evaluate(async () => {
        const svg = document.querySelector('#map');
        const rect = svg.getBoundingClientRect();
        let writes = 0;
        const setAttribute = svg.setAttribute.bind(svg);
        svg.setAttribute = (name, value) => {
          if (name === 'viewBox') writes += 1;
          return setAttribute(name, value);
        };
        for (let index = 0; index < 40; index += 1) {
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
        const writesAfterFrame = writes;
        svg.setAttribute = setAttribute;
        return {writesAfterFrame, writesBeforeFrame};
      });

      expect(result.writesBeforeFrame).toBe(0);
      expect(result.writesAfterFrame).toBe(1);
      expect(await mapViewBox(page)).toEqual(EXPECTED_BURST_VIEW_BOX);
      if (debug) {
        expect(await page.evaluate(() => window.__TI_DEBUG_RENDER_STATS__.wheelViewBoxApplyCount)).toBe(1);
      }
    });
  }
}

test('scenario reset flushes a queued wheel view before cancelling its frame', async ({page}) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  const result = await page.evaluate(() => {
    const svg = document.querySelector('#map');
    const before = svg.getAttribute('viewBox');
    const rect = svg.getBoundingClientRect();
    for (let index = 0; index < 40; index += 1) {
      svg.dispatchEvent(new window.WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width * (0.2 + index * 0.015),
        clientY: rect.top + rect.height * 0.55,
        deltaY: -100,
      }));
    }
    window.__TI_SCENARIO_API__.setActiveScenario('2070');
    return {before, after: svg.getAttribute('viewBox')};
  });

  expect(result.after).not.toBe(result.before);
  expect(await mapViewBox(page)).toEqual(EXPECTED_BURST_VIEW_BOX);
  await waitForAnimationFrames(page, 2);
  expect(await mapViewBox(page)).toEqual(EXPECTED_BURST_VIEW_BOX);
});
