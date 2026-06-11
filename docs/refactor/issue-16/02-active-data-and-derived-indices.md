# Phase 2: Active Data And Derived Indices

## Goal

Move direct generated-data access behind an active data context and build lookup indices from that context.

The app should still use the current single `2026` dataset, but runtime code should no longer spread the assumption of one immutable global dataset across unrelated functions.

## Scope

- Introduce an `appData` object that wraps the current generated data.
- Introduce `appState.activeScenario` with default scenario `2026`.
- Add `getActiveData()` or an equivalent helper.
- Add `buildDerivedIndices(activeData)` or an equivalent helper.
- Move current derived data into the derived-index boundary:
  - regions list and summary references
  - `regionByName`
  - `nationRegions`
  - nation metadata merge
  - incoming claims by region
  - nation choices and region choices if practical in this phase
- Preserve existing behavior through compatibility variables only where needed to keep the phase small.

## Non-goals

- Do not add a scenario selector.
- Do not generate additional scenario bundles.
- Do not change JSON data contracts.
- Do not change claim semantics.
- Do not rewrite rendering or event handling yet.
- Do not split `src/app.js` into modules in this phase.

## Affected Files

- `src/app.js`
- `docs/assets/app.js` after `npm run build`
- `tests/language.spec.js` only if a behavior-preserving selector or timing change is required

## Implementation Steps

1. Wrap the data resolved from `window.TI_DATA_PROMISE`:

   ```js
   const defaultScenario = String(regionMap?.summary?.scenarioYear || '2026');
   const appData = {
     defaultScenario,
     scenarios: {
       [defaultScenario]: {
         regionMap,
         claimMap,
         catalogs,
       },
     },
   };
   ```

2. Add app state ownership:

   ```js
   const appState = {
     activeScenario: appData.defaultScenario,
     selectedNationId: '',
     selectedRegionId: '',
     hoveredRegionId: '',
     activeIncomingClaimKey: '',
     filters: {},
     mapView: {},
     mapVisualState: {},
   };
   ```

   Existing state variables can remain during this phase if migrating all callers would make the patch too large.

3. Add `getActiveData()` and use it for active `regionMap`, `claimMap`, and catalogs.
4. Add `buildDerivedIndices(activeData)` and move lookup construction into it.
5. Replace direct references to top-level derived globals with `indices` where the change is local and safe.
6. Keep current function names and UI behavior stable.
7. Run `npm run build` to update generated Pages assets.
8. Run validation and smoke tests.

## Acceptance Criteria

- The app has explicit active data ownership.
- Derived indices are built from active data in one place.
- The current `2026` dataset remains the only active scenario.
- Search, overlays, labels, hover, selection, and side-panel behavior are unchanged.
- No public data schema changes are introduced.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Load the generated site and confirm the map renders.
- Search for Canada, United States, China, Denver, Seoul, and Greater India.
- Select Brazil and confirm claim overlays and capital region panel content.
- Hover Amazonia and Ontario after selecting Brazil.
- Toggle language after selecting a nation and confirm panel/search text refreshes.
- Clear selection by clicking empty map space.

## Rollback Risks

Medium. Hidden dependencies on old top-level globals can break search, overlay calculation, or language refresh.

Rollback should revert this phase only and keep the baseline tests from phase 1.

## Progress

- [x] Active data wrapper added
- [x] App state object added
- [x] Derived-index builder added
- [x] Existing callers migrated where safe
- [x] Generated Pages assets rebuilt
- [x] Validation completed
- [x] Manual smoke completed

## Decision Log

- The initial active scenario is the existing generated scenario year, expected to be `2026`.
- This phase can keep compatibility aliases if removing every global would make the review too large.
- Scenario switching remains explicitly out of scope.
- 2026-06-11: Added `appData`, `appState`, `getActiveData()`, and `buildDerivedIndices(activeData)` in `src/app.js`.
- 2026-06-11: Kept `REGIONS`, `SUMMARY`, `CLAIMS_BY_NATION`, `PROJECT_META`, `CLAIM_STATS`, `NATION_META`, `regionByName`, `nationRegions`, `nationChoices`, `regionChoices`, and `incomingClaimsByRegion` as compatibility aliases backed by derived indices.
- 2026-06-11: Deferred migration of existing mutable UI variables into `appState` because doing so broadly belongs in later state/visual-state phases.
- 2026-06-11: Rebuilt generated Pages assets with `npm run build`.

## Outcomes

Completed on 2026-06-11.

### Completed Phase Summary

Phase 2 introduced explicit active data ownership around the current generated `2026` dataset and created a derived-index boundary for the runtime lookup structures. Current callers still use familiar local names, but those aliases now originate from `derivedIndices`.

The implementation added:

- `appData` with the current dataset wrapped under the generated scenario year.
- `appState.activeScenario` and placeholder state fields for later phases.
- `getActiveData()` for active scenario data lookup.
- `buildDerivedIndices(activeData)` for regions, summary, nation/project/claim metadata, region lookup, nation-region lookup, incoming-claim index storage, and search choice storage.
- derived-backed compatibility aliases to keep the patch reviewable and behavior-preserving.

### Changed Files

- `src/app.js`
- `docs/assets/app.js`
- `docs/refactor/issue-16/00-master-plan.md`
- `docs/refactor/issue-16/02-active-data-and-derived-indices.md`

`docs/assets/app.js` changed only because `npm run build` copies `src/app.js` into the generated Pages output.

### Test Results

- `npm run build`: passed.
- `npm run verify`: passed.
- `npm run test:e2e`: passed, 7 tests.
- Manual smoke coverage was exercised through a browser smoke script against `docs/`; it passed map render, search for Canada/United States/China/Denver/Seoul/Greater India, Brazil overlays, Amazonia/Ontario hover, selected-nation language refresh, and empty-map clear.

### Retrospective

Keeping compatibility aliases made this phase small enough to review independently while still establishing the important boundary. Later phases can migrate individual callers from aliases to explicit context where it reduces coupling.

### Remaining Risks

- `appState` is introduced but not yet the single owner of all mutable UI state. That is intentional for this phase and will be addressed by later state and visual-state phases.
- Derived indices are currently rebuilt only at startup because scenario switching is out of scope. Future scenario work must rebuild or replace `derivedIndices` when `appState.activeScenario` changes.
