// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {createAppData, getActiveData, getScenarioIds} from '../data/active-data.js';
import {createScenarioRuntime} from './scenario-runtime.js';

export function createScenarioContext(generatedData) {
  const appData = createAppData(generatedData || {});
  let scenarioId = appData.defaultScenario;
  let activeData = getActiveData(appData, scenarioId);
  let runtime = createScenarioRuntime(activeData);

  function resolveScenarioId(candidate = '') {
    const requested = String(candidate || appData.defaultScenario || '').trim();
    return appData.scenarios[requested] ? requested : appData.defaultScenario;
  }

  function setActiveScenario(candidate = '') {
    const resolved = resolveScenarioId(candidate);
    if (!resolved) return null;
    scenarioId = resolved;
    activeData = getActiveData(appData, scenarioId);
    runtime = createScenarioRuntime(activeData);
    return snapshot();
  }

  function availableNationIds() {
    return [
      ...new Set([
        ...Object.keys(runtime.nationMeta || {}),
        ...Object.keys(runtime.claimsByNation || {}),
        ...[...(runtime.nationRegions?.keys?.() || [])],
        ...runtime.regions.map(region => region.nationTag).filter(Boolean),
      ]),
    ];
  }

  function snapshot() {
    return Object.freeze({
      appData,
      scenarioId,
      activeData,
      runtime,
      indices: runtime.indices,
      regions: runtime.regions,
      summary: runtime.summary,
      nationColorPalette: runtime.nationColorPalette,
      nationColorIndexes: runtime.nationColorIndexes,
      claimsByNation: runtime.claimsByNation,
      projectMeta: runtime.projectMeta,
      claimStats: runtime.claimStats,
      nationCatalog: runtime.nationCatalog,
      nationMeta: runtime.nationMeta,
      regionByName: runtime.regionByName,
      nationRegions: runtime.nationRegions,
      incomingClaimsByRegion: runtime.incomingClaimsByRegion,
    });
  }

  return Object.freeze({
    availableNationIds,
    getScenarioIds: () => getScenarioIds(appData),
    resolveScenarioId,
    setActiveScenario,
    snapshot,
  });
}
