# Phase 1: Label Instrumentation And Debug A/B

## Goal

- Add or verify label-focused counters and a debug-only label-disable mechanism for reproducible A/B profiling.

## Scope

- Add debug render stats for label counts, wrapped label copy counts, label group counts, label render/rebuild/replacement counts, label visibility state, and visible SVG node count.
- Add `debugDisableLabels=1` as a query-level measurement control if no equivalent exists.
- Extend focused tests to verify default label behavior and debug-disabled behavior.

## Non-goals

- Do not change normal label defaults.
- Do not remove or optimize labels for users in this phase.
- Do not touch hit testing, claims, hatching, pins, selection semantics, or localization behavior except as needed to measure labels.
- Do not keep `docs/assets/**` changes in the final diff.

## Affected files

- `src/app.js`
- `tests/map-wrap.spec.js`
- `tests/language.spec.js`
- `dev-docs/plan/issue_62/01-label-instrumentation.md`

## Implementation steps

1. Inspect existing label counts and render paths.
2. Add missing debug stat keys and update them when labels render or are sampled.
3. Add `debugDisableLabels=1` query handling.
4. Add focused tests for debug disable and label counter reset/render behavior.
5. Run focused syntax and Playwright checks.

## Acceptance criteria

- Counters distinguish visible labels, label copy groups, wrapped labels, label render calls, label DOM replacements, and label visibility/debug-disabled state.
- Normal labels remain disabled by default and toggled by the existing UI.
- `debugDisableLabels=1` prevents map labels from rendering even if the label button is clicked.
- Existing label-related tests still pass.

## Validation commands

- `node --check src/app.js`
- `npx playwright test tests/map-wrap.spec.js`
- `npx playwright test tests/language.spec.js`

## Manual smoke tests

- Covered by automated tests unless a later UI behavior changes.

## Rollback risks

- Debug-disable logic could accidentally suppress normal labels.
- Counters could be stale if they are not updated on reset, render, wrap toggle, or language refresh.

## Evidence

- Baseline: debug render stats already exposed `labelCount` and `visibleSvgNodeCount`, but did not expose label copy counts, wrapped label copy counts, label render/replacement counters, or a labels-disabled A/B control.
- After: `debugDisableLabels=1` prevents map label nodes from rendering even after the existing label toggle is clicked. Debug stats now expose `labelCopyGroupCount`, `wrappedLabelCopyCount`, `labelRenderCalls`, `labelDomReplacements`, `labelRenderSkippedByDebug`, label render timing counters, `labelVisibleState`, and `debugLabelsDisabled`.
- Delta: normal label behavior is unchanged; the new path is query-controlled and measurement-only.
- Interpretation: Phase 2 can compare labels-enabled and labels-disabled scenarios without introducing a user-facing optimization.

## Progress

- Completed.

## Decision log

- Kept the label disable option debug-only and query-driven so it can support A/B profiling without adding permanent UI behavior.
- Counted label DOM replacements at the app render boundary because both full region renders and label-only renders replace label layer children.

## Outcomes / Retrospective

- Validation:
  - `rtk node --check src/app.js` passed.
  - `rtk npm run build` passed; generated `docs/assets/app.js` was restored because `docs/assets/**` is excluded from this task.
  - `rtk npx playwright test tests/language.spec.js` passed.
  - `rtk npx playwright test tests/map-wrap.spec.js` initially failed because the new test used checkbox semantics for a button; after correcting the assertion, it passed.
