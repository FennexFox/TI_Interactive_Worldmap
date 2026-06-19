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

- Baseline:
- After:
- Delta:
- Interpretation:

## Progress

- Pending Phase 1.

## Decision log

- Pending.

## Outcomes / Retrospective

- Pending.
