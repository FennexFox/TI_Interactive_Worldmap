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

- Baseline:
- After:
- Delta:
- Interpretation:

## Progress

- Pending implementation.

## Decision log

- Pending.

## Outcomes / Retrospective

- Pending.
