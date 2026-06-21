# Phase 05: Normalize runtime refresh orchestration

## Goal

- Normalize runtime refresh orchestration so data refresh, state refresh, map visual refresh, panel refresh, and scenario switching paths are explicit.

## Scope

- Review `setActiveScenario`, `renderActiveScenario`, `updateNationOverlay`, `applyFilters`, `populate`, and language refresh after earlier extractions.
- Reduce hidden side effects and make the app entrypoint primarily compose dependencies and call high-level refresh functions.
- Ensure future scenario switching can plug into data/state/render boundaries without another large rewrite.

## Non-goals

- Do not change scenario data format.
- Do not add a new scenario UI feature beyond preserving the current selector.
- Do not collapse extracted modules back into a broad orchestrator.

## Affected files

- `src/app.js`
- Extracted model/UI/interaction modules from prior phases
- Possibly `src/runtime/app-runtime.js` or `src/runtime/refresh-flow.js`
- `dev-docs/architecture.md`
- `docs/assets/**` after build

## Implementation steps

- Map current refresh paths and side effects.
- Introduce high-level orchestration helpers if they reduce `app.js` responsibility.
- Make scenario/language/filter refreshes call explicit model, panel, and map update steps.
- Update architecture docs if module boundaries materially changed.

## Acceptance criteria

- `src/app.js` is significantly smaller and primarily bootstrap/orchestration.
- Data/state/render/UI refresh paths are explicit.
- Scenario switching, language refresh, filters, panels, and map visuals remain synchronized.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e

## Manual smoke tests

- Switch scenario if selector has alternatives; switch language; change filters; select/clear nation; verify panels and map remain synchronized.

## Rollback risks

- Medium: Refresh normalization can accidentally reorder operations. Mitigation: preserve call ordering first, then simplify only with validation.

## Evidence

- Baseline:
  - `src/app.js` owns all refresh sequencing.
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
