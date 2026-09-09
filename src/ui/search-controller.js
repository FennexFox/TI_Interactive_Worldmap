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
  updateNationDropdownHighlight,
} from './controls.js';

const EMPTY_CATALOG = Object.freeze({
  nationChoices: [],
  nationChoiceByValue: new Map(),
  regionChoices: [],
});

function regionSearchText(region, localizedRegionName = () => '') {
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
  filterCatalog = filterSearchCatalog,
} = {}) {
  let context = {};
  let catalog = EMPTY_CATALOG;
  let dropdownOpen = false;
  let highlightedIndex = -1;
  let dropdownChoices = [];
  let dropdownChoicesCatalog = null;
  let dropdownChoicesQuery = '';
  let dropdownSelectionKey = '';
  let destroyed = false;

  const selectedRegionIds = () => context.getSelectedRegionIds?.() || new Set();
  const dropdownQuery = () => search?.value?.trim().toLowerCase() || '';
  const visibleChoices = query => {
    if (!query) {
      return catalog.nationChoices.slice(0, 28).map(choice => ({...choice, type: 'nation'}));
    }
    const {nationMatches, regionMatches} = filterCatalog(catalog, query, {
      nationLimit: 12,
      regionLimit: 16,
    });
    return [
      ...nationMatches.map(choice => ({...choice, type: 'nation'})),
      ...regionMatches,
    ].slice(0, 28);
  };
  const invalidateDropdownChoices = () => {
    dropdownChoicesCatalog = null;
    dropdownChoicesQuery = '';
  };
  const resolveDropdownChoices = () => {
    const query = dropdownQuery();
    if (dropdownChoicesCatalog === catalog && dropdownChoicesQuery === query) return false;
    dropdownChoices = visibleChoices(query);
    dropdownChoicesCatalog = catalog;
    dropdownChoicesQuery = query;
    return true;
  };
  const selectionKey = selectedIds => dropdownChoices.map(choice => (
    choice.type === 'nation'
      ? search?.dataset.selectedNation === choice.tag
      : selectedIds.has(choice.regionName)
  ) ? '1' : '0').join('');
  const renderDropdown = ({resetHighlight = false} = {}) => {
    if (destroyed) return;
    if (dropdownOpen) resolveDropdownChoices();
    if (resetHighlight) highlightedIndex = dropdownChoices.length ? 0 : -1;
    const selectedIds = selectedRegionIds();
    highlightedIndex = renderNationDropdown({
      dropdown,
      search,
      open: dropdownOpen,
      choices: dropdownChoices,
      highlightedIndex,
      selectedRegionIds: selectedIds,
      t: context.t,
    });
    dropdownSelectionKey = selectionKey(selectedIds);
  };
  const openDropdown = () => {
    if (destroyed) return;
    dropdownOpen = true;
    renderDropdown();
  };
  const refreshDropdown = () => {
    if (destroyed) return;
    dropdownOpen = true;
    renderDropdown({resetHighlight: true});
  };
  const closeDropdown = () => {
    dropdownOpen = false;
    highlightedIndex = -1;
    renderDropdown();
  };
  const chooseDropdown = (index = highlightedIndex) => {
    if (dropdownOpen && resolveDropdownChoices()) {
      renderDropdown();
      return false;
    }
    const choice = dropdownChoices[index];
    if (!choice) return false;
    if (choice.type === 'region') context.onRegionSelected?.(choice.id);
    else context.onNationSelected?.(choice.tag);
    closeDropdown();
    search?.focus?.();
    return true;
  };
  const moveDropdownHighlight = delta => {
    if (destroyed || !dropdownOpen) return;
    const choicesChanged = resolveDropdownChoices();
    const selectionChanged = selectionKey(selectedRegionIds()) !== dropdownSelectionKey;
    const count = dropdownChoices.length;
    highlightedIndex = count > 0
      ? Math.max(0, Math.min(count - 1, highlightedIndex + delta))
      : -1;
    if (choicesChanged || selectionChanged) {
      renderDropdown();
    } else {
      highlightedIndex = updateNationDropdownHighlight({dropdown, highlightedIndex});
    }
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
      ? filterCatalog(catalog, query, {nationLimit: 25, regionLimit: 0}).nationMatches
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
    refreshDropdown,
    applyFilters,
    getDropdownOpen: () => dropdownOpen,
    getHighlightedIndex: () => highlightedIndex,
    moveDropdownHighlight,
    chooseDropdown,
    focusNationFromSearch: nation => context.onNationSelected?.(nation),
  });

  const controller = {
    setContext(nextContext = {}) {
      if (destroyed) return;
      context = {...context, ...nextContext};
      invalidateDropdownChoices();
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
      invalidateDropdownChoices();
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
      invalidateDropdownChoices();
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
