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

- [ ] Final cache/render review completed.
- [ ] Regression tests hardened.
- [ ] Full validation commands run.
- [ ] Manual smoke matrix completed.
- [ ] Cache immutability and empty render-key behavior reviewed.
- [ ] Phase 07 implementation or deferral decision recorded.
- [ ] Phase outcomes completed.
- [ ] PR notes drafted.

## Decision Log

- Final rollout should treat generated output as a build product and summarize generated diffs by cause, not line-by-line.

## Outcomes

Pending implementation.
