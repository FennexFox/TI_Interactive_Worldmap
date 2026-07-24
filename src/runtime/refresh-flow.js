// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export const ACTIVE_SCENARIO_REFRESH_STEPS = Object.freeze([
  'updateWarning',
  'clearOverlayVisualState',
  'renderGrid',
  'renderRegionGeometry',
  'renderLabels',
  'renderSelectionOutlines',
  'renderPinnedRegionsPanel',
  'renderPinnedRegionMarkers',
  'renderCapitalMarkers',
  'updateNationOverlay',
  'applyFilters',
  'renderBaseRegionColors',
  'updateSelectedRegions',
  'renderNationDropdown',
  'refreshReachableCapitalCandidateOutputs',
  'setHoverPill',
  'setClaimsPillEmptyIfIdle',
]);

export const LANGUAGE_REFRESH_STEPS = Object.freeze([
  'applyStaticTranslations',
  'rebuildSearchCatalog',
  'updateWarning',
  'syncSearchSelectedNationLabel',
  'renderNationDropdown',
  'refreshNationOverlayForLanguage',
  'renderLabels',
  'applyFilters',
  'updateSelectedRegions',
  'renderPinnedRegionsPanel',
  'renderPinnedRegionMarkers',
  'renderManualEnvelopeOverlay',
  'refreshReachableCapitalCandidateOutputs',
  'refreshHoverPill',
]);

export function runRefreshSteps(steps, actions) {
  for (const step of steps) {
    const action = actions?.[step];
    if (typeof action !== 'function') {
      throw new Error(`Missing refresh action: ${step}`);
    }
    action();
  }
}
