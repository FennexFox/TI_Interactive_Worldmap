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

- Baseline: Unchanged browser source 463e594; three repeats recorded in MEASUREMENTS.md, four pins and 112 paths reproduced.
- After: Shared opt-in collector integrated into existing render-stat tool and new actual-input runner. Six unit tests and JS lint pass; WSL build/verify passed (82 JS + 54 Python tests at that time). Existing-tool smoke run passed with five pan and six zoom post-update samples.
- Delta: Adds full-input and post-update RAF distributions, preserving model/rebuild counters; no production rendering change.
- Interpretation: Instrumentation only. Baseline selected drag P95 35.28 ms/max 83.6 ms; wheel P95 33.01 ms/max 75.9 ms (full windows). Both model/rebuild counters remain zero.
- Commit: Phase-sized tooling commit follows gate.
- Commit blocker: None.

## Progress

- Implemented and baseline measured. Existing-tool smoke run checks shared collector integration.

## Decision log

- Preserve semantics and isolate phase commits.

## Outcomes / Retrospective

- Instrumentation only; rendering comparison remains phase 2.
