// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function requireAction(context, name) {
  const action = context?.[name];
  if (typeof action !== 'function') throw new Error(`Missing refresh action dependency: ${name}`);
  return action;
}

export function createScenarioRefreshActions(context) {
  return {
    updateWarning: requireAction(context, 'updateWarning'),
    clearOverlayVisualState: requireAction(context, 'clearOverlayVisualState'),
    renderGrid: requireAction(context, 'renderGrid'),
    renderRegionGeometry: requireAction(context, 'renderRegionGeometry'),
    renderLabels: requireAction(context, 'renderLabels'),
    renderSelectionOutlines: requireAction(context, 'renderSelectionOutlines'),
    renderPinnedRegionsPanel: requireAction(context, 'renderPinnedRegionsPanel'),
    renderPinnedRegionMarkers: requireAction(context, 'renderPinnedRegionMarkers'),
    renderCapitalMarkers: requireAction(context, 'renderCapitalMarkers'),
    updateNationOverlay: requireAction(context, 'updateNationOverlay'),
    applyFilters: requireAction(context, 'applyFilters'),
    renderBaseRegionColors: requireAction(context, 'renderBaseRegionColors'),
    updateSelectedRegions: requireAction(context, 'updateSelectedRegions'),
    renderNationDropdown: requireAction(context, 'renderNationDropdown'),
    refreshReachableCapitalCandidateOutputs: requireAction(context, 'refreshReachableCapitalCandidateOutputs'),
    setHoverPill: requireAction(context, 'setHoverPill'),
    setClaimsPillEmptyIfIdle: requireAction(context, 'setClaimsPillEmptyIfIdle'),
  };
}

export function createLanguageRefreshActions(context) {
  return {
    applyStaticTranslations: requireAction(context, 'applyStaticTranslations'),
    rebuildSearchCatalog: requireAction(context, 'rebuildSearchCatalog'),
    updateWarning: requireAction(context, 'updateWarning'),
    syncSearchSelectedNationLabel: requireAction(context, 'syncSearchSelectedNationLabel'),
    renderNationDropdown: requireAction(context, 'renderNationDropdown'),
    refreshNationOverlayForLanguage: requireAction(context, 'refreshNationOverlayForLanguage'),
    renderLabels: requireAction(context, 'renderLabels'),
    applyFilters: requireAction(context, 'applyFilters'),
    updateSelectedRegions: requireAction(context, 'updateSelectedRegions'),
    renderPinnedRegionsPanel: requireAction(context, 'renderPinnedRegionsPanel'),
    renderPinnedRegionMarkers: requireAction(context, 'renderPinnedRegionMarkers'),
    renderManualEnvelopeOverlay: requireAction(context, 'renderManualEnvelopeOverlay'),
    refreshReachableCapitalCandidateOutputs: requireAction(context, 'refreshReachableCapitalCandidateOutputs'),
    refreshHoverPill: requireAction(context, 'refreshHoverPill'),
  };
}
