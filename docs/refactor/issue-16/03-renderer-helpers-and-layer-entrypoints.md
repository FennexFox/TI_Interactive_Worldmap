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

- [ ] SVG helper functions added
- [ ] Base map rendering migrated
- [ ] Label rendering migrated
- [ ] Overlay rendering migrated
- [ ] Hover and selection rendering migrated
- [ ] Generated Pages assets rebuilt
- [ ] Validation completed
- [ ] Manual smoke completed

## Decision Log

- Renderer helpers remain in `src/app.js` during issue #16 to avoid introducing build or module changes.
- Layer IDs remain stable for CSS, tests, and manual debugging.

## Outcomes

Not started.
