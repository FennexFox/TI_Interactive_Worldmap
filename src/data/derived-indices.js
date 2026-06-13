function normalizeId(value) {
  return String(value || '');
}

function buildCapitalNationsByRegion(claimsByNation, regionByName, nationRegions) {
  const capitalNationsByRegion = new Map();
  for (const [nationId, data] of Object.entries(claimsByNation || {})) {
    for (const regionId of data?.capitalRegions || []) {
      if (!regionByName[regionId]) continue;
      if (!capitalNationsByRegion.has(regionId)) capitalNationsByRegion.set(regionId, []);
      capitalNationsByRegion.get(regionId).push(nationId);
    }
  }

  for (const [regionId, nationIds] of capitalNationsByRegion) {
    const sorted = [...new Set(nationIds)].sort((a, b) => {
      const aTerritory = nationRegions.get(a)?.length || 0;
      const bTerritory = nationRegions.get(b)?.length || 0;
      if (!!aTerritory !== !!bTerritory) return aTerritory ? -1 : 1;
      return a.localeCompare(b);
    });
    capitalNationsByRegion.set(regionId, sorted);
  }
  return capitalNationsByRegion;
}

function overlayResultSetContains(selectedOverlayModel, regionId) {
  const resultSet = selectedOverlayModel?.resultSet;
  if (!resultSet || !regionId) return false;
  if (resultSet instanceof Set) return resultSet.has(regionId);
  if (Array.isArray(resultSet)) return resultSet.includes(regionId);
  return !!resultSet[regionId];
}

function hasDisplayableTerritory(indices, nationId) {
  const territory = indices?.nationRegions?.get?.(nationId) || [];
  return territory.some(regionId => !!indices?.regionByName?.[regionId]);
}

export function resolveSecondaryCapitalPreview({
  activeData = null,
  indices,
  selectedNationId = '',
  hoveredRegionId = '',
  selectedOverlayModel = null,
} = {}) {
  const selectedNation = normalizeId(selectedNationId);
  const hoveredRegion = normalizeId(hoveredRegionId);
  if (!activeData || !indices || !selectedNation || !hoveredRegion || !selectedOverlayModel?.hasClaimOverlay) return null;
  if (!overlayResultSetContains(selectedOverlayModel, hoveredRegion)) return null;
  const candidateNations = indices.capitalNationsByRegion?.get?.(hoveredRegion) || [];
  for (const candidateNation of candidateNations) {
    if (!candidateNation || candidateNation === selectedNation) continue;
    if (!hasDisplayableTerritory(indices, candidateNation)) continue;
    // Deterministic MVP behavior: displayable current-territory nations are sorted
    // first when the capital index is built; remaining ties use stable tag order.
    return candidateNation;
  }
  return null;
}

export function buildDerivedIndices(activeData) {
  const activeRegionMap = activeData.regionMap || {regions: [], summary: {}};
  const activeClaimMap = activeData.claimMap || {};
  const activeCatalogs = activeData.catalogs || {};
  const regions = activeRegionMap.regions || [];
  const summary = activeRegionMap.summary || {};
  const claimsByNation = activeClaimMap.claimsByNation || {};
  const projectMeta = activeClaimMap.projects || {};
  const claimStats = activeClaimMap.claimStats || {};
  const nationCatalog = activeCatalogs.nations || {};
  const nationMeta = {...(activeClaimMap.nationMeta || {}), ...((nationCatalog && nationCatalog.nations) || {})};
  const nationRegions = new Map();
  for (const region of regions) {
    if (!nationRegions.has(region.nationTag)) nationRegions.set(region.nationTag, []);
    nationRegions.get(region.nationTag).push(region.regionName);
  }
  const regionByName = Object.fromEntries(regions.map(region => [region.regionName, region]));
  const capitalNationsByRegion = buildCapitalNationsByRegion(claimsByNation, regionByName, nationRegions);
  return {
    regionMap: activeRegionMap,
    claimMap: activeClaimMap,
    catalogs: activeCatalogs,
    regions,
    summary,
    nationColorPalette: summary.nationColorPalette || [],
    nationColorIndexes: summary.nationColorIndexes || {},
    claimsByNation,
    projectMeta,
    claimStats,
    nationCatalog,
    nationMeta,
    regionByName,
    nationRegions,
    capitalNationsByRegion,
    incomingClaimsByRegion: new Map(),
    nationChoices: [],
    regionChoices: [],
  };
}
