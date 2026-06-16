# Phase 01: Discovery, baseline, and diagnostics

## Goal

- Establish the current hot path, add missing instrumentation if needed, and lock in a focused regression test for megastate selection churn.

## Scope

- Inspect the current manual envelope, reachable capital, overlay cache, and selection/pin refresh flow.
- Add debug counters for model/descriptor builds and cache hits where existing DOM replacement counters are too coarse.
- Add focused e2e expectations for selecting reachable capitals that prove repeated envelope/candidate work is bounded.

## Non-goals

- Do not change map semantics, claim inclusion rules, or pin behavior.
- Do not do broad module extraction.
- Do not use timing-based performance assertions.

## Affected files

- `src/app.js`
- `tests/language.spec.js`
- `docs/plan/issue_41/**`

## Implementation steps

- Confirm the branch contains the #32/#40 manual expansion baseline.
- Identify every direct call that rebuilds the manual envelope or reachable candidates during a pin/click refresh.
- Add deterministic debug counters for manual envelope model builds/cache hits and reachable candidate descriptor builds/cache hits.
- Update an existing reachable-capital e2e test or add a focused one that resets stats around a candidate click.

## Acceptance criteria

- The repo has a #41 phased plan with no generic placeholders.
- Debug stats distinguish model/descriptor computation from SVG layer replacement.
- The reachable-capital selection path has a deterministic counter-based guardrail.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e -- tests/language.spec.js

## Manual smoke tests

- Load `/?worldWrap=0&debugRenderStats=1`.
- Select China.
- Add North Honshu as a reachable capital.
- Confirm the pinned panel, manual envelope, and reachable candidates still update.
- Inspect `window.__TI_DEBUG_RENDER_STATS__` and confirm model/descriptor counters are present.

## Rollback risks

- Counter-only changes should be low risk, but tests can become brittle if they assert implementation details that later phases intentionally improve.

## Evidence

- Baseline: Phase 1 added deterministic counters but did not capture the later requested multi-pin hover/pan baseline.
- After: Not applicable; this phase was diagnostic preparation.
- Delta: No demonstrated user-visible hover/pan improvement from this phase alone.
- Interpretation: Preparation / instrumentation only for the current remaining #41 objective.

## Progress

- Completed source review of `src/app.js` manual envelope, reachable capital, overlay descriptor, and selection/pin refresh paths.
- Added debug counters for manual envelope model builds/cache hits and reachable capital candidate descriptor builds/cache hits.
- Added e2e coverage that verifies the new debug keys exist and that the reachable-capital click path is measured.

## Decision log

- Use counters rather than wall-clock timing because browser timing is noisy in CI.

## Outcomes / Retrospective

- Completed as preparation. The issue now has deterministic diagnostics for model/descriptor paths, but this phase did not prove the remaining multi-pin hover/pan performance issue fixed.
