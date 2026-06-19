# SVG Overlay Optimization Iteration

## Issue Target And Scope Summary

- Issue target: issue 16 local performance loop
- Title: SVG overlay performance optimization loop, one measured iteration
- Source plan: `dev-docs/plan/issue_16/svg-overlay-optimization-loop-plan.md`
- Work type: performance
- Scope: perform one bounded measurement-driven optimization iteration, commit accepted work, and document before/after evidence.

## Plan Contract

- User-visible problem or feature outcome: reduce SVG overlay rendering cost during measured map pan/zoom interactions without changing overlay meaning or interaction correctness.
- Target interaction: configured claim overlay setup followed by zoom and pan on the SVG map, with explicit wrap-off and wrap-on measurement rows.
- Reproduction scenario: run `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`; the script selects China, applies Greater Pan-Asia, adds Japan and Thailand, then records pan/zoom stats.
- Baseline metrics or gathering plan: gather baseline CSV before source optimization and use median values over repeats for noisy timing metrics.
- Expected performance mechanism: reduce SVG overlay copy/path/node work in expensive claim/hostile/world-wrap scenarios while keeping pan mostly viewBox-only.
- Before/after comparison method: compare baseline and after CSVs for median `panFrameMsMax`, `panFrameMsAvg`, `visibleSvgNodeCount`, and `setupClaimOverlayPathCount`, plus worst retained row as a secondary signal.
- Non-success outcome: revert source optimization and document the iteration as not kept if metrics fail the threshold or correctness/verification fails.
- Implementation scope: run baseline measurements, make one focused SVG overlay optimization, rerun equivalent measurements and required tests, keep only evidence-supported changes, and document results.
- Non-goals: no renderer rewrite, no removal of hostile hatching, no removal of world-wrap support, no correctness tradeoff for faster rendering, no second optimization iteration without explicit follow-up.
- Acceptance criteria that can fail: setup validation remains true, required tests pass, visual smoke is checked, and at least one primary metric meets the source plan's meaningful-improvement threshold without significant regression.
- Validation commands: `npm run build`; `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`; `npm run verify`; `npx playwright test tests/map-wrap.spec.js`; final confidence with `npm run test:e2e` if the change is kept.
- Manual smoke tests: default wrap off, enable wrap, pan across seam, select China Greater Pan-Asia, confirm hostile hatch/claims/pins/hover/labels, toggle wrap off/on, check Korean and English wrap warning text.
- Files likely to change: `src/app.js`, `src/render/map-layers.js`, `tools/measure_debug_render_stats.mjs`, `tests/map-wrap.spec.js`, report markdown under `dev-docs/plan/issue_16/`, and rebuilt `docs/assets/**` only when source changes require it.
- Files that must not change: generated/data catalogs unless a verifier requires them; external game-derived data; unrelated app behavior.
- Generated artifact policy: edit source first, run `npm run build`, include rebuilt Pages assets only for changed source assets, and summarize generated changes rather than hand-reviewing generated output.
- Stop conditions: three iterations attempted, metrics do not improve meaningfully, correctness becomes uncertain, the next likely improvement requires broad rewrite, or verification cost becomes disproportionate.

## Strategy

- Use the source loop plan as the measurement and rollback contract.
- Execute only Phase 1 in this goal.
- Prefer small SVG node/path-count reductions in world-wrap or hostile overlay paths because the plan identifies those as the most likely cost centers.
- Treat measurement evidence as authoritative; revert the source change if metrics or tests do not justify keeping it.

## Phase Order

1. [Phase 1: One measured optimization iteration](01-measured-optimization.md)

## Phase Dependencies

- Phase 1 depends on the source loop plan and the current measurement script emitting explicit wrap-on rows.
- No later phase is planned for this objective.

## Source Of Truth Decisions

- `svg-overlay-optimization-loop-plan.md` remains the source of truth for loop rules, metrics, thresholds, smoke tests, and reporting format.
- This phased plan exists to make the single requested iteration helper-gated and auditable.
- Current source and command output are authoritative over prior conversation context.

## Generated-file Policy

- Do not hand-edit `docs/assets/**`.
- Rebuild checked-in Pages assets with `npm run build` after source changes.
- Include only expected generated app/style asset changes in the phase commit.

## Global Validation Expectations

- Baseline and after CSVs must be recorded.
- `npm run verify` must pass before a kept source change is committed.
- `npx playwright test tests/map-wrap.spec.js` must pass.
- `npm run test:e2e` should pass for final confidence when a kept source change affects user-visible map behavior.

## Known Risks And Assumptions

- Browser timing measurements are noisy; compare median values over repeats and treat single worst rows as secondary evidence.
- Reducing copied overlay layers can break seam correctness, so wrap tests and visual smoke matter as much as path counts.
- The measurement scenario may reveal no keepable optimization in one iteration; that is a valid outcome if documented honestly.

## Completion Classification Rules

- Complete: one iteration has baseline/after evidence, a justified kept or reverted decision, required validation, report documentation, and commits.
- Partially complete: baseline and implementation happened but some required validation or documentation is missing.
- Preparation / instrumentation only: only measurement/reporting/planning changed, without demonstrated performance improvement.
- Blocked: measurement or verification cannot run after repeated attempts due an external blocker.
- Needs follow-up issue: the next improvement requires broader renderer redesign or additional investigation outside this iteration.

## Final Audit Checklist

- [ ] Final diff reviewed against objective and source loop plan.
- [ ] Final diff reviewed against this master plan.
- [ ] Phase acceptance criteria checked.
- [ ] Validation results recorded.
- [ ] Manual smoke test results recorded or explicitly deferred.
- [ ] Generated-file policy followed.
- [ ] Commit Audit completed.
- [ ] Completion classification assigned honestly.

## Commit Audit Requirements

- Phase-sized commits must exist for planning/reporting setup and for any kept implementation change.
- Each commit must exclude unrelated work.
- Generated Pages assets must be committed only when regenerated from source changes by `npm run build`.
- If a source optimization is reverted because evidence does not justify it, commit only the report documentation and any accepted measurement/planning changes.
