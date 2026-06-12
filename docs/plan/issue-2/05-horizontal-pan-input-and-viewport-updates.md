# Phase 05: Horizontal Pan Input and Viewport Updates

## Goal

Add horizontal drag panning and bounded vertical viewport updates behind the world-wrap review flag.

## Scope

- Add pointer drag handling for the SVG map.
- Convert screen-space drag deltas into SVG viewBox deltas.
- Update the SVG `viewBox` from `mapView`.
- Normalize horizontal offset after crossing whole world widths.
- Bound vertical movement to the selected policy.
- Preserve click-to-select and click-empty-to-clear behavior with a drag threshold.
- Keep feature activation behind the review flag until overlays are wrapped.

## Non-goals

- Do not enable world-wrap by default.
- Do not add wheel zoom, pinch zoom, inertia, or keyboard panning.
- Do not persist map position.
- Do not rebuild derived indices or overlay models during ordinary panning.
- Do not solve antimeridian path tearing yet.

## Affected Files

- `src/app.js`
- `src/state/map-view-state.js`
- `src/styles.css` for panning cursor and user-select affordances if needed
- `tests/map-view-state.spec.js`
- `tests/map-wrap.spec.js`
- Generated copies under `docs/assets/**` after `npm run build`

## Implementation Steps

1. Add pointerdown, pointermove, pointerup, pointercancel, and lostpointercapture handling.
2. Track a small movement threshold so ordinary region clicks do not become drags.
3. Convert drag delta using the current SVG client rect and `mapView.width` / `mapView.height`.
4. Update `mapView` through tested helper functions.
5. Apply the new viewBox in `requestAnimationFrame` to avoid excessive DOM writes.
6. Normalize horizontal `mapView.x` by `worldWidth` at stable points.
7. Ensure hover preview and tooltip state clear or update predictably while dragging.
8. Add E2E tests for repeated east and west panning with bounded internal coordinates.

## Acceptance Criteria

- With `?worldWrap=1`, dragging west or east moves past the original edge without a hard stop.
- Internal horizontal camera coordinates remain bounded after multiple world-width drags.
- Vertical panning cannot lose the map outside the viewport.
- A click without meaningful movement still selects a region.
- Clicking empty map space still clears selection.
- Hover and tooltip state do not get stuck after drag.
- With the flag off, default app behavior is unchanged.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Focused commands:

```powershell
npx playwright test tests/map-view-state.spec.js
npx playwright test tests/map-wrap.spec.js -g "panning"
```

## Manual Smoke Tests

- Open `/?worldWrap=1`.
- Drag continuously east and west for more than two map widths.
- Release the pointer over a region and confirm a later click still selects it.
- Drag slightly on a region and confirm the selection does not fire until movement stays below the click threshold.
- Move the pointer out of the map while dragging and confirm capture cleanup works.
- Open `/` without the flag and confirm no panning behavior is active if the phase keeps the flag off.

## Rollback Risks

- Pointer capture bugs can leave the app in a dragging state.
- Drag handling can break click-to-select if the threshold is too low or too high.
- Updating viewBox too often can make hover and overlays feel sluggish.
- Tooltip positioning may be stale if hover is not cleared or recalculated during drag.

## Progress

- [ ] Drag state model chosen.
- [ ] Screen-to-viewBox conversion implemented.
- [ ] Horizontal normalization integrated.
- [ ] Click versus drag behavior tested.
- [ ] Panning tests added behind flag.

## Decision Log

- Decision: Keep pan behavior flag-gated until overlay projection and antimeridian validation are complete.
- Decision: Use viewBox updates for the MVP because the app already uses SVG coordinates and clipped `.svgwrap` layout.

## Outcomes

Pending implementation.

