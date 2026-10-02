// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {panMapView} from '../state/map-view-state.js';
import {createLanguageRefreshActions, createScenarioRefreshActions} from './refresh-actions.js';
import {
  ACTIVE_SCENARIO_REFRESH_STEPS,
  LANGUAGE_REFRESH_STEPS,
  runRefreshSteps,
} from './refresh-flow.js';

export function createRefreshCoordinator({
  scenarioContext, stateAdapter, filterControls, appShell, mapSceneRenderer,
  mapPresentation, claimPresentation, selectionCoordinator, mapOutputController,
  searchController, mapInteractionController, mapViewController, rebuildSearchCatalog,
  recordRenderStat, activeScenarioId, getSnapshot, setSnapshot, isDestroyed,
}) {
  const mapView = mapViewController.mapView;
  const {getLockedNation, getActiveNation, getHoverNation, getProjectFilter} = stateAdapter;
  const {incomingClaimsForTarget, incomingClaimKey} = claimPresentation.claimModel;
  const {updateNationOverlay, updateHoverNationPreview, getCurrentNation,
    refreshReachableCapitalCandidateOutputs, renderManualEnvelope: renderManualEnvelopeOverlay} = selectionCoordinator;
  const {renderSelectionOutlines, renderPinnedRegionsPanel, renderPinnedRegionMarkers,
    renderCapitalMarkers, updateSelectedRegions} = mapOutputController;
  const renderGrid = mapSceneRenderer.renderGrid;
  const renderRegionGeometry = mapSceneRenderer.renderGeometry;
  const renderLabels = mapSceneRenderer.renderLabels;
  const renderBaseRegionColors = mapSceneRenderer.renderBaseColors;
  const refreshLabelTexts = mapSceneRenderer.refreshLabelTexts;
  const clearOverlayVisualState = mapSceneRenderer.clearOverlay;
  const applyFilters = searchController.applyFilters;
  const renderNationDropdown = searchController.renderDropdown;
  const setHoverPill = appShell.setHoverPill;
  const setClaimsPillEmpty = appShell.setClaimsPillEmpty;
  const applyStaticTranslations = appShell.applyTranslations;
  const syncScenarioControls = appShell.renderScenarioChoices;
  function activeIncomingClaimKeysForState() {
    const nation = getLockedNation() || getActiveNation();
    if (!nation || !getSnapshot().claimsByNation[nation]) return [];
    const data = getSnapshot().claimsByNation[nation];
    const baseSet = new Set(
      data.baseRegions || getSnapshot().nationRegions.get(nation) || []
    );
    return incomingClaimsForTarget(nation, data, baseSet).map(incomingClaimKey);
  }

  function applyRuntimeScenarioData(scenarioId) {
    const nextSnapshot = scenarioContext.setActiveScenario(scenarioId);
    if (!nextSnapshot) return;
    setSnapshot(nextSnapshot);
    recordRenderStat('scenarioRuntimeBuilds');
  }

  function reconcileStateForActiveScenario() {
    stateAdapter.reconcileScenario({
      regionIds: Object.keys(getSnapshot().regionByName || {}),
      nationIds: scenarioContext.availableNationIds(),
      projectIds: Object.keys(getSnapshot().projectMeta || {}),
      incomingClaimKeys: activeIncomingClaimKeysForState(),
    });
    const searchedNation = searchController.getSelectedNation();
    if (searchedNation && !scenarioContext.availableNationIds().includes(searchedNation)) {
      searchController.setSelectedNation('');
    }
    const selectedNation = searchController.getSelectedNation();
    if (selectedNation) searchController.setSelectedNation(selectedNation);
    if (!filterControls.hasProject(getProjectFilter())) filterControls.setProject('');
    if (filterControls.getClaimMode() === 'project' && !getProjectFilter()) {
      filterControls.setClaimMode('all');
    }
  }

  function resetTransientScenarioInteractionState() {
    mapInteractionController.resetContext();
    selectionCoordinator.resetContext({resetServices: true, clearUi: true});
  }

  function prepareScenarioRuntime(scenarioId, {rebuildRuntime = true} = {}) {
    resetTransientScenarioInteractionState();
    if (rebuildRuntime) applyRuntimeScenarioData(scenarioId);
    mapSceneRenderer.reset();
    rebuildSearchCatalog();
    claimPresentation.rebuildIncomingClaimIndex();
    reconcileStateForActiveScenario();
  }

  function refreshScenarioView() {
    recordRenderStat('scenarioRefreshRuns');
    runRefreshSteps(ACTIVE_SCENARIO_REFRESH_STEPS, createScenarioRefreshActions({
      updateWarning,
      clearOverlayVisualState,
      renderGrid: () => renderGrid({mapView}),
      renderRegionGeometry: () => renderRegionGeometry({mapView}),
      renderLabels: () => renderLabels({mapView}),
      renderSelectionOutlines,
      renderPinnedRegionsPanel,
      renderPinnedRegionMarkers,
      renderCapitalMarkers: () => renderCapitalMarkers({force: true}),
      updateNationOverlay: () => updateNationOverlay(getLockedNation() || getActiveNation(), {
        renderDetails: true,
        updateFilters: false,
        updateSelected: false,
        renderMap: true,
        updateManualExpansion: true,
      }),
      applyFilters: () => applyFilters(true, {renderBaseColors: false}),
      renderBaseRegionColors: () => renderBaseRegionColors({mapView}),
      updateSelectedRegions,
      renderNationDropdown,
      refreshReachableCapitalCandidateOutputs: () => (
        refreshReachableCapitalCandidateOutputs(selectionCoordinator.currentOverlayModel)
      ),
      setHoverPill: () => setHoverPill(),
      setClaimsPillEmptyIfIdle: () => {
        if (!getLockedNation() && !getActiveNation()) setClaimsPillEmpty();
      },
    }));
  }

  function setActiveScenario(nextScenarioId, {force = false} = {}) {
    if (isDestroyed()) return false;
    const scenarioId = scenarioContext.resolveScenarioId(nextScenarioId);
    if (!scenarioId) return false;
    if (!force && scenarioId === activeScenarioId()) return false;
    stateAdapter.activateScenario(scenarioId);
    prepareScenarioRuntime(scenarioId);
    refreshScenarioView();
    syncScenarioControls();
    return true;
  }

  function rerenderWorldWrapLayers() {
    if (!mapViewController.isWorldWrapEnabled()) {
      panMapView(mapView, {dx: 0, dy: 0, normalizeX: false});
    }
    mapViewController.apply();
    mapPresentation.reset();
    renderGrid({mapView});
    renderRegionGeometry({mapView});
    renderLabels({mapView});
    applyFilters(true, {renderBaseColors: false});
    renderBaseRegionColors({mapView});
    updateNationOverlay(getCurrentNation(), {updateFilters: false, updateSelected: false});
    renderSelectionOutlines();
    renderPinnedRegionMarkers();
    renderCapitalMarkers({force: true});
    refreshReachableCapitalCandidateOutputs(selectionCoordinator.currentOverlayModel);
    updateSelectedRegions();
  }
  function updateWarning() {
    appShell.updateWarning(getSnapshot().claimStats);
  }
  function refreshLanguage() {
    recordRenderStat('languageRefreshRuns');
    runRefreshSteps(LANGUAGE_REFRESH_STEPS, createLanguageRefreshActions({
      applyStaticTranslations,
      rebuildSearchCatalog,
      updateWarning,
      syncSearchSelectedNationLabel: () => searchController.syncSelectedNationLabel(),
      renderNationDropdown,
      refreshNationOverlayForLanguage: () => {
        const committedNation = getLockedNation();
        if (committedNation) {
          updateNationOverlay(committedNation, {updateFilters: false, updateSelected: false});
        } else if (getHoverNation()) {
          updateHoverNationPreview(getHoverNation());
        } else {
          updateNationOverlay('', {updateFilters: false, updateSelected: false});
        }
      },
      renderLabels: refreshLabelTexts,
      applyFilters: () => applyFilters(true),
      updateSelectedRegions,
      renderPinnedRegionsPanel,
      renderPinnedRegionMarkers,
      renderManualEnvelopeOverlay: () => (
        renderManualEnvelopeOverlay(selectionCoordinator.currentOverlayModel)
      ),
      refreshReachableCapitalCandidateOutputs: () => (
        refreshReachableCapitalCandidateOutputs(selectionCoordinator.currentOverlayModel)
      ),
      refreshHoverPill: () => {
        const hoveredRegionId = mapInteractionController.currentTooltipRegionId();
        const hoveredRegion = hoveredRegionId != null
          ? getSnapshot().regions[hoveredRegionId]
          : null;
        setHoverPill(hoveredRegion);
      },
    }));
  }

  return {prepareScenarioRuntime, refreshScenarioView, setActiveScenario, refreshLanguage, rerenderWorldWrapLayers};
}
