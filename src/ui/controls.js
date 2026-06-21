// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

export function renderScenarioOptions({
  select,
  scenarioIds = [],
  activeScenarioId = '',
} = {}) {
  if (!select) return;
  const html = scenarioIds.map(id => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join('');
  if (select.innerHTML !== html) select.innerHTML = html;
  select.value = activeScenarioId;
}

export function renderScenarioSummary({
  root,
  t,
  scenarioId = '',
  summary = {},
  formatNumber,
} = {}) {
  if (!root) return;
  root.textContent = t('scenario.summary', {
    scenario: scenarioId,
    regions: formatNumber(summary.regions),
    nations: formatNumber(summary.nations),
    claims: formatNumber(summary.claims),
    projects: formatNumber(summary.projects),
  });
}

export function updateReachableCapitalsButton({
  button,
  visible,
  t,
} = {}) {
  if (!button) return;
  button.textContent = visible ? t('button.hideReachableCapitals') : t('button.showReachableCapitals');
  button.setAttribute('aria-pressed', visible ? 'true' : 'false');
}

export function applyStaticTranslations({
  document,
  language,
  title,
  t,
  languageSelect,
  onScenarioSync,
  onMapViewControlsUpdate,
  onReachableCapitalsUpdate,
  onAsideCardsUpdate,
} = {}) {
  if (!document) return;
  document.documentElement.lang = language;
  document.title = title;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel)); });
  if (languageSelect) languageSelect.value = language;
  onScenarioSync?.();
  onMapViewControlsUpdate?.();
  onReachableCapitalsUpdate?.();
  onAsideCardsUpdate?.();
}

function setSearchDropdownExpanded(search, dropdown, expanded) {
  search?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  if (dropdown) dropdown.hidden = !expanded;
}

export function renderNationDropdown({
  dropdown,
  search,
  open,
  choices = [],
  highlightedIndex = -1,
  selectedRegionIds = new Set(),
  t,
} = {}) {
  if (!dropdown) return highlightedIndex;
  if (!open) {
    setSearchDropdownExpanded(search, dropdown, false);
    return highlightedIndex;
  }
  if (!choices.length) {
    dropdown.innerHTML = `<div class="searchOption empty">${escapeHtml(t('search.noResults'))}</div>`;
    setSearchDropdownExpanded(search, dropdown, true);
    return -1;
  }
  let normalizedIndex = highlightedIndex;
  if (normalizedIndex >= choices.length) normalizedIndex = choices.length - 1;
  if (normalizedIndex < -1) normalizedIndex = -1;
  dropdown.innerHTML = choices.map((choice, index) => {
    const selected = choice.type === 'nation'
      ? search?.dataset.selectedNation === choice.tag
      : selectedRegionIds.has(choice.regionName);
    const active = index === normalizedIndex;
    const tagText = choice.type === 'region' ? t('search.regionTag') : choice.tag;
    const labelText = choice.type === 'region'
      ? choice.label
      : choice.label.replace(choice.tag + ' \u00b7 ', '');
    return `<button type="button" class="searchOption${active ? ' active' : ''}${selected ? ' selected' : ''}" role="option" aria-selected="${selected ? 'true' : 'false'}" data-index="${index}"><span class="searchOptionTag">${escapeHtml(tagText)}</span><span class="searchOptionLabel">${escapeHtml(labelText)}</span></button>`;
  }).join('');
  setSearchDropdownExpanded(search, dropdown, true);
  return normalizedIndex;
}

export function renderSearchResults({
  root,
  nationMatches = [],
  regionMatches = [],
  t,
  localizedRegionName,
  onNation,
  onRegion,
} = {}) {
  if (!root) return;
  const nationHtml = nationMatches.map(choice => `<div class="item nationResult" data-nation="${escapeHtml(choice.tag)}"><b>${escapeHtml(choice.label)}</b><div class="small">${escapeHtml(t('results.nation', {tag: choice.tag}))}</div></div>`).join('');
  const regionHtml = regionMatches.map(region => `<div class="item" data-id="${region.id}"><b>${escapeHtml(localizedRegionName(region))}</b><div class="small">${escapeHtml(region.name)} \u00b7 ${escapeHtml(region.nationTag)}</div></div>`).join('');
  const empty = !nationHtml && !regionHtml ? `<div class="item small">${escapeHtml(t('search.noResults'))}</div>` : '';
  root.innerHTML = nationHtml + regionHtml + empty;
  root.querySelectorAll('.item[data-nation]').forEach(el => {
    el.addEventListener('click', () => onNation?.(el.dataset.nation));
  });
  root.querySelectorAll('.item[data-id]').forEach(el => {
    el.addEventListener('click', () => onRegion?.(Number(el.dataset.id)));
  });
}

export function bindNationSearchControl({
  search,
  dropdown,
  combo,
  document,
  getSelectedNation,
  parseNationSearchValue,
  onSelectedNationCleared,
  openDropdown,
  closeDropdown,
  renderDropdown,
  applyFilters,
  getChoiceCount,
  getDropdownOpen,
  getHighlightedIndex,
  setHighlightedIndex,
  chooseDropdown,
  focusNationFromSearch,
} = {}) {
  if (!search) return;
  search.addEventListener('focus', () => openDropdown?.());
  search.addEventListener('click', () => openDropdown?.());
  search.addEventListener('input', () => {
    const selectedNation = getSelectedNation?.() || '';
    if (selectedNation && parseNationSearchValue(search.value) !== selectedNation) {
      onSelectedNationCleared?.();
    }
    openDropdown?.();
    setHighlightedIndex?.(getChoiceCount?.() ? 0 : -1);
    renderDropdown?.();
    applyFilters?.(true);
  });
  search.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!getDropdownOpen?.()) openDropdown?.();
      const currentIndex = getHighlightedIndex?.() ?? -1;
      setHighlightedIndex?.(Math.min((getChoiceCount?.() || 0) - 1, currentIndex + 1));
      renderDropdown?.();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!getDropdownOpen?.()) openDropdown?.();
      const currentIndex = getHighlightedIndex?.() ?? -1;
      setHighlightedIndex?.(Math.max(0, currentIndex - 1));
      renderDropdown?.();
    } else if (event.key === 'Enter') {
      if (getDropdownOpen?.() && (getHighlightedIndex?.() ?? -1) >= 0) {
        event.preventDefault();
        chooseDropdown?.();
      } else {
        const selectedNation = parseNationSearchValue(search.value);
        if (selectedNation) {
          event.preventDefault();
          focusNationFromSearch?.(selectedNation);
        }
      }
    } else if (event.key === 'Escape') {
      closeDropdown?.();
    }
  });
  if (dropdown) {
    dropdown.addEventListener('mousedown', event => event.preventDefault());
    dropdown.addEventListener('click', event => {
      const option = event.target.closest('.searchOption[data-index]');
      if (!option) return;
      chooseDropdown?.(Number(option.dataset.index));
    });
  }
  document?.addEventListener('click', event => {
    if (!combo?.contains(event.target)) closeDropdown?.();
  });
}

export function bindAppControls({
  languageSelect,
  scenarioSelect,
  baseModeSelect,
  claimModeSelect,
  claimKindSelect,
  projectSelect,
  labelsToggle,
  reachableCapitalsButton,
  onLanguageChange,
  onScenarioChange,
  onBaseModeChange,
  onClaimModeChange,
  onClaimKindChange,
  onProjectChange,
  onLabelsToggle,
  onReachableCapitalsToggle,
} = {}) {
  languageSelect?.addEventListener('change', () => onLanguageChange?.(languageSelect.value));
  scenarioSelect?.addEventListener('change', () => onScenarioChange?.(scenarioSelect.value));
  baseModeSelect?.addEventListener('change', () => onBaseModeChange?.());
  claimModeSelect?.addEventListener('change', () => onClaimModeChange?.(claimModeSelect.value));
  claimKindSelect?.addEventListener('change', () => onClaimKindChange?.(claimKindSelect.value));
  projectSelect?.addEventListener('change', () => onProjectChange?.(projectSelect.value));
  labelsToggle?.addEventListener('click', () => onLabelsToggle?.());
  reachableCapitalsButton?.addEventListener('click', () => onReachableCapitalsToggle?.());
}
