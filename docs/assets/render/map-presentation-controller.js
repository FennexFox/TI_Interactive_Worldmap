// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {normalizeWorldCopyContexts} from './map-layers.js';

const HOVER_CLAIM_PREVIEW_EMPTY_RENDER_KEY = 'hover-claim-preview:empty';
const MARKER_KINDS = new Set(['capital', 'pinned', 'hover', 'selection', 'reachable']);

function noop() {}

function copyContextRenderKey(copyContexts) {
  return normalizeWorldCopyContexts(copyContexts)
    .map(context => `${context.copyIndex}:${context.xOffset}:${context.isCanonical ? 1 : 0}`)
    .join('|');
}

function hoverClaimPreviewRenderKey(model, descriptorSet, copyContexts) {
  if (!model) return HOVER_CLAIM_PREVIEW_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'hover-claim-preview',
    copyPlan: copyContextRenderKey(copyContexts),
    descriptorKey: descriptorSet?.cacheKey || '',
  });
}

export function createMapPresentationController({
  claimOverlayRenderer,
  manualEnvelopeRenderer,
  mapMarkerRenderer,
  hoverPreviewLayer = null,
  getContext = () => ({}),
} = {}) {
  let hoverClaimPreviewVisualKey = '';
  let previewLayer = hoverPreviewLayer;
  let destroyed = false;

  const context = () => getContext?.() || {};
  const renderStat = current => current.recordRenderStat || noop;
  const resolvedCopyContexts = (request, current) => (
    request.copyContexts || current.copyContexts
  );
  const resolvePreviewLayer = request => (
    request.layer || request.hoverPreviewLayer || previewLayer
  );

  function replacePreviewLayer(layer, children = null) {
    if (!layer?.replaceChildren) return false;
    if (children) layer.replaceChildren(children);
    else layer.replaceChildren();
    return true;
  }

  function markHoverClaimPreviewFragment(fragment, nation = '') {
    for (const element of (
      fragment?.querySelectorAll?.('.claim-overlay, .claim-fill-group') || []
    )) {
      element.dataset.preview = 'hover-claim';
      if (nation) element.dataset.nation = nation;
    }
    return fragment;
  }

  function renderHoverPreview(request = {}) {
    if (destroyed) return false;
    const current = context();
    const layer = resolvePreviewLayer(request);
    if (!layer) return false;
    const model = request.model || null;
    const descriptorSet = (
      request.descriptorSet
      || request.overlayDescriptorSet
      || {cacheKey: '', descriptors: []}
    );
    const copyContexts = resolvedCopyContexts(request, current);
    const nextKey = hoverClaimPreviewRenderKey(model, descriptorSet, copyContexts);
    if (!request.force && nextKey === hoverClaimPreviewVisualKey) return false;

    let fragment = null;
    if (model) {
      fragment = claimOverlayRenderer?.createOverlayFragment?.({
        descriptors: descriptorSet.descriptors,
        copyContexts,
        regionByName: request.regionByName || current.regionByName,
        includeOutlines: request.includeOutlines ?? true,
        hostileHatchingDisabled: (
          request.hostileHatchingDisabled
          ?? current.hostileHatchingDisabled
          ?? false
        ),
      });
      markHoverClaimPreviewFragment(fragment, request.nation || model.nation || '');
    }
    if (!replacePreviewLayer(layer, fragment)) return false;
    hoverClaimPreviewVisualKey = nextKey;
    renderStat(current)('hoverClaimPreviewOverlayReplacements');
    return true;
  }

  function renderClaimOverlay(request = {}) {
    if (destroyed) return false;
    const current = context();
    return claimOverlayRenderer?.render?.({
      ...current,
      ...request,
      model: request.model || null,
      overlayDescriptorSet: (
        request.overlayDescriptorSet
        || {cacheKey: '', descriptors: []}
      ),
      labelDescriptorSet: (
        request.labelDescriptorSet
        || {cacheKey: '', descriptors: []}
      ),
      copyContexts: resolvedCopyContexts(request, current),
      regionByName: request.regionByName || current.regionByName,
      hostileHatchingDisabled: (
        request.hostileHatchingDisabled
        ?? current.hostileHatchingDisabled
        ?? false
      ),
      recordRenderStat: renderStat(current),
      commitDelayFrames: (
        request.commitDelayFrames
        ?? current.claimOverlayCommitDelayFrames
        ?? 0
      ),
      window: request.window || current.window || globalThis.window,
    }) || false;
  }

  function renderManualEnvelope(request = {}) {
    if (destroyed) return false;
    const current = context();
    return manualEnvelopeRenderer?.render?.({
      ...current,
      ...request,
      model: request.model || null,
      copyContexts: resolvedCopyContexts(request, current),
      keyContext: {
        data: current.dataKey || '',
        language: current.language || '',
        claimMode: current.claimMode || '',
        claimKind: current.claimKind || '',
        project: current.projectFilter || '',
        ...(request.keyContext || {}),
      },
      regionByName: request.regionByName || current.regionByName,
      hostileHatchingDisabled: (
        request.hostileHatchingDisabled
        ?? current.hostileHatchingDisabled
        ?? false
      ),
      recordRenderStat: renderStat(current),
    }) || false;
  }

  function renderMarker(kind, request = {}) {
    if (destroyed) return false;
    const current = context();
    return mapMarkerRenderer?.render?.({
      ...current,
      ...request,
      kind,
      copyContexts: resolvedCopyContexts(request, current),
      regionByName: request.regionByName || current.regionByName,
      language: request.language || current.language,
      recordRenderStat: renderStat(current),
      setRenderStat: request.setRenderStat || current.setRenderStat || noop,
      debugRenderStats: request.debugRenderStats || current.debugRenderStats || null,
    }) || false;
  }

  function render(request = {}) {
    const {kind = ''} = request;
    if (kind === 'hover-preview') return renderHoverPreview(request);
    if (kind === 'claim') return renderClaimOverlay(request);
    if (kind === 'manual-envelope') return renderManualEnvelope(request);
    if (MARKER_KINDS.has(kind)) return renderMarker(kind, request);
    throw new TypeError(`Unknown map presentation render kind: ${kind || '(empty)'}`);
  }

  function clearHoverPreview(request = {}) {
    return renderHoverPreview({...request, model: null});
  }

  function clear(request = {}) {
    if (destroyed) return false;
    const current = context();
    const {kind = ''} = request;
    if (kind === 'hover-preview') return clearHoverPreview(request);
    if (kind === 'claim') {
      return claimOverlayRenderer?.clear?.({
        ...current,
        ...request,
        recordRenderStat: renderStat(current),
      }) || false;
    }
    if (kind === 'manual-envelope') {
      return manualEnvelopeRenderer?.clear?.({
        ...current,
        ...request,
        recordRenderStat: renderStat(current),
      }) || false;
    }
    if (MARKER_KINDS.has(kind)) {
      return mapMarkerRenderer?.clear?.({...current, ...request, kind}) || false;
    }
    if (kind) throw new TypeError(`Unknown map presentation clear kind: ${kind}`);

    const previewChanged = clearHoverPreview(request);
    const claimChanged = claimOverlayRenderer?.clear?.({
      ...current,
      ...request,
      recordRenderStat: renderStat(current),
    }) || false;
    const manualChanged = manualEnvelopeRenderer?.clear?.({
      ...current,
      ...request,
      recordRenderStat: renderStat(current),
    }) || false;
    const markerChanged = mapMarkerRenderer?.clear?.({...current, ...request}) || false;
    return previewChanged || claimChanged || manualChanged || markerChanged;
  }

  function reset(request = {}) {
    if (destroyed) return false;
    const current = context();
    const previewChanged = clearHoverPreview({...request, force: true});
    hoverClaimPreviewVisualKey = '';
    const claimChanged = claimOverlayRenderer?.reset?.({
      ...current,
      ...request,
      recordRenderStat: renderStat(current),
    }) || false;
    const manualChanged = manualEnvelopeRenderer?.reset?.({
      ...current,
      ...request,
      recordRenderStat: renderStat(current),
    }) || false;
    const markerChanged = mapMarkerRenderer?.reset?.({...current, ...request}) || false;
    return previewChanged || claimChanged || manualChanged || markerChanged;
  }

  function destroy(request = {}) {
    if (destroyed) return false;
    const current = context();
    clearHoverPreview({...request, force: true});
    const claimChanged = claimOverlayRenderer?.destroy?.({
      ...current,
      ...request,
      recordRenderStat: renderStat(current),
    }) || false;
    const manualChanged = manualEnvelopeRenderer?.destroy?.({
      ...current,
      ...request,
      recordRenderStat: renderStat(current),
    }) || false;
    const markerChanged = mapMarkerRenderer?.destroy?.({...current, ...request}) || false;
    destroyed = true;
    previewLayer = null;
    hoverClaimPreviewVisualKey = '';
    return claimChanged || manualChanged || markerChanged || true;
  }

  return Object.freeze({
    render,
    clear,
    reset,
    destroy,
    renderHoverPreview,
    renderClaimOverlay,
    renderManualEnvelope,
    renderCapitalMarkers: request => renderMarker('capital', request),
    renderPinnedRegionMarkers: request => renderMarker('pinned', request),
    renderHoverOutlines: request => renderMarker('hover', request),
    renderSelectionOutlines: request => renderMarker('selection', request),
    renderReachableCapitalCandidates: request => renderMarker('reachable', request),
    clearHoverPreview,
    syncReachableHoverState(request = {}) {
      if (destroyed) return;
      const current = context();
      mapMarkerRenderer?.syncReachableHoverState?.({...current, ...request});
    },
  });
}
