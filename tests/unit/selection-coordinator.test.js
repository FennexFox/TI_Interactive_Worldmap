// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {createAppStateAdapter} from '../../src/runtime/app-state-adapter.js';
import {createSelectionCoordinator} from '../../src/runtime/selection-coordinator.js';

function createDouble(methods) {
  const calls = [];
  const value = {};
  for (const [name, implementation] of Object.entries(methods)) {
    value[name] = (...args) => {
      calls.push({name, args});
      return implementation?.(...args);
    };
  }
  return {value, calls};
}

function createHarness() {
  const stateAdapter = createAppStateAdapter({activeScenarioId: '2026'});
  const regions = {
    Alpha: {regionName: 'Alpha', nationTag: 'AAA'},
    Beta: {regionName: 'Beta', nationTag: 'BBB'},
  };
  const overlayModels = {
    AAA: {
      nation: 'AAA',
      resultSet: new Set(['Alpha', 'Beta']),
      hasClaimOverlay: true,
      activeIncomingClaimKey: '',
    },
    BBB: {
      nation: 'BBB',
      resultSet: new Set(['Beta']),
      hasClaimOverlay: true,
      activeIncomingClaimKey: '',
    },
  };
  const candidates = [{
    region: 'Beta',
    primaryNation: 'BBB',
    nations: ['BBB'],
  }];
  const claim = createDouble({
    getNationOverlayModel: (...args) => {
      const nation = args.length >= 3 ? args[2] : args[0];
      return overlayModels[nation];
    },
    getClaimOverlayDescriptorSet: model => ({
      cacheKey: `overlay:${model.nation}`,
      descriptors: [{region: [...model.resultSet][0]}],
    }),
    getClaimLabelDescriptorSet: model => ({
      cacheKey: `labels:${model.nation}`,
      descriptors: [{text: model.nation}],
    }),
    getManualEnvelopeModel: model => model ? {anchorNation: model.nation} : null,
    reachableCapitalCandidateDescriptors: () => candidates,
    buildActiveExpansionScope: model => ({
      anchorNation: model?.nation || '',
      regionSet: new Set(model?.resultSet || []),
    }),
    resolveCapitalClaimantForRegion: regionName => (
      regionName === 'Beta' ? 'BBB' : ''
    ),
    resolveReachableCapitalSelectionClaimant: (region, claimant) => (
      region?.regionName === 'Beta' && (!claimant || claimant === 'BBB')
        ? 'BBB'
        : ''
    ),
    manualEnvelopeAnchorNation: model => model?.nation || '',
    reset: noop,
  });
  const presentation = createDouble({
    renderClaimOverlay: () => true,
    renderManualEnvelope: () => true,
    renderHoverPreview: () => true,
    clearHoverPreview: () => true,
    clear: () => true,
    reset: () => true,
  });
  const outputCalls = [];
  const outputNames = [
    'applyMapVisualState',
    'applyFilters',
    'cancelHoverPreview',
    'clearClaimPill',
    'clearHoverVisualState',
    'clearNationDetails',
    'clearOverlayVisualState',
    'clearSearchSelection',
    'closeNationDropdown',
    'hideRegionTooltip',
    'refreshPinnedRegionOutputs',
    'renderCapitalMarkers',
    'renderClaimPill',
    'renderHoverOutlines',
    'renderNationDetails',
    'renderProjectOptions',
    'renderReachableCapitalCandidates',
    'resetClaimControls',
    'scheduleHoverPreview',
    'setHoverPill',
    'setOverlayVisualState',
    'setSearchNation',
    'showRegionTooltip',
    'syncClaimPresentationState',
    'syncReachableCapitalCandidateHoverState',
    'updateHoverVisualState',
    'updateReachableCapitalsButton',
    'updateSelectedRegions',
  ];
  const outputs = Object.fromEntries(outputNames.map(name => [
    name,
    (...args) => outputCalls.push({name, args}),
  ]));
  outputs.isCapitalRegionForNation = () => false;
  const context = {
    activeData: {scenarioId: '2026'},
    indices: {},
    regionByName: regions,
  };
  const coordinator = createSelectionCoordinator({
    stateAdapter,
    claimPresentation: claim.value,
    mapPresentation: presentation.value,
    getContext: () => context,
    outputs,
  });
  return {
    coordinator,
    stateAdapter,
    claim,
    presentation,
    outputCalls,
    outputs,
    context,
    regions,
    overlayModels,
    candidates,
  };
}

function noop() {}

function outputNames(harness) {
  return harness.outputCalls.map(call => call.name);
}

test('nation overlay flow stores model and delegates completed presentation inputs', () => {
  const harness = createHarness();
  const {coordinator, stateAdapter, presentation, overlayModels} = harness;
  stateAdapter.setLockedNationState('AAA');

  const model = coordinator.updateNationOverlay('AAA');

  assert.equal(model, overlayModels.AAA);
  assert.equal(coordinator.currentOverlayModel, overlayModels.AAA);
  assert.deepEqual([...coordinator.visibleNationRegionNames], ['Alpha', 'Beta']);
  assert.equal(stateAdapter.getActiveNation(), 'AAA');
  const claimRender = presentation.calls.find(call => call.name === 'renderClaimOverlay');
  assert.equal(claimRender.args[0].model, overlayModels.AAA);
  assert.equal(claimRender.args[0].overlayDescriptorSet.cacheKey, 'overlay:AAA');
  assert.equal(claimRender.args[0].labelDescriptorSet.cacheKey, 'labels:AAA');
  assert.equal(
    presentation.calls.some(call => call.name === 'renderManualEnvelope'),
    true
  );
  assert.ok(outputNames(harness).includes('renderNationDetails'));
  assert.ok(outputNames(harness).includes('renderClaimPill'));

  coordinator.updateNationOverlay('', {
    renderDetails: true,
    updateFilters: false,
    updateSelected: false,
  });
  assert.equal(coordinator.currentOverlayModel, null);
  assert.deepEqual([...coordinator.visibleNationRegionNames], []);
  assert.ok(
    presentation.calls.some(
      call => call.name === 'clear' && call.args[0].kind === 'claim'
    )
  );
  assert.ok(outputNames(harness).includes('clearOverlayVisualState'));
  assert.ok(outputNames(harness).includes('clearNationDetails'));
});

test('reachable capital commit updates semantic state, pin claimant, and bounded outputs', () => {
  const harness = createHarness();
  const {coordinator, stateAdapter, regions} = harness;
  stateAdapter.setLockedNationState('AAA');
  coordinator.updateNationOverlay('AAA', {
    updateFilters: false,
    updateSelected: false,
  });
  harness.outputCalls.length = 0;

  assert.equal(
    coordinator.commitReachableCapitalSelection(regions.Beta, 'BBB'),
    true
  );
  assert.deepEqual([...stateAdapter.selectedRegionIds], ['Beta']);
  assert.equal(stateAdapter.getFocusedRegionName(), 'Beta');
  assert.equal(stateAdapter.getPinnedRegionIds().has('Beta'), true);
  assert.equal(stateAdapter.getPinnedCapitalClaimant('Beta'), 'BBB');
  const selectedUpdate = harness.outputCalls.find(
    call => call.name === 'updateSelectedRegions'
  );
  assert.equal(selectedUpdate.args[0].bounded, true);
  assert.deepEqual(selectedUpdate.args[0].changedRegionIds, ['Beta']);
  assert.ok(outputNames(harness).includes('refreshPinnedRegionOutputs'));

  assert.equal(
    coordinator.commitReachableCapitalSelection(regions.Alpha, 'BBB'),
    false
  );
});

test('hover preview scheduling and rendering respect a committed lock', () => {
  const harness = createHarness();
  const {coordinator, stateAdapter, presentation} = harness;

  assert.equal(coordinator.scheduleHoverPreviewNation('BBB'), true);
  assert.deepEqual(
    harness.outputCalls.find(call => call.name === 'scheduleHoverPreview').args,
    ['BBB']
  );
  assert.equal(coordinator.setHoverPreviewNation('BBB'), true);
  assert.equal(coordinator.hoverClaimPreviewNation, 'BBB');
  assert.equal(
    presentation.calls.some(call => call.name === 'renderHoverPreview'),
    true
  );
  assert.deepEqual([...coordinator.visibleNationRegionNames], ['Beta']);

  stateAdapter.setLockedNationState('AAA');
  assert.equal(coordinator.scheduleHoverPreviewNation('BBB'), false);
  assert.equal(coordinator.setHoverPreviewNation('BBB'), false);
});

test('scenario reset clears transient context and destroy is idempotent', () => {
  const harness = createHarness();
  const {coordinator, stateAdapter, claim, presentation} = harness;
  coordinator.setContext({scenarioToken: '2026'});
  stateAdapter.setLockedNationState('AAA');
  coordinator.updateNationOverlay('AAA', {
    updateFilters: false,
    updateSelected: false,
  });
  stateAdapter.setHoveredRegionState('Beta', 'BBB');
  stateAdapter.setHoverNationState('BBB');
  stateAdapter.setSecondaryHoverNationState('BBB');

  assert.equal(coordinator.resetContext(), true);
  assert.equal(coordinator.currentOverlayModel, null);
  assert.deepEqual([...coordinator.visibleNationRegionNames], []);
  assert.equal(coordinator.hoverClaimPreviewNation, '');
  assert.equal(stateAdapter.getHoveredRegionName(), '');
  assert.equal(stateAdapter.getHoverNation(), '');
  assert.equal(stateAdapter.getSecondaryHoverNation(), '');
  assert.equal(claim.calls.some(call => call.name === 'reset'), true);
  assert.equal(presentation.calls.some(call => call.name === 'reset'), true);
  assert.ok(outputNames(harness).includes('cancelHoverPreview'));
  assert.ok(outputNames(harness).includes('clearClaimPill'));

  assert.equal(coordinator.destroy(), true);
  assert.equal(coordinator.destroy(), false);
  assert.equal(coordinator.updateNationOverlay('AAA'), null);
  assert.equal(coordinator.hoverRegion(harness.regions.Alpha), false);
});

test('clear selection removes pins and delegates UI cleanup without DOM access', () => {
  const harness = createHarness();
  const {coordinator, stateAdapter} = harness;
  stateAdapter.setLockedNationState('AAA');
  stateAdapter.setSelectedRegionIds(['Alpha']);
  stateAdapter.pinRegionState('Alpha');
  coordinator.updateNationOverlay('AAA', {
    updateFilters: false,
    updateSelected: false,
  });
  harness.outputCalls.length = 0;

  coordinator.clearSelection();

  assert.equal(stateAdapter.getLockedNation(), '');
  assert.equal(stateAdapter.getActiveNation(), '');
  assert.deepEqual([...stateAdapter.selectedRegionIds], []);
  assert.deepEqual([...stateAdapter.getPinnedRegionIds()], []);
  assert.ok(outputNames(harness).includes('clearSearchSelection'));
  assert.ok(outputNames(harness).includes('resetClaimControls'));
  assert.ok(outputNames(harness).includes('refreshPinnedRegionOutputs'));
});
