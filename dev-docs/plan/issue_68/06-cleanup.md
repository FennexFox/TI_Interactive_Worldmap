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
  - Earlier phase files still contained the full implementation audit placeholders, and durable architecture docs described only the pre-refactor `data`/`state`/`render` boundaries.
- After:
  - Updated `dev-docs/architecture.md` with the new `src/data/claim-model.js`, `src/interaction/**`, `src/runtime/**`, and `src/ui/**` ownership boundaries.
  - Ran cleanup scans:
    - no `appState` imports or direct app-state ownership found in `src/ui/**`, `src/interaction/**`, `src/render/**`, `src/data/claim-model.js`, or `src/runtime/**`;
    - no stale phase TODOs remain outside this phase before audit completion;
    - existing `src/app.js` TODO comments about future map-view pan/zoom support predate this work and are outside #68 cleanup scope.
  - `docs/audit.md` was referenced in working notes but does not exist in this repository; final audit is recorded in this phase file and `00-master-plan.md`.
  - Ran final `npm run build`; generated Pages output from current source.
- Delta:
  - `src/app.js` is 4,012 lines after all phases, down from roughly 4,990 at inventory.
  - Durable architecture docs updated by 47 lines.
- Interpretation:
  - Issue #68 is complete: `app.js` remains the composition/orchestration layer, while model logic, UI rendering/control wiring, interaction-local state, map controls, tooltip scheduling, and refresh step ordering are now separated into focused modules.
  - No follow-up blocker is known for #68 itself. Future feature work such as #49, recursive merge paths, multi-claim visualization, and savefile overlays can build on the new module boundaries.
- Validation:
  - `npm run build`: passed.
  - `npm run verify`: passed; generated outputs verified and 17 Python tests passed.
  - `npm run test:e2e`: passed, 85 tests.
- Manual smoke tests:
  - Not run as a separate interactive browser session.
  - Covered by final Playwright e2e tests for initial render, scenario switching, language switching, search/filter controls, country/region selection, clear selection, reachable capitals, capital hover overlays, pinned nodes, zoom/pan, and horizontal world-wrap.
- Generated artifacts:
  - Final `docs/**` output was refreshed through `npm run build`; generated diffs are summarized only.
- Commit: final phase-6 slice pending (`Document runtime architecture refactor audit`).
- Commit blocker: None known.

## Progress

- Completed.

## Decision log

- 2026-06-21: Record final audit in issue-local plan files because `docs/audit.md` does not exist in this repository.
- 2026-06-21: Do not remove pre-existing future pan/zoom TODO comments in `src/app.js`; they are unrelated to #68 cleanup and still document an unsolved future behavior.
- 2026-06-21: Treat Playwright coverage as the smoke-test evidence because it exercises all listed manual smoke categories in a reproducible local run.

## Outcomes / Retrospective

- Completed. Architecture docs, issue-local audit, generated output, and validation are current.
