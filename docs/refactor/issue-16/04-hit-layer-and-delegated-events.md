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

- [ ] Hit layer added to SVG
- [ ] Hit path CSS added
- [ ] Hit layer renderer added
- [ ] Region resolver added
- [ ] Delegated hover/move/leave behavior implemented
- [ ] Delegated click behavior implemented
- [ ] Empty-map clear verified
- [ ] Generated Pages assets rebuilt
- [ ] Validation completed
- [ ] Manual smoke completed

## Decision Log

- Use existing region names as canonical browser identity for this phase.
- Keep visible `.region` paths available for rendering, styling, and compatibility.
- Update tests to prefer user-visible behavior over exact interaction target when practical.

## Outcomes

Not started.
