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

export function applyMapVisualState(renderContext = {}, mapVisualState) {
  const regionPaths = renderContext.regionPathElements || [];
  for (const path of regionPaths) {
    const regionId = path.dataset.region;
    path.classList.toggle('selected', mapVisualState.selectedRegionIds.has(regionId));
    path.classList.toggle('owned-highlight', mapVisualState.ownedRegionIds.has(regionId));
    path.classList.toggle('claim-target', mapVisualState.claimTargetRegionIds.has(regionId));
    path.classList.toggle('hovered', mapVisualState.hoverRegionIds.has(regionId));
    path.classList.toggle('dimmed', mapVisualState.dimmedRegionIds.has(regionId));
    path.classList.toggle('hidden', mapVisualState.hiddenRegionIds.has(regionId));
  }
  const hitPaths = renderContext.hitPathByRegion || new Map();
  for (const [regionId, hitPath] of hitPaths) {
    hitPath.classList.toggle('hidden', mapVisualState.hiddenRegionIds.has(regionId));
  }
  renderContext.svg?.classList.toggle('claims-active', !!mapVisualState.hasClaimOverlay);
}
