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

- Planned; source investigation and baseline are pending.

## Decision log

- User authorized remaining candidates; prior scope deferrals are superseded. Keep candidate measurements and commits separate.

## Outcomes / Retrospective

- Pending execution and validation; no performance claim yet.
