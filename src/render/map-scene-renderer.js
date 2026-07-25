// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  applyMapVisualState,
  applyMapVisualStateForRegions,
  clearOverlayVisualState,
  createMapVisualState,
  setHiddenVisualState,
  setHoverVisualState,
  setOverlayVisualState,
  syncPinnedVisualState,
  syncSelectedVisualState,
} from '../state/map-visual-state.js';
import {
  createGroupedVisualFillFragment,
  normalizeWorldCopyContexts,
  renderGrid,
  renderLabels,
  renderRegionGeometry,
  replaceLayerChildren,
} from './map-layers.js';

export const MUTED_NON_CLAIM_COLOR = 'oklch(0.32 0.026 260)';

export function createMapSceneRenderer({
  svg,
  regionLayer,
  normalRegionColorLayer,
  hitLayer,
  labelLayer,
  gridLayer,
  getContext,
} = {}) {
  const visualState = createMapVisualState();
  const pathByRegion = new Map();
  const pathInstancesByRegion = new Map();
  const regionPathElements = [];
  const hitPathByRegion = new Map();
  const hitPathInstancesByRegion = new Map();
  const hitPathElements = [];
  const normalRegionColorElements = [];
  const labelTextElements = [];
  const regionCenterCache = new Map();
  let labelsVisible = false;
  let cachedRegionGeometryStats = {};
  let destroyed = false;

  function context(overrides = {}) {
    return {...(getContext?.() || {}), ...overrides};
  }

  function regionPathCenter(region) {
    if (!region?.regionName || !region?.path) return null;
    if (regionCenterCache.has(region.regionName)) return regionCenterCache.get(region.regionName);
    const values = String(region.path).match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) || [];
    const points = [];
    for (let index = 0; index + 1 < values.length; index += 2) {
      const x = values[index];
      const y = values[index + 1];
      if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]);
    }
    if (!points.length) {
      regionCenterCache.set(region.regionName, null);
      return null;
    }
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const center = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
    regionCenterCache.set(region.regionName, center);
    return center;
  }

  function labelPosition(region) {
    if (region?.labels?.[0]) return region.labels[0];
    return regionPathCenter(region);
  }

  function renderContext(overrides = {}) {
    return {
      svg,
      pathByRegion,
      pathInstancesByRegion,
      regionPathElements,
      hitPathByRegion,
      hitPathInstancesByRegion,
      hitPathElements,
      ...overrides,
    };
  }

  function syncClaimPresentationState() {
    const {hasCommittedClaimOverlay, hasClaimPreview} = context();
    svg?.classList?.toggle('claims-active', !!hasCommittedClaimOverlay || !!hasClaimPreview);
  }

  function apply(overrides = {}) {
    if (destroyed) return;
    const {recordRenderStat = () => {}} = context();
    const target = renderContext(overrides);
    recordRenderStat('fullVisualStateApplications');
    recordRenderStat('visiblePathsTouched', target.regionPathElements.length);
    recordRenderStat(
      'hitPathsTouched',
      target.hitPathElements.length || target.hitPathByRegion.size
    );
    applyMapVisualState(target, visualState);
    syncClaimPresentationState();
  }

  function applyForRegions(regionIds, overrides = {}) {
    if (destroyed) return {visiblePathsTouched: 0, hitPathsTouched: 0};
    const {recordRenderStat = () => {}} = context();
    const result = applyMapVisualStateForRegions(
      renderContext(overrides),
      visualState,
      regionIds
    );
    recordRenderStat('boundedVisualStateApplications');
    recordRenderStat('visiblePathsTouched', result.visiblePathsTouched);
    recordRenderStat('hitPathsTouched', result.hitPathsTouched);
    syncClaimPresentationState();
    return result;
  }

  function renderGridLayer(overrides = {}) {
    if (destroyed) return;
    const {
      mapView,
      copyContexts,
      debugRenderStats,
      recordRenderStat = () => {},
      recordRenderTiming = () => {},
    } = context(overrides);
    const startedAt = debugRenderStats ? performance.now() : 0;
    renderGrid({layer: gridLayer, mapView, copyContexts});
    if (debugRenderStats) {
      recordRenderTiming('gridRenderMs', performance.now() - startedAt);
      if (overrides.isPan) recordRenderStat('gridRebuildsDuringPan');
    }
  }

  function renderBaseColors(overrides = {}) {
    if (destroyed || !normalRegionColorLayer) return;
    const {
      regions = [],
      copyContexts,
      baseMode = 'nation',
      colorFor,
      recordRenderStat = () => {},
    } = context(overrides);
    recordRenderStat('baseColorRenderCalls');
    const descriptors = regions
      .filter(region => !visualState.hiddenRegionIds.has(region.regionName))
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
    const fragment = createGroupedVisualFillFragment({
      descriptors,
      copyContexts: normalizeWorldCopyContexts(copyContexts),
      copyGroupClassName: 'normal-region-color-copy',
    });
    normalRegionColorElements.push(...fragment.querySelectorAll?.('.normal-region-color') || []);
    replaceLayerChildren(normalRegionColorLayer, fragment);
  }

  function renderGeometry(overrides = {}) {
    if (destroyed) return;
    const {
      indices,
      copyContexts,
      debugCanonicalHitPaths,
      recordRenderStat = () => {},
    } = context(overrides);
    recordRenderStat('regionGeometryRenderCalls');
    renderRegionGeometry({
      ...overrides,
      layer: regionLayer,
      hitLayer,
      indices,
      copyContexts,
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

  function labelsEnabled() {
    return labelsVisible && !context().debugLabelsDisabled;
  }

  function renderLabelLayer(overrides = {}) {
    if (destroyed) return;
    const {
      regions = [],
      copyContexts,
      labelPosition,
      localizedRegionName,
      debugLabelsDisabled,
      recordRenderStat = () => {},
      setRenderStat = () => {},
      recordRenderTiming = () => {},
    } = context(overrides);
    const startedAt = performance.now();
    recordRenderStat('labelRenderCalls');
    if (labelsVisible && debugLabelsDisabled) recordRenderStat('labelRenderSkippedByDebug');
    renderLabels({
      ...overrides,
      layer: labelLayer,
      labelTextElements,
      labelsVisible: labelsEnabled(),
      regions,
      labelPosition,
      localizedRegionName,
      copyContexts,
    });
    recordRenderStat('labelDomReplacements');
    setRenderStat('labelVisibleState', labelsVisible ? 1 : 0);
    setRenderStat('debugLabelsDisabled', debugLabelsDisabled ? 1 : 0);
    recordRenderTiming('labelRenderMs', performance.now() - startedAt);
    sampleDebugSvgLayerCounts();
  }

  function refreshLabelTexts() {
    const {regions = [], localizedRegionName} = context();
    for (const label of labelTextElements) {
      const region = regions[Number(label.dataset.id)];
      if (region) label.textContent = localizedRegionName(region);
    }
  }

  function getCanonicalRegions() {
    const {regions = []} = context();
    return regionPathElements
      .filter(path => path.dataset.wrapCanonical !== '0')
      .map(path => regions[Number(path.dataset.id)])
      .filter(Boolean);
  }

  function setLabelRegionVisibility(visibleRegionIds = new Set()) {
    const {regions = []} = context();
    for (const label of labelTextElements) {
      const region = regions[Number(label.dataset.id)];
      label.style.display = region && visibleRegionIds.has(region.regionName) ? '' : 'none';
    }
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

  function sampleDebugSvgLayerCounts({includeGeometry = true} = {}) {
    const {
      debugRenderStats,
      debugLabelsDisabled,
      setRenderStat = () => {},
    } = context();
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
    for (const [key, value] of Object.entries(cachedRegionGeometryStats)) {
      setRenderStat(key, value);
    }
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

  function reset() {
    cachedRegionGeometryStats = {};
    regionCenterCache.clear();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    pathByRegion.clear();
    pathInstancesByRegion.clear();
    hitPathByRegion.clear();
    hitPathInstancesByRegion.clear();
    regionPathElements.length = 0;
    hitPathElements.length = 0;
    normalRegionColorElements.length = 0;
    labelTextElements.length = 0;
    cachedRegionGeometryStats = {};
    regionCenterCache.clear();
  }

  return Object.freeze({
    apply,
    applyForRegions,
    clearOverlay: () => clearOverlayVisualState(visualState),
    destroy,
    getCanonicalRegions,
    getHitPathElements: () => hitPathElements,
    getLabelTextElements: () => labelTextElements,
    getRegionPathElements: () => regionPathElements,
    isLabelsVisible: () => labelsVisible,
    labelPosition,
    refreshLabelTexts,
    renderBaseColors,
    renderGeometry,
    renderGrid: renderGridLayer,
    renderLabels: renderLabelLayer,
    reset,
    sampleDebugSvgLayerCounts,
    samplePanSvgNodeCount: () => sampleDebugSvgLayerCounts({includeGeometry: false}),
    setHostileHatchingDisabled(value) {
      svg?.classList.toggle('hostile-hatch-disabled', !!value);
    },
    setHidden: regionIds => setHiddenVisualState(visualState, regionIds),
    setHover: regionName => setHoverVisualState(visualState, regionName),
    setLabelsVisible(value) {
      labelsVisible = !!value;
    },
    setLabelRegionVisibility,
    setOverlay: model => setOverlayVisualState(visualState, model, context().regions || []),
    syncPinned: regionIds => syncPinnedVisualState(visualState, regionIds),
    syncClaimPresentation: syncClaimPresentationState,
    syncSelected: regionIds => syncSelectedVisualState(visualState, regionIds),
  });
}
