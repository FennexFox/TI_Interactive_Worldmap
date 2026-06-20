# Phase 03: Baseline measurements and decision

## Goal

- Run expanded baseline measurements and decide whether a canonical hit-path candidate is justified.

## Scope

- Use the measurement suite to cover default single-copy, complex single-copy, world-wrap, and complex world-wrap scenarios.
- Summarize relevant medians and counters.
- Decide whether to proceed to Phase 4.

## Non-goals

- Do not keep any source optimization in this phase.
- Do not commit generated measurement CSVs.
- Do not overstate noisy timing deltas.

## Affected files

- `dev-docs/plan/issue_65/03-measurement.md`
- Possibly `dev-docs/plan/issue_65/issue-65-region-hit-path-profile-result.md`

## Implementation steps

1. Run `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`.
2. Verify setup rows have `setupOk=true` and empty `setupFailures`.
3. Summarize base/hit path/use counts, copied path counts, path-data bytes, visible SVG nodes, and pan timings.
4. Decide whether hit-path duplication is meaningful enough to test a guarded candidate.

## Acceptance criteria

- Measurement CSV path is recorded.
- Required scenarios are present.
- Evidence separates node count from duplicated path-data bytes.
- Decision to proceed or stop is evidence-backed.

## Validation commands

- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`

## Manual smoke tests

- Not required for measurement-only work unless setup validation fails.

## Rollback risks

- Timing data can be noisy; base candidate decision on structural counters plus scenario medians.

## Evidence

- Baseline: full measurement CSV `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-20T02-19-00-121Z.summary.csv` contains 160 rows across the eight existing label-enabled/disabled single-copy, complex single-copy, world-wrap, and complex world-wrap scenarios. All rows have `setupOk=true` and empty `setupFailures`.
- After: no source optimization in this phase.
- Delta: median single-copy rows have `baseRegionPathCount=363`, `hitPathCount=363`, `baseRegionPathDBytes=1070982`, and `hitPathDBytes=1070982`. Median world-wrap rows have `baseRegionPathCount=1089`, `hitPathCount=1089`, `worldCopyBasePathCount=726`, `worldCopyHitPathCount=726`, `baseRegionPathDBytes=3212946`, and `hitPathDBytes=3212946`.
- Interpretation: hit paths duplicate the same path-data volume as base visual region paths. The duplicated hit geometry is meaningful enough to proceed to Phase 4 with a guarded canonical hit-path candidate. Timing remains noisy and is not yet evidence of improvement because no candidate has been measured.

## Progress

- Completed.

## Decision log

- Candidate must be skipped if instrumentation shows little or no duplicated hit-path geometry to reduce.
- Phase 3 found meaningful duplicated hit-path geometry, so proceed to a guarded `debugUseCanonicalHitPaths=1` experiment in Phase 4.
- Treat the candidate as an A/B profiling control first; do not make it default unless interaction tests and before/after evidence support doing so.

## Outcomes / Retrospective

- Validation:
  - `rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6` passed and wrote `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-20T02-19-00-121Z.summary.csv`.
- Manual smoke tests: not run for this measurement-only phase.
- Notes:
  - Two earlier full-run attempts were interrupted while validating instrumentation overhead and runtime expectations; a smaller smoke run passed and wrote `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-20T00-51-46-685Z.summary.csv`.
  - The successful full run took substantially longer than focused tests, so future full A/B candidate runs should allow enough time.
