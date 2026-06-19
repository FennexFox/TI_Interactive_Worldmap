# SVG Overlay Optimization Follow-Up Pass

## Issue Target And Scope Summary

- Issue target: issue 16 local performance loop follow-up run `2026-06-19T044000Z-svg-overlay-follow-up-e2e`
- Title: SVG overlay performance optimization loop, follow-up pass
- Source plan: `dev-docs/plan/issue_16/svg-overlay-optimization-loop-plan.md`
- Work type: performance
- Scope: run a fresh baseline from the current worktree, investigate the `wrap-on-disable-hatch` regression after the `<use>` optimization, then proceed through hostile hatch overhead and overlay rebuild gating phases with before/after CSV evidence.

## Plan Contract

- User-visible problem or feature outcome: reduce SVG overlay rendering cost during measured map pan/zoom interactions without changing overlay meaning or interaction correctness.
- Target interaction: configured claim overlay setup followed by zoom and pan on the SVG map, with explicit wrap-off and wrap-on measurement rows.
- Reproduction scenario: run `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`; the script selects China, applies Greater Pan-Asia, adds Japan and Thailand, then records pan/zoom stats.
- Baseline metrics or gathering plan: gather baseline CSV before source optimization and use median values over repeats for noisy timing metrics.
- Expected performance mechanism: reduce SVG overlay copy/path/node work in expensive claim/hostile/world-wrap scenarios while keeping pan mostly viewBox-only.
- Before/after comparison method: compare baseline and after CSVs for median `panFrameMsMax`, `panFrameMsAvg`, `visibleSvgNodeCount`, and `setupClaimOverlayPathCount`, plus worst retained row as a secondary signal.
- Non-success outcome: revert unsafe source optimizations or record no-safe-improvement outcomes with evidence when metrics are noisy, regress, or do not meet the loop threshold.
- Implementation scope: run baseline measurements, investigate the follow-up regression, attempt hostile hatch overhead and overlay rebuild gating phases, rerun equivalent measurements for any candidate kept change, and document decisions.
- Non-goals: no renderer rewrite, no removal of hostile hatching, no removal of hostile claims overlay, no removal of world-wrap support, no correctness tradeoff for faster rendering, no committing unrelated files or generated measurement artifacts.
- Acceptance criteria that can fail: setup validation remains true, required tests pass for kept changes, visual smoke is checked, and each phase either has a kept evidence-supported change or an evidence-supported no-safe-improvement/follow-up decision.
- Validation commands: `npm run build`; `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`; `npm run verify`; `npx playwright test tests/map-wrap.spec.js`; final confidence with `npm run test:e2e` if the change is kept.
- Manual smoke tests: default wrap off, enable wrap, pan across seam, select China Greater Pan-Asia, confirm hostile hatch/claims/pins/hover/labels, toggle wrap off/on, check Korean and English wrap warning text.
- Files likely to change: `src/app.js`, `src/render/map-layers.js`, `tools/measure_debug_render_stats.mjs`, `tests/*.spec.js`, report markdown under `dev-docs/plan/issue_16/`, and this run's `.chatgpt/.../RESULT.md`.
- Files that must not change: `docs/assets/**` in the final diff, committed measurement CSVs, external game-derived data, unrelated app behavior, unrelated `.chatgpt/**`.
- Generated artifact policy: `npm run build` may be used to prepare local measurement assets, but checked-in `docs/assets/**` changes are forbidden for this prompt run and must be reverted from the final worktree unless explicitly requested later.
- Stop conditions: three iterations attempted, metrics do not improve meaningfully, correctness becomes uncertain, the next likely improvement requires broad rewrite, or verification cost becomes disproportionate.

## Strategy

- Use the source loop plan as the measurement and rollback contract.
- Treat `.chatgpt/codex-runs/2026-06-19T044000Z-svg-overlay-follow-up-e2e/PROMPT.md` as the prompt-run contract where it narrows commits and generated asset handling.
- Re-run the full measurement matrix from the current worktree before source edits.
- Start from the `wrap-on-disable-hatch` regression, then attempt Phase 2 hostile hatch overhead and Phase 3 overlay rebuild gating in order.
- Prefer small, reversible changes with direct measurement evidence; record no-safe-improvement outcomes honestly.

## Phase Order

1. [Phase 1: Prior measured optimization iteration](01-measured-optimization.md)
2. [Phase 2: Follow-up regression and hostile hatch overhead](02-follow-up-regression-hostile-hatch.md)
3. [Phase 3: Overlay rebuild gating](03-overlay-rebuild-gating.md)

## Phase Dependencies

- Phase 2 depends on the prior `<use>` optimization and the current measurement script emitting explicit wrap-on rows.
- Phase 3 depends on Phase 2 being completed or safely recorded with no kept change.

## Source Of Truth Decisions

- `svg-overlay-optimization-loop-plan.md` remains the source of truth for loop rules, metrics, thresholds, smoke tests, and reporting format.
- `.chatgpt/codex-runs/2026-06-19T044000Z-svg-overlay-follow-up-e2e/PROMPT.md` is the source of truth for this run's commit and generated-asset constraints: keep relevant verified work in focused commits, but exclude unrelated files, generated measurement CSVs, and `docs/assets/**` unless explicitly requested.
- This phased plan records how the existing issue 16 loop is extended for the follow-up prompt.
- Current source and command output are authoritative over prior conversation context.

## Generated-file Policy

- Do not hand-edit `docs/assets/**`.
- `npm run build` is required for local measurement setup.
- Do not keep `docs/assets/**` changes in the final diff for this prompt run.

## Global Validation Expectations

- Baseline and after CSVs must be recorded.
- Measurement CSVs are generated locally under `.chatgpt/tool-tests/render-stats/**` but must not be committed or edited manually.
- `npm run verify` must pass before reporting a kept source change.
- `npx playwright test tests/map-wrap.spec.js` must pass.
- `npm run test:e2e` should pass for final confidence when a kept source change affects user-visible map behavior.

## Known Risks And Assumptions

- Browser timing measurements are noisy; compare median values over repeats and treat single worst rows as secondary evidence.
- Reducing copied overlay layers can break seam correctness, so wrap tests and visual smoke matter as much as path counts.
- Phase 2 or Phase 3 may reveal no safe measurable improvement; that is acceptable if documented with evidence.
- `.chatgpt/result.md` and this run's `RESULT.md` may be updated as reporting files. Other `.chatgpt/**` files should not be edited manually, and generated measurement CSVs should not be committed.

## Completion Classification Rules

- Complete: fresh baseline exists; follow-up regression, Phase 2, and Phase 3 each have kept or no-safe-improvement decisions with evidence; required validation/smoke is recorded; final `RESULT.md` is written; final diff respects prompt path constraints.
- Partially complete: baseline and some phases completed but some required validation, phase decision, or documentation is missing.
- Preparation / instrumentation only: only measurement/reporting/planning changed, without demonstrated performance improvement.
- Blocked: measurement or verification cannot run after repeated attempts due an external blocker.
- Needs follow-up issue: the next improvement requires broader renderer redesign or additional investigation outside this iteration.

## Final Audit Checklist

- [x] Final diff reviewed against objective and source loop plan.
- [x] Final diff reviewed against this master plan.
- [x] Phase acceptance criteria checked.
- [x] Validation results recorded in phase docs and `.chatgpt/result.md`.
- [x] Manual smoke test results recorded in `.chatgpt/result.md`.
- [x] Generated-file policy followed: `docs/assets/**` has no final diff and measurement CSVs remain local ignored artifacts.
- [x] Commit Audit completed.
- [x] Completion classification assigned honestly: complete, with residual timing-noise caveats and a future instrumentation follow-up.

## Commit Audit Requirements

- Kept, relevant source/test/planning/report changes should be staged and committed in focused local commits after verification.
- Do not stage or commit unrelated files.
- Do not commit generated measurement CSV files under `.chatgpt/tool-tests/render-stats/**`.
- Generated Pages assets under `docs/assets/**` must not remain in the final diff unless explicitly requested later.
