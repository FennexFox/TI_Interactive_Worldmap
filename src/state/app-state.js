function normalizeId(value) {
  return String(value || '');
}

export function createAppState({activeScenarioId = ''} = {}) {
  return {
    activeScenarioId: normalizeId(activeScenarioId),
    selectedNationId: '',
    selectedRegionIds: new Set(),
    hoveredNationId: '',
    hoveredRegionId: '',
    lockedNationId: '',
    activeIncomingClaimKey: '',
    filters: {
      projectId: '',
      onlyClaims: false,
    },
  };
}

export function setActiveScenarioId(state, scenarioId) {
  state.activeScenarioId = normalizeId(scenarioId);
  return state;
}

export function setSelectedNation(state, nationId = '', {locked = false, clearHover = false} = {}) {
  const normalized = normalizeId(nationId);
  state.selectedNationId = normalized;
  if (locked) state.lockedNationId = normalized;
  if (clearHover) state.hoveredNationId = '';
  return state;
}

export function setSelectedRegions(state, regionIds = []) {
  state.selectedRegionIds.clear();
  for (const regionId of regionIds || []) {
    const normalized = normalizeId(regionId);
    if (normalized) state.selectedRegionIds.add(normalized);
  }
  return state;
}

export function setHoveredRegion(state, regionId = '', nationId = undefined) {
  state.hoveredRegionId = normalizeId(regionId);
  if (nationId !== undefined) state.hoveredNationId = normalizeId(nationId);
  return state;
}

export function setHoveredNation(state, nationId = '') {
  state.hoveredNationId = normalizeId(nationId);
  return state;
}

export function setActiveIncomingClaim(state, claimKey = '') {
  state.activeIncomingClaimKey = normalizeId(claimKey);
  return state;
}

export function setClaimFilters(state, filters = {}) {
  if ('projectId' in filters) state.filters.projectId = normalizeId(filters.projectId);
  if ('onlyClaims' in filters) state.filters.onlyClaims = !!filters.onlyClaims;
  return state;
}

export function clearSelectionState(state) {
  state.selectedNationId = '';
  state.lockedNationId = '';
  setSelectedRegions(state);
  setActiveIncomingClaim(state);
  return state;
}

export function clearTransientClaimState(state) {
  setActiveIncomingClaim(state);
  setClaimFilters(state, {projectId: ''});
  return state;
}
