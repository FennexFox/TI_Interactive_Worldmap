// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {createDebugRuntime, parseDebugFlags} from '../../src/runtime/debug-runtime.js';
import {installBrowserApi} from '../../src/runtime/browser-api.js';
import {createLruCache} from '../../src/runtime/lru-cache.js';
import {createScenarioRefreshActions} from '../../src/runtime/refresh-actions.js';
import {createScenarioRuntime} from '../../src/runtime/scenario-runtime.js';
import {createScenarioContext} from '../../src/runtime/scenario-context.js';

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

test('browser API installation preserves exact globals and only removes its own values', () => {
  const window = {};
  const debugRenderStats = {scenarioRuntimeBuilds: 0};
  let scenario = '2022';
  const setActiveScenario = next => {
    scenario = next;
    return true;
  };
  const browserApi = installBrowserApi({
    window,
    debugRenderStats,
    scenarioIds: ['2022', '2026'],
    getActiveScenario: () => scenario,
    setActiveScenario,
  });
  assert.equal(window.__TI_DEBUG_RENDER_STATS__, debugRenderStats);
  assert.deepEqual(window.__TI_SCENARIO_API__.scenarios, ['2022', '2026']);
  assert.equal(window.__TI_SCENARIO_API__.activeScenario, '2022');
  assert.equal(window.__TI_SCENARIO_API__.setActiveScenario, setActiveScenario);
  window.__TI_SCENARIO_API__.setActiveScenario('2026');
  assert.equal(window.__TI_SCENARIO_API__.activeScenario, '2026');

  const replacement = {};
  window.__TI_SCENARIO_API__ = replacement;
  browserApi.destroy();
  browserApi.destroy();
  assert.equal(window.__TI_SCENARIO_API__, replacement);
  assert.equal('__TI_DEBUG_RENDER_STATS__' in window, false);
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

test('scenario context replaces one immutable live scenario snapshot at a time', () => {
  const generatedData = {
    schemaVersion: 2,
    defaultScenario: '2026',
    scenarios: {
      2022: {
        regionMap: {summary: {scenarioYear: '2022'}, regions: [{regionName: 'Past', nationTag: 'PST'}]},
        claimMap: {claimsByNation: {PST: {baseRegions: ['Past']}}},
        catalogs: {nations: {nations: {PST: {tag: 'PST'}}}},
      },
      2026: {
        regionMap: {summary: {scenarioYear: '2026'}, regions: [{regionName: 'Now', nationTag: 'NOW'}]},
        claimMap: {claimsByNation: {NOW: {baseRegions: ['Now']}}},
        catalogs: {nations: {nations: {NOW: {tag: 'NOW'}}}},
      },
    },
  };
  const context = createScenarioContext(generatedData);
  const initial = context.snapshot();
  assert.equal(initial.scenarioId, '2026');
  assert.equal(Object.isFrozen(initial), true);
  assert.deepEqual(context.availableNationIds(), ['NOW']);

  const previousRuntime = initial.runtime;
  const past = context.setActiveScenario('2022');
  assert.equal(past.scenarioId, '2022');
  assert.notEqual(past.runtime, previousRuntime);
  assert.deepEqual(context.availableNationIds(), ['PST']);
  assert.equal(context.resolveScenarioId('missing'), '2026');
  assert.equal(context.resolveScenarioId('constructor'), '2026');
  assert.equal(context.resolveScenarioId('toString'), '2026');
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
