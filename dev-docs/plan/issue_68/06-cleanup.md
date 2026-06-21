# Phase 06: Cleanup documentation and validation

## Goal

- Remove dead helpers, update durable architecture docs, rebuild generated Pages output, and complete final validation/audit.

## Scope

- Remove unused local helpers after all extractions.
- Update `dev-docs/architecture.md` and any durable workflow docs affected by new module boundaries.
- Run `npm run build`, `npm run verify`, and `npm run test:e2e`.
- Perform manual smoke tests or record why any could not be run.

## Non-goals

- Do not refactor unrelated code discovered during cleanup.
- Do not hand-edit generated output.
- Do not close follow-up feature issues by implication.

## Affected files

- `src/app.js`
- Extracted source modules
- `dev-docs/architecture.md`
- `docs/**` from `npm run build`
- `dev-docs/plan/issue_68/**`

## Implementation steps

- Search for dead helpers and unused imports.
- Run syntax checks and full validation.
- Rebuild Pages output through `npm run build`.
- Inspect source diff and summarize generated changes at a high level.
- Complete final audit checklist and completion classification.

## Acceptance criteria

- No known dead helpers or unused imports remain.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass or failures are documented with root cause.
- Durable docs reflect new module boundaries.
- Final audit proves each #68 requirement or classifies remaining work honestly.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e

## Manual smoke tests

- Initial map render; country select; region select; clear selection; search/filter controls; reachable capitals; capital hover overlay; zoom/pan/world-wrap; language switch.

## Rollback risks

- Low-medium: Cleanup may accidentally broaden scope. Mitigation: keep cleanup limited to extraction leftovers and docs required by #68.

## Evidence

- Baseline:
  - TODO
- After:
  - TODO
- Delta:
  - TODO
- Interpretation:
  - TODO
- Commit: TODO
- Commit blocker: TODO

## Progress

- Not started.

## Decision log

- No decisions recorded yet.

## Outcomes / Retrospective

- Not completed yet.
