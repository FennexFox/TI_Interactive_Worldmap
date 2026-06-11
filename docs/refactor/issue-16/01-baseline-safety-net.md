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

- [ ] Baseline validation recorded
- [ ] Missing coverage identified
- [ ] Playwright tests added or updated
- [ ] Validation completed
- [ ] Manual smoke completed

## Decision Log

- Use Playwright against `docs/` because that is how the app is deployed and how existing e2e tests run.
- Keep test additions focused on behavior preservation rather than internals.

## Outcomes

Not started.
