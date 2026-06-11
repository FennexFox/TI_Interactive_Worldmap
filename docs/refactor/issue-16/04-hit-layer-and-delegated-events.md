# Phase 4: Hit Layer And Delegated Events

## Goal

Separate visible SVG region paths from pointer hit testing and move region interaction to delegated handlers.

This prepares the app for future repeated world copies where multiple visible instances may represent one canonical region.

## Scope

- Add a transparent hit-test layer to the SVG.
- Render one hit path per canonical region.
- Keep visible region paths responsible for visual map rendering only.
- Move region hover, move, leave, and click behavior from per-region visible-path listeners to delegated handlers.
- Resolve canonical region identity from stable data attributes.
- Preserve current tooltip, hover, selection, clear, and capital marker behavior.

## Non-goals

- Do not implement world-wrap panning.
- Do not render repeated map copies.
- Do not change selected-region or selected-nation semantics.
- Do not change overlay styling beyond what is required for hit paths.
- Do not remove visual region paths.

## Affected Files

- `src/index.html`
- `src/styles.css`
- `src/app.js`
- `docs/index.html` after `npm run build`
- `docs/assets/styles.css` after `npm run build`
- `docs/assets/app.js` after `npm run build`
- `tests/language.spec.js` if tests should target hit paths for user actions

## Implementation Steps

1. Add a hit layer near the end of the SVG layer stack, above visual map paths and below non-interactive overlays if needed:

   ```html
   <g id="hitRegions"></g>
   ```

2. Add CSS for transparent hit paths:

   ```css
   .region-hit {
     fill: transparent;
     stroke: transparent;
     pointer-events: all;
     cursor: pointer;
   }
   ```

3. Render hit paths from active regions:

   ```js
   function renderHitLayer(parent, activeData, indices) {}
   ```

4. Give each hit path stable identity attributes:
   - `data-region-id`
   - `data-region`
   - `data-nation`
5. Add `resolveHitRegion(event, indices)` using `closest('[data-region-id], [data-region]')`.
6. Replace per-region listeners in `renderRegions()` with delegated listeners on `#hitRegions` or `svg`.
7. Recreate current enter/leave semantics with pointerover/pointerout or pointermove tracking:
   - entering a new region calls current hover update behavior
   - moving within the same region updates tooltip position
   - leaving to blank map clears transient hover as before
8. Ensure empty-map click still clears selection.
9. Update tests only if Playwright must hover/click `.region-hit` instead of `.region`.
10. Run `npm run build`.
11. Run validation and smoke tests.

## Acceptance Criteria

- A dedicated hit-test layer exists.
- Visible region paths are no longer the only interaction targets.
- Pointer and click handling is delegated.
- Canonical region identity is resolved from stable data attributes.
- Hover tooltip, hover pill, hover overlays, selection, capital markers, and empty-map clear behave as before.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Useful targeted checks:

```powershell
rg "addEventListener\\('pointer|addEventListener\\(\"pointer|data-region-id|region-hit|hitRegions" src/app.js src/index.html src/styles.css
```

## Manual Smoke Tests

- Hover Amazonia and confirm tooltip and hover fill.
- Move from Amazonia to another Brazil region and confirm no stale hover.
- Select Brazil from search, then hover Ontario and confirm foreign hover overlay.
- Click Amazonia and Brasilia and confirm selected-region behavior.
- Click empty map space and confirm selection clears.
- Hover a graticule or blank area and confirm hover clears.
- Confirm overlays do not block hit testing.

## Rollback Risks

High. Pointer delegation can subtly change `pointerenter` and `pointerleave` behavior. Transparent hit paths can also block or miss pointer events if layer order or CSS is wrong.

Rollback should restore per-region listeners and remove the hit layer.

## Progress

- [x] Hit layer added to SVG
- [x] Hit path CSS added
- [x] Hit layer renderer added
- [x] Region resolver added
- [x] Delegated hover/move/leave behavior implemented
- [x] Delegated click behavior implemented
- [x] Empty-map clear verified
- [x] Generated Pages assets rebuilt
- [x] Validation completed
- [x] Manual smoke completed

## Decision Log

- Use existing region names as canonical browser identity for this phase.
- Keep visible `.region` paths available for rendering, styling, and compatibility.
- Update tests to prefer user-visible behavior over exact interaction target when practical.
- 2026-06-11: Added `#hitRegions` as the top SVG interaction layer and `.region-hit` as transparent pointer target paths.
- 2026-06-11: Added `renderHitLayer()`, `resolveHitRegion()`, and delegated hit-layer pointer/click handlers in `src/app.js`.
- 2026-06-11: Kept visible `.region` paths and `regionPathElements` for visual state, but removed per-region pointer/click listeners from visible paths.
- 2026-06-11: Synchronized hidden state between visible paths and hit paths so search and only-claims filters do not leave hidden regions clickable.
- 2026-06-11: Treated `#hitRegions` background clicks/moves as blank map interactions for clear/hover-clear behavior.
- 2026-06-11: Updated Playwright region interactions to dispatch events through hit-path helpers. Direct SVG path actionability can choose a bounding-box point intercepted by overlapping paths, which is not a reliable way to target irregular SVG regions.

## Outcomes

Completed on 2026-06-11.

### Completed Phase Summary

Phase 4 added a dedicated transparent hit layer and moved region interaction to delegated hit-layer handlers. Visible region paths now remain responsible for rendering and class state, while hit paths own pointer and click interaction.

The implementation added:

- `#hitRegions` to `src/index.html`.
- `.region-hit` CSS and hidden-state parity with `.region.hidden`.
- hit-path caches in `src/app.js`.
- `renderHitLayer(parent, activeData, indices)`.
- `resolveHitRegion()` and delegated pointerover, pointermove, pointerout, and click handlers.
- blank-map handling for `#hitRegions` itself.
- e2e helpers that target hit paths instead of visible region paths.

### Changed Files

- `src/index.html`
- `src/styles.css`
- `src/app.js`
- `docs/index.html`
- `docs/assets/styles.css`
- `docs/assets/app.js`
- `tests/language.spec.js`
- `docs/refactor/issue-16/00-master-plan.md`
- `docs/refactor/issue-16/04-hit-layer-and-delegated-events.md`

Generated `docs/**` files changed because `npm run build` copied the source updates.

### Test Results

- `npm run build`: passed.
- `npm run verify`: passed.
- `npm run test:e2e`: passed, 7 tests.
- Targeted check for hit-layer markers and delegated pointer handlers passed with `rg -n 'pointerover|pointermove|pointerout|data-region-id|region-hit|hitRegions' src\app.js src\index.html src\styles.css`.
- Manual smoke coverage was exercised through a browser smoke script against `docs/`; it passed delegated hit-layer hover, move between regions without stale hover, overlay click-through, blank hover clear, and blank click clear.

### Retrospective

The main Phase 4 risk was not the delegation logic itself, but interaction test targeting. SVG path bounding boxes are not reliable click points for irregular regions when transparent hit paths overlap. Dispatching through hit-path helpers gives stable coverage of the delegated event path while the manual smoke script verifies the same user-facing outcomes.

### Remaining Risks

- Tests now use event dispatch helpers for region interactions. This is stable for verifying delegation behavior but is less close to physical pointer movement than direct Playwright hover/click.
- The visible path DOM still carries visual state classes. That is intentional until Phase 6 introduces canonical visual state.
- Hit path order mirrors region order. If future data introduces overlapping geometries that matter for real pointer targeting, a later issue may need explicit z-order policy.
