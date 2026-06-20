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

- Baseline: pending measurement.
- After: no source optimization in this phase.
- Delta: pending measurement.
- Interpretation: pending measurement.

## Progress

- Not started.

## Decision log

- Candidate must be skipped if instrumentation shows little or no duplicated hit-path geometry to reduce.

## Outcomes / Retrospective

- Not completed yet.
