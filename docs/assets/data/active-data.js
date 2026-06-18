// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function normalizeScenarioEntry(entry = {}, fallbackCatalogs = {}) {
  const catalogs = entry.catalogs || fallbackCatalogs || {};
  return {
    label: entry.label || entry.regionMap?.summary?.scenarioYear || '',
    summary: entry.summary || {},
    regionMap: entry.regionMap,
    claimMap: entry.claimMap,
    catalogs: {
      nations: catalogs.nations || entry.nationCatalog || {},
      research: catalogs.research || entry.researchCatalog || {},
    },
  };
}

function scenarioIdFromEntry(id, entry = {}) {
  return String(id || entry.regionMap?.summary?.scenarioYear || entry.claimMap?.summary?.scenarioYear || '').trim();
}

export function createAppData({regionMap, claimMap, catalogs = {}, defaultScenario, defaultScenarioId, scenarios = {}, schemaVersion} = {}) {
  const scenarioEntries = {};
  for (const [id, entry] of Object.entries(scenarios || {})) {
    const scenarioId = scenarioIdFromEntry(id, entry);
    if (!scenarioId) continue;
    scenarioEntries[scenarioId] = normalizeScenarioEntry(entry);
  }
  const legacyScenario = String(defaultScenario || defaultScenarioId || regionMap?.summary?.scenarioYear || '2026');
  if (regionMap && claimMap && !scenarioEntries[legacyScenario]) {
    scenarioEntries[legacyScenario] = normalizeScenarioEntry({label: legacyScenario, regionMap, claimMap, catalogs});
  }
  const resolvedDefaultScenario = String(
    defaultScenario
    || defaultScenarioId
    || (scenarioEntries['2026'] ? '2026' : '')
    || legacyScenario
    || Object.keys(scenarioEntries)[0]
    || '2026'
  );
  return {
    schemaVersion,
    defaultScenario: resolvedDefaultScenario,
    scenarioIds: Object.keys(scenarioEntries).sort(),
    scenarios: scenarioEntries,
  };
}

export function getActiveData(appData, activeScenarioId) {
  return appData.scenarios[activeScenarioId] || appData.scenarios[appData.defaultScenario];
}

export function getScenarioIds(appData) {
  return appData?.scenarioIds || Object.keys(appData?.scenarios || {}).sort();
}
