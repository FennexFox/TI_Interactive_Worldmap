# Investigate and refactor megastate selection performance

## Issue Target And Scope Summary

- Issue target: #41
- Title: Investigate and refactor megastate selection performance
- Source plan: `docs/plan/issue_41/**`; PR #42 is preparation evidence, not proof that #41 is fixed.
- Work type: performance
- Scope: reduce user-visible hover and pan churn after users pin multiple reachable-capital expansion nodes.

## Plan Contract

- User-visible problem or feature outcome: after multiple reachable capitals / nations are pinned, hovering and panning the map should remain responsive.
- Implementation scope: prevent hover-only changes from rebuilding reachable-capital candidate data or marker DOM; keep drag/pan view updates transform/viewBox-only until pan end; measure manual-envelope node/render cost before changing manual-envelope SVG structure.
- Non-goals: do not change claim semantics, reachable-capital eligibility, pinned expansion behavior, secondary-capital preview behavior, language behavior, generated data content, #18 scenario support, or #35 automatic recursive closure.
- Acceptance criteria that can fail: hover after three pinned reachable capitals does not rebuild reachable candidate descriptors or marker DOM; drag/pan after three pinned reachable capitals does not perform hover overlay, capital marker, reachable marker, manual-envelope, or full map-visual refresh work during pointer movement; before/after evidence shows lower hover/pan hot-path work; existing reachable-capital and secondary-capital preview tests still pass.
- Validation commands: `npm run build`; `npm run verify`; targeted e2e for reachable-capital hover/pan behavior; full `npm run test:e2e` when feasible.
- Manual smoke tests: load `/?worldWrap=0&debugRenderStats=1`, choose China, pin several reachable capitals, hover across map regions, drag/pan across map regions, and inspect `window.__TI_DEBUG_RENDER_STATS__`; repeat in wrapped mode if source changes affect copied marker projection.
- Files likely to change: `src/app.js`, `tests/language.spec.js`, `tests/map-wrap.spec.js`, `docs/plan/issue_41/**`.
- Files that must not change: generated catalog/map data unless a build command rewrites them; generated `docs/assets/**` unless repository policy or validation requires a checked-in build output update.
- Generated artifact policy: edit source and tests first; run `npm run build` only through the build script; summarize generated output at a high level and do not hand-edit generated files.
- Stop conditions: stop and classify honestly if hover/pan cannot be measured locally, if the optimization changes reachable-capital selection or secondary-capital preview semantics, if validation fails for reasons unrelated to the intended change and cannot be resolved safely, or if evidence shows manual-envelope SVG node count is the dominant bottleneck and needs a larger compound-path phase.
- Target interaction: hover after multiple reachable capitals are pinned; pan/drag after multiple reachable capitals are pinned.
- Reproduction scenario: built `docs/` site, `/?worldWrap=0&debugRenderStats=1`, choose China, pin three reachable candidates (`MalayPeninsula`, `NorthHonshu`, `SouthThailand` in the current baseline), then hover `Moskva` and `Paris`, and drag across the map from `Moskva`.
- Baseline metrics: current baseline after three pins shows hover `reachableCapitalCandidateRebuilds=2`, `capitalMarkerRebuilds=2`, `fullVisualStateApplications=2`; pan drag shows `reachableCapitalCandidateRebuilds=10`, `capitalMarkerRebuilds=7`, `fullVisualStateApplications=7`, `boundedVisualStateApplications=4`, `visiblePathsTouched=2548`, `hitPathsTouched=2548`.
- Measurement method: one-off Playwright/browser debug-counter capture plus e2e counter assertions for the specific hot paths; add timing/node-count probes only if counters are insufficient to identify the bottleneck.
- Before/after comparison method: rerun the same multi-pin hover and pan scenarios after source changes and compare debug counters, node counts, and any added timing probes.
- Non-success outcome: if changes only add counters or preparation, classify as `Preparation / instrumentation only`; if hover/pan counters do not improve, classify as `Partially complete` or `Needs follow-up issue`; do not claim #41 fixed without before/after evidence.

## Strategy

- Treat PR #42 as useful groundwork: caches, debug counters, and bounded selection refreshes reduce click-time recomputation but do not prove hover/pan responsiveness.
- First remove hover state from reachable-capital marker render identity and update hover highlight without rebuilding the marker layer.
- Then isolate pan/drag so pointer movement only updates map viewBox/transform and tooltip layout as needed; defer hover refresh until pan end.
- Measure after those focused changes. Only optimize manual-envelope compound paths if node/timing evidence shows manual-envelope DOM is still the bottleneck.
- Preserve existing source ownership: `src/app.js` remains the owner for this issue unless a small helper extraction directly reduces risk.

## Phase Order

1. [Discovery, baseline, and diagnostics](01-discovery.md)
2. [Manual envelope and reachable candidate cache](02-model-cache.md)
3. [Selection/pin refresh narrowing](03-refresh-bounds.md)
4. [Baseline correction and plan reset](04-verification.md)
5. [Hover and pan hot-path isolation](05-hover-pan-hot-path.md)
6. [Final performance audit](06-final-audit.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.
- Phase 4 depends on the user follow-up clarifying that PR #42 did not prove the real hover/pan issue was fixed.
- Phase 5 depends on the corrected performance plan and baseline evidence from phase 4.
- Phase 6 depends on phase 5 implementation, after measurements, and validation results.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Earlier PR #42 outcomes are retained as preparation history only; they are not accepted as final #41 completion evidence.
- `src/app.js` remains the implementation owner for this issue. Extraction to `src/render/**` is deferred unless a phase needs it to avoid duplication.
- Generated and deployment artifacts must be produced by `npm run build`, not edited manually.

## Generated-file Policy

- Do not inspect or hand-edit generated artifacts for implementation.
- Do not include generated build artifacts such as `docs/assets/**` unless repository policy or validation requires them.
- If generated artifacts change intentionally, summarize them at a high level and review source/generator changes instead.

## Global Validation Expectations

- `npm run build`
- `npm run verify`
- Targeted Playwright e2e for the changed hover/pan behavior.
- `npm run test:e2e` when the environment can run Chromium; otherwise record the exact environment failure.

## Known Risks And Assumptions

- Debug counters are deterministic guardrails, not full browser performance benchmarks.
- Removing hover from marker render keys must not remove the visible hover highlight for reachable-capital candidates.
- Deferring hover work during pan must not break hover state after pan end or drag click suppression.
- Secondary-capital preview behavior must remain intact for ordinary hover outside active panning.
- Manual-envelope node count may still matter, but current baseline points first to hover/pan-triggered marker and visual refresh churn.
- The worktree already includes generated-path migration changes; issue #41 changes must not overwrite unrelated edits.

## Completion Classification Rules

- Complete: before/after evidence shows hover and pan hot-path counters improve in the multi-pin scenario, acceptance criteria pass, validation passes or environment failures are documented, and no required behavior regresses.
- Partially complete: only one target interaction improves, or validation/manual smoke coverage is incomplete.
- Preparation / instrumentation only: changes add counters, plans, or refactors but do not demonstrate improved hover/pan behavior.
- Blocked: the same blocker repeats across three goal turns and prevents meaningful progress, such as no available browser runtime for measurement and no alternative evidence path.
- Needs follow-up issue: manual-envelope compound rendering or a larger renderer split is indicated by evidence but exceeds the focused hover/pan fix scope.

## Final Audit Checklist

- [x] Final diff reviewed against issue #41, PR #42 follow-up, and the pasted objective.
- [x] Final diff reviewed against this master plan.
- [x] Hover after multiple pinned reachable capitals has before/after evidence.
- [x] Pan after multiple pinned reachable capitals has before/after evidence.
- [x] Phase acceptance criteria checked.
- [x] Validation results recorded.
- [x] Manual smoke test results recorded or explicitly deferred.
- [x] Generated-file policy followed.
- [x] Completion classification assigned honestly.
