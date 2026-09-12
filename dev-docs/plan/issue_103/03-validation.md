# Phase 03: Regression and performance audit

## Goal

- Complete regression and performance audit.

## Scope

- Complete regression and performance audit.

## Non-goals

- No remote publishing or unrelated optimizations.

## Affected files

- tests/e2e/*, dev-docs/plan/issue_103/*

## Implementation steps

- Run complete suite; record identical-condition before/after and commit audit.

## Acceptance criteria

- Exercise drag/wheel, hover, pin/unpin, scenario change and world wrap; inspect screenshots. Measured improvement required for performance completion.

## Validation commands

- npm run test:e2e -- --workers=2; npm run lint:js; git diff --check.

## Manual smoke tests

- Exercise drag/wheel, hover, pin/unpin, scenario change and world wrap; inspect screenshots.

## Rollback risks

- Revert source and regenerate docs together; timings depend on the environment.

## Evidence

- Baseline: 463e594 browser sources; complete distributions and counters in MEASUREMENTS.md.
- After: Built source 47da157; 84 full-suite e2e tests and two additional headed interaction tests passed. Build/verify passed 85 JS and 54 Python unit tests; JS lint and diff whitespace checks passed.
- Delta: Drag P95 and drag/wheel maxima improve; no >50 ms samples in final run. Wheel P95 caveat and lack of reproduction of the historical >100 ms spike explicitly documented.
- Interpretation: Complete for implemented rendering and measurement scope, with bounded environment-specific evidence; no universal FPS/P95 claim.
- Commit: Final evidence/audit commit follows gate.
- Commit blocker: None.

## Progress

- Full regression and headed checks passed. Six headed screenshots inspected (wrap off/on × zoom 0/3/6), confirming four pins and marker readability after actual pans. Headed tests additionally cover wheel, restoration, unpin, and scenario transitions.

## Decision log

- User requested branch isolation: moved plan commit and dirty work to fix/issue-103-frame-performance, restored develop to 463e594, and committed all later work only on the feature branch.
- User authorized reporting via remote issue comments; publish concrete results there after final audit. No push, merge, or issue closure requested.
- Review questioned diagnostic unitless dashes versus production px notation; direct Chromium computed-style checks confirmed identical values (4px, 3px and 1px, 3px). No rerun needed; final-site measurements used shipped CSS without overrides.

## Outcomes / Retrospective

- Complete. No computation-cache follow-up is justified by these input counters. Historical >100 ms wheel reproduction and other-device performance remain explicit evidence limits, not claimed results.
