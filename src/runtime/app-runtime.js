// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {panMapView} from '../state/map-view-state.js';
import {createMapInteractionController} from '../interaction/map-interaction-controller.js';
import {createMapViewController} from '../interaction/map-view-controller.js';
import {createMapSceneRenderer} from '../render/map-scene-renderer.js';
import {createRefreshCoordinator} from './refresh-coordinator.js';
import {createUiRuntimeBindings} from './ui-runtime-bindings.js';
import {createClaimSelectionRuntime} from './claim-selection-runtime.js';
import {createDebugRuntime} from './debug-runtime.js';
import {installBrowserApi} from './browser-api.js';
import {createAppStateAdapter} from './app-state-adapter.js';
import {createScenarioContext} from './scenario-context.js';
import {createAppShellController} from '../ui/app-shell-controller.js';
import {createPresentationFormatters} from '../ui/presentation-formatters.js';

export function createAppRuntime({window, document, generatedData}) {
  const scenarioContext = createScenarioContext(generatedData);
  const appData = scenarioContext.snapshot().appData;
  const appShell = createAppShellController({window, document});
  const {elements, filterControls} = appShell;
  const stateAdapter = createAppStateAdapter({
    activeScenarioId: appData.defaultScenario,
    onScenarioReconciled: () => {
      mapSceneRenderer.syncSelected(selectedRegionIds);
      mapSceneRenderer.syncPinned(getPinnedRegionIds());
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
      refreshCoordinator.rerenderWorldWrapLayers();
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
  const {tip} = elements;

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

  function activeScenarioId() {
    return appState.activeScenarioId || appData.defaultScenario || '';
  }

  const {
    getActiveNation,
    getHoveredRegionName,
    getHoverNation,
    getLockedNation,
    getPinnedRegionIds,
    getShowReachableCapitalCandidates
  } = stateAdapter;

  const {claimPresentation, claimModel, mapPresentation, mapOutputController, selectionCoordinator} = createClaimSelectionRuntime({
    window, elements, appData, stateAdapter, filterControls, i18n, presentationFormatters,
    mapSceneRenderer, debugRuntime,
    getInteractionController: () => mapInteractionController,
    getSnapshot: () => scenarioSnapshot,
    getLanguage: () => currentLanguage,
    getCopyContexts: () => worldCopyContexts,
  });
  claimHelpers = claimModel;

  const {renderPinnedRegionsPanel} = mapOutputController;
  const {refreshReachableCapitalCandidateOutputs} = selectionCoordinator;

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
      mapInteractionController.hideTooltip();
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
    onHoverFullVisualPass: mapSceneRenderer.apply,
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

  const refreshCoordinator = createRefreshCoordinator({
    scenarioContext, stateAdapter, filterControls, appShell, mapSceneRenderer,
    mapPresentation, claimPresentation, selectionCoordinator, mapOutputController,
    searchController, mapInteractionController, mapViewController, rebuildSearchCatalog,
    recordRenderStat, activeScenarioId,
    getSnapshot: () => scenarioSnapshot,
    setSnapshot: snapshot => { scenarioSnapshot = snapshot; },
    isDestroyed: () => destroyed,
  });
  const {setActiveScenario} = refreshCoordinator;

  let started = false;
  let destroyed = false;
  let browserApi = null;

  function setLanguage(language) {
    if (destroyed) return currentLanguage;
    currentLanguage = appShell.setLanguage(language);
    if (started) refreshCoordinator.refreshLanguage();
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
        if (!setActiveScenario(scenarioId)) appShell.renderScenarioChoices();
      },
    });
    appShell.start();
    mapInteractionController.bind();
    appShell.setHoverPill();
    appShell.setClaimsPillEmpty();
    mapViewController.start();
    renderPinnedRegionsPanel();
    refreshReachableCapitalCandidateOutputs();
    refreshCoordinator.prepareScenarioRuntime(activeScenarioId(), {rebuildRuntime: false});
    refreshCoordinator.refreshScenarioView();
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
