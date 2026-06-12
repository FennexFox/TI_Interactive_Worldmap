# Phase 03: Simple Hover Fast Path

## Goal

Make simple region hover changes update only the previous and next hovered region, but only when the transition is proven to affect hover-region classes and no broader visual state changed.

## Scope

- Route `updateHoveredRegion` and hover clear behavior through the bounded visual-state helper from Phase 02 only when safe.
- Track previous and next hovered region IDs.
- Preserve full synchronization for selection, overlay, filter, visibility, scenario, and claim-target changes.
- Keep tooltip, hover pill, hover outlines, foreign hover preview scheduling, and capital marker behavior unchanged.

## Non-Goals

- Do not cache overlay model construction in this phase.
- Do not skip overlay DOM replacement yet.
- Do not change the hit-layer event model.
- Do not change hover styling or selected overlay semantics.

## Affected Files

- `src/app.js`
- `src/state/map-visual-state.js` if minor helper adjustments are needed
- `tests/language.spec.js` or a new focused hover spec
- Generated `docs/assets/app.js` and `docs/assets/state/map-visual-state.js` after `npm run build`

## Safety Rule

Default to full synchronization. Use the bounded hover path only when the transition is proven to affect hover-region classes only.

The safe-hover predicate should be conservative. Treat any uncertainty as a full-render case, especially when selected or locked nation state, selected claim range, foreign hover overlay, capital marker state, visible/hidden filter state, active incoming claim, project filter, claim kind, claim mode, scenario/data version, or claim-target-only state might change.

## Implementation Steps

1. Identify the safe-hover predicate in `src/app.js`: no locked/selected overlay transition, no filter or hidden-state change, no selection change, no active incoming/project/claim-mode change, no capital marker selected-state change, no foreign hover overlay key change, no claim-target-only change, no scenario/data change, and no forced full render.
2. Capture the previous hovered region before calling `setHoveredRegionState`.
3. Update `mapVisualState.hoverRegionIds` with the next hovered region.
4. Call the bounded visual-state helper with `[previousRegion, nextRegion]` for safe simple hover transitions.
5. Continue to call full `applyMapVisualState` for forced hover enter, clear paths that change active nation, any predicate miss, and all broader state changes.
6. Add a regression assertion that repeated hover movement does not disturb selected overlay and still updates the hover pill/outline.
7. Run build, verify, and e2e.

## Acceptance Criteria

- Moving from one plain hovered region to another only applies visual classes for the old and new hovered regions when the conservative safe-hover predicate passes.
- Any uncertain hover transition falls back to full visual-state synchronization.
- Full map visual-state application remains used for selection, filter, overlay, scenario, visibility, and claim-target changes.
- Dense-region hover feedback remains correct.
- Tooltip, hover pill, capital markers, selected outlines, and foreign hover overlay behavior remain unchanged.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Optional focused test:

```powershell
npm run test:e2e -- --grep "hover"
```

## Manual Smoke Tests

- Hover quickly across Europe with no selection.
- Hover Amazonia, Bolivia, Brasilia, French Guiana, and Ontario with no selection.
- Select Brazil and hover within Brazil's result set.
- Select Brazil and hover outside Brazil's result set to trigger foreign hover overlay.
- Move from a region to empty map space and confirm hover state clears.

## Rollback Risks

- A too-broad fast-path predicate can skip required full synchronization after filter, overlay, marker, active-claim, or selection-related changes.
- A too-narrow predicate can make the phase behavior-preserving but miss the intended performance gain.
- Clearing hover must remove the old `hovered` class even if there is no next region.

## Progress

- [x] Safe-hover predicate defined.
- [x] Previous/next region delta applied.
- [x] Full sync retained for broad changes.
- [x] Hover regression coverage added or updated.
- [x] Validation commands run.

## Decision Log

- The fast path should be opt-in from clearly simple hover transitions, not a replacement for the full visual-state model.
- Prefer a too-narrow fast path over one that risks stale selected overlays, foreign hover overlays, marker state, or filtered visibility.
- Region-to-region `pointerover` now stops forcing full sync when the previous hit region is known; first entry from non-region space still forces full sync.
- The bounded path is allowed for locked-nation ordinary hover transitions when neither endpoint is selected, hidden, foreign-hover, or capital-marker-sensitive.
- The bounded path is also allowed for unlocked same-nation hover only after the hover preview has settled on that same active/hover nation and no preview frame or pending hover nation exists.
- Bolivia and Brasilia are intentionally full-sync cases because they can affect capital marker selected state.
- Ontario while Brazil is selected is intentionally a full-sync case because it triggers foreign hover overlay behavior.

## Outcomes

Implemented Phase 03 on 2026-06-12.

Source changes:

- Added conservative safe-hover and safe-hover-clear predicates in `src/app.js`.
- Applied `applyMapVisualStateForRegions` only for safe previous/next hover deltas and safe hover clears.
- Preserved full `applyMapVisualState` for first hover entry, active hover-preview transitions, foreign hover overlays, capital-marker-sensitive regions, hidden/selected regions, and all uncertain cases.
- Updated hit-layer pointer-over handling so movement from one known hit region to another is not automatically forced into the full path.
- Added Playwright coverage for selected-overlay bounded hover movement, bounded hover clear, and settled same-nation hover preview movement.
- Rebuilt generated Pages app output with `npm run build`.

Validation:

- `npm run build` passed.
- `npm run verify` passed: generated outputs verified, 5 Python unit tests passed.
- `npm run test:e2e` passed: 10 Playwright tests passed.
- Focused `npm run test:e2e -- --grep "bounded visual|debug render stats"` passed: 3 Playwright tests passed.

Manual smoke notes:

- No-selection Europe hover across Austria, Czechia, Germany, and Poland remained responsive and resolved the expected hover pills/regions.
- No-selection South America and North America hover across Amazonia, Bolivia, Brasilia, French Guiana, and Ontario remained correct; these still full-sync when active hover preview state changes.
- Selecting Brazil and moving from Amazonia to French Guiana used the bounded path: `fullVisualStateApplications=0`, `boundedVisualStateApplications=1`, `visiblePathsTouched=2`, `hitPathsTouched=2`, overlay model builds and claim overlay replacements stayed at 0.
- Selecting Brazil and moving to Ontario fell back to full sync and showed the Canadian foreign hover overlay, preserving selected Brazil overlay state.
- Moving from a region to empty map space cleared hover state. The automated regression also verifies a safe locked-region clear can use the bounded path with at most one visible path and one hit path touched.

Retrospective:

- The phase achieves a measurable fast path without weakening broader synchronization: safe deltas touch only old/new paths, while preview, foreign overlay, capital marker, selection, and visibility risks remain full-sync cases.
- The debug counters are useful for proving both sides of the predicate: the fast path shows bounded-only updates, and Ontario/Bolivia/Brasilia demonstrate intentional full-sync fallbacks.
- Further gains now depend on overlay model and render churn phases because unlocked cross-nation hover still rebuilds preview overlay state by design.
