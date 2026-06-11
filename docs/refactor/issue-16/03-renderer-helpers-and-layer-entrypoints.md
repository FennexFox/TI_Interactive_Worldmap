# Phase 3: Renderer Helpers And Layer Entrypoints

## Goal

Centralize SVG creation and layer rendering behind reusable helpers without changing what the user sees.

Later phases need stable renderer entry points for hit layers, overlay models, visual state application, and map-view options.

## Scope

- Add small renderer helpers in `src/app.js`.
- Route existing SVG creation through those helpers.
- Preserve current SVG layer IDs and ordering.
- Establish layer-level entry points for:
  - base map regions
  - labels
  - claim overlays
  - claim labels
  - hover overlays
  - selection overlays
  - capital markers
- Keep the helpers local to `src/app.js` for now.

## Non-goals

- Do not introduce a bundler or module system.
- Do not change event handling yet.
- Do not add the hit layer yet unless a harmless empty layer helper is needed.
- Do not implement repeated map copies.
- Do not optimize by combining paths.
- Do not change visual design.

## Affected Files

- `src/app.js`
- `docs/assets/app.js` after `npm run build`
- `tests/language.spec.js` only if tests need behavior-preserving timing adjustments

## Implementation Steps

1. Add helpers such as:

   ```js
   function createSvgElement(tag, attrs = {}, dataset = {}) {}
   function createRegionPath(region, attrs = {}, dataset = {}) {}
   function replaceChildren(parent, childrenOrFragment) {}
   function setLayerVisible(layer, visible) {}
   ```

2. Update `renderRegions()` to use `createRegionPath()` while keeping all existing class names and data attributes.
3. Update `renderLabels()` to use the same SVG helper.
4. Update hover and selection helper functions to use common path creation.
5. Update claim overlay and claim label rendering to use helper functions.
6. Update capital marker rendering only if it can be done without growing the phase too much.
7. Keep `regionPathElements`, `pathByRegion`, and existing direct visual state mutation for now; those are addressed in later phases.
8. Run `npm run build`.
9. Run validation and smoke tests.

## Acceptance Criteria

- Renderer helper functions exist and are used by the main SVG rendering paths.
- Base map, labels, overlays, hover outlines, selection outlines, and capital markers look unchanged.
- Existing tests still target the same user-visible DOM where possible.
- No event delegation, visual-state, or overlay-model behavior changes are introduced.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Confirm the base map renders with all base color modes.
- Toggle region labels and confirm labels appear and disappear.
- Select Brazil and inspect owned-territory and claim overlays.
- Hover Amazonia and Ontario and confirm hover overlays are unchanged.
- Click Brasilia and confirm selected outline and label behavior.
- Confirm capital markers render once and remain on top of overlays.

## Rollback Risks

Medium. SVG helper extraction can accidentally omit attributes such as `d`, `class`, `fill`, `data-region`, or `pointer-events`-critical classes.

Rollback should remove helper extraction but leave phase 1 and phase 2 intact.

## Progress

- [x] SVG helper functions added
- [x] Base map rendering migrated
- [x] Label rendering migrated
- [x] Overlay rendering migrated
- [x] Hover and selection rendering migrated
- [x] Generated Pages assets rebuilt
- [x] Validation completed
- [x] Manual smoke completed

## Decision Log

- Renderer helpers remain in `src/app.js` during issue #16 to avoid introducing build or module changes.
- Layer IDs remain stable for CSS, tests, and manual debugging.
- 2026-06-11: Added `SVG_NS`, `createSvgElement()`, `createRegionPath()`, `replaceLayerChildren()`, and `setLayerVisible()`.
- 2026-06-11: Migrated base region paths, labels, claim overlays, claim labels, hover/selection overlays, foreign hover overlays, and capital markers to helper-based SVG creation.
- 2026-06-11: Kept grid rendering as string-based markup because it is not a region/overlay layer and does not affect follow-up boundaries.
- 2026-06-11: Kept per-region event listeners, `regionPathElements`, and DOM class mutation unchanged for later phases.

## Outcomes

Completed on 2026-06-11.

### Completed Phase Summary

Phase 3 centralized SVG element creation and layer replacement while keeping the current DOM layer IDs, visual classes, and interaction ownership intact. The refactor creates renderer helper entry points that later phases can reuse for hit layers, overlay model rendering, and visual-state application.

The implementation added or used:

- `createSvgElement()` for generic SVG nodes and text content.
- `createRegionPath()` for region-shaped paths.
- `replaceLayerChildren()` for clearing and replacing SVG layer contents.
- `setLayerVisible()` for label layer visibility.
- helper-backed rendering for base regions, labels, claim overlays, claim labels, hover highlights, selection markers, foreign hover overlays, and capital markers.

### Changed Files

- `src/app.js`
- `docs/assets/app.js`
- `docs/refactor/issue-16/00-master-plan.md`
- `docs/refactor/issue-16/03-renderer-helpers-and-layer-entrypoints.md`

`docs/assets/app.js` changed only because `npm run build` copies `src/app.js` into the generated Pages output.

### Test Results

- `npm run build`: passed.
- `npm run verify`: passed.
- `npm run test:e2e`: passed, 7 tests.
- Manual smoke coverage was exercised through a browser smoke script against `docs/`; it passed base map color modes, label toggling, Brazil owned/claim overlays, Amazonia/Ontario hover overlays, Brasilia selection, and capital marker top-layer order.

### Retrospective

This phase was safest when kept as an extraction of SVG creation only. Avoiding event delegation and canonical visual state changes kept it independently reviewable and gave Phase 4 and Phase 6 cleaner helper seams to build on.

### Remaining Risks

- The helpers are still local to `src/app.js`, so they reduce duplication but do not yet create module-level isolation.
- Grid rendering still uses string markup. That is acceptable for Phase 3 because grid rendering is not part of the region/overlay boundaries targeted by issue #16.
- Direct class mutation still exists and is intentionally deferred to Phase 6.
