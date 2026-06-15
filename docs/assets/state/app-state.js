function normalizeId(value) {
  return String(value || '');
}

function normalizeIds(values = []) {
  return [...new Set([...values].map(normalizeId).filter(Boolean))];
}

export function createAppState({activeScenarioId = ''} = {}) {
  return {
    activeScenarioId: normalizeId(activeScenarioId),
    selectedNationId: '',
    selectedRegionIds: new Set(),
    focusedRegionId: '',
    pinnedRegionIds: new Set(),
    showReachableCapitalCandidates: false,
    hoveredNationId: '',
    hoveredRegionId: '',
    lockedNationId: '',
    activeIncomingClaimKey: '',
    interaction: {
      secondaryHoverNationId: '',
    },
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
  const changed = state.selectedNationId !== normalized;
  state.selectedNationId = normalized;
  if (locked) state.lockedNationId = normalized;
  if (clearHover) state.hoveredNationId = '';
  if (changed || clearHover) setSecondaryHoverNation(state);
  return state;
}

export function setSelectedRegions(state, regionIds = []) {
  state.selectedRegionIds.clear();
  for (const normalized of normalizeIds(regionIds || [])) state.selectedRegionIds.add(normalized);
  return state;
}

export function setFocusedRegion(state, regionId = '') {
  state.focusedRegionId = normalizeId(regionId);
  return state;
}

export function setPinnedRegions(state, regionIds = []) {
  if (!state.pinnedRegionIds) state.pinnedRegionIds = new Set();
  state.pinnedRegionIds.clear();
  for (const normalized of normalizeIds(regionIds || [])) state.pinnedRegionIds.add(normalized);
  return state;
}

export function pinRegion(state, regionId = '') {
  const normalized = normalizeId(regionId);
  if (!normalized) return state;
  if (!state.pinnedRegionIds) state.pinnedRegionIds = new Set();
  state.pinnedRegionIds.add(normalized);
  return state;
}

export function unpinPinnedRegion(state, regionId = '') {
  const normalized = normalizeId(regionId);
  if (!normalized || !state.pinnedRegionIds) return state;
  state.pinnedRegionIds.delete(normalized);
  return state;
}

export function togglePinnedRegion(state, regionId = '') {
  const normalized = normalizeId(regionId);
  if (!normalized) return state;
  if (!state.pinnedRegionIds) state.pinnedRegionIds = new Set();
  if (state.pinnedRegionIds.has(normalized)) state.pinnedRegionIds.delete(normalized);
  else state.pinnedRegionIds.add(normalized);
  return state;
}

export function clearPinnedRegions(state) {
  if (!state.pinnedRegionIds) state.pinnedRegionIds = new Set();
  state.pinnedRegionIds.clear();
  return state;
}

export function setReachableCapitalCandidatesVisible(state, visible = false) {
  state.showReachableCapitalCandidates = !!visible;
  return state;
}

export function toggleReachableCapitalCandidates(state) {
  state.showReachableCapitalCandidates = !state.showReachableCapitalCandidates;
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

export function setSecondaryHoverNation(state, nationId = '') {
  if (!state.interaction) state.interaction = {};
  state.interaction.secondaryHoverNationId = normalizeId(nationId);
  return state;
}

export function setLockedNation(state, nationId = '') {
  const normalized = normalizeId(nationId);
  const changed = state.lockedNationId !== normalized || (normalized && state.selectedNationId !== normalized);
  state.lockedNationId = normalized;
  if (normalized) state.selectedNationId = normalized;
  if (changed) setSecondaryHoverNation(state);
  return state;
}

export function setActiveIncomingClaim(state, claimKey = '') {
  const normalized = normalizeId(claimKey);
  const changed = state.activeIncomingClaimKey !== normalized;
  state.activeIncomingClaimKey = normalized;
  if (changed) setSecondaryHoverNation(state);
  return state;
}

export function setClaimFilters(state, filters = {}) {
  let changed = false;
  if ('projectId' in filters) {
    const projectId = normalizeId(filters.projectId);
    changed = changed || state.filters.projectId !== projectId;
    state.filters.projectId = projectId;
  }
  if ('onlyClaims' in filters) {
    const onlyClaims = !!filters.onlyClaims;
    changed = changed || state.filters.onlyClaims !== onlyClaims;
    state.filters.onlyClaims = onlyClaims;
  }
  if (changed) setSecondaryHoverNation(state);
  return state;
}

export function clearSelectionState(state) {
  state.selectedNationId = '';
  state.lockedNationId = '';
  setSelectedRegions(state);
  setFocusedRegion(state);
  clearPinnedRegions(state);
  setReachableCapitalCandidatesVisible(state, false);
  setActiveIncomingClaim(state);
  setSecondaryHoverNation(state);
  return state;
}

export function clearTransientClaimState(state) {
  setActiveIncomingClaim(state);
  setClaimFilters(state, {projectId: ''});
  return state;
}
