// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function normalizeScenarioEntry(entry = {}, fallbackCatalogs = {}, scenarioId = '') {
  const catalogs = entry.catalogs || fallbackCatalogs || {};
  const startYear = Number(entry.startYear || entry.regionMap?.summary?.scenarioYear || scenarioId);
  return {
    label: entry.label || entry.regionMap?.summary?.scenarioYear || '',
    group: entry.group === 'dlc' ? 'dlc' : 'base',
    startYear: Number.isFinite(startYear) ? startYear : Number.MAX_SAFE_INTEGER,
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

function compareScenarioIds(leftId, rightId, scenarios) {
  const left = scenarios[leftId] || {};
  const right = scenarios[rightId] || {};
  const groupOrder = Number(left.group === 'dlc') - Number(right.group === 'dlc');
  if (groupOrder) return groupOrder;
  const yearOrder = left.startYear - right.startYear;
  return yearOrder || leftId.localeCompare(rightId);
}

export function createAppData({regionMap, claimMap, catalogs = {}, defaultScenario, defaultScenarioId, scenarios = {}, schemaVersion} = {}) {
  const scenarioEntries = {};
  for (const [id, entry] of Object.entries(scenarios || {})) {
    const scenarioId = scenarioIdFromEntry(id, entry);
    if (!scenarioId) continue;
    scenarioEntries[scenarioId] = normalizeScenarioEntry(entry, {}, scenarioId);
  }
  const legacyScenario = String(defaultScenario || defaultScenarioId || regionMap?.summary?.scenarioYear || '2026');
  if (regionMap && claimMap && !scenarioEntries[legacyScenario]) {
    scenarioEntries[legacyScenario] = normalizeScenarioEntry(
      {label: legacyScenario, regionMap, claimMap, catalogs},
      {},
      legacyScenario
    );
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
    scenarioIds: Object.keys(scenarioEntries).sort(
      (left, right) => compareScenarioIds(left, right, scenarioEntries)
    ),
    scenarios: scenarioEntries,
  };
}

export function getActiveData(appData, activeScenarioId) {
  return appData.scenarios[activeScenarioId] || appData.scenarios[appData.defaultScenario];
}

export function getScenarioIds(appData) {
  if (appData?.scenarioIds) return appData.scenarioIds;
  const scenarios = appData?.scenarios || {};
  return Object.keys(scenarios).sort((left, right) => compareScenarioIds(left, right, scenarios));
}

export function getScenarioChoices(appData) {
  return getScenarioIds(appData).map(id => ({
    id,
    label: appData?.scenarios?.[id]?.label || id,
    group: appData?.scenarios?.[id]?.group || 'base',
    startYear: appData?.scenarios?.[id]?.startYear,
  }));
}
