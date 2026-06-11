export function createAppData({regionMap, claimMap, catalogs = {}, defaultScenarioId} = {}) {
  const defaultScenario = String(defaultScenarioId || regionMap?.summary?.scenarioYear || '2026');
  return {
    defaultScenario,
    scenarios: {
      [defaultScenario]: {
        regionMap,
        claimMap,
        catalogs,
      },
    },
  };
}

export function getActiveData(appData, activeScenarioId) {
  return appData.scenarios[activeScenarioId] || appData.scenarios[appData.defaultScenario];
}
