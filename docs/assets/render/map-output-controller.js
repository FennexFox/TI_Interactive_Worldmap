// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  renderPinnedRegionsPanel as renderPinnedRegionsPanelUi,
  renderReachableCapitalCandidatesPanel as renderReachableCapitalCandidatesPanelUi,
} from '../ui/panels.js';

export function createMapOutputController({
  mapSceneRenderer,
  mapPresentation,
  roots = {},
  getContext,
} = {}) {
  if (!mapSceneRenderer) throw new TypeError('mapSceneRenderer is required');
  if (!mapPresentation) throw new TypeError('mapPresentation is required');
  if (typeof getContext !== 'function') throw new TypeError('getContext must be a function');

  let destroyed = false;
  const context = () => getContext() || {};

  function capitalRegionNames(data) {
    const {regionByName = {}} = context();
    return [...new Set(data?.capitalRegions || [])].filter(regionName => regionByName[regionName]);
  }

  function capitalRegionNamesForNation(nation) {
    return capitalRegionNames(context().claimsByNation?.[nation] || null);
  }

  function capitalRegionsText(data) {
    const {regionByName = {}, localizedRegionName = String} = context();
    const names = capitalRegionNames(data)
      .map(regionName => localizedRegionName(regionByName[regionName] || regionName));
    return names.length ? names.join(', ') : '-';
  }

  function isCapitalRegionForNation(nation, regionName) {
    return !!nation && !!regionName && capitalRegionNamesForNation(nation).includes(regionName);
  }

  function selectedRegionIsCapital(regionName) {
    const {getActiveNation = () => '', regionByName = {}} = context();
    if (isCapitalRegionForNation(getActiveNation(), regionName)) return true;
    return isCapitalRegionForNation(regionByName[regionName]?.nationTag || '', regionName);
  }

  function addCapitalMarkerNation(markers, nation, {selected = false} = {}) {
    if (!nation) return;
    for (const regionName of capitalRegionNamesForNation(nation)) {
      const existing = markers.get(regionName);
      markers.set(regionName, {
        regionName,
        nation,
        selected: !!(selected || existing?.selected),
      });
    }
  }

  function isPinnedCapitalRegionForNation(nation) {
    const {getPinnedRegionIds = () => new Set()} = context();
    return !!nation && [...getPinnedRegionIds()]
      .some(regionName => isCapitalRegionForNation(nation, regionName));
  }

  function isActiveCapitalMarkerSelected(nation) {
    const {
      selectedRegionIds = new Set(),
      getHoveredRegionName = () => '',
    } = context();
    return [...selectedRegionIds].some(regionName => isCapitalRegionForNation(nation, regionName))
      || isCapitalRegionForNation(nation, getHoveredRegionName())
      || isPinnedCapitalRegionForNation(nation);
  }

  function shouldSuppressHoveredOwnerCapitalMarker(region) {
    const {
      currentOverlayModel,
      buildActiveExpansionScope = () => null,
      resolveCapitalClaimantForRegion = () => '',
    } = context();
    const claimant = resolveCapitalClaimantForRegion(
      region?.regionName,
      buildActiveExpansionScope(currentOverlayModel)
    );
    return !!claimant && claimant !== region?.nationTag;
  }

  function collectCapitalMarkers() {
    const {
      regionByName = {},
      selectedRegionIds = new Set(),
      visibleNationRegionNames = new Set(),
      getActiveNation = () => '',
      getHoverNation = () => '',
      getHoveredRegionName = () => '',
      getLockedNation = () => '',
    } = context();
    const markers = new Map();
    const pinnedNation = getLockedNation() || getActiveNation();
    if (pinnedNation) {
      addCapitalMarkerNation(markers, pinnedNation, {
        selected: isActiveCapitalMarkerSelected(pinnedNation),
      });
    }

    for (const regionName of selectedRegionIds) {
      const owner = regionByName[regionName]?.nationTag || '';
      if (isCapitalRegionForNation(owner, regionName)) {
        addCapitalMarkerNation(markers, owner, {selected: true});
      }
    }

    const hovered = getHoveredRegionName() ? regionByName[getHoveredRegionName()] : null;
    if (hovered) {
      if (getActiveNation() && visibleNationRegionNames.has(hovered.regionName)) {
        addCapitalMarkerNation(markers, getActiveNation(), {
          selected: isActiveCapitalMarkerSelected(getActiveNation()),
        });
      }
      if (!shouldSuppressHoveredOwnerCapitalMarker(hovered)) {
        addCapitalMarkerNation(markers, hovered.nationTag, {
          selected: isCapitalRegionForNation(hovered.nationTag, hovered.regionName),
        });
      }
    }

    if (!markers.size) addCapitalMarkerNation(markers, getHoverNation());
    return [...markers.values()];
  }

  function renderCapitalMarkers({force = false, copyContexts} = {}) {
    if (destroyed) return;
    const current = context();
    const markers = collectCapitalMarkers()
      .sort((a, b) => (
        a.regionName.localeCompare(b.regionName) || a.nation.localeCompare(b.nation)
      ));
    mapPresentation.renderCapitalMarkers({
      markers,
      regionByName: current.regionByName,
      copyContexts: copyContexts || current.copyContexts,
      language: current.language,
      force,
      labelPosition: current.labelPosition,
      localizedRegionName: current.localizedRegionName,
      t: current.t,
      recordRenderStat: current.recordRenderStat,
    });
  }

  function selectedRegionSummary() {
    const {
      selectedRegionIds = new Set(),
      regionByName = {},
      localizedRegionName = String,
      t = () => '',
    } = context();
    const names = [...selectedRegionIds].filter(Boolean);
    if (!names.length) return '';
    if (names.length === 1) {
      const regionName = names[0];
      const region = regionByName[regionName];
      return t('selected.region', {
        region: localizedRegionName(region || regionName),
        nation: region?.nationTag ? ` · ${region.nationTag}` : '',
      });
    }
    return t('selected.regions', {count: names.length});
  }

  function pinnedCapitalClaimants(regionName) {
    return [...new Set(
      context().indices?.capitalNationsByRegion?.get?.(regionName) || []
    )].filter(Boolean);
  }

  function pinnedExpansionClaimants(regionName) {
    const {
      getPinnedCapitalClaimant = () => '',
    } = context();
    const claimants = pinnedCapitalClaimants(regionName);
    const preferredClaimant = getPinnedCapitalClaimant(regionName);
    if (preferredClaimant && claimants.includes(preferredClaimant)) return [preferredClaimant];
    return claimants;
  }

  function pinnedRegionCapitalSummary(regionName) {
    const {
      nationDisplayName = String,
      formatNumber = String,
      t = () => '',
    } = context();
    const claimants = pinnedExpansionClaimants(regionName);
    if (!claimants.length) return t('expansionNodes.noCapitalClaimant');
    const names = claimants.map(nationDisplayName);
    if (claimants.length === 1) {
      return t('expansionNodes.capitalClaimant', {nation: names[0]});
    }
    return t('expansionNodes.capitalClaimants', {
      count: formatNumber(claimants.length),
      nations: names.slice(0, 3).join(', ') + (
        names.length > 3 ? `, +${names.length - 3}` : ''
      ),
    });
  }

  function pinnedRegionOwnerSummary(region) {
    const {nationDisplayName = String, t = () => ''} = context();
    return region?.nationTag
      ? t('expansionNodes.owner', {nation: nationDisplayName(region.nationTag)})
      : '';
  }

  function renderPinnedRegionsPanel() {
    if (destroyed) return;
    const current = context();
    renderPinnedRegionsPanelUi({
      root: roots.pinnedRegionsPanel,
      pinnedRegionIds: current.getPinnedRegionIds(),
      regionByName: current.regionByName,
      localizedRegionName: current.localizedRegionName,
      ownerSummary: pinnedRegionOwnerSummary,
      capitalSummary: pinnedRegionCapitalSummary,
      t: current.t,
      formatNumber: current.formatNumber,
      onFocus: current.focusPinnedRegion,
      onUnpin: current.unpinPinnedRegion,
      onClear: current.clearPinnedRegions,
    });
  }

  function renderPinnedRegionMarkers({copyContexts} = {}) {
    if (destroyed) return;
    const current = context();
    const pinned = [...current.getPinnedRegionIds()]
      .filter(regionName => current.regionByName[regionName]);
    const selectedPinnedRegions = pinned
      .filter(regionName => current.selectedRegionIds.has(regionName));
    mapPresentation.renderPinnedRegionMarkers({
      pinned,
      selectedPinnedRegions,
      copyContexts: copyContexts || current.copyContexts,
      language: current.language,
      regionByName: current.regionByName,
      isPinnedCapital: regionName => pinnedExpansionClaimants(regionName).length > 0,
      labelPosition: current.labelPosition,
      localizedRegionName: current.localizedRegionName,
      t: current.t,
      formatNumber: current.formatNumber,
      recordRenderStat: current.recordRenderStat,
    });
  }

  function refreshPinnedRegionOutputs(changedRegionIds = []) {
    if (destroyed) return;
    const current = context();
    const changed = [...new Set((changedRegionIds || []).filter(Boolean))];
    mapSceneRenderer.syncPinned(current.getPinnedRegionIds());
    if (changed.length) mapSceneRenderer.applyForRegions(changed);
    else mapSceneRenderer.apply();
    renderPinnedRegionsPanel();
    renderPinnedRegionMarkers();
    current.renderManualEnvelope?.(current.currentOverlayModel);
    current.refreshReachableCapitalCandidateOutputs?.(current.currentOverlayModel);
  }

  function shouldShowForeignHoverNationOverlay(region) {
    const current = context();
    if (!region?.nationTag) return false;
    const pinnedNation = current.getLockedNation() || current.getActiveNation();
    if (!pinnedNation) return false;
    const scope = current.buildActiveExpansionScope(current.currentOverlayModel);
    if (scope.regionSet?.has?.(region.regionName)) return false;
    return region.nationTag !== pinnedNation;
  }

  function renderHoverOutlines({force = false, copyContexts} = {}) {
    if (destroyed) return;
    const current = context();
    const regionName = current.getHoveredRegionName();
    const region = regionName ? current.regionByName[regionName] : null;
    const hidden = !regionName || current.selectedRegionIds.has(regionName) || !region;
    const secondaryNation = current.getSecondaryHoverNation();
    const secondary = !hidden && !!secondaryNation;
    const foreign = !hidden && !secondary && shouldShowForeignHoverNationOverlay(region);
    const foreignDescriptorSet = foreign
      ? current.getForeignHoverOverlayDescriptorSet(region.nationTag)
      : null;
    const secondaryDescriptorSet = secondary
      ? current.getForeignHoverOverlayDescriptorSet(secondaryNation)
      : null;
    mapPresentation.renderHoverOutlines({
      region,
      hidden,
      foreign,
      secondary,
      foreignDescriptorSet,
      secondaryDescriptorSet,
      copyContexts: copyContexts || current.copyContexts,
      regionByName: current.regionByName,
      activeNationId: current.getLockedNation() || current.getActiveNation(),
      visibleNationRegion: current.visibleNationRegionNames.has(regionName),
      force,
      debugRenderStats: current.debugRenderStats,
      recordRenderStat: current.recordRenderStat,
      setRenderStat: current.setRenderStat,
    });
  }

  function renderSelectionOutlines({copyContexts} = {}) {
    if (destroyed) return;
    const current = context();
    mapPresentation.renderSelectionOutlines({
      selectedRegionNames: [...current.selectedRegionIds],
      regionByName: current.regionByName,
      copyContexts: copyContexts || current.copyContexts,
      isSelectedCapital: selectedRegionIsCapital,
      labelPosition: current.labelPosition,
      localizedRegionName: current.localizedRegionName,
    });
  }

  function updateSelectedRegions({bounded = false, changedRegionIds = []} = {}) {
    if (destroyed) return;
    const current = context();
    mapSceneRenderer.syncSelected(current.selectedRegionIds);
    if (bounded && changedRegionIds.length) {
      mapSceneRenderer.applyForRegions(changedRegionIds);
    } else {
      mapSceneRenderer.apply();
    }
    renderHoverOutlines();
    renderSelectionOutlines();
    renderPinnedRegionMarkers();
    renderCapitalMarkers();
    const label = selectedRegionSummary();
    if (roots.selectedPill) {
      roots.selectedPill.textContent = label;
      roots.selectedPill.style.display = label ? '' : 'none';
    }
  }

  function reachableCandidateNationsText(candidate) {
    const {nationDisplayName = String} = context();
    const names = candidate.nations.map(nationDisplayName);
    return names.slice(0, 3).join(', ') + (
      names.length > 3 ? `, +${names.length - 3}` : ''
    );
  }

  function reachableCandidateMarkerLabel(candidate) {
    const {
      regionByName = {},
      localizedRegionName = String,
      t = () => '',
    } = context();
    return t('reachableCandidates.marker', {
      region: localizedRegionName(regionByName[candidate.region] || candidate.region),
      nations: reachableCandidateNationsText(candidate),
    });
  }

  function renderReachableCapitalCandidatesPanel(anchorModel, {candidates} = {}) {
    if (destroyed) return;
    const current = context();
    const resolvedCandidates = candidates
      ?? current.reachableCapitalCandidateDescriptors(anchorModel);
    renderReachableCapitalCandidatesPanelUi({
      root: roots.reachableCandidatesPanel,
      visible: current.getShowReachableCapitalCandidates(),
      candidates: resolvedCandidates,
      regionByName: current.regionByName,
      localizedRegionName: current.localizedRegionName,
      candidateNationsText: reachableCandidateNationsText,
      t: current.t,
      formatNumber: current.formatNumber,
      onSelect: (regionName, nationId) => (
        current.commitReachableCapitalSelection(current.regionByName[regionName], nationId)
      ),
    });
  }

  function syncReachableCapitalCandidateHoverState() {
    if (destroyed) return;
    mapPresentation.syncReachableHoverState({
      hoveredRegionName: context().getHoveredRegionName(),
    });
  }

  function renderReachableCapitalCandidateMarkers(
    anchorModel,
    {copyContexts, candidates} = {}
  ) {
    if (destroyed) return;
    const current = context();
    const resolvedCandidates = current.getShowReachableCapitalCandidates()
      ? (candidates ?? current.reachableCapitalCandidateDescriptors(anchorModel))
      : [];
    mapPresentation.renderReachableCapitalCandidates({
      visible: current.getShowReachableCapitalCandidates(),
      candidates: resolvedCandidates,
      copyContexts: copyContexts || current.copyContexts,
      language: current.language,
      regionByName: current.regionByName,
      hoveredRegionName: current.getHoveredRegionName(),
      markerLabel: reachableCandidateMarkerLabel,
      labelPosition: current.labelPosition,
      localizedRegionName: current.localizedRegionName,
      t: current.t,
      recordRenderStat: current.recordRenderStat,
    });
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    for (const root of [
      roots.pinnedRegionsPanel,
      roots.reachableCandidatesPanel,
      roots.selectedPill,
    ]) {
      if (root) root.textContent = '';
    }
    return true;
  }

  return Object.freeze({
    capitalRegionsText,
    isCapitalRegionForNation,
    pinnedExpansionClaimants,
    renderCapitalMarkers,
    renderPinnedRegionsPanel,
    renderPinnedRegionMarkers,
    refreshPinnedRegionOutputs,
    renderHoverOutlines,
    renderSelectionOutlines,
    updateSelectedRegions,
    renderReachableCapitalCandidatesPanel,
    renderReachableCapitalCandidateMarkers,
    syncReachableCapitalCandidateHoverState,
    destroy,
  });
}
