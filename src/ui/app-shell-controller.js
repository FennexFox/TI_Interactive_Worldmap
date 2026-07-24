// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {createAsideCardController} from './aside-cards.js';
import {
  applyStaticTranslations,
  bindAppControls,
  renderScenarioOptions,
  updateReachableCapitalsButton,
} from './controls.js';
import {createI18n, readSavedLanguage, saveLanguage} from './i18n.js';
import {createNationOverlayController} from './nation-overlay-controller.js';
import {createSearchController} from './search-controller.js';

function queryElements(document) {
  return Object.freeze({
    svg: document.getElementById('map'),
    svgWrap: document.querySelector('.svgwrap'),
    tip: document.getElementById('tip'),
    search: document.getElementById('search'),
    nationDropdown: document.getElementById('nationDropdown'),
    nationSearchCombo: document.getElementById('nationSearchCombo'),
    scenarioSelect: document.getElementById('scenarioSel'),
    pinnedRegionsPanel: document.getElementById('pinnedRegionsPanel'),
    reachableCandidatesPanel: document.getElementById('reachableCandidatesPanel'),
    baseModeSelect: document.getElementById('baseMode'),
    claimModeSelect: document.getElementById('claimMode'),
    projectSelect: document.getElementById('projectSel'),
    claimKindSelect: document.getElementById('claimKind'),
    results: document.getElementById('results'),
    nationInfo: document.getElementById('nationInfo'),
    selectedPill: document.getElementById('selectedPill'),
    hoverPill: document.getElementById('hoverPill'),
    claimPill: document.getElementById('claimPill'),
    warningPill: document.getElementById('warnPill'),
    languageSelect: document.getElementById('languageSel'),
    labelsToggle: document.getElementById('showLabels'),
    reachableCapitalsButton: document.getElementById('reachableCapitalsBtn'),
    layers: Object.freeze({
      regions: document.getElementById('regions'),
      normalRegionColors: document.getElementById('normalRegionColors'),
      hitRegions: document.getElementById('hitRegions'),
      labels: document.getElementById('labels'),
      claimLabels: document.getElementById('claimLabels'),
      grid: document.getElementById('grid'),
      foreignHoverOverlays: document.getElementById('foreignHoverOverlays'),
      hoverClaimPreviewOverlays: document.getElementById('hoverClaimPreviewOverlays'),
      claimOverlays: document.getElementById('claimOverlays'),
      manualEnvelopeOverlays: document.getElementById('manualEnvelopeOverlays'),
      secondaryHoverOverlays: document.getElementById('secondaryHoverOverlays'),
      capitalMarkers: document.getElementById('capitalMarkers'),
      hoverOutlines: document.getElementById('hoverOutlines'),
      selectionOutlines: document.getElementById('selectionOutlines'),
      pinnedRegionMarkers: document.getElementById('pinnedRegionMarkers'),
      reachableCapitalCandidates: document.getElementById('reachableCapitalCandidates'),
    }),
  });
}

export function createAppShellController({window, document} = {}) {
  const elements = queryElements(document);
  const i18n = createI18n({
    initialLanguage: readSavedLanguage(window.localStorage)
      || elements.languageSelect?.value
      || document.documentElement.lang
      || 'en',
  });
  const searchController = createSearchController({
    search: elements.search,
    dropdown: elements.nationDropdown,
    combo: elements.nationSearchCombo,
    results: elements.results,
    document,
  });
  const nationOverlayController = createNationOverlayController({
    root: elements.nationInfo,
    projectSelect: elements.projectSelect,
    claimPill: elements.claimPill,
  });
  let context = {};
  let controls = null;
  let asideCards = null;
  let started = false;
  let destroyed = false;
  const filterControls = Object.freeze({
    getBaseMode: () => elements.baseModeSelect?.value || 'nation',
    getClaimMode: () => elements.claimModeSelect?.value || 'all',
    getClaimKind: () => elements.claimKindSelect?.value || 'all',
    getProject: () => elements.projectSelect?.value || '',
    hasProject(projectId = '') {
      return [...(elements.projectSelect?.options || [])]
        .some(option => option.value === projectId);
    },
    setClaimMode(mode = 'all') {
      if (!destroyed && elements.claimModeSelect) elements.claimModeSelect.value = mode;
    },
    setProject(projectId = '') {
      if (!destroyed && elements.projectSelect) elements.projectSelect.value = projectId;
    },
  });

  function setContext(nextContext = {}) {
    if (destroyed) return;
    context = {...context, ...nextContext};
    searchController.setContext(context.search || {});
    nationOverlayController.setContext(context.nationOverlay || {});
  }

  function updateMapViewControlsLabels() {
    context.onMapViewControlsUpdate?.();
  }

  asideCards = createAsideCardController({
    document,
    storage: window.localStorage,
    t: i18n.t,
    updateMapViewControlsLabels,
  });

  function renderScenarioChoices() {
    renderScenarioOptions({
      select: elements.scenarioSelect,
      scenarioIds: context.scenarioIds?.() || [],
      activeScenarioId: context.activeScenarioId?.() || '',
    });
  }

  function updateReachableCapitalsButtonState() {
    updateReachableCapitalsButton({
      button: elements.reachableCapitalsButton,
      visible: !!context.getShowReachableCapitalCandidates?.(),
      t: i18n.t,
    });
  }

  function applyTranslations() {
    applyStaticTranslations({
      document,
      language: i18n.language,
      title: i18n.t('document.title'),
      t: i18n.t,
      languageSelect: elements.languageSelect,
      onScenarioSync: renderScenarioChoices,
      onMapViewControlsUpdate: updateMapViewControlsLabels,
      onReachableCapitalsUpdate: updateReachableCapitalsButtonState,
      onAsideCardsUpdate: asideCards.updateAsideCardControls,
    });
  }

  function setLanguage(language) {
    if (destroyed) return i18n.language;
    const current = i18n.setLanguage(language);
    saveLanguage(current, window.localStorage);
    return current;
  }

  function setHoverPill(region = null) {
    if (!elements.hoverPill) return;
    elements.hoverPill.textContent = region
      ? i18n.t('pill.hoverRegion', {
        nation: region.nationTag,
        region: context.localizedRegionName?.(region) || region.regionName,
      })
      : i18n.t('pill.hoverEmpty');
  }

  function setClaimsPillEmpty() {
    nationOverlayController.clearClaimPill(i18n.t('pill.claimsEmpty'));
  }

  function updateWarning(claimStats = {}) {
    const warning = elements.warningPill;
    if (!warning) return;
    if (claimStats.regionsUnmatched) {
      warning.style.display = '';
      warning.textContent = i18n.t('warn.unmatchedClaimRows', {
        count: claimStats.regionsUnmatched,
      });
    } else {
      warning.style.display = 'none';
      warning.textContent = '';
    }
  }

  function start() {
    if (started || destroyed) return false;
    started = true;
    applyTranslations();
    asideCards.initAsideCards();
    controls = bindAppControls({
      languageSelect: elements.languageSelect,
      scenarioSelect: elements.scenarioSelect,
      baseModeSelect: elements.baseModeSelect,
      claimModeSelect: elements.claimModeSelect,
      claimKindSelect: elements.claimKindSelect,
      projectSelect: elements.projectSelect,
      labelsToggle: elements.labelsToggle,
      reachableCapitalsButton: elements.reachableCapitalsButton,
      onLanguageChange: context.onLanguageChange,
      onScenarioChange: context.onScenarioChange,
      onBaseModeChange: context.onBaseModeChange,
      onClaimModeChange: context.onClaimModeChange,
      onClaimKindChange: context.onClaimKindChange,
      onProjectChange: context.onProjectChange,
      onLabelsToggle: context.onLabelsToggle,
      onReachableCapitalsToggle: context.onReachableCapitalsToggle,
    });
    return true;
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    controls?.destroy();
    controls = null;
    asideCards.destroy();
    searchController.destroy();
    nationOverlayController.destroy();
    context = {};
  }

  return Object.freeze({
    applyTranslations,
    asideCards,
    destroy,
    elements,
    filterControls,
    i18n,
    nationOverlayController,
    renderScenarioChoices,
    searchController,
    setClaimsPillEmpty,
    setContext,
    setHoverPill,
    setLanguage,
    start,
    updateReachableCapitalsButtonState,
    updateWarning,
  });
}
