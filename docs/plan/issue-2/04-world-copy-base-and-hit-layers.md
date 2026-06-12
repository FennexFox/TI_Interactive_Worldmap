# Phase 04: World Copy Base and Hit Layers

## Goal

Render repeated base map, label, grid, and hit-layer instances behind a review flag while preserving canonical interaction.

## Scope

- Add a temporary review flag such as `?worldWrap=1` or an equivalent internal feature flag.
- Render base region paths at `-worldWidth`, `0`, and `+worldWidth` offsets when the flag is active.
- Render aligned hit paths for the same copy offsets.
- Repeat labels and grid only when they remain readable and do not add excessive clutter.
- Keep default behavior unchanged when the flag is absent.
- Ensure hover and click on any rendered hit copy resolve to the same canonical region.

## Non-goals

- Do not add drag panning yet.
- Do not project claim, hover, selection, or capital overlay layers yet unless trivial from the new infrastructure.
- Do not enable the feature by default.
- Do not split antimeridian geometry in this phase.
- Do not alter canonical data, claim models, or search semantics.

## Affected Files

- `src/app.js`
- `src/render/map-layers.js`
- `src/state/map-visual-state.js`
- `src/styles.css` if cursor or copy-layer styling is needed
- `tests/map-wrap.spec.js`
- Generated copies under `docs/assets/**` after `npm run build`

## Implementation Steps

1. Add a small flag helper for review-only world-wrap activation.
2. Compute copy contexts from `mapView.worldWidth`.
3. Render each copy inside a translated SVG `<g>` so raw region path geometry is not rewritten on every pan.
4. Add `data-region`, `data-region-id`, and `data-wrap-copy` attributes to hit paths.
5. Make delegated hit resolution ignore copy identity and return the canonical region from `derivedIndices.regionByName`.
6. Ensure filters hide or show all instances of a canonical region.
7. Add Playwright tests that dispatch pointer and click events against non-canonical copy hit paths.
8. Confirm the default unflagged app remains visually unchanged.

## Acceptance Criteria

- With the flag off, the app behaves as before.
- With the flag on, left, center, and right base map copies exist as renderer instances.
- Hit paths are aligned with visible region copies.
- Hovering or clicking any copy resolves to the same canonical region and nation.
- Search results and side-panel state are not duplicated by rendered copies.
- Static build output works from `docs/`.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Focused command:

```powershell
npx playwright test tests/map-wrap.spec.js
```

## Manual Smoke Tests

- Open `/?worldWrap=1`.
- Inspect the SVG and confirm copy groups exist for negative, zero, and positive offsets.
- Programmatically or visually target a copied hit path and confirm the same region tooltip appears.
- Click a copied region and confirm the same nation and selected-region panel state appears.
- Open `/` without the flag and confirm the DOM and behavior are still the normal single-copy app.

## Rollback Risks

- Duplicate hit paths can block blank-map click clearing if event delegation does not distinguish map background from hit targets.
- Label duplication can reduce readability if enabled too early.
- Copy groups may increase DOM size enough to expose performance issues in existing hover tests.
- Misaligned transforms between visible and hit groups can make pointer behavior wrong even if visual output looks correct.

## Progress

- [ ] Review flag added.
- [ ] Copy contexts computed from `worldWidth`.
- [ ] Base map copies rendered behind flag.
- [ ] Hit layer copies rendered behind flag.
- [ ] Canonical hit resolution tested.

## Decision Log

- Decision: Keep this phase behind a flag because overlays and pan gestures are not complete yet.
- Decision: Use SVG group transforms for copies so panning can shift the viewBox without rewriting path data.

## Outcomes

Pending implementation.

