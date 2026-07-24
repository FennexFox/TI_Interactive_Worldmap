// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  clearPinnedRegions,
  clearSelectionState,
  clearTransientClaimState as clearTransientClaimAppState,
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
  setSecondaryHoverNation,
  setSelectedNation,
  setSelectedRegions,
  toggleReachableCapitalCandidates,
  unpinPinnedRegion,
} from './state/app-state.js';
import {
  applyMapVisualState as applyVisualState,
  applyMapVisualStateForRegions as applyVisualStateForRegions,
  clearOverlayVisualState as clearOverlayState,
  createMapVisualState,
  setHiddenVisualState as setHiddenState,
  setHoverVisualState as setHoverState,
  setOverlayVisualState as setOverlayState,
  syncPinnedVisualState as syncPinnedState,
  syncSelectedVisualState as syncSelectedState,
} from './state/map-visual-state.js';
import {
  formatViewBoxForMapView,
  initializeMapView,
  panMapView,
  zoomMapView,
} from './state/map-view-state.js';
import {createMapPanController} from './interaction/map-pan.js';
import {createTooltipController} from './interaction/tooltip.js';
import {createAppData, getActiveData, getScenarioIds} from './data/active-data.js';
import {createClaimModel} from './data/claim-model.js';
import {buildClaimLabelDescriptors, buildClaimOverlayDescriptors} from './data/overlay-descriptors.js';
import {buildSearchCatalog, filterSearchCatalog, parseNationSearchValue as parseNationSearchCatalogValue} from './data/search-catalog.js';
import {
  createGroupedVisualFillFragment,
  defaultWorldCopyContext,
  normalizeWorldCopyContexts,
  renderGrid as renderGridLayer,
  renderLabels as renderLabelsLayer,
  renderRegionGeometry as renderRegionGeometryLayer,
  replaceLayerChildren,
} from './render/map-layers.js';
import {createClaimOverlayRenderer} from './render/claim-overlay-renderer.js';
import {createManualEnvelopeRenderer} from './render/manual-envelope-renderer.js';
import {createMapMarkerRenderer} from './render/map-marker-renderer.js';
import {createDebugRuntime} from './runtime/debug-runtime.js';
import {createLruCache} from './runtime/lru-cache.js';
import {createLanguageRefreshActions, createScenarioRefreshActions} from './runtime/refresh-actions.js';
import {createScenarioRuntime} from './runtime/scenario-runtime.js';
import {createAsideCardController} from './ui/aside-cards.js';
import {createI18n, readSavedLanguage, saveLanguage} from './ui/i18n.js';
import {createNationInfoPanelController} from './ui/nation-info-panel.js';
import {
  renderPinnedRegionsPanel as renderPinnedRegionsPanelUi,
  renderReachableCapitalCandidatesPanel as renderReachableCapitalCandidatesPanelUi,
} from './ui/panels.js';
import {
  initMapViewControls as initMapViewControlsUi,
  updateMapViewControlsLabels as updateMapViewControlsLabelsUi,
} from './ui/map-controls.js';
import {
  ACTIVE_SCENARIO_REFRESH_STEPS,
  LANGUAGE_REFRESH_STEPS,
  runRefreshSteps,
} from './runtime/refresh-flow.js';
import {
  applyStaticTranslations as applyStaticTranslationsUi,
  bindAppControls,
  bindNationSearchControl,
  renderNationDropdown as renderNationDropdownUi,
  renderScenarioOptions as renderScenarioOptionsUi,
  renderSearchResults,
  updateReachableCapitalsButton,
} from './ui/controls.js';

const appLoading = document.getElementById('appLoading');
const appLoadingDetail = document.getElementById('appLoadingDetail');

function dismissLoadingScreen() {
  if (!appLoading) return;
  window.requestAnimationFrame(() => {
    appLoading.dataset.loadingState = 'done';
    appLoading.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => appLoading.remove(), 240);
  });
}

function showLoadingFailure(message, error) {
  if (!appLoading) return false;
  appLoading.dataset.loadingState = 'error';
  appLoading.setAttribute('role', 'alert');
  appLoading.removeAttribute('aria-hidden');
  if (appLoadingDetail) {
    const suffix = error?.message ? ` ${error.message}` : '';
    appLoadingDetail.textContent = `${message}${suffix}`;
  }
  return true;
}

const tiDataPromise = window.TI_DATA_PROMISE || Promise.reject(new Error('Generated Terra Invicta map data promise is unavailable.'));

tiDataPromise.then((generatedData) => {
const appData = createAppData(generatedData || {});
function shouldEnableWorldWrap() {
  try {
    const value = new URLSearchParams(window.location.search).get('worldWrap');
    if (value === null) return false;
    return !['0', 'false', 'off'].includes(value.toLowerCase());
  } catch {
    return false;
  }
}
function createWorldCopyContexts(mapView, {enabled = false} = {}) {
  const canonical = defaultWorldCopyContext();
  const worldWidth = Number(mapView?.worldWidth) || 0;
  if (!enabled || !worldWidth) return [canonical];
  return [
    {copyIndex: -1, xOffset: -worldWidth, isCanonical: false},
    canonical,
    {copyIndex: 1, xOffset: worldWidth, isCanonical: false},
  ];
}
const appState = createAppState({activeScenarioId: appData.defaultScenario});
setActiveScenarioId(appState, appData.defaultScenario);
const mapVisualState = createMapVisualState();
let activeData = getActiveData(appData, appState.activeScenarioId);
const mapView = initializeMapView(activeData);
let worldWrapEnabled = shouldEnableWorldWrap();
let worldCopyContexts = createWorldCopyContexts(mapView, {enabled: worldWrapEnabled});
function copyContextRenderKey(copyContexts = worldCopyContexts) {
  return normalizeWorldCopyContexts(copyContexts)
    .map(context => `${context.copyIndex}:${context.xOffset}:${context.isCanonical ? 1 : 0}`)
    .join('|');
}
let scenarioRuntime = createScenarioRuntime(activeData);
let derivedIndices = scenarioRuntime.indices;
let REGIONS = scenarioRuntime.regions;
let SUMMARY = scenarioRuntime.summary;
let NATION_COLOR_PALETTE = scenarioRuntime.nationColorPalette;
let NATION_COLOR_INDEXES = scenarioRuntime.nationColorIndexes;
let CLAIMS_BY_NATION = scenarioRuntime.claimsByNation;
let PROJECT_META = scenarioRuntime.projectMeta;
let CLAIM_STATS = scenarioRuntime.claimStats;
let NATION_CATALOG = scenarioRuntime.nationCatalog;
let NATION_META = scenarioRuntime.nationMeta;

function syncRuntimeDataAliases() {
  derivedIndices = scenarioRuntime.indices;
  REGIONS = scenarioRuntime.regions;
  SUMMARY = scenarioRuntime.summary;
  NATION_COLOR_PALETTE = scenarioRuntime.nationColorPalette;
  NATION_COLOR_INDEXES = scenarioRuntime.nationColorIndexes;
  CLAIMS_BY_NATION = scenarioRuntime.claimsByNation;
  PROJECT_META = scenarioRuntime.projectMeta;
  CLAIM_STATS = scenarioRuntime.claimStats;
  NATION_CATALOG = scenarioRuntime.nationCatalog;
  NATION_META = scenarioRuntime.nationMeta;
  regionByName = scenarioRuntime.regionByName;
  nationRegions = scenarioRuntime.nationRegions;
  incomingClaimsByRegion = scenarioRuntime.incomingClaimsByRegion;
}

const svg = document.getElementById('map');
if (svg) svg.setAttribute('viewBox', formatViewBoxForMapView(mapView));
svg?.classList.toggle('world-wrap-enabled', worldWrapEnabled);
const debugRuntime = createDebugRuntime({
  location: window.location,
  storage: window.localStorage,
  mapView,
  initialMapView: mapView,
  getWorldWrapEnabled: () => worldWrapEnabled,
  getWorldCopyContextCount: () => worldCopyContexts.length,
});
const hostileClaimHatchingDisabled = debugRuntime.flags.hostileHatchingDisabled;
const debugLabelsDisabled = debugRuntime.flags.labelsDisabled;
const debugCanonicalHitPaths = debugRuntime.flags.canonicalHitPaths;
const debugRenderStats = debugRuntime.stats;
const recordRenderStat = debugRuntime.record;
const setRenderStat = debugRuntime.set;
const recordRenderTiming = debugRuntime.recordTiming;
const syncWorldWrapDebugStats = debugRuntime.syncWorldWrap;
const claimOverlayCommitDelayFrames = debugRuntime.flags.claimOverlayDelayFrames;
if (debugRenderStats) window.__TI_DEBUG_RENDER_STATS__ = debugRenderStats;
svg?.classList.toggle('hostile-hatch-disabled', hostileClaimHatchingDisabled);
const gRegions = document.getElementById('regions');
const gNormalRegionColors = document.getElementById('normalRegionColors');
const gHitRegions = document.getElementById('hitRegions');
const gLabels = document.getElementById('labels');
const gClaimLabels = document.getElementById('claimLabels');
const gGrid = document.getElementById('grid');
const gForeignHoverOverlays = document.getElementById('foreignHoverOverlays');
const gHoverClaimPreviewOverlays = document.getElementById('hoverClaimPreviewOverlays');
const gClaimOverlays = document.getElementById('claimOverlays');
const gManualEnvelopeOverlays = document.getElementById('manualEnvelopeOverlays');
const gSecondaryHoverOverlays = document.getElementById('secondaryHoverOverlays');
const gCapitalMarkers = document.getElementById('capitalMarkers');
const gHoverOutlines = document.getElementById('hoverOutlines');
const gSelectionOutlines = document.getElementById('selectionOutlines');
const gPinnedRegionMarkers = document.getElementById('pinnedRegionMarkers');
const gReachableCapitalCandidates = document.getElementById('reachableCapitalCandidates');
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
const tip = document.getElementById('tip');
const search = document.getElementById('search');
const nationDropdown = document.getElementById('nationDropdown');
const nationSearchCombo = document.getElementById('nationSearchCombo');
const scenarioSel = document.getElementById('scenarioSel');
const pinnedRegionsPanel = document.getElementById('pinnedRegionsPanel');
const reachableCandidatesPanel = document.getElementById('reachableCandidatesPanel');
const baseModeSel = document.getElementById('baseMode');
const claimModeSel = document.getElementById('claimMode');
const projectSel = document.getElementById('projectSel');
const claimKindSel = document.getElementById('claimKind');
const results = document.getElementById('results');
const nationInfo = document.getElementById('nationInfo');
const selectedPill = document.getElementById('selectedPill');
const languageSel = document.getElementById('languageSel');
const svgWrap = document.querySelector('.svgwrap');
const tooltipController = createTooltipController({window, svgWrap, tip});
const regionPathElements = [];
const hitPathElements = [];
const labelTextElements = [];

const i18n = createI18n({
  initialLanguage: readSavedLanguage() || languageSel?.value || document.documentElement.lang || 'en',
});
let currentLanguage = i18n.language;
const {
  t,
  dataLanguageKey,
  formatNumber,
  englishCount,
  regionCountText,
  uniqueRegionCountText,
  claimTierCountShortText,
  claimGroupCountText,
} = i18n;
const asideCards = createAsideCardController({document, t, updateMapViewControlsLabels});
const {
  infoSectionOpenAttribute,
  bindNationInfoSectionToggles,
  updateAsideCardControls,
  initAsideCards,
} = asideCards;

function renderScenarioOptions() {
  renderScenarioOptionsUi({
    select: scenarioSel,
    scenarioIds: getScenarioIds(appData),
    activeScenarioId: activeScenarioId(),
  });
}
function syncScenarioControls() {
  renderScenarioOptions();
}
function setHoverPill(region=null) {
  const el = document.getElementById('hoverPill');
  if (!el) return;
  el.textContent = region
    ? t('pill.hoverRegion', {nation: region.nationTag, region: localizedRegionName(region)})
    : t('pill.hoverEmpty');
}
function setClaimsPillEmpty() {
  const el = document.getElementById('claimPill');
  if (el) el.textContent = t('pill.claimsEmpty');
}
function updateReachableCapitalsButtonState() {
  updateReachableCapitalsButton({
    button: document.getElementById('reachableCapitalsBtn'),
    visible: getShowReachableCapitalCandidates(),
    t,
  });
}
function applyStaticTranslations() {
  applyStaticTranslationsUi({
    document,
    language: currentLanguage,
    title: t('document.title'),
    t,
    languageSelect: languageSel,
    onScenarioSync: syncScenarioControls,
    onMapViewControlsUpdate: updateMapViewControlsLabels,
    onReachableCapitalsUpdate: updateReachableCapitalsButtonState,
    onAsideCardsUpdate: updateAsideCardControls,
  });
}

let regionByName = derivedIndices.regionByName;
const pathByRegion = new Map();
const pathInstancesByRegion = new Map();
const normalRegionColorElements = [];
const hitPathByRegion = new Map();
const hitPathInstancesByRegion = new Map();
let nationRegions = derivedIndices.nationRegions;
let labelsVisible = false;
const selectedRegionIds = appState.selectedRegionIds;
let nationChoices = derivedIndices.nationChoices;
let nationDropdownOpen = false;
let highlightedNationChoiceIndex = -1;
let currentDropdownChoices = [];
let regionChoices = derivedIndices.regionChoices;
let pendingHoverNation = '';
let hoverPreviewFrame = 0;
let hoverClaimPreviewNation = '';
let visibleNationRegionNames = new Set();
let currentOverlayModel = null;
let activeClaimPreviewRegionScopeKey = '';
let activeClaimPreviewRegionScope = null;
let hoverClaimPreviewVisualKey = '';
let mapViewFrame = 0;
let pendingMapViewRenderContext = null;
let cachedRegionGeometryStats = {};
let searchCatalog = {
  nationChoices: [],
  nationChoiceByValue: new Map(),
  regionChoices: [],
};
let incomingClaimsByRegion = derivedIndices.incomingClaimsByRegion;
const regionCenterCache = new Map();
const OVERLAY_MODEL_CACHE_LIMIT = 256;
const OVERLAY_DESCRIPTOR_CACHE_LIMIT = 256;
const FOREIGN_HOVER_DESCRIPTOR_CACHE_LIMIT = 128;
const MANUAL_ENVELOPE_MODEL_CACHE_LIMIT = 128;
const REACHABLE_CAPITAL_CANDIDATE_DESCRIPTOR_CACHE_LIMIT = 128;
const EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE = Symbol('empty-manual-envelope-model');
const overlayModelCache = createLruCache({
  limit: OVERLAY_MODEL_CACHE_LIMIT,
  onHit: () => recordRenderStat('overlayModelCacheHits'),
});
const claimOverlayDescriptorCache = createLruCache({
  limit: OVERLAY_DESCRIPTOR_CACHE_LIMIT,
  onHit: () => recordRenderStat('claimOverlayDescriptorCacheHits'),
});
const claimLabelDescriptorCache = createLruCache({
  limit: OVERLAY_DESCRIPTOR_CACHE_LIMIT,
  onHit: () => recordRenderStat('claimLabelDescriptorCacheHits'),
});
const foreignHoverDescriptorCache = createLruCache({
  limit: FOREIGN_HOVER_DESCRIPTOR_CACHE_LIMIT,
  onHit: () => recordRenderStat('foreignHoverDescriptorCacheHits'),
});
const manualEnvelopeModelCache = createLruCache({
  limit: MANUAL_ENVELOPE_MODEL_CACHE_LIMIT,
  onHit: () => recordRenderStat('manualEnvelopeModelCacheHits'),
});
const reachableCapitalCandidateDescriptorCache = createLruCache({
  limit: REACHABLE_CAPITAL_CANDIDATE_DESCRIPTOR_CACHE_LIMIT,
  onHit: () => recordRenderStat('reachableCapitalCandidateDescriptorCacheHits'),
});
const HOVER_CLAIM_PREVIEW_EMPTY_RENDER_KEY = 'hover-claim-preview:empty';
const MAP_ZOOM_BUTTON_FACTOR = 1.25;
const MAP_WHEEL_ZOOM_FACTOR = 1.18;

function activeScenarioId() {
  return appState.activeScenarioId || appData.defaultScenario || '';
}

function resolveScenarioId(scenarioId = '') {
  const requested = String(scenarioId || appData.defaultScenario || '').trim();
  return appData.scenarios[requested] ? requested : appData.defaultScenario;
}

function availableRuntimeNationIds() {
  return [
    ...new Set([
      ...Object.keys(NATION_META || {}),
      ...Object.keys(CLAIMS_BY_NATION || {}),
      ...[...(nationRegions?.keys?.() || [])],
      ...REGIONS.map(region => region.nationTag).filter(Boolean),
    ]),
  ];
}

function activeIncomingClaimKeysForState() {
  const nation = getLockedNation() || getActiveNation();
  if (!nation || !CLAIMS_BY_NATION[nation]) return [];
  const data = CLAIMS_BY_NATION[nation];
  const baseSet = new Set(data.baseRegions || nationRegions.get(nation) || []);
  return incomingClaimsForTarget(nation, data, baseSet).map(incomingClaimKey);
}

function applyRuntimeScenarioData(scenarioId) {
  activeData = getActiveData(appData, scenarioId);
  scenarioRuntime = createScenarioRuntime(activeData);
  recordRenderStat('scenarioRuntimeBuilds');
  syncRuntimeDataAliases();
}

function clearScenarioSensitiveCaches() {
  regionCenterCache.clear();
  overlayModelCache.clear();
  claimOverlayDescriptorCache.clear();
  claimLabelDescriptorCache.clear();
  foreignHoverDescriptorCache.clear();
  manualEnvelopeModelCache.clear();
  reachableCapitalCandidateDescriptorCache.clear();
  activeClaimPreviewRegionScopeKey = '';
  activeClaimPreviewRegionScope = null;
}

function resetScenarioRenderKeys() {
  hoverClaimPreviewVisualKey = '';
  mapMarkerRenderer.reset();
}

function reconcileStateForActiveScenario() {
  reconcileScenarioState(appState, {
    regionIds: Object.keys(regionByName || {}),
    nationIds: availableRuntimeNationIds(),
    projectIds: Object.keys(PROJECT_META || {}),
    incomingClaimKeys: activeIncomingClaimKeysForState(),
  });
  syncSelectedVisualState();
  syncPinnedVisualState();
  if (search.dataset.selectedNation && !availableRuntimeNationIds().includes(search.dataset.selectedNation)) {
    search.dataset.selectedNation = '';
    search.value = '';
  }
  const selectedNation = search.dataset.selectedNation || '';
  if (selectedNation) search.value = humanizeNationLabel(selectedNation);
  if (projectSel && ![...projectSel.options].some(option => option.value === getProjectFilter())) projectSel.value = '';
  if (claimModeSel.value === 'project' && !getProjectFilter()) claimModeSel.value = 'all';
}

function resetTransientScenarioInteractionState() {
  cancelPendingHoverPreview();
  hideRegionTooltip();
  hoverClaimPreviewNation = '';
  pendingHoverNation = '';
  visibleNationRegionNames = new Set();
  setHoverVisualState();
  setHoverPill();
}

function prepareScenarioRuntime(scenarioId, {rebuildRuntime = true} = {}) {
  if (rebuildRuntime) applyRuntimeScenarioData(scenarioId);
  resetTransientScenarioInteractionState();
  clearScenarioSensitiveCaches();
  resetScenarioRenderKeys();
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
    refreshReachableCapitalCandidateOutputs: () => refreshReachableCapitalCandidateOutputs(currentOverlayModel),
    setHoverPill: () => setHoverPill(),
    setClaimsPillEmptyIfIdle: () => {
      if (!getLockedNation() && !getActiveNation()) setClaimsPillEmpty();
    },
  }));
}

function setActiveScenario(nextScenarioId, {force = false} = {}) {
  const scenarioId = resolveScenarioId(nextScenarioId);
  if (!scenarioId) return false;
  if (!force && scenarioId === activeScenarioId()) return false;
  setActiveScenarioId(appState, scenarioId);
  prepareScenarioRuntime(scenarioId);
  refreshScenarioView();
  syncScenarioControls();
  return true;
}

window.__TI_SCENARIO_API__ = {
  scenarios: getScenarioIds(appData),
  get activeScenario() { return activeScenarioId(); },
  setActiveScenario,
};

function setActiveNationState(nation = '') {
  setSelectedNation(appState, nation);
}

function setHoverNationState(nation = '') {
  setHoveredNation(appState, nation);
}

function setSecondaryHoverNationState(nation = '') {
  setSecondaryHoverNation(appState, nation);
}

function setLockedNationState(nation = '') {
  setLockedNation(appState, nation);
}

function setHoveredRegionState(regionName = '', nationId) {
  setHoveredRegion(appState, regionName, nationId);
}

function setFocusedRegionState(regionName = '') {
  setFocusedRegion(appState, regionName);
}

function changedRegionIds(previousRegionIds = [], nextRegionIds = []) {
  return [...new Set([...(previousRegionIds || []), ...(nextRegionIds || [])].filter(Boolean))];
}

function setSelectedRegionIds(regionIds = []) {
  const previous = [...selectedRegionIds];
  setSelectedRegions(appState, regionIds);
  syncSelectedVisualState();
  return changedRegionIds(previous, [...selectedRegionIds]);
}

function setPinnedRegionIds(regionIds = []) {
  const previous = [...getPinnedRegionIds()];
  setPinnedRegions(appState, regionIds);
  refreshPinnedRegionOutputs([...previous, ...getPinnedRegionIds()]);
}

function getPinnedCapitalClaimant(regionName = '') {
  return appState.pinnedCapitalClaimants?.get?.(regionName) || '';
}

function pinRegionState(regionName = '', options = {}) {
  if (!regionName) return;
  const wasPinned = getPinnedRegionIds().has(regionName);
  const previousClaimant = getPinnedCapitalClaimant(regionName);
  pinRegion(appState, regionName, options);
  const nextClaimant = getPinnedCapitalClaimant(regionName);
  if (wasPinned && previousClaimant === nextClaimant) return;
  refreshPinnedRegionOutputs([regionName]);
}

function unpinPinnedRegionState(regionName = '') {
  unpinPinnedRegion(appState, regionName);
  refreshPinnedRegionOutputs([regionName]);
}

function clearPinnedRegionState() {
  const previous = [...getPinnedRegionIds()];
  clearPinnedRegions(appState);
  refreshPinnedRegionOutputs(previous);
}

function toggleReachableCapitalCandidatesState() {
  toggleReachableCapitalCandidates(appState);
  updateReachableCapitalsButtonState();
  refreshReachableCapitalCandidateOutputs(currentOverlayModel);
}

function setProjectFilterState(projectId = '') {
  setClaimFilters(appState, {projectId});
}

function setActiveIncomingClaimKeyState(claimKey = '') {
  setActiveIncomingClaim(appState, claimKey);
}

function syncSelectedVisualState() {
  syncSelectedState(mapVisualState, selectedRegionIds);
}

function syncPinnedVisualState() {
  syncPinnedState(mapVisualState, getPinnedRegionIds());
}

function getActiveNation() { return appState.selectedNationId || ''; }
function getHoverNation() { return appState.hoveredNationId || ''; }
function getSecondaryHoverNation() { return appState.interaction?.secondaryHoverNationId || ''; }
function getLockedNation() { return appState.lockedNationId || ''; }
function getHoveredRegionName() { return appState.hoveredRegionId || ''; }
function getFocusedRegionName() { return appState.focusedRegionId || ''; }
function getPinnedRegionIds() { return appState.pinnedRegionIds || new Set(); }
function getShowReachableCapitalCandidates() { return !!appState.showReachableCapitalCandidates; }
function getProjectFilter() { return appState.filters.projectId || ''; }
function getActiveIncomingClaimKey() { return appState.activeIncomingClaimKey || ''; }

function setHoverVisualState(regionName = '') {
  setHoverState(mapVisualState, regionName);
}

function clearOverlayVisualState() {
  clearOverlayState(mapVisualState);
}

function setOverlayVisualState(model) {
  setOverlayState(mapVisualState, model, REGIONS);
}

function syncClaimPresentationState() {
  const committed = !!currentOverlayModel?.hasClaimOverlay;
  const preview = !!hoverClaimPreviewNation;
  svg?.classList?.toggle('claims-active', committed || preview);
}

function setHiddenVisualState(hiddenRegionIds) {
  setHiddenState(mapVisualState, hiddenRegionIds);
}

function applyMapVisualState(renderContext = {}, state = mapVisualState) {
  const context = {
    svg,
    pathByRegion,
    pathInstancesByRegion,
    regionPathElements,
    hitPathByRegion,
    hitPathInstancesByRegion,
    hitPathElements,
    ...renderContext,
  };
  recordRenderStat('fullVisualStateApplications');
  recordRenderStat('visiblePathsTouched', (context.regionPathElements || []).length);
  recordRenderStat('hitPathsTouched', (context.hitPathElements || []).length || (context.hitPathByRegion || new Map()).size);
  applyVisualState(context, state);
  syncClaimPresentationState();
}

function applyMapVisualStateForRegions(regionIds, renderContext = {}, state = mapVisualState) {
  const context = {
    svg,
    pathByRegion,
    pathInstancesByRegion,
    regionPathElements,
    hitPathByRegion,
    hitPathInstancesByRegion,
    hitPathElements,
    ...renderContext,
  };
  const result = applyVisualStateForRegions(context, state, regionIds);
  recordRenderStat('boundedVisualStateApplications');
  recordRenderStat('visiblePathsTouched', result.visiblePathsTouched);
  recordRenderStat('hitPathsTouched', result.hitPathsTouched);
  syncClaimPresentationState();
  return result;
}

const CLAIM_GRADIENT_START_HUE = 155;
const CLAIM_GRADIENT_END_HUE = 290;
const CLAIM_GRADIENT_STEPS = 6; // initial territory + no-research + 5 research tiers.
const claimGradientHue = step => CLAIM_GRADIENT_START_HUE + (CLAIM_GRADIENT_END_HUE - CLAIM_GRADIENT_START_HUE) * (step / CLAIM_GRADIENT_STEPS);
const claimGradientColor = (step, lightness, chroma) => `oklch(${lightness} ${chroma} ${claimGradientHue(step)})`;
const BASE_TERRITORY_COLOR = claimGradientColor(0, 0.78, 0.11);
const MUTED_NON_CLAIM_COLOR = 'oklch(0.32 0.026 260)';
const CLAIM_TIER_COLORS = [
  claimGradientColor(1, 0.73, 0.14), // no-research claim
  claimGradientColor(2, 0.68, 0.16), // research tier 1
  claimGradientColor(3, 0.63, 0.18), // research tier 2
  claimGradientColor(4, 0.58, 0.20), // research tier 3
  claimGradientColor(5, 0.53, 0.21), // research tier 4
  claimGradientColor(6, 0.49, 0.22), // research tier 5+
];
// Reuse the same hue as the single-region hover fill, then fade it by tier.
// The final hidden step is no overlay at all, which returns to the muted non-hover map.
const HOVER_NATION_BASE_TERRITORY_OPACITY = 0.18;
const HOVER_NATION_TIER_OPACITIES = [
  0.145, // no-research claim
  0.120, // research tier 1
  0.095, // research tier 2
  0.070, // research tier 3
  0.050, // research tier 4
  0.032, // research tier 5+
];
function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function projectDisplay(p) {
  if (!p) return t('project.baseClaimNoResearch');
  const meta = PROJECT_META[p] || {};
  return meta.displayName?.[dataLanguageKey()] || meta.displayName?.en || meta.displayName?.kor || meta.friendlyName || meta.label || p.replace('Project_','');
}
function projectSummary(p) {
  if (!p) return '';
  const summary = PROJECT_META[p]?.summary;
  if (!summary || typeof summary !== 'object') return '';
  return summary[dataLanguageKey()] || summary.en || summary.kor || Object.values(summary).find(Boolean) || '';
}
function prettyRegion(s) { return String(s || '').replace(/([a-z])([A-Z])/g,'$1 $2'); }
function localizedRegionName(regionOrName) {
  const region = typeof regionOrName === 'string' ? regionByName[regionOrName] : regionOrName;
  if (!region) return prettyRegion(regionOrName);
  return localizedDisplayName(region.displayName) || region.primaryCity || prettyRegion(region.regionName);
}
function hashHue(s) { let h=0; for (let i=0;i<String(s).length;i++) h=(h*31+String(s).charCodeAt(i))>>>0; return h%360; }
function colorFor(r) {
  const mode = baseModeSel.value;
  if (mode === 'plain') return 'hsl(215 45% 39%)';
  if (mode === 'points') { const t=Math.min(1, Math.log10(r.points+1)/3); return `hsl(${220-170*t} 58% ${34+22*t}%)`; }
  const colorIndex = NATION_COLOR_INDEXES[r.nationTag];
  if (NATION_COLOR_PALETTE.length && Number.isInteger(colorIndex)) {
    return NATION_COLOR_PALETTE[colorIndex % NATION_COLOR_PALETTE.length];
  }
  return `hsl(${hashHue(r.nationTag || r.regionName)} 50% 43%)`;
}
function projectColor(project, i=0) {
  const tier = project ? i + 1 : 0;
  return CLAIM_TIER_COLORS[Math.min(Math.max(tier, 0), CLAIM_TIER_COLORS.length - 1)];
}
function hoverNationProjectOpacity(project, i=0) {
  const tier = project ? i + 1 : 0;
  return HOVER_NATION_TIER_OPACITIES[Math.min(Math.max(tier, 0), HOVER_NATION_TIER_OPACITIES.length - 1)];
}
function statusLabel(status) {
  if (status === 'breakaway_gated_existing') return t('status.breakaway_gated_existing');
  if (status === 'formable') return t('status.formable');
  return t('status.existing');
}
function statusBadge(status) {
  return `<span class="status ${escapeHtml(status || 'existing')}">${escapeHtml(statusLabel(status))}</span>`;
}
const claimModel = createClaimModel({
  claimsByNation: () => CLAIMS_BY_NATION,
  nationRegions: () => nationRegions,
  projectMeta: () => PROJECT_META,
  claimMode: () => claimModeSel.value,
  claimKind: () => claimKindSel.value,
  projectFilter: () => getProjectFilter(),
  activeIncomingClaimKey: () => getActiveIncomingClaimKey(),
  selectedRegionIds: () => selectedRegionIds,
  incomingClaimsByRegion: () => incomingClaimsByRegion,
  capitalNationsByRegion: () => derivedIndices.capitalNationsByRegion,
  regionExists: regionName => !!regionByName[regionName],
  isCapitalRegionForNation: (nation, regionName) => isCapitalRegionForNation(nation, regionName),
  projectLabel: project => projectDisplay(project),
  sourceLabels: {
    inheritedFrom: project => t('source.inheritedFrom', {project}),
    basicClaim: () => t('source.basicClaim'),
    direct: () => t('source.direct'),
  },
});
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
function labelPosition(r) {
  if (r.labels && r.labels[0]) return r.labels[0];
  return regionPathCenter(r);
}
function regionPathCenter(r) {
  if (!r?.regionName || !r?.path) return null;
  if (regionCenterCache.has(r.regionName)) return regionCenterCache.get(r.regionName);
  const values = String(r.path).match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) || [];
  const points = [];
  for (let i = 0; i + 1 < values.length; i += 2) {
    const x = values[i];
    const y = values[i + 1];
    if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]);
  }
  if (!points.length) {
    regionCenterCache.set(r.regionName, null);
    return null;
  }
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const center = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
  regionCenterCache.set(r.regionName, center);
  return center;
}
function capitalRegionNames(data) {
  return [...new Set(data?.capitalRegions || [])].filter(rn => regionByName[rn]);
}
function capitalRegionNamesForNation(nation) {
  return capitalRegionNames(CLAIMS_BY_NATION[nation] || null);
}
function capitalRegionsText(data) {
  const names = capitalRegionNames(data).map(rn => localizedRegionName(regionByName[rn] || rn));
  return names.length ? names.join(', ') : '-';
}
function isCapitalRegionForNation(nation, regionName) {
  return !!nation && !!regionName && capitalRegionNamesForNation(nation).includes(regionName);
}
function selectedRegionIsCapital(regionName) {
  if (isCapitalRegionForNation(getActiveNation(), regionName)) return true;
  const owner = regionByName[regionName]?.nationTag || '';
  return isCapitalRegionForNation(owner, regionName);
}
function addCapitalMarkerNation(markers, nation, {selected=false} = {}) {
  if (!nation) return;
  for (const rn of capitalRegionNamesForNation(nation)) {
    const existing = markers.get(rn);
    markers.set(rn, {
      regionName: rn,
      nation,
      selected: !!(selected || existing?.selected),
    });
  }
}
function isPinnedCapitalRegionForNation(nation) {
  if (!nation) return false;
  return [...getPinnedRegionIds()].some(rn => isCapitalRegionForNation(nation, rn));
}
function isActiveCapitalMarkerSelected(nation) {
  return [...selectedRegionIds].some(rn => isCapitalRegionForNation(nation, rn))
    || isCapitalRegionForNation(nation, getHoveredRegionName())
    || isPinnedCapitalRegionForNation(nation);
}
function shouldSuppressHoveredOwnerCapitalMarker(region) {
  const claimant = resolveSecondaryCapitalPreviewNation(region);
  return !!claimant && claimant !== region?.nationTag;
}
function collectCapitalMarkers() {
  const markers = new Map();
  const pinnedNation = getLockedNation() || getActiveNation();
  if (pinnedNation) {
    addCapitalMarkerNation(markers, pinnedNation, {selected:isActiveCapitalMarkerSelected(pinnedNation)});
  }

  for (const rn of selectedRegionIds) {
    const owner = regionByName[rn]?.nationTag || '';
    if (isCapitalRegionForNation(owner, rn)) addCapitalMarkerNation(markers, owner, {selected:true});
  }

  const hovered = getHoveredRegionName() ? regionByName[getHoveredRegionName()] : null;
  if (hovered) {
    if (getActiveNation() && visibleNationRegionNames.has(hovered.regionName)) {
      addCapitalMarkerNation(markers, getActiveNation(), {selected:isActiveCapitalMarkerSelected(getActiveNation())});
    }
    if (!shouldSuppressHoveredOwnerCapitalMarker(hovered)) {
      addCapitalMarkerNation(markers, hovered.nationTag, {selected:isCapitalRegionForNation(hovered.nationTag, hovered.regionName)});
    }
  }

  if (!markers.size) addCapitalMarkerNation(markers, getHoverNation());
  return [...markers.values()];
}
function renderCapitalMarkers({force=false, copyContexts=worldCopyContexts} = {}) {
  const markers = collectCapitalMarkers()
    .sort((a, b) => a.regionName.localeCompare(b.regionName) || a.nation.localeCompare(b.nation));
  mapMarkerRenderer.render({
    kind: 'capital',
    markers,
    regionByName,
    copyContexts,
    language: currentLanguage,
    force,
    labelPosition,
    localizedRegionName,
    t,
    recordRenderStat,
  });
}

function localizedDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'object') return '';
  return displayName[dataLanguageKey()] || displayName.en || displayName.kor || Object.values(displayName).find(Boolean) || '';
}
function nationDisplayName(tag) {
  const meta = NATION_META[tag] || {};
  return localizedDisplayName(meta.displayName) || meta.friendlyName || meta.label || meta.name || tag;
}
function nationEffectiveDisplayName(tag) {
  const meta = NATION_META[tag] || {};
  return localizedDisplayName(meta.unionDisplayName) || nationDisplayName(tag);
}
function humanizeNationLabel(tag) {
  const displayName = nationDisplayName(tag);
  return `${displayName} / ${claimTierCountShortText(nationClaimTierCount(tag))}`;
}
function claimCardResearchLabel(entry, nation, {compact=false} = {}) {
  if (!entry?.project) return t(compact ? 'claimCard.researchBaselineValue' : 'claimCard.researchBaseline');
  const d = CLAIMS_BY_NATION[nation] || {};
  const baseSet = new Set(d.baseRegions || nationRegions.get(nation) || []);
  const tierByProject = countryProjectTierMap(nation, baseSet);
  const tier = countryProjectTier(entry, tierByProject) + 1;
  return t(compact ? 'claimCard.researchTierValue' : 'claimCard.researchTier', {tier});
}
function claimCardTitleParts(entry, kind) {
  const nation = kind === 'incoming' ? (entry.claimant || '') : getActiveNation();
  const nationName = entry?.project ? nationEffectiveDisplayName(nation) : nationDisplayName(nation);
  return {
    tag: nation || '-',
    nation: nationName || nation || '-',
    project: entry.project ? projectDisplay(entry.project) : t('claimCard.projectBaseline'),
    research: claimCardResearchLabel(entry, nation, {compact: true}),
  };
}
function claimIsEffectivelyHostile(claim) {
  return !!(claim?.effectiveHostile ?? claim?.hostileClaim);
}
function claimCardTitle(entry, kind) {
  return t('claimCard.title', claimCardTitleParts(entry, kind));
}
function renderClaimCardTitle(entry, kind) {
  const parts = claimCardTitleParts(entry, kind);
  const flavorText = projectSummary(entry?.project);
  const fields = [
    ['nation', t('claimCard.fieldNation'), parts.nation],
    ['research', t('claimCard.fieldResearch'), parts.research],
    ['project', t('claimCard.fieldProject'), parts.project],
  ];
  return `<div class="claimCardTitle">${fields.map(([key, label, value]) => {
    const quoteHtml = key === 'project' && flavorText
      ? `<q class="claimCardQuote">${escapeHtml(flavorText)}</q>`
      : '';
    return `<span class="claimCardTitleField claimCardTitleField--${key}"><span class="claimCardTitleLabel">${escapeHtml(label)}</span><b class="claimCardTitleValue">${escapeHtml(value)}</b>${quoteHtml}</span>`;
  }).join('')}</div>`;
}
function rebuildSearchCatalog() {
  searchCatalog = buildSearchCatalog({
    regions: REGIONS,
    claimsByNation: CLAIMS_BY_NATION,
    nationMeta: NATION_META,
    projectMeta: PROJECT_META,
    nationLabel: humanizeNationLabel,
    localizedRegionName,
    prettyRegionName: prettyRegion,
  });
  derivedIndices.nationChoices = searchCatalog.nationChoices;
  derivedIndices.regionChoices = searchCatalog.regionChoices;
  nationChoices = searchCatalog.nationChoices;
  regionChoices = searchCatalog.regionChoices;
  recordRenderStat('searchCatalogBuilds');
}
function parseNationSearchValue(value) {
  return parseNationSearchCatalogValue(searchCatalog, value);
}
function isSelectedNationSearch() {
  const tag = search.dataset.selectedNation || '';
  return !!tag && parseNationSearchValue(search.value) === tag;
}
function searchFilterText() {
  return isSelectedNationSearch() ? '' : search.value.trim().toLowerCase();
}

function matchingNationChoices(q, limit) {
  return filterSearchCatalog(searchCatalog, q, {nationLimit: limit, regionLimit: 0}).nationMatches;
}

function visibleNationChoices() {
  const q = search.value.trim().toLowerCase();
  if (!q) return nationChoices.slice(0, 28).map(c => ({...c, type:'nation'}));
  const {nationMatches, regionMatches} = filterSearchCatalog(searchCatalog, q, {
    nationLimit: 12,
    regionLimit: 16,
  });
  return [...nationMatches.map(choice => ({...choice, type: 'nation'})), ...regionMatches].slice(0, 28);
}
function renderNationDropdown() {
  currentDropdownChoices = visibleNationChoices();
  highlightedNationChoiceIndex = renderNationDropdownUi({
    dropdown: nationDropdown,
    search,
    open: nationDropdownOpen,
    choices: currentDropdownChoices,
    highlightedIndex: highlightedNationChoiceIndex,
    selectedRegionIds,
    t,
  });
}
function openNationDropdown() {
  nationDropdownOpen = true;
  renderNationDropdown();
}
function closeNationDropdown() {
  nationDropdownOpen = false;
  highlightedNationChoiceIndex = -1;
  renderNationDropdown();
}
function chooseNationFromDropdown(index=highlightedNationChoiceIndex) {
  const choice = currentDropdownChoices[index];
  if (!choice) return false;
  if (choice.type === 'region') {
    selectRegion(REGIONS[choice.id]);
  } else {
    focusNation(choice.tag);
  }
  closeNationDropdown();
  search.focus();
  return true;
}
function resetTransientClaimState() {
  clearTransientClaimAppState(appState);
  setSecondaryHoverNationState();
  setProjectFilterState('');
  setActiveIncomingClaimKeyState('');
  projectSel.value = '';
  if (claimModeSel.value === 'project') claimModeSel.value = 'all';
}
function resetHoverPreviewClaimState() {
  clearTransientClaimAppState(appState);
  setSecondaryHoverNationState();
  setProjectFilterState('');
  setActiveIncomingClaimKeyState('');
}
function shouldRenderCommittedNationDetails() {
  return !!getLockedNation();
}
function clearHoverClaimPreviewOverlay({force=false} = {}) {
  hoverClaimPreviewNation = '';
  replaceHoverClaimPreviewOverlayForKey(
    HOVER_CLAIM_PREVIEW_EMPTY_RENDER_KEY,
    () => document.createDocumentFragment(),
    {force}
  );
  syncClaimPresentationState();
}
function updateHoverNationPreview(nation) {
  if (getLockedNation()) return;
  const previewNation = nation || '';
  setActiveNationState('');
  hoverClaimPreviewNation = previewNation;
  if (!previewNation) {
    visibleNationRegionNames = new Set();
    clearHoverClaimPreviewOverlay({force: true});
    setClaimsPillEmpty();
    renderHoverOutlines();
    renderCapitalMarkers();
    return;
  }
  const overlayModel = getNationOverlayModel(activeData, derivedIndices, previewNation, {cacheKey: 'hover-preview'});
  visibleNationRegionNames = new Set(overlayModel.resultSet);
  const overlayDescriptorSet = getClaimOverlayDescriptorSet(overlayModel);
  replaceHoverClaimPreviewOverlayForKey(
    hoverClaimPreviewRenderKey(overlayModel, overlayDescriptorSet, worldCopyContexts),
    () => markHoverClaimPreviewFragment(claimOverlayRenderer.createOverlayFragment({
      descriptors: overlayDescriptorSet.descriptors,
      copyContexts: worldCopyContexts,
      regionByName,
      hostileHatchingDisabled: hostileClaimHatchingDisabled,
      includeOutlines: true,
    }))
  );
  syncClaimPresentationState();
  renderClaimSummaryPill(overlayModel);
  renderHoverOutlines();
  renderCapitalMarkers();
}
function cancelPendingHoverPreview() {
  if (hoverPreviewFrame) {
    window.cancelAnimationFrame(hoverPreviewFrame);
    hoverPreviewFrame = 0;
  }
  pendingHoverNation = '';
}
function setHoverPreviewNation(nation) {
  if (getLockedNation()) return;
  const nextNation = nation || '';
  if (hoverClaimPreviewNation === nextNation && !getActiveNation()) return;
  setHoverNationState(nextNation);
  resetHoverPreviewClaimState();
  updateHoverNationPreview(getHoverNation());
}
function scheduleHoverPreviewNation(nation) {
  if (getLockedNation()) return;
  const nextNation = nation || '';
  if (hoverClaimPreviewNation === nextNation && !getActiveNation()) return;
  pendingHoverNation = nextNation;
  if (hoverPreviewFrame) return;
  hoverPreviewFrame = window.requestAnimationFrame(() => {
    hoverPreviewFrame = 0;
    const next = pendingHoverNation;
    pendingHoverNation = '';
    if (!getLockedNation() && next) setHoverPreviewNation(next);
  });
}
function clearHoverPreview() {
  cancelPendingHoverPreview();
  hideRegionTooltip();
  const previousRegionName = getHoveredRegionName();
  const useHoverDelta = canUseSimpleHoverClearDelta(previousRegionName);
  setHoverPill();
  setHoveredRegionState();
  setHoverVisualState();
  setSecondaryHoverNationState();
  if (useHoverDelta) applyMapVisualStateForRegions([previousRegionName]);
  else applyMapVisualState();
  renderHoverOutlines();
  syncReachableCapitalCandidateHoverState();
  if (getLockedNation()) {
    setHoverNationState();
    renderCapitalMarkers();
    return;
  }
  if (!getHoverNation() && !getActiveNation()) return;
  setHoverNationState();
  resetHoverPreviewClaimState();
  updateHoverNationPreview('');
}
function buildIncomingClaimIndex() {
  recordRenderStat('incomingClaimIndexBuilds');
  const nextIndex = claimModel.buildIncomingClaimIndex();
  incomingClaimsByRegion.clear();
  for (const [regionName, entries] of nextIndex) incomingClaimsByRegion.set(regionName, entries);
}
function selectedRegionSummary() {
  const names = [...selectedRegionIds].filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) {
    const rn = names[0];
    const r = regionByName[rn];
    return t('selected.region', {region: localizedRegionName(r || rn), nation: r?.nationTag ? ' · '+r.nationTag : ''});
  }
  return t('selected.regions', {count: names.length});
}
function pinnedCapitalClaimants(regionName) {
  return [...new Set(derivedIndices.capitalNationsByRegion?.get?.(regionName) || [])].filter(Boolean);
}
function pinnedExpansionClaimants(regionName) {
  const claimants = pinnedCapitalClaimants(regionName);
  const preferredClaimant = getPinnedCapitalClaimant(regionName);
  if (preferredClaimant && claimants.includes(preferredClaimant)) return [preferredClaimant];
  return claimants;
}
function pinnedRegionCapitalSummary(regionName) {
  const claimants = pinnedExpansionClaimants(regionName);
  if (!claimants.length) return t('expansionNodes.noCapitalClaimant');
  const names = claimants.map(nation => nationDisplayName(nation));
  if (claimants.length === 1) return t('expansionNodes.capitalClaimant', {nation: names[0]});
  return t('expansionNodes.capitalClaimants', {
    count: formatNumber(claimants.length),
    nations: names.slice(0, 3).join(', ') + (names.length > 3 ? `, +${names.length - 3}` : ''),
  });
}
function pinnedRegionOwnerSummary(region) {
  return region?.nationTag ? t('expansionNodes.owner', {nation: nationDisplayName(region.nationTag)}) : '';
}
function focusPinnedRegion(regionName) {
  const region = regionByName[regionName];
  if (!region) return;
  if (getLockedNation() || getActiveNation()) {
    focusRegions([regionName], {selectSingle: true, preserveNation: true, refreshOverlay: true});
    return;
  }
  selectRegion(region);
}
function renderPinnedRegionsPanel() {
  renderPinnedRegionsPanelUi({
    root: pinnedRegionsPanel,
    pinnedRegionIds: getPinnedRegionIds(),
    regionByName,
    localizedRegionName,
    ownerSummary: pinnedRegionOwnerSummary,
    capitalSummary: pinnedRegionCapitalSummary,
    t,
    formatNumber,
    onFocus: focusPinnedRegion,
    onUnpin: unpinPinnedRegionState,
    onClear: clearPinnedRegionState,
  });
}
function refreshPinnedRegionOutputs(changedRegionIds = []) {
  const changed = [...new Set((changedRegionIds || []).filter(Boolean))];
  syncPinnedVisualState();
  if (changed.length) applyMapVisualStateForRegions(changed);
  else applyMapVisualState();
  renderPinnedRegionsPanel();
  renderPinnedRegionMarkers();
  renderManualEnvelopeOverlay(currentOverlayModel);
  refreshReachableCapitalCandidateOutputs(currentOverlayModel);
}
function renderPinnedRegionMarkers({copyContexts=worldCopyContexts} = {}) {
  const pinned = [...getPinnedRegionIds()].filter(regionName => regionByName[regionName]);
  const selectedPinnedRegions = pinned.filter(regionName => selectedRegionIds.has(regionName));
  mapMarkerRenderer.render({
    kind: 'pinned',
    pinned,
    selectedPinnedRegions,
    copyContexts,
    language: currentLanguage,
    regionByName,
    isPinnedCapital: regionName => pinnedExpansionClaimants(regionName).length > 0,
    labelPosition,
    localizedRegionName,
    t,
    formatNumber,
    recordRenderStat,
  });
}
function shouldShowForeignHoverNationOverlay(region) {
  if (!region?.nationTag) return false;
  const pinnedNation = getLockedNation() || getActiveNation();
  if (!pinnedNation) return false;
  const scope = buildActiveExpansionScope(currentOverlayModel);
  if (scope.regionSet?.has?.(region.regionName)) return false;
  return region.nationTag !== pinnedNation;
}
function resolveSecondaryCapitalPreviewNation(region) {
  const selectedNation = getLockedNation() || getActiveNation();
  if (!selectedNation || !region?.regionName || !currentOverlayModel?.hasClaimOverlay) return '';
  return resolveCapitalClaimantForRegion(region.regionName, buildActiveExpansionScope(currentOverlayModel));
}
function updateSecondaryCapitalPreview(region) {
  const nextNation = resolveSecondaryCapitalPreviewNation(region);
  if (getSecondaryHoverNation() === nextNation) return false;
  setSecondaryHoverNationState(nextNation);
  return true;
}
function refreshSecondaryCapitalPreviewForHoveredRegion() {
  const regionName = getHoveredRegionName();
  return updateSecondaryCapitalPreview(regionName ? regionByName[regionName] : null);
}
function queueForeignHoverDescriptor(candidates, region, className, attrs={}) {
  if (!region?.path) return;
  const fillOpacity = attrs.fillOpacity ?? HOVER_NATION_BASE_TERRITORY_OPACITY;
  const existing = candidates.get(region.regionName);
  if (existing && existing.fillOpacity >= fillOpacity) return;
  candidates.set(region.regionName, {
    region: region.regionName,
    className,
    attrs: {...attrs, fillOpacity},
    fillOpacity,
  });
}
function foreignHoverDescriptorCacheKey(nation) {
  return JSON.stringify({
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, derivedIndices),
    nation: nation || '',
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
  });
}
function buildForeignHoverOverlayDescriptorSet(nation, cacheKey) {
  recordRenderStat('foreignHoverDescriptorBuilds');
  if (!nation || claimModeSel.value === 'off') return {cacheKey, descriptors: []};
  const data = CLAIMS_BY_NATION[nation] || {nation, baseRegions:nationRegions.get(nation)||[], projects:[]};
  const baseSet = new Set(data.baseRegions || nationRegions.get(nation) || []);
  const tierByProject = countryProjectTierMap(nation, baseSet);
  const candidates = new Map();
  for (const rn of baseSet) {
    queueForeignHoverDescriptor(
      candidates,
      regionByName[rn],
      'foreign-hover-overlay foreign-hover-base',
      {nation, tier:'base', fillOpacity:HOVER_NATION_BASE_TERRITORY_OPACITY}
    );
  }
  for (const entry of getClaimKindFilteredProjectEntries(nation)) {
    const visibleClaimRegions = (entry.regions || []).filter(rn => !baseSet.has(rn));
    if (!visibleClaimRegions.length) continue;
    const tier = countryProjectTier(entry, tierByProject);
    const fillOpacity = hoverNationProjectOpacity(entry.project, tier);
    const tierLabel = entry.project ? String(tier + 1) : 'basic';
    for (const rn of visibleClaimRegions) {
      queueForeignHoverDescriptor(
        candidates,
        regionByName[rn],
        `foreign-hover-overlay ${entry.project ? 'foreign-hover-research' : 'foreign-hover-basic'}`,
        {nation, tier:tierLabel, project:entry.project || 'base', fillOpacity}
      );
    }
  }
  return {
    cacheKey,
    descriptors: [...candidates.values()],
  };
}
function getForeignHoverOverlayDescriptorSet(nation) {
  const cacheKey = foreignHoverDescriptorCacheKey(nation);
  const cached = foreignHoverDescriptorCache.get(cacheKey);
  if (cached) return cached;
  return foreignHoverDescriptorCache.set(cacheKey, buildForeignHoverOverlayDescriptorSet(nation, cacheKey));
}
function hoverClaimPreviewRenderKey(model, descriptorSet, copyContexts = worldCopyContexts) {
  if (!model) return HOVER_CLAIM_PREVIEW_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'hover-claim-preview',
    copyPlan: copyContextRenderKey(copyContexts),
    descriptorKey: descriptorSet?.cacheKey || '',
  });
}
function markHoverClaimPreviewFragment(fragment, nation = hoverClaimPreviewNation) {
  for (const el of fragment.querySelectorAll?.('.claim-overlay, .claim-fill-group') || []) {
    el.dataset.preview = 'hover-claim';
    if (nation) el.dataset.nation = nation;
  }
  return fragment;
}
function replaceHoverClaimPreviewOverlayForKey(nextKey, buildChildren, {force=false} = {}) {
  if (!gHoverClaimPreviewOverlays) return;
  if (!force && nextKey === hoverClaimPreviewVisualKey) return;
  hoverClaimPreviewVisualKey = nextKey;
  recordRenderStat('hoverClaimPreviewOverlayReplacements');
  replaceLayerChildren(gHoverClaimPreviewOverlays, buildChildren());
}
function renderHoverOutlines({force=false, copyContexts=worldCopyContexts} = {}) {
  const rn = getHoveredRegionName();
  const r = rn ? regionByName[rn] : null;
  const hidden = !rn || selectedRegionIds.has(rn) || !r;
  const secondaryNation = getSecondaryHoverNation();
  const secondary = !hidden && !!secondaryNation;
  const foreign = !hidden && !secondary && shouldShowForeignHoverNationOverlay(r);
  const foreignDescriptorSet = foreign ? getForeignHoverOverlayDescriptorSet(r.nationTag) : null;
  const secondaryDescriptorSet = secondary ? getForeignHoverOverlayDescriptorSet(secondaryNation) : null;
  mapMarkerRenderer.render({
    kind: 'hover',
    region: r,
    hidden,
    foreign,
    secondary,
    foreignDescriptorSet,
    secondaryDescriptorSet,
    copyContexts,
    regionByName,
    activeNationId: getLockedNation() || getActiveNation(),
    visibleNationRegion: visibleNationRegionNames.has(rn),
    force,
    debugRenderStats,
    recordRenderStat,
    setRenderStat,
  });
}
function renderSelectionOutlines({copyContexts=worldCopyContexts} = {}) {
  mapMarkerRenderer.render({
    kind: 'selection',
    selectedRegionNames: [...selectedRegionIds],
    regionByName,
    copyContexts,
    isSelectedCapital: selectedRegionIsCapital,
    labelPosition,
    localizedRegionName,
  });
}
function updateSelectedRegions({bounded = false, changedRegionIds: changed = []} = {}) {
  syncSelectedVisualState();
  if (bounded && changed.length) applyMapVisualStateForRegions(changed);
  else applyMapVisualState();
  renderHoverOutlines();
  renderSelectionOutlines();
  renderPinnedRegionMarkers();
  renderCapitalMarkers();
  const label = selectedRegionSummary();
  if (selectedPill) {
    selectedPill.textContent = label;
    selectedPill.style.display = label ? '' : 'none';
  }
}
function claimRegionSummary(claim) {
  if (!claim || !Object.keys(claim).length) return '';
  const parts = [];
  parts.push(claimIsEffectivelyHostile(claim) ? t('claim.hostile') : t('claim.peaceful'));
  if (claim?.capitalClaim) parts.push(t('claim.capital'));
  if (claim?.gatedClaim) parts.push(t('claim.gated'));
  return parts.join(' · ');
}
function renderRegionList(regionNames, claims={}, prefix='targets', regionSourceLabels={}) {
  const rows = (regionNames || []).map((rn) => {
    const claim = claims?.[rn] || {};
    const meta = claimRegionSummary(claim);
    const source = regionSourceLabels?.[rn] ? regionSourceLabels[rn] : '';
    const region = regionByName[rn];
    const owner = region?.nationTag ? ` · ${region.nationTag}` : '';
    const active = selectedRegionIds.has(rn);
    const detail = t('regionList.detail', {
      prefix: t(`regionPrefix.${prefix}`) || prefix,
      owner,
      meta: meta ? ` · ${meta}` : '',
      source: source ? ` · ${source}` : '',
    });
    return `<div class="legendRegionRow"><button type="button" class="legendRegionItem${active ? ' active' : ''}" data-region-name="${escapeHtml(rn)}"><b>${escapeHtml(localizedRegionName(region || rn))}</b><span>${escapeHtml(detail)}</span></button></div>`;
  }).join('');
  return `<div class="legendRegionList">${rows}</div>`;
}
function focusRegions(regionNames, {selectSingle=false, preserveNation=false, refreshOverlay=false} = {}) {
  const names = (regionNames || []).filter(Boolean);
  if (selectSingle && names.length === 1) {
    const region = regionByName[names[0]];
    if (region) {
      if (preserveNation && getActiveNation()) {
        setSelectedRegionIds([region.regionName]);
        setFocusedRegionState(region.regionName);
        updateSelectedRegions();
        // TODO: Future mapView pan/zoom support should keep this focused region visible.
        if (refreshOverlay) updateNationOverlay(getActiveNation());
        return;
      }
      selectRegion(region);
      return;
    }
  }
  setSelectedRegionIds(names);
  setFocusedRegionState(names.length === 1 ? names[0] : '');
  // TODO: Future mapView pan/zoom support should keep these focused regions visible.
  updateSelectedRegions();
  if (refreshOverlay && getActiveNation()) updateNationOverlay(getActiveNation());
}
function clearSelection({clearSearch=true} = {}) {
  const clearedPins = [...getPinnedRegionIds()];
  clearSelectionState(appState);
  updateReachableCapitalsButtonState();
  setActiveNationState();
  setHoverNationState();
  setSecondaryHoverNationState();
  setHoveredRegionState();
  setFocusedRegionState();
  setHoverVisualState();
  setLockedNationState();
  setSelectedRegionIds();
  setProjectFilterState('');
  setActiveIncomingClaimKeyState('');
  projectSel.value = '';
  claimModeSel.value = 'all';
  cancelPendingHoverPreview();
  hideRegionTooltip();
  if (clearSearch) {
    search.value = '';
    search.dataset.selectedNation = '';
  }
  setHoverPill();
  updateNationOverlay('', {renderDetails: true, updateFilters: false, updateSelected: false});
  applyFilters(true);
  updateSelectedRegions();
  refreshPinnedRegionOutputs(clearedPins);
}
function clearPinsOrSelection() {
  clearSelection();
}
function unpinClickedPinnedRegion(region) {
  const regionName = region?.regionName || '';
  if (!regionName || !getPinnedRegionIds().has(regionName)) return false;
  unpinPinnedRegionState(regionName);
  refreshSecondaryCapitalPreviewForHoveredRegion();
  renderHoverOutlines();
  renderCapitalMarkers();
  return true;
}
function focusNation(nation, {fillSearch=true} = {}) {
  if (!nation) { clearSelection({clearSearch:fillSearch}); return; }
  cancelPendingHoverPreview();
  setLockedNationState(nation);
  setHoverNationState();
  setSecondaryHoverNationState();
  setProjectFilterState('');
  setActiveIncomingClaimKeyState('');
  if (fillSearch) {
    search.value = humanizeNationLabel(nation);
    search.dataset.selectedNation = nation;
  }
  closeNationDropdown();
  projectSel.value = '';
  if (claimModeSel.value === 'project') claimModeSel.value = 'all';
  updateNationOverlay(nation);
  applyFilters(true);
  updateSelectedRegions();
}
function renderClaimSection(title, items, emptyText, kind) {
  const sectionKey = kind === 'incoming' ? 'incoming' : 'outgoing';
  if (!items.length) return `<details class="infoSubsection claimSection" data-info-section="${sectionKey}"${infoSectionOpenAttribute(sectionKey)}><summary><span>${escapeHtml(title)}</span></summary><div class="infoSubsectionBody small">${escapeHtml(emptyText)}</div></details>`;
  const activeOutgoing = claimModeSel.value === 'project' ? getProjectFilter() : '';
  const rows = items.map((item, i) => {
    const regions = item.regions || [];
    const targetRegions = kind === 'incoming' ? (item.targetRegions || regions) : regions;
    const detailRegions = kind === 'incoming' ? (item.resultRegions || regions) : regions;
    const detailClaims = item.claims || {};
    const hostile = item.hostile ?? targetRegions.filter(rn => claimIsEffectivelyHostile(item.targetClaims?.[rn]) || claimIsEffectivelyHostile(item.claims?.[rn])).length;
    const gated = item.gated ?? targetRegions.filter(rn => item.targetClaims?.[rn]?.gatedClaim || item.claims?.[rn]?.gatedClaim).length;
    const capital = item.capital ?? targetRegions.filter(rn => item.targetClaims?.[rn]?.capitalClaim || item.claims?.[rn]?.capitalClaim).length;
    const claimTitle = claimCardTitle(item, kind);
    const claimTitleHtml = renderClaimCardTitle(item, kind);
    const key = kind === 'incoming' ? incomingClaimKey(item) : outgoingClaimKey(item);
    const active = kind === 'incoming' ? getActiveIncomingClaimKey() === key : activeOutgoing === key;
    const targetNames = targetRegions.map(prettyRegion);
    const targetPreview = targetNames.slice(0, 4).join(', ') + (targetNames.length > 4 ? `, +${targetNames.length - 4}` : '');
    const direction = kind === 'incoming'
      ? t('claimDirection.incoming', {targets: targetPreview || t('claimDirection.selectedRegion'), regions: regionCountText(detailRegions.length)})
      : t('claimDirection.outgoing', {targets: targetPreview || t('claimDirection.noTargets')});
    const inherited = item.inheritedClaimCount || item.inheritedRegions?.length || 0;
    const direct = item.directClaimCount || item.directRegions?.length || regions.length;
    const cumulativeText = kind === 'outgoing' && inherited ? t('claimDirection.cumulative', {direct, inherited}) : '';
    const statsText = `${hostile ? t('claimStat.hostile', {count: hostile}) : ''}${capital ? t('claimStat.capital', {count: capital}) : ''}${gated ? t('claimStat.gated', {count: gated}) : ''}`;
    const regionDetails = active ? renderRegionList(detailRegions, detailClaims, kind === 'incoming' ? 'result' : 'claimed', item.regionSourceLabels || {}) : '';
    return `<div class="claimListGroup${active ? ' active' : ''}"><button type="button" class="claimListItem${active ? ' active' : ''}" data-claim-kind="${kind}" data-claim-index="${i}" data-claim-key="${escapeHtml(key)}" title="${escapeHtml(claimTitle + ' · ' + detailRegions.map(prettyRegion).join(', '))}">${claimTitleHtml}<span class="claimListMeta">${escapeHtml(direction + cumulativeText + statsText)}</span></button>${regionDetails}</div>`;
  }).join('');
  return `<details class="infoSubsection claimSection" data-info-section="${sectionKey}"${infoSectionOpenAttribute(sectionKey)}><summary><span>${escapeHtml(title)}</span></summary><div class="infoSubsectionBody claimList">${rows}</div></details>`;
}



function renderGrid(renderContext = {}) {
  const start = debugRenderStats ? performance.now() : 0;
  renderGridLayer({
    layer: gGrid,
    mapView: renderContext.mapView || mapView,
    copyContexts: renderContext.copyContexts || worldCopyContexts,
  });
  if (debugRenderStats) {
    recordRenderTiming('gridRenderMs', performance.now() - start);
    if (renderContext.isPan) recordRenderStat('gridRebuildsDuringPan');
  }
}
function renderBaseRegionColors(renderContext = {}) {
  if (!gNormalRegionColors) return;
  recordRenderStat('baseColorRenderCalls');
  const copyContexts = normalizeWorldCopyContexts(renderContext.copyContexts || worldCopyContexts);
  const baseMode = baseModeSel.value || 'nation';
  const descriptors = REGIONS
    .filter(region => !mapVisualState.hiddenRegionIds.has(region.regionName))
    .map(region => {
      const fill = colorFor(region);
      const fillKey = `base:${baseMode}:${fill}`;
      return {
        path: region.path,
        regionName: region.regionName,
        className: 'normal-region-color visual-fill-group',
        fill,
        groupKey: fillKey,
        dataset: {fillKey},
      };
    });
  normalRegionColorElements.length = 0;
  const frag = createGroupedVisualFillFragment({
    descriptors,
    copyContexts,
    copyGroupClassName: 'normal-region-color-copy',
  });
  normalRegionColorElements.push(...frag.querySelectorAll?.('.normal-region-color') || []);
  replaceLayerChildren(gNormalRegionColors, frag);
}
function syncNormalRegionColorVisibility() {
  renderBaseRegionColors();
}
function labelsEnabledForRender() {
  return labelsVisible && !debugLabelsDisabled;
}
function recordLabelRenderResult(startedAt) {
  recordRenderStat('labelDomReplacements');
  setRenderStat('labelVisibleState', labelsVisible ? 1 : 0);
  setRenderStat('debugLabelsDisabled', debugLabelsDisabled ? 1 : 0);
  recordRenderTiming('labelRenderMs', performance.now() - startedAt);
  sampleDebugSvgLayerCounts();
}
function renderRegionGeometry(renderContext = {}) {
  recordRenderStat('regionGeometryRenderCalls');
  renderRegionGeometryLayer({
    ...renderContext,
    layer: gRegions,
    hitLayer: gHitRegions,
    indices: derivedIndices,
    copyContexts: renderContext.copyContexts || worldCopyContexts,
    pathByRegion,
    pathInstancesByRegion,
    regionPathElements,
    hitPathByRegion,
    hitPathInstancesByRegion,
    hitPathElements,
    colorFor: () => MUTED_NON_CLAIM_COLOR,
    useCanonicalHitPaths: debugCanonicalHitPaths,
  });
}
function rerenderWorldWrapLayers() {
  if (!worldWrapEnabled) panMapView(mapView, {dx: 0, dy: 0, normalizeX: false});
  applyMapViewToSvg();
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
  refreshReachableCapitalCandidateOutputs(currentOverlayModel);
  updateSelectedRegions();
}
function setWorldWrapEnabled(enabled) {
  const nextEnabled = !!enabled;
  if (worldWrapEnabled === nextEnabled) return;
  worldWrapEnabled = nextEnabled;
  worldCopyContexts = createWorldCopyContexts(mapView, {enabled: worldWrapEnabled});
  svg?.classList.toggle('world-wrap-enabled', worldWrapEnabled);
  syncWorldWrapDebugStats();
  updateMapViewControlsLabels();
  rerenderWorldWrapLayers();
}
function renderLabels(renderContext = {}) {
  const startedAt = performance.now();
  recordRenderStat('labelRenderCalls');
  if (labelsVisible && debugLabelsDisabled) recordRenderStat('labelRenderSkippedByDebug');
  renderLabelsLayer({
    ...renderContext,
    layer: gLabels,
    labelTextElements,
    labelsVisible: labelsEnabledForRender(),
    regions: REGIONS,
    labelPosition,
    localizedRegionName,
    copyContexts: renderContext.copyContexts || worldCopyContexts,
  });
  recordLabelRenderResult(startedAt);
}
function refreshLabelTexts() {
  for (const label of labelTextElements) {
    const region = REGIONS[Number(label.dataset.id)];
    if (region) label.textContent = localizedRegionName(region);
  }
}
function mapPointFromClientPoint(clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return {
      x: mapView.x + mapView.width / 2,
      y: mapView.y + mapView.height / 2,
    };
  }
  return {
    x: mapView.x + ((clientX - rect.left) / rect.width) * mapView.width,
    y: mapView.y + ((clientY - rect.top) / rect.height) * mapView.height,
  };
}
function zoomMapAt(scale, anchor = null) {
  zoomMapView(mapView, {
    scale,
    anchorX: anchor?.x,
    anchorY: anchor?.y,
    normalizeX: worldWrapEnabled,
  });
  applyMapViewToSvg();
}
function resetMapView() {
  initializeMapView(activeData, mapView);
  applyMapViewToSvg();
}
function updateMapViewControlsLabels() {
  updateMapViewControlsLabelsUi({
    document,
    t,
    currentLanguage,
    worldWrapEnabled,
  });
}
function initMapViewControls() {
  initMapViewControlsUi({
    document,
    svgWrap,
    t,
    currentLanguage,
    worldWrapEnabled,
    onZoomIn: () => zoomMapAt(1 / MAP_ZOOM_BUTTON_FACTOR),
    onZoomOut: () => zoomMapAt(MAP_ZOOM_BUTTON_FACTOR),
    onReset: resetMapView,
    onToggleWrap: () => setWorldWrapEnabled(!worldWrapEnabled),
  });
}
function onMapWheel(e) {
  if (!mapView) return;
  e.preventDefault();
  const anchor = mapPointFromClientPoint(e.clientX, e.clientY);
  const scale = e.deltaY < 0 ? 1 / MAP_WHEEL_ZOOM_FACTOR : MAP_WHEEL_ZOOM_FACTOR;
  zoomMapAt(scale, anchor);
}
function applyMapViewToSvg(renderContext = {}) {
  const isPan = !!renderContext.isPan;
  const scheduledAt = Number(renderContext.scheduledAt);
  const start = debugRenderStats ? performance.now() : 0;
  if (svg) {
    svg.setAttribute('viewBox', formatViewBoxForMapView(mapView));
    if (isPan) recordRenderStat('panViewBoxApplyCount');
  }
  if (debugRenderStats) {
    const finishedAt = performance.now();
    recordRenderTiming('mapViewApplyMs', finishedAt - start);
    if (isPan && Number.isFinite(scheduledAt)) {
      recordRenderTiming('panFrameMs', finishedAt - scheduledAt);
    }
  }
  invalidateTooltipLayout();
}
function scheduleMapViewRender(renderContext = {}) {
  if (renderContext.isPan) {
    pendingMapViewRenderContext = {
      isPan: true,
      scheduledAt: Number.isFinite(Number(renderContext.scheduledAt)) ? Number(renderContext.scheduledAt) : performance.now(),
    };
  } else if (!pendingMapViewRenderContext) {
    pendingMapViewRenderContext = renderContext;
  }
  if (mapViewFrame) return;
  mapViewFrame = window.requestAnimationFrame(() => {
    const context = pendingMapViewRenderContext || {};
    pendingMapViewRenderContext = null;
    mapViewFrame = 0;
    applyMapViewToSvg(context);
  });
}
function invalidateTooltipLayout() {
  tooltipController.invalidateLayout();
}
function hideRegionTooltip() {
  tooltipController.hide();
}
function showRegionTooltip(e, r) {
  tooltipController.show(e, r.id, `${localizedRegionName(r)} (${nationDisplayName(r.nationTag)})`);
}
function resolveHitRegion(event, indices = derivedIndices) {
  const target = event?.target;
  const hitTarget = target?.closest?.('[data-region-id], [data-region]');
  if (!hitTarget || !gHitRegions?.contains(hitTarget)) return null;
  const regionName = hitTarget.dataset.regionId || hitTarget.dataset.region;
  return indices.regionByName[regionName] || null;
}
function resolveRelatedHitRegion(event, indices = derivedIndices) {
  const target = event?.relatedTarget;
  const hitTarget = target?.closest?.('[data-region-id], [data-region]');
  if (!hitTarget || !gHitRegions?.contains(hitTarget)) return null;
  const regionName = hitTarget.dataset.regionId || hitTarget.dataset.region;
  return indices.regionByName[regionName] || null;
}
function canUseSimpleHoverVisualDelta(previousRegionName, nextRegion, {regionChanged=false} = {}) {
  return !!(regionChanged && nextRegion?.regionName);
}
function canUseSimpleHoverClearDelta(previousRegionName) {
  return !!previousRegionName;
}

let hoverFullVisualPassFrame = 0;
function scheduleHoverFullVisualPass() {
  if (hoverFullVisualPassFrame) return;
  hoverFullVisualPassFrame = window.requestAnimationFrame(() => {
    hoverFullVisualPassFrame = 0;
    applyMapVisualState();
  });
}

function updateHoveredRegion(r, {force=false} = {}) {
  const previousRegionName = getHoveredRegionName();
  const regionChanged = previousRegionName !== r.regionName;
  const nationChanged = getHoverNation() !== r.nationTag;
  if (!force && !regionChanged && (!getLockedNation() || !nationChanged)) return;
  const useHoverDelta = canUseSimpleHoverVisualDelta(previousRegionName, r, {force, regionChanged});
  setHoveredRegionState(r.regionName, r.nationTag);
  setHoverVisualState(r.regionName);
  updateSecondaryCapitalPreview(r);
  if (useHoverDelta) {
    applyMapVisualStateForRegions([previousRegionName, r.regionName].filter(Boolean));
  } else {
    scheduleHoverFullVisualPass();
  }
  if (!getLockedNation()) scheduleHoverPreviewNation(r.nationTag);
  else setHoverNationState(r.nationTag);
  renderHoverOutlines();
  renderCapitalMarkers();
  syncReachableCapitalCandidateHoverState();
  setHoverPill(r);
}
function onRegionEnter(e, r, {force=true} = {}) {
  updateHoveredRegion(r, {force});
  showRegionTooltip(e, r);
}
function onRegionMove(e, r) {
  updateHoveredRegion(r);
  showRegionTooltip(e, r);
}
function onRegionLeave(e) {
  hideRegionTooltip();
  const next = e?.relatedTarget;
  if (next?.closest?.('.region, .region-hit')) return;
  clearHoverPreview();
}
function onHitLayerPointerOver(e) {
  if (shouldSuppressHitLayerPointerEvent(e)) return;
  const region = resolveHitRegion(e);
  if (!region) return;
  const previousRegion = resolveRelatedHitRegion(e);
  if (previousRegion?.regionName === region.regionName) return;
  onRegionEnter(e, region, {force: !previousRegion});
}
function onHitLayerPointerMove(e) {
  if (shouldSuppressHitLayerPointerEvent(e)) return;
  const region = resolveHitRegion(e);
  if (region) onRegionMove(e, region);
}
function onHitLayerPointerOut(e) {
  if (shouldSuppressHitLayerPointerEvent(e)) return;
  const region = resolveHitRegion(e);
  if (!region) return;
  if (resolveRelatedHitRegion(e)) return;
  onRegionLeave(e);
}
function onHitLayerClick(e) {
  if (consumeSuppressedMapClick(e)) return;
  const region = resolveHitRegion(e);
  if (!region) return;
  e.stopPropagation();
  if (unpinClickedPinnedRegion(region)) return;
  if (selectReachableCapitalCandidateRegion(region.regionName)) return;
  selectRegion(region);
}
function hitRegionElementFromClientPoint(clientX, clientY) {
  const elements = document.elementsFromPoint?.(clientX, clientY)
    || [document.elementFromPoint?.(clientX, clientY)].filter(Boolean);
  for (const element of elements) {
    const hit = element?.closest?.('.region-hit[data-region-id], .region-hit[data-region]');
    if (hit && gHitRegions?.contains(hit)) return hit;
  }
  return null;
}
function refreshPanHoverFromClientPoint(clientX, clientY) {
  const hit = hitRegionElementFromClientPoint(clientX, clientY);
  if (!hit) {
    if (getHoveredRegionName() || getHoverNation() || tooltipController.hasActiveTooltip()) {
      clearHoverPreview();
    }
    return;
  }
  const regionName = hit.dataset.regionId || hit.dataset.region;
  const region = regionByName[regionName];
  if (!region) return;
  onRegionMove({clientX, clientY, target: hit}, region);
}
function shouldSuppressHitLayerPointerEvent(e) {
  return mapPanController.shouldSuppressHitLayerPointerEvent(e);
}
function collectRegionGeometryStats() {
  const count = selector => svg.querySelectorAll(selector).length;
  const dBytes = selector => [...svg.querySelectorAll(selector)]
    .reduce((sum, element) => sum + String(element.getAttribute('d') || '').length, 0);
  const baseRegionPathDBytes = dBytes('#regions path.region');
  const hitPathDBytes = dBytes('#hitRegions path.region-hit');
  const hitGeometryDefPathDBytes = dBytes('#hitRegions path.region-hit-geometry');
  const totalHitGeometryDBytes = hitPathDBytes + hitGeometryDefPathDBytes;
  return {
    baseRegionPathCount: count('#regions path.region'),
    baseRegionUseCount: count('#regions use.region'),
    hitPathCount: count('#hitRegions path.region-hit'),
    hitUseCount: count('#hitRegions use.region-hit'),
    hitGeometryDefPathCount: count('#hitRegions path.region-hit-geometry'),
    hitGeometryDefPathDBytes,
    totalHitGeometryDBytes,
    worldCopyBasePathCount: count('#regions path.region[data-wrap-canonical="0"]'),
    worldCopyBaseUseCount: count('#regions use.region[data-wrap-canonical="0"]'),
    worldCopyHitPathCount: count('#hitRegions path.region-hit[data-wrap-canonical="0"]'),
    worldCopyHitUseCount: count('#hitRegions use.region-hit[data-wrap-canonical="0"]'),
    baseRegionPathDBytes,
    hitPathDBytes,
    totalRegionPathDBytes: baseRegionPathDBytes + totalHitGeometryDBytes,
    canonicalRegionPathCount: count('#regions path.region[data-wrap-canonical="1"]'),
    canonicalRegionPathDBytes: dBytes('#regions path.region[data-wrap-canonical="1"]'),
    canonicalHitPathCount: count('#hitRegions path.region-hit[data-wrap-canonical="1"]'),
    canonicalHitPathDBytes: dBytes('#hitRegions path.region-hit[data-wrap-canonical="1"]'),
  };
}
function sampleDebugSvgLayerCounts({includeGeometry=true} = {}) {
  if (!debugRenderStats || !svg) return;
  const count = selector => svg.querySelectorAll(selector).length;
  if (includeGeometry) cachedRegionGeometryStats = collectRegionGeometryStats();
  setRenderStat('visibleSvgNodeCount', svg.querySelectorAll('*').length);
  setRenderStat('claimOverlayPathCount', count('#claimOverlays path'));
  setRenderStat('claimOverlayUseCount', count('#claimOverlays use'));
  setRenderStat('claimFillPathCount', count('#claimOverlays path.claim-fill-group'));
  setRenderStat('claimFillUseCount', count('#claimOverlays use.claim-fill-group'));
  setRenderStat('claimOutlinePathCount', count('#claimOverlays path.claim-overlay'));
  setRenderStat('claimOutlineUseCount', count('#claimOverlays use.claim-overlay'));
  setRenderStat('claimHatchGroupCount', count('#claimOverlays .claim-hatch-group'));
  setRenderStat('claimHatchPathCount', count('#claimOverlays .claim-hatch-line'));
  setRenderStat('claimClipPathCount', count('#claimOverlays clipPath'));
  setRenderStat('claimLabelCount', count('#claimLabels text.claim-label'));
  for (const [key, value] of Object.entries(cachedRegionGeometryStats)) setRenderStat(key, value);
  setRenderStat('labelCount', count('#labels text.label'));
  setRenderStat('labelCopyGroupCount', count('#labels .label-copy'));
  setRenderStat('wrappedLabelCopyCount', count('#labels text.label[data-wrap-canonical="0"]'));
  setRenderStat('labelVisibleState', labelsVisible ? 1 : 0);
  setRenderStat('debugLabelsDisabled', debugLabelsDisabled ? 1 : 0);
  setRenderStat('selectionOutlinePathCount', count('#selectionOutlines path'));
  setRenderStat('hoverOutlinePathCount', count('#hoverOutlines path'));
  setRenderStat('hoverClaimPreviewOverlayPathCount', count('#hoverClaimPreviewOverlays path'));
  setRenderStat('foreignHoverOverlayPathCount', count('#foreignHoverOverlays path'));
  setRenderStat('secondaryHoverOverlayPathCount', count('#secondaryHoverOverlays path'));
  setRenderStat('manualEnvelopeOverlayPathCount', count('#manualEnvelopeOverlays path'));
  setRenderStat('pinnedRegionMarkerCount', count('#pinnedRegionMarkers .pinned-region-marker'));
  setRenderStat('totalClipPathCount', count('clipPath'));
}
function samplePanSvgNodeCount() {
  sampleDebugSvgLayerCounts({includeGeometry: false});
}
const mapPanController = createMapPanController({
  svg,
  window,
  getMapView: () => mapView,
  getWorldWrapEnabled: () => worldWrapEnabled,
  panMapView,
  scheduleMapViewRender,
  recordRenderStat,
  samplePanSvgNodeCount,
  onPanHoverRefresh: refreshPanHoverFromClientPoint,
  debugRenderStats,
});
function consumeSuppressedMapClick(e) {
  return mapPanController.consumeSuppressedMapClick(e);
}
function onMapPointerDown(e) {
  mapPanController.onPointerDown(e);
}
function onMapPointerMove(e) {
  mapPanController.onPointerMove(e);
}
function onMapPointerUp(e) {
  mapPanController.onPointerUp(e);
}
function onMapPointerCancel(e) {
  mapPanController.onPointerCancel(e);
}
function onMapLostPointerCapture(e) {
  mapPanController.onLostPointerCapture(e);
}
function onMapMove(e) {
  if (mapPanController.isDragging()) return;
  const target = e.target;
  if (target?.classList?.contains('region') || target?.classList?.contains('region-hit')) return;
  const isBlankMap = target === svg || target === gGrid || target === gHitRegions || target?.classList?.contains('graticule');
  if (!isBlankMap) return;
  if (getHoveredRegionName() || getHoverNation() || tooltipController.hasActiveTooltip()) clearHoverPreview();
}
function onMapLeave() {
  clearHoverPreview();
}
function getCurrentNation() { return getLockedNation() || getHoverNation() || ''; }
function overlayModelDataVersionKey(activeData, indices) {
  const summary = activeData?.regionMap?.summary || {};
  const claimStats = activeData?.claimMap?.claimStats || {};
  return [
    summary.scenarioYear || '',
    summary.regions ?? indices?.regions?.length ?? '',
    claimStats.claimRowsNormalized ?? '',
    claimStats.projectClaimRowsNormalized ?? '',
    claimStats.projectCount ?? '',
  ].join(':');
}
function selectedRegionOverlayKey() {
  return [...selectedRegionIds].filter(Boolean).sort().join(',');
}
function buildOverlayModelCacheKey(activeData, indices, nationId, options = {}) {
  return JSON.stringify({
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, indices),
    language: currentLanguage,
    nation: nationId || '',
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
    project: getProjectFilter(),
    activeIncomingClaim: getActiveIncomingClaimKey(),
    selectedRegions: selectedRegionOverlayKey(),
    options: options.cacheKey || '',
  });
}
function getNationOverlayModel(activeData, indices, nationId, options = {}) {
  const cacheKey = buildOverlayModelCacheKey(activeData, indices, nationId, options);
  const cached = overlayModelCache.get(cacheKey);
  if (cached) return cached;
  const model = buildNationOverlayModel(activeData, indices, nationId, options);
  return overlayModelCache.set(cacheKey, model);
}
function overlayModelRenderDataKey(model) {
  return {
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(model?.activeData, model?.indices),
    nation: model?.nation || '',
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
    project: getProjectFilter(),
    activeIncomingClaim: model?.activeIncomingClaimKey || '',
  };
}
function claimOverlayDescriptorCacheKey(model) {
  return JSON.stringify({
    kind: 'claim-overlay-path-descriptors',
    ...overlayModelRenderDataKey(model),
    options: model?.options?.cacheKey || '',
  });
}
function claimLabelDescriptorCacheKey(model) {
  return JSON.stringify({
    kind: 'claim-label-descriptors',
    ...overlayModelRenderDataKey(model),
    options: model?.options?.cacheKey || '',
    language: currentLanguage,
  });
}
function buildNationOverlayModel(activeData, indices, nationId, options = {}) {
  recordRenderStat('overlayModelBuilds');
  return claimModel.buildNationOverlayModel(activeData, indices, nationId, options);
}
function claimOverlayPathDescriptors(model) {
  return buildClaimOverlayDescriptors(model, {
    claimMode: claimModeSel.value,
    regionExists: regionName => !!regionByName[regionName],
    visibleClaimRegionsForEntry,
    countryProjectTier,
    projectColor,
    claimIsEffectivelyHostile,
    baseTerritoryColor: BASE_TERRITORY_COLOR,
  });
}
function claimLabelDescriptors(model) {
  return buildClaimLabelDescriptors(model, {
    visibleClaimRegionsForEntry,
    regionByName,
    labelPosition,
    projectDisplay,
    baselineLabel: t('claimCard.projectBaseline'),
  });
}
function manualEnvelopeAnchorNation(anchorModel = currentOverlayModel) {
  return anchorModel?.nation || getLockedNation() || getActiveNation() || regionByName[getFocusedRegionName()]?.nationTag || '';
}
function manualEnvelopePinnedSourceKey() {
  return [...getPinnedRegionIds()]
    .map((regionName, index) => `${index}:${regionName}:${getPinnedCapitalClaimant(regionName)}:${pinnedExpansionClaimants(regionName).join(',')}`)
    .join('|');
}
function manualEnvelopeModelCacheKey(anchorModel = currentOverlayModel, {includeAnchorOnly = false} = {}) {
  return JSON.stringify({
    kind: 'manual-envelope-model',
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, derivedIndices),
    anchor: manualEnvelopeAnchorNation(anchorModel),
    overlayNation: anchorModel?.nation || '',
    includeAnchorOnly: !!includeAnchorOnly,
    pins: manualEnvelopePinnedSourceKey(),
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
    project: getProjectFilter(),
  });
}
function manualEnvelopeSourceSpecs(anchorNation) {
  if (!anchorNation || claimModeSel.value === 'off') return [];
  const specs = [{
    claimant: anchorNation,
    depth: 0,
    parentClaimant: '',
    viaCapitalRegion: '',
    pinIndex: -1,
  }];
  const seenClaimants = new Set([anchorNation]);
  const resultSetByClaimant = new Map();
  const sourceResultSet = claimant => {
    if (resultSetByClaimant.has(claimant)) return resultSetByClaimant.get(claimant);
    const resultSet = new Set(nationBaseRegionNames(claimant));
    for (const entry of getVisibleProjectEntriesForKind(claimant, 'all')) {
      for (const regionName of entry.regions || []) resultSet.add(regionName);
    }
    resultSetByClaimant.set(claimant, resultSet);
    return resultSet;
  };
  const parentSpecForRegion = regionName => specs
    .filter(spec => sourceResultSet(spec.claimant).has(regionName))
    .sort((a, b) => b.depth - a.depth || b.pinIndex - a.pinIndex || a.claimant.localeCompare(b.claimant))[0] || null;
  const pending = [];
  [...getPinnedRegionIds()].forEach((regionName, pinIndex) => {
    for (const claimant of pinnedExpansionClaimants(regionName)) {
      if (claimant) pending.push({claimant, regionName, pinIndex});
    }
  });
  let changed = true;
  while (changed && pending.length) {
    changed = false;
    for (let index = 0; index < pending.length;) {
      const item = pending[index];
      if (seenClaimants.has(item.claimant)) {
        pending.splice(index, 1);
        continue;
      }
      const parent = parentSpecForRegion(item.regionName);
      if (!parent) {
        index += 1;
        continue;
      }
      seenClaimants.add(item.claimant);
      specs.push({
        claimant: item.claimant,
        depth: parent.depth + 1,
        parentClaimant: parent.claimant,
        viaCapitalRegion: item.regionName,
        pinIndex: item.pinIndex,
      });
      pending.splice(index, 1);
      changed = true;
    }
  }
  return specs.sort(compareManualEnvelopeSourceSpecs(anchorNation));
}
function buildManualEnvelopeModelUncached(anchorModel = currentOverlayModel, {includeAnchorOnly = false} = {}) {
  recordRenderStat('manualEnvelopeModelBuilds');
  const anchorNation = manualEnvelopeAnchorNation(anchorModel);
  const specs = manualEnvelopeSourceSpecs(anchorNation);
  return buildManualEnvelopeModelData(anchorNation, specs, {includeAnchorOnly});
}
function buildManualEnvelopeModel(anchorModel = currentOverlayModel, options = {}) {
  const cacheKey = manualEnvelopeModelCacheKey(anchorModel, options);
  const cached = manualEnvelopeModelCache.get(cacheKey);
  if (cached) return cached === EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE ? null : cached;
  const model = buildManualEnvelopeModelUncached(anchorModel, options);
  manualEnvelopeModelCache.set(cacheKey, model || EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE);
  return model;
}
function renderManualEnvelopeOverlay(anchorModel = currentOverlayModel, {copyContexts=worldCopyContexts} = {}) {
  const model = buildManualEnvelopeModel(anchorModel);
  manualEnvelopeRenderer.render({
    model,
    copyContexts,
    keyContext: {
      data: overlayModelDataVersionKey(activeData, derivedIndices),
      language: currentLanguage,
      claimMode: claimModeSel.value || '',
      claimKind: claimKindSel.value || '',
      project: getProjectFilter(),
    },
    regionByName,
    hostileHatchingDisabled: hostileClaimHatchingDisabled,
    claimIsEffectivelyHostile,
    t,
    projectDisplay,
    nationDisplayName,
    localizedRegionName,
    formatNumber,
    recordRenderStat,
  });
}
function clearManualEnvelopeOverlay() {
  manualEnvelopeRenderer.clear({recordRenderStat});
}
function reachableCapitalCandidateDescriptorCacheKey(model) {
  return JSON.stringify({
    kind: 'reachable-capital-candidate-descriptors',
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, derivedIndices),
    anchor: model?.anchorNation || '',
    sourceKey: model?.sourceKey || '',
    regionKey: model?.regionKey || '',
    pins: [...getPinnedRegionIds()].map(regionName => `${regionName}:${getPinnedCapitalClaimant(regionName)}`).join('|'),
  });
}
function manualEnvelopeVisibleRegionSet(model) {
  return new Set((model?.regionItems || [])
    .map(item => item.region)
    .filter(regionName => regionByName[regionName]));
}
function addRegionNamesToSet(target, regionNames) {
  if (!regionNames) return target;
  if (regionNames instanceof Set || Array.isArray(regionNames)) {
    for (const regionName of regionNames) {
      if (regionByName[regionName]) target.add(regionName);
    }
    return target;
  }
  if (typeof regionNames === 'object') {
    Object.entries(regionNames).forEach(([regionName, included]) => {
      if (included && regionByName[regionName]) target.add(regionName);
    });
  }
  return target;
}
function activeClaimPreviewScopeCacheKey(anchorModel = currentOverlayModel) {
  const pinnedKey = [...getPinnedRegionIds()]
    .map(regionName => `${regionName}:${getPinnedCapitalClaimant(regionName)}`)
    .join('|');
  return JSON.stringify({
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, derivedIndices),
    anchor: manualEnvelopeAnchorNation(anchorModel),
    overlayNation: anchorModel?.nation || '',
    incoming: getActiveIncomingClaimKey(),
    pins: pinnedKey,
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
    project: getProjectFilter(),
  });
}
function activeClaimPreviewRegionSet(anchorModel = currentOverlayModel) {
  if (!anchorModel) return new Set();
  const key = activeClaimPreviewScopeCacheKey(anchorModel);
  if (key === activeClaimPreviewRegionScopeKey && activeClaimPreviewRegionScope) return activeClaimPreviewRegionScope;
  const resultSet = new Set();
  addRegionNamesToSet(resultSet, anchorModel.resultSet);
  addRegionNamesToSet(
    resultSet,
    manualEnvelopeVisibleRegionSet(buildManualEnvelopeModel(anchorModel, {includeAnchorOnly: true}))
  );
  activeClaimPreviewRegionScopeKey = key;
  activeClaimPreviewRegionScope = resultSet;
  return resultSet;
}
function activeClaimPreviewContainsRegion(regionName, anchorModel = currentOverlayModel) {
  return !!regionName && activeClaimPreviewRegionSet(anchorModel).has(regionName);
}
function buildActiveExpansionScope(anchorModel = currentOverlayModel) {
  return {
    anchorNation: manualEnvelopeAnchorNation(anchorModel),
    regionSet: activeClaimPreviewRegionSet(anchorModel),
  };
}
function resolveCapitalClaimantForRegion(regionName, scope = buildActiveExpansionScope()) {
  if (!regionName || !scope?.regionSet?.has?.(regionName)) return '';
  const candidates = reachableCapitalCandidateNations(regionName, scope.anchorNation, scope.regionSet);
  const override = getPinnedCapitalClaimant(regionName);
  if (override && candidates.includes(override)) return override;
  return candidates[0] || '';
}
function resolveReachableCapitalSelectionClaimant(region, capitalClaimantId = '') {
  if (!region?.regionName || !(getLockedNation() || getActiveNation())) return '';
  const scope = buildActiveExpansionScope(currentOverlayModel);
  if (capitalClaimantId) {
    const candidates = reachableCapitalCandidateNations(region.regionName, scope.anchorNation, scope.regionSet);
    return candidates.includes(capitalClaimantId) ? capitalClaimantId : '';
  }
  return resolveCapitalClaimantForRegion(region.regionName, scope);
}
function reachableCapitalCandidateDescriptors(anchorModel = currentOverlayModel, {manualEnvelopeModel = null} = {}) {
  const model = manualEnvelopeModel || buildManualEnvelopeModel(anchorModel, {includeAnchorOnly: true});
  const cacheKey = reachableCapitalCandidateDescriptorCacheKey(model);
  const cached = reachableCapitalCandidateDescriptorCache.get(cacheKey);
  if (cached) return cached;
  recordRenderStat('reachableCapitalCandidateDescriptorBuilds');
  if (!model?.regionItems?.length) {
    return reachableCapitalCandidateDescriptorCache.set(cacheKey, []);
  }
  const resultSet = manualEnvelopeVisibleRegionSet(model);
  const pinned = getPinnedRegionIds();
  const candidates = [];
  for (const item of model.regionItems) {
    if (pinned.has(item.region)) continue;
    const nations = reachableCapitalCandidateNations(item.region, model.anchorNation, resultSet);
    if (!nations.length) continue;
    const region = regionByName[item.region];
    const lab = labelPosition(region);
    const candidateNationId = nations[0];
    candidates.push({
      region: item.region,
      capitalRegionId: item.region,
      depth: item.primary.depth,
      sourceCount: item.overlapSources.length,
      primaryNation: candidateNationId,
      candidateNationId,
      nations,
      x: lab?.x,
      y: lab?.y,
    });
  }
  return reachableCapitalCandidateDescriptorCache.set(
    cacheKey,
    candidates.sort((a, b) => (
      a.depth - b.depth
      || a.region.localeCompare(b.region)
      || a.primaryNation.localeCompare(b.primaryNation)
    ))
  );
}
function reachableCandidateNationsText(candidate) {
  const names = candidate.nations.map(nation => nationDisplayName(nation));
  return names.slice(0, 3).join(', ') + (names.length > 3 ? `, +${names.length - 3}` : '');
}
function reachableCandidateMarkerLabel(candidate) {
  return t('reachableCandidates.marker', {
    region: localizedRegionName(regionByName[candidate.region] || candidate.region),
    nations: reachableCandidateNationsText(candidate),
  });
}
function commitReachableCapitalSelection(region, capitalClaimantId = '') {
  const claimant = resolveReachableCapitalSelectionClaimant(region, capitalClaimantId);
  if (!region?.regionName || !claimant) return false;
  const shouldRefreshIncomingOverlay = !!getActiveIncomingClaimKey();
  setHoveredRegionState(region.regionName, region.nationTag);
  setFocusedRegionState(region.regionName);
  const changedSelectionRegionIds = setSelectedRegionIds([region.regionName]);
  pinRegionState(region.regionName, {capitalClaimant: claimant});
  updateSecondaryCapitalPreview(region);
  updateSelectedRegions({bounded: true, changedRegionIds: changedSelectionRegionIds});
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
  const region = regionByName[candidate?.region];
  return commitReachableCapitalSelection(region, candidate?.primaryNation || '');
}
function reachableCapitalCandidateForRegion(regionName, anchorModel = currentOverlayModel) {
  if (!getShowReachableCapitalCandidates() || !regionName) return null;
  return reachableCapitalCandidateDescriptors(anchorModel)
    .find(candidate => candidate.region === regionName) || null;
}
function selectReachableCapitalCandidateRegion(regionName, anchorModel = currentOverlayModel) {
  const candidate = reachableCapitalCandidateForRegion(regionName, anchorModel);
  return candidate ? selectReachableCapitalCandidate(candidate) : false;
}
function shouldKeepActiveNationForCapitalRegion(region, anchorModel = currentOverlayModel) {
  const anchorNation = manualEnvelopeAnchorNation(anchorModel);
  return !!region?.regionName
    && !!anchorNation
    && !!(getLockedNation() || getActiveNation())
    && isCapitalRegionForNation(anchorNation, region.regionName);
}
function selectActiveNationCapitalRegion(region, anchorModel = currentOverlayModel) {
  if (!shouldKeepActiveNationForCapitalRegion(region, anchorModel)) return false;
  setHoveredRegionState(region.regionName, region.nationTag);
  setFocusedRegionState(region.regionName);
  const changedSelectionRegionIds = setSelectedRegionIds([region.regionName]);
  pinRegionState(region.regionName);
  updateSecondaryCapitalPreview(region);
  updateSelectedRegions({bounded: true, changedRegionIds: changedSelectionRegionIds});
  return true;
}
function renderReachableCapitalCandidatesPanel(anchorModel = currentOverlayModel, {candidates} = {}) {
  const resolvedCandidates = candidates ?? reachableCapitalCandidateDescriptors(anchorModel);
  renderReachableCapitalCandidatesPanelUi({
    root: reachableCandidatesPanel,
    visible: getShowReachableCapitalCandidates(),
    candidates: resolvedCandidates,
    regionByName,
    localizedRegionName,
    candidateNationsText: reachableCandidateNationsText,
    t,
    formatNumber,
    onSelect: (regionName, nationId) => commitReachableCapitalSelection(regionByName[regionName], nationId),
  });
}
function syncReachableCapitalCandidateHoverState() {
  mapMarkerRenderer.syncReachableHoverState({
    hoveredRegionName: getHoveredRegionName(),
  });
}
function renderReachableCapitalCandidateMarkers(anchorModel = currentOverlayModel, {copyContexts=worldCopyContexts, candidates} = {}) {
  const resolvedCandidates = getShowReachableCapitalCandidates()
    ? (candidates ?? reachableCapitalCandidateDescriptors(anchorModel))
    : [];
  mapMarkerRenderer.render({
    kind: 'reachable',
    visible: getShowReachableCapitalCandidates(),
    candidates: resolvedCandidates,
    copyContexts,
    language: currentLanguage,
    regionByName,
    hoveredRegionName: getHoveredRegionName(),
    markerLabel: reachableCandidateMarkerLabel,
    labelPosition,
    localizedRegionName,
    t,
    recordRenderStat,
  });
}
function refreshReachableCapitalCandidateOutputs(anchorModel = currentOverlayModel) {
  const candidates = getShowReachableCapitalCandidates()
    ? reachableCapitalCandidateDescriptors(anchorModel)
    : [];
  renderReachableCapitalCandidatesPanel(anchorModel, {candidates});
  renderReachableCapitalCandidateMarkers(anchorModel, {candidates});
}
function getClaimOverlayDescriptorSet(model) {
  const cacheKey = claimOverlayDescriptorCacheKey(model);
  const cached = claimOverlayDescriptorCache.get(cacheKey);
  if (cached) return cached;
  recordRenderStat('claimOverlayDescriptorBuilds');
  return claimOverlayDescriptorCache.set(cacheKey, {cacheKey, descriptors: claimOverlayPathDescriptors(model)});
}
function getClaimLabelDescriptorSet(model) {
  const cacheKey = claimLabelDescriptorCacheKey(model);
  const cached = claimLabelDescriptorCache.get(cacheKey);
  if (cached) return cached;
  recordRenderStat('claimLabelDescriptorBuilds');
  return claimLabelDescriptorCache.set(cacheKey, {cacheKey, descriptors: claimLabelDescriptors(model)});
}
function clearClaimOverlayDom(renderContext = {}) {
  claimOverlayRenderer.clear({
    ...renderContext,
    recordRenderStat,
  });
}
function renderMapOverlay(model, renderContext = {}) {
  const copyContexts = renderContext.copyContexts || worldCopyContexts;
  setOverlayVisualState(model);
  applyMapVisualState(renderContext);
  const overlayDescriptorSet = getClaimOverlayDescriptorSet(model);
  const labelDescriptorSet = getClaimLabelDescriptorSet(model);
  claimOverlayRenderer.render({
    ...renderContext,
    model,
    overlayDescriptorSet,
    labelDescriptorSet,
    copyContexts,
    regionByName,
    hostileHatchingDisabled: hostileClaimHatchingDisabled,
    recordRenderStat,
    commitDelayFrames: claimOverlayCommitDelayFrames,
    window,
  });
  renderCapitalMarkers({copyContexts});
}
function renderClaimSummaryPill(model) {
  document.getElementById('claimPill').textContent = t('pill.claimSummary', {
    nation: nationDisplayName(model.nation),
    owned: model.ownedCount,
    claims: model.claimCount,
    projects: model.projectCount,
  });
}
function nationInfoPanelHtml(model) {
  const activeNationName = nationDisplayName(model.nation);
  const activeNationTierText = claimTierCountShortText(nationClaimTierCount(model.nation));
  const kvRows = [
    [t('nationInfo.kv.capitalRegion'), capitalRegionsText(model.data)],
    [t('nationInfo.kv.directClaims'), uniqueRegionCountText(model.data.totalClaimRegions || 0)],
    [t('nationInfo.kv.targetedRegions'), `${regionCountText(incomingTargetRegions(model.data, model.baseSet).size)} · ${claimGroupCountText(model.incomingEntries.length)}`],
    [t('nationInfo.kv.conditional'), regionCountText(model.gatedCount)],
  ].map(([label, value]) => `<div>${escapeHtml(label)}</div><div>${escapeHtml(value)}</div>`).join('');
  const basicInfo = `<details class="infoSubsection nationBasicSection" data-info-section="basic"${infoSectionOpenAttribute('basic')}><summary><span>${escapeHtml(t('nationInfo.basic.title'))}</span></summary><div class="infoSubsectionBody"><div class="nationTitle"><b>${escapeHtml(activeNationName)}</b> <span class="status tierBadge">${escapeHtml(activeNationTierText)}</span> ${statusBadge(model.data.status)}</div><div class="kv">${kvRows}</div></div></details>`;
  return `${basicInfo}<div class="claimSections">${renderClaimSection(t('claimSection.outgoing.title'), model.outgoingEntries, t('claimSection.outgoing.empty'), 'outgoing')}${renderClaimSection(t('claimSection.incoming.title'), model.incomingEntries, t('claimSection.incoming.empty'), 'incoming')}</div>`;
}
function handleNationInfoClaimSelected({kind, source, model}) {
  if (kind === 'incoming') {
    const claimant = source.claimant || '';
    if (!claimant) return;
    setActiveIncomingClaimKeyState('');
    setLockedNationState(claimant);
    setHoverNationState();
    setProjectFilterState(outgoingClaimKey(source));
    claimModeSel.value = 'project';
    projectSel.value = source.project || '';
    search.value = humanizeNationLabel(claimant);
    search.dataset.selectedNation = claimant;
    closeNationDropdown();
    updateNationOverlay(claimant);
    return;
  }
  const key = outgoingClaimKey(source);
  setActiveIncomingClaimKeyState('');
  setProjectFilterState(claimModeSel.value === 'project' && getProjectFilter() === key ? '' : key);
  claimModeSel.value = getProjectFilter() ? 'project' : 'all';
  projectSel.value = getProjectFilter() && getProjectFilter() !== '__base__' ? getProjectFilter() : '';
  updateNationOverlay(model.nation);
  updateSelectedRegions();
}
const nationInfoPanelController = createNationInfoPanelController({
  root: nationInfo,
  renderHtml: nationInfoPanelHtml,
  bindSections: bindNationInfoSectionToggles,
  onClaimSelected: handleNationInfoClaimSelected,
  onRegionSelected: ({regionName}) => {
    if (!regionName) return;
    focusRegions([regionName], {selectSingle: true, preserveNation: true, refreshOverlay: true});
    pinRegionState(regionName);
  },
});
function updateNationOverlay(
  nation,
  {
    renderDetails = shouldRenderCommittedNationDetails(),
    updateFilters = renderDetails,
    updateSelected = renderDetails,
    renderMap = true,
    updateManualExpansion = renderMap,
  } = {}
) {
  setActiveNationState(nation);
  if (renderDetails) updateProjectOptions(getActiveNation());
  if (!getActiveNation()) {
    clearHoverClaimPreviewOverlay({force: true});
    currentOverlayModel = null;
    visibleNationRegionNames = new Set();
    clearOverlayVisualState();
    applyMapVisualState();
    setSecondaryHoverNationState();
    clearClaimOverlayDom({claimOverlayLayer: gClaimOverlays, claimLabelLayer: gClaimLabels});
    clearManualEnvelopeOverlay();
    refreshReachableCapitalCandidateOutputs(null);
    renderHoverOutlines();
    if (renderDetails) nationInfoPanelController.clear(t('nationInfo.empty'));
    setClaimsPillEmpty();
    if (updateFilters) applyFilters(false);
    if (updateSelected) updateSelectedRegions();
    return;
  }
  clearHoverClaimPreviewOverlay({force: true});
  const overlayModel = getNationOverlayModel(activeData, derivedIndices, getActiveNation());
  setActiveIncomingClaimKeyState(overlayModel.activeIncomingClaimKey);
  currentOverlayModel = overlayModel;
  visibleNationRegionNames = new Set(overlayModel.resultSet);
  if (renderMap) renderMapOverlay(overlayModel, {claimOverlayLayer: gClaimOverlays, claimLabelLayer: gClaimLabels, mapView});
  if (updateManualExpansion) {
    renderManualEnvelopeOverlay(overlayModel);
    refreshReachableCapitalCandidateOutputs(overlayModel);
  }
  if (renderMap) {
    refreshSecondaryCapitalPreviewForHoveredRegion();
    renderHoverOutlines();
  }
  renderClaimSummaryPill(overlayModel);
  if (renderDetails) nationInfoPanelController.render(overlayModel);
  if (updateFilters) applyFilters(false);
  if (updateSelected) updateSelectedRegions();
}
function updateProjectOptions(nation) {
  const current = getProjectFilter() && getProjectFilter() !== '__base__' ? getProjectFilter() : '';
  const d = CLAIMS_BY_NATION[nation];
  const directEntries = d ? sortedProjectEntries((d.projects || []).filter(e => e.project)) : [];
  const entries = cumulativeClaimEntries(directEntries);
  const opts = [`<option value="">${escapeHtml(t('project.all'))}</option>`].concat(entries.map(e => `<option value="${escapeHtml(e.project)}">${escapeHtml(projectDisplay(e.project))} (${e.regions.length})</option>`));
  projectSel.innerHTML = opts.join('');
  if ([...projectSel.options].some(o => o.value === current)) projectSel.value = current;
  else projectSel.value = '';
}
function selectRegion(r) {
  if (commitReachableCapitalSelection(r)) return;
  if (selectActiveNationCapitalRegion(r)) return;
  setHoveredRegionState(r.regionName, r.nationTag);
  setFocusedRegionState(r.regionName);
  setSelectedRegionIds([r.regionName]);
  focusNation(r.nationTag);
  pinRegionState(r.regionName);
}
function applyFilters(rerenderResults = true, {renderBaseColors = true} = {}) {
  const q = searchFilterText();
  let visible=0; const matches=[]; const hiddenRegionIds = new Set();
  regionPathElements.filter(p => p.dataset.wrapCanonical !== '0').forEach(p => {
    const r = REGIONS[Number(p.dataset.id)];
      const text = (r.name+' '+r.regionName+' '+localizedRegionName(r)+' '+(r.primaryCity || '')+' '+Object.values(r.displayName || {}).join(' ')+' '+r.nationTag).toLowerCase();
    const okQ = !q || text.includes(q);
    const ok = okQ;
    if (!ok) hiddenRegionIds.add(r.regionName);
    if (ok) { visible++; if (matches.length<90) matches.push(r); }
  });
  setHiddenVisualState(hiddenRegionIds);
  applyMapVisualState();
  if (renderBaseColors) syncNormalRegionColorVisibility();
  labelTextElements.forEach(t => {
    const r = REGIONS[Number(t.dataset.id)];
    const okQ = !q || (r.name+' '+r.regionName+' '+localizedRegionName(r)+' '+(r.primaryCity || '')+' '+Object.values(r.displayName || {}).join(' ')+' '+r.nationTag).toLowerCase().includes(q);
    t.style.display = okQ ? '' : 'none';
  });
  if (rerenderResults && results) {
    const nationMatches = q ? matchingNationChoices(q, 25) : [];
    renderSearchResults({
      root: results,
      nationMatches,
      regionMatches: matches,
      t,
      localizedRegionName,
      onNation: focusNation,
      onRegion: index => selectRegion(REGIONS[index]),
    });
  }
}
function updateWarning() {
  const warn = document.getElementById('warnPill');
  if (warn && CLAIM_STATS.regionsUnmatched) { warn.style.display=''; warn.textContent = t('warn.unmatchedClaimRows', {count: CLAIM_STATS.regionsUnmatched}); }
  else if (warn) { warn.style.display='none'; warn.textContent = ''; }
}
function refreshLanguage() {
  recordRenderStat('languageRefreshRuns');
  runRefreshSteps(LANGUAGE_REFRESH_STEPS, createLanguageRefreshActions({
    applyStaticTranslations,
    rebuildSearchCatalog,
    updateWarning,
    syncSearchSelectedNationLabel: () => {
      const selectedNation = search.dataset.selectedNation || '';
      if (selectedNation) search.value = humanizeNationLabel(selectedNation);
    },
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
    renderManualEnvelopeOverlay: () => renderManualEnvelopeOverlay(currentOverlayModel),
    refreshReachableCapitalCandidateOutputs: () => refreshReachableCapitalCandidateOutputs(currentOverlayModel),
    refreshHoverPill: () => {
      const hoveredRegionId = tooltipController.currentRegionId();
      const hoveredRegion = hoveredRegionId != null ? REGIONS[hoveredRegionId] : null;
      setHoverPill(hoveredRegion);
    },
  }));
}

applyStaticTranslations();
initAsideCards();

bindNationSearchControl({
  search,
  dropdown: nationDropdown,
  combo: nationSearchCombo,
  document,
  getSelectedNation: () => search.dataset.selectedNation || '',
  parseNationSearchValue,
  onSelectedNationCleared: () => {
    search.dataset.selectedNation = '';
    setLockedNationState();
    setSelectedRegionIds();
    setFocusedRegionState();
    resetTransientClaimState();
    updateNationOverlay(getHoverNation() || '');
  },
  openDropdown: openNationDropdown,
  closeDropdown: closeNationDropdown,
  renderDropdown: renderNationDropdown,
  applyFilters,
  getChoiceCount: () => currentDropdownChoices.length,
  getDropdownOpen: () => nationDropdownOpen,
  getHighlightedIndex: () => highlightedNationChoiceIndex,
  setHighlightedIndex: index => { highlightedNationChoiceIndex = index; },
  chooseDropdown: chooseNationFromDropdown,
  focusNationFromSearch: focusNation,
});
bindAppControls({
  languageSelect: languageSel,
  scenarioSelect: scenarioSel,
  baseModeSelect: baseModeSel,
  claimModeSelect: claimModeSel,
  claimKindSelect: claimKindSel,
  projectSelect: projectSel,
  labelsToggle: document.getElementById('showLabels'),
  reachableCapitalsButton: document.getElementById('reachableCapitalsBtn'),
  onLanguageChange: language => {
    currentLanguage = i18n.setLanguage(language);
    saveLanguage(currentLanguage);
    refreshLanguage();
  },
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
    else if (!getProjectFilter()) setProjectFilterState(projectSel.value || '');
    updateNationOverlay(getCurrentNation());
  },
  onClaimKindChange: () => updateNationOverlay(getCurrentNation()),
  onProjectChange: projectId => {
    setActiveIncomingClaimKeyState('');
    setProjectFilterState(projectId || '');
    claimModeSel.value = getProjectFilter() ? 'project' : 'all';
    updateNationOverlay(getCurrentNation());
  },
  onLabelsToggle: () => {
    labelsVisible = !labelsVisible;
    renderLabels();
    applyFilters();
  },
  onReachableCapitalsToggle: () => {
    toggleReachableCapitalCandidatesState();
  },
});
if (gHitRegions) {
  gHitRegions.addEventListener('pointerover', onHitLayerPointerOver);
  gHitRegions.addEventListener('pointermove', onHitLayerPointerMove);
  gHitRegions.addEventListener('pointerout', onHitLayerPointerOut);
  gHitRegions.addEventListener('click', onHitLayerClick);
}
  svg.addEventListener('pointerdown', onMapPointerDown);
  svg.addEventListener('pointermove', onMapPointerMove);
  svg.addEventListener('pointerup', onMapPointerUp);
  svg.addEventListener('pointercancel', onMapPointerCancel);
  svg.addEventListener('lostpointercapture', onMapLostPointerCapture);

svg.addEventListener('mousemove', onMapMove);
svg.addEventListener('wheel', onMapWheel, {passive:false});
svg.addEventListener('click', e => {
  if (consumeSuppressedMapClick(e)) return;
  const target = e.target;
  if (target === svg || target === gGrid || target === gHitRegions || target.classList?.contains('graticule')) clearPinsOrSelection();
});
svg.addEventListener('mouseleave', onMapLeave);
window.addEventListener('resize', invalidateTooltipLayout);
window.addEventListener('scroll', invalidateTooltipLayout, true);
if ('ResizeObserver' in window) new ResizeObserver(invalidateTooltipLayout).observe(svgWrap);

setHoverPill();
setClaimsPillEmpty();
initMapViewControls();
renderPinnedRegionsPanel();
refreshReachableCapitalCandidateOutputs();
prepareScenarioRuntime(activeScenarioId(), {rebuildRuntime: false});
refreshScenarioView();
dismissLoadingScreen();
}).catch((error) => {
  console.error(error);
  let language = 'ko';
  try { language = String(window.localStorage?.getItem('ti-map-language') || document.documentElement.lang || 'ko').toLowerCase().startsWith('en') ? 'en' : 'ko'; }
  catch (_) {}
  const message = language === 'en' ? 'Failed to load generated Terra Invicta map data.' : 'Terra Invicta 지도 데이터를 불러오지 못했습니다.';
  if (!showLoadingFailure(message, error)) {
    document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:24px;color:#f8fafc;background:#0b1020">${message}

${String(error && error.stack || error)}</pre>`;
  }
});
