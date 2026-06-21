// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function uniqueSorted(values) {
  return [...new Set(values || [])].filter(Boolean).sort();
}

function asSet(values) {
  if (values instanceof Set) return values;
  return new Set(values || []);
}

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
  const sourceLabelFns = {...defaultSourceLabels(projectLabel), ...(sourceLabels || {})};

  function projectCost(project) {
    const cost = projectMeta()[project]?.researchCost;
    return typeof cost === 'number' && cost >= 0 ? cost : Number.POSITIVE_INFINITY;
  }

  function projectSortLabel(project) {
    return projectLabel(project) || project || '';
  }

  function dependsOn(project, prerequisite, seen = new Set()) {
    if (!project || !prerequisite || project === prerequisite || seen.has(project)) return false;
    seen.add(project);
    const prereqs = projectMeta()[project]?.prerequisiteNodes || [];
    for (const node of prereqs) {
      if (node === prerequisite) return true;
      if (projectMeta()[node] && dependsOn(node, prerequisite, seen)) return true;
    }
    return false;
  }

  function sortedProjectEntries(entries) {
    return [...(entries || [])].sort((a, b) => {
      if (!!a.project !== !!b.project) return a.project ? 1 : -1;
      if (!a.project && !b.project) return String(a.label || '').localeCompare(String(b.label || ''));
      if (dependsOn(a.project, b.project)) return 1;
      if (dependsOn(b.project, a.project)) return -1;
      const costA = projectCost(a.project);
      const costB = projectCost(b.project);
      if (costA !== costB) return costA < costB ? -1 : 1;
      const byLabel = projectSortLabel(a.project).localeCompare(projectSortLabel(b.project));
      if (byLabel) return byLabel;
      return String(a.project || '').localeCompare(String(b.project || ''));
    });
  }

  function countryProjectTierMap(nation, baseSet) {
    const data = dataForNation(nation);
    const tiers = new Map();
    if (!data) return tiers;
    const baseRegions = asSet(baseSet);
    let tier = 0;
    for (const entry of sortedProjectEntries(data.projects || [])) {
      if (!entry.project) continue;
      const hasExpansionRegions = (entry.regions || []).some(regionName => !baseRegions.has(regionName));
      if (!hasExpansionRegions) continue;
      tiers.set(entry.project, tier);
      tier += 1;
    }
    return tiers;
  }

  function nationClaimTierCount(nation) {
    const data = dataForNation(nation) || {};
    const baseSet = new Set(data.baseRegions || regionListForNation(nation));
    return countryProjectTierMap(nation, baseSet).size;
  }

  function countryProjectTier(entry, tierByProject) {
    if (!entry.project) return -1;
    return tierByProject.get(entry.project) ?? 0;
  }

  function isExcludedSystemClaim(claimant, project, label = '') {
    const projectId = String(project || '');
    const displayLabel = String(label || projectLabel(project) || '');
    return claimant === 'ALN'
      || projectId === 'Project_AlienMasterProject'
      || projectId === 'Project_ProtectorateAuthority'
      || /alien master project/i.test(displayLabel)
      || /protectorate authority/i.test(displayLabel)
      || /보호국 총독부/.test(displayLabel);
  }

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
      return nextClaim;
    }
    if (hostileAncestor) {
      nextClaim.effectiveHostile = true;
      nextClaim.propagatedHostile = true;
      nextClaim.hostileAncestor = hostileAncestor.region || '';
      nextClaim.hostileVia = hostileAncestor.via || '';
      nextClaim.hostileViaLabel = hostileAncestor.label || '';
      return nextClaim;
    }
    nextClaim.effectiveHostile = false;
    nextClaim.propagatedHostile = false;
    return nextClaim;
  }

  function claimKindPass(claim) {
    const kind = claimKind();
    if (kind === 'all') return true;
    if (kind === 'hostile') return claimEffectiveHostile(claim);
    if (kind === 'peaceful') return !claimEffectiveHostile(claim);
    return true;
  }

  function entryFilterValue(entry) {
    return entry?.project || '__base__';
  }

  function filterEntryByClaimKind(entry) {
    const claims = entry.claims || {};
    const regions = (entry.regions || []).filter(regionName => claimKindPass(claims[regionName] || {}));
    const filteredClaims = {};
    for (const regionName of regions) filteredClaims[regionName] = claims[regionName];
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

  function getClaimKindFilteredProjectEntries(nation) {
    const data = dataForNation(nation);
    if (!data) return [];
    return sortedProjectEntries((data.projects || []).map(filterEntryByClaimKind).filter(entry => entry.regions.length));
  }

  function inheritedClaimProjectsFor(entry, entries) {
    if (!entry?.project) return [];
    return (entries || []).filter(candidate => {
      if (candidate === entry) return false;
      if (!candidate.project) return true;
      return dependsOn(entry.project, candidate.project);
    });
  }

  function cumulativeClaimEntry(entry, entries, cumulativeByEntry = new Map()) {
    const inheritedEntries = inheritedClaimProjectsFor(entry, entries);
    const regions = [];
    const claims = {};
    const regionSources = {};
    const regionSourceLabels = {};
    const addRegion = (regionName, claim, source, sourceLabel, {overwrite = false, hostileAncestor = null} = {}) => {
      if (!regionName || (!overwrite && claims[regionName])) return;
      if (!claims[regionName]) regions.push(regionName);
      claims[regionName] = claimWithEffectiveHostility(claim, hostileAncestor);
      regionSources[regionName] = source;
      regionSourceLabels[regionName] = sourceLabel;
    };
    let hostileAncestor = null;
    for (const inherited of inheritedEntries) {
      const inheritedEntry = cumulativeByEntry.get(inherited) || inherited;
      const source = inheritedEntry.project ? 'inherited' : 'basic';
      const sourceLabel = inheritedEntry.project ? sourceLabelFns.inheritedFrom(projectLabel(inheritedEntry.project)) : sourceLabelFns.basicClaim();
      for (const regionName of inheritedEntry.regions || []) {
        const inheritedClaim = inheritedEntry.claims?.[regionName];
        addRegion(regionName, inheritedClaim, source, sourceLabel);
        hostileAncestor ||= hostileAncestorFromClaim(regionName, inheritedClaim, source, sourceLabel, inheritedEntry.project || '');
      }
    }
    for (const regionName of entry.regions || []) {
      addRegion(regionName, entry.claims?.[regionName], 'direct', sourceLabelFns.direct(), {overwrite: true, hostileAncestor});
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

  function getVisibleProjectEntries(nation) {
    if (claimMode() === 'off') return [];
    const data = dataForNation(nation);
    if (!data) return [];
    const rawEntries = sortedProjectEntries(data.projects || []);
    if (claimMode() === 'project' && projectFilter()) {
      return cumulativeClaimEntries(rawEntries)
        .map(filterEntryByClaimKind)
        .filter(entry => entry.regions.length && entryFilterValue(entry) === projectFilter());
    }
    return rawEntries.map(filterEntryByClaimKind).filter(entry => entry.regions.length);
  }

  function buildIncomingClaimIndex() {
    const index = new Map();
    for (const [claimant, data] of Object.entries(claimsByNation())) {
      const claimantBaseRegions = [...new Set(data.baseRegions || regionListForNation(claimant))];
      const directEntries = sortedProjectEntries(data.projects || []);
      const cumulativeByKey = new Map(cumulativeClaimEntries(directEntries).map(entry => [entryFilterValue(entry), entry]));
      for (const entry of directEntries) {
        const label = entry.label || projectLabel(entry.project);
        if (isExcludedSystemClaim(claimant, entry.project, label)) continue;
        const entryRegions = [...new Set(entry.regions || [])];
        const directEntryClaims = entry.claims || {};
        const cumulative = cumulativeByKey.get(entryFilterValue(entry)) || entry;
        const cumulativeRegions = [...new Set(cumulative.regions || entryRegions)];
        const cumulativeClaims = cumulative.claims || directEntryClaims;
        const resultRegions = uniqueSorted([...claimantBaseRegions, ...cumulativeRegions]);
        const resultClaimRegions = cumulativeRegions.filter(regionName => !claimantBaseRegions.includes(regionName));
        const resultRegionSourceLabels = cumulative.regionSourceLabels || {};
        for (const regionName of entryRegions) {
          const claim = cumulativeClaims?.[regionName] || directEntryClaims?.[regionName] || {};
          if (!index.has(regionName)) index.set(regionName, []);
          index.get(regionName).push({
            claimant,
            project: entry.project || '',
            label,
            region: regionName,
            claim,
            claimantBaseRegions,
            entryRegions,
            entryClaims: cumulativeClaims,
            resultRegions,
            resultClaimRegions,
            resultRegionSourceLabels,
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
    if (!key) return null;
    return (entries || []).find(entry => incomingClaimKey(entry) === key) || null;
  }

  function incomingClaimsForTarget(targetNation, data, baseSet) {
    const targetRegions = incomingTargetRegions(data, baseSet);
    const grouped = new Map();
    for (const regionName of targetRegions) {
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
    return [...grouped.values()].sort((a, b) => (
      a.claimant.localeCompare(b.claimant) || projectSortLabel(a.project).localeCompare(projectSortLabel(b.project))
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
    const ownedCount = displayBaseSet.size;
    const claimCount = claimSet.size;
    const projectCount = entries.filter(entry => entry.project && (entry.regions || []).some(regionName => !displayBaseSet.has(regionName))).length;
    const hasClaimOverlay = claimMode() !== 'off' && (displayBaseSet.size > 0 || claimSet.size > 0);
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
      ownedCount,
      claimCount,
      projectCount,
      hasClaimOverlay,
      gatedCount: (data.gatedRegions || []).length,
    };
  }

  function visibleClaimRegionsForEntry(entry, model) {
    return (entry.regions || []).filter(regionName => !model.displayBaseSet.has(regionName));
  }

  function compareManualEnvelopeSourceSpecs(anchorNation) {
    return (a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      const aFocused = a.claimant === anchorNation ? 0 : 1;
      const bFocused = b.claimant === anchorNation ? 0 : 1;
      if (aFocused !== bFocused) return aFocused - bFocused;
      if (a.pinIndex !== b.pinIndex) return a.pinIndex - b.pinIndex;
      return a.claimant.localeCompare(b.claimant);
    };
  }

  function buildManualEnvelopeSource(spec, sourceOrder) {
    const data = dataForNation(spec.claimant) || {
      nation: spec.claimant,
      baseRegions: regionListForNation(spec.claimant),
      projects: [],
    };
    const baseSet = new Set(data.baseRegions || regionListForNation(spec.claimant));
    const tierByProject = countryProjectTierMap(spec.claimant, baseSet);
    const entries = getVisibleProjectEntries(spec.claimant);
    return {
      ...spec,
      sourceOrder,
      data,
      baseSet,
      tierByProject,
      entries,
    };
  }

  function compareManualEnvelopeContributions(a, b) {
    if (a.depth !== b.depth) return a.depth - b.depth;
    if (a.sourceOrder !== b.sourceOrder) return a.sourceOrder - b.sourceOrder;
    if (a.kind !== b.kind) return a.kind === 'base' ? -1 : 1;
    if (a.tier !== b.tier) return a.tier - b.tier;
    const byProject = projectSortLabel(a.project).localeCompare(projectSortLabel(b.project));
    if (byProject) return byProject;
    return a.claimant.localeCompare(b.claimant);
  }

  function manualEnvelopeSourceKey(contribution) {
    return `${contribution.depth}:${contribution.claimant}:${contribution.parentClaimant || ''}:${contribution.viaCapitalRegion || ''}`;
  }

  function addManualEnvelopeContribution(regionContributions, source, regionName, contribution) {
    if (!regionName || !regionExists(regionName)) return;
    if (!regionContributions.has(regionName)) regionContributions.set(regionName, []);
    regionContributions.get(regionName).push({
      ...contribution,
      region: regionName,
      claimant: source.claimant,
      depth: source.depth,
      parentClaimant: source.parentClaimant,
      viaCapitalRegion: source.viaCapitalRegion,
      pinIndex: source.pinIndex,
      sourceOrder: source.sourceOrder,
    });
  }

  function buildManualEnvelopeModelData(anchorNation, specs, {includeAnchorOnly = false} = {}) {
    if (!anchorNation) return null;
    if ((specs || []).length <= 1 && !includeAnchorOnly) return null;
    const sources = (specs || [])
      .map((spec, sourceOrder) => buildManualEnvelopeSource(spec, sourceOrder))
      .filter(source => source.baseSet.size || source.entries.length);
    if (sources.length <= 1 && !includeAnchorOnly) return null;

    const regionContributions = new Map();
    for (const source of sources) {
      for (const regionName of source.baseSet) {
        addManualEnvelopeContribution(regionContributions, source, regionName, {
          kind: 'base',
          project: '',
          tier: -1,
          claim: {},
        });
      }
      for (const entry of source.entries) {
        const tier = countryProjectTier(entry, source.tierByProject);
        for (const regionName of entry.regions || []) {
          if (source.baseSet.has(regionName)) continue;
          addManualEnvelopeContribution(regionContributions, source, regionName, {
            kind: 'claim',
            project: entry.project || '',
            tier,
            claim: entry.claims?.[regionName] || {},
          });
        }
      }
    }

    const regionItems = [];
    for (const [region, contributions] of regionContributions) {
      const sorted = [...contributions].sort(compareManualEnvelopeContributions);
      const primary = sorted[0];
      const overlapSourceKeys = new Set();
      const overlapSources = [];
      for (const contribution of sorted) {
        const key = manualEnvelopeSourceKey(contribution);
        if (overlapSourceKeys.has(key)) continue;
        overlapSourceKeys.add(key);
        overlapSources.push(contribution);
      }
      regionItems.push({
        region,
        primary,
        contributions: sorted,
        overlapSources,
      });
    }
    regionItems.sort((a, b) => (
      a.primary.depth - b.primary.depth
      || a.primary.sourceOrder - b.primary.sourceOrder
      || a.region.localeCompare(b.region)
    ));
    return {
      anchorNation,
      sources,
      regionItems,
      sourceKey: sources.map(source => `${source.depth}:${source.claimant}:${source.parentClaimant || ''}:${source.viaCapitalRegion || ''}:${source.pinIndex}`).join('|'),
      regionKey: regionItems.map(item => `${item.region}:${item.primary.depth}:${item.primary.claimant}:${item.primary.project || ''}:${item.overlapSources.length}`).join('|'),
    };
  }

  function nationBaseRegionNames(nation) {
    return [...new Set(dataForNation(nation)?.baseRegions || regionListForNation(nation))]
      .filter(regionName => regionExists(regionName));
  }

  function nationResultRegionNames(nation) {
    const resultRegions = new Set(nationBaseRegionNames(nation));
    for (const entry of getVisibleProjectEntries(nation)) {
      for (const regionName of entry.regions || []) {
        if (regionExists(regionName)) resultRegions.add(regionName);
      }
    }
    return [...resultRegions];
  }

  function nationFullyIncludedInResult(nation, resultSet) {
    const resultRegions = nationResultRegionNames(nation);
    return !!resultRegions.length && resultRegions.every(regionName => resultSet?.has?.(regionName));
  }

  function isReachableCapitalCandidateNation(regionName, nation, anchorNation, resultSet = new Set()) {
    return !!regionName
      && !!nation
      && nation !== anchorNation
      && isCapitalRegionForNation(nation, regionName)
      && !nationFullyIncludedInResult(nation, resultSet);
  }

  function reachableCapitalCandidateNations(regionName, anchorNation, resultSet = new Set()) {
    return [...new Set(capitalNationsByRegion().get?.(regionName) || [])]
      .filter(nation => isReachableCapitalCandidateNation(regionName, nation, anchorNation, resultSet));
  }

  return {
    projectCost,
    projectSortLabel,
    dependsOn,
    sortedProjectEntries,
    countryProjectTierMap,
    nationClaimTierCount,
    countryProjectTier,
    isExcludedSystemClaim,
    claimEffectiveHostile,
    claimKindPass,
    entryFilterValue,
    filterEntryByClaimKind,
    getClaimKindFilteredProjectEntries,
    inheritedClaimProjectsFor,
    cumulativeClaimEntry,
    cumulativeClaimEntries,
    getVisibleProjectEntries,
    buildIncomingClaimIndex,
    incomingTargetRegions,
    outgoingClaimKey,
    incomingClaimKey,
    selectedIncomingEntry,
    incomingClaimsForTarget,
    buildNationOverlayModel,
    visibleClaimRegionsForEntry,
    compareManualEnvelopeSourceSpecs,
    buildManualEnvelopeSource,
    compareManualEnvelopeContributions,
    manualEnvelopeSourceKey,
    addManualEnvelopeContribution,
    buildManualEnvelopeModelData,
    nationBaseRegionNames,
    nationResultRegionNames,
    nationFullyIncludedInResult,
    isReachableCapitalCandidateNation,
    reachableCapitalCandidateNations,
  };
}
