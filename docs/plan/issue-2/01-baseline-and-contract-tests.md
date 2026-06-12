# Phase 01: Baseline and Contract Tests

## Goal

Capture the current behavior and add focused test scaffolding for world-wrap work before changing map behavior.

## Scope

- Run and document the baseline build, verification, and browser test flow on `develop`.
- Add or organize Playwright helpers for map interaction tests.
- Add tests that assert current canonical behavior: hover, click, clear, selected overlays, claim controls, and debug render stats.
- Add pending or skipped test descriptions for world-wrap acceptance criteria if useful for review.
- Confirm `docs/` generated output is in sync before later source changes.

## Non-goals

- Do not implement panning.
- Do not render world copies.
- Do not change map layout, styling, data generation, claim semantics, or overlay behavior.
- Do not introduce a new test runner unless the existing Playwright and Python test setup is insufficient.

## Affected Files

- `tests/language.spec.js`
- `tests/map-wrap.spec.js` if a new browser spec is clearer than expanding the existing file
- `tests/map-view-state.spec.js` later if pure map-view helpers are introduced
- `README.md` only if validation instructions need clarification
- `docs/plan/issue-2/**`

Generated files should not change in this phase unless `npm run build` reveals stale checked-in output from the baseline.

## Implementation Steps

1. Run `git status --short --branch` and confirm the branch is clean.
2. Run `npm run build` to sync checked-in Pages output from the current source.
3. Run `npm run verify`.
4. Run `npm run test:e2e`.
5. Review existing browser tests and extract small helpers only where it improves readability.
6. Add baseline map interaction tests that can be reused by later phases.
7. If future wrap tests are added as skipped tests, make each skipped test name map to one issue #2 acceptance criterion.
8. Confirm no app behavior or generated data semantics changed.

## Acceptance Criteria

- Baseline build, verify, and E2E commands pass.
- Existing language, search, hover, selection, claim overlay, and clear-map tests still pass.
- Any new tests pass without requiring world-wrap behavior.
- Test helper extraction does not hide important assertions.
- The app still loads from `docs/` as a static site.

## Validation Commands

```powershell
git status --short --branch
npm run build
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Serve `docs/` locally and open the root page.
- Confirm the map renders and no load-error screen appears.
- Select Brazil through search and confirm the claim summary and overlays update.
- Hover Amazonia, then another region, and confirm hover outlines and capital markers update.
- Click a region, then click empty map space, and confirm selection clears.
- Toggle English and Korean and confirm static and dynamic UI copy update together.

## Rollback Risks

- Low risk if this phase only changes tests and docs.
- Test helper extraction can accidentally weaken assertions.
- Running `npm run build` may reveal unrelated generated output drift; review generated diffs carefully and do not hand-edit them.

## Progress

- [x] Baseline commands run.
- [x] Existing tests reviewed.
- [x] Reusable map test helpers identified.
- [x] Baseline contract tests added or confirmed.
- [x] Generated output sync checked.

## Decision Log

- Decision: Use Playwright as the primary browser behavior gate because the app is a static SVG UI and existing coverage already uses Playwright.
- Decision: Keep this phase behavior-preserving so later wrap regressions have a clean baseline.
- Decision: Add `tests/map-wrap.spec.js` as a separate issue #2 contract spec instead of expanding `tests/language.spec.js`; this keeps future wrap acceptance work easy to locate.
- Decision: Keep three issue #2 acceptance tests skipped in Phase 01 so later phases can convert them from markers into executable behavior checks without requiring panning or copied rendering before they exist.

## Outcomes

- Added baseline Playwright coverage for canonical hit-layer resolution, hover, click selection, clear-map behavior, and selected claim overlay stability.
- Added skipped issue #2 acceptance markers for horizontal panning, wrapped copy canonical interaction, and copied claim overlays.
- `npm run build` passed and produced no generated-output drift.
- `npm run verify` passed.
- `npm run test:e2e` passed with 15 active tests and 3 skipped future issue #2 markers.
- Manual smoke checklist passed against the static `docs/` site: load, Brazil selection, hover transitions, capital marker, region selection, clear, and language toggle.
- Retrospective: the current app has no stable `#selectedPill` element in the HTML shell even though `src/app.js` checks for it, so smoke coverage should continue to assert visible selection overlays and panel state instead of depending on that optional element.
