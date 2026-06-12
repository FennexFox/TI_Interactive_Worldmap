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

- [ ] Safe-hover predicate defined.
- [ ] Previous/next region delta applied.
- [ ] Full sync retained for broad changes.
- [ ] Hover regression coverage added or updated.
- [ ] Validation commands run.

## Decision Log

- The fast path should be opt-in from clearly simple hover transitions, not a replacement for the full visual-state model.
- Prefer a too-narrow fast path over one that risks stale selected overlays, foreign hover overlays, marker state, or filtered visibility.

## Outcomes

Pending implementation.
