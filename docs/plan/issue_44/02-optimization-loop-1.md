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

- `npm run build` - passed; regenerated checked-in Pages output from `src/**`.
- `npm run verify` - passed; 7 Python/unit tests and generated-output verifier passed.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npx playwright test tests/language.spec.js -g "map pan|zoomed plain map pan"` - passed; 2 tests.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npx playwright test tests/map-wrap.spec.js -g "panning|pan"` - passed; 7 tests.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npm run test:e2e` - passed after tightening one class-token assertion; 63 tests.

## Manual smoke tests

- Plain visual frame-strip smoke: sampled start, drag, and after frames during zoomed pan showed continuous map movement with no blank frames or obvious whole-map flash.
- Heavy visual frame-strip smoke: repeated with China selected and reachable-capital/manual-envelope overlays present; sampled frames showed continuous movement with no blank frames or obvious whole-map flash.
- Real-time subjective smoothness remains host-dependent; sampled frame smoke and counters did not show obvious sluggishness or flicker after loop 1.

## Rollback risks

- Static grid bounds could fail to cover the visible viewport at some zoom/pan positions.
- Rect caching could become stale if the SVG resizes mid-drag.
- Debug timing must remain low overhead and gated behind `debugRenderStats`.

## Evidence

- Baseline: Phase 01 shows both scenarios rebuild grid and read SVG rect 150 times during 150 pointer moves.
- After: Plain zoomed pan recorded `panPointerMoveCount=150`, `panViewBoxApplyCount=150`, `gridRebuildsDuringPan=0`, `panSvgRectReads=1`, `visibleSvgNodeCount=839`, `panFrameMs avg=0.223ms`, `panFrameMs max=2.7ms`, `gridRenderMs count=0`.
- After: Heavy zoomed pan with China claims/reachable capitals recorded `panPointerMoveCount=150`, `panViewBoxApplyCount=150`, `gridRebuildsDuringPan=0`, `panSvgRectReads=1`, `visibleSvgNodeCount=1024`, `panFrameMs avg=0.210ms`, `panFrameMs max=3.1ms`, `gridRenderMs count=0`.
- Delta: Plain `gridRebuildsDuringPan` improved 150 -> 0 and `panSvgRectReads` improved 150 -> 1; `panFrameMs max` improved 4.8ms -> 2.7ms.
- Delta: Heavy `gridRebuildsDuringPan` improved 150 -> 0 and `panSvgRectReads` improved 150 -> 1; `panFrameMs max` improved 5.7ms -> 3.1ms.
- Interpretation: Loop 1 removed the measured repeated DOM replacement and layout-read work from zoomed pan frames. The sampled frame strips did not show full-map blanking or flash, so transform preview is not justified in this loop.
- Commit: Pending Phase 2 commit.
- Commit blocker: None known.

## Progress

- Added pan debug counters and timing for pointer moves, pan frames, map view application, grid rebuilds, SVG rect reads, and SVG node count.
- Changed grid rendering to use static map bounds and removed grid rendering from pan viewBox frames.
- Cached one SVG viewport rect when drag crosses the pan threshold.
- Suppressed hit-layer hover work on the pointer event that crosses the drag threshold, while preserving below-threshold click-hold hover behavior.
- Added Playwright coverage for plain zoomed pan and dynamic-layer zoomed pan counters.

## Decision log

- Loop 1 addresses measured grid DOM churn and repeated layout reads before attempting transform preview.
- Hit-layer pointer events now suppress hover once movement reaches the pan threshold, because the hit-layer handler can receive the threshold-crossing event before the SVG pan handler marks `dragging`.
- The pre-drag hover test now checks `is-panning` as a class token so `is-panning-ready` does not create a false failure.

## Outcomes / Retrospective

- Implemented and validated. Loop 1 directly improved both measured hot spots and did not require a second optimization loop before final audit.
