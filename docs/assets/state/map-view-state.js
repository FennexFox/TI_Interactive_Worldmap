// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const MAX_MAP_ZOOM = 8;

function viewBoxNumbers(activeData) {
  const viewBox = activeData?.regionMap?.summary?.viewBox || [];
  const [x = 0, y = 0, width = 0, height = 0] = viewBox.map(value => finiteNumber(value));
  return {x, y, width, height};
}

export function createMapViewState(values = {}) {
  const x = finiteNumber(values.x);
  const y = finiteNumber(values.y);
  const width = finiteNumber(values.width);
  const height = finiteNumber(values.height);
  return {
    x,
    y,
    width,
    height,
    worldWidth: finiteNumber(values.worldWidth, width),
    boundsX: finiteNumber(values.boundsX, x),
    boundsY: finiteNumber(values.boundsY, y),
    boundsWidth: finiteNumber(values.boundsWidth, width),
    boundsHeight: finiteNumber(values.boundsHeight, height),
  };
}

export function initializeMapView(activeData, target = createMapViewState()) {
  const {x, y, width, height} = viewBoxNumbers(activeData);
  target.x = x;
  target.y = y;
  target.width = width;
  target.height = height;
  target.worldWidth = width;
  target.boundsX = x;
  target.boundsY = y;
  target.boundsWidth = width;
  target.boundsHeight = height;
  return target;
}

export function normalizeWrappedX(x, mapView = {}) {
  const value = finiteNumber(x);
  const worldWidth = Math.abs(finiteNumber(mapView.worldWidth));
  if (!worldWidth) return value;
  const baseX = finiteNumber(mapView.boundsX);
  const offset = value - baseX;
  const wholeWorlds = Math.floor((offset + worldWidth / 2) / worldWidth);
  return baseX + offset - wholeWorlds * worldWidth;
}

export function clampMapViewX(x, mapView = {}) {
  const value = finiteNumber(x);
  const boundsX = finiteNumber(mapView.boundsX);
  const boundsWidth = Math.abs(finiteNumber(mapView.boundsWidth));
  const width = Math.abs(finiteNumber(mapView.width));
  if (!boundsWidth || !width) return value;
  if (width >= boundsWidth) return boundsX;
  const maxX = boundsX + boundsWidth - width;
  return Math.min(maxX, Math.max(boundsX, value));
}

export function clampMapViewY(y, mapView = {}) {
  const value = finiteNumber(y);
  const boundsY = finiteNumber(mapView.boundsY);
  const boundsHeight = Math.abs(finiteNumber(mapView.boundsHeight));
  const height = Math.abs(finiteNumber(mapView.height));
  if (!boundsHeight || !height) return value;
  if (height >= boundsHeight) return boundsY;
  const maxY = boundsY + boundsHeight - height;
  return Math.min(maxY, Math.max(boundsY, value));
}

export function panMapView(mapView, {dx = 0, dy = 0, normalizeX = true} = {}) {
  if (!mapView) return mapView;
  const nextX = finiteNumber(mapView.x) + finiteNumber(dx);
  mapView.x = normalizeX ? normalizeWrappedX(nextX, mapView) : clampMapViewX(nextX, mapView);
  mapView.y = clampMapViewY(finiteNumber(mapView.y) + finiteNumber(dy), mapView);
  return mapView;
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

export function zoomMapView(mapView, options = {}) {
  if (!mapView) return mapView;

  const currentWidth = Math.abs(finiteNumber(mapView.width, 1)) || 1;
  const currentHeight = Math.abs(finiteNumber(mapView.height, 1)) || 1;
  const baseWidth = Math.abs(finiteNumber(mapView.boundsWidth, finiteNumber(mapView.worldWidth, currentWidth))) || currentWidth;
  const baseHeight = Math.abs(finiteNumber(mapView.boundsHeight, currentHeight)) || currentHeight;
  const minWidth = Math.max(baseWidth / MAX_MAP_ZOOM, 0.000001);
  const minHeight = Math.max(baseHeight / MAX_MAP_ZOOM, 0.000001);

  const requestedScale = Number(options.scale);
  const scale = Number.isFinite(requestedScale) && requestedScale > 0 ? requestedScale : 1;

  let nextWidth = currentWidth * scale;
  let nextHeight = currentHeight * scale;

  if (nextWidth > baseWidth || nextHeight > baseHeight) {
    const fitScale = Math.min(baseWidth / nextWidth, baseHeight / nextHeight);
    nextWidth *= fitScale;
    nextHeight *= fitScale;
  }

  if (nextWidth < minWidth || nextHeight < minHeight) {
    const fitScale = Math.max(minWidth / nextWidth, minHeight / nextHeight);
    nextWidth *= fitScale;
    nextHeight *= fitScale;
  }

  nextWidth = clampNumber(nextWidth, minWidth, baseWidth);
  nextHeight = clampNumber(nextHeight, minHeight, baseHeight);

  const anchorX = Number.isFinite(Number(options.anchorX)) ? Number(options.anchorX) : mapView.x + currentWidth / 2;
  const anchorY = Number.isFinite(Number(options.anchorY)) ? Number(options.anchorY) : mapView.y + currentHeight / 2;
  const relativeX = currentWidth ? (anchorX - mapView.x) / currentWidth : 0.5;
  const relativeY = currentHeight ? (anchorY - mapView.y) / currentHeight : 0.5;

  mapView.width = nextWidth;
  mapView.height = nextHeight;
  const nextX = anchorX - relativeX * nextWidth;
  mapView.x = options.normalizeX === false
    ? clampMapViewX(nextX, mapView)
    : normalizeWrappedX(nextX, mapView);
  mapView.y = clampMapViewY(anchorY - relativeY * nextHeight, mapView);
  return mapView;
}

export function viewBoxForMapView(mapView = {}) {
  return [
    finiteNumber(mapView.x),
    finiteNumber(mapView.y),
    finiteNumber(mapView.width),
    finiteNumber(mapView.height),
  ];
}

function formatViewBoxNumber(value) {
  const number = finiteNumber(value);
  const fixed = number.toFixed(9).replace(/\.?0+$/, '');
  return fixed === '-0' ? '0' : fixed;
}

export function formatViewBoxForMapView(mapView = {}) {
  return viewBoxForMapView(mapView).map(formatViewBoxNumber).join(' ');
}
