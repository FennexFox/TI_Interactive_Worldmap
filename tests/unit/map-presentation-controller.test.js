// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {createMapPresentationController} from '../../src/render/map-presentation-controller.js';

function createRendererDouble({withFragment = false} = {}) {
  const calls = [];
  const renderer = {};
  for (const method of ['render', 'clear', 'reset', 'destroy']) {
    renderer[method] = context => {
      calls.push({method, context});
      return true;
    };
  }
  if (withFragment) {
    renderer.createOverlayFragment = context => {
      const nodes = [{dataset: {}}, {dataset: {}}];
      const fragment = {
        nodes,
        querySelectorAll: selector => {
          assert.equal(selector, '.claim-overlay, .claim-fill-group');
          return nodes;
        },
      };
      calls.push({method: 'createOverlayFragment', context, fragment});
      return fragment;
    };
  }
  renderer.syncReachableHoverState = context => {
    calls.push({method: 'syncReachableHoverState', context});
  };
  return {renderer, calls};
}

function createLayer() {
  return {
    replacements: [],
    replaceChildren(...children) {
      this.replacements.push(children);
    },
  };
}

function createHarness() {
  const claim = createRendererDouble({withFragment: true});
  const manual = createRendererDouble();
  const marker = createRendererDouble();
  const layer = createLayer();
  const stats = {};
  const context = {
    copyContexts: [{copyIndex: 0, xOffset: 0, isCanonical: true}],
    regionByName: {Alpha: {regionName: 'Alpha'}},
    language: 'en',
    claimMode: 'all',
    claimKind: 'all',
    projectFilter: '',
    dataKey: '2026:3:2',
    hostileHatchingDisabled: true,
    claimOverlayCommitDelayFrames: 2,
    debugRenderStats: {enabled: true},
    window: {name: 'fake-window'},
    recordRenderStat(key) {
      stats[key] = (stats[key] || 0) + 1;
    },
    setRenderStat() {},
  };
  const controller = createMapPresentationController({
    claimOverlayRenderer: claim.renderer,
    manualEnvelopeRenderer: manual.renderer,
    mapMarkerRenderer: marker.renderer,
    hoverPreviewLayer: layer,
    getContext: () => context,
  });
  return {controller, claim, manual, marker, layer, stats, context};
}

test('hover preview preserves render key, copy plan, dataset, and counter semantics', () => {
  const harness = createHarness();
  const {controller, claim, layer, stats, context} = harness;
  const model = {nation: 'AAA'};
  const descriptorSet = {
    cacheKey: 'overlay:AAA',
    descriptors: [{region: 'Alpha'}],
  };

  assert.equal(controller.render({
    kind: 'hover-preview',
    model,
    descriptorSet,
    nation: 'AAA',
  }), true);
  assert.equal(layer.replacements.length, 1);
  assert.equal(stats.hoverClaimPreviewOverlayReplacements, 1);
  const fragmentCall = claim.calls.find(call => call.method === 'createOverlayFragment');
  assert.equal(fragmentCall.context.descriptors, descriptorSet.descriptors);
  assert.deepEqual(
    fragmentCall.fragment.nodes.map(node => node.dataset),
    [
      {preview: 'hover-claim', nation: 'AAA'},
      {preview: 'hover-claim', nation: 'AAA'},
    ]
  );

  assert.equal(controller.renderHoverPreview({model, descriptorSet, nation: 'AAA'}), false);
  assert.equal(layer.replacements.length, 1);
  assert.equal(stats.hoverClaimPreviewOverlayReplacements, 1);

  context.copyContexts = [
    {copyIndex: -1, xOffset: -4, isCanonical: false},
    {copyIndex: 0, xOffset: 0, isCanonical: true},
    {copyIndex: 1, xOffset: 4, isCanonical: false},
  ];
  assert.equal(controller.renderHoverPreview({model, descriptorSet, nation: 'AAA'}), true);
  assert.equal(layer.replacements.length, 2);
  assert.equal(stats.hoverClaimPreviewOverlayReplacements, 2);

  assert.equal(controller.clearHoverPreview(), true);
  assert.equal(layer.replacements.at(-1).length, 0);
  assert.equal(controller.clearHoverPreview(), false);
  assert.equal(stats.hoverClaimPreviewOverlayReplacements, 3);
});

test('claim, manual-envelope, and marker rendering receive live context and completed inputs', () => {
  const harness = createHarness();
  const {controller, claim, manual, marker, context} = harness;
  const model = {nation: 'AAA'};
  const overlayDescriptorSet = {cacheKey: 'overlay', descriptors: [{region: 'Alpha'}]};
  const labelDescriptorSet = {cacheKey: 'labels', descriptors: [{text: 'A'}]};

  assert.equal(controller.render({
    kind: 'claim',
    model,
    overlayDescriptorSet,
    labelDescriptorSet,
  }), true);
  const claimCall = claim.calls.find(call => call.method === 'render');
  assert.equal(claimCall.context.model, model);
  assert.equal(claimCall.context.overlayDescriptorSet, overlayDescriptorSet);
  assert.equal(claimCall.context.labelDescriptorSet, labelDescriptorSet);
  assert.equal(claimCall.context.commitDelayFrames, 2);
  assert.equal(claimCall.context.window, context.window);
  assert.equal(claimCall.context.hostileHatchingDisabled, true);

  context.language = 'ko';
  context.projectFilter = 'Project_Test';
  assert.equal(controller.render({
    kind: 'manual-envelope',
    model,
    keyContext: {data: 'custom-data'},
  }), true);
  const manualCall = manual.calls.find(call => call.method === 'render');
  assert.deepEqual(manualCall.context.keyContext, {
    data: 'custom-data',
    language: 'ko',
    claimMode: 'all',
    claimKind: 'all',
    project: 'Project_Test',
  });
  assert.equal(manualCall.context.model, model);

  const markerRequests = [
    ['capital', {markers: [{regionName: 'Alpha'}]}],
    ['pinned', {pinned: ['Alpha']}],
    ['hover', {region: context.regionByName.Alpha}],
    ['selection', {selectedRegionNames: ['Alpha']}],
    ['reachable', {candidates: [{region: 'Alpha'}]}],
  ];
  markerRequests.forEach(([kind, request]) => {
    assert.equal(controller.render({kind, ...request}), true);
  });
  assert.deepEqual(
    marker.calls.filter(call => call.method === 'render').map(call => call.context.kind),
    markerRequests.map(([kind]) => kind)
  );
  assert.equal(
    marker.calls.filter(call => call.method === 'render').every(
      call => call.context.language === 'ko'
        && call.context.regionByName === context.regionByName
        && call.context.copyContexts === context.copyContexts
    ),
    true
  );

  controller.syncReachableHoverState({hoveredRegionName: 'Alpha'});
  assert.equal(marker.calls.at(-1).method, 'syncReachableHoverState');
  assert.equal(marker.calls.at(-1).context.hoveredRegionName, 'Alpha');
});

test('clear, reset, and destroy delegate lifecycle once and become inert after destroy', () => {
  const harness = createHarness();
  const {controller, claim, manual, marker, layer} = harness;

  controller.renderHoverPreview({
    model: {nation: 'AAA'},
    descriptorSet: {cacheKey: 'AAA', descriptors: []},
  });
  assert.equal(controller.clear({kind: 'claim'}), true);
  assert.equal(controller.clear({kind: 'manual-envelope'}), true);
  assert.equal(controller.clear({kind: 'selection'}), true);
  assert.equal(claim.calls.filter(call => call.method === 'clear').length, 1);
  assert.equal(manual.calls.filter(call => call.method === 'clear').length, 1);
  assert.equal(marker.calls.filter(call => call.method === 'clear').length, 1);

  assert.equal(controller.reset(), true);
  assert.equal(claim.calls.filter(call => call.method === 'reset').length, 1);
  assert.equal(manual.calls.filter(call => call.method === 'reset').length, 1);
  assert.equal(marker.calls.filter(call => call.method === 'reset').length, 1);

  const replacementsBeforeDestroy = layer.replacements.length;
  assert.equal(controller.destroy(), true);
  assert.equal(controller.destroy(), false);
  assert.equal(claim.calls.filter(call => call.method === 'destroy').length, 1);
  assert.equal(manual.calls.filter(call => call.method === 'destroy').length, 1);
  assert.equal(marker.calls.filter(call => call.method === 'destroy').length, 1);
  assert.equal(controller.renderCapitalMarkers({markers: []}), false);
  assert.equal(layer.replacements.length, replacementsBeforeDestroy + 1);
});

test('unknown presentation kinds fail explicitly', () => {
  const {controller} = createHarness();

  assert.throws(
    () => controller.render({kind: 'unknown'}),
    /Unknown map presentation render kind/
  );
  assert.throws(
    () => controller.clear({kind: 'unknown'}),
    /Unknown map presentation clear kind/
  );
});
