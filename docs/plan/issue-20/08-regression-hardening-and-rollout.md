# Phase 08: Regression Hardening And Rollout

## Goal

Consolidate the issue #20 stabilization work, close validation gaps, and prepare final PR notes with before/after findings.

## Scope

- Review the final render/cache path for stale-state and invalidation risks.
- Add or update focused regression tests that cover the optimized behavior.
- Update phase outcomes with what changed and why.
- Capture final before/after observations or trace notes.
- Document whether Phase 07 was implemented or intentionally deferred after profiling.
- Ensure generated deployment output is rebuilt from source.

## Non-Goals

- Do not add new product features.
- Do not expand into world-wrap, scenario switching, or secondary capital hover preview.
- Do not refactor unrelated UI, data builders, or generated artifacts.
- Do not chase speculative performance work without evidence from earlier phases.

## Affected Files

- `tests/language.spec.js` or focused new specs
- `src/app.js`
- `src/state/map-visual-state.js`
- `src/render/map-layers.js`
- `docs/plan/issue-20/*.md`
- Generated `docs/**` output after `npm run build`

## Implementation Steps

1. Review all issue #20 changes for cache-key completeness and invalidation correctness.
2. Add final regression coverage for real pointer movement if not already covered.
3. Replace brittle raw overlay-count assertions with semantic assertions where DOM reduction changed node counts.
4. Confirm empty overlay render keys clear stale DOM and that cached model values were not mutated by render code.
5. Run the full validation command set from a clean tree.
6. Perform the full manual smoke matrix from `00-master-plan.md`.
7. Update each phase Outcomes section with final results, including a Phase 07 implementation or deferral note.
8. Draft PR notes that summarize measurement findings, optimization phases, validation commands, and remaining follow-up scope.

## Acceptance Criteria

- All issue #20 acceptance criteria are either satisfied or explicitly documented as intentionally deferred with reason.
- Dense-region mouse movement feels no worse than the pre-optimization baseline and should feel better for simple hover.
- Existing hover, click, selection, claim overlay, search, tooltip, and panel behavior remains unchanged.
- Tests cover optimized hover resolution or explicitly document the limitation of synthetic pointer dispatch.
- Final notes confirm the conservative hover fast path, cache immutability rule, empty render key behavior, and Phase 07 decision.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.
- Phase files contain completed progress, decision log, and outcomes entries.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
git status --short
```

Optional final profiling:

```powershell
npm run test:e2e -- --trace on
```

## Manual Smoke Tests

- Run the full manual smoke matrix from `00-master-plan.md`.
- Confirm no stale overlays after rapid search, hover, selection, project filter, language toggle, and clear-map sequences.
- Inspect dense Europe and South America hover behavior after all caching and DOM-reduction phases.

## Rollback Risks

- Final hardening can uncover a cache invalidation bug that requires revisiting an earlier phase.
- Updating tests after DOM reduction can accidentally weaken behavior coverage if semantic assertions are not added.
- Generated output can drift if `npm run build` is missed before e2e.

## Progress

- [x] Final cache/render review completed.
- [x] Regression tests hardened.
- [x] Full validation commands run.
- [x] Manual smoke matrix completed.
- [x] Cache immutability and empty render-key behavior reviewed.
- [x] Phase 07 implementation or deferral decision recorded.
- [x] Phase outcomes completed.
- [x] PR notes drafted.

## Decision Log

- Final rollout should treat generated output as a build product and summarize generated diffs by cause, not line-by-line.
- No additional source changes were needed in Phase 08 because Phases 01-06 already added focused real-pointer, bounded-hover, cache, render-key, empty-state, and hover/marker churn coverage.
- Raw overlay-count assertions remain acceptable for this issue because Phase 07 deferred DOM node-count reduction; semantic assertions were added around optimized behavior where counts alone would not catch stale DOM.
- Cache and render-key audit confirmed no render path mutates cached model `Set` values; mutable visual state receives copied set contents or cloned `resultSet` data.
- Final rollout notes are captured in this phase document rather than a separate PR file so the repository-local execution plan remains the source of truth.

## Outcomes

Implemented Phase 08 on 2026-06-13.

Final audit:

- Overlay model cache key inputs cover active scenario, active data version, language, nation, claim mode, claim kind, project filter, active incoming claim, selected region set, and options cache key.
- Overlay render keys are based on concrete claim path descriptors and label descriptors, with separate path and label keys.
- Empty render states are explicit for claim overlays, claim labels, foreign-hover overlays, and ordinary hover outlines.
- Cached overlay model values are treated as immutable; render code reads `Set` values and clones `model.resultSet` into `visibleNationRegionNames`.
- Capital marker key coverage includes language, marker region, marker nation, and selected state.
- Phase 07 was intentionally deferred after post-Phase-06 profiling showed unchanged overlay DOM replacement was already eliminated.

Regression coverage:

- Real-pointer debug baseline: `debug render stats capture real pointer hover baseline`.
- Bounded hover fast path: `simple selected-overlay claim hover movement uses bounded visual updates` and `settled same-nation hover preview uses bounded visual updates`.
- Overlay model cache: `overlay model cache reuses unchanged inputs and misses changed filters`.
- Overlay render keys: `overlay render skip keys avoid unchanged DOM replacement`.
- Hover and marker churn: `hover overlay and capital marker keys avoid unchanged churn`.
- Existing semantic coverage still checks language, search, capital markers, claim controls, claim cards, incoming/outgoing claim navigation, and clear-map behavior.

Validation:

- `npm run build` passed.
- `npm run verify` passed: generated outputs verified, 5 Python unit tests passed.
- `npm run test:e2e` passed: 13 Playwright tests passed.
- `git status --short` was clean before Phase 08 documentation was updated.

Manual smoke matrix:

- Dense Europe hover followed the pointer across available Austria, Czechia, Germany, and Poland hit regions.
- South America hover resolved Amazonia, Bolivia, Brasilia, and French Guiana.
- Selecting Brazil and hovering Bolivia preserved the selected overlay state.
- Moving across Brazil's claim range kept claim overlay and label DOM replacements at 0.
- Claim mode, project filter, claim kind, and only-claims controls updated overlays and hidden hit paths correctly.
- Empty-map clear reset search text, claim mode, claim pill, claim overlays, selection outlines, and hover pill.
- Tooltip and hover pill text updated for the resolved region/nation.
- Visible overlay paths remained `pointer-events: none`; hit detection continued through `#hitRegions .region-hit`.

Draft PR notes:

Summary:

- Added debug render counters gated by `?debugRenderStats=1`.
- Added bounded visual-state application for safe hover transitions.
- Cached overlay model construction using explicit semantic keys.
- Added render keys to skip unchanged claim overlay and label DOM replacements.
- Split hover overlay keys so foreign-hover and ordinary hover-outline layers no longer clear each other unnecessarily.
- Deferred compound overlay DOM reduction after profiling showed unchanged overlay DOM replacement was no longer a meaningful bottleneck.

Validation to report:

- `npm run build`
- `npm run verify`
- `npm run test:e2e`
- Full manual smoke matrix from `docs/plan/issue-20/00-master-plan.md`

Remaining follow-up scope:

- Scenario-switching invalidation once multiple active data sets exist.
- World-wrap rendering and replicated layer support.
- Secondary capital hover preview.
- Optional formal debug panel or CI performance budget if counter stability proves useful.
- Compound path experiments only after a fresh profile shows node count is again a meaningful bottleneck.
