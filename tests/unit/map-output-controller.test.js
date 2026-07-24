// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {createMapOutputController} from '../../src/render/map-output-controller.js';

function createHarness() {
  const sceneCalls = [];
  const presentationCalls = [];
  const mapSceneRenderer = {
    syncSelected: value => sceneCalls.push(['syncSelected', value]),
    syncPinned: value => sceneCalls.push(['syncPinned', value]),
    apply: () => sceneCalls.push(['apply']),
    applyForRegions: value => sceneCalls.push(['applyForRegions', value]),
  };
  const mapPresentation = Object.fromEntries([
    'renderCapitalMarkers',
    'renderPinnedRegionMarkers',
    'renderHoverOutlines',
    'renderSelectionOutlines',
    'renderReachableCapitalCandidates',
    'syncReachableHoverState',
  ].map(name => [
    name,
    request => presentationCalls.push([name, request]),
  ]));
  const context = {
    regionByName: {
      Alpha: {regionName: 'Alpha', nationTag: 'AAA'},
      Beta: {regionName: 'Beta', nationTag: 'BBB'},
    },
    claimsByNation: {
      AAA: {capitalRegions: ['Alpha']},
      BBB: {capitalRegions: ['Beta']},
    },
    indices: {capitalNationsByRegion: new Map()},
    selectedRegionIds: new Set(['Alpha']),
    visibleNationRegionNames: new Set(['Alpha']),
    copyContexts: [{copyIndex: 0, xOffset: 0, isCanonical: true}],
    language: 'en',
    currentOverlayModel: null,
    getActiveNation: () => 'AAA',
    getHoverNation: () => '',
    getHoveredRegionName: () => '',
    getLockedNation: () => 'AAA',
    getPinnedCapitalClaimant: () => '',
    getPinnedRegionIds: () => new Set(),
    getSecondaryHoverNation: () => '',
    getShowReachableCapitalCandidates: () => true,
    buildActiveExpansionScope: () => ({regionSet: new Set()}),
    resolveCapitalClaimantForRegion: () => '',
    getForeignHoverOverlayDescriptorSet: () => ({cacheKey: '', descriptors: []}),
    reachableCapitalCandidateDescriptors: () => [],
    labelPosition: () => ({x: 1, y: 2}),
    localizedRegionName: region => region.regionName,
    nationDisplayName: nation => nation,
    formatNumber: String,
    t: key => key,
  };
  const pinnedRegionsPanel = {textContent: 'pinned'};
  const reachableCandidatesPanel = {textContent: 'reachable'};
  const selectedPill = {textContent: 'selected', style: {display: ''}};
  const controller = createMapOutputController({
    mapSceneRenderer,
    mapPresentation,
    roots: {pinnedRegionsPanel, reachableCandidatesPanel, selectedPill},
    getContext: () => context,
  });
  return {
    controller,
    context,
    sceneCalls,
    presentationCalls,
    pinnedRegionsPanel,
    reachableCandidatesPanel,
    selectedPill,
  };
}

test('map output aggregation reads live scenario context without stale aliases', () => {
  const harness = createHarness();
  const {controller, context, presentationCalls} = harness;

  controller.renderCapitalMarkers();
  assert.deepEqual(
    presentationCalls.at(-1)[1].markers,
    [{regionName: 'Alpha', nation: 'AAA', selected: true}]
  );
  assert.equal(controller.capitalRegionsText(context.claimsByNation.AAA), 'Alpha');
  assert.equal(controller.isCapitalRegionForNation('AAA', 'Alpha'), true);

  context.selectedRegionIds = new Set();
  context.visibleNationRegionNames = new Set(['Beta']);
  context.getActiveNation = () => 'BBB';
  context.getLockedNation = () => 'BBB';
  controller.renderCapitalMarkers();

  assert.deepEqual(
    presentationCalls.at(-1)[1].markers,
    [{regionName: 'Beta', nation: 'BBB', selected: false}]
  );
});

test('selected output keeps bounded visual updates and lifecycle idempotence', () => {
  const harness = createHarness();
  const {
    controller,
    sceneCalls,
    presentationCalls,
    pinnedRegionsPanel,
    reachableCandidatesPanel,
    selectedPill,
  } = harness;

  controller.updateSelectedRegions({
    bounded: true,
    changedRegionIds: ['Alpha'],
  });
  assert.deepEqual(sceneCalls.slice(0, 2), [
    ['syncSelected', harness.context.selectedRegionIds],
    ['applyForRegions', ['Alpha']],
  ]);
  assert.equal(selectedPill.style.display, '');
  assert.deepEqual(
    presentationCalls.map(([name]) => name),
    [
      'renderHoverOutlines',
      'renderSelectionOutlines',
      'renderPinnedRegionMarkers',
      'renderCapitalMarkers',
    ]
  );

  const callCount = presentationCalls.length;
  assert.equal(controller.destroy(), true);
  assert.equal(controller.destroy(), false);
  assert.equal(pinnedRegionsPanel.textContent, '');
  assert.equal(reachableCandidatesPanel.textContent, '');
  assert.equal(selectedPill.textContent, '');
  controller.renderCapitalMarkers();
  assert.equal(presentationCalls.length, callCount);
});
