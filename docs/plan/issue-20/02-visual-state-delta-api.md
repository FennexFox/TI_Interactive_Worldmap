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

- [ ] Per-region class helper extracted.
- [ ] Bounded exported helper added.
- [ ] Full synchronization path verified unchanged.
- [ ] Validation commands run.

## Decision Log

- This phase intentionally creates the helper seam before changing hover behavior to keep the review narrow.

## Outcomes

Pending implementation.
