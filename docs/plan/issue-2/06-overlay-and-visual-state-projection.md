# Phase 06: Overlay and Visual State Projection

## Goal

Project claim overlays, hover outlines, selection outlines, labels, and capital markers onto every visible world copy.

## Scope

- Render selected-nation claim overlays for each world-copy context.
- Render claim labels, hover outlines, selection outlines, foreign hover overlays, and capital markers for each visible copy.
- Keep overlay model calculation canonical and unchanged.
- Keep render keys stable so ordinary panning does not rebuild overlay DOM unnecessarily.
- Ensure all visual-state classes apply to every instance of a canonical region.
- Preserve existing side-panel and claim-card behavior.

## Non-goals

- Do not change claim semantics or project filtering.
- Do not duplicate overlay models per copy.
- Do not add new claim UI.
- Do not implement broad overlay performance refactors beyond what copied rendering requires.
- Do not remove the review flag yet unless Phase 07 is also complete.

## Affected Files

- `src/app.js`
- `src/render/map-layers.js`
- `src/state/map-visual-state.js`
- `src/styles.css` if copied overlay groups need class-level styling
- `tests/language.spec.js`
- `tests/map-wrap.spec.js`
- Generated copies under `docs/assets/**` after `npm run build`

## Implementation Steps

1. Pass the active copy plan through map overlay render context.
2. Render overlay children inside translated copy groups rather than mutating canonical path data where possible.
3. Include copy plan identity in render keys only when the set of rendered copies changes, not on every pan tick.
4. Apply `mapVisualState` to all region and hit instances.
5. Update hover, selection, foreign-hover, and capital marker rendering to emit one visual projection per relevant copy.
6. Confirm tooltips still display canonical region and nation names.
7. Add tests that select a nation, pan to a copied world, and verify overlays remain aligned.
8. Add tests that hover and click copied regions while a claim overlay is active.

## Acceptance Criteria

- Claim and unification overlays render on canonical and wrapped copies.
- Hover overlays and selection outlines render on the visible copy being inspected.
- Capital markers appear on the appropriate copied regions.
- Tooltips and selected state remain single canonical states.
- Panning does not rebuild derived indices.
- Panning does not rebuild overlay DOM unless the copy plan or overlay model changes.
- Existing overlay cache and debug-stat tests still pass or are updated with equivalent multi-copy expectations.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Focused commands:

```powershell
npx playwright test tests/language.spec.js -g "overlay"
npx playwright test tests/map-wrap.spec.js -g "overlay"
```

## Manual Smoke Tests

- Open `/?worldWrap=1`.
- Select Brazil and pan east and west.
- Confirm Brazil territory, claim overlays, labels, and capital marker stay aligned on visible copies.
- Hover a Brazilian region, a foreign region, and a claim target after panning.
- Click a copied region and confirm the side panel identifies the same canonical nation and region.
- Toggle claim mode, claim kind, project filter, labels, and only-claims while panned.

## Rollback Risks

- Overlay render keys can include unstable camera values and cause DOM churn while panning.
- Some overlay helpers derive positions from raw path centers and may need copy offsets applied consistently.
- Duplicate overlay labels can clutter the viewport if too many copies are visible at once.
- Visual-state class application can miss hit paths if visible and hit registries diverge.

## Progress

- [x] Copy plan passed to overlay render context.
- [x] Claim overlays projected to copies.
- [x] Hover and selection overlays projected to copies.
- [x] Capital markers projected to copies.
- [x] Overlay panning tests added.

## Decision Log

- Decision: Keep overlay models canonical and project them during rendering.
- Decision: Treat copy offset as render context, not model state.
- Decision: Reuse the renderer's world-copy grouping helper for overlays so base, hit, label, and overlay layers share the same transform and copy metadata conventions.
- Decision: Include the copy-plan key in claim, label, hover, and capital marker render keys, but keep pan-normalized camera coordinates out of those keys.
- Decision: Skip empty projected copy groups so cleared selection and disabled claim overlays still leave empty layers.
- Decision: Add `data-region` and `data-wrap-*` metadata to projected claim overlays and labels to make alignment and copy coverage testable.
- Decision: Treat hover clearing at drag start as hover-state churn, not pan churn; pan cache tests start from blank map space to isolate ordinary panning.

## Outcomes

- Projected claim overlays, claim labels, hover outlines, selection outlines, foreign-hover overlays, and capital markers across all active world-copy contexts behind `?worldWrap=1`.
- Kept claim and hover models canonical; only SVG rendering receives the copy context.
- Added stable copy-plan render keys for projected overlay layers without including `mapView.x`, so ordinary panning does not replace overlay DOM.
- Exported shared copy projection helpers from `src/render/map-layers.js` and used them for app-level overlay layers.
- Added `tests/map-wrap.spec.js` coverage for copied hover/selection outputs, copied claim overlays, capital markers, pan-with-overlay cache stability, and copied foreign-hover overlays.
- Rebuilt generated static assets under `docs/assets/**`.
- Focused validation passed: `npx playwright test tests/language.spec.js -g "overlay"` and `npx playwright test tests/map-wrap.spec.js -g "overlay|world-wrap review projects|copied hit|panning preserves"`.
- Full validation passed: `npm run build`, `npm run verify`, and `npm run test:e2e` with 27 active tests and 3 skipped future issue #2 markers.
- Manual smoke passed against the static `docs/` site: selected Brazil, panned east and west, confirmed copied overlay alignment, hovered Brazilian and foreign copied regions, clicked copied Amazonia, and toggled claim mode, claim kind, project, labels, and only-claims while panned.
- Retrospective: overlay projection now matches wrapped base and hit layers, but antimeridian path tearing and final default enablement remain Phase 07 and Phase 08 work.
