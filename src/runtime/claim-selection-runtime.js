// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {createClaimPresentationService} from '../data/claim-presentation-service.js';
import {createMapPresentationController} from '../render/map-presentation-controller.js';
import {createMapOutputController} from '../render/map-output-controller.js';
import {createClaimOverlayRenderer} from '../render/claim-overlay-renderer.js';
import {createManualEnvelopeRenderer} from '../render/manual-envelope-renderer.js';
import {createMapMarkerRenderer} from '../render/map-marker-renderer.js';
import {createSelectionCoordinator} from './selection-coordinator.js';
import {BASE_TERRITORY_COLOR, claimIsEffectivelyHostile} from '../ui/presentation-formatters.js';

export function createClaimSelectionRuntime({
  window, elements, appData, stateAdapter, filterControls, i18n,
  presentationFormatters, mapSceneRenderer, debugRuntime,
  getSnapshot, getLanguage, getCopyContexts, getInteractionController,
}) {
const appState = stateAdapter.state;
const selectedRegionIds = stateAdapter.selectedRegionIds;
const {getActiveIncomingClaimKey, getActiveNation, getFocusedRegionName, getHoveredRegionName,
  getHoverNation, getLockedNation, getPinnedCapitalClaimant, getPinnedRegionIds,
  getProjectFilter, getSecondaryHoverNation, getShowReachableCapitalCandidates} = stateAdapter;
const {t, formatNumber} = i18n;
const {localizedRegionName, nationDisplayName, projectDisplay, projectColor,
  hoverNationProjectOpacity} = presentationFormatters;
const labelPosition = mapSceneRenderer.labelPosition;
const {stats: debugRenderStats, record: recordRenderStat, set: setRenderStat} = debugRuntime;
const hostileClaimHatchingDisabled = debugRuntime.flags.hostileHatchingDisabled;
const claimOverlayCommitDelayFrames = debugRuntime.flags.claimOverlayDelayFrames;
const {pinnedRegionsPanel, reachableCandidatesPanel, selectedPill} = elements;
const {claimOverlays: gClaimOverlays, claimLabels: gClaimLabels,
  manualEnvelopeOverlays: gManualEnvelopeOverlays, capitalMarkers: gCapitalMarkers,
  foreignHoverOverlays: gForeignHoverOverlays, secondaryHoverOverlays: gSecondaryHoverOverlays,
  hoverOutlines: gHoverOutlines, selectionOutlines: gSelectionOutlines,
  pinnedRegionMarkers: gPinnedRegionMarkers, reachableCapitalCandidates: gReachableCapitalCandidates,
  hoverClaimPreviewOverlays: gHoverClaimPreviewOverlays} = elements.layers;
const claimOverlayRenderer = createClaimOverlayRenderer({
  claimOverlayLayer: gClaimOverlays,
  claimLabelLayer: gClaimLabels,
});
const manualEnvelopeRenderer = createManualEnvelopeRenderer({
  layer: gManualEnvelopeOverlays,
});
const mapMarkerRenderer = createMapMarkerRenderer({
  capitalLayer: gCapitalMarkers,
  foreignLayer: gForeignHoverOverlays,
  secondaryLayer: gSecondaryHoverOverlays,
  hoverLayer: gHoverOutlines,
  selectionLayer: gSelectionOutlines,
  pinnedLayer: gPinnedRegionMarkers,
  reachableLayer: gReachableCapitalCandidates,
});
const mapPresentation = createMapPresentationController({
  claimOverlayRenderer,
  manualEnvelopeRenderer,
  mapMarkerRenderer,
  hoverPreviewLayer: gHoverClaimPreviewOverlays,
  getContext: () => ({
    copyContexts: getCopyContexts(),
    regionByName: getSnapshot().regionByName,
    language: getLanguage(),
    claimMode: filterControls.getClaimMode(),
    claimKind: filterControls.getClaimKind(),
    projectFilter: getProjectFilter(),
    dataKey: claimPresentation.overlayModelDataVersionKey(
      getSnapshot().activeData,
      getSnapshot().indices
    ),
    hostileHatchingDisabled: hostileClaimHatchingDisabled,
    claimOverlayCommitDelayFrames,
    recordRenderStat,
    setRenderStat,
    debugRenderStats,
    window,
    labelPosition,
    localizedRegionName,
    t,
    projectDisplay,
    nationDisplayName,
    formatNumber,
    claimIsEffectivelyHostile,
  }),
});
const claimPresentation = createClaimPresentationService({
  getContext: () => ({
    activeScenarioId: appState.activeScenarioId,
    defaultScenarioId: appData.defaultScenario,
    activeData: getSnapshot().activeData,
    indices: getSnapshot().indices,
    language: getLanguage(),
    claimsByNation: getSnapshot().claimsByNation,
    nationRegions: getSnapshot().nationRegions,
    projectMeta: getSnapshot().projectMeta,
    claimMode: filterControls.getClaimMode(),
    claimKind: filterControls.getClaimKind(),
    projectFilter: getProjectFilter(),
    activeIncomingClaimKey: getActiveIncomingClaimKey(),
    selectedRegionIds,
    incomingClaimsByRegion: getSnapshot().incomingClaimsByRegion,
    capitalNationsByRegion: getSnapshot().indices.capitalNationsByRegion,
    regionByName: getSnapshot().regionByName,
    activeNationId: getActiveNation(),
    lockedNationId: getLockedNation(),
    focusedRegionName: getFocusedRegionName(),
    currentOverlayModel: selectionCoordinator.currentOverlayModel,
    pinnedRegionIds: getPinnedRegionIds(),
    getPinnedCapitalClaimant,
    pinnedExpansionClaimants,
    isCapitalRegionForNation,
    projectDisplay,
    sourceLabels: {
    inheritedFrom: project => t('source.inheritedFrom', {project}),
    basicClaim: () => t('source.basicClaim'),
    direct: () => t('source.direct'),
    },
    baselineLabel: t('claimCard.projectBaseline'),
    labelPosition,
    projectColor,
    baseTerritoryColor: BASE_TERRITORY_COLOR,
    hoverNationProjectOpacity,
    claimIsEffectivelyHostile,
    recordRenderStat,
  }),
});
const claimModel = claimPresentation.claimModel;
const {
  projectCost,
  projectSortLabel,
  dependsOn,
  sortedProjectEntries,
  countryProjectTierMap,
  nationClaimTierCount,
  countryProjectTier,
  isExcludedSystemClaim,
  entryFilterValue,
  getClaimKindFilteredProjectEntries,
  getVisibleProjectEntriesForKind,
  cumulativeClaimEntries,
  incomingTargetRegions,
  outgoingClaimKey,
  incomingClaimKey,
  selectedIncomingEntry,
  incomingClaimsForTarget,
  visibleClaimRegionsForEntry,
  compareManualEnvelopeSourceSpecs,
  buildManualEnvelopeModelData,
  nationBaseRegionNames,
  nationResultRegionNames,
  nationFullyIncludedInResult,
  isReachableCapitalCandidateNation,
  reachableCapitalCandidateNations,
} = claimModel;
const {
  activeClaimPreviewContainsRegion,
  activeClaimPreviewRegionSet,
  buildActiveExpansionScope,
  getClaimLabelDescriptorSet,
  getClaimOverlayDescriptorSet,
  getForeignHoverOverlayDescriptorSet,
  getManualEnvelopeModel: buildManualEnvelopeModel,
  getNationOverlayModel,
  manualEnvelopeAnchorNation,
  manualEnvelopeVisibleRegionSet,
  reachableCapitalCandidateDescriptors,
  resolveCapitalClaimantForRegion,
  resolveReachableCapitalSelectionClaimant,
} = claimPresentation;
const mapOutputController = createMapOutputController({
  mapSceneRenderer,
  mapPresentation,
  roots: {
    pinnedRegionsPanel,
    reachableCandidatesPanel,
    selectedPill,
  },
  getContext: () => ({
    regionByName: getSnapshot().regionByName,
    claimsByNation: getSnapshot().claimsByNation,
    indices: getSnapshot().indices,
    selectedRegionIds,
    copyContexts: getCopyContexts(),
    language: getLanguage(),
    currentOverlayModel: selectionCoordinator.currentOverlayModel,
    visibleNationRegionNames: selectionCoordinator.visibleNationRegionNames,
    getActiveNation,
    getHoverNation,
    getHoveredRegionName,
    getLockedNation,
    getPinnedCapitalClaimant,
    getPinnedRegionIds,
    getSecondaryHoverNation,
    getShowReachableCapitalCandidates,
    buildActiveExpansionScope,
    resolveCapitalClaimantForRegion,
    getForeignHoverOverlayDescriptorSet,
    reachableCapitalCandidateDescriptors,
    labelPosition,
    localizedRegionName,
    nationDisplayName,
    formatNumber,
    t,
    debugRenderStats,
    recordRenderStat,
    setRenderStat,
    focusPinnedRegion: selectionCoordinator.focusPinnedRegion,
    unpinPinnedRegion: selectionCoordinator.unpinPinnedRegionState,
    clearPinnedRegions: selectionCoordinator.clearPinnedRegionState,
    renderManualEnvelope: selectionCoordinator.renderManualEnvelope,
    refreshReachableCapitalCandidateOutputs: (
      selectionCoordinator.refreshReachableCapitalCandidateOutputs
    ),
    commitReachableCapitalSelection: selectionCoordinator.commitReachableCapitalSelection,
  }),
});
const {
  capitalRegionsText,
  isCapitalRegionForNation,
  pinnedExpansionClaimants,
  renderCapitalMarkers,
  renderHoverOutlines,
  renderPinnedRegionMarkers,
  renderPinnedRegionsPanel,
  renderReachableCapitalCandidateMarkers,
  renderReachableCapitalCandidatesPanel,
  renderSelectionOutlines,
  syncReachableCapitalCandidateHoverState,
  updateSelectedRegions,
} = mapOutputController;
const selectionCoordinator = createSelectionCoordinator({
  stateAdapter,
  claimPresentation,
  mapPresentation,
  getContext: () => ({
    activeData: getSnapshot().activeData,
    indices: getSnapshot().indices,
    regionByName: getSnapshot().regionByName,
  }),
  outputs: {
    setOverlayVisualState: mapSceneRenderer.setOverlay,
    clearOverlayVisualState: mapSceneRenderer.clearOverlay,
    applyMapVisualState: mapSceneRenderer.apply,
    clearHoverVisualState: previousRegionName => {
      mapSceneRenderer.setHover('');
      if (previousRegionName) mapSceneRenderer.applyForRegions([previousRegionName]);
      else mapSceneRenderer.apply();
    },
    updateHoverVisualState: ({previousRegionName, region, regionChanged}) => {
      mapSceneRenderer.setHover(region.regionName);
      if (regionChanged) {
        mapSceneRenderer.applyForRegions(
          [previousRegionName, region.regionName].filter(Boolean)
        );
      } else {
        getInteractionController().scheduleHoverFullVisualPass();
      }
    },
    renderCapitalMarkers,
    renderHoverOutlines,
    syncReachableCapitalCandidateHoverState,
    renderReachableCapitalCandidates: ({anchorModel}) => {
      renderReachableCapitalCandidatesPanel(anchorModel);
      renderReachableCapitalCandidateMarkers(anchorModel);
    },
    refreshPinnedRegionOutputs: ({changedRegionIds}) => (
      mapOutputController.refreshPinnedRegionOutputs(changedRegionIds)
    ),
    updateSelectedRegions,
    syncClaimPresentationState: mapSceneRenderer.syncClaimPresentation,
    isCapitalRegionForNation,
  },
});
return {claimPresentation, claimModel, mapPresentation, mapOutputController, selectionCoordinator};
}
