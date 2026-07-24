// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function installBrowserApi({
  window,
  debugRenderStats,
  scenarioIds = [],
  getActiveScenario,
  setActiveScenario,
} = {}) {
  const scenarioApi = {
    scenarios: [...scenarioIds],
    get activeScenario() {
      return getActiveScenario?.() || '';
    },
    setActiveScenario,
  };
  if (debugRenderStats) window.__TI_DEBUG_RENDER_STATS__ = debugRenderStats;
  window.__TI_SCENARIO_API__ = scenarioApi;
  let destroyed = false;

  return Object.freeze({
    scenarioApi,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (window.__TI_SCENARIO_API__ === scenarioApi) {
        delete window.__TI_SCENARIO_API__;
      }
      if (debugRenderStats && window.__TI_DEBUG_RENDER_STATS__ === debugRenderStats) {
        delete window.__TI_DEBUG_RENDER_STATS__;
      }
    },
  });
}
