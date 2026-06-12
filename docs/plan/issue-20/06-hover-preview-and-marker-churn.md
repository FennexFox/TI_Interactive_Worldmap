# Phase 06: Hover Preview And Marker Churn

## Goal

Reduce unnecessary DOM churn in hover preview overlays and capital markers while preserving current interaction semantics.

## Scope

- Review and refine `renderHoverOutlines`, foreign hover overlay rendering, and `renderCapitalMarkers`.
- Reuse existing keys such as `hoverVisualKey` and `capitalMarkersKey`, extending them only if required.
- Avoid clearing hover overlay groups when the effective hover overlay key is unchanged.
- Preserve selected nation and selected capital marker behavior.

## Non-Goals

- Do not implement secondary capital hover preview.
- Do not change capital marker shape, fill, stroke, or selected-state semantics.
- Do not change foreign hover overlay visual design.
- Do not merge hover overlay groups with claim overlay groups.

## Affected Files

- `src/app.js`
- `src/render/map-layers.js` only if a reusable keyed replacement helper is introduced
- `tests/language.spec.js` or focused hover/marker spec
- Generated `docs/assets/app.js` after `npm run build`

## Implementation Steps

1. Inspect current `hoverVisualKey` and `capitalMarkersKey` coverage against hover, locked nation, selected region, language, and visible result set inputs.
2. Split hover keys if needed for `#foreignHoverOverlays` and `#hoverOutlines` so one group does not clear unnecessarily.
3. Ensure moving within the same foreign-hover nation does not rebuild identical foreign overlay paths unless the target semantics actually differ.
4. Ensure `renderCapitalMarkers` skips work when marker inputs are unchanged, including selected state and language.
5. Add or update tests around Brazil, Ontario, Bolivia, Brasilia, and French Guiana interactions.
6. Run build, verify, and e2e.

## Acceptance Criteria

- Repeated hover states with unchanged foreign-hover overlay key do not rebuild identical hover overlay DOM.
- Capital markers are not rebuilt when marker inputs are unchanged.
- Hovering an owned region, foreign region, selected capital, and non-capital still produces the existing visible behavior.
- Future secondary capital hover preview remains possible because marker ownership and keys are explicit.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Select Brazil and hover Ontario repeatedly.
- Hover Bolivia, Brasilia, French Guiana, and Ontario in sequence.
- Select Brasilia and confirm the filled capital star remains correct.
- Clear selection and confirm capital markers reset.
- Toggle language and confirm any marker labels or nearby panel text remain correct.

## Rollback Risks

- Reusing hover overlay DOM can leave stale foreign-hover paths after moving to a different nation.
- Marker keys can miss selected-region state and show the wrong selected star fill.
- Over-optimizing hover preview can mask needed updates from `visibleNationRegionNames`.

## Progress

- [x] Hover overlay key coverage reviewed.
- [x] Foreign hover churn reduced where safe.
- [x] Capital marker key coverage verified.
- [x] Hover/marker regression coverage updated.
- [x] Validation commands run.

## Decision Log

- This phase stays focused on hover-specific DOM churn after selected overlay caching is already stable.
- `renderCapitalMarkers` already had the needed key coverage for language, marker region, nation, and selected state, so its behavior was preserved and covered with tests instead of refactored.
- The combined hover key was split into `foreignHoverVisualKey` and `hoverOutlineVisualKey`; ordinary hover movement no longer clears the foreign-hover layer, and foreign hover movement no longer clears the ordinary hover outline layer.
- Moving between regions in the same foreign-hover nation keeps the same foreign overlay key because the overlay represents the foreign nation's full relevant territory, not the individual hovered region.
- Empty foreign-hover and ordinary-hover states are explicit keys so stale paths are cleared once when changing hover modes.

## Outcomes

Implemented Phase 06 on 2026-06-13.

Source changes:

- Split the hover render key state in `src/app.js` into separate foreign-hover overlay and ordinary hover-outline keys.
- Replaced the shared hover-layer clear with keyed replacements for `#foreignHoverOverlays` and `#hoverOutlines`.
- Left capital marker rendering semantics unchanged after verifying the existing key includes current language, marker region, marker nation, and selected state.
- Added Playwright coverage for unchanged capital marker inputs, ordinary hover movement without foreign-layer churn, same-nation foreign-hover movement without hover DOM churn, and Brazil/Ontario/Bolivia/Brasilia/French Guiana interactions.
- Rebuilt generated Pages app output with `npm run build`.

Validation:

- `npm run build` passed.
- `npm run verify` passed: generated outputs verified, 5 Python unit tests passed.
- `npm run test:e2e` passed: 13 Playwright tests passed.
- Focused `npm run test:e2e -- --grep "hover overlay and capital marker"` passed: 1 Playwright test passed.

Manual smoke notes:

- Selecting Brazil and moving between Ontario and another Canadian region preserved the Canadian foreign hover overlay with `foreignHoverOverlayReplacements=0` and `hoverOutlineReplacements=0`.
- Hovering Bolivia, Brasilia, French Guiana, and Ontario in sequence produced the expected ordinary hover fill, selected Brasilia capital star, Brazil-claim hover fill, and Canadian foreign overlay.
- Selecting Brasilia kept the filled capital star and selection label correct.
- Clearing the map removed selected overlays and reset capital markers.
- Switching language with Brazil selected preserved the Brasilia capital marker while refreshing localized UI state.

Retrospective:

- Splitting the hover keys removes noisy empty-layer clears without changing hover semantics.
- The existing capital marker key was already appropriately conservative; the added regression is the main Phase 06 protection for future marker changes.
