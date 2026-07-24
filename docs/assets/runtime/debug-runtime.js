// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

const RENDER_STAT_KEYS = Object.freeze([
  'fullVisualStateApplications',
  'boundedVisualStateApplications',
  'visiblePathsTouched',
  'hitPathsTouched',
  'overlayModelBuilds',
  'overlayModelCacheHits',
  'claimOverlayDescriptorBuilds',
  'claimOverlayDescriptorCacheHits',
  'claimLabelDescriptorBuilds',
  'claimLabelDescriptorCacheHits',
  'foreignHoverDescriptorBuilds',
  'foreignHoverDescriptorCacheHits',
  'claimOverlayInactiveBufferRebuilds',
  'claimLabelInactiveBufferRebuilds',
  'claimOverlayBufferSwaps',
  'claimLabelBufferSwaps',
  'claimOverlayStaleRenderSkips',
  'claimLabelStaleRenderSkips',
  'claimOverlayDomReplacements',
  'claimLabelDomReplacements',
  'hoverOutlineReplacements',
  'foreignHoverOverlayReplacements',
  'hoverClaimPreviewOverlayReplacements',
  'secondaryHoverOverlayReplacements',
  'manualEnvelopeModelBuilds',
  'manualEnvelopeModelCacheHits',
  'manualEnvelopeRebuilds',
  'reachableCapitalCandidateDescriptorBuilds',
  'reachableCapitalCandidateDescriptorCacheHits',
  'reachableCapitalCandidateRebuilds',
  'capitalMarkerRebuilds',
  'pinnedRegionMarkerRebuilds',
  'panPointerMoveCount',
  'panFrameMsCount',
  'panFrameMsTotal',
  'panFrameMsMax',
  'mapViewApplyMsCount',
  'mapViewApplyMsTotal',
  'mapViewApplyMsMax',
  'gridRenderMsCount',
  'gridRenderMsTotal',
  'gridRenderMsMax',
  'panViewBoxApplyCount',
  'gridRebuildsDuringPan',
  'panSvgRectReads',
  'visibleSvgNodeCount',
  'claimOverlayPathCount',
  'claimOverlayUseCount',
  'claimFillPathCount',
  'claimFillUseCount',
  'claimOutlinePathCount',
  'claimOutlineUseCount',
  'claimHatchGroupCount',
  'claimHatchPathCount',
  'claimClipPathCount',
  'claimLabelCount',
  'baseRegionPathCount',
  'baseRegionUseCount',
  'hitPathCount',
  'hitUseCount',
  'hitGeometryDefPathCount',
  'hitGeometryDefPathDBytes',
  'totalHitGeometryDBytes',
  'worldCopyBasePathCount',
  'worldCopyBaseUseCount',
  'worldCopyHitPathCount',
  'worldCopyHitUseCount',
  'baseRegionPathDBytes',
  'hitPathDBytes',
  'totalRegionPathDBytes',
  'canonicalRegionPathCount',
  'canonicalRegionPathDBytes',
  'canonicalHitPathCount',
  'canonicalHitPathDBytes',
  'labelCount',
  'labelCopyGroupCount',
  'wrappedLabelCopyCount',
  'labelRenderCalls',
  'labelDomReplacements',
  'labelRenderSkippedByDebug',
  'labelRenderMsCount',
  'labelRenderMsTotal',
  'labelRenderMsMax',
  'labelVisibleState',
  'debugLabelsDisabled',
  'debugCanonicalHitPaths',
  'selectionOutlinePathCount',
  'hoverOutlinePathCount',
  'hoverClaimPreviewOverlayPathCount',
  'manualEnvelopeOverlayPathCount',
  'pinnedRegionMarkerCount',
  'totalClipPathCount',
  'worldWrapDisabled',
  'worldCopyContextCount',
  'hostileHatchDisabled',
  'foreignHoverOverlayPathCount',
  'foreignHoverOverlayRegionCount',
  'secondaryHoverOverlayPathCount',
  'secondaryHoverOverlayRegionCount',
  'scenarioRuntimeBuilds',
  'searchCatalogBuilds',
  'incomingClaimIndexBuilds',
  'scenarioRefreshRuns',
  'languageRefreshRuns',
  'baseColorRenderCalls',
  'regionGeometryRenderCalls',
]);

function toggleValue(value, fallback = false) {
  if (value == null) return fallback;
  return !['0', 'false', 'off'].includes(String(value || '1').toLowerCase());
}

function safeParams(location) {
  try {
    return new URLSearchParams(location?.search || '');
  } catch {
    return new URLSearchParams();
  }
}

function safeStorageValue(storage, key) {
  try {
    return storage?.getItem?.(key);
  } catch {
    return null;
  }
}

function roundedStat(value, digits = 4) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

export function parseDebugFlags({location, storage} = {}) {
  const params = safeParams(location);
  const renderStatsEnabled = params.has('debugRenderStats')
    || safeStorageValue(storage, 'ti-debug-render-stats') === '1';
  let hostileHatchingDisabled = safeStorageValue(storage, 'ti-disable-hostile-hatch') === '1';
  for (const name of ['disableHostileHatch', 'debugDisableHostileHatch']) {
    if (params.has(name)) {
      hostileHatchingDisabled = toggleValue(params.get(name), true);
      break;
    }
  }
  const labelsDisabled = renderStatsEnabled
    && params.has('debugDisableLabels')
    && toggleValue(params.get('debugDisableLabels'));
  const canonicalHitPaths = renderStatsEnabled
    && params.has('debugUseCanonicalHitPaths')
    && toggleValue(params.get('debugUseCanonicalHitPaths'));
  const overlayDelay = Number.parseInt(params.get('debugClaimOverlayDelayFrames') || '0', 10);
  return Object.freeze({
    renderStatsEnabled,
    hostileHatchingDisabled,
    labelsDisabled,
    canonicalHitPaths,
    claimOverlayDelayFrames: renderStatsEnabled && Number.isFinite(overlayDelay) && overlayDelay > 0
      ? Math.min(overlayDelay, 30)
      : 0,
  });
}

export function createDebugRuntime({
  location,
  storage,
  mapView,
  getWorldWrapEnabled = () => false,
  getWorldCopyContextCount = () => 1,
  initialMapView = mapView,
} = {}) {
  const flags = parseDebugFlags({location, storage});
  const initialWidth = Number(initialMapView?.width) || 0;
  const initialHeight = Number(initialMapView?.height) || 0;
  const initialArea = initialWidth * initialHeight;
  const stats = flags.renderStatsEnabled ? {} : null;

  const set = (key, value) => {
    if (!stats) return;
    stats[key] = Number.isFinite(Number(value)) ? Number(value) : 0;
  };
  const record = (key, amount = 1) => {
    if (!stats) return;
    stats[key] = (stats[key] || 0) + amount;
  };
  const recordTiming = (key, value) => {
    if (!stats) return;
    const ms = Math.max(0, Number(value) || 0);
    record(`${key}Count`);
    record(`${key}Total`, ms);
    stats[`${key}Max`] = Math.max(stats[`${key}Max`] || 0, ms);
  };
  const syncWorldWrap = () => {
    set('worldWrapDisabled', getWorldWrapEnabled() ? 0 : 1);
    set('worldCopyContextCount', getWorldCopyContextCount());
  };
  const reset = () => {
    if (!stats) return;
    for (const key of RENDER_STAT_KEYS) stats[key] = 0;
    set('hostileHatchDisabled', flags.hostileHatchingDisabled ? 1 : 0);
    set('debugLabelsDisabled', flags.labelsDisabled ? 1 : 0);
    set('debugCanonicalHitPaths', flags.canonicalHitPaths ? 1 : 0);
    syncWorldWrap();
  };

  if (stats) {
    reset();
    const dynamic = {
      mapViewX: () => roundedStat(mapView?.x, 3),
      mapViewY: () => roundedStat(mapView?.y, 3),
      mapViewWidth: () => roundedStat(mapView?.width, 3),
      mapViewHeight: () => roundedStat(mapView?.height, 3),
      mapViewArea: () => roundedStat((mapView?.width || 0) * (mapView?.height || 0), 3),
      mapViewAspectRatio: () => roundedStat((mapView?.width || 0) / (mapView?.height || 1), 4),
      mapZoomX: () => roundedStat(initialWidth / (mapView?.width || 1), 4),
      mapZoomY: () => roundedStat(initialHeight / (mapView?.height || 1), 4),
      mapZoomArea: () => roundedStat(initialArea / ((mapView?.width || 1) * (mapView?.height || 1)), 4),
    };
    for (const [key, getter] of Object.entries(dynamic)) {
      Object.defineProperty(stats, key, {enumerable: true, configurable: true, get: getter});
    }
    Object.defineProperty(stats, 'reset', {value: reset});
  }

  return Object.freeze({
    flags,
    stats,
    record,
    set,
    recordTiming,
    syncWorldWrap,
    reset,
  });
}
