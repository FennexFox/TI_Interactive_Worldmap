// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {createDebugRuntime, parseDebugFlags} from '../../src/runtime/debug-runtime.js';
import {createLruCache} from '../../src/runtime/lru-cache.js';
import {createScenarioRefreshActions} from '../../src/runtime/refresh-actions.js';
import {createScenarioRuntime} from '../../src/runtime/scenario-runtime.js';

test('debug runtime preserves flag, counter, timing, reset, and dynamic stat behavior', () => {
  const mapView = {x: 1, y: 2, width: 4, height: 2};
  const flags = parseDebugFlags({
    location: {search: '?debugRenderStats=1&debugDisableLabels=1&debugUseCanonicalHitPaths=1&debugClaimOverlayDelayFrames=4'},
    storage: {getItem: () => null},
  });
  assert.deepEqual(flags, {
    renderStatsEnabled: true,
    hostileHatchingDisabled: false,
    labelsDisabled: true,
    canonicalHitPaths: true,
    claimOverlayDelayFrames: 4,
  });
  const runtime = createDebugRuntime({
    location: {search: '?debugRenderStats=1'},
    storage: {getItem: () => null},
    mapView,
    getWorldWrapEnabled: () => true,
    getWorldCopyContextCount: () => 3,
  });
  runtime.record('scenarioRuntimeBuilds');
  runtime.recordTiming('gridRenderMs', 2.5);
  assert.equal(runtime.stats.scenarioRuntimeBuilds, 1);
  assert.equal(runtime.stats.gridRenderMsMax, 2.5);
  assert.equal(runtime.stats.mapViewWidth, 4);
  assert.equal(runtime.stats.worldCopyContextCount, 3);
  runtime.reset();
  assert.equal(runtime.stats.scenarioRuntimeBuilds, 0);
});

test('LRU cache promotes hits, reports them, and evicts the oldest value', () => {
  const hits = [];
  const cache = createLruCache({limit: 2, onHit: key => hits.push(key)});
  cache.set('a', 1);
  cache.set('b', 2);
  assert.equal(cache.get('a'), 1);
  cache.set('c', 3);
  assert.equal(cache.has('b'), false);
  assert.equal(cache.has('a'), true);
  assert.equal(cache.size, 2);
  assert.deepEqual(hits, ['a']);
  cache.clear();
  assert.equal(cache.size, 0);
});

test('LRU cache rejects non-finite limits and floors fractional limits', () => {
  assert.throws(() => createLruCache({limit: Infinity}), RangeError);
  assert.throws(() => createLruCache({limit: Number.NaN}), RangeError);

  const cache = createLruCache({limit: 2.9});
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assert.equal(cache.size, 2);
  assert.equal(cache.has('a'), false);
});

test('scenario runtime exposes one immutable context around derived indices', () => {
  const indices = {
    regions: [{regionName: 'A'}],
    summary: {},
    nationColorPalette: [],
    nationColorIndexes: {},
    claimsByNation: {},
    projectMeta: {},
    claimStats: {},
    nationCatalog: {},
    nationMeta: {},
    regionByName: {A: {regionName: 'A'}},
    nationRegions: new Map(),
    capitalNationsByRegion: new Map(),
    incomingClaimsByRegion: new Map(),
  };
  const activeData = {scenarioId: '2026'};
  const runtime = createScenarioRuntime(activeData, {buildIndices: value => {
    assert.equal(value, activeData);
    return indices;
  }});
  assert.equal(runtime.activeData, activeData);
  assert.equal(runtime.indices, indices);
  assert.equal(runtime.regions, indices.regions);
  assert.equal(Object.isFrozen(runtime), true);
});

test('scenario refresh action factory requires and returns explicit dependencies', () => {
  const names = [
    'updateWarning',
    'clearOverlayVisualState',
    'renderGrid',
    'renderRegionGeometry',
    'renderLabels',
    'renderSelectionOutlines',
    'renderPinnedRegionsPanel',
    'renderPinnedRegionMarkers',
    'renderCapitalMarkers',
    'updateNationOverlay',
    'applyFilters',
    'renderBaseRegionColors',
    'updateSelectedRegions',
    'renderNationDropdown',
    'refreshReachableCapitalCandidateOutputs',
    'setHoverPill',
    'setClaimsPillEmptyIfIdle',
  ];
  const context = Object.fromEntries(names.map(name => [name, () => name]));
  assert.deepEqual(Object.keys(createScenarioRefreshActions(context)), names);
  assert.throws(() => createScenarioRefreshActions({...context, renderLabels: null}), /renderLabels/);
});
