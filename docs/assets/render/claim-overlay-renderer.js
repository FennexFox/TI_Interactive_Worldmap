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

const CLAIM_OVERLAY_EMPTY_RENDER_KEY = 'claim-overlay-paths:empty';
const CLAIM_LABEL_EMPTY_RENDER_KEY = 'claim-labels:empty';
const CLAIM_HATCH_SPACING = 0.055;

let claimOverlayRenderIdSequence = 0;

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

function formatHatchNumber(value) {
  return Number(value).toFixed(6);
}

export function nextClaimOverlayRenderNamespace() {
  const namespace = claimOverlayRenderIdSequence;
  claimOverlayRenderIdSequence += 1;
  return namespace;
}

export function hatchPatternId(namespace, group, copyContext, index) {
  const copy = String(copyContext.copyIndex).replace(/[^A-Za-z0-9_-]/g, '-');
  const key = String(group.key || index).replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 80);
  return `hostile-claim-hatch-pattern-${namespace}-${copy}-${index}-${key}`;
}

function claimOverlayReferenceId(namespace, kind, index, key = '') {
  const safeKey = String(key || index).replace(/[^A-Za-z0-9_-]/g, '-');
  return `claim-overlay-ref-${namespace}-${kind}-${index}-${safeKey}`;
}

export function createClaimHatchPattern(patternId) {
  const pattern = createSvgElement('pattern', {
    id: patternId,
    patternUnits: 'userSpaceOnUse',
    width: formatHatchNumber(CLAIM_HATCH_SPACING),
    height: formatHatchNumber(CLAIM_HATCH_SPACING),
    patternTransform: 'rotate(45)',
  });
  pattern.appendChild(createSvgElement('path', {
    d: `M 0 0 L 0 ${formatHatchNumber(CLAIM_HATCH_SPACING * 2)}`,
    class: 'claim-hatch-line',
  }));
  return pattern;
}

function createClaimOverlayPathFragment({
  descriptors = [],
  copyContexts,
  regionByName,
  hostileHatchingDisabled = false,
  includeOutlines = false,
} = {}) {
  const fillDescriptors = [];
  const hatchDescriptors = [];
  const outlineDescriptors = [];
  const renderNamespace = nextClaimOverlayRenderNamespace();
  for (const descriptor of descriptors) {
    const region = regionByName?.[descriptor.region];
    if (!region) continue;
    fillDescriptors.push({
      path: region.path,
      regionName: descriptor.region,
      className: descriptor.fillClassName || 'claim-fill-group',
      fill: descriptor.fill,
      fillOpacity: descriptor.fillOpacity,
      groupKey: descriptor.fillKey || `${descriptor.project || ''}:${descriptor.fill || ''}`,
      dataset: {
        fillKey: descriptor.fillKey || descriptor.project || descriptor.fill || '',
        project: descriptor.project,
      },
    });
    if (descriptor.hatchClassName && !hostileHatchingDisabled) {
      hatchDescriptors.push({
        path: region.path,
        regionName: descriptor.region,
        className: descriptor.hatchClassName,
        groupKey: descriptor.hatchKey || descriptor.project || '',
        fillOpacity: descriptor.fillOpacity,
        dataset: {
          hatchKey: descriptor.hatchKey || descriptor.project || '',
          project: descriptor.project,
        },
      });
    }
    if (includeOutlines) outlineDescriptors.push({descriptor, region});
  }
  const fillGroups = buildVisualFillGroups(fillDescriptors);
  const hatchGroups = buildVisualFillGroups(hatchDescriptors);
  const fillReferenceIds = fillGroups.map((group, index) => (
    claimOverlayReferenceId(renderNamespace, 'fill', index, group.key)
  ));
  const outlineReferenceIds = outlineDescriptors.map(({descriptor}, index) => (
    claimOverlayReferenceId(renderNamespace, 'outline', index, descriptor.region)
  ));
  return createProjectedCopyFragment(copyContexts, 'claim-overlay-copy', copyContext => {
    const fragment = document.createDocumentFragment();
    const copyData = worldCopyDataset(copyContext);
    for (const [index, group] of fillGroups.entries()) {
      const attrs = {
        class: group.className,
        fill: group.fill,
        'fill-opacity': group.fillOpacity === '' ? null : group.fillOpacity,
      };
      const dataset = {
        ...group.dataset,
        regions: group.regions.join(' '),
        visualGroupSize: group.paths.length,
        ...copyData,
      };
      if (copyContext.isCanonical) {
        fragment.appendChild(createSvgElement('path', {
          id: fillReferenceIds[index],
          d: group.paths.join(' '),
          ...attrs,
        }, dataset));
      } else {
        fragment.appendChild(createSvgElement('use', {
          href: `#${fillReferenceIds[index]}`,
          ...attrs,
        }, dataset));
      }
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
        opacity: group.fillOpacity === '' ? null : group.fillOpacity,
      }, {
        ...group.dataset,
        regions: group.regions.join(' '),
        visualGroupSize: group.paths.length,
        ...copyData,
      }));
    });
    for (const [index, {descriptor, region}] of outlineDescriptors.entries()) {
      const attrs = {
        class: descriptor.className,
        fill: 'none',
      };
      const dataset = {
        region: descriptor.region,
        project: descriptor.project,
        ...copyData,
      };
      if (copyContext.isCanonical) {
        fragment.appendChild(createSvgElement('path', {
          id: outlineReferenceIds[index],
          d: region.path,
          ...attrs,
        }, dataset));
      } else {
        fragment.appendChild(createSvgElement('use', {
          href: `#${outlineReferenceIds[index]}`,
          ...attrs,
        }, dataset));
      }
    }
    return fragment;
  });
}

function createClaimLabelFragment({descriptors = [], copyContexts} = {}) {
  return createProjectedCopyFragment(copyContexts, 'claim-label-copy', copyContext => {
    const fragment = document.createDocumentFragment();
    const copyData = worldCopyDataset(copyContext);
    for (const descriptor of descriptors) {
      fragment.appendChild(createSvgElement('text', {
        class: 'claim-label',
        x: descriptor.x,
        y: descriptor.y,
        textContent: descriptor.text,
      }, {
        region: descriptor.region,
        ...copyData,
      }));
    }
    return fragment;
  });
}

function runAfterAnimationFrames(windowRef, frameCount, callback) {
  if (frameCount <= 0) {
    callback();
    return () => {};
  }
  let remaining = frameCount;
  let frameId = 0;
  let cancelled = false;
  const step = () => {
    if (cancelled) return;
    remaining -= 1;
    if (remaining <= 0) callback();
    else frameId = windowRef.requestAnimationFrame(step);
  };
  frameId = windowRef.requestAnimationFrame(step);
  return () => {
    if (cancelled) return;
    cancelled = true;
    if (frameId && typeof windowRef.cancelAnimationFrame === 'function') {
      windowRef.cancelAnimationFrame(frameId);
    }
  };
}

function setOverlayBufferActive(buffer, active) {
  if (!buffer) return;
  buffer.style.display = active ? '' : 'none';
  buffer.dataset.overlayBufferActive = active ? '1' : '0';
  buffer.setAttribute('aria-hidden', active ? 'false' : 'true');
}

function createOverlayBufferGroup(className, index, active = false) {
  const buffer = createSvgElement('g', {class: className}, {overlayBuffer: index});
  setOverlayBufferActive(buffer, active);
  return buffer;
}

function getBufferedLayerState(layer, stateStore, bufferClassName) {
  if (!layer) return null;
  let state = stateStore.get(layer);
  if (state) return state;
  const buffers = [
    createOverlayBufferGroup(bufferClassName, 0, true),
    createOverlayBufferGroup(bufferClassName, 1, false),
  ];
  replaceLayerChildren(layer, buffers);
  state = {
    buffers,
    visibleIndex: 0,
    generation: 0,
    pendingKey: '',
    pendingGeneration: 0,
    pendingCancel: null,
  };
  stateStore.set(layer, state);
  return state;
}

function clearBufferedLayer({
  layer,
  keyStore,
  stateStore,
  bufferClassName,
  emptyKey,
  statKey,
  staleStatKey,
  recordRenderStat,
}) {
  if (!layer) return false;
  const state = getBufferedLayerState(layer, stateStore, bufferClassName);
  const alreadyEmpty = keyStore.get(layer) === emptyKey
    && state.buffers.every(buffer => !buffer.childNodes.length)
    && !state.pendingKey;
  if (alreadyEmpty) return false;
  if (state.pendingCancel) {
    state.pendingCancel();
    state.pendingCancel = null;
    recordRenderStat(staleStatKey);
  }
  state.generation += 1;
  state.pendingKey = '';
  state.pendingGeneration = 0;
  state.visibleIndex = 0;
  state.buffers.forEach((buffer, index) => {
    replaceLayerChildren(buffer);
    delete buffer.dataset.renderGeneration;
    setOverlayBufferActive(buffer, index === state.visibleIndex);
  });
  keyStore.set(layer, emptyKey);
  recordRenderStat(statKey);
  return true;
}

function replaceBufferedLayer({
  layer,
  keyStore,
  stateStore,
  bufferClassName,
  nextKey,
  buildChildren,
  statKey,
  inactiveBufferStatKey,
  swapStatKey,
  staleStatKey,
  recordRenderStat,
  windowRef,
  commitDelayFrames,
}) {
  if (!layer) return false;
  const state = getBufferedLayerState(layer, stateStore, bufferClassName);
  if (keyStore.get(layer) === nextKey) {
    if (state.pendingKey && state.pendingKey !== nextKey) {
      state.pendingCancel?.();
      state.pendingCancel = null;
      recordRenderStat(staleStatKey);
      state.generation += 1;
      state.pendingKey = '';
      state.pendingGeneration = 0;
    }
    return false;
  }

  if (state.pendingCancel) {
    state.pendingCancel();
    state.pendingCancel = null;
    recordRenderStat(staleStatKey);
  }
  const generation = state.generation + 1;
  state.generation = generation;
  state.pendingKey = nextKey;
  state.pendingGeneration = generation;
  const inactiveIndex = state.visibleIndex === 0 ? 1 : 0;
  const inactiveBuffer = state.buffers[inactiveIndex];
  replaceLayerChildren(inactiveBuffer, buildChildren());
  inactiveBuffer.dataset.renderGeneration = String(generation);
  recordRenderStat(inactiveBufferStatKey);

  const cancelPending = runAfterAnimationFrames(windowRef, commitDelayFrames, () => {
    state.pendingCancel = null;
    const stillCurrent = state.generation === generation
      && state.pendingGeneration === generation
      && state.pendingKey === nextKey;
    if (!stillCurrent) {
      recordRenderStat(staleStatKey);
      if (inactiveBuffer.dataset.renderGeneration === String(generation)) {
        replaceLayerChildren(inactiveBuffer);
        delete inactiveBuffer.dataset.renderGeneration;
      }
      return;
    }

    const previousBuffer = state.buffers[state.visibleIndex];
    state.visibleIndex = inactiveIndex;
    state.pendingKey = '';
    state.pendingGeneration = 0;
    delete inactiveBuffer.dataset.renderGeneration;
    setOverlayBufferActive(inactiveBuffer, true);
    setOverlayBufferActive(previousBuffer, false);
    replaceLayerChildren(previousBuffer);
    delete previousBuffer.dataset.renderGeneration;
    keyStore.set(layer, nextKey);
    recordRenderStat(statKey);
    recordRenderStat(swapStatKey);
  });
  state.pendingCancel = commitDelayFrames > 0 ? cancelPending : null;
  return true;
}

function overlayPathRenderKey({model, descriptorSet, copyContexts, hostileHatchingDisabled}) {
  if (!model) return CLAIM_OVERLAY_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'claim-overlay-paths',
    copyPlan: copyContextRenderKey(copyContexts),
    descriptorKey: descriptorSet?.cacheKey || '',
    hostileHatchDisabled: hostileHatchingDisabled ? 1 : 0,
  });
}

function labelRenderKey({model, descriptorSet, copyContexts}) {
  if (!model) return CLAIM_LABEL_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'claim-labels',
    copyPlan: copyContextRenderKey(copyContexts),
    descriptorKey: descriptorSet?.cacheKey || '',
  });
}

export function createClaimOverlayRenderer({
  claimOverlayLayer = null,
  claimLabelLayer = null,
} = {}) {
  let overlayLayerRenderKeys = new WeakMap();
  let labelLayerRenderKeys = new WeakMap();
  let overlayBufferStates = new WeakMap();
  let labelBufferStates = new WeakMap();
  let destroyed = false;

  function resolveLayers(context = {}) {
    return {
      overlayLayer: context.claimOverlayLayer || claimOverlayLayer,
      labelLayer: context.claimLabelLayer || claimLabelLayer,
    };
  }

  function render(context = {}) {
    if (destroyed) return false;
    const {
      model = null,
      overlayDescriptorSet = {cacheKey: '', descriptors: []},
      labelDescriptorSet = {cacheKey: '', descriptors: []},
      copyContexts,
      regionByName,
      hostileHatchingDisabled = false,
      recordRenderStat = () => {},
      commitDelayFrames = 0,
      window: windowRef = globalThis.window,
    } = context;
    const {overlayLayer, labelLayer} = resolveLayers(context);
    const overlayChanged = replaceBufferedLayer({
      layer: overlayLayer,
      keyStore: overlayLayerRenderKeys,
      stateStore: overlayBufferStates,
      bufferClassName: 'claim-overlay-buffer',
      nextKey: overlayPathRenderKey({
        model,
        descriptorSet: overlayDescriptorSet,
        copyContexts,
        hostileHatchingDisabled,
      }),
      buildChildren: () => createClaimOverlayPathFragment({
        descriptors: overlayDescriptorSet.descriptors,
        copyContexts,
        regionByName,
        hostileHatchingDisabled,
      }),
      statKey: 'claimOverlayDomReplacements',
      inactiveBufferStatKey: 'claimOverlayInactiveBufferRebuilds',
      swapStatKey: 'claimOverlayBufferSwaps',
      staleStatKey: 'claimOverlayStaleRenderSkips',
      recordRenderStat,
      windowRef,
      commitDelayFrames,
    });
    const labelsChanged = replaceBufferedLayer({
      layer: labelLayer,
      keyStore: labelLayerRenderKeys,
      stateStore: labelBufferStates,
      bufferClassName: 'claim-label-buffer',
      nextKey: labelRenderKey({
        model,
        descriptorSet: labelDescriptorSet,
        copyContexts,
      }),
      buildChildren: () => createClaimLabelFragment({
        descriptors: labelDescriptorSet.descriptors,
        copyContexts,
      }),
      statKey: 'claimLabelDomReplacements',
      inactiveBufferStatKey: 'claimLabelInactiveBufferRebuilds',
      swapStatKey: 'claimLabelBufferSwaps',
      staleStatKey: 'claimLabelStaleRenderSkips',
      recordRenderStat,
      windowRef,
      commitDelayFrames,
    });
    return overlayChanged || labelsChanged;
  }

  function clear(context = {}) {
    if (destroyed) return false;
    const {overlayLayer, labelLayer} = resolveLayers(context);
    const recordRenderStat = context.recordRenderStat || (() => {});
    const overlayChanged = clearBufferedLayer({
      layer: overlayLayer,
      keyStore: overlayLayerRenderKeys,
      stateStore: overlayBufferStates,
      bufferClassName: 'claim-overlay-buffer',
      emptyKey: CLAIM_OVERLAY_EMPTY_RENDER_KEY,
      statKey: 'claimOverlayDomReplacements',
      staleStatKey: 'claimOverlayStaleRenderSkips',
      recordRenderStat,
    });
    const labelsChanged = clearBufferedLayer({
      layer: labelLayer,
      keyStore: labelLayerRenderKeys,
      stateStore: labelBufferStates,
      bufferClassName: 'claim-label-buffer',
      emptyKey: CLAIM_LABEL_EMPTY_RENDER_KEY,
      statKey: 'claimLabelDomReplacements',
      staleStatKey: 'claimLabelStaleRenderSkips',
      recordRenderStat,
    });
    return overlayChanged || labelsChanged;
  }

  function reset(context = {}) {
    if (destroyed) return false;
    const changed = clear(context);
    overlayLayerRenderKeys = new WeakMap();
    labelLayerRenderKeys = new WeakMap();
    overlayBufferStates = new WeakMap();
    labelBufferStates = new WeakMap();
    return changed;
  }

  function destroy(context = {}) {
    if (destroyed) return false;
    reset(context);
    destroyed = true;
    claimOverlayLayer = null;
    claimLabelLayer = null;
    return true;
  }

  function createOverlayFragment(context = {}) {
    if (destroyed) return document.createDocumentFragment();
    return createClaimOverlayPathFragment(context);
  }

  return Object.freeze({
    render,
    clear,
    reset,
    destroy,
    createOverlayFragment,
  });
}
