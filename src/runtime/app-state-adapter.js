// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  clearPinnedRegions,
  clearSelectionState,
  clearTransientClaimState,
  createAppState,
  pinRegion,
  reconcileScenarioState,
  setActiveIncomingClaim,
  setActiveScenarioId,
  setClaimFilters,
  setFocusedRegion,
  setHoveredNation,
  setHoveredRegion,
  setLockedNation,
  setPinnedRegions,
  setReachableCapitalCandidatesVisible,
  setSecondaryHoverNation,
  setSelectedNation,
  setSelectedRegions,
  toggleReachableCapitalCandidates,
  unpinPinnedRegion,
} from '../state/app-state.js';

function noop() {}

export function changedRegionIds(previousRegionIds = [], nextRegionIds = []) {
  return [...new Set([...(previousRegionIds || []), ...(nextRegionIds || [])].filter(Boolean))];
}

export function createAppStateAdapter({
  activeScenarioId = '',
  onPinnedRegionsChanged = noop,
  onReachableCapitalCandidatesChanged = noop,
  onScenarioReconciled = noop,
  onSelectedRegionsChanged = noop,
} = {}) {
  const state = createAppState({activeScenarioId});
  const selectedRegionIds = state.selectedRegionIds;

  function activateScenario(scenarioId = '') {
    return setActiveScenarioId(state, scenarioId);
  }

  function reconcileScenario(input = {}) {
    const result = reconcileScenarioState(state, input);
    onScenarioReconciled({
      state,
      selectedRegionIds,
      pinnedRegionIds: getPinnedRegionIds(),
    });
    return result;
  }

  function setActiveNationState(nation = '') {
    setSelectedNation(state, nation);
  }

  function setHoverNationState(nation = '') {
    setHoveredNation(state, nation);
  }

  function setSecondaryHoverNationState(nation = '') {
    setSecondaryHoverNation(state, nation);
  }

  function setLockedNationState(nation = '') {
    setLockedNation(state, nation);
  }

  function setHoveredRegionState(regionName = '', nationId) {
    setHoveredRegion(state, regionName, nationId);
  }

  function setFocusedRegionState(regionName = '') {
    setFocusedRegion(state, regionName);
  }

  function setSelectedRegionIds(regionIds = []) {
    const previous = [...selectedRegionIds];
    setSelectedRegions(state, regionIds);
    const changed = changedRegionIds(previous, selectedRegionIds);
    onSelectedRegionsChanged(changed, selectedRegionIds);
    return changed;
  }

  function setPinnedRegionIds(regionIds = []) {
    const previous = [...getPinnedRegionIds()];
    setPinnedRegions(state, regionIds);
    onPinnedRegionsChanged([...previous, ...getPinnedRegionIds()], getPinnedRegionIds());
  }

  function getPinnedCapitalClaimant(regionName = '') {
    return state.pinnedCapitalClaimants?.get?.(regionName) || '';
  }

  function pinRegionState(regionName = '', options = {}) {
    if (!regionName) return;
    const wasPinned = getPinnedRegionIds().has(regionName);
    const previousClaimant = getPinnedCapitalClaimant(regionName);
    pinRegion(state, regionName, options);
    const nextClaimant = getPinnedCapitalClaimant(regionName);
    if (wasPinned && previousClaimant === nextClaimant) return;
    onPinnedRegionsChanged([regionName], getPinnedRegionIds());
  }

  function unpinPinnedRegionState(regionName = '') {
    unpinPinnedRegion(state, regionName);
    onPinnedRegionsChanged([regionName], getPinnedRegionIds());
  }

  function clearPinnedRegionState() {
    const previous = [...getPinnedRegionIds()];
    clearPinnedRegions(state);
    onPinnedRegionsChanged(previous, getPinnedRegionIds());
  }

  function setReachableCapitalCandidatesVisibleState(visible = false) {
    setReachableCapitalCandidatesVisible(state, visible);
    onReachableCapitalCandidatesChanged(getShowReachableCapitalCandidates());
  }

  function toggleReachableCapitalCandidatesState() {
    toggleReachableCapitalCandidates(state);
    onReachableCapitalCandidatesChanged(getShowReachableCapitalCandidates());
  }

  function setProjectFilterState(projectId = '') {
    setClaimFilters(state, {projectId});
  }

  function setActiveIncomingClaimKeyState(claimKey = '') {
    setActiveIncomingClaim(state, claimKey);
  }

  function clearSelection() {
    return clearSelectionState(state);
  }

  function clearTransientClaim() {
    return clearTransientClaimState(state);
  }

  function getActiveScenarioId(fallback = '') {
    return state.activeScenarioId || fallback || '';
  }

  function getActiveNation() {
    return state.selectedNationId || '';
  }

  function getHoverNation() {
    return state.hoveredNationId || '';
  }

  function getSecondaryHoverNation() {
    return state.interaction?.secondaryHoverNationId || '';
  }

  function getLockedNation() {
    return state.lockedNationId || '';
  }

  function getHoveredRegionName() {
    return state.hoveredRegionId || '';
  }

  function getFocusedRegionName() {
    return state.focusedRegionId || '';
  }

  function getPinnedRegionIds() {
    return state.pinnedRegionIds || new Set();
  }

  function getShowReachableCapitalCandidates() {
    return !!state.showReachableCapitalCandidates;
  }

  function getProjectFilter() {
    return state.filters.projectId || '';
  }

  function getActiveIncomingClaimKey() {
    return state.activeIncomingClaimKey || '';
  }

  return Object.freeze({
    state,
    selectedRegionIds,
    activateScenario,
    reconcileScenario,
    setActiveNationState,
    setHoverNationState,
    setSecondaryHoverNationState,
    setLockedNationState,
    setHoveredRegionState,
    setFocusedRegionState,
    setSelectedRegionIds,
    setPinnedRegionIds,
    getPinnedCapitalClaimant,
    pinRegionState,
    unpinPinnedRegionState,
    clearPinnedRegionState,
    setReachableCapitalCandidatesVisibleState,
    toggleReachableCapitalCandidatesState,
    setProjectFilterState,
    setActiveIncomingClaimKeyState,
    clearSelection,
    clearTransientClaim,
    getActiveScenarioId,
    getActiveNation,
    getHoverNation,
    getSecondaryHoverNation,
    getLockedNation,
    getHoveredRegionName,
    getFocusedRegionName,
    getPinnedRegionIds,
    getShowReachableCapitalCandidates,
    getProjectFilter,
    getActiveIncomingClaimKey,
  });
}
