// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {createNationOverlayController} from '../../src/ui/nation-overlay-controller.js';
import {createLoadingScreen} from '../../src/ui/loading-screen.js';
import {createPresentationFormatters} from '../../src/ui/presentation-formatters.js';
import {createSearchController} from '../../src/ui/search-controller.js';

class FakeElement {
  constructor() {
    this.attributes = {};
    this.dataset = {};
    this.hidden = false;
    this.innerHTML = '';
    this.listeners = new Map();
    this.style = {};
    this.textContent = '';
    this.value = '';
    this.focusCount = 0;
  }

  addEventListener(name, listener) {
    const listeners = this.listeners.get(name) || [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }

  removeEventListener(name, listener) {
    this.listeners.set(name, (this.listeners.get(name) || []).filter(value => value !== listener));
  }

  dispatch(name, event = {}) {
    const value = {
      target: this,
      preventDefault() {},
      stopPropagation() {},
      ...event,
    };
    for (const listener of [...(this.listeners.get(name) || [])]) listener(value);
  }

  contains() {
    return true;
  }

  focus() {
    this.focusCount += 1;
  }

  querySelectorAll() {
    return [];
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

class FakeSelect extends FakeElement {
  set innerHTML(value) {
    this._innerHTML = value;
    this.options = [...value.matchAll(/<option value="([^"]*)"/g)]
      .map(match => ({value: match[1]}));
  }

  get innerHTML() {
    return this._innerHTML || '';
  }
}

const translate = (key, values = {}) => {
  if (key === 'search.noResults') return 'No results';
  if (key === 'search.regionTag') return 'Region';
  if (key === 'project.all') return 'All';
  if (key === 'pill.claimSummary') return `${values.nation}:${values.claims}`;
  if (key === 'claimCard.title') return `${values.nation}:${values.project}`;
  if (key === 'regionList.detail') {
    return `${values.prefix}${values.owner}${values.meta}${values.source}`;
  }
  if (key.startsWith('regionPrefix.')) return key.split('.')[1];
  return key;
};

test('search controller owns catalog, dropdown state, filtering, and listener teardown', () => {
  const search = new FakeElement();
  const dropdown = new FakeElement();
  const combo = new FakeElement();
  const results = new FakeElement();
  const document = new FakeElement();
  const catalogBuilds = [];
  const selectedNations = [];
  const visibilityChanges = [];
  const controller = createSearchController({search, dropdown, combo, results, document});
  const regions = [
    {
      id: 0,
      regionName: 'SouthKorea',
      nationTag: 'KOR',
      name: 'South Korea',
      displayName: {kor: '서울'},
      primaryCity: 'Seoul',
    },
    {
      id: 1,
      regionName: 'Japan',
      nationTag: 'JPN',
      name: 'Japan',
      displayName: {kor: '도쿄'},
      primaryCity: 'Tokyo',
    },
  ];
  controller.setContext({
    t: translate,
    regions,
    claimsByNation: {KOR: {projects: [{project: 'Project_UnitedKorea'}]}},
    nationMeta: {KOR: {displayName: {kor: '대한민국'}, aliases: ['Korea']}},
    projectMeta: {Project_UnitedKorea: {displayName: {kor: '통일 한국'}}},
    nationLabel: tag => tag === 'KOR' ? '대한민국 / 1단계' : tag,
    localizedRegionName: region => region.displayName.kor,
    prettyRegionName: value => value,
    getSelectedRegionIds: () => new Set(),
    getSearchRegions: () => regions,
    onCatalogBuilt: catalog => catalogBuilds.push(catalog),
    onNationSelected: nation => selectedNations.push(nation),
    onRegionVisibilityChange: change => visibilityChanges.push(change),
  });
  controller.rebuildCatalog();
  assert.equal(catalogBuilds.length, 1);
  assert.equal(controller.parseNationSearchValue('Korea'), 'KOR');

  search.dispatch('focus');
  assert.equal(dropdown.hidden, false);
  assert.match(dropdown.innerHTML, /대한민국/);

  search.value = 'seoul';
  search.dispatch('input');
  assert.deepEqual([...visibilityChanges.at(-1).hiddenRegionIds], ['Japan']);
  assert.deepEqual([...visibilityChanges.at(-1).visibleRegionIds], ['SouthKorea']);
  assert.match(results.innerHTML, /data-id="0"/);

  search.value = 'kor';
  search.dispatch('input');
  search.dispatch('keydown', {key: 'Enter'});
  assert.deepEqual(selectedNations, ['KOR']);
  assert.equal(search.focusCount, 1);

  search.dispatch('focus');
  const option = {dataset: {index: '0'}};
  dropdown.dispatch('click', {
    target: {closest: selector => selector === '.searchOption[data-index]' ? option : null},
  });
  assert.deepEqual(selectedNations, ['KOR', 'KOR']);
  assert.equal(search.focusCount, 2);

  combo.contains = () => false;
  document.dispatch('click');
  assert.equal(dropdown.hidden, true);

  controller.setContext({
    regions: [regions[1]],
    claimsByNation: {},
    nationMeta: {},
    projectMeta: {},
    nationLabel: tag => `scenario:${tag}`,
  });
  controller.rebuildCatalog();
  search.value = '';
  controller.open();
  assert.match(dropdown.innerHTML, /scenario:JPN/);
  assert.doesNotMatch(dropdown.innerHTML, /대한민국/);

  controller.destroy();
  assert.doesNotThrow(() => controller.destroy());
  assert.equal(search.listeners.get('input').length, 0);
  assert.equal(dropdown.listeners.get('click').length, 0);
  assert.equal(document.listeners.get('click').length, 0);
});

test('search controller tolerates filtering before a localized region formatter is wired', () => {
  const search = new FakeElement();
  const dropdown = new FakeElement();
  const combo = new FakeElement();
  const document = new FakeElement();
  const visibilityChanges = [];
  const regions = [{id: 0, regionName: 'Alpha', name: 'Alpha', nationTag: 'AAA'}];
  const controller = createSearchController({search, dropdown, combo, document});
  controller.setContext({
    regions,
    getSearchRegions: () => regions,
    onRegionVisibilityChange: change => visibilityChanges.push(change),
  });

  search.value = 'alpha';
  assert.doesNotThrow(() => controller.applyFilters(false));
  assert.deepEqual([...visibilityChanges.at(-1).visibleRegionIds], ['Alpha']);
  controller.destroy();
});

test('loading screen fallback inserts error details as text instead of markup', () => {
  const body = new FakeElement();
  body.childNodes = [];
  body.replaceChildren = (...nodes) => {
    body.childNodes = nodes;
  };
  const document = {
    body,
    documentElement: {lang: 'en'},
    createElement: () => new FakeElement(),
    getElementById: () => null,
  };
  const controller = createLoadingScreen({
    window: {localStorage: {getItem: () => null}},
    document,
  });

  controller.showFailure(new Error('<img src=x onerror=alert(1)>'));

  assert.equal(body.childNodes.length, 1);
  assert.match(body.childNodes[0].textContent, /<img src=x onerror=alert\(1\)>/);
  assert.equal(body.childNodes[0].innerHTML, '');
});

test('presentation formatters tolerate a null claim entry and missing active-nation callback', () => {
  const formatters = createPresentationFormatters({
    getContext: () => ({
      t: key => key,
      dataLanguageKey: () => 'en',
      nationMeta: {},
      claimsByNation: {},
      nationRegions: new Map(),
    }),
    getClaimHelpers: () => ({
      countryProjectTier: () => 0,
      countryProjectTierMap: () => new Map(),
    }),
  });

  assert.deepEqual(formatters.claimCardTitleParts(null, 'incoming'), {
    tag: '-',
    nation: '-',
    project: 'claimCard.projectBaseline',
    research: 'claimCard.researchBaselineValue',
  });
});

test('nation overlay controller renders panel/options/pill and resolves events from current model', () => {
  const root = new FakeElement();
  const projectSelect = new FakeSelect();
  const claimPill = new FakeElement();
  const claims = [];
  const regions = [];
  let currentModel = null;
  const controller = createNationOverlayController({root, projectSelect, claimPill});
  controller.setContext({
    t: translate,
    getModel: () => currentModel,
    bindSections() {},
    infoSectionOpenAttribute: section => section === 'basic' ? ' open' : '',
    nationDisplayName: nation => nation === 'KOR' ? 'South Korea' : nation,
    nationTierText: () => 'Tier 1',
    statusLabel: status => status,
    basicRows: () => [['Capital', 'SouthKorea'], ['Claims', '1']],
    claimMode: () => 'all',
    projectFilter: () => '',
    projectOptionValue: () => 'Project_Test',
    activeIncomingClaimKey: () => '',
    claimIsEffectivelyHostile: claim => !!claim?.hostileClaim,
    claimCardTitleParts: entry => ({
      nation: 'South Korea',
      project: entry.project,
      research: 'Tier 1',
    }),
    projectSummary: () => 'Summary',
    claimKey: entry => entry.project,
    prettyRegionName: value => value,
    regionCountText: count => `${count} regions`,
    regionPresentation: ({regionName}) => ({
      active: true,
      name: regionName,
      detail: 'claimed',
    }),
    projectEntries: nation => nation
      ? [{project: 'Project_Test', regions: ['SouthKorea']}]
      : [],
    projectDisplay: project => project,
    onClaimSelected: event => claims.push(event.source.project),
    onRegionSelected: event => regions.push(event.regionName),
  });
  currentModel = {
    nation: 'KOR',
    data: {status: 'existing'},
    ownedCount: 1,
    claimCount: 1,
    projectCount: 1,
    outgoingEntries: [{project: 'Project_Test', regions: ['SouthKorea'], claims: {}}],
    incomingEntries: [],
  };
  controller.renderProjectOptions('KOR');
  controller.render(currentModel);
  assert.equal(projectSelect.value, 'Project_Test');
  assert.match(root.innerHTML, /nationBasicSection/);
  assert.match(root.innerHTML, /claimListItem/);
  assert.equal(claimPill.textContent, 'South Korea:1');
  assert.equal(root.listeners.get('click').length, 1);

  const claim = {dataset: {claimKind: 'outgoing', claimIndex: '0'}};
  root.dispatch('click', {
    target: {closest: selector => selector === '.claimListItem' ? claim : null},
  });
  const region = {dataset: {regionName: 'SouthKorea'}};
  root.dispatch('click', {
    target: {closest: selector => selector.startsWith('.legendRegionItem') ? region : null},
  });
  assert.deepEqual(claims, ['Project_Test']);
  assert.deepEqual(regions, ['SouthKorea']);

  currentModel = null;
  controller.clear('Empty');
  assert.equal(root.textContent, 'Empty');
  assert.equal(projectSelect.options.length, 1);
  assert.equal(claimPill.textContent, '');

  controller.destroy();
  assert.doesNotThrow(() => controller.destroy());
  assert.equal(root.listeners.get('click').length, 0);
  assert.equal(root.textContent, '');
});
