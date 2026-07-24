// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function noop() {}

export function createSelectionCoordinator({
  stateAdapter,
  claimPresentation,
  mapPresentation,
  getContext = () => ({}),
  outputs = {},
} = {}) {
  if (!stateAdapter) throw new TypeError('stateAdapter is required');
  if (!claimPresentation) throw new TypeError('claimPresentation is required');
  if (!mapPresentation) throw new TypeError('mapPresentation is required');

  let localContext = {};
  let outputCallbacks = {...outputs};
  let currentOverlayModel = null;
  let visibleNationRegionNames = new Set();
  let hoverClaimPreviewNation = '';
  let destroyed = false;

  const context = () => ({...(getContext?.() || {}), ...localContext});
  const output = (name, ...args) => (
    outputCallbacks[name]?.(...args)
  );
  const state = () => stateAdapter.state || {};
  const getActiveNation = () => stateAdapter.getActiveNation?.() || '';
  const getHoverNation = () => stateAdapter.getHoverNation?.() || '';
  const getLockedNation = () => stateAdapter.getLockedNation?.() || '';
  const getHoveredRegionName = () => stateAdapter.getHoveredRegionName?.() || '';
  const getPinnedRegionIds = () => stateAdapter.getPinnedRegionIds?.() || new Set();
  const getShowReachableCapitalCandidates = () => (
    stateAdapter.getShowReachableCapitalCandidates?.() ?? true
  );
  const getActiveIncomingClaimKey = () => (
    stateAdapter.getActiveIncomingClaimKey?.() || ''
  );
  const getCurrentNation = () => getLockedNation() || getHoverNation() || '';

  function setContext(nextContext = {}) {
    if (destroyed) return;
    const {outputs: nextOutputs, ...values} = nextContext;
    localContext = {...localContext, ...values};
    if (nextOutputs) outputCallbacks = {...outputCallbacks, ...nextOutputs};
  }

  function getRegion(regionName) {
    return context().regionByName?.[regionName] || null;
  }

  function getNationOverlayModel(nation, options = {}) {
    const current = context();
    const build = claimPresentation.getNationOverlayModel;
    if (build.length >= 3) {
      return build(current.activeData, current.indices, nation, options);
    }
    return build(nation, options);
  }

  function getForeignHoverDescriptorSet(nation) {
    const getDescriptors = (
      claimPresentation.getForeignHoverDescriptorSet
      || claimPresentation.getForeignHoverOverlayDescriptorSet
    );
    return getDescriptors?.(nation) || {cacheKey: '', descriptors: []};
  }

  function getManualEnvelopeModel(anchorModel, options = {}) {
    const build = (
      claimPresentation.getManualEnvelopeModel
      || claimPresentation.buildManualEnvelopeModel
    );
    return build?.(anchorModel, options) || null;
  }

  function getReachableCapitalCandidateDescriptors(anchorModel) {
    const build = (
      claimPresentation.getReachableCapitalCandidateDescriptors
      || claimPresentation.reachableCapitalCandidateDescriptors
    );
    return build?.(anchorModel) || [];
  }

  function clearHoverClaimPreview({force = false} = {}) {
    hoverClaimPreviewNation = '';
    mapPresentation.clearHoverPreview({force});
    output('syncClaimPresentationState', {
      committed: !!currentOverlayModel?.hasClaimOverlay,
      preview: false,
    });
  }

  function renderClaimOverlay(model) {
    output('setOverlayVisualState', model);
    output('applyMapVisualState');
    mapPresentation.renderClaimOverlay({
      model,
      overlayDescriptorSet: claimPresentation.getClaimOverlayDescriptorSet(model),
      labelDescriptorSet: claimPresentation.getClaimLabelDescriptorSet(model),
    });
    output('renderCapitalMarkers');
  }

  function renderManualEnvelope(anchorModel = currentOverlayModel) {
    const model = getManualEnvelopeModel(anchorModel);
    mapPresentation.renderManualEnvelope({model});
    return model;
  }

  function clearManualEnvelope() {
    mapPresentation.clear({kind: 'manual-envelope'});
  }

  function refreshReachableCapitalCandidateOutputs(
    anchorModel = currentOverlayModel
  ) {
    const candidates = getShowReachableCapitalCandidates()
      ? getReachableCapitalCandidateDescriptors(anchorModel)
      : [];
    output('renderReachableCapitalCandidates', {
      anchorModel,
      candidates,
      visible: getShowReachableCapitalCandidates(),
    });
    return candidates;
  }

  function updateSelectedRegions(options = {}) {
    output('updateSelectedRegions', {
      selectedRegionIds: stateAdapter.selectedRegionIds,
      ...options,
    });
  }

  function refreshPinnedRegionOutputs(changedRegionIds = []) {
    const changed = [...new Set((changedRegionIds || []).filter(Boolean))];
    output('refreshPinnedRegionOutputs', {
      changedRegionIds: changed,
      pinnedRegionIds: getPinnedRegionIds(),
      currentOverlayModel,
    });
    return changed;
  }

  function pinRegionState(regionName = '', options = {}) {
    if (!regionName) return false;
    const wasPinned = getPinnedRegionIds().has(regionName);
    const previousClaimant = stateAdapter.getPinnedCapitalClaimant?.(regionName) || '';
    stateAdapter.pinRegionState(regionName, options);
    const nextClaimant = stateAdapter.getPinnedCapitalClaimant?.(regionName) || '';
    if (wasPinned && previousClaimant === nextClaimant) return false;
    refreshPinnedRegionOutputs([regionName]);
    return true;
  }

  function unpinPinnedRegionState(regionName = '') {
    stateAdapter.unpinPinnedRegionState(regionName);
    refreshPinnedRegionOutputs([regionName]);
  }

  function clearPinnedRegionState() {
    const previous = [...getPinnedRegionIds()];
    stateAdapter.clearPinnedRegionState();
    refreshPinnedRegionOutputs(previous);
  }

  function toggleReachableCapitalCandidatesState() {
    stateAdapter.toggleReachableCapitalCandidatesState();
    output('updateReachableCapitalsButton', getShowReachableCapitalCandidates());
    refreshReachableCapitalCandidateOutputs(currentOverlayModel);
  }

  function updateSecondaryCapitalPreview(region) {
    const selectedNation = getLockedNation() || getActiveNation();
    let nextNation = '';
    if (
      selectedNation
      && region?.regionName
      && currentOverlayModel?.hasClaimOverlay
    ) {
      nextNation = claimPresentation.resolveCapitalClaimantForRegion(
        region.regionName,
        (
          claimPresentation.getActiveExpansionScope
          || claimPresentation.buildActiveExpansionScope
        )?.(currentOverlayModel)
      );
    }
    if (stateAdapter.getSecondaryHoverNation?.() === nextNation) return false;
    stateAdapter.setSecondaryHoverNationState(nextNation);
    return true;
  }

  function refreshSecondaryCapitalPreviewForHoveredRegion() {
    return updateSecondaryCapitalPreview(getRegion(getHoveredRegionName()));
  }

  function updateHoverNationPreview(nation) {
    if (destroyed || getLockedNation()) return null;
    const previewNation = nation || '';
    stateAdapter.setActiveNationState('');
    hoverClaimPreviewNation = previewNation;
    if (!previewNation) {
      visibleNationRegionNames = new Set();
      clearHoverClaimPreview({force: true});
      output('clearClaimPill');
      output('renderHoverOutlines');
      output('renderCapitalMarkers');
      return null;
    }
    const model = getNationOverlayModel(previewNation, {cacheKey: 'hover-preview'});
    visibleNationRegionNames = new Set(model?.resultSet || []);
    const descriptorSet = claimPresentation.getClaimOverlayDescriptorSet(model);
    mapPresentation.renderHoverPreview({
      model,
      descriptorSet,
      nation: previewNation,
    });
    output('syncClaimPresentationState', {
      committed: !!currentOverlayModel?.hasClaimOverlay,
      preview: true,
    });
    output('renderClaimPill', model);
    output('renderHoverOutlines');
    output('renderCapitalMarkers');
    return model;
  }

  function resetTransientClaimState() {
    stateAdapter.clearTransientClaim?.();
    stateAdapter.setSecondaryHoverNationState('');
    output('resetClaimControls');
  }

  function setHoverPreviewNation(nation) {
    if (destroyed || getLockedNation()) return false;
    const nextNation = nation || '';
    if (hoverClaimPreviewNation === nextNation && !getActiveNation()) return false;
    stateAdapter.setHoverNationState(nextNation);
    resetTransientClaimState();
    updateHoverNationPreview(getHoverNation());
    return true;
  }

  function scheduleHoverPreviewNation(nation) {
    if (destroyed || getLockedNation()) return false;
    const nextNation = nation || '';
    if (hoverClaimPreviewNation === nextNation && !getActiveNation()) return false;
    output('scheduleHoverPreview', nextNation);
    return true;
  }

  function cancelPendingHoverPreview() {
    output('cancelHoverPreview');
  }

  function clearHoverPreview() {
    if (destroyed) return;
    cancelPendingHoverPreview();
    output('hideRegionTooltip');
    const previousRegionName = getHoveredRegionName();
    output('setHoverPill', null);
    stateAdapter.setHoveredRegionState('');
    stateAdapter.setSecondaryHoverNationState('');
    output('clearHoverVisualState', previousRegionName);
    output('renderHoverOutlines');
    output('syncReachableCapitalCandidateHoverState');
    if (getLockedNation()) {
      stateAdapter.setHoverNationState('');
      output('renderCapitalMarkers');
      return;
    }
    if (!getHoverNation() && !getActiveNation()) return;
    stateAdapter.setHoverNationState('');
    resetTransientClaimState();
    updateHoverNationPreview('');
  }

  function hoverRegion(region, event = null, {force = false} = {}) {
    if (destroyed || !region?.regionName) return false;
    const previousRegionName = getHoveredRegionName();
    const regionChanged = previousRegionName !== region.regionName;
    const nationChanged = getHoverNation() !== region.nationTag;
    if (!force && !regionChanged && (!getLockedNation() || !nationChanged)) {
      output('showRegionTooltip', event, region);
      return false;
    }
    stateAdapter.setHoveredRegionState(region.regionName, region.nationTag);
    if (getLockedNation()) stateAdapter.setHoverNationState(region.nationTag);
    else stateAdapter.setHoverNationState(region.nationTag);
    updateSecondaryCapitalPreview(region);
    output('setHoverPill', region);
    output('showRegionTooltip', event, region);
    output('updateHoverVisualState', {
      previousRegionName,
      region,
      force,
      regionChanged,
      nationChanged,
    });
    output('renderHoverOutlines');
    output('syncReachableCapitalCandidateHoverState');
    output('renderCapitalMarkers');
    if (!getLockedNation() && nationChanged) {
      scheduleHoverPreviewNation(region.nationTag);
    }
    return true;
  }

  function moveRegionHover(event, region) {
    if (destroyed || !region) return;
    output('showRegionTooltip', event, region);
  }

  function updateNationOverlay(
    nation,
    {
      renderDetails = !!getLockedNation(),
      updateFilters = renderDetails,
      updateSelected = renderDetails,
      renderMap = true,
      updateManualExpansion = renderMap,
    } = {}
  ) {
    if (destroyed) return null;
    stateAdapter.setActiveNationState(nation);
    if (renderDetails && getActiveNation()) {
      output('renderProjectOptions', getActiveNation());
    }
    if (!getActiveNation()) {
      clearHoverClaimPreview({force: true});
      currentOverlayModel = null;
      visibleNationRegionNames = new Set();
      output('clearOverlayVisualState');
      output('applyMapVisualState');
      stateAdapter.setSecondaryHoverNationState('');
      mapPresentation.clear({kind: 'claim'});
      clearManualEnvelope();
      refreshReachableCapitalCandidateOutputs(null);
      output('renderHoverOutlines');
      if (renderDetails) output('clearNationDetails');
      output('clearClaimPill');
      if (updateFilters) output('applyFilters', false);
      if (updateSelected) updateSelectedRegions();
      return null;
    }

    clearHoverClaimPreview({force: true});
    const overlayModel = getNationOverlayModel(getActiveNation());
    stateAdapter.setActiveIncomingClaimKeyState(
      overlayModel?.activeIncomingClaimKey || ''
    );
    currentOverlayModel = overlayModel;
    visibleNationRegionNames = new Set(overlayModel?.resultSet || []);
    if (renderMap) renderClaimOverlay(overlayModel);
    if (updateManualExpansion) {
      renderManualEnvelope(overlayModel);
      refreshReachableCapitalCandidateOutputs(overlayModel);
    }
    if (renderMap) {
      refreshSecondaryCapitalPreviewForHoveredRegion();
      output('renderHoverOutlines');
    }
    output('renderClaimPill', overlayModel);
    if (renderDetails) output('renderNationDetails', overlayModel);
    if (updateFilters) output('applyFilters', false);
    if (updateSelected) updateSelectedRegions();
    return overlayModel;
  }

  function focusNation(nation, {fillSearch = true} = {}) {
    if (destroyed) return false;
    if (!nation) {
      clearSelection({clearSearch: fillSearch});
      return false;
    }
    cancelPendingHoverPreview();
    stateAdapter.setLockedNationState(nation);
    stateAdapter.setHoverNationState('');
    stateAdapter.setSecondaryHoverNationState('');
    stateAdapter.setProjectFilterState('');
    stateAdapter.setActiveIncomingClaimKeyState('');
    if (fillSearch) output('setSearchNation', nation);
    output('closeNationDropdown');
    output('resetClaimControls');
    updateNationOverlay(nation);
    output('applyFilters', true);
    updateSelectedRegions();
    return true;
  }

  function clearSelection({clearSearch = true} = {}) {
    if (destroyed) return;
    const clearedPins = [...getPinnedRegionIds()];
    stateAdapter.clearSelection();
    output('updateReachableCapitalsButton', getShowReachableCapitalCandidates());
    stateAdapter.setActiveNationState('');
    stateAdapter.setHoverNationState('');
    stateAdapter.setSecondaryHoverNationState('');
    stateAdapter.setHoveredRegionState('');
    stateAdapter.setFocusedRegionState('');
    stateAdapter.setProjectFilterState('');
    stateAdapter.setActiveIncomingClaimKeyState('');
    output('clearHoverVisualState');
    output('resetClaimControls');
    cancelPendingHoverPreview();
    output('hideRegionTooltip');
    if (clearSearch) output('clearSearchSelection');
    output('setHoverPill', null);
    updateNationOverlay('', {
      renderDetails: true,
      updateFilters: false,
      updateSelected: false,
    });
    output('applyFilters', true);
    updateSelectedRegions();
    refreshPinnedRegionOutputs(clearedPins);
  }

  function focusRegions(
    regionNames,
    {selectSingle = false, preserveNation = false, refreshOverlay = false} = {}
  ) {
    const names = (regionNames || []).filter(Boolean);
    if (selectSingle && names.length === 1) {
      const region = getRegion(names[0]);
      if (region) {
        if (preserveNation && getActiveNation()) {
          const changedRegionIds = stateAdapter.setSelectedRegionIds([region.regionName]);
          stateAdapter.setFocusedRegionState(region.regionName);
          updateSelectedRegions({changedRegionIds});
          if (refreshOverlay) updateNationOverlay(getActiveNation());
          return true;
        }
        return selectRegion(region);
      }
    }
    const changedRegionIds = stateAdapter.setSelectedRegionIds(names);
    stateAdapter.setFocusedRegionState(names.length === 1 ? names[0] : '');
    updateSelectedRegions({changedRegionIds});
    if (refreshOverlay && getActiveNation()) updateNationOverlay(getActiveNation());
    return !!names.length;
  }

  function focusPinnedRegion(regionName) {
    const region = getRegion(regionName);
    if (!region) return false;
    if (getLockedNation() || getActiveNation()) {
      return focusRegions(
        [regionName],
        {selectSingle: true, preserveNation: true, refreshOverlay: true}
      );
    }
    return selectRegion(region);
  }

  function commitReachableCapitalSelection(region, capitalClaimantId = '') {
    if (destroyed) return false;
    const claimant = claimPresentation.resolveReachableCapitalSelectionClaimant(
      region,
      capitalClaimantId,
      currentOverlayModel
    );
    if (!region?.regionName || !claimant) return false;
    const shouldRefreshIncomingOverlay = !!getActiveIncomingClaimKey();
    stateAdapter.setHoveredRegionState(region.regionName, region.nationTag);
    stateAdapter.setFocusedRegionState(region.regionName);
    const changedRegionIds = stateAdapter.setSelectedRegionIds([region.regionName]);
    pinRegionState(region.regionName, {capitalClaimant: claimant});
    updateSecondaryCapitalPreview(region);
    updateSelectedRegions({bounded: true, changedRegionIds});
    if (getActiveNation()) {
      updateNationOverlay(getActiveNation(), {
        renderDetails: true,
        updateFilters: false,
        updateSelected: false,
        renderMap: shouldRefreshIncomingOverlay,
        updateManualExpansion: shouldRefreshIncomingOverlay,
      });
    }
    return true;
  }

  function selectReachableCapitalCandidate(candidate) {
    return commitReachableCapitalSelection(
      getRegion(candidate?.region),
      candidate?.primaryNation || ''
    );
  }

  function reachableCapitalCandidateForRegion(regionName) {
    if (!getShowReachableCapitalCandidates() || !regionName) return null;
    return getReachableCapitalCandidateDescriptors(currentOverlayModel)
      .find(candidate => candidate.region === regionName) || null;
  }

  function selectReachableCapitalCandidateRegion(regionName) {
    const candidate = reachableCapitalCandidateForRegion(regionName);
    return candidate ? selectReachableCapitalCandidate(candidate) : false;
  }

  function selectActiveNationCapitalRegion(region) {
    const anchorNation = claimPresentation.manualEnvelopeAnchorNation(
      currentOverlayModel
    );
    const isCapital = output(
      'isCapitalRegionForNation',
      anchorNation,
      region?.regionName
    );
    if (
      !region?.regionName
      || !anchorNation
      || !(getLockedNation() || getActiveNation())
      || !isCapital
    ) {
      return false;
    }
    stateAdapter.setHoveredRegionState(region.regionName, region.nationTag);
    stateAdapter.setFocusedRegionState(region.regionName);
    const changedRegionIds = stateAdapter.setSelectedRegionIds([region.regionName]);
    pinRegionState(region.regionName);
    updateSecondaryCapitalPreview(region);
    updateSelectedRegions({bounded: true, changedRegionIds});
    return true;
  }

  function selectRegion(region) {
    if (!region) return false;
    if (commitReachableCapitalSelection(region)) return true;
    if (selectActiveNationCapitalRegion(region)) return true;
    stateAdapter.setHoveredRegionState(region.regionName, region.nationTag);
    stateAdapter.setFocusedRegionState(region.regionName);
    stateAdapter.setSelectedRegionIds([region.regionName]);
    focusNation(region.nationTag);
    pinRegionState(region.regionName);
    return true;
  }

  function unpinClickedPinnedRegion(region) {
    const regionName = region?.regionName || '';
    if (!regionName || !getPinnedRegionIds().has(regionName)) return false;
    unpinPinnedRegionState(regionName);
    refreshSecondaryCapitalPreviewForHoveredRegion();
    output('renderHoverOutlines');
    output('renderCapitalMarkers');
    return true;
  }

  function onRegionClick(_event, region) {
    if (unpinClickedPinnedRegion(region)) return true;
    return selectRegion(region);
  }

  function resetContext({resetServices = true, clearUi = true} = {}) {
    if (destroyed) return false;
    cancelPendingHoverPreview();
    output('hideRegionTooltip');
    currentOverlayModel = null;
    visibleNationRegionNames = new Set();
    hoverClaimPreviewNation = '';
    stateAdapter.setHoveredRegionState('');
    stateAdapter.setHoverNationState('');
    stateAdapter.setSecondaryHoverNationState('');
    if (resetServices) {
      (claimPresentation.resetContext || claimPresentation.reset)?.();
      mapPresentation.reset();
    } else {
      mapPresentation.clearHoverPreview({force: true});
    }
    output('clearOverlayVisualState');
    output('clearHoverVisualState');
    if (clearUi) {
      output('clearClaimPill');
      output('clearNationDetails');
      output('setHoverPill', null);
    }
    return true;
  }

  function destroy() {
    if (destroyed) return false;
    resetContext({resetServices: false, clearUi: true});
    destroyed = true;
    localContext = {};
    outputCallbacks = {};
    currentOverlayModel = null;
    visibleNationRegionNames = new Set();
    hoverClaimPreviewNation = '';
    return true;
  }

  return Object.freeze({
    setContext,
    resetContext,
    destroy,
    get currentOverlayModel() {
      return currentOverlayModel;
    },
    get visibleNationRegionNames() {
      return visibleNationRegionNames;
    },
    get hoverClaimPreviewNation() {
      return hoverClaimPreviewNation;
    },
    getCurrentNation,
    updateNationOverlay,
    updateHoverNationPreview,
    setHoverPreviewNation,
    scheduleHoverPreviewNation,
    cancelPendingHoverPreview,
    clearHoverPreview,
    hoverRegion,
    moveRegionHover,
    onRegionClick,
    focusNation,
    focusRegions,
    focusPinnedRegion,
    clearSelection,
    pinRegionState,
    unpinPinnedRegionState,
    clearPinnedRegionState,
    unpinClickedPinnedRegion,
    toggleReachableCapitalCandidatesState,
    updateSecondaryCapitalPreview,
    refreshSecondaryCapitalPreviewForHoveredRegion,
    commitReachableCapitalSelection,
    selectReachableCapitalCandidate,
    selectReachableCapitalCandidateRegion,
    reachableCapitalCandidateForRegion,
    selectActiveNationCapitalRegion,
    selectRegion,
    refreshPinnedRegionOutputs,
    refreshReachableCapitalCandidateOutputs,
    updateSelectedRegions,
    renderManualEnvelope,
    clearManualEnvelope,
    getForeignHoverDescriptorSet,
  });
}
