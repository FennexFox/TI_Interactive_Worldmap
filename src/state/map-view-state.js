function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

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
  mapView.x = normalizeX ? normalizeWrappedX(nextX, mapView) : nextX;
  mapView.y = clampMapViewY(finiteNumber(mapView.y) + finiteNumber(dy), mapView);
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

