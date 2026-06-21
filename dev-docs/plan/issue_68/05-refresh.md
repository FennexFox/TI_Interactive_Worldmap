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
  - Added `src/runtime/refresh-flow.js` with explicit ordered step lists for active-scenario refresh and language refresh.
  - Updated `renderActiveScenario()` and `refreshLanguage()` to run named refresh actions through `runRefreshSteps(...)`, preserving the existing operation order.
  - Updated `tools/build_pages.py` to copy `src/runtime/**` to `docs/assets/runtime/**`.
  - Updated `npm run verify` and `tools/verify_generated_outputs.py` to syntax-check/require `docs/assets/runtime/refresh-flow.js`.
  - Ran `npm run build`; generated `docs/assets/app.js` and `docs/assets/runtime/refresh-flow.js`.
- Delta:
  - `src/app.js` is 4,012 lines after the refresh-flow extraction.
  - Runtime orchestration extracted in this phase: 46 lines in `src/runtime/refresh-flow.js`.
- Interpretation:
  - The scenario and language refresh paths are now inspectable as ordered named steps instead of implicit local call sequences.
  - `src/app.js` still supplies concrete app-specific callbacks, so data/state/render/UI ownership remains explicit and behavior order is preserved.
  - Phase 05 is complete.
- Validation:
  - `node --check src/app.js`: passed.
  - `node --check src/runtime/refresh-flow.js`: passed.
  - Focused scenario/language/filter/search/selection/claim-control/reachable/pinned e2e grep: passed, 44 tests.
  - `npm run build`: passed; wrote generated assets.
  - `npm run verify`: passed; generated outputs verified and 17 Python tests passed.
  - `npm run test:e2e`: passed, 85 tests.
- Generated artifacts:
  - `docs/assets/app.js` and `docs/assets/runtime/refresh-flow.js` changed through `npm run build`.
- Commit: phase-5 slice pending (`Extract runtime refresh flow steps`).
- Commit blocker: None known.

## Progress

- Completed.

## Decision log

- 2026-06-21: Use explicit named step arrays rather than moving all refresh callbacks into a broad runtime object. This keeps ownership in `src/app.js` while making refresh order reviewable.
- 2026-06-21: Preserve operation order exactly for scenario and language refresh to avoid subtle panel/map synchronization changes.

## Outcomes / Retrospective

- Completed. Scenario and language refresh paths are explicit ordered flows and remain covered by focused and full e2e validation.
