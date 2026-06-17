# Phase 02: Runtime active-scenario lifecycle and state reconciliation

## Goal

- Replace the frontend's effective single-scenario globals with a controlled active-scenario runtime context and one scenario-switch lifecycle.

## Scope

- Normalize generated data through `src/data/active-data.js` so both legacy single-scenario payloads and the new bundle resolve cleanly.
- Rebuild derived indices when the active scenario changes.
- Reconcile selected, locked, hovered, pinned, incoming-claim, and project-filter state conservatively.
- Invalidate scenario-sensitive render/search/cache data.
- Rerender map layers, overlays, labels, panels, search options, and summaries from the active context.

## Non-goals

- Do not add the visible scenario selector in this phase except for test/debug hooks if necessary.
- Do not redesign panels, overlays, or map rendering.
- Do not implement scenario comparison.
- Do not preserve ambiguous selections across scenarios by guessing.

## Affected files

- `src/data/active-data.js`
- `src/data/derived-indices.js` only if a scenario-aware derived field is missing
- `src/state/app-state.js`
- `src/app.js`
- `tests/state-data-boundaries.spec.js`
- Possible targeted Playwright coverage if runtime hooks are testable without UI
- Rebuilt mirrors under `docs/assets/**` through `npm run build`

## Implementation steps

- Update `createAppData` to accept payloads containing `defaultScenario`, `scenarios`, legacy `regionMap`/`claimMap`, and catalogs.
- Expose supported scenario ids and a safe `getActiveData` fallback to default 2026.
- Convert scenario-sensitive `src/app.js` constants to a runtime context updated by `setActiveScenario(nextScenario)`.
- Implement conservative reconciliation:
  - clear hover and secondary hover;
  - clear focused/selected/pinned regions missing from the next region index;
  - clear selected/locked nation when missing from the next scenario;
  - clear incoming claim key when it does not resolve in the next scenario;
  - clear project filter when the project id is not available in the next project metadata;
  - preserve valid scenario-local ids only when the same id exists in the next scenario.
- Clear or namespace overlay, label, reachable-capital, manual-envelope, and search caches that depend on scenario data.
- Rerender active map colors, hit targets, labels, overlays, pinned markers, reachable capital candidates, search dropdowns, selected pills, warning pills, and nation info.
- Update state/data boundary tests to assert multi-scenario fallback and reconciliation helpers.

## Acceptance criteria

- One scenario transition function owns active scenario changes.
- `activeData` and `derivedIndices` are rebuilt together for every scenario switch.
- No scenario-sensitive frontend path reads stale 2026-only globals after switching.
- Invalid selected/locked/hovered/focused/pinned/incoming/filter state is cleared on switch.
- Valid scenario-local selected region/nation ids may be preserved only when present in the next scenario.
- Scenario-sensitive render caches are invalidated or scenario-qualified.
- Legacy single-scenario payload tests still pass.

## Validation commands

- `npm run test:e2e -- tests/state-data-boundaries.spec.js`
- `npm run build`
- `npm run verify`

## Manual smoke tests

- Use temporary console/debug hook or tests to switch scenarios before UI exists.
- Select a known 2026 nation/region, switch scenarios, and confirm invalid selections clear rather than rendering stale overlays.

## Rollback risks

- This phase touches central `src/app.js` runtime wiring. Revert must also revert generated `docs/assets/**` mirrors.
- Missed constants can create stale data leaks that only show after a switch; targeted tests should cover the highest-risk state boundaries.

## Evidence

- Normalized schema v2 scenario bundles and legacy single-scenario payloads in `src/data/active-data.js`.
- Added supported-scenario id exposure and default-scenario fallback behavior for runtime consumers.
- Added `reconcileScenarioState` to clear stale hover, focused/selected/pinned region, selected/locked nation, active incoming claim, and invalid project-filter state after a scenario change.
- Converted scenario-sensitive frontend data aliases in `src/app.js` from one-time constants to a rebuilt active runtime context.
- Added one owned `setActiveScenario` lifecycle that resolves the target scenario, rebuilds active data and derived indices, clears scenario-sensitive caches/render keys, rebuilds search/incoming-claim indices, reconciles state, and rerenders map/panel/search outputs.
- Added a temporary `window.__TI_SCENARIO_API__` hook for focused browser coverage before the visible selector phase.
- Added boundary tests for scenario bundle normalization, state reconciliation, and an app smoke test switching 2026 to 2070 and back without stale map/search state.
- Validation: `npm run build` passed.
- Validation: `npm run test:e2e -- tests/state-data-boundaries.spec.js` passed, 7 tests.
- Validation: `npm run verify` passed.
- Commit: phase commit will be created after this gate.
- Commit blocker: none.

## Progress

- Implemented and validated.

## Decision log

- Keep the lifecycle in `src/app.js` initially because most render callbacks are still local to that module; extract later only if it reduces immediate complexity.

## Outcomes / Retrospective

- Phase 2 is implemented. The switch lifecycle stays inside `src/app.js` for now because the render callbacks it coordinates are still local to that module; the UI phase can call the single lifecycle instead of duplicating scenario-switch behavior.
