// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {expect, test} from '@playwright/test';
import {
  clearPinnedRegions,
  clearSelectionState,
  createAppState,
  pinRegion,
  reconcileScenarioState,
  setActiveIncomingClaim,
  setActiveScenarioId,
  setClaimFilters,
  setFocusedRegion,
  setHoveredNation,
  setHoveredRegion,
  setLockedNation,
  setSecondaryHoverNation,
  setSelectedNation,
  setSelectedRegions,
  unpinPinnedRegion,
} from '../src/state/app-state.js';
import {createAppData, getActiveData, getScenarioIds} from '../src/data/active-data.js';
import {createClaimModel} from '../src/data/claim-model.js';
import {buildDerivedIndices, resolveSecondaryCapitalPreview} from '../src/data/derived-indices.js';
import {createI18n, normalizeLanguage} from '../src/ui/i18n.js';
import {
  applyMapVisualState,
  applyMapVisualStateForRegions,
  clearOverlayVisualState,
  createMapVisualState,
  setHiddenVisualState,
  setHoverVisualState,
  setOverlayVisualState,
  syncPinnedVisualState,
  syncSelectedVisualState,
} from '../src/state/map-visual-state.js';

function sortedValues(values) {
  return [...values].sort();
}

function fakeClassList() {
  const classes = new Set();
  return {
    toggle(name, active) {
      if (active) classes.add(name);
      else classes.delete(name);
      return !!active;
    },
    contains(name) {
      return classes.has(name);
    },
    values() {
      return sortedValues(classes);
    },
  };
}

function fakeRegionPath(regionName) {
  return {
    dataset: {region: regionName},
    classList: fakeClassList(),
  };
}

function fakeHitPath(regionName, {regionIdKey = true} = {}) {
  return {
    dataset: regionIdKey ? {regionId: regionName} : {region: regionName},
    classList: fakeClassList(),
  };
}

function sampleRegions() {
  return [
    {id: 1, regionName: 'Alpha', nationTag: 'AAA'},
    {id: 2, regionName: 'Beta', nationTag: 'BBB'},
    {id: 3, regionName: 'Gamma', nationTag: 'CCC'},
    {id: 4, regionName: 'Delta', nationTag: 'AAA'},
  ];
}

function sampleActiveData() {
  return {
    regionMap: {
      regions: sampleRegions(),
      summary: {
        scenarioYear: '2026',
        nationColorPalette: ['#111111', '#222222'],
        nationColorIndexes: {AAA: 0, BBB: 1},
      },
    },
    claimMap: {
      claimsByNation: {
        AAA: {capitalRegions: ['Alpha'], baseRegions: ['Alpha', 'Delta']},
        BBB: {capitalRegions: ['Beta'], baseRegions: ['Beta']},
        FORM: {capitalRegions: ['Beta'], baseRegions: []},
        ZERO: {capitalRegions: ['Gamma'], baseRegions: []},
        ZZZ: {capitalRegions: ['Missing'], baseRegions: []},
      },
      projects: {Project_Test: {displayName: {en: 'Test Project'}}},
      claimStats: {claimRowsNormalized: 7},
      nationMeta: {
        AAA: {displayName: {en: 'Alpha Nation'}, source: 'claim'},
        FORM: {displayName: {en: 'Formable'}, source: 'claim'},
      },
    },
    catalogs: {
      nations: {
        nations: {
          AAA: {displayName: {en: 'Catalog Alpha'}, source: 'catalog'},
          BBB: {displayName: {en: 'Beta Nation'}, source: 'catalog'},
        },
      },
    },
  };
}

function sampleClaimModelFixture() {
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
        {
          project: 'Project_Final',
          label: 'Final',
          regions: ['Delta'],
          claims: {Delta: {hostileClaim: false, gatedClaim: true}},
        },
      ],
    },
    BBB: {
      nation: 'BBB',
      baseRegions: ['Beta'],
      capitalRegions: ['Beta'],
      projects: [
        {
          project: '',
          label: 'Base claims',
          regions: ['Gamma'],
          claims: {Gamma: {hostileClaim: false}},
        },
      ],
    },
    CCC: {
      nation: 'CCC',
      baseRegions: ['Gamma'],
      capitalRegions: ['Gamma'],
      projects: [],
    },
    DDD: {
      nation: 'DDD',
      baseRegions: ['Delta'],
      capitalRegions: ['Delta'],
      projects: [],
    },
  };
  const projectMeta = {
    Project_Bridge: {displayName: 'Bridge', researchCost: 100, prerequisiteNodes: []},
    Project_Final: {displayName: 'Final', researchCost: 200, prerequisiteNodes: ['Project_Bridge']},
  };
  const regionByName = Object.fromEntries(['Alpha', 'Beta', 'Gamma', 'Delta'].map(regionName => [regionName, {regionName}]));
  const nationRegions = new Map(Object.entries(claimsByNation).map(([nation, data]) => [nation, data.baseRegions]));
  const capitalNationsByRegion = new Map([
    ['Beta', ['BBB']],
    ['Gamma', ['CCC']],
    ['Delta', ['DDD']],
  ]);
  let claimMode = 'all';
  let claimKind = 'all';
  let projectFilter = '';
  let activeIncomingClaimKey = '';
  let selectedRegionIds = [];
  let incomingClaimsByRegion = new Map();
  const model = createClaimModel({
    claimsByNation: () => claimsByNation,
    nationRegions: () => nationRegions,
    projectMeta: () => projectMeta,
    claimMode: () => claimMode,
    claimKind: () => claimKind,
    projectFilter: () => projectFilter,
    activeIncomingClaimKey: () => activeIncomingClaimKey,
    selectedRegionIds: () => selectedRegionIds,
    incomingClaimsByRegion: () => incomingClaimsByRegion,
    capitalNationsByRegion: () => capitalNationsByRegion,
    regionExists: regionName => !!regionByName[regionName],
    isCapitalRegionForNation: (nation, regionName) => (claimsByNation[nation]?.capitalRegions || []).includes(regionName),
    projectLabel: project => projectMeta[project]?.displayName || project || '',
    sourceLabels: {
      inheritedFrom: project => `Inherited from ${project}`,
      basicClaim: () => 'Basic claim',
      direct: () => 'Direct',
    },
  });
  return {
    claimsByNation,
    model,
    setClaimMode: value => { claimMode = value; },
    setClaimKind: value => { claimKind = value; },
    setProjectFilter: value => { projectFilter = value; },
    setActiveIncomingClaimKey: value => { activeIncomingClaimKey = value; },
    setSelectedRegionIds: value => { selectedRegionIds = value; },
    setIncomingClaimsByRegion: value => { incomingClaimsByRegion = value; },
  };
}

test('app state keeps scenario independent while selection and pin state transition explicitly', () => {
  const state = createAppState({activeScenarioId: '2026'});

  setSelectedNation(state, 'AAA', {locked: true});
  setSelectedRegions(state, ['Alpha', 'Beta', 'Alpha', '']);
  setFocusedRegion(state, 'Alpha');
  setHoveredNation(state, 'BBB');
  setHoveredRegion(state, 'Beta', 'BBB');
  setSecondaryHoverNation(state, 'FORM');
  expect(state.interaction.secondaryHoverNationId).toBe('FORM');
  setActiveIncomingClaim(state, 'incoming:FORM');
  expect(state.interaction.secondaryHoverNationId).toBe('');
  setSecondaryHoverNation(state, 'FORM');
  setClaimFilters(state, {projectId: 'Project_Test'});
  expect(state.interaction.secondaryHoverNationId).toBe('');
  setActiveScenarioId(state, '2070');

  expect(state.activeScenarioId).toBe('2070');
  expect(state.selectedNationId).toBe('AAA');
  expect(state.lockedNationId).toBe('AAA');
  expect(sortedValues(state.selectedRegionIds)).toEqual(['Alpha', 'Beta']);
  expect(state.focusedRegionId).toBe('Alpha');
  expect(state.hoveredRegionId).toBe('Beta');
  expect(state.hoveredNationId).toBe('BBB');
  expect(state.activeIncomingClaimKey).toBe('incoming:FORM');
  expect(state.filters.projectId).toBe('Project_Test');

  pinRegion(state, 'Alpha', {capitalClaimant: 'AAA'});
  pinRegion(state, 'Beta', {capitalClaimantId: 'BBB'});
  pinRegion(state, 'Beta', {capitalClaimantId: 'FORM'});
  expect(sortedValues(state.pinnedRegionIds)).toEqual(['Alpha', 'Beta']);
  expect(state.pinnedCapitalClaimants.get('Alpha')).toBe('AAA');
  expect(state.pinnedCapitalClaimants.get('Beta')).toBe('FORM');

  unpinPinnedRegion(state, 'Alpha');
  expect(sortedValues(state.pinnedRegionIds)).toEqual(['Beta']);
  expect(state.pinnedCapitalClaimants.has('Alpha')).toBe(false);

  clearPinnedRegions(state);
  expect(sortedValues(state.pinnedRegionIds)).toEqual([]);
  expect([...state.pinnedCapitalClaimants]).toEqual([]);

  pinRegion(state, 'Gamma', {capitalClaimant: 'ZERO'});
  clearSelectionState(state);
  expect(state.activeScenarioId).toBe('2070');
  expect(state.selectedNationId).toBe('');
  expect(state.lockedNationId).toBe('');
  expect(sortedValues(state.selectedRegionIds)).toEqual([]);
  expect(state.focusedRegionId).toBe('');
  expect(sortedValues(state.pinnedRegionIds)).toEqual([]);
  expect([...state.pinnedCapitalClaimants]).toEqual([]);
  expect(state.activeIncomingClaimKey).toBe('');
  expect(state.interaction.secondaryHoverNationId).toBe('');
  expect(state.filters.projectId).toBe('Project_Test');
});

test('scenario reconciliation clears invalid state and preserves valid local ids', () => {
  const state = createAppState({activeScenarioId: '2026'});
  setSelectedNation(state, 'AAA', {locked: true});
  setSelectedRegions(state, ['Alpha', 'MissingRegion']);
  setFocusedRegion(state, 'MissingRegion');
  setHoveredRegion(state, 'Beta', 'BBB');
  setSecondaryHoverNation(state, 'CCC');
  setActiveIncomingClaim(state, 'BBB|Project_Test');
  setClaimFilters(state, {projectId: 'Project_Test'});
  pinRegion(state, 'Alpha', {capitalClaimant: 'AAA'});
  pinRegion(state, 'MissingRegion', {capitalClaimant: 'CCC'});

  reconcileScenarioState(state, {
    regionIds: ['Alpha', 'Beta'],
    nationIds: ['AAA', 'BBB'],
    projectIds: ['Project_Test'],
    incomingClaimKeys: ['BBB|Project_Test'],
  });

  expect(state.selectedNationId).toBe('AAA');
  expect(state.lockedNationId).toBe('AAA');
  expect(sortedValues(state.selectedRegionIds)).toEqual(['Alpha']);
  expect(sortedValues(state.pinnedRegionIds)).toEqual(['Alpha']);
  expect(state.pinnedCapitalClaimants.get('Alpha')).toBe('AAA');
  expect(state.focusedRegionId).toBe('');
  expect(state.hoveredRegionId).toBe('');
  expect(state.hoveredNationId).toBe('');
  expect(state.interaction.secondaryHoverNationId).toBe('');
  expect(state.activeIncomingClaimKey).toBe('BBB|Project_Test');
  expect(state.filters.projectId).toBe('Project_Test');

  reconcileScenarioState(state, {
    regionIds: ['Beta'],
    nationIds: ['BBB'],
    projectIds: [],
    incomingClaimKeys: [],
  });

  expect(state.selectedNationId).toBe('');
  expect(state.lockedNationId).toBe('');
  expect(sortedValues(state.selectedRegionIds)).toEqual([]);
  expect(sortedValues(state.pinnedRegionIds)).toEqual([]);
  expect([...state.pinnedCapitalClaimants]).toEqual([]);
  expect(state.activeIncomingClaimKey).toBe('');
  expect(state.filters.projectId).toBe('');
});

test('active data records default scenario and resolves explicit scenario entries', () => {
  const regionMap = {summary: {scenarioYear: '2026'}, regions: []};
  const claimMap = {claimsByNation: {}};
  const catalogs = {nations: {nations: {AAA: {displayName: {en: 'Alpha'}}}}};
  const appData = createAppData({regionMap, claimMap, catalogs});
  const futureScenario = {
    regionMap: {summary: {scenarioYear: '2070'}, regions: [{regionName: 'Future', nationTag: 'FTR'}]},
    claimMap: {claimsByNation: {FTR: {baseRegions: ['Future']}}},
    catalogs: {nations: {nations: {FTR: {displayName: {en: 'Future'}}}}},
  };
  appData.scenarios['2070'] = futureScenario;

  expect(appData.defaultScenario).toBe('2026');
  expect(getActiveData(appData, '2026').regionMap).toBe(regionMap);
  expect(getActiveData(appData, '2026').claimMap).toBe(claimMap);
  expect(getActiveData(appData, '2026').catalogs.nations).toBe(catalogs.nations);
  expect(getActiveData(appData, '2070')).toBe(futureScenario);
  expect(getActiveData(appData, 'missing').regionMap).toBe(regionMap);
});

test('active data normalizes generated scenario bundle payloads', () => {
  const appData = createAppData({
    schemaVersion: 2,
    defaultScenario: '2026',
    scenarios: {
      2022: {
        label: '2022',
        regionMap: {summary: {scenarioYear: '2022'}, regions: [{regionName: 'Past', nationTag: 'PST'}]},
        claimMap: {summary: {scenarioYear: '2022'}, claimsByNation: {PST: {baseRegions: ['Past']}}},
        catalogs: {nations: {nations: {PST: {tag: 'PST'}}}, research: {nodes: []}},
        summary: {claimRowsNormalized: 1},
      },
      2026: {
        label: '2026',
        regionMap: {summary: {scenarioYear: '2026'}, regions: [{regionName: 'Now', nationTag: 'NOW'}]},
        claimMap: {summary: {scenarioYear: '2026'}, claimsByNation: {NOW: {baseRegions: ['Now']}}},
        catalogs: {nations: {nations: {NOW: {tag: 'NOW'}}}, research: {nodes: []}},
        summary: {claimRowsNormalized: 2},
      },
      2070: {
        label: '2070',
        regionMap: {summary: {scenarioYear: '2070'}, regions: [{regionName: 'Future', nationTag: 'FTR'}]},
        claimMap: {summary: {scenarioYear: '2070'}, claimsByNation: {FTR: {baseRegions: ['Future']}}},
        catalogs: {nations: {nations: {FTR: {tag: 'FTR'}}}, research: {nodes: []}},
        summary: {claimRowsNormalized: 3},
      },
    },
  });

  expect(appData.schemaVersion).toBe(2);
  expect(appData.defaultScenario).toBe('2026');
  expect(getScenarioIds(appData)).toEqual(['2022', '2026', '2070']);
  expect(getActiveData(appData, '2022').regionMap.regions[0].regionName).toBe('Past');
  expect(getActiveData(appData, '2070').summary.claimRowsNormalized).toBe(3);
  expect(getActiveData(appData, 'missing').regionMap.regions[0].regionName).toBe('Now');
});

test('derived indices merge active data and resolve secondary capital previews deterministically', () => {
  const activeData = sampleActiveData();
  const indices = buildDerivedIndices(activeData);

  expect(indices.regions.map(region => region.regionName)).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']);
  expect(indices.summary.scenarioYear).toBe('2026');
  expect(indices.nationColorPalette).toEqual(['#111111', '#222222']);
  expect(indices.nationColorIndexes).toEqual({AAA: 0, BBB: 1});
  expect(indices.claimsByNation).toBe(activeData.claimMap.claimsByNation);
  expect(indices.projectMeta).toBe(activeData.claimMap.projects);
  expect(indices.claimStats).toBe(activeData.claimMap.claimStats);
  expect(indices.regionByName.Beta.nationTag).toBe('BBB');
  expect(indices.nationRegions.get('AAA')).toEqual(['Alpha', 'Delta']);
  expect(indices.nationRegions.get('BBB')).toEqual(['Beta']);
  expect(indices.nationMeta.AAA).toEqual({displayName: {en: 'Catalog Alpha'}, source: 'catalog'});
  expect(indices.nationMeta.FORM).toEqual({displayName: {en: 'Formable'}, source: 'claim'});
  expect(indices.capitalNationsByRegion.get('Beta')).toEqual(['BBB', 'FORM']);
  expect(indices.capitalNationsByRegion.get('Gamma')).toEqual(['ZERO']);
  expect(indices.capitalNationsByRegion.has('Missing')).toBe(false);

  const selectedOverlayModel = {
    hasClaimOverlay: true,
    resultSet: new Set(['Beta', 'Gamma']),
  };
  expect(resolveSecondaryCapitalPreview({
    activeData,
    indices,
    selectedNationId: 'AAA',
    hoveredRegionId: 'Beta',
    selectedOverlayModel,
  })).toBe('BBB');
  expect(resolveSecondaryCapitalPreview({
    activeData,
    indices,
    selectedNationId: 'BBB',
    hoveredRegionId: 'Beta',
    selectedOverlayModel,
  })).toBe(null);
  expect(resolveSecondaryCapitalPreview({
    activeData,
    indices,
    selectedNationId: 'AAA',
    hoveredRegionId: 'Gamma',
    selectedOverlayModel,
  })).toBe(null);
  expect(resolveSecondaryCapitalPreview({
    activeData,
    indices,
    selectedNationId: 'AAA',
    hoveredRegionId: 'Alpha',
    selectedOverlayModel,
  })).toBe(null);
  expect(resolveSecondaryCapitalPreview({
    activeData,
    indices,
    selectedNationId: 'AAA',
    hoveredRegionId: 'Beta',
    selectedOverlayModel: {...selectedOverlayModel, hasClaimOverlay: false},
  })).toBe(null);
});

test('claim model builds cumulative claims, overlay models, and incoming entries without DOM state', () => {
  const fixture = sampleClaimModelFixture();
  const {model} = fixture;

  const directEntries = model.getClaimKindFilteredProjectEntries('AAA');
  expect(directEntries.map(entry => entry.project || '__base__')).toEqual(['__base__', 'Project_Bridge', 'Project_Final']);

  const cumulative = model.cumulativeClaimEntries(directEntries);
  const final = cumulative.find(entry => entry.project === 'Project_Final');
  expect(final.regions).toEqual(['Beta', 'Gamma', 'Delta']);
  expect(final.inheritedRegions).toEqual(['Beta', 'Gamma']);
  expect(final.regionSourceLabels).toEqual({
    Beta: 'Basic claim',
    Gamma: 'Inherited from Bridge',
    Delta: 'Direct',
  });
  expect(final.claims.Beta).toMatchObject({
    hostileClaim: false,
    effectiveHostile: false,
    propagatedHostile: false,
  });
  expect(final.claims.Gamma).toMatchObject({
    hostileClaim: true,
    effectiveHostile: true,
    propagatedHostile: false,
  });
  expect(final.claims.Delta).toMatchObject({
    hostileClaim: false,
    gatedClaim: true,
    effectiveHostile: true,
    propagatedHostile: true,
    hostileAncestor: 'Gamma',
    hostileVia: 'Project_Bridge',
    hostileViaLabel: 'Inherited from Bridge',
  });

  fixture.setClaimKind('hostile');
  expect(model.getClaimKindFilteredProjectEntries('AAA').map(entry => entry.project)).toEqual(['Project_Bridge']);
  fixture.setClaimKind('all');

  const allVisibleEntries = model.getVisibleProjectEntries('AAA');
  const allVisibleFinal = allVisibleEntries.find(entry => entry.project === 'Project_Final');
  expect(allVisibleFinal.regions).toEqual(['Delta']);
  expect(allVisibleFinal.claims.Delta).toMatchObject({
    hostileClaim: false,
    effectiveHostile: true,
    propagatedHostile: true,
    hostileAncestor: 'Gamma',
    hostileVia: 'Project_Bridge',
  });

  fixture.setClaimKind('hostile');
  const hostileVisibleEntries = model.getVisibleProjectEntries('AAA');
  expect(hostileVisibleEntries.map(entry => entry.project)).toEqual(['Project_Bridge', 'Project_Final']);
  expect(hostileVisibleEntries.find(entry => entry.project === 'Project_Final').regions).toEqual(['Delta']);
  fixture.setClaimKind('all');

  fixture.setClaimMode('project');
  fixture.setProjectFilter('Project_Final');
  fixture.setClaimKind('hostile');
  const hostileFinalOverlay = model.buildNationOverlayModel(
    {claimMap: {claimsByNation: fixture.claimsByNation}},
    {nationRegions: new Map(), regionByName: {}},
    'AAA'
  );
  expect(hostileFinalOverlay.entries).toHaveLength(1);
  expect(hostileFinalOverlay.entries[0].project).toBe('Project_Final');
  expect(hostileFinalOverlay.entries[0].regions).toEqual(['Gamma', 'Delta']);
  expect(hostileFinalOverlay.entries[0].claims.Delta).toMatchObject({
    effectiveHostile: true,
    propagatedHostile: true,
    hostileAncestor: 'Gamma',
  });

  fixture.setClaimKind('peaceful');
  const peacefulFinalOverlay = model.buildNationOverlayModel(
    {claimMap: {claimsByNation: fixture.claimsByNation}},
    {nationRegions: new Map(), regionByName: {}},
    'AAA'
  );
  expect(peacefulFinalOverlay.entries).toHaveLength(1);
  expect(peacefulFinalOverlay.entries[0].project).toBe('Project_Final');
  expect(peacefulFinalOverlay.entries[0].regions).toEqual(['Beta']);

  fixture.setClaimMode('all');
  fixture.setProjectFilter('');
  fixture.setClaimKind('all');

  const incomingIndex = model.buildIncomingClaimIndex();
  const finalIncomingIndexItem = incomingIndex.get('Delta')?.find(entry => entry.claimant === 'AAA' && entry.project === 'Project_Final');
  expect(finalIncomingIndexItem.claim).toMatchObject({
    hostileClaim: false,
    effectiveHostile: true,
    propagatedHostile: true,
    hostileAncestor: 'Gamma',
  });
  fixture.setIncomingClaimsByRegion(incomingIndex);
  fixture.setSelectedRegionIds(['Delta']);
  const deltaIncoming = model.incomingClaimsForTarget('DDD', fixture.claimsByNation.DDD, new Set(['Delta']));
  const finalDeltaIncoming = deltaIncoming.find(entry => entry.claimant === 'AAA' && entry.project === 'Project_Final');
  expect(finalDeltaIncoming.hostile).toBe(1);
  expect(finalDeltaIncoming.targetClaims.Delta).toMatchObject({
    effectiveHostile: true,
    propagatedHostile: true,
  });

  fixture.setSelectedRegionIds(['Gamma']);
  const incoming = model.incomingClaimsForTarget('CCC', fixture.claimsByNation.CCC, new Set(['Gamma']));
  expect(incoming.map(entry => entry.claimant)).toEqual(['AAA', 'BBB']);
  expect(incoming.find(entry => entry.claimant === 'AAA').capital).toBe(1);

  fixture.setActiveIncomingClaimKey('AAA|Project_Bridge');
  const overlayModel = model.buildNationOverlayModel(
    {claimMap: {claimsByNation: fixture.claimsByNation}},
    {nationRegions: new Map(), regionByName: {}},
    'CCC'
  );
  expect(overlayModel.activeIncoming?.claimant).toBe('AAA');
  expect(overlayModel.displayBaseSet.has('Alpha')).toBe(true);
  expect(overlayModel.resultSet.has('Gamma')).toBe(true);
});

test('claim model filters reachable capitals and assembles manual envelope data', () => {
  const fixture = sampleClaimModelFixture();
  const {model} = fixture;
  const visibleResult = new Set(['Alpha', 'Beta', 'Gamma', 'Delta']);

  expect(model.reachableCapitalCandidateNations('Beta', 'AAA', new Set(['Alpha']))).toEqual(['BBB']);
  expect(model.reachableCapitalCandidateNations('Beta', 'AAA', visibleResult)).toEqual([]);
  expect(model.reachableCapitalCandidateNations('Alpha', 'AAA', new Set(['Alpha']))).toEqual([]);

  const specs = [
    {claimant: 'AAA', depth: 0, parentClaimant: '', viaCapitalRegion: '', pinIndex: -1},
    {claimant: 'BBB', depth: 1, parentClaimant: 'AAA', viaCapitalRegion: 'Beta', pinIndex: 0},
  ].sort(model.compareManualEnvelopeSourceSpecs('AAA'));
  const envelope = model.buildManualEnvelopeModelData('AAA', specs);
  expect(envelope.anchorNation).toBe('AAA');
  expect(envelope.sources.map(source => source.claimant)).toEqual(['AAA', 'BBB']);
  expect(envelope.regionItems.map(item => item.region)).toEqual(['Alpha', 'Beta', 'Delta', 'Gamma']);
  expect(envelope.regionItems.find(item => item.region === 'Gamma').overlapSources.map(source => source.claimant)).toEqual(['AAA', 'BBB']);
  expect(envelope.sourceKey).toContain('1:BBB:AAA:Beta:0');

  const hostileSpecs = [
    {claimant: 'AAA', depth: 0, parentClaimant: '', viaCapitalRegion: '', pinIndex: -1},
    {claimant: 'BBB', depth: 1, parentClaimant: 'AAA', viaCapitalRegion: 'Gamma', pinIndex: 0},
  ].sort(model.compareManualEnvelopeSourceSpecs('AAA'));
  const overlapEnvelope = model.buildManualEnvelopeModelData('AAA', hostileSpecs);
  const betaOverlap = overlapEnvelope.regionItems.find(item => item.region === 'Beta');
  expect(betaOverlap.primary).toMatchObject({
    claimant: 'AAA',
    kind: 'claim',
    claim: {
      hostileClaim: false,
      effectiveHostile: false,
      propagatedHostile: false,
    },
  });
  expect(betaOverlap.contributions.find(contribution => contribution.claimant === 'BBB' && contribution.kind === 'base').claim).toMatchObject({
    effectiveHostile: true,
    propagatedHostile: true,
    hostileAncestor: 'Gamma',
    hostileVia: 'Project_Bridge',
  });

  fixture.setClaimKind('hostile');
  const hostileEnvelope = model.buildManualEnvelopeModelData('AAA', hostileSpecs);
  expect(hostileEnvelope.regionItems.map(item => item.region)).not.toContain('Beta');
  const bbbGamma = hostileEnvelope.regionItems
    .find(item => item.region === 'Gamma')
    .contributions.find(contribution => contribution.claimant === 'BBB' && contribution.kind === 'claim');
  expect(bbbGamma.claim).toMatchObject({
    hostileClaim: false,
    effectiveHostile: true,
    propagatedHostile: true,
    hostileAncestor: 'Gamma',
    hostileVia: 'Project_Bridge',
  });
  fixture.setClaimKind('all');
});

test('i18n runtime formats translated strings and switches language explicitly', () => {
  expect(normalizeLanguage('en-US')).toBe('en');
  expect(normalizeLanguage('ko-KR')).toBe('ko');

  const i18n = createI18n({initialLanguage: 'en'});
  expect(i18n.language).toBe('en');
  expect(i18n.t('reachableCandidates.count', {count: '3'})).toBe('3 candidate capitals');
  expect(i18n.regionCountText(2)).toBe('2 regions');
  expect(i18n.dataLanguageKey()).toBe('en');

  i18n.setLanguage('ko');
  expect(i18n.language).toBe('ko');
  expect(i18n.t('reachableCandidates.count', {count: '3'})).toBe('후보 수도 3개');
  expect(i18n.regionCountText(2)).toBe('2개 지역');
  expect(i18n.dataLanguageKey()).toBe('kor');
});

test('map visual state applies explicit classes and bounded updates to copied region instances', () => {
  const mapVisualState = createMapVisualState();
  const alpha = fakeRegionPath('Alpha');
  const alphaCopy = fakeRegionPath('Alpha');
  const beta = fakeRegionPath('Beta');
  const gamma = fakeRegionPath('Gamma');
  const alphaHit = fakeHitPath('Alpha');
  const alphaHitCopy = fakeHitPath('Alpha', {regionIdKey: false});
  const betaHit = fakeHitPath('Beta');
  const gammaHit = fakeHitPath('Gamma');
  const svg = {classList: fakeClassList()};
  const renderContext = {
    svg,
    regionPathElements: [alpha, alphaCopy, beta, gamma],
    hitPathElements: [alphaHit, alphaHitCopy, betaHit, gammaHit],
    pathInstancesByRegion: new Map([
      ['Alpha', [alpha, alphaCopy]],
      ['Beta', [beta]],
      ['Gamma', [gamma]],
    ]),
    hitPathInstancesByRegion: new Map([
      ['Alpha', [alphaHit, alphaHitCopy]],
      ['Beta', [betaHit]],
      ['Gamma', [gammaHit]],
    ]),
  };

  syncSelectedVisualState(mapVisualState, ['Alpha']);
  syncPinnedVisualState(mapVisualState, ['Beta']);
  setHoverVisualState(mapVisualState, 'Gamma');
  setHiddenVisualState(mapVisualState, new Set(['Beta']));
  setOverlayVisualState(mapVisualState, {
    nation: 'AAA',
    displayBaseSet: new Set(['Alpha']),
    claimSet: new Set(['Gamma']),
    resultSet: new Set(['Alpha', 'Gamma']),
    hasClaimOverlay: true,
    indices: {regions: sampleRegions()},
  });

  const fullResult = applyMapVisualState(renderContext, mapVisualState);
  expect(fullResult).toEqual({visiblePathsTouched: 4, hitPathsTouched: 4});
  expect(svg.classList.contains('claims-active')).toBe(true);
  expect(alpha.classList.values()).toEqual(['owned-highlight', 'selected']);
  expect(alphaCopy.classList.values()).toEqual(['owned-highlight', 'selected']);
  expect(beta.classList.values()).toEqual(['dimmed', 'hidden', 'pinned-node']);
  expect(betaHit.classList.values()).toEqual(['hidden']);
  expect(gamma.classList.values()).toEqual(['claim-target', 'hovered']);
  expect(gammaHit.classList.values()).toEqual([]);

  syncSelectedVisualState(mapVisualState, ['Gamma']);
  setHoverVisualState(mapVisualState, 'Alpha');
  setHiddenVisualState(mapVisualState, []);
  const boundedResult = applyMapVisualStateForRegions(renderContext, mapVisualState, ['Alpha', 'Alpha', 'Gamma']);
  expect(boundedResult).toEqual({visiblePathsTouched: 3, hitPathsTouched: 3});
  expect(alpha.classList.values()).toEqual(['hovered', 'owned-highlight']);
  expect(alphaCopy.classList.values()).toEqual(['hovered', 'owned-highlight']);
  expect(beta.classList.values()).toEqual(['dimmed', 'hidden', 'pinned-node']);
  expect(betaHit.classList.values()).toEqual(['hidden']);
  expect(gamma.classList.values()).toEqual(['claim-target', 'selected']);
  expect(gammaHit.classList.values()).toEqual([]);

  clearOverlayVisualState(mapVisualState);
  expect(mapVisualState.hasClaimOverlay).toBe(false);
  expect(sortedValues(mapVisualState.selectedRegionIds)).toEqual(['Gamma']);
  expect(sortedValues(mapVisualState.pinnedRegionIds)).toEqual(['Beta']);
  expect(sortedValues(mapVisualState.hiddenRegionIds)).toEqual([]);
  expect(sortedValues(mapVisualState.ownedRegionIds)).toEqual([]);
  expect(sortedValues(mapVisualState.claimTargetRegionIds)).toEqual([]);
  expect(sortedValues(mapVisualState.dimmedRegionIds)).toEqual([]);

  const clearResult = applyMapVisualStateForRegions(renderContext, mapVisualState, ['Alpha', 'Beta', 'Gamma']);
  expect(clearResult).toEqual({visiblePathsTouched: 4, hitPathsTouched: 4});
  expect(svg.classList.contains('claims-active')).toBe(false);
  expect(alpha.classList.values()).toEqual(['hovered']);
  expect(beta.classList.values()).toEqual(['pinned-node']);
  expect(betaHit.classList.values()).toEqual([]);
  expect(gamma.classList.values()).toEqual(['selected']);
});

test('app runtime scenario API rebuilds active scenario context without stale map data', async ({page}) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__TI_SCENARIO_API__?.activeScenario === '2026');

  const initial = await page.evaluate(() => ({
    scenarios: window.__TI_SCENARIO_API__.scenarios,
    activeScenario: window.__TI_SCENARIO_API__.activeScenario,
    canonicalRegions: document.querySelectorAll('#hitRegions .region-hit[data-wrap-canonical="1"]').length,
  }));
  expect(initial.scenarios).toEqual(['2022', '2026', '2070']);
  expect(initial.activeScenario).toBe('2026');
  expect(initial.canonicalRegions).toBeGreaterThan(300);

  await page.locator('#search').fill('Canada');
  await expect(page.locator('#nationDropdown')).toContainText('Canada');
  await page.evaluate(() => window.__TI_SCENARIO_API__.setActiveScenario('2070'));
  await page.waitForFunction(() => window.__TI_SCENARIO_API__?.activeScenario === '2070');

  const switched = await page.evaluate(() => ({
    activeScenario: window.__TI_SCENARIO_API__.activeScenario,
    canonicalRegions: document.querySelectorAll('#hitRegions .region-hit[data-wrap-canonical="1"]').length,
    claimsActive: document.querySelector('#map')?.classList.contains('claims-active') || false,
    selectedPill: document.querySelector('#selectedPill')?.textContent || '',
  }));
  expect(switched.activeScenario).toBe('2070');
  expect(switched.canonicalRegions).toBe(initial.canonicalRegions);
  expect(switched.claimsActive).toBe(false);
  expect(switched.selectedPill).toBe('');
  await expect(page.locator('#nationDropdown')).toContainText('Canada');

  await page.evaluate(() => window.__TI_SCENARIO_API__.setActiveScenario('2026'));
  await page.waitForFunction(() => window.__TI_SCENARIO_API__?.activeScenario === '2026');
  await expect(page.locator('#nationDropdown')).toContainText('Canada');
});
