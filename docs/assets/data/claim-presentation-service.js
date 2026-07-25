// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {createLruCache} from '../runtime/lru-cache.js';
import {createClaimModel} from './claim-model.js';
import {buildClaimLabelDescriptors, buildClaimOverlayDescriptors} from './overlay-descriptors.js';

const OVERLAY_MODEL_CACHE_LIMIT = 256;
const OVERLAY_DESCRIPTOR_CACHE_LIMIT = 256;
const FOREIGN_HOVER_DESCRIPTOR_CACHE_LIMIT = 128;
const MANUAL_ENVELOPE_MODEL_CACHE_LIMIT = 128;
const REACHABLE_CAPITAL_CANDIDATE_DESCRIPTOR_CACHE_LIMIT = 128;
const EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE = Symbol('empty-manual-envelope-model');

const CLAIM_GRADIENT_START_HUE = 155;
const CLAIM_GRADIENT_END_HUE = 290;
const CLAIM_GRADIENT_STEPS = 6;
const claimGradientHue = step => (
  CLAIM_GRADIENT_START_HUE
  + (CLAIM_GRADIENT_END_HUE - CLAIM_GRADIENT_START_HUE) * (step / CLAIM_GRADIENT_STEPS)
);
const claimGradientColor = (step, lightness, chroma) => (
  `oklch(${lightness} ${chroma} ${claimGradientHue(step)})`
);
const BASE_TERRITORY_COLOR = claimGradientColor(0, 0.78, 0.11);
const CLAIM_TIER_COLORS = [
  claimGradientColor(1, 0.73, 0.14),
  claimGradientColor(2, 0.68, 0.16),
  claimGradientColor(3, 0.63, 0.18),
  claimGradientColor(4, 0.58, 0.20),
  claimGradientColor(5, 0.53, 0.21),
  claimGradientColor(6, 0.49, 0.22),
];
const HOVER_NATION_BASE_TERRITORY_OPACITY = 0.18;
const HOVER_NATION_TIER_OPACITIES = [0.145, 0.120, 0.095, 0.070, 0.050, 0.032];

const emptyMap = () => new Map();
const emptySet = () => new Set();

function projectColor(project, index = 0) {
  const tier = project ? index + 1 : 0;
  return CLAIM_TIER_COLORS[Math.min(Math.max(tier, 0), CLAIM_TIER_COLORS.length - 1)];
}

function hoverNationProjectOpacity(project, index = 0) {
  const tier = project ? index + 1 : 0;
  return HOVER_NATION_TIER_OPACITIES[
    Math.min(Math.max(tier, 0), HOVER_NATION_TIER_OPACITIES.length - 1)
  ];
}

function overlayModelDataVersionKey(activeData, indices) {
  const summary = activeData?.regionMap?.summary || {};
  const claimStats = activeData?.claimMap?.claimStats || {};
  return [
    summary.scenarioYear || '',
    summary.regions ?? indices?.regions?.length ?? '',
    claimStats.claimRowsNormalized ?? '',
    claimStats.projectClaimRowsNormalized ?? '',
    claimStats.projectCount ?? '',
  ].join(':');
}

function contextFunction(context, name, fallback = () => '') {
  return typeof context[name] === 'function' ? context[name] : fallback;
}

export function createClaimPresentationService({getContext} = {}) {
  if (typeof getContext !== 'function') throw new TypeError('getContext must be a function');

  const context = () => getContext() || {};
  const record = name => context().recordRenderStat?.(name);
  const scenarioId = current => current.activeScenarioId || current.defaultScenarioId || '';
  const regionByName = current => current.regionByName || {};
  const pinnedRegionIds = current => current.pinnedRegionIds || emptySet();
  const getPinnedCapitalClaimant = (current, regionName) => (
    contextFunction(current, 'getPinnedCapitalClaimant')(regionName) || ''
  );
  const pinnedExpansionClaimants = (current, regionName) => (
    contextFunction(current, 'pinnedExpansionClaimants', () => [])(regionName) || []
  );

  const claimModel = createClaimModel({
    claimsByNation: () => context().claimsByNation || {},
    nationRegions: () => context().nationRegions || emptyMap(),
    projectMeta: () => context().projectMeta || {},
    claimMode: () => context().claimMode || 'all',
    claimKind: () => context().claimKind || 'all',
    projectFilter: () => context().projectFilter || '',
    activeIncomingClaimKey: () => context().activeIncomingClaimKey || '',
    selectedRegionIds: () => context().selectedRegionIds || emptySet(),
    incomingClaimsByRegion: () => context().incomingClaimsByRegion || emptyMap(),
    capitalNationsByRegion: () => context().capitalNationsByRegion || emptyMap(),
    regionExists: regionName => !!regionByName(context())[regionName],
    isCapitalRegionForNation: (nation, regionName) => (
      !!contextFunction(context(), 'isCapitalRegionForNation', () => false)(nation, regionName)
    ),
    projectLabel: project => contextFunction(
      context(),
      'projectDisplay',
      value => String(value || '')
    )(project),
    sourceLabels: {
      inheritedFrom: project => contextFunction(
        context().sourceLabels || {},
        'inheritedFrom',
        value => String(value || '')
      )(project),
      basicClaim: () => contextFunction(
        context().sourceLabels || {},
        'basicClaim',
        () => ''
      )(),
      direct: () => contextFunction(
        context().sourceLabels || {},
        'direct',
        () => ''
      )(),
    },
  });

  const overlayModelCache = createLruCache({
    limit: OVERLAY_MODEL_CACHE_LIMIT,
    onHit: () => record('overlayModelCacheHits'),
  });
  const claimOverlayDescriptorCache = createLruCache({
    limit: OVERLAY_DESCRIPTOR_CACHE_LIMIT,
    onHit: () => record('claimOverlayDescriptorCacheHits'),
  });
  const claimLabelDescriptorCache = createLruCache({
    limit: OVERLAY_DESCRIPTOR_CACHE_LIMIT,
    onHit: () => record('claimLabelDescriptorCacheHits'),
  });
  const foreignHoverDescriptorCache = createLruCache({
    limit: FOREIGN_HOVER_DESCRIPTOR_CACHE_LIMIT,
    onHit: () => record('foreignHoverDescriptorCacheHits'),
  });
  const manualEnvelopeModelCache = createLruCache({
    limit: MANUAL_ENVELOPE_MODEL_CACHE_LIMIT,
    onHit: () => record('manualEnvelopeModelCacheHits'),
  });
  const reachableCapitalCandidateDescriptorCache = createLruCache({
    limit: REACHABLE_CAPITAL_CANDIDATE_DESCRIPTOR_CACHE_LIMIT,
    onHit: () => record('reachableCapitalCandidateDescriptorCacheHits'),
  });
  let activeClaimPreviewRegionScopeKey = '';
  let activeClaimPreviewRegionScope = null;
  let destroyed = false;

  function selectedRegionOverlayKey(current) {
    return [...(current.selectedRegionIds || [])].filter(Boolean).sort().join(',');
  }

  function buildOverlayModelCacheKey(activeData, indices, nationId, options = {}) {
    const current = context();
    return JSON.stringify({
      scenario: scenarioId(current),
      data: overlayModelDataVersionKey(activeData, indices),
      language: current.language || '',
      nation: nationId || '',
      claimMode: current.claimMode || '',
      claimKind: current.claimKind || '',
      project: current.projectFilter || '',
      activeIncomingClaim: current.activeIncomingClaimKey || '',
      selectedRegions: selectedRegionOverlayKey(current),
      options: options.cacheKey || '',
    });
  }

  function getNationOverlayModel(activeData, indices, nationId, options = {}) {
    const cacheKey = buildOverlayModelCacheKey(activeData, indices, nationId, options);
    const cached = overlayModelCache.get(cacheKey);
    if (cached) return cached;
    record('overlayModelBuilds');
    return overlayModelCache.set(
      cacheKey,
      claimModel.buildNationOverlayModel(activeData, indices, nationId, options)
    );
  }

  function rebuildIncomingClaimIndex() {
    record('incomingClaimIndexBuilds');
    const nextIndex = claimModel.buildIncomingClaimIndex();
    const currentIndex = context().incomingClaimsByRegion;
    if (!currentIndex?.clear || !currentIndex?.set) return nextIndex;
    currentIndex.clear();
    for (const [regionName, entries] of nextIndex) currentIndex.set(regionName, entries);
    return currentIndex;
  }

  function overlayModelRenderDataKey(model) {
    const current = context();
    return {
      scenario: scenarioId(current),
      data: overlayModelDataVersionKey(model?.activeData, model?.indices),
      nation: model?.nation || '',
      claimMode: current.claimMode || '',
      claimKind: current.claimKind || '',
      project: current.projectFilter || '',
      activeIncomingClaim: model?.activeIncomingClaimKey || '',
    };
  }

  function claimOverlayDescriptorCacheKey(model) {
    return JSON.stringify({
      kind: 'claim-overlay-path-descriptors',
      ...overlayModelRenderDataKey(model),
      options: model?.options?.cacheKey || '',
    });
  }

  function claimLabelDescriptorCacheKey(model) {
    return JSON.stringify({
      kind: 'claim-label-descriptors',
      ...overlayModelRenderDataKey(model),
      options: model?.options?.cacheKey || '',
      language: context().language || '',
    });
  }

  function claimOverlayPathDescriptors(model) {
    const current = context();
    return buildClaimOverlayDescriptors(model, {
      claimMode: current.claimMode,
      regionExists: regionName => !!regionByName(current)[regionName],
      visibleClaimRegionsForEntry: claimModel.visibleClaimRegionsForEntry,
      countryProjectTier: claimModel.countryProjectTier,
      projectColor: current.projectColor || projectColor,
      claimIsEffectivelyHostile: current.claimIsEffectivelyHostile
        || (claim => !!(claim?.effectiveHostile ?? claim?.hostileClaim)),
      baseTerritoryColor: current.baseTerritoryColor || BASE_TERRITORY_COLOR,
    });
  }

  function claimLabelDescriptors(model) {
    const current = context();
    return buildClaimLabelDescriptors(model, {
      visibleClaimRegionsForEntry: claimModel.visibleClaimRegionsForEntry,
      regionByName: regionByName(current),
      labelPosition: current.labelPosition,
      projectDisplay: current.projectDisplay,
      baselineLabel: current.baselineLabel || '',
    });
  }

  function getClaimOverlayDescriptorSet(model) {
    const cacheKey = claimOverlayDescriptorCacheKey(model);
    const cached = claimOverlayDescriptorCache.get(cacheKey);
    if (cached) return cached;
    record('claimOverlayDescriptorBuilds');
    return claimOverlayDescriptorCache.set(cacheKey, {
      cacheKey,
      descriptors: claimOverlayPathDescriptors(model),
    });
  }

  function getClaimLabelDescriptorSet(model) {
    const cacheKey = claimLabelDescriptorCacheKey(model);
    const cached = claimLabelDescriptorCache.get(cacheKey);
    if (cached) return cached;
    record('claimLabelDescriptorBuilds');
    return claimLabelDescriptorCache.set(cacheKey, {
      cacheKey,
      descriptors: claimLabelDescriptors(model),
    });
  }

  function queueForeignHoverDescriptor(candidates, region, className, attrs = {}) {
    if (!region?.path) return;
    const fillOpacity = attrs.fillOpacity ?? HOVER_NATION_BASE_TERRITORY_OPACITY;
    const existing = candidates.get(region.regionName);
    if (existing && existing.fillOpacity >= fillOpacity) return;
    candidates.set(region.regionName, {
      region: region.regionName,
      className,
      attrs: {...attrs, fillOpacity},
      fillOpacity,
    });
  }

  function foreignHoverDescriptorCacheKey(nation) {
    const current = context();
    return JSON.stringify({
      scenario: scenarioId(current),
      data: overlayModelDataVersionKey(current.activeData, current.indices),
      nation: nation || '',
      claimMode: current.claimMode || '',
      claimKind: current.claimKind || '',
    });
  }

  function buildForeignHoverOverlayDescriptorSet(nation, cacheKey) {
    record('foreignHoverDescriptorBuilds');
    const current = context();
    if (!nation || current.claimMode === 'off') return {cacheKey, descriptors: []};
    const claimsByNation = current.claimsByNation || {};
    const nationRegions = current.nationRegions || emptyMap();
    const data = claimsByNation[nation] || {
      nation,
      baseRegions: nationRegions.get(nation) || [],
      projects: [],
    };
    const baseSet = new Set(data.baseRegions || nationRegions.get(nation) || []);
    const tierByProject = claimModel.countryProjectTierMap(nation, baseSet);
    const candidates = new Map();
    for (const regionName of baseSet) {
      queueForeignHoverDescriptor(
        candidates,
        regionByName(current)[regionName],
        'foreign-hover-overlay foreign-hover-base',
        {nation, tier: 'base', fillOpacity: HOVER_NATION_BASE_TERRITORY_OPACITY}
      );
    }
    for (const entry of claimModel.getClaimKindFilteredProjectEntries(nation)) {
      const visibleClaimRegions = (entry.regions || []).filter(regionName => !baseSet.has(regionName));
      if (!visibleClaimRegions.length) continue;
      const tier = claimModel.countryProjectTier(entry, tierByProject);
      const fillOpacity = (current.hoverNationProjectOpacity || hoverNationProjectOpacity)(
        entry.project,
        tier
      );
      const tierLabel = entry.project ? String(tier + 1) : 'basic';
      for (const regionName of visibleClaimRegions) {
        queueForeignHoverDescriptor(
          candidates,
          regionByName(current)[regionName],
          `foreign-hover-overlay ${
            entry.project ? 'foreign-hover-research' : 'foreign-hover-basic'
          }`,
          {
            nation,
            tier: tierLabel,
            project: entry.project || 'base',
            fillOpacity,
          }
        );
      }
    }
    return {cacheKey, descriptors: [...candidates.values()]};
  }

  function getForeignHoverOverlayDescriptorSet(nation) {
    const cacheKey = foreignHoverDescriptorCacheKey(nation);
    const cached = foreignHoverDescriptorCache.get(cacheKey);
    if (cached) return cached;
    return foreignHoverDescriptorCache.set(
      cacheKey,
      buildForeignHoverOverlayDescriptorSet(nation, cacheKey)
    );
  }

  function manualEnvelopeAnchorNation(anchorModel = context().currentOverlayModel || null) {
    const current = context();
    return (
      anchorModel?.nation
      || current.lockedNationId
      || current.activeNationId
      || regionByName(current)[current.focusedRegionName]?.nationTag
      || ''
    );
  }

  function manualEnvelopePinnedSourceKey(current) {
    return [...pinnedRegionIds(current)]
      .map((regionName, index) => (
        `${index}:${regionName}:${getPinnedCapitalClaimant(current, regionName)}:${
          pinnedExpansionClaimants(current, regionName).join(',')
        }`
      ))
      .join('|');
  }

  function manualEnvelopeModelCacheKey(
    anchorModel = context().currentOverlayModel || null,
    {includeAnchorOnly = false} = {}
  ) {
    const current = context();
    return JSON.stringify({
      kind: 'manual-envelope-model',
      scenario: scenarioId(current),
      data: overlayModelDataVersionKey(current.activeData, current.indices),
      anchor: manualEnvelopeAnchorNation(anchorModel),
      overlayNation: anchorModel?.nation || '',
      includeAnchorOnly: !!includeAnchorOnly,
      pins: manualEnvelopePinnedSourceKey(current),
      claimMode: current.claimMode || '',
      claimKind: current.claimKind || '',
      project: current.projectFilter || '',
    });
  }

  function manualEnvelopeSourceSpecs(anchorNation) {
    const current = context();
    if (!anchorNation || current.claimMode === 'off') return [];
    const specs = [{
      claimant: anchorNation,
      depth: 0,
      parentClaimant: '',
      viaCapitalRegion: '',
      pinIndex: -1,
    }];
    const seenClaimants = new Set([anchorNation]);
    const resultSetByClaimant = new Map();
    const sourceResultSet = claimant => {
      if (resultSetByClaimant.has(claimant)) return resultSetByClaimant.get(claimant);
      const resultSet = new Set(claimModel.nationBaseRegionNames(claimant));
      for (const entry of claimModel.getVisibleProjectEntriesForKind(claimant, 'all')) {
        for (const regionName of entry.regions || []) resultSet.add(regionName);
      }
      resultSetByClaimant.set(claimant, resultSet);
      return resultSet;
    };
    const parentSpecForRegion = regionName => specs
      .filter(spec => sourceResultSet(spec.claimant).has(regionName))
      .sort((a, b) => (
        b.depth - a.depth
        || b.pinIndex - a.pinIndex
        || a.claimant.localeCompare(b.claimant)
      ))[0] || null;
    const pending = [];
    [...pinnedRegionIds(current)].forEach((regionName, pinIndex) => {
      for (const claimant of pinnedExpansionClaimants(current, regionName)) {
        if (claimant) pending.push({claimant, regionName, pinIndex});
      }
    });
    let changed = true;
    while (changed && pending.length) {
      changed = false;
      for (let index = 0; index < pending.length;) {
        const item = pending[index];
        if (seenClaimants.has(item.claimant)) {
          pending.splice(index, 1);
          continue;
        }
        const parent = parentSpecForRegion(item.regionName);
        if (!parent) {
          index += 1;
          continue;
        }
        seenClaimants.add(item.claimant);
        specs.push({
          claimant: item.claimant,
          depth: parent.depth + 1,
          parentClaimant: parent.claimant,
          viaCapitalRegion: item.regionName,
          pinIndex: item.pinIndex,
        });
        pending.splice(index, 1);
        changed = true;
      }
    }
    return specs.sort(claimModel.compareManualEnvelopeSourceSpecs(anchorNation));
  }

  function buildManualEnvelopeModelUncached(
    anchorModel = context().currentOverlayModel || null,
    {includeAnchorOnly = false} = {}
  ) {
    record('manualEnvelopeModelBuilds');
    const anchorNation = manualEnvelopeAnchorNation(anchorModel);
    return claimModel.buildManualEnvelopeModelData(
      anchorNation,
      manualEnvelopeSourceSpecs(anchorNation),
      {includeAnchorOnly}
    );
  }

  function getManualEnvelopeModel(
    anchorModel = context().currentOverlayModel || null,
    options = {}
  ) {
    const cacheKey = manualEnvelopeModelCacheKey(anchorModel, options);
    const cached = manualEnvelopeModelCache.get(cacheKey);
    if (cached) return cached === EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE ? null : cached;
    const model = buildManualEnvelopeModelUncached(anchorModel, options);
    manualEnvelopeModelCache.set(cacheKey, model || EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE);
    return model;
  }

  function manualEnvelopeVisibleRegionSet(model) {
    const regions = regionByName(context());
    return new Set((model?.regionItems || [])
      .map(item => item.region)
      .filter(regionName => regions[regionName]));
  }

  function addRegionNamesToSet(target, regionNames) {
    if (!regionNames) return target;
    const regions = regionByName(context());
    if (regionNames instanceof Set || Array.isArray(regionNames)) {
      for (const regionName of regionNames) {
        if (regions[regionName]) target.add(regionName);
      }
      return target;
    }
    if (typeof regionNames === 'object') {
      Object.entries(regionNames).forEach(([regionName, included]) => {
        if (included && regions[regionName]) target.add(regionName);
      });
    }
    return target;
  }

  function activeClaimPreviewScopeCacheKey(
    anchorModel = context().currentOverlayModel || null
  ) {
    const current = context();
    const pinnedKey = [...pinnedRegionIds(current)]
      .map(regionName => `${regionName}:${getPinnedCapitalClaimant(current, regionName)}`)
      .join('|');
    return JSON.stringify({
      scenario: scenarioId(current),
      data: overlayModelDataVersionKey(current.activeData, current.indices),
      anchor: manualEnvelopeAnchorNation(anchorModel),
      overlayNation: anchorModel?.nation || '',
      incoming: current.activeIncomingClaimKey || '',
      pins: pinnedKey,
      claimMode: current.claimMode || '',
      claimKind: current.claimKind || '',
      project: current.projectFilter || '',
    });
  }

  function activeClaimPreviewRegionSet(anchorModel = context().currentOverlayModel || null) {
    if (!anchorModel) return new Set();
    const key = activeClaimPreviewScopeCacheKey(anchorModel);
    if (key === activeClaimPreviewRegionScopeKey && activeClaimPreviewRegionScope) {
      return activeClaimPreviewRegionScope;
    }
    const resultSet = new Set();
    addRegionNamesToSet(resultSet, anchorModel.resultSet);
    addRegionNamesToSet(
      resultSet,
      manualEnvelopeVisibleRegionSet(getManualEnvelopeModel(anchorModel, {includeAnchorOnly: true}))
    );
    activeClaimPreviewRegionScopeKey = key;
    activeClaimPreviewRegionScope = resultSet;
    return resultSet;
  }

  function activeClaimPreviewContainsRegion(
    regionName,
    anchorModel = context().currentOverlayModel || null
  ) {
    return !!regionName && activeClaimPreviewRegionSet(anchorModel).has(regionName);
  }

  function buildActiveExpansionScope(anchorModel = context().currentOverlayModel || null) {
    return {
      anchorNation: manualEnvelopeAnchorNation(anchorModel),
      regionSet: activeClaimPreviewRegionSet(anchorModel),
    };
  }

  function resolveCapitalClaimantForRegion(
    regionName,
    scope = buildActiveExpansionScope()
  ) {
    if (!regionName || !scope?.regionSet?.has?.(regionName)) return '';
    const candidates = claimModel.reachableCapitalCandidateNations(
      regionName,
      scope.anchorNation,
      scope.regionSet
    );
    const override = getPinnedCapitalClaimant(context(), regionName);
    if (override && candidates.includes(override)) return override;
    return candidates[0] || '';
  }

  function resolveReachableCapitalSelectionClaimant(region, capitalClaimantId = '') {
    const current = context();
    if (!region?.regionName || !(current.lockedNationId || current.activeNationId)) return '';
    const scope = buildActiveExpansionScope(current.currentOverlayModel || null);
    if (capitalClaimantId) {
      const candidates = claimModel.reachableCapitalCandidateNations(
        region.regionName,
        scope.anchorNation,
        scope.regionSet
      );
      return candidates.includes(capitalClaimantId) ? capitalClaimantId : '';
    }
    return resolveCapitalClaimantForRegion(region.regionName, scope);
  }

  function reachableCapitalCandidateDescriptorCacheKey(model) {
    const current = context();
    return JSON.stringify({
      kind: 'reachable-capital-candidate-descriptors',
      scenario: scenarioId(current),
      data: overlayModelDataVersionKey(current.activeData, current.indices),
      anchor: model?.anchorNation || '',
      sourceKey: model?.sourceKey || '',
      regionKey: model?.regionKey || '',
      pins: [...pinnedRegionIds(current)]
        .map(regionName => `${regionName}:${getPinnedCapitalClaimant(current, regionName)}`)
        .join('|'),
    });
  }

  function reachableCapitalCandidateDescriptors(
    anchorModel = context().currentOverlayModel || null,
    {manualEnvelopeModel = null} = {}
  ) {
    const current = context();
    const model = manualEnvelopeModel
      || getManualEnvelopeModel(anchorModel, {includeAnchorOnly: true});
    const cacheKey = reachableCapitalCandidateDescriptorCacheKey(model);
    const cached = reachableCapitalCandidateDescriptorCache.get(cacheKey);
    if (cached) return cached;
    record('reachableCapitalCandidateDescriptorBuilds');
    if (!model?.regionItems?.length) {
      return reachableCapitalCandidateDescriptorCache.set(cacheKey, []);
    }
    const resultSet = manualEnvelopeVisibleRegionSet(model);
    const pinned = pinnedRegionIds(current);
    const candidates = [];
    for (const item of model.regionItems) {
      if (pinned.has(item.region)) continue;
      const nations = claimModel.reachableCapitalCandidateNations(
        item.region,
        model.anchorNation,
        resultSet
      );
      if (!nations.length) continue;
      const region = regionByName(current)[item.region];
      const position = current.labelPosition?.(region);
      const candidateNationId = nations[0];
      candidates.push({
        region: item.region,
        capitalRegionId: item.region,
        depth: item.primary.depth,
        sourceCount: item.overlapSources.length,
        primaryNation: candidateNationId,
        candidateNationId,
        nations,
        x: position?.x,
        y: position?.y,
      });
    }
    return reachableCapitalCandidateDescriptorCache.set(
      cacheKey,
      candidates.sort((a, b) => (
        a.depth - b.depth
        || a.region.localeCompare(b.region)
        || a.primaryNation.localeCompare(b.primaryNation)
      ))
    );
  }

  function reset() {
    overlayModelCache.clear();
    claimOverlayDescriptorCache.clear();
    claimLabelDescriptorCache.clear();
    foreignHoverDescriptorCache.clear();
    manualEnvelopeModelCache.clear();
    reachableCapitalCandidateDescriptorCache.clear();
    activeClaimPreviewRegionScopeKey = '';
    activeClaimPreviewRegionScope = null;
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    reset();
  }

  return Object.freeze({
    claimModel,
    facade: claimModel,
    overlayModelDataVersionKey,
    rebuildIncomingClaimIndex,
    getNationOverlayModel,
    getClaimOverlayDescriptorSet,
    getClaimLabelDescriptorSet,
    getForeignHoverOverlayDescriptorSet,
    getForeignHoverDescriptorSet: getForeignHoverOverlayDescriptorSet,
    getManualEnvelopeModel,
    manualEnvelopeAnchorNation,
    manualEnvelopeVisibleRegionSet,
    activeClaimPreviewRegionSet,
    activeClaimPreviewContainsRegion,
    buildActiveExpansionScope,
    resolveCapitalClaimantForRegion,
    resolveReachableCapitalSelectionClaimant,
    reachableCapitalCandidateDescriptors,
    reset,
    destroy,
  });
}
