// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function uniqueSorted(values) {
  return [...new Set(values || [])].filter(Boolean).sort();
}

export function createClaimIncomingOverlayModel({
  claimsByNation,
  claimMode,
  activeIncomingClaimKey,
  selectedRegionIds,
  incomingClaimsByRegion,
  dataForNation,
  regionListForNation,
  projectLabel,
  projectSortLabel,
  sortedProjectEntries,
  countryProjectTierMap,
  isExcludedSystemClaim,
  claimEffectiveHostile,
  filterEntryByClaimKind,
  entryFilterValue,
  cumulativeClaimEntries,
  getVisibleProjectEntries,
}) {
  function buildIncomingClaimIndex() {
    const index = new Map();
    for (const [claimant, data] of Object.entries(claimsByNation())) {
      const claimantBaseRegions = uniqueSorted(data.baseRegions || regionListForNation(claimant));
      const directEntries = sortedProjectEntries(data.projects || []);
      const cumulativeByKey = new Map(
        cumulativeClaimEntries(directEntries).map(entry => [entryFilterValue(entry), entry]),
      );
      for (const entry of directEntries) {
        const label = entry.label || projectLabel(entry.project);
        if (isExcludedSystemClaim(claimant, entry.project, label)) continue;
        const entryRegions = uniqueSorted(entry.regions || []);
        const directEntryClaims = entry.claims || {};
        const cumulative = cumulativeByKey.get(entryFilterValue(entry)) || entry;
        const cumulativeRegions = uniqueSorted(cumulative.regions || entryRegions);
        const cumulativeClaims = cumulative.claims || directEntryClaims;
        const resultRegions = uniqueSorted([...claimantBaseRegions, ...cumulativeRegions]);
        const resultClaimRegions = cumulativeRegions.filter(regionName => !claimantBaseRegions.includes(regionName));
        for (const regionName of entryRegions) {
          if (!index.has(regionName)) index.set(regionName, []);
          index.get(regionName).push({
            claimant,
            project: entry.project || '',
            label,
            region: regionName,
            claim: cumulativeClaims?.[regionName] || directEntryClaims?.[regionName] || {},
            claimantBaseRegions,
            entryRegions,
            entryClaims: cumulativeClaims,
            resultRegions,
            resultClaimRegions,
            resultRegionSourceLabels: cumulative.regionSourceLabels || {},
          });
        }
      }
    }
    return index;
  }

  function incomingTargetRegions(data, baseSet) {
    const selected = [...(selectedRegionIds() || [])].filter(Boolean);
    if (selected.length) return new Set(selected);
    const targetRegions = new Set(baseSet);
    if (!targetRegions.size) {
      for (const regionName of data.capitalRegions || []) targetRegions.add(regionName);
      for (const regionName of data.gatedRegions || []) targetRegions.add(regionName);
    }
    return targetRegions;
  }

  function outgoingClaimKey(item) {
    return item?.project || '__base__';
  }

  function incomingClaimKey(item) {
    return `${item?.claimant || ''}|${item?.project || '__base__'}`;
  }

  function selectedIncomingEntry(entries) {
    const key = activeIncomingClaimKey();
    return key ? (entries || []).find(entry => incomingClaimKey(entry) === key) || null : null;
  }

  function incomingClaimsForTarget(targetNation, data, baseSet) {
    const grouped = new Map();
    for (const regionName of incomingTargetRegions(data, baseSet)) {
      for (const item of incomingClaimsByRegion().get(regionName) || []) {
        if (item.claimant === targetNation) continue;
        const key = incomingClaimKey(item);
        if (!grouped.has(key)) {
          grouped.set(key, {
            ...item,
            key,
            targetRegions: [],
            regions: [],
            claims: {},
            targetClaims: {},
            hostile: 0,
            gated: 0,
            capital: 0,
          });
        }
        const group = grouped.get(key);
        if (!group.targetRegions.includes(regionName)) group.targetRegions.push(regionName);
        group.targetClaims[regionName] = item.claim || {};
        if (claimEffectiveHostile(item.claim)) group.hostile += 1;
        if (item.claim?.gatedClaim) group.gated += 1;
        if (item.claim?.capitalClaim) group.capital += 1;
        group.regions = uniqueSorted(item.resultClaimRegions || item.entryRegions || []);
        group.claims = item.entryClaims || {};
        group.resultRegions = uniqueSorted(item.resultRegions || item.entryRegions || []);
        group.claimantBaseRegions = uniqueSorted(item.claimantBaseRegions || []);
        group.regionSourceLabels = item.resultRegionSourceLabels || {};
      }
    }
    return [...grouped.values()].sort((left, right) => (
      left.claimant.localeCompare(right.claimant)
      || projectSortLabel(left.project).localeCompare(projectSortLabel(right.project))
    ));
  }

  function buildNationOverlayModel(activeData, indices, nationId, options = {}) {
    const nation = nationId || '';
    const data = dataForNation(nation) || {
      nation,
      baseRegions: regionListForNation(nation),
      projects: [],
      totalClaimRegions: 0,
      projectCount: 0,
    };
    const baseSet = new Set(data.baseRegions || regionListForNation(nation));
    const tierByProject = countryProjectTierMap(nation, baseSet);
    const rawEntries = sortedProjectEntries(data.projects || []);
    const directEntries = rawEntries.map(filterEntryByClaimKind).filter(entry => entry.regions.length);
    const cumulativeEntries = cumulativeClaimEntries(rawEntries);
    const allEntries = getVisibleProjectEntries(nation);
    const outgoingEntries = cumulativeEntries
      .map(filterEntryByClaimKind)
      .map(entry => ({...entry, regions: (entry.regions || []).filter(regionName => !baseSet.has(regionName))}))
      .filter(entry => entry.regions.length);
    const incomingEntries = incomingClaimsForTarget(nation, data, baseSet);
    let activeIncoming = selectedIncomingEntry(incomingEntries);
    const currentIncomingKey = activeIncomingClaimKey();
    const nextActiveIncomingClaimKey = currentIncomingKey && !activeIncoming ? '' : currentIncomingKey;
    if (!nextActiveIncomingClaimKey) activeIncoming = null;
    const displayBaseSet = activeIncoming ? new Set(activeIncoming.claimantBaseRegions || []) : baseSet;
    const entries = activeIncoming ? [activeIncoming] : allEntries;
    const claimSet = new Set();
    entries.forEach(entry => entry.regions.forEach(regionName => {
      if (!displayBaseSet.has(regionName)) claimSet.add(regionName);
    }));
    const resultSet = activeIncoming
      ? new Set([...(activeIncoming.resultRegions || []), ...(activeIncoming.claimantBaseRegions || [])])
      : new Set([...displayBaseSet, ...claimSet]);
    return {
      activeData,
      indices,
      options,
      nation,
      data,
      baseSet,
      tierByProject,
      directEntries,
      cumulativeEntries,
      allEntries,
      outgoingEntries,
      incomingEntries,
      activeIncoming,
      activeIncomingClaimKey: nextActiveIncomingClaimKey,
      displayBaseSet,
      entries,
      claimSet,
      resultSet,
      ownedCount: displayBaseSet.size,
      claimCount: claimSet.size,
      projectCount: entries.filter(entry => (
        entry.project && (entry.regions || []).some(regionName => !displayBaseSet.has(regionName))
      )).length,
      hasClaimOverlay: claimMode() !== 'off' && (displayBaseSet.size > 0 || claimSet.size > 0),
      gatedCount: (data.gatedRegions || []).length,
    };
  }

  function visibleClaimRegionsForEntry(entry, model) {
    return (entry.regions || []).filter(regionName => !model.displayBaseSet.has(regionName));
  }

  return Object.freeze({
    buildIncomingClaimIndex,
    incomingTargetRegions,
    outgoingClaimKey,
    incomingClaimKey,
    selectedIncomingEntry,
    incomingClaimsForTarget,
    buildNationOverlayModel,
    visibleClaimRegionsForEntry,
  });
}
