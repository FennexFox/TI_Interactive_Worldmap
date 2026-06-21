# Phase 02: Extract pure data and model helpers

## Goal

- Extract pure data/model helpers from `src/app.js` so claim, overlay, manual-envelope, and reachable-capital logic can be tested without DOM ownership.

## Scope

- Move behavior-preserving pure helpers to `src/data/claim-model.js` or smaller sibling modules.
- Cover candidate extraction, cumulative claim entries, visible claim regions, manual envelope contribution ordering, and reachable-capital candidate filtering where feasible.
- Keep `src/app.js` responsible for composing active UI state, DOM rendering, labels, and callbacks.

## Non-goals

- Do not implement route-aware projected-state behavior from #49.
- Do not alter generated claim data schemas.
- Do not move DOM fragment creation or panel rendering in this phase.

## Affected files

- `src/app.js`
- `src/data/claim-model.js`
- `src/data/derived-indices.js` if shared capital helpers belong there
- `tests/state-data-boundaries.spec.js` or focused model tests
- `docs/assets/**` after `npm run build`
- `package.json`
- `tools/verify_generated_outputs.py`

## Implementation steps

- Identify pure helpers with no DOM dependency or injectable dependencies.
- Create model module exports with explicit arguments.
- Replace `src/app.js` local helper bodies with imports/calls.
- Add unit tests for representative claim/reachable-capital behavior.
- Run focused syntax/unit verification, then standard build/verify/e2e.

## Acceptance criteria

- Extracted helpers do not import `appState`, DOM elements, or render modules.
- Existing reachable capital, manual envelope, incoming/outgoing claim, and overlay model behavior remains unchanged.
- Unit tests cover extracted model decisions.
- `src/app.js` has fewer model responsibilities.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e

## Manual smoke tests

- After source changes: initial render, select China and reachable capital candidate, select France then Moskva recursive envelope case, hover formable capital case.
- Covered by `npm run test:e2e` rather than a separate manual browser session.

## Rollback risks

- Medium: Pure helpers currently close over language, filters, and cache keys. Mitigation: extract only pure parts first and pass translation/filter functions explicitly where needed.

## Evidence

- Baseline:
  - `src/app.js` owns claim sorting/filtering, overlay model construction, manual envelope model building, and reachable-capital candidate filtering.
- After:
  - Added `src/data/claim-model.js` as an injected model factory with no DOM, app-state import, or render-module dependency.
  - Moved project sorting, claim-kind filtering, cumulative claim entries, incoming-claim index/model assembly, overlay model assembly, manual-envelope data assembly, and reachable-capital candidate filtering out of `src/app.js`.
  - Kept app-specific wrappers in `src/app.js` for debug counters, caches, DOM labels, panel/marker rendering, and current-state composition.
  - Added focused model tests in `tests/state-data-boundaries.spec.js`.
  - Ran `npm run build`; generated `docs/assets/app.js` and `docs/assets/data/claim-model.js` from source.
  - Updated `npm run verify` and `tools/verify_generated_outputs.py` to include the new generated module asset.
- Delta:
  - `src/app.js` reduced from about 4,990 lines to 4,623 lines.
  - New `src/data/claim-model.js` is 565 lines of extracted model logic.
  - Playwright suite count increased from 82/84 prior tests to 84 total e2e tests after adding two model tests.
- Interpretation:
  - The data/model boundary is now explicit and unit-testable while preserving current behavior for overlay, reachable-capital, and manual-envelope flows.
  - `src/app.js` still owns UI rendering and interaction orchestration; that is intentional for later phases.
- Validation:
  - `node --check src/app.js`: passed.
  - `node --check src/data/claim-model.js`: passed.
  - `npx playwright test tests/state-data-boundaries.spec.js`: passed, 9 tests.
  - `npm run build`: passed; wrote `docs/index.html` and generated assets.
  - `npm run verify`: passed after adding the new module to the verify script; generated outputs verified and 17 Python tests passed.
  - `npm run test:e2e`: passed, 84 tests.
- Manual smoke tests:
  - Not run separately in an interactive browser.
  - Covered by e2e tests for language/static UI, scenario switching, country/region selection, reachable capital activation, manual recursive envelopes, formable capital hover, map pan/zoom/world-wrap, search/filter behavior, and overlay churn counters.
- Generated artifacts:
  - `docs/assets/app.js` and `docs/assets/data/claim-model.js` changed through `npm run build`.
- Commit: this phase-sized implementation commit (`Extract claim model helpers`).
- Commit blocker: None known.

## Progress

- Completed.

## Decision log

- No decisions recorded yet.
- 2026-06-21: Use an injected `createClaimModel()` factory instead of module-level app imports so extracted model helpers can be tested without DOM or app state.
- 2026-06-21: Keep cache keys, rendered labels, and DOM fragment creation in `src/app.js` until UI/render phases.
- 2026-06-21: Extend hardcoded generated-output verification to include the new copied `docs/assets/data/claim-model.js` module.

## Outcomes / Retrospective

- Phase 02 complete. Pure claim/reachable-capital/manual-envelope model logic has been extracted and validated.
