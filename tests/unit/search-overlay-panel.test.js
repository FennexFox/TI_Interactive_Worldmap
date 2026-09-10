// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {buildClaimLabelDescriptors, buildClaimOverlayDescriptors} from '../../src/data/overlay-descriptors.js';
import {buildSearchCatalog, filterSearchCatalog, parseNationSearchValue} from '../../src/data/search-catalog.js';
import {createNationInfoPanelController} from '../../src/ui/nation-info-panel.js';

test('localized search catalog matches nation tags, aliases, projects, and regions', () => {
  const catalog = buildSearchCatalog({
    regions: [{id: 0, regionName: 'SouthKorea', nationTag: 'KOR', name: 'South Korea', displayName: {kor: '서울'}, primaryCity: 'Seoul'}],
    claimsByNation: {KOR: {projects: [{project: 'Project_UnitedKorea', label: 'United Korea'}]}},
    nationMeta: {KOR: {displayName: {en: 'South Korea', kor: '대한민국'}, aliases: ['Korea']}},
    projectMeta: {Project_UnitedKorea: {displayName: {kor: '통일 한국'}}},
    nationLabel: tag => `${tag} / 대한민국`,
    localizedRegionName: () => '서울',
    prettyRegionName: () => 'South Korea',
  });
  assert.equal(parseNationSearchValue(catalog, 'Korea'), 'KOR');
  assert.equal(filterSearchCatalog(catalog, '통일 한국').nationMatches[0].tag, 'KOR');
  assert.equal(filterSearchCatalog(catalog, 'seoul').regionMatches[0].regionName, 'SouthKorea');
});

test('nation search preserves every rank tier and deterministic ties', () => {
  const choice = (tag, label, aliases = [], projectAliases = []) => ({
    tag, label, aliases, projectAliases,
    searchText: 'needle',
    normalizedTag: tag.toLowerCase(),
    normalizedLabel: label.toLowerCase(),
    normalizedAliases: aliases.map(value => value.toLowerCase()),
    normalizedProjectAliases: projectAliases.map(value => value.toLowerCase()),
  });
  const catalog = {
    nationChoices: [
      choice('NEEDLE', 'fallback'),
      choice('ALIAS', 'fallback', ['needle']),
      choice('NEEDLE_PREFIX', 'fallback'),
      choice('LABEL', 'needle label'),
      choice('PROJECT_EXACT', 'fallback', [], ['needle']),
      choice('PROJECT_PREFIX', 'fallback', [], ['needle project']),
      choice('FALLBACK', 'fallback'),
    ],
    regionChoices: [],
  };
  assert.deepEqual(
    filterSearchCatalog(catalog, 'needle', {regionLimit: 0}).nationMatches.map(choice => choice.tag),
    ['NEEDLE', 'ALIAS', 'NEEDLE_PREFIX', 'LABEL', 'PROJECT_EXACT', 'PROJECT_PREFIX', 'FALLBACK'],
  );
  const ties = buildSearchCatalog({
    nationLabel: tag => ({AAA: 'Zeta', BBB: 'Alpha', CCC: 'Same', DDD: 'Same'}[tag]),
    nationMeta: {
      AAA: {aliases: ['Tie'], displayName: {en: 'Zeta'}},
      BBB: {aliases: ['Tie'], displayName: {en: 'Alpha'}},
      CCC: {aliases: ['Tie'], displayName: {en: 'Same'}},
      DDD: {aliases: ['Tie'], displayName: {en: 'Same'}},
    },
  });
  assert.deepEqual(
    filterSearchCatalog(ties, 'Tie', {regionLimit: 0}).nationMatches.map(choice => choice.tag),
    ['BBB', 'CCC', 'DDD', 'AAA'],
  );
});

test('zero-limit search categories are not traversed and negative limits retain slice semantics', () => {
  const unreadable = new Proxy([], {get() { throw new Error('unused category read'); }});
  assert.deepEqual(filterSearchCatalog({nationChoices: unreadable, regionChoices: unreadable}, 'a', {
    nationLimit: 0, regionLimit: 0,
  }), {nationMatches: [], regionMatches: []});
  const catalog = buildSearchCatalog({regions: [
    {id: 0, regionName: 'Alpha', nationTag: 'AAA'},
    {id: 1, regionName: 'Beta', nationTag: 'BBB'},
  ]});
  assert.deepEqual(filterSearchCatalog(catalog, 'a', {nationLimit: -1, regionLimit: -1}).regionMatches.map(item => item.id), [0]);
});

test('claim descriptor builders are deterministic and DOM-free', () => {
  const model = {
    displayBaseSet: new Set(['Owned']),
    tierByProject: new Map([['Project_Test', 0]]),
    entries: [{
      project: 'Project_Test',
      regions: ['Claimed'],
      claims: {Claimed: {hostileClaim: true, gatedClaim: true}},
    }],
  };
  const options = {
    claimMode: 'all',
    regionExists: () => true,
    visibleClaimRegionsForEntry: entry => entry.regions,
    countryProjectTier: () => 0,
    projectColor: () => '#123456',
    claimIsEffectivelyHostile: claim => claim.hostileClaim,
    baseTerritoryColor: '#abcdef',
  };
  const first = buildClaimOverlayDescriptors(model, options);
  const second = buildClaimOverlayDescriptors(model, options);
  assert.deepEqual(first, second);
  assert.equal(first[1].hatchClassName.includes('hostile'), true);
  assert.equal(first.every(value => typeof value === 'object' && !('nodeType' in value)), true);

  assert.deepEqual(buildClaimLabelDescriptors(model, {
    visibleClaimRegionsForEntry: entry => entry.regions,
    regionByName: {Claimed: {regionName: 'Claimed'}},
    labelPosition: () => ({x: 1, y: 2}),
    projectDisplay: () => 'Test',
    baselineLabel: 'Baseline',
  }), [{region: 'Claimed', x: 1, y: 2, text: 'Test'}]);
});

test('nation info controller renders a model and delegates claim and region clicks once', () => {
  const listeners = {};
  const root = {
    innerHTML: '',
    textContent: '',
    addEventListener: (name, listener) => {
      listeners[name] ??= [];
      listeners[name].push(listener);
    },
    contains: () => true,
  };
  const claims = [];
  const regions = [];
  const controller = createNationInfoPanelController({
    root,
    renderHtml: model => `<p>${model.nation}</p>`,
    onClaimSelected: event => claims.push(event.source.project),
    onRegionSelected: event => regions.push(event.regionName),
  });
  const model = {nation: 'KOR', incomingEntries: [], outgoingEntries: [{project: 'Project_Test'}]};
  controller.render(model);
  controller.render(model);
  assert.equal(listeners.click.length, 1);
  assert.equal(root.innerHTML, '<p>KOR</p>');

  const claim = {dataset: {claimKind: 'outgoing', claimIndex: '0'}};
  listeners.click[0]({target: {closest: selector => selector === '.claimListItem' ? claim : null}});
  const region = {dataset: {regionName: 'SouthKorea'}};
  listeners.click[0]({
    target: {closest: selector => selector.startsWith('.legendRegionItem') ? region : null},
    stopPropagation() {},
  });
  assert.deepEqual(claims, ['Project_Test']);
  assert.deepEqual(regions, ['SouthKorea']);
  assert.equal(controller.model, model);
});
