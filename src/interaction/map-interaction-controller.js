// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {createMapPanController} from './map-pan.js';
import {createTooltipController} from './tooltip.js';

const WHEEL_LISTENER_OPTIONS = {passive: false};

export function createMapInteractionController({
  window,
  document,
  svg,
  svgWrap,
  tip,
  hitLayer,
  gridLayer,
  getContext = () => ({}),
  onRegionEnter,
  onRegionMove,
  onRegionLeave,
  onRegionClick,
  onBlankMapMove,
  onBlankMapClick,
  onMapLeave = () => {},
  onMapWheel,
  onHoverPreview,
  onHoverFullVisualPass,
  onMapViewRender,
  onContextReset,
  getMapView,
  getWorldWrapEnabled,
  panMapView,
  recordRenderStat,
  samplePanSvgNodeCount,
  debugRenderStats = false,
} = {}) {
  let bound = false;
  let destroyed = false;
  let resizeObserver = null;
  let hoverPreviewFrame = 0;
  let pendingHoverNation = '';
  let hoverFullVisualPassFrame = 0;
  let mapViewFrame = 0;
  let pendingMapViewRenderContext = null;

  const tooltip = createTooltipController({window, svgWrap, tip});
  const pan = createMapPanController({
    svg,
    window,
    getMapView,
    getWorldWrapEnabled,
    panMapView,
    scheduleMapViewRender,
    recordRenderStat,
    samplePanSvgNodeCount,
    onPanHoverRefresh: refreshPanHoverFromClientPoint,
    debugRenderStats,
  });

  function resolveHitRegion(event, related = false) {
    const context = getContext() || {};
    const target = related ? event?.relatedTarget : event?.target;
    const hitTarget = target?.closest?.('[data-region-id], [data-region]');
    if (!hitTarget || !hitLayer?.contains?.(hitTarget)) return null;
    const regionName = hitTarget.dataset.regionId || hitTarget.dataset.region;
    return context.regionByName?.[regionName] || null;
  }

  function hitRegionElementFromClientPoint(clientX, clientY) {
    const elements = document?.elementsFromPoint?.(clientX, clientY)
      || [document?.elementFromPoint?.(clientX, clientY)].filter(Boolean);
    for (const element of elements) {
      const hit = element?.closest?.('.region-hit[data-region-id], .region-hit[data-region]');
      if (hit && hitLayer?.contains?.(hit)) return hit;
    }
    return null;
  }

  function refreshPanHoverFromClientPoint(clientX, clientY) {
    const hit = hitRegionElementFromClientPoint(clientX, clientY);
    if (!hit) {
      onBlankMapMove?.();
      return;
    }
    const context = getContext() || {};
    const regionName = hit.dataset.regionId || hit.dataset.region;
    const region = context.regionByName?.[regionName];
    if (region) onRegionMove?.({clientX, clientY, target: hit}, region);
  }

  function onHitLayerPointerOver(event) {
    if (pan.shouldSuppressHitLayerPointerEvent(event)) return;
    const region = resolveHitRegion(event);
    if (!region) return;
    const previousRegion = resolveHitRegion(event, true);
    if (previousRegion?.regionName === region.regionName) return;
    onRegionEnter?.(event, region, {force: !previousRegion});
  }

  function onHitLayerPointerMove(event) {
    if (pan.shouldSuppressHitLayerPointerEvent(event)) return;
    const region = resolveHitRegion(event);
    if (region) onRegionMove?.(event, region);
  }

  function onHitLayerPointerOut(event) {
    if (pan.shouldSuppressHitLayerPointerEvent(event)) return;
    const region = resolveHitRegion(event);
    if (!region || resolveHitRegion(event, true)) return;
    onRegionLeave?.(event, region);
  }

  function onHitLayerClick(event) {
    if (pan.consumeSuppressedMapClick(event)) return;
    const region = resolveHitRegion(event);
    if (!region) return;
    event.stopPropagation?.();
    onRegionClick?.(event, region);
  }

  function onSvgMouseMove(event) {
    if (pan.isDragging()) return;
    const target = event.target;
    if (target?.classList?.contains('region') || target?.classList?.contains('region-hit')) return;
    const isBlankMap = target === svg
      || target === gridLayer
      || target === hitLayer
      || target?.classList?.contains('graticule');
    if (isBlankMap) onBlankMapMove?.(event);
  }

  function onSvgClick(event) {
    if (pan.consumeSuppressedMapClick(event)) return;
    const target = event.target;
    if (
      target === svg
      || target === gridLayer
      || target === hitLayer
      || target?.classList?.contains('graticule')
    ) {
      onBlankMapClick?.(event);
    }
  }

  function onSvgWheel(event) {
    onMapWheel?.(event);
  }

  function invalidateTooltipLayout() {
    tooltip.invalidateLayout();
  }

  function cancelHoverPreview() {
    if (hoverPreviewFrame) {
      window.cancelAnimationFrame(hoverPreviewFrame);
      hoverPreviewFrame = 0;
    }
    pendingHoverNation = '';
  }

  function scheduleHoverPreview(nation) {
    pendingHoverNation = nation || '';
    if (hoverPreviewFrame) return;
    hoverPreviewFrame = window.requestAnimationFrame(() => {
      hoverPreviewFrame = 0;
      const nextNation = pendingHoverNation;
      pendingHoverNation = '';
      if (nextNation) onHoverPreview?.(nextNation);
    });
  }

  function cancelHoverFullVisualPass() {
    if (!hoverFullVisualPassFrame) return;
    window.cancelAnimationFrame(hoverFullVisualPassFrame);
    hoverFullVisualPassFrame = 0;
  }

  function scheduleHoverFullVisualPass() {
    if (hoverFullVisualPassFrame) return;
    hoverFullVisualPassFrame = window.requestAnimationFrame(() => {
      hoverFullVisualPassFrame = 0;
      onHoverFullVisualPass?.();
    });
  }

  function cancelMapViewRender() {
    if (mapViewFrame) {
      window.cancelAnimationFrame(mapViewFrame);
      mapViewFrame = 0;
    }
    pendingMapViewRenderContext = null;
  }

  function scheduleMapViewRender(renderContext = {}) {
    if (renderContext.isPan) {
      pendingMapViewRenderContext = {
        isPan: true,
        scheduledAt: Number.isFinite(Number(renderContext.scheduledAt))
          ? Number(renderContext.scheduledAt)
          : performance.now(),
      };
    } else if (!pendingMapViewRenderContext) {
      pendingMapViewRenderContext = renderContext;
    }
    if (mapViewFrame) return;
    mapViewFrame = window.requestAnimationFrame(() => {
      const context = pendingMapViewRenderContext || {};
      pendingMapViewRenderContext = null;
      mapViewFrame = 0;
      onMapViewRender?.(context);
    });
  }

  function bind() {
    if (bound || destroyed) return;
    bound = true;
    hitLayer?.addEventListener('pointerover', onHitLayerPointerOver);
    hitLayer?.addEventListener('pointermove', onHitLayerPointerMove);
    hitLayer?.addEventListener('pointerout', onHitLayerPointerOut);
    hitLayer?.addEventListener('click', onHitLayerClick);
    svg?.addEventListener('pointerdown', pan.onPointerDown);
    svg?.addEventListener('pointermove', pan.onPointerMove);
    svg?.addEventListener('pointerup', pan.onPointerUp);
    svg?.addEventListener('pointercancel', pan.onPointerCancel);
    svg?.addEventListener('lostpointercapture', pan.onLostPointerCapture);
    svg?.addEventListener('mousemove', onSvgMouseMove);
    svg?.addEventListener('wheel', onSvgWheel, WHEEL_LISTENER_OPTIONS);
    svg?.addEventListener('click', onSvgClick);
    svg?.addEventListener('mouseleave', onMapLeave);
    window?.addEventListener('resize', invalidateTooltipLayout);
    window?.addEventListener('scroll', invalidateTooltipLayout, true);
    if (window?.ResizeObserver && svgWrap) {
      resizeObserver = new window.ResizeObserver(invalidateTooltipLayout);
      resizeObserver.observe(svgWrap);
    }
  }

  function resetContext() {
    cancelHoverPreview();
    cancelHoverFullVisualPass();
    cancelMapViewRender();
    pan.reset();
    tooltip.reset();
    onContextReset?.();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    resetContext();
    if (bound) {
      bound = false;
      hitLayer?.removeEventListener('pointerover', onHitLayerPointerOver);
      hitLayer?.removeEventListener('pointermove', onHitLayerPointerMove);
      hitLayer?.removeEventListener('pointerout', onHitLayerPointerOut);
      hitLayer?.removeEventListener('click', onHitLayerClick);
      svg?.removeEventListener('pointerdown', pan.onPointerDown);
      svg?.removeEventListener('pointermove', pan.onPointerMove);
      svg?.removeEventListener('pointerup', pan.onPointerUp);
      svg?.removeEventListener('pointercancel', pan.onPointerCancel);
      svg?.removeEventListener('lostpointercapture', pan.onLostPointerCapture);
      svg?.removeEventListener('mousemove', onSvgMouseMove);
      svg?.removeEventListener('wheel', onSvgWheel, WHEEL_LISTENER_OPTIONS);
      svg?.removeEventListener('click', onSvgClick);
      svg?.removeEventListener('mouseleave', onMapLeave);
      window?.removeEventListener('resize', invalidateTooltipLayout);
      window?.removeEventListener('scroll', invalidateTooltipLayout, true);
    }
    resizeObserver?.disconnect();
    resizeObserver = null;
    pan.destroy();
    tooltip.destroy();
  }

  return {
    bind,
    cancelHoverPreview,
    currentTooltipRegionId: tooltip.currentRegionId,
    destroy,
    hasActiveTooltip: tooltip.hasActiveTooltip,
    hideTooltip: tooltip.hide,
    invalidateTooltipLayout: tooltip.invalidateLayout,
    resetContext,
    scheduleHoverFullVisualPass,
    scheduleHoverPreview,
    showTooltip: tooltip.show,
  };
}
