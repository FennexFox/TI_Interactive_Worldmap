# Phase 04: Overlay Model Cache

## Goal

Reuse selected and hovered nation overlay models when their effective inputs have not changed.

## Scope

- Introduce explicit overlay model cache keys in `src/app.js`.
- Cache `buildNationOverlayModel` results for unchanged active scenario, nation, claim mode, claim kind, project filter, active incoming claim, and relevant data version.
- Invalidate cache on active data/scenario, claim filter, selected/hovered nation, or incoming claim changes.
- Preserve current render behavior even when a cached model is returned.
- Treat cached overlay models as immutable values.

## Non-Goals

- Do not skip overlay DOM rendering yet.
- Do not change claim model semantics.
- Do not extract overlay model code into a new module unless it is trivial and clearly lowers risk.
- Do not add multi-scenario behavior beyond cache-key readiness.

## Affected Files

- `src/app.js`
- `src/data/active-data.js` or `src/data/derived-indices.js` only if a lightweight version key is needed
- `tests/language.spec.js` or a focused overlay spec
- Generated `docs/assets/app.js` and possibly `docs/assets/data/*.js` after `npm run build`

## Cached Model Mutability Rule

Cached overlay models must be treated as immutable. Rendering code must not mutate model `Set` or array instances. If mutation is currently convenient, clone before mutation. A development-only freeze or guard is acceptable if it stays disabled in normal production behavior.

## Implementation Steps

1. Define a stable cache-key builder for overlay model inputs.
2. Include active scenario ID, active data identity or version, nation ID, `claimModeSel.value`, `claimKindSel.value`, `getProjectFilter()`, and `getActiveIncomingClaimKey()`.
3. Wrap `buildNationOverlayModel` calls in a `getNationOverlayModel` helper.
4. Clear or naturally miss the cache when filters, active incoming claim, scenario, or selected/hovered nation change.
5. Keep `updateNationOverlay` rendering from the returned model exactly as before.
6. Audit the render path for mutation of cached model `Set` or array values. Clone before mutation, or add a small debug guard to catch accidental writes during development.
7. If Phase 01 added counters, assert or manually confirm repeated same-key calls do not rebuild the model.
8. Run build, verify, and e2e.

## Acceptance Criteria

- Repeated overlay requests for the same effective inputs reuse the previous model.
- Selected nation overlay state is reused while selected nation, active scenario, and overlay/filter options are unchanged.
- Cache keys are explicit and understandable.
- Cached models are not mutated by later rendering or panel code.
- Cache invalidation covers active data/scenario, claim filters, project filter, active incoming claim, and nation changes.
- Existing claim overlay, claim card, search, and panel behavior remains unchanged.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Select Brazil twice through search and confirm overlay/panel state remains correct.
- Toggle project filter and confirm the cache misses and overlay changes.
- Toggle claim kind from all to hostile and back.
- Click an incoming claim card and confirm the active claimant overlay is correct.
- Clear map and confirm cache reuse does not leave stale overlays.

## Rollback Risks

- Missing cache inputs can reuse stale claim overlays.
- Cache invalidation can be too aggressive and produce no measurable benefit.
- Cached models contain `Set` instances, so later code must not mutate cached sets in ways that corrupt future reads.
- Debug-only immutability guards can add noise or runtime cost if they accidentally remain active in normal production mode.

## Progress

- [x] Overlay model key builder added.
- [x] Cached model getter added.
- [x] Invalidation strategy verified.
- [x] Repeated same-key interactions checked.
- [x] Validation commands run.

## Decision Log

- Cache models before caching DOM rendering so semantic reuse can be validated independently from render skipping.
- Model cache safety depends on immutable read behavior; mutation must happen on local clones, not cached values.
- Cache invalidation is handled by explicit semantic keys and natural misses rather than clearing on every state change.
- The cache key includes selected region IDs because incoming claim cards are scoped by the current selected-region set.
- The cache key includes the active UI language because claim model entries contain localized source labels.
- Cached models are retained in an insertion-ordered `Map` with a small LRU-style cap so hover-preview exploration cannot grow the cache without bound.
- Rendering keeps cloning `model.resultSet` into `visibleNationRegionNames`; cached model `Set` values are read-only inputs to visual state sync and DOM rendering.

## Outcomes

Implemented Phase 04 on 2026-06-13.

Source changes:

- Added explicit overlay model cache-key construction in `src/app.js`.
- Added `getNationOverlayModel` as the only overlay update wrapper around `buildNationOverlayModel`.
- Included active scenario, data version, language, nation, claim mode, claim kind, project filter, active incoming claim, selected regions, and options cache key in the model cache key.
- Kept `renderMapOverlay`, claim summary rendering, panel rendering, and panel event binding behavior unchanged.
- Added a Playwright regression proving same-key cache reuse, filter/key misses, selected-region keying, and unchanged overlay counts.
- Rebuilt generated Pages app output with `npm run build`.

Validation:

- `npm run build` passed.
- `npm run verify` passed: generated outputs verified, 5 Python unit tests passed.
- `npm run test:e2e` passed: 11 Playwright tests passed.
- Focused `npm run test:e2e -- --grep "overlay model cache"` passed: 1 Playwright test passed.

Manual smoke notes:

- Selecting Brazil twice reused the cached overlay model with no model rebuild and preserved the 26 overlay paths and summary pill.
- Selecting the Gran Colombia project filter missed the cache and changed the overlay to 14 paths.
- Returning to all claims reused the cached all-claims model.
- Switching claim kind to hostile missed the cache and changed the overlay to 20 paths; switching back to all reused the cached model.
- Clicking an incoming claim card from selected Amazonia switched to the Bolivia claimant overlay, preserved the active outgoing claim card, and rendered 26 overlay paths.
- Clearing the map left no stale cached overlay state: search cleared, claim mode reset to all, the claim pill returned to empty, claim overlays were removed, and selection outlines were cleared.

Retrospective:

- The phase delivers semantic model reuse without changing DOM replacement behavior, keeping this independently reviewable from later render-skipping work.
- Selected regions and language are necessary cache inputs even though they are easy to miss; omitting either could produce stale incoming-claim panels or localized detail text.
- Further savings now depend on Phase 05 reducing overlay DOM replacement churn after cached models prove stable.
