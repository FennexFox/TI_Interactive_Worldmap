# Issue 62 Label Rendering Performance Profiling

## Issue Target And Scope Summary

- Issue target: #62
- Title: Profile and optimize label rendering performance
- Source plan: `dev-docs/plan/performance-followups/label-rendering-performance-issue.md`
- Work type: performance profiling
- Scope: add label-specific render counters and a debug label-disable A/B path, measure labels enabled versus disabled across single-copy and wrapped map scenarios, and document whether labels justify a user-visible optimization.

## Plan Contract

- User-visible problem or feature outcome: improve understanding of label rendering cost before changing label behavior.
- Implementation scope: render-stat counters, measurement scenarios, debug-only label-disable option, focused tests, and issue #62 result documentation.
- Non-goals: no default label removal, no permanent user-facing label optimization unless measurement clearly supports it, no Canvas renderer, no hit-path/claim/selection/pin/localization semantic changes.
- Acceptance criteria that can fail: label counts and wrapped label copy counts are emitted; label render/rebuild/replacement counters identify pan/zoom/hover/wrap/language behavior; labels-enabled versus disabled measurements are recorded; relevant tests pass; forbidden generated outputs remain untouched in final diff.
- Validation commands: `npm run build`; `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`; `npm run verify`; `npx playwright test tests/map-wrap.spec.js`; `npx playwright test tests/language.spec.js`; `npm run test:e2e` if source behavior changes.
- Manual smoke tests: default labels off, label toggle on/off, debug label-disable query, wrap toggle, language refresh, hover/selection/pinned labels.
- Files likely to change: `src/app.js`, `tools/measure_debug_render_stats.mjs`, `tests/map-wrap.spec.js`, `tests/language.spec.js`, `dev-docs/plan/issue_62/**`, possibly `.chatgpt/result.md`.
- Files that must not change: `docs/assets/**`, `data/generated/**`, `docs/data/**`, measurement CSV files, `graphify-out/graph.html`, `graphify-out/graph.json`.
- Generated artifact policy: build output may be generated locally for validation but must be restored before final status; measurement CSVs remain ignored local evidence.
- Stop conditions: label measurements cannot be gathered reliably, setup validation fails repeatedly, or the only plausible optimization would change label semantics without product approval.

## Performance Contract

- Target interaction path: label visibility, pan, zoom, hover, wrap toggle, and language refresh.
- Reproduction scenario: `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6` with labels enabled and disabled in wrap-off, wrap-off-complex, wrap-on, and practical wrap-on-complex scenarios.
- Baseline metrics or gathering plan: gather fresh CSV after instrumentation; compare scenario medians over repeats for `panFrameMsMax`, `panFrameMsAvg`, `visibleSvgNodeCount`, label-specific counts, and label rebuild/replacement counters.
- Expected performance mechanism: labels add hundreds of SVG `text` nodes and world-wrap can multiply those nodes; if labels are a bottleneck, disabling them should reduce node count and measured pan/zoom costs.
- Before/after comparison method: labels-enabled versus debug-disabled A/B rows in the same measurement run.
- Non-success outcome: record `instrumentation only` or `no label optimization kept` with recommended next direction.

## Strategy

- Add counters first and verify they are side-effect free.
- Add a debug-only label disable query that bypasses label rendering without changing default behavior.
- Extend measurement scenarios to produce paired labels-enabled/disabled rows.
- Use measurement evidence to decide whether this issue should proceed to a separate optimization pass.

## Phase Order

1. [Phase 1: Label instrumentation and debug A/B](01-label-instrumentation.md)
2. [Phase 2: Measurement and decision](02-measurement-and-decision.md)

## Phase Dependencies

- Phase 2 depends on Phase 1 counters and debug-disable scenario support.

## Source Of Truth Decisions

- GitHub issue #62 and `dev-docs/plan/performance-followups/label-rendering-performance-issue.md` define the scope.
- The user's explicit forbidden paths override normal build-output handling for final diffs.
- Current source and tests are authoritative for actual label behavior.

## Generated-file Policy

- Do not modify `docs/assets/**`, generated data, measurement CSV files, `graphify-out/graph.html`, or `graphify-out/graph.json` in the final diff.
- If `npm run build` changes forbidden generated assets locally, restore them before final status.

## Global Validation Expectations

- Plan gate passes before source edits.
- Measurement setup rows used for evidence have `setupOk=true` and empty `setupFailures`.
- `npm run verify`, focused map-wrap tests, and focused language tests pass.
- Full e2e passes if source behavior changes.

## Known Risks And Assumptions

- Browser timing is noisy; median values over repeats are primary, worst rows are secondary.
- The existing UI already has a label toggle, but a query-level debug disable is still useful for reproducible A/B measurement.
- Labels are user-visible and localized; normal behavior must remain unchanged.

## Completion Classification Rules

- Complete: label counters and A/B measurement are implemented, fresh evidence is recorded, tests pass, and a decision is documented.
- Partially complete: counters or measurements are incomplete but some useful evidence exists.
- Preparation / instrumentation only: counters and debug scenarios are added but no user-visible optimization is kept.
- Blocked: measurement or validation cannot run after repeated attempts.
- Needs follow-up issue: evidence points to a larger renderer or product decision outside this pass.

## Final Audit Checklist

- [x] Final diff reviewed against issue #62 and the user request.
- [x] Final diff reviewed against this master plan.
- [x] Phase acceptance criteria checked.
- [x] Validation results recorded in phase docs, the issue #62 result document, and `.chatgpt/result.md`.
- [x] Manual smoke test results explicitly deferred to focused Playwright and full e2e coverage; no separate manual browser smoke was recorded.
- [x] Generated-file policy followed: forbidden generated outputs and measurement CSVs were not committed.
- [x] Commit Audit completed.
- [x] Completion classification assigned honestly: complete for the profiling contract, with no user-visible optimization kept.

## Commit Audit Requirements

- Make a focused commit after each completed phase when staging is safe.
- Do not stage unrelated untracked context files unless they are intentionally part of the phase.
- Do not commit generated measurement CSVs or forbidden generated outputs.
- Restore any local `docs/assets/**` changes from validation builds before final status.
