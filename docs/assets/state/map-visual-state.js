export function createMapVisualState() {
  return {
    selectedRegionIds: new Set(),
    ownedRegionIds: new Set(),
    claimTargetRegionIds: new Set(),
    hoverRegionIds: new Set(),
    dimmedRegionIds: new Set(),
    hiddenRegionIds: new Set(),
    hasClaimOverlay: false,
  };
}

export function replaceSetContents(targetSet, values = []) {
  targetSet.clear();
  for (const value of values || []) {
    if (value) targetSet.add(value);
  }
}

export function syncSelectedVisualState(mapVisualState, selectedRegionIds) {
  replaceSetContents(mapVisualState.selectedRegionIds, selectedRegionIds);
}

export function setHoverVisualState(mapVisualState, regionName = '') {
  replaceSetContents(mapVisualState.hoverRegionIds, regionName ? [regionName] : []);
}

export function clearOverlayVisualState(mapVisualState) {
  replaceSetContents(mapVisualState.ownedRegionIds);
  replaceSetContents(mapVisualState.claimTargetRegionIds);
  replaceSetContents(mapVisualState.dimmedRegionIds);
  mapVisualState.hasClaimOverlay = false;
}

export function setOverlayVisualState(mapVisualState, model, fallbackRegions = []) {
  if (!model) {
    clearOverlayVisualState(mapVisualState);
    return;
  }
  replaceSetContents(mapVisualState.ownedRegionIds, model.displayBaseSet);
  replaceSetContents(mapVisualState.claimTargetRegionIds, model.claimSet);
  const regions = model.indices?.regions || fallbackRegions;
  const dimmedRegionIds = model.nation
    ? regions.map(region => region.regionName).filter(regionName => !model.resultSet.has(regionName))
    : [];
  replaceSetContents(mapVisualState.dimmedRegionIds, dimmedRegionIds);
  mapVisualState.hasClaimOverlay = !!model.hasClaimOverlay;
}

export function setHiddenVisualState(mapVisualState, hiddenRegionIds) {
  replaceSetContents(mapVisualState.hiddenRegionIds, hiddenRegionIds);
}

function applyRegionPathVisualState(path, mapVisualState, regionId = path?.dataset?.region) {
  if (!path || !regionId) return false;
  path.classList.toggle('selected', mapVisualState.selectedRegionIds.has(regionId));
  path.classList.toggle('owned-highlight', mapVisualState.ownedRegionIds.has(regionId));
  path.classList.toggle('claim-target', mapVisualState.claimTargetRegionIds.has(regionId));
  path.classList.toggle('hovered', mapVisualState.hoverRegionIds.has(regionId));
  path.classList.toggle('dimmed', mapVisualState.dimmedRegionIds.has(regionId));
  path.classList.toggle('hidden', mapVisualState.hiddenRegionIds.has(regionId));
  return true;
}

function applyHitPathVisualState(hitPath, mapVisualState, regionId) {
  if (!hitPath || !regionId) return false;
  hitPath.classList.toggle('hidden', mapVisualState.hiddenRegionIds.has(regionId));
  return true;
}

function visiblePathForRegion(renderContext, regionId) {
  const directPath = renderContext.pathByRegion?.get?.(regionId);
  if (directPath) return directPath;
  return (renderContext.regionPathElements || []).find(path => path.dataset.region === regionId) || null;
}

function uniqueRegionIds(regionIds = []) {
  return [...new Set(regionIds || [])].filter(Boolean);
}

export function applyMapVisualStateForRegions(renderContext = {}, mapVisualState, regionIds = []) {
  let visiblePathsTouched = 0;
  let hitPathsTouched = 0;
  for (const regionId of uniqueRegionIds(regionIds)) {
    if (applyRegionPathVisualState(visiblePathForRegion(renderContext, regionId), mapVisualState, regionId)) {
      visiblePathsTouched += 1;
    }
    if (applyHitPathVisualState(renderContext.hitPathByRegion?.get?.(regionId), mapVisualState, regionId)) {
      hitPathsTouched += 1;
    }
  }
  renderContext.svg?.classList.toggle('claims-active', !!mapVisualState.hasClaimOverlay);
  return {visiblePathsTouched, hitPathsTouched};
}

export function applyMapVisualState(renderContext = {}, mapVisualState) {
  let visiblePathsTouched = 0;
  for (const path of renderContext.regionPathElements || []) {
    if (applyRegionPathVisualState(path, mapVisualState)) visiblePathsTouched += 1;
  }
  const hitPaths = renderContext.hitPathByRegion || new Map();
  let hitPathsTouched = 0;
  for (const [regionId, hitPath] of hitPaths) {
    if (applyHitPathVisualState(hitPath, mapVisualState, regionId)) hitPathsTouched += 1;
  }
  renderContext.svg?.classList.toggle('claims-active', !!mapVisualState.hasClaimOverlay);
  return {visiblePathsTouched, hitPathsTouched};
}
