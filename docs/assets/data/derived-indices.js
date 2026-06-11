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
    regionByName: Object.fromEntries(regions.map(region => [region.regionName, region])),
    nationRegions,
    incomingClaimsByRegion: new Map(),
    nationChoices: [],
    regionChoices: [],
  };
}
