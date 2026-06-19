# Phase 4: Baseline Overlay Profiling

## Goal

- Add enough measurement visibility to profile baseline single-copy complex SVG overlay cost without conflating the result with world-wrap copy amplification.

## Scope

- Extend debug render stats and/or `tools/measure_debug_render_stats.mjs` with layer-level SVG counters for baseline `worldWrap=0` complex overlays.
- Add or tune one explicit complex single-copy scenario that selects China, applies Greater Pan-Asia, pins extra nations/regions, keeps hostile hatching enabled, and exercises hover overlays.
- Run `npm run build` and a fresh measurement before any visual optimization candidate.
- Record the CSV path, setup validation, largest layer buckets, and timing summary.

## Non-goals

- Do not implement the visual optimization in this phase.
- Do not change hit paths, selection semantics, claim semantics, hatching meaning, labels, language behavior, or world-wrap behavior.
- Do not keep generated `docs/assets/**`, `docs/data/**`, `data/generated/**`, or generated measurement CSV files in commits.

## Affected files

- `src/app.js`
- `tools/measure_debug_render_stats.mjs`
- `dev-docs/plan/issue_16/04-baseline-overlay-profiling.md`

## Implementation steps

1. Inspect existing debug counters and measurement setup stats.
2. Add practical layer-level counters for claim fill paths/uses, claim outline paths/uses, hatch groups/clip paths, hover overlay paths, labels, hit paths, selection outlines, pinned markers, and rebuild counters.
3. Add an explicit `wrap-off-complex-overlays` measurement scenario or equivalent.
4. Rebuild local Pages assets for measurement.
5. Run `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`.
6. Parse the CSV and record baseline timing/counter evidence.

## Acceptance criteria

- Fresh `worldWrap=0` complex overlay baseline CSV path is recorded.
- Measurement output includes enough layer-level counters to identify major SVG overlay contributors.
- `setupOk=true` and `setupFailures` empty for rows used as evidence.
- Generated Pages asset changes are not kept in the final diff.

## Validation commands

- `npm run build`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`
- Later run-wide validation: `npm run verify`, `npx playwright test tests/map-wrap.spec.js`, `npm run test:e2e`.

## Manual smoke tests

- Deferred to final run-wide smoke after any kept candidate.

## Rollback risks

- Instrumentation could accidentally change runtime behavior or slow normal non-debug rendering.
- Scenario setup could fail silently and produce misleading counters.
- Generated Pages assets could be accidentally committed.

## Evidence

- Baseline: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T09-46-24-773Z.summary.csv` from `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`.
- Baseline setup: 100 rows, all `setupOk=true`, all `setupFailures` empty.
- Baseline `wrap-off-complex-overlays`: median `panFrameMsMax=3.750 ms`, median `panFrameMsAvg=0.536 ms`, max `panFrameMsMax=5.200 ms`, median `visibleSvgNodeCount=1315`.
- Baseline single-copy layer counts for `wrap-off-complex-overlays`: `hitPathCount=363`, `labelCount=363`, `claimOverlayPathCount=63`, `claimOverlayUseCount=5`, `claimFillPathCount=2`, `claimOutlinePathCount=56`, `claimHatchGroupCount=5`, `claimHatchPathCount=5`, `claimClipPathCount=5`, `claimLabelCount=1`, `setupForeignHoverOverlayPathCount=3`, `totalClipPathCount=5`.
- Baseline comparison rows: plain `wrap-off` median `panFrameMsMax=2.750 ms`, median `panFrameMsAvg=0.433 ms`, `visibleSvgNodeCount=952`; `wrap-off-disable-hatch` median `panFrameMsMax=2.200 ms`, median `panFrameMsAvg=0.406 ms`, `visibleSvgNodeCount=927`.
- After: Not applicable in this phase.
- Delta: `wrap-off-complex-overlays` adds 363 label nodes over plain `wrap-off` and raises median `panFrameMsMax` by about `1.000 ms`; hostile hatch removal lowers single-copy node count by 25 and median `panFrameMsMax` by about `0.550 ms`.
- Interpretation: The complex single-copy measurement is now useful and valid. The largest baseline contributors are required hit paths and optional visible labels; the largest claim visual bucket is 56 semantic per-region outline paths. Hover overlays are already small/grouped in this scenario.

## Progress

- Completed instrumentation and fresh baseline measurement.

## Decision log

- Added debug/sample counters for claim fill/outline paths and uses, hatch groups/paths/clip paths, claim labels, hit paths, labels, hover overlays, selection outlines, manual envelope overlays, pinned markers, total clip paths, and overlay replacement counters.
- Added `wrap-off-complex-overlays` scenario that enables labels and primes hover overlays while keeping `worldWrap=0`.
- Kept the measurement CSV as ignored local evidence only; do not commit generated measurement output.

## Outcomes / Retrospective

- Phase complete. The data points away from a low-risk baseline compound visual optimization: labels and hit paths dominate node count, while the main claim visual candidate is already constrained by per-region semantic outline expectations in tests.
