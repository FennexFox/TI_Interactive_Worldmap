// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {expect, test} from '@playwright/test';

test('app runtime exposes an exact frozen lifecycle and becomes inert after destroy', async ({page}) => {
  await page.route('**/assets/app.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: '',
  }));
  await page.goto('/');
  await page.waitForFunction(() => !!window.TI_DATA_PROMISE);

  const contract = await page.evaluate(async () => {
    const generatedData = await window.TI_DATA_PROMISE;
    const {createAppRuntime} = await import('/assets/runtime/app-runtime.js');
    const runtime = createAppRuntime({window, document, generatedData});
    const keys = Object.keys(runtime).sort();
    const frozen = Object.isFrozen(runtime);
    const firstStart = runtime.start();
    const secondStart = runtime.start();
    const languageBeforeDestroy = runtime.setLanguage('ko');
    const scenarioBeforeDestroy = runtime.setActiveScenario('2070');
    const scenarioAtDestroy = window.__TI_SCENARIO_API__?.activeScenario || '';

    runtime.destroy();
    runtime.destroy();

    return {
      keys,
      frozen,
      firstStart,
      secondStart,
      languageBeforeDestroy,
      scenarioBeforeDestroy,
      scenarioAtDestroy,
      startAfterDestroy: runtime.start(),
      languageAfterDestroy: runtime.setLanguage('en'),
      scenarioAfterDestroy: runtime.setActiveScenario('2022'),
      debugApiRemoved: !('__TI_DEBUG_RENDER_STATS__' in window),
      scenarioApiRemoved: !('__TI_SCENARIO_API__' in window),
    };
  });

  expect(contract.keys).toEqual([
    'destroy',
    'setActiveScenario',
    'setLanguage',
    'start',
  ]);
  expect(contract.frozen).toBe(true);
  expect(contract.firstStart).toBe(true);
  expect(contract.secondStart).toBe(false);
  expect(contract.languageBeforeDestroy).toBe('ko');
  expect(contract.scenarioBeforeDestroy).toBe(true);
  expect(contract.scenarioAtDestroy).toBe('2070');
  expect(contract.startAfterDestroy).toBe(false);
  expect(contract.languageAfterDestroy).toBe('ko');
  expect(contract.scenarioAfterDestroy).toBe(false);
  expect(contract.debugApiRemoved).toBe(true);
  expect(contract.scenarioApiRemoved).toBe(true);
});
