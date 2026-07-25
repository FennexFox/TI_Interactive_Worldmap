// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  appendWorldCopyFragment,
  buildVisualFillGroups,
  createSvgElement,
  normalizeWorldCopyContexts,
  replaceLayerChildren,
  worldCopyDataset,
} from './map-layers.js';
import {
  createClaimHatchPattern,
  hatchPatternId,
  nextClaimOverlayRenderNamespace,
} from './claim-overlay-renderer.js';

const MANUAL_ENVELOPE_EMPTY_RENDER_KEY = 'manual-envelope:empty';
const MANUAL_ENVELOPE_DEPTH_COLORS = [
  'oklch(0.80 0.13 168 / .30)',
  'oklch(0.76 0.15 214 / .28)',
  'oklch(0.75 0.16 285 / .26)',
  'oklch(0.78 0.14 35 / .24)',
];

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

function manualEnvelopeDepthColor(depth = 0) {
  const index = Math.min(
    Math.max(Number(depth) || 0, 0),
    MANUAL_ENVELOPE_DEPTH_COLORS.length - 1
  );
  return MANUAL_ENVELOPE_DEPTH_COLORS[index];
}

function manualEnvelopeOverlapColor(sourceCount = 2, alpha = 0.92) {
  const ratio = Math.min(Math.max((Number(sourceCount) || 2) - 2, 0), 4) / 4;
  const lightness = (0.84 - ratio * 0.12).toFixed(2);
  const chroma = (0.15 + ratio * 0.04).toFixed(2);
  const hue = (82 - ratio * 102 + 360) % 360;
  return `oklch(${lightness} ${chroma} ${hue.toFixed(0)} / ${alpha})`;
}

function manualEnvelopeKindLabel(contribution, context) {
  if (contribution.kind === 'base') return context.t('manualEnvelope.kindBase');
  return context.t('manualEnvelope.kindClaim', {
    project: contribution.project
      ? context.projectDisplay(contribution.project)
      : context.t('claimCard.projectBaseline'),
  });
}

function manualEnvelopeSourceLabel(contribution, context) {
  return context.t('manualEnvelope.source', {
    nation: context.nationDisplayName(contribution.claimant),
    kind: manualEnvelopeKindLabel(contribution, context),
  });
}

function manualEnvelopeRegionLabel(item, context) {
  const source = manualEnvelopeSourceLabel(item.primary, context);
  return context.t('manualEnvelope.region', {
    region: context.localizedRegionName(context.regionByName[item.region] || item.region),
    depth: context.formatNumber(item.primary.depth),
    source,
  });
}

function manualEnvelopeOverlapLabel(item, context) {
  return context.t('manualEnvelope.overlap', {
    region: context.localizedRegionName(context.regionByName[item.region] || item.region),
    count: context.formatNumber(item.overlapSources.length),
  });
}

function manualEnvelopeHostileContribution(item, claimIsEffectivelyHostile) {
  return claimIsEffectivelyHostile(item?.primary?.claim) ? item.primary : null;
}

function createManualEnvelopeFragment(model, context) {
  const {
    copyContexts,
    regionByName = {},
    hostileHatchingDisabled = false,
    claimIsEffectivelyHostile,
    t,
  } = context;
  const renderableItems = model.regionItems.filter(item => regionByName[item.region]?.path);
  const fillDescriptors = renderableItems.map(item => {
    const region = regionByName[item.region];
    const depth = item.primary.depth;
    const fill = manualEnvelopeDepthColor(depth);
    return {
      path: region.path,
      className: `manual-envelope-fill manual-envelope-depth-${depth}`,
      fill,
      groupKey: `manual-envelope-depth:${depth}:${fill}`,
      dataset: {
        envelopeDepth: depth,
        fillKey: `depth:${depth}`,
      },
    };
  });
  const fillGroups = buildVisualFillGroups(fillDescriptors);
  const hatchDescriptors = hostileHatchingDisabled ? [] : renderableItems
    .map(item => ({
      item,
      contribution: manualEnvelopeHostileContribution(item, claimIsEffectivelyHostile),
    }))
    .filter(({contribution}) => contribution)
    .map(({item, contribution}) => {
      const region = regionByName[item.region];
      return {
        path: region.path,
        regionName: item.region,
        className: `claim-hatch-group hostile manual-envelope-hostile-hatch manual-envelope-depth-${contribution.depth}`,
        groupKey: `manual-envelope-hostile:${contribution.depth}:${contribution.claimant}:${contribution.project || ''}`,
        dataset: {
          envelopeHostile: '1',
          envelopeDepth: contribution.depth,
          envelopeClaimant: contribution.claimant,
          envelopeParent: contribution.parentClaimant,
          envelopeViaCapital: contribution.viaCapitalRegion,
          envelopeProject: contribution.project,
          envelopeTier: contribution.tier,
          envelopeKind: contribution.kind,
        },
      };
    });
  const hatchGroups = buildVisualFillGroups(hatchDescriptors);
  const renderNamespace = nextClaimOverlayRenderNamespace();
  return createProjectedCopyFragment(copyContexts, 'manual-envelope-copy', copyContext => {
    const fragment = document.createDocumentFragment();
    const copyData = worldCopyDataset(copyContext);
    for (const group of fillGroups) {
      fragment.appendChild(createSvgElement('path', {
        d: group.paths.join(' '),
        class: group.className,
        fill: group.fill,
        'aria-label': t('manualEnvelope.depth', {
          depth: group.dataset.envelopeDepth || '0',
        }),
      }, {
        ...group.dataset,
        visualGroupSize: group.paths.length,
        ...copyData,
      }));
    }
    hatchGroups.forEach((group, index) => {
      if (!group.paths.length) return;
      const patternId = hatchPatternId(renderNamespace, group, copyContext, index);
      const defs = createSvgElement('defs');
      defs.appendChild(createClaimHatchPattern(patternId));
      fragment.appendChild(defs);
      fragment.appendChild(createSvgElement('path', {
        d: group.paths.join(' '),
        class: group.className,
        fill: `url(#${patternId})`,
      }, {
        ...group.dataset,
        regions: group.regions.join(' '),
        visualGroupSize: group.paths.length,
        ...copyData,
      }));
    });
    for (const item of renderableItems) {
      const region = regionByName[item.region];
      const primary = item.primary;
      const hasOverlap = item.overlapSources.length > 1;
      const overlapColor = hasOverlap
        ? manualEnvelopeOverlapColor(item.overlapSources.length)
        : '';
      fragment.appendChild(createSvgElement('path', {
        d: region.path,
        class: `manual-envelope-region-outline manual-envelope-depth-${primary.depth}${hasOverlap ? ' has-overlap' : ''}`,
        fill: 'none',
        stroke: overlapColor || null,
        'aria-label': manualEnvelopeRegionLabel(item, context),
      }, {
        region: item.region,
        envelopeDepth: primary.depth,
        envelopeClaimant: primary.claimant,
        envelopeParent: primary.parentClaimant,
        envelopeViaCapital: primary.viaCapitalRegion,
        envelopeProject: primary.project,
        envelopeTier: primary.tier,
        envelopeKind: primary.kind,
        envelopeSourceCount: item.overlapSources.length,
        ...copyData,
      }));
      if (!hasOverlap) continue;
      fragment.appendChild(createSvgElement('path', {
        d: region.path,
        class: 'manual-envelope-overlap',
        fill: 'none',
        stroke: overlapColor,
        'aria-label': manualEnvelopeOverlapLabel(item, context),
      }, {
        region: item.region,
        envelopeOverlap: '1',
        envelopeSourceCount: item.overlapSources.length,
        ...copyData,
      }));
    }
    return fragment;
  });
}

function manualEnvelopeRenderKey({model, copyContexts, keyContext, hostileHatchingDisabled}) {
  if (!model?.regionItems?.length) return MANUAL_ENVELOPE_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'manual-envelope',
    copyPlan: copyContextRenderKey(copyContexts),
    data: keyContext.data || '',
    language: keyContext.language || '',
    anchor: model.anchorNation,
    sourceKey: model.sourceKey,
    regionKey: model.regionKey,
    claimMode: keyContext.claimMode || '',
    claimKind: keyContext.claimKind || '',
    project: keyContext.project || '',
    hostileHatchDisabled: hostileHatchingDisabled ? 1 : 0,
  });
}

export function createManualEnvelopeRenderer({layer = null} = {}) {
  let layerRenderKeys = new WeakMap();
  let destroyed = false;

  function resolveLayer(context = {}) {
    return context.layer || layer;
  }

  function render(context = {}) {
    if (destroyed) return false;
    const targetLayer = resolveLayer(context);
    if (!targetLayer) return false;
    const {
      model = null,
      copyContexts,
      keyContext = {},
      hostileHatchingDisabled = false,
      recordRenderStat = () => {},
    } = context;
    const nextKey = manualEnvelopeRenderKey({
      model,
      copyContexts,
      keyContext,
      hostileHatchingDisabled,
    });
    if (layerRenderKeys.get(targetLayer) === nextKey) return false;
    recordRenderStat('manualEnvelopeRebuilds');
    replaceLayerChildren(
      targetLayer,
      model ? createManualEnvelopeFragment(model, context) : document.createDocumentFragment()
    );
    layerRenderKeys.set(targetLayer, nextKey);
    return true;
  }

  function clear(context = {}) {
    if (destroyed) return false;
    const targetLayer = resolveLayer(context);
    if (!targetLayer || layerRenderKeys.get(targetLayer) === MANUAL_ENVELOPE_EMPTY_RENDER_KEY) {
      return false;
    }
    (context.recordRenderStat || (() => {}))('manualEnvelopeRebuilds');
    replaceLayerChildren(targetLayer, document.createDocumentFragment());
    layerRenderKeys.set(targetLayer, MANUAL_ENVELOPE_EMPTY_RENDER_KEY);
    return true;
  }

  function reset(context = {}) {
    if (destroyed) return false;
    const changed = clear(context);
    layerRenderKeys = new WeakMap();
    return changed;
  }

  function destroy(context = {}) {
    if (destroyed) return false;
    reset(context);
    destroyed = true;
    layer = null;
    return true;
  }

  return Object.freeze({render, clear, reset, destroy});
}
