# Phase 5: Compound Visual Overlay Candidate

## Goal

- Prototype at most one focused compound visual overlay optimization based on Phase 4 evidence, then keep it only if it improves measured cost or has a clear evidence-backed rationale without correctness risk.

## Scope

- Choose one visual-only SVG overlay bucket from the Phase 4 baseline, preferring helpers in `src/render/map-layers.js` over ad-hoc compound path code.
- Keep interaction hit paths unchanged unless a very small and separately tested adjustment is unavoidable.
- Rebuild and rerun the equivalent measurement after the candidate.
- Revert the candidate if evidence is weak, noisy, or risky; record no-safe-measurable-improvement if applicable.
- Run required verification and final smoke for any kept source change.

## Non-goals

- Do not implement a Canvas renderer.
- Do not rewrite hit testing, add spatial indexing, or make world-wrap copy reduction the primary optimization.
- Do not remove hostile hatching or change claim semantics.
- Do not keep generated `docs/assets/**`, `docs/data/**`, `data/generated/**`, or generated measurement CSV files in commits.

## Affected files

- Likely: `src/app.js`, `src/render/map-layers.js`, `tools/measure_debug_render_stats.mjs`, `tests/*.spec.js`, `dev-docs/plan/issue_16/05-compound-visual-overlay-candidate.md`.

## Implementation steps

1. Review Phase 4 counters and identify the largest visual-only SVG contributor.
2. Inspect existing grouping helpers before adding a new helper.
3. Implement one narrow compound visual overlay candidate.
4. Run `npm run build`.
5. Run `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`.
6. Compare before/after medians for `panFrameMsMax`, `panFrameMsAvg`, `visibleSvgNodeCount`, and relevant layer counters.
7. Keep the candidate only if it meets the meaningful-improvement threshold or has a strong evidence-backed rationale with no correctness risk.
8. Run `npm run verify`, `npx playwright test tests/map-wrap.spec.js`, `npm run test:e2e`, and a focused smoke script.

## Acceptance criteria

- Before/after CSV paths and metrics are recorded.
- Any kept optimization preserves hover, click selection, pinned regions, claim overlays, hostile hatching, labels, world-wrap seam behavior, and language refresh behavior.
- Any kept optimization meets the threshold or records a clear rationale; otherwise it is reverted and the phase records no-safe-measurable-improvement.
- Final generated-file policy is respected.

## Validation commands

- `npm run build`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`
- `npm run verify`
- `npx playwright test tests/map-wrap.spec.js`
- `npm run test:e2e`

## Manual smoke tests

- Confirm default world-wrap off.
- Toggle world-wrap on/off and pan across the seam.
- Select China and apply Greater Pan-Asia.
- Confirm claim overlays, hostile hatching, hover overlays, labels, pinned markers, and language refresh in Korean/English.

## Rollback risks

- Compound visual grouping could collapse per-region visual classes, tooltips, or outline semantics.
- Hover/selection overlays could become stale or visually ambiguous.
- Browser timing noise could produce a false keep decision.

## Evidence

- Baseline: Phase 4 CSV `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T09-46-24-773Z.summary.csv`.
- Baseline `wrap-off-complex-overlays`: median `panFrameMsMax=3.750 ms`, median `panFrameMsAvg=0.536 ms`, median `visibleSvgNodeCount=1315`.
- Relevant layer counts: `hitPathCount=363`, `labelCount=363`, `claimOutlinePathCount=56`, `claimHatchGroupCount=5`, `claimClipPathCount=5`, `setupForeignHoverOverlayPathCount=3`.
- Candidate review: existing `src/render/map-layers.js` grouping helpers already group claim fills and foreign/secondary hover visual fills. Tests intentionally preserve per-region semantic claim outlines (`#claimOverlays .claim-overlay[data-region=...]`) and projected outline copies, including hostile claim selectors and world-wrap seam assertions.
- After: Not run; no candidate source optimization was kept.
- Delta: Not applicable; the phase records `no-safe-measurable-improvement`.
- Interpretation: Grouping the 56 claim outlines is the only apparent visual-only count reduction, but it would remove or substantially alter per-region semantic outline nodes that tests and DOM semantics currently rely on. Hover overlays are already grouped and too small in this baseline to justify another grouping candidate. Labels and hit paths dominate node count, but labels require per-region text and hit paths are explicitly out of scope.

## Progress

- Completed candidate review from Phase 4 evidence; no source candidate kept.

## Decision log

- Do not prototype or keep compound claim outline grouping in this run because the measurable target is modest and correctness risk is high.
- Record `no-safe-measurable-improvement` rather than changing hit paths, labels, hostile hatching semantics, or per-region claim outline semantics.
- Recommended next direction: profile label rendering/toggling ergonomics and consider a broader renderer-strategy investigation for labels or a hybrid Canvas/SVG visual layer, with hit paths and semantic overlays preserved separately.

## Outcomes / Retrospective

- Phase complete as instrumentation/profiling plus no-kept-candidate. Required tests still run against the instrumentation changes because debug counters and the measurement scenario changed source/tooling.
