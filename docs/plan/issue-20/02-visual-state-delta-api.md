# Phase 02: Visual State Delta API

## Goal

Add a small, behavior-preserving visual-state helper seam that can apply classes to only a bounded set of region IDs. This prepares the hover fast path without changing event behavior yet.

## Scope

- Extend `src/state/map-visual-state.js` with a helper that applies visual classes for one region or a set of region IDs.
- Keep the existing full `applyMapVisualState` path intact.
- Ensure hidden-state updates still cover visible region paths and hit paths when required.
- Add unit-style or Playwright-visible assertions only where practical.

## Non-Goals

- Do not route hover through the new helper yet.
- Do not cache overlays yet.
- Do not change selection, filter, overlay, or hit-layer behavior.
- Do not alter CSS class names or styling.

## Affected Files

- `src/state/map-visual-state.js`
- `src/app.js` only for wrapper plumbing if needed
- `tests/language.spec.js` or a focused new spec if helper behavior can be observed
- Generated `docs/assets/state/map-visual-state.js` after `npm run build`

## Implementation Steps

1. Extract the per-region class toggling logic from `applyMapVisualState` into an internal helper.
2. Add an exported helper, for example `applyMapVisualStateForRegions(renderContext, mapVisualState, regionIds)`.
3. Make the helper update visible region paths through a lookup such as `pathByRegion` where available.
4. Include hit-path hidden updates only for the region IDs passed to the bounded helper.
5. Leave `svg.claims-active` handling centralized or explicitly update it in both full and bounded helpers when needed.
6. Keep `applyMapVisualState` as the full synchronization path and make it reuse the extracted helper internally.
7. Run build, verify, and e2e.

## Acceptance Criteria

- The full visual-state pass behaves exactly as before.
- A bounded visual-state API exists and can update selected, owned, claim-target, hovered, dimmed, and hidden classes for specific regions.
- The bounded helper does not require render modules to import `appState`.
- No user-visible behavior changes are expected in this phase.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Load the map and confirm all regions render.
- Hover Amazonia and confirm hover fill, hover pill, tooltip, and capital marker behavior.
- Select Brazil and confirm selected regions, claim overlays, labels, and capital markers.
- Toggle "show claim targets only" and confirm hidden visible and hit regions stay synchronized.

## Rollback Risks

- Splitting class logic can accidentally miss a class in the bounded path.
- Hidden-state updates must keep hit paths and visible paths aligned.
- If `svg.claims-active` is updated only in one path, overlay CSS can drift.

## Progress

- [x] Per-region class helper extracted.
- [x] Bounded exported helper added.
- [x] Full synchronization path verified unchanged.
- [x] Validation commands run.

## Decision Log

- This phase intentionally creates the helper seam before changing hover behavior to keep the review narrow.
- Added `applyMapVisualStateForRegions` as the bounded export and kept `applyMapVisualState` as the full synchronization path.
- Kept the bounded helper unused by hover in this phase; Phase 03 will decide when it is safe to call.
- Did not add a separate UI test for the bounded helper because it is not user-reachable until Phase 03. Existing e2e coverage verifies the unchanged full path.

## Outcomes

Implemented Phase 02 on 2026-06-12.

Source changes:

- Extracted per-visible-region and per-hit-region class application helpers in `src/state/map-visual-state.js`.
- Added `applyMapVisualStateForRegions(renderContext, mapVisualState, regionIds)` for future bounded updates.
- Updated the `src/app.js` wrapper plumbing to pass `pathByRegion` and expose a local bounded wrapper for later phases.
- Rebuilt generated Pages app output with `npm run build`.

Validation:

- `npm run build` passed.
- `npm run verify` passed: generated outputs verified, 5 Python unit tests passed.
- `npm run test:e2e` passed: 8 Playwright tests passed.

Manual smoke notes:

- Initial map load rendered 363 visible region paths and 363 visible hit paths.
- Hovering Amazonia showed `Hover: BRA - Manaus`, displayed the tooltip, and rendered the Brasilia capital marker.
- Selecting Brazil showed `Brazil: territory 9, claims 17, research tiers 2`, 26 claim overlays, 2 claim labels, and the Brasilia marker.
- Toggling "show claim targets only" hid 337 visible regions and 337 hit regions; the hidden region and hidden hit-path sets matched exactly.

Retrospective:

- The full synchronization path remains behaviorally unchanged after extraction.
- The bounded helper has the right inputs for Phase 03: explicit render context, explicit visual state, and explicit region IDs. It does not import app state into render modules.
- The main risk for Phase 03 is choosing the safe-hover predicate correctly; the helper itself now updates the same classes as the full path for the requested region IDs.
