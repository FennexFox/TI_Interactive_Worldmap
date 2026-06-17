import {expect, test} from '@playwright/test';
import {
  clearPinnedRegions,
  clearSelectionState,
  createAppState,
  pinRegion,
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
import {createAppData, getActiveData} from '../src/data/active-data.js';
import {buildDerivedIndices, resolveSecondaryCapitalPreview} from '../src/data/derived-indices.js';
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
  expect(getActiveData(appData, '2026')).toEqual({regionMap, claimMap, catalogs});
  expect(getActiveData(appData, '2070')).toBe(futureScenario);
  expect(getActiveData(appData, 'missing')).toEqual({regionMap, claimMap, catalogs});
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
