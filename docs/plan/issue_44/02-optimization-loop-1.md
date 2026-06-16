# Phase 02: Optimization loop 1

## Goal

- Remove measured pan hot-path work that does not need to happen on every pointermove and make pan behavior directly measurable in checked-in debug stats.

## Scope

- Add pan-specific counters and timing to debug render stats.
- Stop rebuilding the grid DOM during ordinary pan frames.
- Cache the SVG viewport rect once per drag so pointermove pan deltas avoid repeated layout reads.
- Add regression coverage for plain and heavy pan scenarios.

## Non-goals

- Do not implement transform-based pan preview in this loop.
- Do not implement viewport culling or large renderer rewrites.
- Do not change claim, reachable-capital, hover, selection, or secondary-capital semantics.

## Affected files

- `src/app.js`
- `src/render/map-layers.js`
- `tests/language.spec.js`
- `tests/map-wrap.spec.js`
- `docs/plan/issue_44/02-optimization-loop-1.md`
- Generated Pages output only through `npm run build`.

## Implementation steps

- Extend `createDebugRenderStats()` with pan counters/timing such as `panPointerMoveCount`, `panFrameMsCount`, `panFrameMsTotal`, `panFrameMsMax`, `mapViewApplyMsTotal`, `panViewBoxApplyCount`, `gridRebuildsDuringPan`, `gridRenderMsTotal`, `panSvgRectReads`, and `visibleSvgNodeCount`.
- Change grid rendering so grid paths cover the map bounds and do not depend on the current pan viewBox.
- Remove `renderGrid({mapView})` from `applyMapViewToSvg()` so pan frames only apply the viewBox and invalidate tooltip layout.
- Cache the SVG rect when a drag crosses the pan threshold and reuse it for `viewDeltaFromPointerDelta()`.
- Add Playwright assertions that pan moves the viewBox while grid rebuilds during pan stay at zero and SVG rect reads stay bounded to one per drag.

## Acceptance criteria

- Plain pan: `gridRebuildsDuringPan=0`, `panSvgRectReads<=1`, and `panViewBoxApplyCount>0`.
- Heavy pan: existing hover/overlay/marker churn remains zero during drag, `gridRebuildsDuringPan=0`, `panSvgRectReads<=1`, and `panViewBoxApplyCount>0`.
- Map viewBox changes during pan in both single-copy and wrapped-map tests.
- Grid remains visible after zoom and pan.
- Tests preserve existing hover and reachable-capital behavior after drag.

## Validation commands

- `npm run build`
- `npm run verify`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npx playwright test tests/language.spec.js -g "map pan"`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npx playwright test tests/map-wrap.spec.js -g "panning|pan"`

## Manual smoke tests

- Zoom plain map to a detailed regional view and pan continuously for several seconds; observe whether the drag tracks promptly and whether any full-map flicker is visible.
- Repeat after selecting China and pinning reachable-capital candidates so claims, capital markers, and manual-envelope overlays are present.

## Rollback risks

- Static grid bounds could fail to cover the visible viewport at some zoom/pan positions.
- Rect caching could become stale if the SVG resizes mid-drag.
- Debug timing must remain low overhead and gated behind `debugRenderStats`.

## Evidence

- Baseline: Phase 01 shows both scenarios rebuild grid and read SVG rect 150 times during 150 pointer moves.
- After: Pending implementation.
- Delta: Pending implementation.
- Interpretation: Pending implementation.
- Commit: Pending Phase 2 commit.
- Commit blocker: None known.

## Progress

- Pending source implementation after Phase 1 commit.

## Decision log

- Loop 1 addresses measured grid DOM churn and repeated layout reads before attempting transform preview.

## Outcomes / Retrospective

- Pending Phase 2 implementation and validation.
