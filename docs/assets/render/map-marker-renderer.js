// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  appendWorldCopyFragment,
  buildVisualFillGroups,
  createGroupedVisualFillFragment,
  createRegionPath,
  createSvgElement,
  defaultWorldCopyContext,
  normalizeWorldCopyContexts,
  replaceLayerChildren,
  worldCopyDataset,
} from './map-layers.js';

const FOREIGN_HOVER_EMPTY_RENDER_KEY = 'foreign-hover:empty';
const SECONDARY_HOVER_EMPTY_RENDER_KEY = 'secondary-hover:empty';
const HOVER_OUTLINE_EMPTY_RENDER_KEY = 'hover-outline:empty';
const PINNED_REGION_MARKERS_EMPTY_RENDER_KEY = 'pinned-region-markers:empty';
const REACHABLE_CAPITAL_CANDIDATES_EMPTY_RENDER_KEY = 'reachable-capital-candidates:empty';
const HOVER_NATION_OVERLAY_COLOR = 'oklch(0.86 0.17 95)';
const SECONDARY_CAPITAL_OVERLAY_COLOR = 'oklch(0.91 0.16 72)';
const HOVER_NATION_BASE_TERRITORY_OPACITY = 0.18;
const SECONDARY_CAPITAL_BASE_TERRITORY_OPACITY = 0.24;
const SECONDARY_CAPITAL_TIER_OPACITY_BOOST = 0.035;

function copyContextRenderKey(copyContexts) {
  return normalizeWorldCopyContexts(copyContexts)
    .map(context => `${context.copyIndex}:${context.xOffset}:${context.isCanonical ? 1 : 0}`)
    .join('|');
}

function createProjectedCopyFragment(copyContexts, groupClassName, buildChildren) {
  const contexts = normalizeWorldCopyContexts(copyContexts);
  const fragment = document.createDocumentFragment();
  for (const copyContext of contexts) {
    appendWorldCopyFragment(
      fragment,
      copyContext,
      contexts.length,
      groupClassName,
      () => buildChildren(copyContext)
    );
  }
  return fragment;
}

function replaceLayerForRenderKey(layer, keyStore, nextKey, buildChildren, statKey, recordRenderStat) {
  if (!layer || keyStore.get(layer) === nextKey) return false;
  recordRenderStat(statKey);
  replaceLayerChildren(layer, buildChildren());
  keyStore.set(layer, nextKey);
  return true;
}

function starPoints(cx, cy, outerRadius = 0.032, innerRadius = 0.014, points = 5) {
  const coords = [];
  const step = Math.PI / points;
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + index * step;
    coords.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return coords.join(' ');
}

function appendCapitalMarkerGroup(fragment, region, {
  nation = '',
  selected = false,
  copyContext = defaultWorldCopyContext(),
  className = '',
  ariaLabel = '',
  dataset = {},
  starClassName = '',
  starDataset = {},
  labelPosition,
  localizedRegionName,
  t,
} = {}) {
  const label = labelPosition(region);
  if (!label) return null;
  const copyData = worldCopyDataset(copyContext);
  const group = createSvgElement('g', {
    class: `capital-marker${selected ? ' is-selected' : ' is-idle'}${className ? ` ${className}` : ''}`,
    'aria-label': ariaLabel || `${t('nationInfo.kv.capitalRegion')}: ${localizedRegionName(region)}`,
  }, {
    region: region.regionName,
    nation,
    ...dataset,
    ...copyData,
  });
  const points = starPoints(label.x, label.y);
  group.appendChild(createSvgElement('polygon', {
    class: 'capital-star-shadow',
    points,
    'aria-hidden': 'true',
  }));
  group.appendChild(createSvgElement('polygon', {
    class: `capital-star${starClassName ? ` ${starClassName}` : ''}`,
    points,
  }, {...starDataset, ...copyData}));
  fragment.appendChild(group);
  return group;
}

function appendRegionHighlight(
  fragment,
  region,
  classPrefix,
  copyContext = defaultWorldCopyContext()
) {
  for (const suffix of ['fill', 'outline-glow', 'outline']) {
    fragment.appendChild(createRegionPath(region, {class: `${classPrefix}-${suffix}`}, {
      id: null,
      nation: null,
      ...worldCopyDataset(copyContext),
    }));
  }
}

function appendSelectedRegionMarker(fragment, region, {
  showDot = true,
  showLabel = true,
  copyContext = defaultWorldCopyContext(),
  dotClassName = '',
  labelClassName = '',
  labelPosition,
  localizedRegionName,
} = {}) {
  const label = labelPosition(region);
  if (!label) return;
  const copyData = worldCopyDataset(copyContext);
  if (showDot) {
    fragment.appendChild(createSvgElement('circle', {
      class: `selection-dot${dotClassName ? ` ${dotClassName}` : ''}`,
      cx: label.x,
      cy: label.y,
      r: '.032',
    }, {region: region.regionName, ...copyData}));
  }
  if (!showLabel) return;
  fragment.appendChild(createSvgElement('text', {
    class: `selection-label${labelClassName ? ` ${labelClassName}` : ''}`,
    x: label.x,
    y: label.y - 0.052,
    textContent: localizedRegionName(region),
  }, {region: region.regionName, ...copyData}));
}

function renderCapitalMarkers(context, state) {
  const {
    layer,
    markers = [],
    regionByName,
    copyContexts,
    language = '',
    force = false,
    recordRenderStat = () => {},
  } = context;
  if (!layer) return false;
  const key = `${copyContextRenderKey(copyContexts)}|${language}|${markers.map(marker => (
    `${marker.regionName}:${marker.nation}:${marker.selected ? 1 : 0}`
  )).join('|')}`;
  if (!force && state.capitalLayerRenderKeys.get(layer) === key) return false;
  state.capitalLayerRenderKeys.set(layer, key);
  recordRenderStat('capitalMarkerRebuilds');
  replaceLayerChildren(layer);
  if (!markers.length) return true;
  layer.appendChild(createProjectedCopyFragment(
    copyContexts,
    'capital-marker-copy',
    copyContext => {
      const fragment = document.createDocumentFragment();
      for (const markerInfo of markers) {
        const region = regionByName[markerInfo.regionName];
        if (!region) continue;
        appendCapitalMarkerGroup(fragment, region, {
          nation: markerInfo.nation,
          selected: markerInfo.selected,
          copyContext,
          labelPosition: context.labelPosition,
          localizedRegionName: context.localizedRegionName,
          t: context.t,
        });
      }
      return fragment;
    }
  ));
  return true;
}

function pinnedRegionMarkerRenderKey({pinned, copyContexts, language, selectedPinnedRegions}) {
  if (!pinned.length) return PINNED_REGION_MARKERS_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'pinned-region-markers',
    copyPlan: copyContextRenderKey(copyContexts),
    language,
    selectedPinnedRegions,
    pinned,
  });
}

function appendPinnedRegionMarker(fragment, region, index, context, copyContext, showLabel) {
  const label = context.labelPosition(region);
  if (!label) return;
  const localizedLabel = context.localizedRegionName(region);
  const isCapital = context.isPinnedCapital(region.regionName);
  const group = createSvgElement('g', {
    class: `pinned-node-marker-group${isCapital ? ' capital-marker is-selected' : ''}`,
    'aria-label': context.t('expansionNodes.marker', {
      index: context.formatNumber(index),
      region: localizedLabel,
    }),
  }, {
    region: region.regionName,
    pinIndex: index,
    ...worldCopyDataset(copyContext),
  });
  if (isCapital) {
    const points = starPoints(label.x, label.y);
    group.appendChild(createSvgElement('polygon', {
      class: 'capital-star-shadow',
      points,
      'aria-hidden': 'true',
    }));
    group.appendChild(createSvgElement('polygon', {
      class: 'capital-star',
      points,
    }));
  }
  appendSelectedRegionMarker(group, region, {
    showDot: !isCapital,
    showLabel,
    copyContext,
    dotClassName: 'pinned-node-dot',
    labelClassName: 'pinned-node-label',
    labelPosition: context.labelPosition,
    localizedRegionName: context.localizedRegionName,
  });
  fragment.appendChild(group);
}

function createPinnedRegionMarkerFragment(context) {
  const {
    pinned,
    copyContexts,
    selectedPinnedRegions,
    regionByName,
  } = context;
  const selectedPinnedRegionSet = new Set(selectedPinnedRegions);
  return createProjectedCopyFragment(copyContexts, 'pinned-region-marker-copy', copyContext => {
    const fragment = document.createDocumentFragment();
    pinned.forEach((regionName, index) => {
      const region = regionByName[regionName];
      if (!region) return;
      appendRegionHighlight(fragment, region, 'pinned', copyContext);
      appendPinnedRegionMarker(
        fragment,
        region,
        index + 1,
        context,
        copyContext,
        !selectedPinnedRegionSet.has(regionName)
      );
    });
    return fragment;
  });
}

function renderPinnedRegionMarkers(context, state) {
  const layer = context.layer;
  const recordRenderStat = context.recordRenderStat || (() => {});
  return replaceLayerForRenderKey(
    layer,
    state.pinnedLayerRenderKeys,
    pinnedRegionMarkerRenderKey(context),
    () => createPinnedRegionMarkerFragment(context),
    'pinnedRegionMarkerRebuilds',
    recordRenderStat
  );
}

function secondaryCapitalFillOpacity(fillOpacity) {
  const base = Number(fillOpacity);
  if (!Number.isFinite(base)) return SECONDARY_CAPITAL_BASE_TERRITORY_OPACITY;
  return Math.min(
    SECONDARY_CAPITAL_BASE_TERRITORY_OPACITY,
    base + SECONDARY_CAPITAL_TIER_OPACITY_BOOST
  );
}

function foreignHoverVisualDescriptors(descriptorSet, regionByName, {variant = 'foreign'} = {}) {
  const descriptors = [];
  const secondary = variant === 'secondary-capital';
  for (const descriptor of descriptorSet?.descriptors || []) {
    const region = regionByName[descriptor.region];
    if (!region?.path) continue;
    const {fillOpacity, ...dataAttrs} = descriptor.attrs || {};
    descriptors.push({
      path: region.path,
      regionName: descriptor.region,
      className: `${descriptor.className}${secondary ? ' secondary-capital-preview' : ''}`,
      fill: secondary ? SECONDARY_CAPITAL_OVERLAY_COLOR : HOVER_NATION_OVERLAY_COLOR,
      fillOpacity: secondary
        ? secondaryCapitalFillOpacity(fillOpacity)
        : fillOpacity ?? HOVER_NATION_BASE_TERRITORY_OPACITY,
      dataset: {preview: variant, ...dataAttrs},
    });
  }
  return descriptors;
}

function createForeignHoverOverlayFragment(descriptorSet, context, {
  variant = 'foreign',
  statPrefix = 'foreignHoverOverlay',
} = {}) {
  const descriptors = foreignHoverVisualDescriptors(
    descriptorSet,
    context.regionByName,
    {variant}
  );
  if (context.debugRenderStats) {
    const groups = buildVisualFillGroups(descriptors);
    const copyCount = normalizeWorldCopyContexts(context.copyContexts).length;
    context.setRenderStat(`${statPrefix}PathCount`, groups.length * copyCount);
    context.setRenderStat(`${statPrefix}RegionCount`, descriptors.length * copyCount);
  }
  return createGroupedVisualFillFragment({
    descriptors,
    copyContexts: context.copyContexts,
    copyGroupClassName: variant === 'secondary-capital'
      ? 'secondary-hover-copy'
      : 'foreign-hover-copy',
  });
}

function replaceHoverLayer({
  layer,
  keyStore,
  nextKey,
  buildChildren,
  force,
  statKey,
  emptyKey,
  emptyStatPrefix,
  recordRenderStat,
  setRenderStat,
}) {
  if (!layer || (!force && keyStore.get(layer) === nextKey)) return false;
  keyStore.set(layer, nextKey);
  recordRenderStat(statKey);
  if (nextKey === emptyKey && emptyStatPrefix) {
    setRenderStat(`${emptyStatPrefix}PathCount`, 0);
    setRenderStat(`${emptyStatPrefix}RegionCount`, 0);
  }
  replaceLayerChildren(layer, buildChildren());
  return true;
}

function renderHoverOutlines(context, state) {
  const {
    region,
    hidden,
    foreign,
    secondary,
    foreignDescriptorSet,
    secondaryDescriptorSet,
    copyContexts,
    activeNationId = '',
    visibleNationRegion = false,
    force = false,
    recordRenderStat = () => {},
    setRenderStat = () => {},
  } = context;
  const copyKey = copyContextRenderKey(copyContexts);
  const regionName = region?.regionName || '';
  const foreignKey = foreign
    ? `${copyKey}|foreign|${foreignDescriptorSet?.cacheKey || ''}|${activeNationId}|${visibleNationRegion ? 1 : 0}`
    : FOREIGN_HOVER_EMPTY_RENDER_KEY;
  const secondaryKey = secondary
    ? `${copyKey}|secondary-capital|${secondaryDescriptorSet?.cacheKey || ''}|${activeNationId}|${visibleNationRegion ? 1 : 0}`
    : SECONDARY_HOVER_EMPTY_RENDER_KEY;
  const hoverKey = !hidden && !foreign && !secondary
    ? `${copyKey}|region|${regionName}|${activeNationId}|0`
    : HOVER_OUTLINE_EMPTY_RENDER_KEY;
  const foreignChanged = replaceHoverLayer({
    layer: context.foreignLayer,
    keyStore: state.foreignLayerRenderKeys,
    nextKey: foreignKey,
    buildChildren: () => (
      foreign
        ? createForeignHoverOverlayFragment(foreignDescriptorSet, context, {
          variant: 'foreign',
          statPrefix: 'foreignHoverOverlay',
        })
        : document.createDocumentFragment()
    ),
    force,
    statKey: 'foreignHoverOverlayReplacements',
    emptyKey: FOREIGN_HOVER_EMPTY_RENDER_KEY,
    emptyStatPrefix: 'foreignHoverOverlay',
    recordRenderStat,
    setRenderStat,
  });
  const secondaryChanged = replaceHoverLayer({
    layer: context.secondaryLayer,
    keyStore: state.secondaryLayerRenderKeys,
    nextKey: secondaryKey,
    buildChildren: () => (
      secondary
        ? createForeignHoverOverlayFragment(secondaryDescriptorSet, context, {
          variant: 'secondary-capital',
          statPrefix: 'secondaryHoverOverlay',
        })
        : document.createDocumentFragment()
    ),
    force,
    statKey: 'secondaryHoverOverlayReplacements',
    emptyKey: SECONDARY_HOVER_EMPTY_RENDER_KEY,
    emptyStatPrefix: 'secondaryHoverOverlay',
    recordRenderStat,
    setRenderStat,
  });
  const hoverChanged = replaceHoverLayer({
    layer: context.hoverLayer,
    keyStore: state.hoverLayerRenderKeys,
    nextKey: hoverKey,
    buildChildren: () => {
      if (hidden || foreign || secondary) return document.createDocumentFragment();
      return createProjectedCopyFragment(copyContexts, 'hover-outline-copy', copyContext => {
        const fragment = document.createDocumentFragment();
        appendRegionHighlight(fragment, region, 'hover', copyContext);
        return fragment;
      });
    },
    force,
    statKey: 'hoverOutlineReplacements',
    emptyKey: HOVER_OUTLINE_EMPTY_RENDER_KEY,
    recordRenderStat,
    setRenderStat,
  });
  return foreignChanged || secondaryChanged || hoverChanged;
}

function renderSelectionOutlines(context) {
  const {
    layer,
    selectedRegionNames = [],
    regionByName,
    copyContexts,
    isSelectedCapital,
  } = context;
  if (!layer) return false;
  replaceLayerChildren(layer);
  layer.appendChild(createProjectedCopyFragment(
    copyContexts,
    'selection-outline-copy',
    copyContext => {
      const fragment = document.createDocumentFragment();
      for (const regionName of selectedRegionNames) {
        const region = regionByName[regionName];
        if (!region) continue;
        appendRegionHighlight(fragment, region, 'selection', copyContext);
        appendSelectedRegionMarker(fragment, region, {
          showDot: !isSelectedCapital(regionName),
          copyContext,
          labelPosition: context.labelPosition,
          localizedRegionName: context.localizedRegionName,
        });
      }
      return fragment;
    }
  ));
  return true;
}

function reachableCapitalCandidateRenderKey(context) {
  const {visible, candidates, copyContexts, language} = context;
  if (!visible || !candidates.length) return REACHABLE_CAPITAL_CANDIDATES_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'reachable-capital-candidates',
    copyPlan: copyContextRenderKey(copyContexts),
    language,
    candidates: candidates.map(candidate => (
      `${candidate.region}:${candidate.depth}:${candidate.sourceCount}:${candidate.primaryNation}:${candidate.nations.join(',')}`
    )).join('|'),
  });
}

function createReachableCapitalCandidateFragment(context) {
  return createProjectedCopyFragment(
    context.copyContexts,
    'reachable-capital-candidate-copy',
    copyContext => {
      const fragment = document.createDocumentFragment();
      for (const candidate of context.candidates) {
        const region = context.regionByName[candidate.region];
        if (!region) continue;
        appendCapitalMarkerGroup(fragment, region, {
          nation: candidate.primaryNation,
          selected: candidate.region === context.hoveredRegionName,
          copyContext,
          className: 'reachable-capital-candidate',
          ariaLabel: context.markerLabel(candidate),
          dataset: {
            candidateRegion: candidate.region,
            candidateNation: candidate.primaryNation,
            candidateDepth: candidate.depth,
            candidateSourceCount: candidate.sourceCount,
          },
          starClassName: 'reachable-capital-candidate-star',
          starDataset: {
            candidateFocus: candidate.region,
            candidateNation: candidate.primaryNation,
          },
          labelPosition: context.labelPosition,
          localizedRegionName: context.localizedRegionName,
          t: context.t,
        });
      }
      return fragment;
    }
  );
}

function syncReachableHover(context) {
  const layer = context.layer;
  if (!layer) return;
  const hoveredRegionName = context.hoveredRegionName || '';
  layer.querySelectorAll('.reachable-capital-candidate[data-candidate-region]').forEach(marker => {
    const active = !!hoveredRegionName && marker.dataset.candidateRegion === hoveredRegionName;
    marker.classList.toggle('is-selected', active);
    marker.classList.toggle('is-idle', !active);
  });
}

function renderReachableCapitalCandidates(context, state) {
  const changed = replaceLayerForRenderKey(
    context.layer,
    state.reachableLayerRenderKeys,
    reachableCapitalCandidateRenderKey(context),
    () => createReachableCapitalCandidateFragment(context),
    'reachableCapitalCandidateRebuilds',
    context.recordRenderStat || (() => {})
  );
  syncReachableHover(context);
  return changed;
}

export function createMapMarkerRenderer(layers = {}) {
  let state = {
    capitalLayerRenderKeys: new WeakMap(),
    pinnedLayerRenderKeys: new WeakMap(),
    reachableLayerRenderKeys: new WeakMap(),
    foreignLayerRenderKeys: new WeakMap(),
    secondaryLayerRenderKeys: new WeakMap(),
    hoverLayerRenderKeys: new WeakMap(),
  };
  let destroyed = false;

  function withLayer(context, name) {
    return {...context, layer: context.layer || layers[name] || null};
  }

  function render(context = {}) {
    if (destroyed) return false;
    if (context.kind === 'capital') {
      return renderCapitalMarkers(withLayer(context, 'capitalLayer'), state);
    }
    if (context.kind === 'pinned') {
      return renderPinnedRegionMarkers(withLayer(context, 'pinnedLayer'), state);
    }
    if (context.kind === 'hover') {
      return renderHoverOutlines({
        ...context,
        foreignLayer: context.foreignLayer || layers.foreignLayer,
        secondaryLayer: context.secondaryLayer || layers.secondaryLayer,
        hoverLayer: context.hoverLayer || layers.hoverLayer,
      }, state);
    }
    if (context.kind === 'selection') {
      return renderSelectionOutlines(withLayer(context, 'selectionLayer'));
    }
    if (context.kind === 'reachable') {
      return renderReachableCapitalCandidates(withLayer(context, 'reachableLayer'), state);
    }
    throw new TypeError(`Unknown map marker render kind: ${context.kind || '(empty)'}`);
  }

  function clear(context = {}) {
    if (destroyed) return false;
    const names = context.kind === 'hover'
      ? ['foreignLayer', 'secondaryLayer', 'hoverLayer']
      : context.kind
        ? [`${context.kind}Layer`]
        : [
          'capitalLayer',
          'pinnedLayer',
          'foreignLayer',
          'secondaryLayer',
          'hoverLayer',
          'selectionLayer',
          'reachableLayer',
        ];
    let changed = false;
    for (const name of names) {
      const layer = context.layer || layers[name];
      if (!layer?.childNodes?.length) continue;
      replaceLayerChildren(layer);
      changed = true;
    }
    return changed;
  }

  function reset(context = {}) {
    if (destroyed) return false;
    const changed = clear(context);
    state = {
      capitalLayerRenderKeys: new WeakMap(),
      pinnedLayerRenderKeys: new WeakMap(),
      reachableLayerRenderKeys: new WeakMap(),
      foreignLayerRenderKeys: new WeakMap(),
      secondaryLayerRenderKeys: new WeakMap(),
      hoverLayerRenderKeys: new WeakMap(),
    };
    return changed;
  }

  function destroy(context = {}) {
    if (destroyed) return false;
    reset(context);
    destroyed = true;
    layers = {};
    return true;
  }

  function syncReachableHoverState(context = {}) {
    if (destroyed) return;
    syncReachableHover(withLayer(context, 'reachableLayer'));
  }

  return Object.freeze({
    render,
    clear,
    reset,
    destroy,
    syncReachableHoverState,
  });
}
