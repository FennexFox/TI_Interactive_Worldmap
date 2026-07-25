// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  formatViewBoxForMapView,
  initializeMapView,
  zoomMapView,
} from '../state/map-view-state.js';
import {
  initMapViewControls,
  updateMapViewControlsLabels,
} from '../ui/map-controls.js';
import {
  defaultWorldCopyContext,
  normalizeWorldCopyContexts,
} from '../render/map-layers.js';

const MAP_ZOOM_BUTTON_FACTOR = 1.25;
const MAP_WHEEL_ZOOM_FACTOR = 1.18;

function worldCopyContextsRenderKey(copyContexts) {
  return normalizeWorldCopyContexts(copyContexts)
    .map(item => `${item.copyIndex}:${item.xOffset}:${item.isCanonical ? 1 : 0}`)
    .join('|');
}

export function createMapViewController({
  document,
  svg,
  svgWrap,
  activeData,
  getActiveData = () => activeData,
  location,
  getT,
  getLanguage,
  onWorldWrapChanged,
  onTooltipLayoutInvalidated,
  getDebugContext = () => ({}),
} = {}) {
  const mapView = initializeMapView(activeData);
  let worldWrapEnabled = shouldEnableWorldWrap(location);
  let copyContexts = createWorldCopyContexts(mapView, worldWrapEnabled);
  let controls = null;
  let started = false;
  let destroyed = false;

  function pointFromClient(clientX, clientY) {
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

  function apply(renderContext = {}) {
    if (destroyed) return;
    const {
      debugRenderStats,
      recordRenderStat = () => {},
      recordRenderTiming = () => {},
    } = getDebugContext();
    const isPan = !!renderContext.isPan;
    const scheduledAt = Number(renderContext.scheduledAt);
    const start = debugRenderStats ? performance.now() : 0;
    svg?.setAttribute('viewBox', formatViewBoxForMapView(mapView));
    if (isPan) recordRenderStat('panViewBoxApplyCount');
    if (debugRenderStats) {
      const finishedAt = performance.now();
      recordRenderTiming('mapViewApplyMs', finishedAt - start);
      if (isPan && Number.isFinite(scheduledAt)) {
        recordRenderTiming('panFrameMs', finishedAt - scheduledAt);
      }
    }
    onTooltipLayoutInvalidated?.();
  }

  function zoomAt(scale, anchor = null) {
    if (destroyed) return;
    zoomMapView(mapView, {
      scale,
      anchorX: anchor?.x,
      anchorY: anchor?.y,
      normalizeX: worldWrapEnabled,
    });
    apply();
  }

  function reset(nextActiveData = getActiveData()) {
    if (destroyed) return;
    initializeMapView(nextActiveData, mapView);
    const nextCopyContexts = createWorldCopyContexts(mapView, worldWrapEnabled);
    const copyContextsChanged = worldCopyContextsRenderKey(nextCopyContexts)
      !== worldCopyContextsRenderKey(copyContexts);
    copyContexts = nextCopyContexts;
    apply();
    if (copyContextsChanged) {
      onWorldWrapChanged?.({enabled: worldWrapEnabled, copyContexts});
    }
  }

  function onWheel(event) {
    if (destroyed) return;
    event.preventDefault();
    const anchor = pointFromClient(event.clientX, event.clientY);
    const scale = event.deltaY < 0 ? 1 / MAP_WHEEL_ZOOM_FACTOR : MAP_WHEEL_ZOOM_FACTOR;
    zoomAt(scale, anchor);
  }

  function updateLabels() {
    updateMapViewControlsLabels({
      document,
      t: getT?.() || (key => key),
      currentLanguage: getLanguage?.() || 'en',
      worldWrapEnabled,
    });
  }

  function start() {
    if (started || destroyed) return false;
    started = true;
    svg?.classList.toggle('world-wrap-enabled', worldWrapEnabled);
    apply();
    controls = initMapViewControls({
      document,
      svgWrap,
      t: getT?.() || (key => key),
      currentLanguage: getLanguage?.() || 'en',
      worldWrapEnabled,
      onZoomIn: () => zoomAt(1 / MAP_ZOOM_BUTTON_FACTOR),
      onZoomOut: () => zoomAt(MAP_ZOOM_BUTTON_FACTOR),
      onReset: () => reset(),
      onToggleWrap: () => setWorldWrapEnabled(!worldWrapEnabled),
    });
    return true;
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    controls?.destroy();
    controls = null;
  }

  function setWorldWrapEnabled(enabled) {
    if (destroyed) return false;
    const nextEnabled = !!enabled;
    if (worldWrapEnabled === nextEnabled) return false;
    worldWrapEnabled = nextEnabled;
    copyContexts = createWorldCopyContexts(mapView, worldWrapEnabled);
    svg?.classList.toggle('world-wrap-enabled', worldWrapEnabled);
    updateLabels();
    onWorldWrapChanged?.({enabled: worldWrapEnabled, copyContexts});
    return true;
  }

  return Object.freeze({
    mapView,
    start,
    destroy,
    getCopyContexts: () => copyContexts,
    isWorldWrapEnabled: () => worldWrapEnabled,
    renderKey: () => worldCopyContextsRenderKey(copyContexts),
    apply,
    onWheel,
    pointFromClient,
    reset,
    updateLabels,
    setWorldWrapEnabled,
    zoomAt,
  });
}

function shouldEnableWorldWrap(location) {
  try {
    const value = new URLSearchParams(location?.search || '').get('worldWrap');
    if (value === null) return false;
    return !['0', 'false', 'off'].includes(value.toLowerCase());
  } catch {
    return false;
  }
}

function createWorldCopyContexts(mapView, enabled) {
  const canonical = defaultWorldCopyContext();
  const worldWidth = Number(mapView?.worldWidth) || 0;
  if (!enabled || !worldWidth) return [canonical];
  return [
    {copyIndex: -1, xOffset: -worldWidth, isCanonical: false},
    canonical,
    {copyIndex: 1, xOffset: worldWidth, isCanonical: false},
  ];
}
