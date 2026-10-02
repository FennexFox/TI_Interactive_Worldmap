// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {panMapView} from '../state/map-view-state.js';
import {createMapInteractionController} from '../interaction/map-interaction-controller.js';
import {createMapViewController} from '../interaction/map-view-controller.js';
import {createMapSceneRenderer} from '../render/map-scene-renderer.js';
import {createUiRuntimeBindings} from './ui-runtime-bindings.js';
import {createClaimSelectionRuntime} from './claim-selection-runtime.js';
import {createDebugRuntime} from './debug-runtime.js';
import {installBrowserApi} from './browser-api.js';
import {createAppStateAdapter} from './app-state-adapter.js';
import {createLanguageRefreshActions, createScenarioRefreshActions} from './refresh-actions.js';
import {createScenarioContext} from './scenario-context.js';
import {createAppShellController} from '../ui/app-shell-controller.js';
import {createPresentationFormatters} from "../ui/presentation-formatters.js";
import {
  ACTIVE_SCENARIO_REFRESH_STEPS,
  LANGUAGE_REFRESH_STEPS,
  runRefreshSteps,
} from './refresh-flow.js';

export function createAppRuntime({window, document, generatedData}) {
const scenarioContext = createScenarioContext(generatedData);
const appData = scenarioContext.snapshot().appData;
const appShell = createAppShellController({window, document});
const {elements, filterControls} = appShell;
const stateAdapter = createAppStateAdapter({
  activeScenarioId: appData.defaultScenario,
  onScenarioReconciled: () => {
    syncSelectedVisualState();
    syncPinnedVisualState();
  },
});
const appState = stateAdapter.state;
const selectedRegionIds = stateAdapter.selectedRegionIds;
let scenarioSnapshot = scenarioContext.snapshot();
let worldCopyContexts = [];
const svg = elements.svg;
const svgWrap = elements.svgWrap;
const mapViewController = createMapViewController({
  document,
  svg,
  svgWrap,
  activeData: scenarioSnapshot.activeData,
  getActiveData: () => scenarioSnapshot.activeData,
  location: window.location,
  getT: () => t,
  getLanguage: () => currentLanguage,
  onWorldWrapChanged: ({copyContexts}) => {
    worldCopyContexts = copyContexts;
    syncWorldWrapDebugStats();
    rerenderWorldWrapLayers();
  },
  onTooltipLayoutInvalidated: () => mapInteractionController.invalidateTooltipLayout(),
  scheduleMapViewRender: context => mapInteractionController.scheduleMapViewRender(context),
  cancelMapViewRender: () => mapInteractionController.cancelMapViewRender(),
  getDebugContext: () => ({debugRenderStats, recordRenderStat, recordRenderTiming}),
});
const mapView = mapViewController.mapView;
worldCopyContexts = mapViewController.getCopyContexts();
const debugRuntime = createDebugRuntime({
  location: window.location,
  storage: window.localStorage,
  mapView,
  initialMapView: mapView,
  getWorldWrapEnabled: mapViewController.isWorldWrapEnabled,
  getWorldCopyContextCount: () => mapViewController.getCopyContexts().length,
});
const hostileClaimHatchingDisabled = debugRuntime.flags.hostileHatchingDisabled;
const debugLabelsDisabled = debugRuntime.flags.labelsDisabled;
const debugCanonicalHitPaths = debugRuntime.flags.canonicalHitPaths;
const debugRenderStats = debugRuntime.stats;
const recordRenderStat = debugRuntime.record;
const setRenderStat = debugRuntime.set;
const recordRenderTiming = debugRuntime.recordTiming;
const syncWorldWrapDebugStats = debugRuntime.syncWorldWrap;

const {
  regions: gRegions,
  normalRegionColors: gNormalRegionColors,
  hitRegions: gHitRegions,
  labels: gLabels,
  grid: gGrid
} = elements.layers;
const mapSceneRenderer = createMapSceneRenderer({
  svg,
  regionLayer: gRegions,
  normalRegionColorLayer: gNormalRegionColors,
  hitLayer: gHitRegions,
  labelLayer: gLabels,
  gridLayer: gGrid,
  getContext: () => ({
    regions: scenarioSnapshot.regions,
    indices: scenarioSnapshot.indices,
    mapView,
    copyContexts: worldCopyContexts,
    baseMode: filterControls.getBaseMode(),
    colorFor,
    labelPosition: mapSceneRenderer.labelPosition,
    localizedRegionName,
    debugRenderStats,
    debugLabelsDisabled,
    debugCanonicalHitPaths,
    recordRenderStat,
    setRenderStat,
    recordRenderTiming,
    hasCommittedClaimOverlay: !!selectionCoordinator.currentOverlayModel?.hasClaimOverlay,
    hasClaimPreview: !!selectionCoordinator.hoverClaimPreviewNation,
  }),
});
const {
  tip
} = elements;

mapSceneRenderer.setHostileHatchingDisabled(hostileClaimHatchingDisabled);

const i18n = appShell.i18n;
let currentLanguage = i18n.language;
const {
  t,
  dataLanguageKey,
  claimTierCountShortText
} = i18n;
let claimHelpers = {};
const presentationFormatters = createPresentationFormatters({
  getContext: () => ({
    t,
    dataLanguageKey,
    projectMeta: scenarioSnapshot.projectMeta,
    nationMeta: scenarioSnapshot.nationMeta,
    regionByName: scenarioSnapshot.regionByName,
    claimsByNation: scenarioSnapshot.claimsByNation,
    nationRegions: scenarioSnapshot.nationRegions,
    nationColorPalette: scenarioSnapshot.nationColorPalette,
    nationColorIndexes: scenarioSnapshot.nationColorIndexes,
    baseMode: filterControls.getBaseMode(),
    claimTierCountShortText,
    getActiveNation,
  }),
  getClaimHelpers: () => claimHelpers,
});
const {
  colorFor,
  localizedRegionName
} = presentationFormatters;
appShell.setContext({
  scenarioChoices: scenarioContext.getScenarioChoices,
  activeScenarioId,
  getShowReachableCapitalCandidates: () => getShowReachableCapitalCandidates(),
  localizedRegionName,
  onMapViewControlsUpdate: () => mapViewController.updateLabels(),
});

function renderScenarioOptions() {
  appShell.renderScenarioChoices();
}
function syncScenarioControls() {
  renderScenarioOptions();
}
function setHoverPill(region=null) {
  appShell.setHoverPill(region);
}
function setClaimsPillEmpty() {
  appShell.setClaimsPillEmpty();
}

function applyStaticTranslations() {
  appShell.applyTranslations();
}

function activeScenarioId() {
  return appState.activeScenarioId || appData.defaultScenario || '';
}

function resolveScenarioId(scenarioId = '') {
  return scenarioContext.resolveScenarioId(scenarioId);
}

function availableRuntimeNationIds() {
  return scenarioContext.availableNationIds();
}

function activeIncomingClaimKeysForState() {
  const nation = getLockedNation() || getActiveNation();
  if (!nation || !scenarioSnapshot.claimsByNation[nation]) return [];
  const data = scenarioSnapshot.claimsByNation[nation];
  const baseSet = new Set(
    data.baseRegions || scenarioSnapshot.nationRegions.get(nation) || []
  );
  return incomingClaimsForTarget(nation, data, baseSet).map(incomingClaimKey);
}

function applyRuntimeScenarioData(scenarioId) {
  const nextSnapshot = scenarioContext.setActiveScenario(scenarioId);
  if (!nextSnapshot) return;
  scenarioSnapshot = nextSnapshot;
  recordRenderStat('scenarioRuntimeBuilds');
}

function clearScenarioSensitiveCaches() {
  mapSceneRenderer.reset();
}

function resetScenarioRenderKeys() {
  mapPresentation.reset();
}

function reconcileStateForActiveScenario() {
  stateAdapter.reconcileScenario({
    regionIds: Object.keys(scenarioSnapshot.regionByName || {}),
    nationIds: availableRuntimeNationIds(),
    projectIds: Object.keys(scenarioSnapshot.projectMeta || {}),
    incomingClaimKeys: activeIncomingClaimKeysForState(),
  });
  const searchedNation = searchController.getSelectedNation();
  if (searchedNation && !availableRuntimeNationIds().includes(searchedNation)) {
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
  clearScenarioSensitiveCaches();
  rebuildSearchCatalog();
  buildIncomingClaimIndex();
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
  if (destroyed) return false;
  const scenarioId = resolveScenarioId(nextScenarioId);
  if (!scenarioId) return false;
  if (!force && scenarioId === activeScenarioId()) return false;
  stateAdapter.activateScenario(scenarioId);
  prepareScenarioRuntime(scenarioId);
  refreshScenarioView();
  syncScenarioControls();
  return true;
}

const {
  getActiveNation,
  getHoveredRegionName,
  getHoverNation,
  getLockedNation,
  getPinnedRegionIds,
  getProjectFilter,
  getShowReachableCapitalCandidates,
  setActiveIncomingClaimKeyState,
  setProjectFilterState
} = stateAdapter;

function syncSelectedVisualState() {
  mapSceneRenderer.syncSelected(selectedRegionIds);
}

function syncPinnedVisualState() {
  mapSceneRenderer.syncPinned(getPinnedRegionIds());
}

function clearOverlayVisualState() {
  mapSceneRenderer.clearOverlay();
}

function applyMapVisualState(renderContext = {}) {
  mapSceneRenderer.apply(renderContext);
}

const {claimPresentation, claimModel, mapPresentation, mapOutputController, selectionCoordinator} = createClaimSelectionRuntime({
  window, elements, appData, stateAdapter, filterControls, i18n, presentationFormatters,
  mapSceneRenderer, debugRuntime,
  getInteractionController: () => mapInteractionController,
  getSnapshot: () => scenarioSnapshot,
  getLanguage: () => currentLanguage,
  getCopyContexts: () => worldCopyContexts,
});
claimHelpers = claimModel;
const {
  incomingClaimKey,
  incomingClaimsForTarget
} = claimModel;

const {
  renderCapitalMarkers,
  renderPinnedRegionMarkers,
  renderPinnedRegionsPanel,
  renderSelectionOutlines,
  updateSelectedRegions
} = mapOutputController;
const {
  getCurrentNation,
  refreshReachableCapitalCandidateOutputs,
  toggleReachableCapitalCandidatesState,
  updateHoverNationPreview,
  updateNationOverlay
} = selectionCoordinator;
const renderManualEnvelopeOverlay = selectionCoordinator.renderManualEnvelope;
function buildIncomingClaimIndex() {
  claimPresentation.rebuildIncomingClaimIndex();
}
function renderGrid(renderContext = {}) {
  mapSceneRenderer.renderGrid(renderContext);
}
function renderBaseRegionColors(renderContext = {}) {
  mapSceneRenderer.renderBaseColors(renderContext);
}

function renderRegionGeometry(renderContext = {}) {
  mapSceneRenderer.renderGeometry(renderContext);
}
function rerenderWorldWrapLayers() {
  if (!mapViewController.isWorldWrapEnabled()) {
    panMapView(mapView, {dx: 0, dy: 0, normalizeX: false});
  }
  mapViewController.apply();
  resetScenarioRenderKeys();
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
function renderLabels(renderContext = {}) {
  mapSceneRenderer.renderLabels(renderContext);
}
function refreshLabelTexts() {
  mapSceneRenderer.refreshLabelTexts();
}

function hideRegionTooltip() {
  mapInteractionController.hideTooltip();
}

const mapInteractionController = createMapInteractionController({
  document,
  svg,
  svgWrap,
  tip,
  hitLayer: gHitRegions,
  gridLayer: gGrid,
  window,
  getContext: () => ({regionByName: scenarioSnapshot.regionByName}),
  onRegionEnter: (event, region, options) => {
    selectionCoordinator.hoverRegion(region, event, options);
  },
  onRegionMove: (event, region) => selectionCoordinator.hoverRegion(region, event),
  onRegionLeave: event => {
    hideRegionTooltip();
    if (event?.relatedTarget?.closest?.('.region, .region-hit')) return;
    selectionCoordinator.clearHoverPreview();
  },
  onRegionClick: selectionCoordinator.onRegionClick,
  onBlankMapMove: () => {
    if (
      getHoveredRegionName()
      || getHoverNation()
      || mapInteractionController.hasActiveTooltip()
    ) {
      selectionCoordinator.clearHoverPreview();
    }
  },
  onBlankMapClick: selectionCoordinator.clearSelection,
  onMapLeave: selectionCoordinator.clearHoverPreview,
  onMapWheel: mapViewController.onWheel,
  onHoverPreview: nation => {
    if (!getLockedNation()) selectionCoordinator.setHoverPreviewNation(nation);
  },
  onHoverFullVisualPass: applyMapVisualState,
  onMapViewRender: mapViewController.apply,
  onContextReset: ({flushMapView, mapViewRenderCanceled} = {}) => {
    if (flushMapView && mapViewRenderCanceled) mapViewController.apply();
  },
  getMapView: () => mapView,
  getWorldWrapEnabled: mapViewController.isWorldWrapEnabled,
  panMapView,
  recordRenderStat,
  samplePanSvgNodeCount: mapSceneRenderer.samplePanSvgNodeCount,
  debugRenderStats,
});
const {
  searchController,
  rebuildSearchCatalog
} = createUiRuntimeBindings({
  appShell, filterControls, stateAdapter, selectionCoordinator, claimModel,
  mapOutputController, mapSceneRenderer, mapInteractionController,
  i18n, presentationFormatters, recordRenderStat,
  getSnapshot: () => scenarioSnapshot,
});
const applyFilters = searchController.applyFilters;
const renderNationDropdown = searchController.renderDropdown;

function updateWarning() {
  appShell.updateWarning(scenarioSnapshot.claimStats);
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
        ? scenarioSnapshot.regions[hoveredRegionId]
        : null;
      setHoverPill(hoveredRegion);
    },
  }));
}

let started = false;
let destroyed = false;
let browserApi = null;

function setLanguage(language) {
  if (destroyed) return currentLanguage;
  currentLanguage = appShell.setLanguage(language);
  if (started) refreshLanguage();
  return currentLanguage;
}

function start() {
  if (started || destroyed) return false;
  started = true;
  browserApi = installBrowserApi({
    window,
    debugRenderStats,
    scenarioIds: scenarioContext.getScenarioIds(),
    getActiveScenario: activeScenarioId,
    setActiveScenario,
  });
  appShell.setContext({
    onLanguageChange: setLanguage,
    onScenarioChange: scenarioId => {
      if (!setActiveScenario(scenarioId)) syncScenarioControls();
    },
    onBaseModeChange: () => {
      renderBaseRegionColors();
      applyMapVisualState();
    },
    onClaimModeChange: mode => {
      setActiveIncomingClaimKeyState('');
      if (mode !== 'project') setProjectFilterState('');
      else if (!getProjectFilter()) setProjectFilterState(filterControls.getProject());
      updateNationOverlay(getCurrentNation());
    },
    onClaimKindChange: () => updateNationOverlay(getCurrentNation()),
    onProjectChange: projectId => {
      setActiveIncomingClaimKeyState('');
      setProjectFilterState(projectId || '');
      filterControls.setClaimMode(getProjectFilter() ? 'project' : 'all');
      updateNationOverlay(getCurrentNation());
    },
    onLabelsToggle: () => {
      mapSceneRenderer.setLabelsVisible(!mapSceneRenderer.isLabelsVisible());
      renderLabels();
      applyFilters();
    },
    onReachableCapitalsToggle: () => {
      toggleReachableCapitalCandidatesState();
    },
  });
  appShell.start();
  mapInteractionController.bind();
  setHoverPill();
  setClaimsPillEmpty();
  mapViewController.start();
  renderPinnedRegionsPanel();
  refreshReachableCapitalCandidateOutputs();
  prepareScenarioRuntime(activeScenarioId(), {rebuildRuntime: false});
  refreshScenarioView();
  return true;
}

function destroy() {
  if (destroyed) return;
  destroyed = true;
  mapInteractionController.destroy();
  selectionCoordinator.destroy();
  mapViewController.destroy();
  mapOutputController.destroy();
  mapSceneRenderer.destroy();
  appShell.destroy();
  mapPresentation.destroy();
  claimPresentation.destroy();
  browserApi?.destroy();
  browserApi = null;
}

return Object.freeze({start, destroy, setActiveScenario, setLanguage});
}
