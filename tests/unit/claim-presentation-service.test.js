// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {createClaimPresentationService} from '../../src/data/claim-presentation-service.js';

function createFixture() {
  const stats = {};
  const regions = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map(
    (regionName, index) => ({
      regionName,
      nationTag: index < 2 ? 'AAA' : 'CCC',
      path: `M${index} ${index}h1v1z`,
      x: index * 10,
      y: index * 5,
    })
  );
  const regionByName = Object.fromEntries(regions.map(region => [region.regionName, region]));
  const claimsByNation = {
    AAA: {
      nation: 'AAA',
      baseRegions: ['Alpha'],
      capitalRegions: ['Alpha'],
      projects: [
        {
          project: '',
          label: 'Base claims',
          regions: ['Beta'],
          claims: {Beta: {hostileClaim: false}},
        },
        {
          project: 'Project_Bridge',
          label: 'Bridge',
          regions: ['Gamma'],
          claims: {Gamma: {hostileClaim: true, capitalClaim: true}},
        },
      ],
    },
    CCC: {
      nation: 'CCC',
      baseRegions: ['Gamma', 'Epsilon'],
      capitalRegions: ['Gamma'],
      projects: [],
    },
  };
  const projectMeta = {
    Project_Bridge: {
      displayName: 'Bridge',
      researchCost: 100,
      prerequisiteNodes: [],
    },
  };
  const nationRegions = new Map(
    Object.entries(claimsByNation).map(([nation, data]) => [nation, data.baseRegions])
  );
  const capitalNationsByRegion = new Map([['Gamma', ['CCC']]]);
  const activeData = {
    regionMap: {summary: {scenarioYear: '2022', regions: regions.length}},
    claimMap: {
      claimStats: {
        claimRowsNormalized: 2,
        projectClaimRowsNormalized: 1,
        projectCount: 1,
      },
    },
  };
  const context = {
    activeScenarioId: '2022',
    defaultScenarioId: '2022',
    activeData,
    indices: {regions, capitalNationsByRegion},
    language: 'en',
    claimsByNation,
    nationRegions,
    projectMeta,
    claimMode: 'all',
    claimKind: 'all',
    projectFilter: '',
    activeIncomingClaimKey: '',
    selectedRegionIds: new Set(),
    incomingClaimsByRegion: new Map(),
    capitalNationsByRegion,
    regionByName,
    activeNationId: 'AAA',
    lockedNationId: 'AAA',
    focusedRegionName: 'Alpha',
    currentOverlayModel: null,
    pinnedRegionIds: new Set(),
    getPinnedCapitalClaimant: () => '',
    pinnedExpansionClaimants: () => [],
    isCapitalRegionForNation: (nation, regionName) => (
      (claimsByNation[nation]?.capitalRegions || []).includes(regionName)
    ),
    projectDisplay: project => projectMeta[project]?.displayName || project || 'Baseline',
    sourceLabels: {
      inheritedFrom: project => `Inherited from ${project}`,
      basicClaim: () => 'Basic claim',
      direct: () => 'Direct',
    },
    baselineLabel: 'Baseline',
    labelPosition: region => ({x: region.x, y: region.y}),
    recordRenderStat(name) {
      stats[name] = (stats[name] || 0) + 1;
    },
  };
  return {activeData, context, regionByName, stats};
}

test('claim presentation service keeps the claim facade live and preserves cache counters', () => {
  const fixture = createFixture();
  const service = createClaimPresentationService({getContext: () => fixture.context});
  const indices = fixture.context.indices;

  const firstModel = service.getNationOverlayModel(
    fixture.activeData,
    indices,
    'AAA',
    {cacheKey: 'committed'}
  );
  const cachedModel = service.getNationOverlayModel(
    fixture.activeData,
    indices,
    'AAA',
    {cacheKey: 'committed'}
  );
  assert.equal(cachedModel, firstModel);
  assert.equal(firstModel.resultSet.has('Gamma'), true);
  assert.equal(fixture.stats.overlayModelBuilds, 1);
  assert.equal(fixture.stats.overlayModelCacheHits, 1);

  const firstOverlays = service.getClaimOverlayDescriptorSet(firstModel);
  const cachedOverlays = service.getClaimOverlayDescriptorSet(firstModel);
  assert.equal(cachedOverlays, firstOverlays);
  assert.equal(firstOverlays.descriptors.some(item => item.region === 'Gamma'), true);
  assert.equal(
    firstOverlays.descriptors.find(item => item.region === 'Alpha')?.fill,
    'oklch(0.78 0.11 155)'
  );
  assert.equal(fixture.stats.claimOverlayDescriptorBuilds, 1);
  assert.equal(fixture.stats.claimOverlayDescriptorCacheHits, 1);

  const firstLabels = service.getClaimLabelDescriptorSet(firstModel);
  const cachedLabels = service.getClaimLabelDescriptorSet(firstModel);
  assert.equal(cachedLabels, firstLabels);
  assert.equal(firstLabels.descriptors.some(item => item.text === 'Bridge'), true);
  assert.equal(fixture.stats.claimLabelDescriptorBuilds, 1);
  assert.equal(fixture.stats.claimLabelDescriptorCacheHits, 1);

  const foreign = service.getForeignHoverOverlayDescriptorSet('AAA');
  assert.equal(foreign.descriptors.some(item => item.region === 'Alpha'), true);
  assert.equal(
    service.getForeignHoverOverlayDescriptorSet('AAA'),
    foreign
  );
  assert.equal(fixture.stats.foreignHoverDescriptorBuilds, 1);
  assert.equal(fixture.stats.foreignHoverDescriptorCacheHits, 1);

  assert.equal(typeof service.claimModel.buildIncomingClaimIndex, 'function');
  assert.equal(service.facade, service.claimModel);
  assert.equal(service.claimModel.getVisibleProjectEntries('AAA').length > 0, true);
  assert.equal(service.rebuildIncomingClaimIndex(), fixture.context.incomingClaimsByRegion);
  assert.equal(fixture.context.incomingClaimsByRegion.has('Gamma'), true);
  assert.equal(fixture.stats.incomingClaimIndexBuilds, 1);

  fixture.context.language = 'ko';
  const languageModel = service.getNationOverlayModel(
    fixture.activeData,
    indices,
    'AAA',
    {cacheKey: 'committed'}
  );
  assert.notEqual(languageModel, firstModel);
  assert.equal(fixture.stats.overlayModelBuilds, 2);

  fixture.context.activeScenarioId = '2026';
  fixture.context.activeData = {
    ...fixture.activeData,
    regionMap: {summary: {scenarioYear: '2026', regions: 5}},
  };
  const scenarioModel = service.getNationOverlayModel(
    fixture.context.activeData,
    indices,
    'AAA',
    {cacheKey: 'committed'}
  );
  assert.notEqual(scenarioModel, languageModel);
  assert.equal(fixture.stats.overlayModelBuilds, 3);
  assert.notEqual(service.getForeignHoverOverlayDescriptorSet('AAA'), foreign);
  assert.equal(fixture.stats.foreignHoverDescriptorBuilds, 2);

  service.reset();
  assert.notEqual(
    service.getNationOverlayModel(
      fixture.context.activeData,
      indices,
      'AAA',
      {cacheKey: 'committed'}
    ),
    scenarioModel
  );
  assert.equal(fixture.stats.overlayModelBuilds, 4);
  service.destroy();
  service.destroy();
});

test('manual envelope, preview scope, and reachable descriptors share current scenario context', () => {
  const fixture = createFixture();
  const service = createClaimPresentationService({getContext: () => fixture.context});
  const anchorModel = service.getNationOverlayModel(
    fixture.activeData,
    fixture.context.indices,
    'AAA'
  );
  fixture.context.currentOverlayModel = anchorModel;

  const envelope = service.getManualEnvelopeModel(anchorModel, {includeAnchorOnly: true});
  assert.equal(envelope.anchorNation, 'AAA');
  assert.equal(
    service.getManualEnvelopeModel(anchorModel, {includeAnchorOnly: true}),
    envelope
  );
  assert.equal(fixture.stats.manualEnvelopeModelBuilds, 1);
  assert.equal(fixture.stats.manualEnvelopeModelCacheHits, 1);

  const previewScope = service.activeClaimPreviewRegionSet(anchorModel);
  assert.equal(previewScope.has('Alpha'), true);
  assert.equal(previewScope.has('Gamma'), true);
  assert.equal(service.activeClaimPreviewRegionSet(), previewScope);
  assert.equal(service.activeClaimPreviewContainsRegion('Gamma', anchorModel), true);

  const expansionScope = service.buildActiveExpansionScope(anchorModel);
  assert.equal(service.resolveCapitalClaimantForRegion('Gamma', expansionScope), 'CCC');
  assert.equal(
    service.resolveReachableCapitalSelectionClaimant(fixture.regionByName.Gamma, 'CCC'),
    'CCC'
  );

  const manualEnvelopeModel = {
    anchorNation: 'AAA',
    sourceKey: 'source',
    regionKey: 'regions',
    regionItems: [{
      region: 'Gamma',
      primary: {depth: 1},
      overlapSources: [],
    }],
  };
  const candidates = service.reachableCapitalCandidateDescriptors(anchorModel, {
    manualEnvelopeModel,
  });
  assert.deepEqual(candidates, [{
    region: 'Gamma',
    capitalRegionId: 'Gamma',
    depth: 1,
    sourceCount: 0,
    primaryNation: 'CCC',
    candidateNationId: 'CCC',
    nations: ['CCC'],
    x: 20,
    y: 10,
  }]);
  assert.equal(
    service.reachableCapitalCandidateDescriptors(anchorModel, {manualEnvelopeModel}),
    candidates
  );
  assert.equal(fixture.stats.reachableCapitalCandidateDescriptorBuilds, 1);
  assert.equal(fixture.stats.reachableCapitalCandidateDescriptorCacheHits, 1);

  fixture.context.activeScenarioId = '2026';
  fixture.context.activeData = {
    ...fixture.activeData,
    regionMap: {summary: {scenarioYear: '2026', regions: 5}},
  };
  assert.notEqual(
    service.getManualEnvelopeModel(anchorModel, {includeAnchorOnly: true}),
    envelope
  );
  assert.notEqual(
    service.reachableCapitalCandidateDescriptors(anchorModel, {manualEnvelopeModel}),
    candidates
  );
  assert.equal(fixture.stats.manualEnvelopeModelBuilds, 2);
  assert.equal(fixture.stats.reachableCapitalCandidateDescriptorBuilds, 2);
});
