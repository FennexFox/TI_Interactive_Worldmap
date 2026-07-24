// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  buildSearchCatalog,
  filterSearchCatalog,
  parseNationSearchValue as parseCatalogValue,
} from '../data/search-catalog.js';
import {
  bindNationSearchControl,
  renderNationDropdown,
  renderSearchResults,
} from './controls.js';

const EMPTY_CATALOG = Object.freeze({
  nationChoices: [],
  nationChoiceByValue: new Map(),
  regionChoices: [],
});

function regionSearchText(region, localizedRegionName) {
  return [
    region?.name,
    region?.regionName,
    localizedRegionName(region),
    region?.primaryCity,
    ...Object.values(region?.displayName || {}),
    region?.nationTag,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function createSearchController({
  search,
  dropdown,
  combo,
  results,
  document,
} = {}) {
  let context = {};
  let catalog = EMPTY_CATALOG;
  let dropdownOpen = false;
  let highlightedIndex = -1;
  let dropdownChoices = [];
  let destroyed = false;

  const selectedRegionIds = () => context.getSelectedRegionIds?.() || new Set();
  const visibleChoices = () => {
    const query = search?.value?.trim().toLowerCase() || '';
    if (!query) {
      return catalog.nationChoices.slice(0, 28).map(choice => ({...choice, type: 'nation'}));
    }
    const {nationMatches, regionMatches} = filterSearchCatalog(catalog, query, {
      nationLimit: 12,
      regionLimit: 16,
    });
    return [
      ...nationMatches.map(choice => ({...choice, type: 'nation'})),
      ...regionMatches,
    ].slice(0, 28);
  };
  const renderDropdown = () => {
    if (destroyed) return;
    dropdownChoices = visibleChoices();
    highlightedIndex = renderNationDropdown({
      dropdown,
      search,
      open: dropdownOpen,
      choices: dropdownChoices,
      highlightedIndex,
      selectedRegionIds: selectedRegionIds(),
      t: context.t,
    });
  };
  const openDropdown = () => {
    if (destroyed) return;
    dropdownOpen = true;
    renderDropdown();
  };
  const closeDropdown = () => {
    dropdownOpen = false;
    highlightedIndex = -1;
    renderDropdown();
  };
  const chooseDropdown = (index = highlightedIndex) => {
    const choice = dropdownChoices[index];
    if (!choice) return false;
    if (choice.type === 'region') context.onRegionSelected?.(choice.id);
    else context.onNationSelected?.(choice.tag);
    closeDropdown();
    search?.focus?.();
    return true;
  };
  const parseNationSearchValue = value => parseCatalogValue(catalog, value);
  const getSelectedNation = () => search?.dataset?.selectedNation || '';
  const setSelectedNation = (nation = '', {updateValue = true} = {}) => {
    if (destroyed || !search) return;
    const nextNation = nation || '';
    search.dataset.selectedNation = nextNation;
    if (updateValue) {
      search.value = nextNation ? context.nationLabel?.(nextNation) || nextNation : '';
    }
  };
  const filterText = () => {
    const tag = search?.dataset?.selectedNation || '';
    const selectedNationMatches = !!tag && parseNationSearchValue(search?.value) === tag;
    return selectedNationMatches ? '' : search?.value?.trim().toLowerCase() || '';
  };
  const applyFilters = (rerenderResults = true, {renderBaseColors = true} = {}) => {
    if (destroyed) return;
    const query = filterText();
    const matches = [];
    const hiddenRegionIds = new Set();
    const visibleRegionIds = new Set();
    const regions = context.getSearchRegions?.() || context.regions || [];
    for (const region of regions) {
      if (!region) continue;
      const visible = !query || regionSearchText(region, context.localizedRegionName).includes(query);
      if (visible) {
        visibleRegionIds.add(region.regionName);
        if (matches.length < 90) matches.push(region);
      } else {
        hiddenRegionIds.add(region.regionName);
      }
    }
    context.onRegionVisibilityChange?.({
      hiddenRegionIds,
      visibleRegionIds,
      renderBaseColors,
    });
    if (!rerenderResults || !results) return;
    const nationMatches = query
      ? filterSearchCatalog(catalog, query, {nationLimit: 25, regionLimit: 0}).nationMatches
      : [];
    renderSearchResults({
      root: results,
      nationMatches,
      regionMatches: matches,
      t: context.t,
      localizedRegionName: context.localizedRegionName,
      onNation: nation => context.onNationSelected?.(nation),
      onRegion: index => context.onRegionSelected?.(index),
    });
  };

  const disposeSearchEvents = bindNationSearchControl({
    search,
    dropdown,
    combo,
    document,
    getSelectedNation: () => search?.dataset?.selectedNation || '',
    parseNationSearchValue,
    onSelectedNationCleared: () => context.onSelectedNationCleared?.(),
    openDropdown,
    closeDropdown,
    renderDropdown,
    applyFilters,
    getChoiceCount: () => dropdownChoices.length,
    getDropdownOpen: () => dropdownOpen,
    getHighlightedIndex: () => highlightedIndex,
    setHighlightedIndex: index => {
      highlightedIndex = index;
    },
    chooseDropdown,
    focusNationFromSearch: nation => context.onNationSelected?.(nation),
  });

  const controller = {
    setContext(nextContext = {}) {
      if (destroyed) return;
      context = {...context, ...nextContext};
    },
    rebuildCatalog() {
      if (destroyed) return catalog;
      catalog = buildSearchCatalog({
        regions: context.regions,
        claimsByNation: context.claimsByNation,
        nationMeta: context.nationMeta,
        projectMeta: context.projectMeta,
        nationLabel: context.nationLabel,
        localizedRegionName: context.localizedRegionName,
        prettyRegionName: context.prettyRegionName,
      });
      context.onCatalogBuilt?.(catalog);
      return catalog;
    },
    render: renderDropdown,
    renderDropdown,
    applyFilters,
    parseNationSearchValue,
    filterText,
    open: openDropdown,
    close: closeDropdown,
    clear() {
      if (destroyed) return;
      dropdownOpen = false;
      highlightedIndex = -1;
      dropdownChoices = [];
      renderDropdown();
      if (dropdown) dropdown.textContent = '';
      if (results) results.textContent = '';
    },
    getSelectedNation,
    setSelectedNation,
    syncSelectedNationLabel() {
      const selectedNation = getSelectedNation();
      if (selectedNation) setSelectedNation(selectedNation);
    },
    destroy() {
      if (destroyed) return;
      controller.clear();
      destroyed = true;
      disposeSearchEvents();
      context = {};
      catalog = EMPTY_CATALOG;
    },
  };
  return Object.freeze(controller);
}
