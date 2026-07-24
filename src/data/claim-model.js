// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {createClaimCumulativeModel} from './claim-cumulative-model.js';
import {createClaimIncomingOverlayModel} from './claim-incoming-overlay.js';
import {createClaimManualEnvelopeModel} from './claim-manual-envelope.js';
import {createClaimProjectGraph} from './claim-project-graph.js';

function defaultLabel(value) {
  return String(value || '');
}

function defaultSourceLabels(projectLabel) {
  return {
    inheritedFrom: project => `Inherited from ${projectLabel(project)}`,
    basicClaim: () => 'Basic claim',
    direct: () => 'Direct',
  };
}

export function createClaimModel({
  claimsByNation = () => ({}),
  nationRegions = () => new Map(),
  projectMeta = () => ({}),
  claimMode = () => 'all',
  claimKind = () => 'all',
  projectFilter = () => '',
  activeIncomingClaimKey = () => '',
  selectedRegionIds = () => [],
  incomingClaimsByRegion = () => new Map(),
  capitalNationsByRegion = () => new Map(),
  regionExists = () => true,
  isCapitalRegionForNation = () => false,
  projectLabel = defaultLabel,
  sourceLabels = defaultSourceLabels(projectLabel),
} = {}) {
  const dataForNation = nation => claimsByNation()[nation] || null;
  const regionListForNation = nation => nationRegions().get(nation) || [];
  const resolvedSourceLabels = {...defaultSourceLabels(projectLabel), ...(sourceLabels || {})};

  const projectGraph = createClaimProjectGraph({
    projectMeta,
    projectLabel,
    dataForNation,
    regionListForNation,
  });
  const cumulative = createClaimCumulativeModel({
    claimKind,
    claimMode,
    projectFilter,
    projectLabel,
    sourceLabels: resolvedSourceLabels,
    dataForNation,
    sortedProjectEntries: projectGraph.sortedProjectEntries,
    dependsOn: projectGraph.dependsOn,
  });
  const incomingOverlay = createClaimIncomingOverlayModel({
    claimsByNation,
    claimMode,
    activeIncomingClaimKey,
    selectedRegionIds,
    incomingClaimsByRegion,
    dataForNation,
    regionListForNation,
    projectLabel,
    projectSortLabel: projectGraph.projectSortLabel,
    sortedProjectEntries: projectGraph.sortedProjectEntries,
    countryProjectTierMap: projectGraph.countryProjectTierMap,
    isExcludedSystemClaim: projectGraph.isExcludedSystemClaim,
    claimEffectiveHostile: cumulative.claimEffectiveHostile,
    filterEntryByClaimKind: cumulative.filterEntryByClaimKind,
    entryFilterValue: cumulative.entryFilterValue,
    cumulativeClaimEntries: cumulative.cumulativeClaimEntries,
    getVisibleProjectEntries: cumulative.getVisibleProjectEntries,
  });
  const manualEnvelope = createClaimManualEnvelopeModel({
    dataForNation,
    regionListForNation,
    projectLabel,
    regionExists,
    isCapitalRegionForNation,
    capitalNationsByRegion,
    projectSortLabel: projectGraph.projectSortLabel,
    countryProjectTierMap: projectGraph.countryProjectTierMap,
    countryProjectTier: projectGraph.countryProjectTier,
    getVisibleProjectEntries: cumulative.getVisibleProjectEntries,
    getVisibleProjectEntriesForKind: cumulative.getVisibleProjectEntriesForKind,
    hostileAncestorFromClaim: cumulative.hostileAncestorFromClaim,
    claimWithEffectiveHostility: cumulative.claimWithEffectiveHostility,
    claimEffectiveHostile: cumulative.claimEffectiveHostile,
    claimKindPass: cumulative.claimKindPass,
  });

  return Object.freeze({
    ...projectGraph,
    claimEffectiveHostile: cumulative.claimEffectiveHostile,
    claimKindPass: cumulative.claimKindPass,
    entryFilterValue: cumulative.entryFilterValue,
    filterEntryByClaimKind: cumulative.filterEntryByClaimKind,
    getClaimKindFilteredProjectEntries: cumulative.getClaimKindFilteredProjectEntries,
    inheritedClaimProjectsFor: cumulative.inheritedClaimProjectsFor,
    cumulativeClaimEntry: cumulative.cumulativeClaimEntry,
    cumulativeClaimEntries: cumulative.cumulativeClaimEntries,
    getVisibleProjectEntriesForKind: cumulative.getVisibleProjectEntriesForKind,
    getVisibleProjectEntries: cumulative.getVisibleProjectEntries,
    ...incomingOverlay,
    ...manualEnvelope,
  });
}
