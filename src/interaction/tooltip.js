// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function createTooltipController({
  window,
  svgWrap,
  tip,
  defaultWidth = 160,
  defaultHeight = 26,
  margin = 8,
  offset = 10,
} = {}) {
  let regionId = null;
  let svgWrapRectCache = null;
  let tooltipSizeCache = {width: defaultWidth, height: defaultHeight, valid: false};
  let tooltipFrame = 0;
  let pendingTooltipPoint = null;

  function invalidateLayout() {
    svgWrapRectCache = null;
    tooltipSizeCache.valid = false;
  }

  function svgWrapRect() {
    if (!svgWrapRectCache) svgWrapRectCache = svgWrap.getBoundingClientRect();
    return svgWrapRectCache;
  }

  function measureTooltipSize() {
    if (tooltipSizeCache.valid) return tooltipSizeCache;
    tip.classList.add('visible');
    tooltipSizeCache = {
      width: tip.offsetWidth || defaultWidth,
      height: tip.offsetHeight || defaultHeight,
      valid: true,
    };
    return tooltipSizeCache;
  }

  function applyPosition() {
    tooltipFrame = 0;
    if (!pendingTooltipPoint) return;
    const {clientX, clientY} = pendingTooltipPoint;
    const rect = svgWrapRect();
    const {width, height} = measureTooltipSize();
    const x = Math.max(margin, Math.min(rect.width - width - margin, clientX - rect.left + offset));
    const y = Math.max(margin, Math.min(rect.height - height - margin, clientY - rect.top + offset));
    tip.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    tip.classList.add('visible');
  }

  function schedulePosition(event) {
    pendingTooltipPoint = {clientX: event.clientX, clientY: event.clientY};
    if (!tooltipFrame) tooltipFrame = window.requestAnimationFrame(applyPosition);
  }

  function hide() {
    pendingTooltipPoint = null;
    regionId = null;
    if (tooltipFrame) {
      window.cancelAnimationFrame(tooltipFrame);
      tooltipFrame = 0;
    }
    tip.classList.remove('visible');
  }

  function show(event, nextRegionId, text) {
    if (regionId !== nextRegionId) {
      tip.textContent = text;
      regionId = nextRegionId;
      tooltipSizeCache.valid = false;
    }
    schedulePosition(event);
  }

  return {
    currentRegionId: () => regionId,
    hasActiveTooltip: () => regionId != null || !!pendingTooltipPoint,
    hide,
    invalidateLayout,
    show,
  };
}
