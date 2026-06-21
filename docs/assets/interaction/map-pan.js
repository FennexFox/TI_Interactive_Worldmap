// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function createMapPanController({
  svg,
  window,
  thresholdPx = 4,
  getMapView,
  getWorldWrapEnabled,
  panMapView,
  scheduleMapViewRender,
  recordRenderStat,
  samplePanSvgNodeCount,
  onPanHoverRefresh,
  debugRenderStats = false,
} = {}) {
  let mapPanState = null;
  let suppressMapClick = false;
  let panHoverRefreshFrame = 0;
  let pendingPanHoverPoint = null;

  function measurePanViewportRect() {
    recordRenderStat?.('panSvgRectReads');
    return svg?.getBoundingClientRect();
  }

  function viewDeltaFromPointerDelta(deltaX, deltaY, rect = null) {
    const viewportRect = rect || measurePanViewportRect();
    const mapView = getMapView?.();
    if (!viewportRect?.width || !viewportRect?.height || !mapView) return {dx: 0, dy: 0};
    return {
      dx: -(deltaX * mapView.width) / viewportRect.width,
      dy: -(deltaY * mapView.height) / viewportRect.height,
    };
  }

  function schedulePanHoverRefresh(clientX, clientY) {
    pendingPanHoverPoint = {clientX, clientY};
    if (panHoverRefreshFrame) return;
    panHoverRefreshFrame = window.requestAnimationFrame(() => {
      panHoverRefreshFrame = 0;
      const point = pendingPanHoverPoint;
      pendingPanHoverPoint = null;
      if (!point) return;
      onPanHoverRefresh?.(point.clientX, point.clientY);
    });
  }

  function markSuppressNextMapClick() {
    suppressMapClick = true;
    window.setTimeout(() => {
      suppressMapClick = false;
    }, 80);
  }

  function consumeSuppressedMapClick(event) {
    if (!suppressMapClick) return false;
    suppressMapClick = false;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    return true;
  }

  function finishMapPan({cancel = false} = {}) {
    if (!mapPanState) return;
    const wasDragging = mapPanState.dragging;
    const pointerId = mapPanState.pointerId;
    const finalClientX = mapPanState.lastX;
    const finalClientY = mapPanState.lastY;
    mapPanState = null;
    svg?.classList.remove('is-panning-ready', 'is-panning');
    try {
      if (svg?.hasPointerCapture?.(pointerId)) svg.releasePointerCapture(pointerId);
    } catch {}
    if (!cancel && wasDragging) {
      markSuppressNextMapClick();
      schedulePanHoverRefresh(finalClientX, finalClientY);
    }
  }

  function shouldSuppressHitLayerPointerEvent(event) {
    if (!mapPanState || event.pointerId !== mapPanState.pointerId) return false;
    if (mapPanState.dragging) return true;
    return Math.hypot(event.clientX - mapPanState.startX, event.clientY - mapPanState.startY) >= thresholdPx;
  }

  function onPointerDown(event) {
    if (event.button !== 0 || mapPanState) return;
    mapPanState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      dragging: false,
      viewportRect: null,
    };
    svg?.classList.add('is-panning-ready');
  }

  function onPointerMove(event) {
    if (!mapPanState || event.pointerId !== mapPanState.pointerId) return;
    const totalX = event.clientX - mapPanState.startX;
    const totalY = event.clientY - mapPanState.startY;
    if (!mapPanState.dragging && Math.hypot(totalX, totalY) < thresholdPx) return;
    if (!mapPanState.dragging) {
      mapPanState.dragging = true;
      mapPanState.viewportRect = measurePanViewportRect();
      samplePanSvgNodeCount?.();
      svg?.classList.add('is-panning');
      try {
        svg?.setPointerCapture?.(event.pointerId);
      } catch {}
    }
    event.preventDefault();
    recordRenderStat?.('panPointerMoveCount');
    const scheduledAt = debugRenderStats ? performance.now() : 0;
    const {dx, dy} = viewDeltaFromPointerDelta(
      event.clientX - mapPanState.lastX,
      event.clientY - mapPanState.lastY,
      mapPanState.viewportRect
    );
    const mapView = getMapView?.();
    if (mapView) {
      panMapView?.(mapView, {dx, dy, normalizeX: !!getWorldWrapEnabled?.()});
    }
    mapPanState.lastX = event.clientX;
    mapPanState.lastY = event.clientY;
    scheduleMapViewRender?.({isPan: true, scheduledAt});
  }

  function onPointerUp(event) {
    if (!mapPanState || event.pointerId !== mapPanState.pointerId) return;
    if (mapPanState.dragging) event.preventDefault();
    finishMapPan();
  }

  function onPointerCancel(event) {
    if (!mapPanState || event.pointerId !== mapPanState.pointerId) return;
    finishMapPan({cancel: true});
  }

  function onLostPointerCapture(event) {
    if (!mapPanState || event.pointerId !== mapPanState.pointerId) return;
    finishMapPan({cancel: true});
  }

  return {
    consumeSuppressedMapClick,
    isDragging: () => !!mapPanState?.dragging,
    onLostPointerCapture,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    shouldSuppressHitLayerPointerEvent,
  };
}
