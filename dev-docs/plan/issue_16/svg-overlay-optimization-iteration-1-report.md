# SVG Overlay Optimization Iteration 1 Report

## Summary

- Decision: kept.
- Optimization: wrapped claim fill and outline copies now reuse canonical claim overlay paths via SVG `<use>` nodes instead of duplicating path geometry for every world copy.
- Additional correctness fix: dynamic map-view control labels refresh during language changes, so the world-wrap warning title switches between Korean and English.
- Baseline CSV: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T04-11-32-836Z.summary.csv`
- After CSV: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T04-24-52-464Z.summary.csv`

## Changed Files

- `src/app.js`
- `docs/assets/app.js` rebuilt from source with `npm run build`
- `dev-docs/plan/issue_16/01-measured-optimization.md`
- `dev-docs/plan/issue_16/svg-overlay-optimization-iteration-1-report.md`
- `.chatgpt/result.md`

## Metric Comparison

All baseline and after rows completed with `setupOk=true`.

| Scenario | `panFrameMsMax` median | `panFrameMsAvg` median | `setupClaimOverlayPathCount` median | Decision signal |
| --- | ---: | ---: | ---: | --- |
| `wrap-off` | 2.800 -> 2.900 ms (+3.6%) | 0.483 -> 0.483 ms (+0.1%) | 68 -> 68 (+0.0%) | unchanged single-copy control |
| `wrap-off-disable-hatch` | 2.500 -> 2.650 ms (+6.0%) | 0.506 -> 0.481 ms (-4.9%) | 58 -> 58 (+0.0%) | unchanged single-copy diagnostic |
| `wrap-on` | 5.200 -> 5.200 ms (+0.0%) | 0.461 -> 0.414 ms (-10.0%) | 204 -> 88 (-56.9%) | primary keep signal |
| `wrap-on-disable-hatch` | 4.650 -> 5.400 ms (+16.1%) | 0.406 -> 0.438 ms (+7.8%) | 174 -> 58 (-66.7%) | diagnostic caveat |

`visibleSvgNodeCount` did not change because duplicated path nodes were replaced by `<use>` nodes, not removed from the DOM. The intended reduction is path geometry duplication, reflected in `setupClaimOverlayPathCount`.

## Validation

- `npm run build`: passed.
- `npm run verify`: passed.
- `npx playwright test tests/map-wrap.spec.js`: passed, 28 passing, 0 failing.
- `npm run test:e2e`: passed, 75 passing.
- Smoke script: passed after the language-refresh fix, confirming default wrap off, toggled wrap on, wrapped claim `<use>` copies, copied hover overlay, and Korean/English wrap warning titles.

## Process Notes

The long measurement run was monitored with child-process checks instead of passive waiting. During the after run, `node tools/measure_debug_render_stats.mjs`, `python -m http.server 4175 --directory docs`, and Chromium children remained alive; `ps` showed active renderer CPU while the expensive wrap-on rows were running.

## Follow-Up

The no-hatch diagnostic row regressed in median `panFrameMsMax`. Because this is a diagnostic query mode and the default wrapped+hatch path stayed flat while path geometry duplication dropped sharply, the change is kept. Future iterations should either remeasure this diagnostic row for variance or target remaining hatch/copy costs directly.
