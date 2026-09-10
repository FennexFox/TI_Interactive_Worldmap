# Remaining candidate integration

## Goal

- Complete the authorized remaining performance work while preserving behavior.

## Scope

- Remaining candidate integration as described in HANDOUT.md and the current source.

## Non-goals

- Changes to search meaning, geometry simplification, game data extraction, deployment or unbounded caches.

## Affected files

- dev-docs/plan/performance-refactor, regression tests, rebuilt affected browser assets and PR #101. Browser output is regenerated through the WSL build.

## Implementation steps

- Run full browser suite and generated consistency check; record per-candidate measurements and validation; commit and push all changes and update PR.
- Measure baseline before source changes, validate implementation, record evidence and commit this phase.

## Acceptance criteria

- Candidates 3–5 have evidenced outcomes, all required checks pass, PR describes full final scope.

## Validation commands

- `rtk proxy ./scripts/build-wsl.sh --skip-install`
- `rtk proxy env PATH="$PWD/.venv-wsl/bin:$PATH" npm run lint`
- Applicable focused `rtk npm run test:e2e` tests; final phase runs full suite with `--workers=2`.
- `rtk git diff --check`; final integration also runs `rtk npm run check:generated` after commits.

## Manual smoke tests

- Automate browser interactions for affected behavior and inspect DOM/viewBox outcomes; report human visual checks as not performed if unavailable.

## Rollback risks

- Timing is environment dependent; record gaps explicitly.

## Progress

- Completed candidates3–5 in commits18bbb03, ffb1fdb and9284cd1. Source and rebuilt assets pushed to perf_refactor; PR #101 updated to describe all five candidates.
- Final source WSL build and verify passed78 JavaScript +53 Python tests. Full lint passed. Full Playwright suite passed82/82 (1.1m); generated consistency check passed. Final documentation diff and strict phase-plan validation complete the handoff.

## Decision log

- User authorized remaining candidates; prior scope deferrals are superseded. Candidate measurements and commits stayed separate.
- Reused final source build from phase9; subsequent changes were tests and documentation. Final verify/lint/full browser tests cover the completed source. PR updated through REST because gh pr edit previously failed on the deprecated classic-project GraphQL field.

## Outcomes / Retrospective

- All five candidates are implemented, measured and covered by regression checks. Candidate3 preserves all24 query/limit signatures; wheel burst viewBox writes40→1 and bounded debug-off trace Layout40→1 with unchanged final viewBox; identical selection construction1→0 and wrap construction2→1 with matching paths/labels. Details and limits are in MEASUREMENTS.md.
- Validation logs: /tmp/ti-selection-build.log, /tmp/ti-final-verify.log, /tmp/ti-final-lint.log, /tmp/ti-final-e2e.log. Focused suites also passed; their initial failures and fixes are recorded in each phase. No human visual review or real-device input latency study was performed. No deployment.
- Browser module9 generated artifacts are rebuilt output, not hand edits. Existing branch HANDOUT/AGENTS commits are preserved. PR remains open against develop.
