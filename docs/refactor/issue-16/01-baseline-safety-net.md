# Phase 1: Baseline Safety Net

## Goal

Strengthen regression coverage before changing the map architecture.

This phase should make the current behavior easier to protect while later phases move data access, rendering, event handling, and overlay state behind clearer boundaries.

## Scope

- Add or adjust Playwright tests for current user-facing map behavior.
- Cover the interaction paths most likely to regress in issue #16:
  - map renders from `docs/`
  - language switching updates static and dynamic copy
  - nation, region, and project search remain distinct
  - region hover updates tooltip, hover pill, hover overlays, and capital markers
  - region click updates selected-region state and selection overlays
  - nation selection renders claim overlays and side-panel sections
  - claim display mode, claim type, and project controls update overlays
  - incoming and outgoing claim card interactions keep map and panel state synchronized
  - empty map click clears selection
- Keep existing Python builder tests unchanged unless they are already failing.

## Non-goals

- Do not edit app architecture.
- Do not change user-facing behavior.
- Do not change generated data semantics.
- Do not redesign UI or copy.
- Do not add a new test runner.

## Affected Files

- `tests/language.spec.js`
- optionally `README.md` only if test-running instructions need clarification

Generated app files should not change in this phase.

## Implementation Steps

1. Run the current baseline:

   ```powershell
   npm run verify
   npm run test:e2e
   ```

2. Inspect current Playwright coverage and identify missing issue #16 behaviors.
3. Add focused e2e tests using stable selectors already present in the app:
   - `#regions .region[data-region="..."]`
   - `#nationDropdown .searchOption`
   - `#claimOverlays .claim-overlay`
   - `#hoverOutlines`
   - `#selectionOutlines`
   - `#capitalMarkers`
   - `#nationInfo`
   - `#claimPill`
4. Prefer user-level actions such as hover, click, fill, select option, and empty-map click.
5. Avoid asserting implementation details that later phases intentionally change, unless those details represent required public DOM compatibility.
6. Re-run validation.

## Acceptance Criteria

- Existing tests continue to pass.
- New tests document the current behavior that later phases must preserve.
- The tests fail for meaningful regressions in map render, search, hover, selection, claim overlays, panel synchronization, or clear behavior.
- No application source files are changed.
- The app remains in the same working state as before the phase.

## Validation Commands

```powershell
npm run verify
npm run test:e2e
```

If dependencies are missing, bootstrap first:

```powershell
python -m pip install -r requirements.txt
npm ci
npx playwright install chromium
```

## Manual Smoke Tests

- Open the generated site served by Playwright or `python -m http.server 4174 --directory docs`.
- Confirm the map renders and region paths are visible.
- Switch English and Korean in the language selector.
- Search for `Brazil`, `Canada`, `Denver`, `Seoul`, and `Greater India`.
- Select Brazil and confirm `#nationInfo` shows capital-region information.
- Hover Amazonia, Ontario, Bolivia, Brasilia, and French Guiana.
- Click Amazonia and Brasilia and confirm selection outlines and capital marker state.
- Change claim display mode, claim type, and project filter.
- Click empty map space and confirm selection clears.

## Rollback Risks

Low. This phase should only change tests. Rollback removes the additional safety net but should not affect the app.

Primary risk is over-specifying DOM implementation details that later phases are supposed to change.

## Progress

- [x] Baseline validation recorded
- [x] Missing coverage identified
- [x] Playwright tests added or updated
- [x] Validation completed
- [x] Manual smoke completed

## Decision Log

- Use Playwright against `docs/` because that is how the app is deployed and how existing e2e tests run.
- Keep test additions focused on behavior preservation rather than internals.
- 2026-06-11: Baseline `npm run verify` passed before test changes.
- 2026-06-11: Baseline `npm run test:e2e` exposed stale expectations in the existing capital-marker test: foreign hover overlays now use `mix-blend-mode: normal`, and Brazil's visible claim result set treats Bolivia as an in-overlay region with normal hover fill.
- 2026-06-11: Added a small `chooseNation()` Playwright helper for new tests only.
- 2026-06-11: Added tests for claim display mode, project filtering, claim-kind filtering, outgoing claim-card activation, incoming claimant switch, and empty-map clear.

## Outcomes

Completed on 2026-06-11.

### Completed Phase Summary

Phase 1 stayed within the planned test-only scope. It corrected stale assertions in the existing capital-marker e2e test and added behavior coverage for the interaction paths that later refactor phases are most likely to disturb.

The new safety net verifies:

- Brazil selection renders the expected claim pill and overlay count.
- Project selection switches claim display to project mode and narrows overlays.
- Hostile claim filtering updates overlays and panel state.
- Claim display off removes claim overlays while preserving selected-nation panel state.
- Outgoing claim-card clicks activate project mode without changing the selected nation.
- Incoming claim-card clicks switch to the claimant and preserve the expected overlay context.
- Empty-map clicks clear search, overlays, selected outlines, and reset claim mode.

### Changed Files

- `tests/language.spec.js`
- `docs/refactor/issue-16/00-master-plan.md`
- `docs/refactor/issue-16/01-baseline-safety-net.md`

No application source files or generated deploy files were changed.

### Test Results

- Initial baseline `npm run verify`: passed.
- Initial baseline `npm run test:e2e`: failed on stale current-behavior expectations in an existing test.
- Final `npm run verify`: passed.
- Final `npm run test:e2e`: passed, 7 tests.
- Manual smoke coverage was exercised through a browser smoke script against `docs/`; it passed map render, language switching, search, Brazil overlays, hover/click regions, claim controls, and empty-map clear.

### Retrospective

The useful outcome from this phase is not only added coverage, but also correction of two assertions that no longer described current behavior. Leaving those stale expectations in place would have made later architecture phases look broken even when preserving the actual app.

### Remaining Risks

- The new tests intentionally assert current 2026 generated-data counts for Brazil and Bolivia. That is appropriate for issue #16 behavior preservation, but future data-regeneration work may need to update those counts.
- Some tests still interact with visible `.region` paths. Phase 4 may need to retarget those interactions to the hit layer while preserving the same user-level behavior assertions.
