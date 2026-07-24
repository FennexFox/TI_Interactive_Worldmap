// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function createClaimCumulativeModel({
  claimKind,
  claimMode,
  projectFilter,
  projectLabel,
  sourceLabels,
  dataForNation,
  sortedProjectEntries,
  dependsOn,
}) {
  function claimEffectiveHostile(claim) {
    return !!(claim?.effectiveHostile ?? claim?.hostileClaim);
  }

  function hostileAncestorFromClaim(regionName, claim, source, sourceLabel, project = '') {
    if (!claimEffectiveHostile(claim)) return null;
    return {
      region: claim.hostileAncestor || regionName,
      via: claim.hostileVia || project || source || '',
      label: claim.hostileViaLabel || sourceLabel || '',
    };
  }

  function claimWithEffectiveHostility(claim, hostileAncestor = null) {
    const nextClaim = {...(claim || {})};
    if (nextClaim.hostileClaim) {
      nextClaim.effectiveHostile = true;
      nextClaim.propagatedHostile = false;
    } else if (hostileAncestor) {
      nextClaim.effectiveHostile = true;
      nextClaim.propagatedHostile = true;
      nextClaim.hostileAncestor = hostileAncestor.region || '';
      nextClaim.hostileVia = hostileAncestor.via || '';
      nextClaim.hostileViaLabel = hostileAncestor.label || '';
    } else {
      nextClaim.effectiveHostile = false;
      nextClaim.propagatedHostile = false;
    }
    return nextClaim;
  }

  function claimKindPassFor(claim, kind = claimKind()) {
    if (kind === 'hostile') return claimEffectiveHostile(claim);
    if (kind === 'peaceful') return !claimEffectiveHostile(claim);
    return true;
  }

  function claimKindPass(claim) {
    return claimKindPassFor(claim);
  }

  function entryFilterValue(entry) {
    return entry?.project || '__base__';
  }

  function filterEntryByClaimKindFor(entry, kind = claimKind()) {
    const claims = entry.claims || {};
    const regions = (entry.regions || []).filter(regionName => claimKindPassFor(claims[regionName] || {}, kind));
    const filteredClaims = Object.fromEntries(regions.map(regionName => [regionName, claims[regionName]]));
    const regionSet = new Set(regions);
    const directRegions = entry.directRegions?.filter(regionName => regionSet.has(regionName));
    const inheritedRegions = entry.inheritedRegions?.filter(regionName => regionSet.has(regionName));
    return {
      ...entry,
      regions,
      claims: filteredClaims,
      directRegions,
      inheritedRegions,
      inheritedClaimCount: inheritedRegions?.length ?? entry.inheritedClaimCount,
      directClaimCount: directRegions?.length ?? entry.directClaimCount,
    };
  }

  function filterEntryByClaimKind(entry) {
    return filterEntryByClaimKindFor(entry);
  }

  function getClaimKindFilteredProjectEntries(nation) {
    const data = dataForNation(nation);
    if (!data) return [];
    return sortedProjectEntries((data.projects || []).map(filterEntryByClaimKind).filter(entry => entry.regions.length));
  }

  function inheritedClaimProjectsFor(entry, entries) {
    if (!entry?.project) return [];
    return (entries || []).filter(candidate => (
      candidate !== entry && (!candidate.project || dependsOn(entry.project, candidate.project))
    ));
  }

  function cumulativeClaimEntry(entry, entries, cumulativeByEntry = new Map()) {
    const regions = [];
    const claims = {};
    const regionSources = {};
    const regionSourceLabels = {};
    const regionSourceProjects = {};
    const addRegion = (
      regionName,
      claim,
      source,
      sourceLabel,
      {overwrite = false, hostileAncestor = null, sourceProject = ''} = {},
    ) => {
      if (!regionName || (!overwrite && claims[regionName])) return;
      if (!claims[regionName]) regions.push(regionName);
      claims[regionName] = claimWithEffectiveHostility(claim, hostileAncestor);
      regionSources[regionName] = source;
      regionSourceLabels[regionName] = sourceLabel;
      regionSourceProjects[regionName] = sourceProject;
    };
    for (const inherited of inheritedClaimProjectsFor(entry, entries)) {
      const inheritedEntry = cumulativeByEntry.get(inherited) || inherited;
      const source = inheritedEntry.project ? 'inherited' : 'basic';
      const sourceLabel = inheritedEntry.project
        ? sourceLabels.inheritedFrom(projectLabel(inheritedEntry.project))
        : sourceLabels.basicClaim();
      for (const regionName of inheritedEntry.regions || []) {
        addRegion(regionName, inheritedEntry.claims?.[regionName], source, sourceLabel, {
          sourceProject: inheritedEntry.project || '',
        });
      }
    }
    for (const regionName of entry.regions || []) {
      const hostileAncestor = hostileAncestorFromClaim(
        regionName,
        claims[regionName],
        regionSources[regionName],
        regionSourceLabels[regionName],
        regionSourceProjects[regionName] || '',
      );
      addRegion(regionName, entry.claims?.[regionName], 'direct', sourceLabels.direct(), {
        overwrite: true,
        hostileAncestor,
      });
    }
    const directSet = new Set(entry.regions || []);
    const inheritedSet = new Set(regions.filter(regionName => !directSet.has(regionName)));
    return {
      ...entry,
      regions,
      claims,
      directRegions: [...directSet],
      inheritedRegions: [...inheritedSet],
      inheritedClaimCount: inheritedSet.size,
      directClaimCount: directSet.size,
      regionSources,
      regionSourceLabels,
      cumulative: inheritedSet.size > 0,
    };
  }

  function cumulativeClaimEntries(entries) {
    const cumulativeByEntry = new Map();
    return (entries || []).map(entry => {
      const cumulative = cumulativeClaimEntry(entry, entries, cumulativeByEntry);
      cumulativeByEntry.set(entry, cumulative);
      return cumulative;
    });
  }

  function entriesWithCumulativeClaimMetadata(entries) {
    const rawEntries = entries || [];
    const cumulativeEntries = cumulativeClaimEntries(rawEntries);
    return rawEntries.map((entry, index) => {
      const cumulative = cumulativeEntries[index];
      if (!entry || !cumulative?.claims) return entry;
      const claims = {...(entry.claims || {})};
      for (const regionName of entry.regions || []) {
        if (cumulative.claims[regionName]) claims[regionName] = cumulative.claims[regionName];
      }
      return {...entry, claims};
    });
  }

  function getVisibleProjectEntriesForKind(nation, kind = claimKind()) {
    if (claimMode() === 'off') return [];
    const data = dataForNation(nation);
    if (!data) return [];
    const rawEntries = sortedProjectEntries(data.projects || []);
    const entries = claimMode() === 'project' && projectFilter()
      ? cumulativeClaimEntries(rawEntries)
      : entriesWithCumulativeClaimMetadata(rawEntries);
    return entries
      .map(entry => filterEntryByClaimKindFor(entry, kind))
      .filter(entry => (
        entry.regions.length
        && (claimMode() !== 'project' || !projectFilter() || entryFilterValue(entry) === projectFilter())
      ));
  }

  function getVisibleProjectEntries(nation) {
    return getVisibleProjectEntriesForKind(nation);
  }

  return Object.freeze({
    claimEffectiveHostile,
    hostileAncestorFromClaim,
    claimWithEffectiveHostility,
    claimKindPass,
    filterEntryByClaimKindFor,
    entryFilterValue,
    filterEntryByClaimKind,
    getClaimKindFilteredProjectEntries,
    inheritedClaimProjectsFor,
    cumulativeClaimEntry,
    cumulativeClaimEntries,
    getVisibleProjectEntriesForKind,
    getVisibleProjectEntries,
  });
}
