// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {createClaimOverlayRenderer} from '../../src/render/claim-overlay-renderer.js';
import {createManualEnvelopeRenderer} from '../../src/render/manual-envelope-renderer.js';
import {createMapMarkerRenderer} from '../../src/render/map-marker-renderer.js';

class FakeClassList {
  constructor(node) {
    this.node = node;
  }

  toggle(name, active) {
    const names = new Set(String(this.node.attributes.class || '').split(/\s+/).filter(Boolean));
    if (active) names.add(name);
    else names.delete(name);
    this.node.attributes.class = [...names].join(' ');
  }
}

class FakeNode {
  constructor(tagName = '') {
    this.tagName = tagName;
    this.childNodes = [];
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.textContent = '';
    this.classList = new FakeClassList(this);
  }

  appendChild(node) {
    if (node instanceof FakeDocumentFragment) {
      this.childNodes.push(...node.childNodes);
      node.childNodes = [];
      return node;
    }
    this.childNodes.push(node);
    return node;
  }

  replaceChildren(...nodes) {
    this.childNodes = [];
    for (const node of nodes) this.appendChild(node);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  querySelectorAll(selector) {
    const matches = [];
    const requiredClass = selector.match(/\.([A-Za-z0-9_-]+)/)?.[1] || '';
    const requiredDataset = selector.match(/\[data-([A-Za-z0-9_-]+)\]/)?.[1]
      ?.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) || '';
    const visit = node => {
      const classes = String(node.attributes.class || '').split(/\s+/);
      if ((!requiredClass || classes.includes(requiredClass))
        && (!requiredDataset || node.dataset[requiredDataset] !== undefined)) {
        matches.push(node);
      }
      node.childNodes.forEach(visit);
    };
    this.childNodes.forEach(visit);
    return matches;
  }
}

class FakeDocumentFragment extends FakeNode {
  constructor() {
    super('#fragment');
  }
}

class FakeDocument {
  createDocumentFragment() {
    return new FakeDocumentFragment();
  }

  createElementNS(_namespace, tagName) {
    return new FakeNode(tagName);
  }
}

function withFakeDom(run) {
  const previousDocument = globalThis.document;
  const previousDocumentFragment = globalThis.DocumentFragment;
  globalThis.document = new FakeDocument();
  globalThis.DocumentFragment = FakeDocumentFragment;
  try {
    return run();
  } finally {
    globalThis.document = previousDocument;
    globalThis.DocumentFragment = previousDocumentFragment;
  }
}

function canonicalCopies() {
  return [{copyIndex: 0, xOffset: 0, isCanonical: true}];
}

function statRecorder() {
  const stats = {};
  return {
    stats,
    record(key) {
      stats[key] = (stats[key] || 0) + 1;
    },
  };
}

test('claim renderer buffers paths and labels once per current render context', () => withFakeDom(() => {
  const overlayLayer = new FakeNode('g');
  const labelLayer = new FakeNode('g');
  const recorder = statRecorder();
  const renderer = createClaimOverlayRenderer({claimOverlayLayer: overlayLayer, claimLabelLayer: labelLayer});
  const context = {
    model: {nation: 'AAA'},
    overlayDescriptorSet: {
      cacheKey: 'scenario-a',
      descriptors: [{
        region: 'RegionA',
        className: 'claim-overlay basic-claim',
        fillClassName: 'claim-fill-group',
        hatchClassName: 'claim-hatch-group hostile',
        fill: '#123',
        fillOpacity: 1,
      }],
    },
    labelDescriptorSet: {
      cacheKey: 'labels-a',
      descriptors: [{region: 'RegionA', x: 1, y: 2, text: 'A'}],
    },
    copyContexts: canonicalCopies(),
    regionByName: {RegionA: {regionName: 'RegionA', path: 'M 0 0 L 1 1'}},
    recordRenderStat: recorder.record,
    window: {requestAnimationFrame: callback => callback()},
  };

  assert.equal(renderer.render(context), true);
  assert.equal(overlayLayer.childNodes.length, 2);
  assert.equal(labelLayer.childNodes.length, 2);
  assert.equal(recorder.stats.claimOverlayDomReplacements, 1);
  assert.equal(recorder.stats.claimLabelDomReplacements, 1);
  assert.equal(renderer.render(context), false);
  assert.equal(recorder.stats.claimOverlayDomReplacements, 1);

  assert.equal(renderer.reset({recordRenderStat: recorder.record}), true);
  assert.equal(renderer.destroy(), true);
  assert.equal(renderer.destroy(), false);
  assert.equal(renderer.render(context), false);
}));

test('claim renderer reset cancels delayed overlay and label commits', () => withFakeDom(() => {
  const overlayLayer = new FakeNode('g');
  const labelLayer = new FakeNode('g');
  const pendingFrames = new Map();
  const cancelledFrames = [];
  let nextFrameId = 1;
  const windowRef = {
    requestAnimationFrame(callback) {
      const frameId = nextFrameId;
      nextFrameId += 1;
      pendingFrames.set(frameId, callback);
      return frameId;
    },
    cancelAnimationFrame(frameId) {
      cancelledFrames.push(frameId);
      pendingFrames.delete(frameId);
    },
  };
  const renderer = createClaimOverlayRenderer({claimOverlayLayer: overlayLayer, claimLabelLayer: labelLayer});
  const context = {
    model: {nation: 'AAA'},
    overlayDescriptorSet: {cacheKey: 'scenario-a', descriptors: []},
    labelDescriptorSet: {cacheKey: 'labels-a', descriptors: []},
    copyContexts: canonicalCopies(),
    regionByName: {},
    commitDelayFrames: 2,
    window: windowRef,
  };

  assert.equal(renderer.render(context), true);
  assert.equal(pendingFrames.size, 2);
  assert.equal(renderer.reset(), true);
  assert.equal(pendingFrames.size, 0);
  assert.equal(cancelledFrames.length, 2);
  assert.equal(renderer.destroy(), true);
}));

test('manual envelope renderer uses per-call region and translation dependencies', () => withFakeDom(() => {
  const layer = new FakeNode('g');
  const recorder = statRecorder();
  const renderer = createManualEnvelopeRenderer({layer});
  const model = {
    anchorNation: 'AAA',
    sourceKey: 'source',
    regionKey: 'regions',
    regionItems: [{
      region: 'RegionA',
      primary: {
        depth: 0,
        claimant: 'AAA',
        parentClaimant: '',
        viaCapitalRegion: '',
        project: '',
        tier: 0,
        kind: 'base',
        claim: {},
      },
      overlapSources: [{}],
    }],
  };
  const baseContext = {
    model,
    copyContexts: canonicalCopies(),
    keyContext: {data: '2022', language: 'en'},
    regionByName: {RegionA: {regionName: 'RegionA', path: 'M 0 0 L 1 1'}},
    hostileHatchingDisabled: false,
    claimIsEffectivelyHostile: () => false,
    t: (key, values = {}) => `${key}:${values.depth ?? values.region ?? ''}`,
    projectDisplay: project => project,
    nationDisplayName: nation => nation,
    localizedRegionName: region => region.regionName,
    formatNumber: value => String(value),
    recordRenderStat: recorder.record,
  };

  assert.equal(renderer.render(baseContext), true);
  assert.equal(recorder.stats.manualEnvelopeRebuilds, 1);
  assert.equal(renderer.render(baseContext), false);
  assert.equal(renderer.render({
    ...baseContext,
    keyContext: {...baseContext.keyContext, language: 'ko'},
    regionByName: {RegionA: {regionName: 'RegionA', path: 'M 5 5 L 6 6'}},
  }), true);
  assert.equal(recorder.stats.manualEnvelopeRebuilds, 2);
  assert.equal(renderer.clear({recordRenderStat: recorder.record}), true);
  assert.equal(renderer.destroy(), true);
  assert.equal(renderer.destroy(), false);
}));

test('map marker renderer owns capital render keys and lifecycle without semantic state', () => withFakeDom(() => {
  const capitalLayer = new FakeNode('g');
  const selectionLayer = new FakeNode('g');
  const recorder = statRecorder();
  const renderer = createMapMarkerRenderer({capitalLayer, selectionLayer});
  const baseContext = {
    kind: 'capital',
    markers: [{regionName: 'RegionA', nation: 'AAA', selected: false}],
    regionByName: {RegionA: {regionName: 'RegionA', path: 'M 0 0 L 1 1'}},
    copyContexts: canonicalCopies(),
    language: 'en',
    labelPosition: () => ({x: 1, y: 2}),
    localizedRegionName: region => region.regionName,
    t: key => key,
    recordRenderStat: recorder.record,
  };

  assert.equal(renderer.render(baseContext), true);
  assert.equal(recorder.stats.capitalMarkerRebuilds, 1);
  assert.equal(renderer.render(baseContext), false);
  assert.equal(renderer.render({...baseContext, language: 'ko'}), true);
  assert.equal(recorder.stats.capitalMarkerRebuilds, 2);

  assert.equal(renderer.render({
    kind: 'selection',
    selectedRegionNames: ['RegionA'],
    regionByName: baseContext.regionByName,
    copyContexts: canonicalCopies(),
    isSelectedCapital: () => false,
    labelPosition: baseContext.labelPosition,
    localizedRegionName: baseContext.localizedRegionName,
  }), true);
  assert.ok(selectionLayer.childNodes.length);
  assert.equal(renderer.reset(), true);
  assert.equal(renderer.destroy(), true);
  assert.equal(renderer.destroy(), false);
  assert.equal(renderer.render(baseContext), false);
}));
