# Phase 2: Measurement And Decision

## Goal

- Run label-focused A/B measurements and decide whether a user-visible label optimization is justified.

## Scope

- Extend `tools/measure_debug_render_stats.mjs` with labels-enabled and labels-disabled scenarios.
- Include `worldWrap=0`, `worldWrap=0` complex overlays, `worldWrap=1`, and practical `worldWrap=1` complex overlays.
- Record label rebuild behavior during pan, zoom, hover, wrap toggle, and language refresh where practical.
- Write a focused issue #62 result document.

## Non-goals

- Do not keep a permanent user-facing label optimization unless the evidence clearly supports it.
- Do not commit generated measurement CSVs.
- Do not modify forbidden generated outputs in the final diff.

## Affected files

- `tools/measure_debug_render_stats.mjs`
- `dev-docs/plan/issue_62/02-measurement-and-decision.md`
- `dev-docs/plan/issue_62/issue-62-label-rendering-profile-result.md`
- Possibly `.chatgpt/result.md`

## Implementation steps

1. Extend measurement scenarios with paired label-enabled/disabled rows.
2. Capture setup and pan stats for label counts, label copy groups, visible node count, and label render/replacement counters.
3. Run `npm run build` for local validation, then restore forbidden generated output.
4. Run the required measurement command.
5. Parse and summarize median A/B deltas.
6. Record whether labels rebuild during pan, zoom, hover, wrap toggle, and language refresh.
7. Decide whether this pass remains instrumentation-only or justifies a follow-up optimization.

## Acceptance criteria

- Fresh label-focused CSV path is recorded.
- Labels-enabled versus disabled rows are directly comparable.
- Evidence includes `panFrameMsMax`, `panFrameMsAvg`, `visibleSvgNodeCount`, `labelCount`, label copy/group counts, and label render/replacement counters.
- Rebuild behavior during pan, zoom, hover, wrap toggle, and language refresh is recorded or explicitly scoped as not practical.
- Result document gives a clear recommendation.

## Validation commands

- `npm run build`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`
- `npm run verify`
- `npx playwright test tests/map-wrap.spec.js`
- `npx playwright test tests/language.spec.js`
- `npm run test:e2e` if source behavior changes

## Manual smoke tests

- Debug label-disable URL.
- Existing label toggle.
- Wrap toggle with labels.
- Language refresh with labels.

## Rollback risks

- Measurement scenario count may increase runtime substantially.
- Timing may be noisy enough to support only an instrumentation outcome.
- Query debug-disable might be mistaken for a product decision if documentation is unclear.

## Evidence

- Baseline: the measurement script compared wrap/overlay scenarios but did not provide label-on versus labels-suppressed A/B rows or interaction-specific label rebuild counters.
- After: the script emits paired label scenarios for `worldWrap=0`, `worldWrap=0` complex overlays, `worldWrap=1`, and `worldWrap=1` complex overlays. It records label copy counts, wrapped label counts, label render/replacement counters, zoom counters, and interaction probes for hover, wrap toggle, and language refresh.
- Delta: full measurement produced 160 rows at `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T11-50-09-796Z.summary.csv`. Labels added 363 text nodes without wrap and 1089 text nodes with wrap; mean sampled pan cost rose by about 0.08-0.21 ms depending on scenario.
- Interpretation: labels are measurable steady-state SVG node weight, but not a rebuild hotspot in the measured interactions. The evidence does not justify a user-visible label optimization in this pass.

## Progress

- Completed.

## Decision log

- Kept the work instrumentation-only. The measured label cost is real but small in absolute pan-frame terms and does not identify labels as the primary bottleneck.
- Preserved generated measurement CSV output as an uncommitted local artifact only.

## Outcomes / Retrospective

- Result document: `dev-docs/plan/issue_62/issue-62-label-rendering-profile-result.md`.
- Validation:
  - `rtk npm run build` passed; generated `docs/assets/app.js` was restored because `docs/assets/**` is excluded from this task.
  - `rtk node --check tools/measure_debug_render_stats.mjs` passed.
  - `rtk npm run measure:render-stats -- --repeats=1 --zoom-steps=0 --summary-json` passed as a smoke run.
  - `rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6` passed.
  - `rtk npm run verify` passed.
  - `rtk npx playwright test tests/map-wrap.spec.js` passed.
  - `rtk npx playwright test tests/language.spec.js` passed.
  - `rtk npm run test:e2e` passed.
