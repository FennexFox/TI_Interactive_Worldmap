# Phase 01: Inventory and boundaries

## Goal

- Document the current `src/app.js` responsibilities, first extraction boundaries, and validation expectations before source edits.

## Scope

- Read issue #68, current repo instructions, Graphify navigation output, architecture docs, and focused `src/app.js` symbol inventory.
- Capture the current ownership map and first-pass module plan.
- Keep this phase documentation-only.

## Non-goals

- Do not edit source modules or generated Pages output in this phase.
- Do not decide feature behavior for #49 or later recursive route-aware work.

## Affected files

- `dev-docs/plan/issue_68/00-master-plan.md`
- `dev-docs/plan/issue_68/01-inventory.md`
- Phase plan files under `dev-docs/plan/issue_68/`

## Implementation steps

- Confirm current branch and worktree cleanliness.
- Read issue #68 and relevant docs/instructions.
- Use Graphify/Serena/source search to inventory `src/app.js` responsibilities.
- Define reviewable extraction phases and stop conditions.
- Run plan validation and a lightweight repository verification command.

## Acceptance criteria

- The plan names concrete module boundaries and affected files.
- The plan includes generated-file policy, validation, smoke tests, and stop conditions.
- No source or generated deployment files change in this phase.
- `phase_plan_helper.py validate` and `phase_plan_helper.py gate` pass.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e

## Manual smoke tests

- Not run separately in a browser for documentation-only phase.
- Final smoke set remains: initial render, country/region selection, clear selection, search/filter controls, reachable capitals, capital hover overlay, zoom/pan/world-wrap, language switch.

## Rollback risks

- Low: plan docs may become stale if implementation discovers better boundaries. Mitigation: update the active phase plan and decision log before editing beyond scope.

## Evidence

- Baseline:
  - Current branch started on clean `develop`; implementation branch `issue_68` was created.
  - `src/app.js` symbol inventory shows about 4,990 lines and broad ownership of runtime bootstrap, DOM wiring, i18n, scenario switching, state adapters, search, panels, map view controls, hover/selection, overlay models, reachable capitals, and rendering orchestration.
  - Existing modules: `src/data/active-data.js`, `src/data/derived-indices.js`, `src/state/app-state.js`, `src/state/map-view-state.js`, `src/state/map-visual-state.js`, and `src/render/map-layers.js`.
- After:
  - Phased plan created for inventory, model extraction, UI extraction, interaction extraction, refresh orchestration, and cleanup/validation.
  - `phase_plan_helper.py validate --plan-dir dev-docs/plan/issue_68`: passed.
  - `phase_plan_helper.py gate --plan-dir dev-docs/plan/issue_68`: passed with expected TODO warnings for future-phase evidence fields.
  - `npm run verify`: passed; generated outputs verified and 17 Python tests passed.
- Delta:
  - No source behavior changes.
- Interpretation:
  - #68 requires phased source extraction; a single broad edit would be too risky for hover/selection/panel/render behavior.
- Commit: this phase-sized planning commit (`Plan runtime architecture refactor`).
- Commit blocker: None known.

## Progress

- Completed.

## Decision log

- 2026-06-21: Use `dev-docs/plan/issue_68/` as the active plan source of truth.
- 2026-06-21: Keep app behavior unchanged; dependency injection is acceptable even if early extracted modules receive larger context objects.

## Outcomes / Retrospective

- Phase 01 complete. The source extraction phases can proceed under the gated plan.
