# Phase 7: Map View And Follow-Up Contracts

## Goal

Add a minimal map view state object and document what follow-up issues can rely on after issue #16.

This phase creates a safe attachment point for future world-wrap panning without implementing panning.

## Scope

- Add a minimal `mapView` or camera state object.
- Initialize it from the current SVG viewBox and map summary.
- Pass view/render options through renderer entry points where useful.
- Keep the current SVG framing and behavior unchanged.
- Document follow-up contracts for world-wrap, scenario switching, secondary capital hover previews, and overlay performance work.

## Non-goals

- Do not implement drag panning.
- Do not implement zooming.
- Do not render repeated world copies.
- Do not normalize offsets.
- Do not add antimeridian validation.
- Do not add scenario switching UI.
- Do not add overlay caching.

## Affected Files

- `src/app.js`
- `docs/assets/app.js` after `npm run build`
- optionally `docs/refactor/issue-16/00-master-plan.md` outcomes after implementation
- optionally `README.md` only if maintainers want the new internal contract documented outside the refactor plan

## Implementation Steps

1. Add map view state under `appState`:

   ```js
   const mapView = {
     x: 0,
     y: 0,
     width: 0,
     height: 0,
     worldWidth: 0,
   };
   ```

2. Initialize it from `SUMMARY.viewBox`:

   ```js
   const [x, y, width, height] = activeData.regionMap.summary.viewBox;
   mapView.x = x;
   mapView.y = y;
   mapView.width = width;
   mapView.height = height;
   mapView.worldWidth = width;
   ```

3. Keep the current SVG `viewBox` and `preserveAspectRatio` behavior unchanged.
4. Pass `mapView` through render context objects where renderers already accept context.
5. Avoid adding panning event handlers or changing focus behavior.
6. Update TODO comments about future pan/zoom focus transitions to reference `mapView` as the future integration point.
7. Run `npm run build`.
8. Run validation and smoke tests.
9. Update the outcomes section in this file with the actual follow-up contracts established.

## Acceptance Criteria

- A minimal map view state object exists.
- Map view state is initialized from the current active data viewBox.
- Renderer entry points can receive render context including map view.
- Current map framing, appearance, and interactions are unchanged.
- No panning, repeated rendering, or scenario UI is introduced.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Useful targeted check:

```powershell
rg "mapView|viewBox|worldWidth|pan|zoom" src/app.js docs/assets/app.js
```

## Manual Smoke Tests

- Load the generated site and confirm the initial map framing is unchanged.
- Resize the browser and confirm the map still fits the viewport as before.
- Hover and click regions after resizing.
- Select Brazil and confirm overlays and capital markers remain aligned.
- Toggle labels, base map color, claim display, and only-claims.
- Click empty map space and confirm selection clears.

## Rollback Risks

Low to medium. The main risk is accidentally changing the SVG viewBox or renderer coordinates while adding view state.

Rollback should remove the `mapView` state and render-context plumbing from this phase only.

## Progress

- [x] Map view object added
- [x] View initialized from active data
- [x] Render context plumbing added where useful
- [x] Current SVG framing preserved
- [x] Future TODO comments aligned
- [x] Generated Pages assets rebuilt
- [x] Validation completed
- [x] Manual smoke completed
- [x] Follow-up contracts recorded

## Decision Log

- `mapView` is state only in issue #16.
- Panning, repeated world rendering, and offset normalization belong to follow-up work.
- The current SVG viewBox remains authoritative for rendering until a future issue changes it.
- 2026-06-11: Added `createMapViewState()` and `initializeMapView(activeData, target)` and initialized `appState.mapView` from `activeData.regionMap.summary.viewBox`.
- 2026-06-11: Kept the SVG `viewBox` and `preserveAspectRatio` attributes unchanged; Phase 7 only records state and passes it through existing render contexts.
- 2026-06-11: Passed `mapView` through grid, region, hit-layer, label, and overlay render contexts where those entry points already exist.
- 2026-06-11: Updated focus TODOs to name `mapView` as the future pan/zoom integration point without changing focus behavior.

## Outcomes

Completed.

`appState.mapView` now records the current map view as `{x, y, width, height, worldWidth}` initialized from the active data `summary.viewBox`. Existing render entry points can receive `{mapView}` context, while the generated SVG framing remains unchanged.

Validation completed successfully:

```powershell
node --check src/app.js
npm run build
npm run verify
npm run test:e2e
rg "mapView|viewBox|worldWidth|pan|zoom" src/app.js docs/assets/app.js
```

Manual smoke completed successfully with an inline Playwright script against the generated `docs/` site. It confirmed the initial SVG `viewBox` and `preserveAspectRatio`, resize behavior, hover and click after resizing, Brazil overlays and capital marker alignment, labels, base color modes, claim display, only-claims filtering, and empty-map clear.

Expected follow-up contracts after completion:

- World-wrap work can attach panning state to `appState.mapView` without changing current selected-nation, overlay, or hit-layer contracts.
- Scenario switching work can build on `appData`, `getActiveData()`, and `buildDerivedIndices(activeData)`.
- Secondary capital hover previews can consume overlay models instead of reading map DOM classes.
- Overlay performance work can optimize renderer layers without changing panel rendering.
- Canonical visual state work is complete enough for future render scheduling: path classes are applied through `applyMapVisualState()` from `appState.mapVisualState`.
