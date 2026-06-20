# Issue 65 region hit-path profiling result

## Summary

Issue #65 is complete as profiling and instrumentation work. The final implementation adds debug render-stat counters that separate visual region paths, direct hit paths, hit `<use>` instances, canonical hit geometry definitions, copied world-wrap geometry, and path-data byte totals.

The guarded canonical hit-path candidate is intentionally not enabled by default. It proves duplicated hit geometry is measurable and reducible in wrapped mode, but the tested `<use>` strategy increased visible SVG node count and produced worse median pan timings in every measured scenario.

## Completed work

- Added hit geometry byte/count counters to `window.__TI_DEBUG_RENDER_STATS__`.
- Added measurement columns and CLI flags for canonical hit-path A/B runs:
  - `--include-canonical-hit-paths`
  - `--canonical-hit-paths-only`
- Added `debugUseCanonicalHitPaths=1`, gated behind `debugRenderStats=1`.
- Added canonical hit geometry `<defs>` plus interactive `<use class="region-hit">` nodes for the guarded candidate.
- Preserved region identity datasets on the interactive hit nodes so hover and click logic resolves canonical region state.
- Added Playwright coverage for guarded single-copy hover/click and wrapped seam hover/click.
- Rebuilt checked-in Pages assets from source.
- Cleaned `.gitignore` to keep one documented `.chatgpt/` ignore rule; `.chatgpt/REUSLT.md`, `.chatgpt/reuslt.md`, nested result files, and render-stat CSV/JSON outputs are ignored by that rule.

## Measurements

Baseline run:

- `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-20T02-19-00-121Z.summary.csv`
- Command: `rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`
- Rows: 160
- Setup-valid rows: 160

Candidate run:

- `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-20T01-50-21-942Z.summary.csv`
- Command: `rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --canonical-hit-paths-only`
- Rows: 160
- Setup-valid rows: 160

Single-copy median result:

- `hitPathCount`: 363 -> 0
- `hitUseCount`: 0 -> 363
- `hitGeometryDefPathCount`: 0 -> 363
- `totalHitGeometryDBytes`: unchanged at 1,070,982
- `totalRegionPathDBytes`: unchanged at 2,141,964
- `visibleSvgNodeCount`: +364

World-wrap median result:

- `hitPathCount`: 1,089 -> 0
- `hitUseCount`: 0 -> 1,089
- `hitGeometryDefPathCount`: 0 -> 363
- `worldCopyHitPathCount`: 726 -> 0
- `worldCopyHitUseCount`: 0 -> 726
- `totalHitGeometryDBytes`: 3,212,946 -> 1,070,982 (-66.7%)
- `totalRegionPathDBytes`: 6,425,892 -> 4,283,928 (-33.3%)
- `visibleSvgNodeCount`: +364

Timing result:

- Median `panFrameMsAvg` was worse in every candidate scenario.
- `wrap-on-labels`: 0.406 -> 0.5705
- `wrap-on-labels-disabled`: 0.338 -> 0.4915
- `wrap-on-complex-overlays-labels`: 0.396 -> 0.5565
- `wrap-on-complex-overlays-labels-disabled`: 0.327 -> 0.429

## Decision

Keep the candidate as a debug-only profiling control. Do not enable canonical hit paths by default in this issue.

The byte reduction in wrapped mode is real, but it comes with extra DOM nodes and worse pan timing in this measured implementation. The default direct hit-path renderer remains the safer runtime behavior.

## Validation

- `rtk node --check src/app.js`: passed.
- `rtk node --check src/render/map-layers.js`: passed.
- `rtk node --check tools/measure_debug_render_stats.mjs`: passed.
- `rtk npm run build`: passed.
- `rtk npm run verify`: passed.
- `rtk npx playwright test tests/map-wrap.spec.js`: passed, 35/35.
- `rtk npx playwright test tests/language.spec.js`: passed, 30/30.
- `rtk npm run test:e2e`: passed, 82/82.
- `rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`: passed.
- `rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --canonical-hit-paths-only`: passed.

Manual smoke tests were deferred because the automated suites cover the changed interaction surfaces: default hover/click, world-wrap seam hover/click, labels, claim overlays, pinned regions, language refresh, and the guarded canonical hit-path mode.

## Classification

Preparation / instrumentation only.

## Follow-up

Use the new counters for #60-scale renderer investigations. A follow-up optimization should target both duplicated path-data bytes and DOM node count; this exact `<use>` hit-path implementation should not be promoted without new evidence from a design that avoids the measured DOM/timing regression.
