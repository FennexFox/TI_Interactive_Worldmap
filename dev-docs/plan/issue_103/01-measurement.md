# Phase 01: Reproducible frame measurement

## Goal

- Actual-input RAF baseline and repeatable counters.

## Scope

- Actual-input RAF baseline and repeatable counters.

## Non-goals

- No production styles or browser behavior changes.

## Affected files

- tools/measure_interaction_frames.mjs, tools/frame-intervals.mjs, tests/unit/frame-intervals.test.js

## Implementation steps

- Add bounded observer, statistics tests, four-capital/no-selection runs, pooled summaries and metadata.

## Acceptance criteria

- Four pins, changed viewBox, nonempty samples and zero envelope rebuilds. Measured improvement required for performance completion.

## Validation commands

- node --test tests/unit/frame-intervals.test.js; npm run lint:js; frame tool three repetitions.

## Manual smoke tests

- Four pins, changed viewBox, nonempty samples and zero envelope rebuilds.

## Rollback risks

- Revert source and regenerate docs together; timings depend on the environment.

## Evidence

- Baseline: Pending phase evidence
- After: Pending phase evidence
- Delta: Pending phase evidence
- Interpretation: Pending phase evidence
- Commit: Pending phase evidence
- Commit blocker: Pending phase evidence

## Progress

- Planned; awaiting gate.

## Decision log

- Preserve semantics and isolate phase commits.

## Outcomes / Retrospective

- Pending execution.
