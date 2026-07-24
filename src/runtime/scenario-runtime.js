// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {buildDerivedIndices} from '../data/derived-indices.js';

export function createScenarioRuntime(activeData, {buildIndices = buildDerivedIndices} = {}) {
  const indices = buildIndices(activeData || {});
  return Object.freeze({
    activeData: activeData || {},
    indices,
    regions: indices.regions,
    summary: indices.summary,
    nationColorPalette: indices.nationColorPalette,
    nationColorIndexes: indices.nationColorIndexes,
    claimsByNation: indices.claimsByNation,
    projectMeta: indices.projectMeta,
    claimStats: indices.claimStats,
    nationCatalog: indices.nationCatalog,
    nationMeta: indices.nationMeta,
    regionByName: indices.regionByName,
    nationRegions: indices.nationRegions,
    capitalNationsByRegion: indices.capitalNationsByRegion,
    incomingClaimsByRegion: indices.incomingClaimsByRegion,
  });
}
