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
- `src/data/claim-model.js` or related new data/model module
- `src/data/derived-indices.js` if shared capital helpers belong there
- `tests/state-data-boundaries.spec.js` or focused model tests
- `docs/assets/**` after `npm run build`

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

## Rollback risks

- Medium: Pure helpers currently close over language, filters, and cache keys. Mitigation: extract only pure parts first and pass translation/filter functions explicitly where needed.

## Evidence

- Baseline:
  - `src/app.js` owns claim sorting/filtering, overlay model construction, manual envelope model building, and reachable-capital candidate filtering.
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
