// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function createClaimManualEnvelopeModel({
  dataForNation,
  regionListForNation,
  projectLabel,
  regionExists,
  isCapitalRegionForNation,
  capitalNationsByRegion,
  projectSortLabel,
  countryProjectTierMap,
  countryProjectTier,
  getVisibleProjectEntries,
  getVisibleProjectEntriesForKind,
  hostileAncestorFromClaim,
  claimWithEffectiveHostility,
  claimEffectiveHostile,
  claimKindPass,
}) {
  function compareManualEnvelopeSourceSpecs(anchorNation) {
    return (left, right) => {
      if (left.depth !== right.depth) return left.depth - right.depth;
      const leftFocused = left.claimant === anchorNation ? 0 : 1;
      const rightFocused = right.claimant === anchorNation ? 0 : 1;
      if (leftFocused !== rightFocused) return leftFocused - rightFocused;
      return left.pinIndex - right.pinIndex || left.claimant.localeCompare(right.claimant);
    };
  }

  function buildManualEnvelopeSource(spec, sourceOrder) {
    const data = dataForNation(spec.claimant) || {
      nation: spec.claimant,
      baseRegions: regionListForNation(spec.claimant),
      projects: [],
    };
    const baseSet = new Set(data.baseRegions || regionListForNation(spec.claimant));
    return {
      ...spec,
      sourceOrder,
      data,
      baseSet,
      tierByProject: countryProjectTierMap(spec.claimant, baseSet),
      entries: getVisibleProjectEntriesForKind(spec.claimant, 'all'),
    };
  }

  function sourceClaimHostileAncestor(source, regionName) {
    if (!source || !regionName) return null;
    for (const entry of source.entries || []) {
      if (!(entry.regions || []).includes(regionName)) continue;
      const claim = entry.claims?.[regionName] || {};
      const label = entry.regionSourceLabels?.[regionName] || entry.label || projectLabel(entry.project) || '';
      const ancestor = hostileAncestorFromClaim(regionName, claim, 'recursive', label, entry.project || '');
      if (ancestor) return ancestor;
    }
    return null;
  }

  function applyRecursiveHostilityToSource(source, sourceByClaimant) {
    const parentSource = sourceByClaimant.get(source.parentClaimant);
    const hostileAncestor = parentSource?.recursiveHostileAncestor
      || sourceClaimHostileAncestor(parentSource, source.viaCapitalRegion);
    return {
      ...source,
      entries: hostileAncestor
        ? (source.entries || []).map(entry => ({
          ...entry,
          claims: Object.fromEntries((entry.regions || []).map(regionName => [
            regionName,
            claimWithEffectiveHostility(entry.claims?.[regionName], hostileAncestor),
          ])),
        }))
        : source.entries || [],
      recursiveHostileAncestor: hostileAncestor || null,
    };
  }

  function compareManualEnvelopeContributions(left, right) {
    if (left.depth !== right.depth) return left.depth - right.depth;
    if (left.sourceOrder !== right.sourceOrder) return left.sourceOrder - right.sourceOrder;
    if (left.kind !== right.kind) return left.kind === 'base' ? -1 : 1;
    if (left.tier !== right.tier) return left.tier - right.tier;
    return projectSortLabel(left.project).localeCompare(projectSortLabel(right.project))
      || left.claimant.localeCompare(right.claimant);
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
    if (!anchorNation || ((specs || []).length <= 1 && !includeAnchorOnly)) return null;
    const rawSources = (specs || [])
      .map((spec, sourceOrder) => buildManualEnvelopeSource(spec, sourceOrder))
      .filter(source => source.baseSet.size || source.entries.length);
    const sources = [];
    const sourceByClaimant = new Map();
    for (const source of rawSources) {
      const nextSource = applyRecursiveHostilityToSource(source, sourceByClaimant);
      if (!nextSource.baseSet.size && !nextSource.entries.length) continue;
      sources.push(nextSource);
      sourceByClaimant.set(nextSource.claimant, nextSource);
    }
    if (sources.length <= 1 && !includeAnchorOnly) return null;

    const regionContributions = new Map();
    for (const source of sources) {
      const baseClaim = source.recursiveHostileAncestor
        ? claimWithEffectiveHostility({}, source.recursiveHostileAncestor)
        : {};
      for (const regionName of source.baseSet) {
        addManualEnvelopeContribution(regionContributions, source, regionName, {
          kind: 'base',
          project: '',
          tier: -1,
          claim: baseClaim,
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
      if (!claimKindPass(primary.claim)) continue;
      const seenSources = new Set();
      const overlapSources = sorted.filter(contribution => {
        const key = manualEnvelopeSourceKey(contribution);
        if (seenSources.has(key)) return false;
        seenSources.add(key);
        return true;
      });
      regionItems.push({region, primary, contributions: sorted, overlapSources});
    }
    regionItems.sort((left, right) => (
      left.primary.depth - right.primary.depth
      || left.primary.sourceOrder - right.primary.sourceOrder
      || left.region.localeCompare(right.region)
    ));
    return {
      anchorNation,
      sources,
      regionItems,
      sourceKey: sources.map(source => (
        `${source.depth}:${source.claimant}:${source.parentClaimant || ''}:${source.viaCapitalRegion || ''}:${source.pinIndex}`
      )).join('|'),
      regionKey: regionItems.map(item => (
        `${item.region}:${item.primary.depth}:${item.primary.claimant}:${item.primary.project || ''}:${claimEffectiveHostile(item.primary.claim) ? 1 : 0}:${item.overlapSources.length}`
      )).join('|'),
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

  return Object.freeze({
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
  });
}
