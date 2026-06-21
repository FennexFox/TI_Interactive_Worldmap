// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export const ACTIVE_SCENARIO_REFRESH_STEPS = Object.freeze([
  'populate',
  'clearOverlayVisualState',
  'renderGrid',
  'renderRegions',
  'renderLabels',
  'renderSelectionOutlines',
  'renderPinnedRegionsPanel',
  'renderPinnedRegionMarkers',
  'renderCapitalMarkers',
  'updateNationOverlay',
  'applyFilters',
  'updateSelectedRegions',
  'renderNationDropdown',
  'refreshReachableCapitalCandidateOutputs',
  'setHoverPill',
  'setClaimsPillEmptyIfIdle',
]);

export const LANGUAGE_REFRESH_STEPS = Object.freeze([
  'applyStaticTranslations',
  'populate',
  'syncSearchSelectedNationLabel',
  'renderNationDropdown',
  'refreshNationOverlayForLanguage',
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
