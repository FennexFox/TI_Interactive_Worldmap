# Phase 02: Map View State and Normalization

## Goal

Make horizontal camera state explicit and testable without changing what users see.

## Scope

- Extract or introduce map-view helpers for initialization, pan deltas, viewBox generation, and horizontal normalization.
- Keep `mapView.worldWidth` derived from the active region map summary viewBox.
- Keep vertical bounds tied to the original map extent.
- Add pure tests for horizontal normalization and vertical clamping.
- Keep rendering as a single unwrapped map copy.

## Non-goals

- Do not add drag, wheel, touch, keyboard, or UI controls.
- Do not render repeated world copies.
- Do not change overlay rendering.
- Do not persist map position in local storage.
- Do not change active data or derived index construction.

## Affected Files

- `src/app.js`
- `src/state/map-view-state.js` or an equivalent small state/helper module
- `tests/map-view-state.spec.js`
- `package.json` if the verification script needs explicit syntax checks for a new module
- Generated copies under `docs/assets/**` after `npm run build`

## Implementation Steps

1. Move `createMapViewState()` and `initializeMapView()` out of `src/app.js` or isolate them behind exported helper functions.
2. Add helper functions such as `normalizeWrappedX`, `panMapView`, `clampMapViewY`, and `viewBoxForMapView`.
3. Make normalization preserve visual continuity by shifting `x` by whole `worldWidth` increments only.
4. Keep the initial SVG `viewBox` identical to the current generated summary viewBox.
5. Add tests for positive, negative, and multi-width horizontal offsets.
6. Add tests that vertical panning clamps to the selected vertical policy.
7. Build and verify the generated `docs/assets` module copy.

## Acceptance Criteria

- The app looks and behaves the same as before this phase.
- `mapView` initialization still uses `activeData.regionMap.summary.viewBox`.
- Horizontal offsets normalize into a bounded range.
- Vertical panning policy is explicit and covered by tests.
- No derived data or claim overlay model rebuilds are introduced by helper creation.
- `npm run verify` and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Focused command if pure helper tests are placed in Playwright:

```powershell
npx playwright test tests/map-view-state.spec.js
```

## Manual Smoke Tests

- Open the app and confirm the initial map framing is unchanged.
- Select and hover regions as in Phase 01.
- Toggle labels and claim filters.
- Refresh the page and confirm no map position persistence was added accidentally.

## Rollback Risks

- Incorrect viewBox initialization can shift or crop the whole map.
- A helper extraction can break module import paths in `docs/assets`.
- Adding a new source module without building can leave GitHub Pages output stale.

## Progress

- [ ] Map-view helper API chosen.
- [ ] Initial viewBox parity verified.
- [ ] Normalization tests added.
- [ ] Vertical bounds tests added.
- [ ] Generated docs output rebuilt.

## Decision Log

- Decision: Prefer explicit `mapView` helpers over embedding wrap math inside pointer handlers.
- Decision: Normalize horizontal camera coordinates early so later phases do not need to handle unbounded values.

## Outcomes

Pending implementation.

