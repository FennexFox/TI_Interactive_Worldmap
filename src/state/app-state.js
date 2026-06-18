// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function normalizeId(value) {
  return String(value || '');
}

/**
 * @param {Iterable<unknown>} [values]
 * @returns {string[]}
 */
function normalizeIds(values) {
  return [...new Set([...(values || [])].map(normalizeId).filter(Boolean))];
}

export function createAppState({activeScenarioId = ''} = {}) {
  return {
    activeScenarioId: normalizeId(activeScenarioId),
    selectedNationId: '',
    selectedRegionIds: new Set(),
    focusedRegionId: '',
    pinnedRegionIds: new Set(),
    pinnedCapitalClaimants: new Map(),
    showReachableCapitalCandidates: true,
    hoveredNationId: '',
    hoveredRegionId: '',
    lockedNationId: '',
    activeIncomingClaimKey: '',
    interaction: {
      secondaryHoverNationId: '',
    },
    filters: {
      projectId: '',
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

/**
 * @param {object} state
 * @param {Iterable<unknown>} [regionIds]
 */
export function setSelectedRegions(state, regionIds) {
  state.selectedRegionIds.clear();
  for (const normalized of normalizeIds(regionIds || [])) state.selectedRegionIds.add(normalized);
  return state;
}

export function setFocusedRegion(state, regionId = '') {
  state.focusedRegionId = normalizeId(regionId);
  return state;
}

/**
 * @param {object} state
 * @param {Iterable<unknown>} [regionIds]
 */
export function setPinnedRegions(state, regionIds) {
  if (!state.pinnedRegionIds) state.pinnedRegionIds = new Set();
  if (!state.pinnedCapitalClaimants) state.pinnedCapitalClaimants = new Map();
  state.pinnedRegionIds.clear();
  state.pinnedCapitalClaimants.clear();
  for (const normalized of normalizeIds(regionIds || [])) state.pinnedRegionIds.add(normalized);
  return state;
}

/**
 * @typedef {object} PinRegionOptions
 * @property {unknown} [capitalClaimant]
 * @property {unknown} [capitalClaimantId]
 */

/**
 * @param {object} state
 * @param {unknown} [regionId]
 * @param {PinRegionOptions} [options]
 */
export function pinRegion(state, regionId = '', options) {
  const pinOptions = /** @type {PinRegionOptions} */ (options || {});
  const {capitalClaimant, capitalClaimantId} = pinOptions;
  const normalized = normalizeId(regionId);
  if (!normalized) return state;
  if (!state.pinnedRegionIds) state.pinnedRegionIds = new Set();
  if (!state.pinnedCapitalClaimants) state.pinnedCapitalClaimants = new Map();
  state.pinnedRegionIds.add(normalized);
  const hasClaimantOverride = capitalClaimant !== undefined || capitalClaimantId !== undefined;
  if (hasClaimantOverride) {
    const claimant = normalizeId(capitalClaimantId ?? capitalClaimant);
    if (claimant) state.pinnedCapitalClaimants.set(normalized, claimant);
    else state.pinnedCapitalClaimants.delete(normalized);
  }
  return state;
}

export function unpinPinnedRegion(state, regionId = '') {
  const normalized = normalizeId(regionId);
  if (!normalized || !state.pinnedRegionIds) return state;
  state.pinnedRegionIds.delete(normalized);
  state.pinnedCapitalClaimants?.delete?.(normalized);
  return state;
}

export function clearPinnedRegions(state) {
  if (!state.pinnedRegionIds) state.pinnedRegionIds = new Set();
  state.pinnedRegionIds.clear();
  state.pinnedCapitalClaimants?.clear?.();
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
  if (changed) setSecondaryHoverNation(state);
  return state;
}

export function clearSelectionState(state) {
  state.selectedNationId = '';
  state.lockedNationId = '';
  setSelectedRegions(state, []);
  setFocusedRegion(state);
  clearPinnedRegions(state);
  setActiveIncomingClaim(state);
  setSecondaryHoverNation(state);
  return state;
}

export function clearTransientClaimState(state) {
  setActiveIncomingClaim(state);
  setClaimFilters(state, {projectId: ''});
  return state;
}

/**
 * @typedef {object} ScenarioStateReconciliationInput
 * @property {Iterable<unknown>} [regionIds]
 * @property {Iterable<unknown>} [nationIds]
 * @property {Iterable<unknown>} [projectIds]
 * @property {Iterable<unknown>} [incomingClaimKeys]
 */

/**
 * @param {object} state
 * @param {ScenarioStateReconciliationInput} [input]
 */
export function reconcileScenarioState(state, input) {
  const reconciliationInput = /** @type {ScenarioStateReconciliationInput} */ (input || {});
  const {
    regionIds = [],
    nationIds = [],
    projectIds = [],
    incomingClaimKeys = [],
  } = reconciliationInput;
  const regionSet = new Set(normalizeIds(regionIds));
  const nationSet = new Set(normalizeIds(nationIds));
  const projectSet = new Set(normalizeIds(projectIds));
  const incomingClaimKeySet = new Set(normalizeIds(incomingClaimKeys));

  setHoveredRegion(state);
  setHoveredNation(state);
  setSecondaryHoverNation(state);

  if (state.focusedRegionId && !regionSet.has(state.focusedRegionId)) setFocusedRegion(state);
  setSelectedRegions(state, [...(state.selectedRegionIds || [])].filter(regionId => regionSet.has(regionId)));

  if (!state.pinnedRegionIds) state.pinnedRegionIds = new Set();
  if (!state.pinnedCapitalClaimants) state.pinnedCapitalClaimants = new Map();
  for (const regionId of [...state.pinnedRegionIds]) {
    if (!regionSet.has(regionId)) {
      state.pinnedRegionIds.delete(regionId);
      state.pinnedCapitalClaimants.delete(regionId);
    }
  }
  for (const [regionId, claimantId] of [...state.pinnedCapitalClaimants.entries()]) {
    if (!regionSet.has(regionId) || !nationSet.has(claimantId)) state.pinnedCapitalClaimants.delete(regionId);
  }

  if (state.lockedNationId && !nationSet.has(state.lockedNationId)) setLockedNation(state);
  if (state.selectedNationId && !nationSet.has(state.selectedNationId)) setSelectedNation(state);
  if (state.activeIncomingClaimKey && !incomingClaimKeySet.has(state.activeIncomingClaimKey)) setActiveIncomingClaim(state);
  if (state.filters?.projectId && state.filters.projectId !== '__base__' && !projectSet.has(state.filters.projectId)) {
    setClaimFilters(state, {projectId: ''});
  }
  return state;
}
