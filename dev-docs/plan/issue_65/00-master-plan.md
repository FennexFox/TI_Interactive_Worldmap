# Profile region hit-path duplication and canonical geometry reuse

## Issue Target And Scope Summary

- Issue target: #65
- Title: Profile region hit-path duplication and canonical geometry reuse
- Source plan: GitHub issue #65 and `dev-docs/plan/issue_65/issue_65_implementation_context.md`
- Work type: performance
- Scope: measure duplicated region geometry across base visuals, hit paths, and world-wrap copies; add hit/region geometry counters; decide whether a guarded canonical hit-path reuse experiment is safe and worthwhile.

## Plan Contract

- User-visible problem or feature outcome: improve evidence about whether region hit paths and duplicated region path data are meaningful SVG cost contributors without changing normal map behavior unless a safe measured improvement is proven.
- Implementation scope: debug render-stat counters, measurement CSV columns, baseline measurements for single-copy and world-wrap scenarios, optional debug-only canonical hit-path A/B candidate, focused interaction tests, generated Pages rebuilds from source, and issue #65 result documentation.
- Non-goals: no label visibility policy changes, no Canvas or hybrid renderer rewrite, no broad #60 world-wrap audit, no weakening of hit-test semantics, no removal of hit paths just to improve counts, no claim/hover/selection/pin/language behavior changes.
- Acceptance criteria that can fail: counters distinguish node count from path-data duplication; measurements cover default, complex single-copy, world-wrap, and complex world-wrap scenarios; any candidate is guarded or clearly comparable; hover/click and seam behavior remain correct; related overlays, pins, labels, and language refresh remain correct; before/after evidence is recorded for any kept optimization; no generated measurement CSVs are committed.
- Validation commands: `npm run build`; `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`; `npm run verify`; `npx playwright test tests/map-wrap.spec.js`; `npx playwright test tests/language.spec.js`; `npm run test:e2e`.
- Manual smoke tests: default single-copy hover/click; world-wrap seam hover/click; label toggle; claim overlay selection; pinned regions; language refresh; debug canonical hit-path flag if implemented.
- Files likely to change: `src/app.js`, `src/render/map-layers.js`, `tools/measure_debug_render_stats.mjs`, `tests/map-wrap.spec.js`, `tests/language.spec.js`, `docs/assets/app.js`, `docs/assets/render/map-layers.js`, `dev-docs/plan/issue_65/**`.
- Files that must not change: `data/generated/**`, `docs/data/**`, measurement CSVs under `.chatgpt/tool-tests/render-stats/**`, unrelated `.chatgpt/**`, unrelated Graphify output.
- Generated artifact policy: edit source and tools first; run `npm run build` to regenerate checked-in Pages assets from source when browser behavior changes; do not hand-edit generated Pages output; do not commit generated measurement CSV files.
- Stop conditions: instrumentation cannot produce trustworthy setup validation; canonical hit-path reuse breaks interaction identity or browser event targeting; measurement evidence shows no meaningful duplication to target; candidate requires broad renderer rewrite; validation failures cannot be resolved without expanding scope.
- Target interaction: map startup/setup, hover, click selection, pan/zoom sampling, world-wrap seam hover/click, and complex overlay setup.
- Reproduction scenario: `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6` with debug render stats covering default single-copy, complex single-copy, world-wrap, and complex world-wrap scenarios.
- Baseline metrics: `visibleSvgNodeCount`, base visual region path/use counts, hit path/use counts, copied hit/base counts, path-data bytes, `panFrameMsAvg`, `panFrameMsMax`, setup validation, and interaction probe counters.
- Measurement method: compare scenario medians across repeats and zoom steps; treat max frame time as noisy secondary evidence; use setup rows with `setupOk=true` and empty `setupFailures`.
- Before/after comparison method: if a candidate is attempted, compare baseline versus guarded candidate rows for geometry bytes, path/use counts, visible node count, and pan timing while requiring interaction tests to pass.
- Non-success outcome: keep instrumentation and document why canonical hit-path reuse should not be shipped yet, with guidance for #60.

## Strategy

- Keep Phase 1 instrumentation behavior-neutral and commit it before any candidate.
- Use Phase 2 measurements to decide whether the issue should stop as instrumentation/profiling or proceed to a guarded candidate.
- If proceeding, keep canonical hit-path reuse behind `debugUseCanonicalHitPaths=1` until evidence and tests prove it is safe to ship.
- Preserve explicit region identity on interactive nodes so event handling does not depend on fragile SVG `<use>` shadow-instance behavior.
- Prefer source changes in `src/**` and regenerate `docs/assets/**` through `npm run build`.

## Phase Order

1. [Recon and baseline map](01-recon.md)
2. [Region geometry instrumentation](02-instrumentation.md)
3. [Baseline measurements and decision](03-measurement.md)
4. [Guarded canonical hit-path candidate](04-candidate.md)
5. [Keep discard and final report](05-report.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond the issue body and local context note.
- Phase 2 depends on Phase 1 confirming the relevant render/stat paths.
- Phase 3 depends on Phase 2 counters and measurement columns.
- Phase 4 depends on Phase 3 evidence showing meaningful hit-path geometry duplication and a low-risk candidate path.
- Phase 5 depends on either Phase 3 no-candidate decision or Phase 4 candidate evidence.

## Source Of Truth Decisions

- GitHub issue #65 is the authoritative scope and acceptance-criteria source.
- `dev-docs/plan/issue_65/issue_65_implementation_context.md` is supporting context and guardrails, not a replacement for the issue.
- This phased plan records implementation decisions and evidence for this local run.
- Current source, generated output verifiers, and test results are authoritative over prior conversation memory.

## Generated-file Policy

- Do not hand-edit `docs/assets/**`; regenerate via `npm run build`.
- Do not commit generated measurement CSVs under `.chatgpt/tool-tests/render-stats/**`.
- Do not modify `data/generated/**` or `docs/data/**` for this issue.
- If generated Pages output changes, summarize it as rebuilt from source.

## Global Validation Expectations

- `npm run build`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`
- `npm run verify`
- `npx playwright test tests/map-wrap.spec.js`
- `npx playwright test tests/language.spec.js`
- `npm run test:e2e`

## Known Risks And Assumptions

- Hit paths are interaction infrastructure, not just visual nodes.
- SVG `<use>` event targets can differ by browser, so tests must verify region resolution through the actual target path.
- A `<use>` strategy may reduce duplicated path-data bytes without reducing DOM node count.
- `panFrameMsMax` is noisy; median and scenario-level comparisons are stronger evidence.
- Existing tests query `path.region-hit`; a guarded candidate may need tests that cover both path and use-backed hit nodes without weakening interaction assertions.

## Completion Classification Rules

- Complete: required counters and measurements are implemented, issue scenarios are measured, tests pass, candidate is either safely kept with before/after evidence or explicitly rejected with evidence, and final documentation is written.
- Partially complete: instrumentation or measurements are useful but some required scenario, validation, or decision evidence is missing.
- Preparation / instrumentation only: counters and measurement support are added, but no optimization is attempted or kept because evidence does not justify it.
- Blocked: measurement or validation cannot run after repeated attempts due an external blocker.
- Needs follow-up issue: the next improvement requires broad renderer architecture work, browser-specific event research, or #60-scale replication audit.

## Final Audit Checklist

- [x] Final diff reviewed against issue body and user request.
- [x] Final diff reviewed against this master plan.
- [x] Phase acceptance criteria checked.
- [x] Validation results recorded in `05-report.md` and `issue-65-region-hit-path-profile-result.md`.
- [x] Manual smoke tests explicitly deferred to automated coverage in `05-report.md`.
- [x] Generated-file policy followed: Pages assets rebuilt from source; `.chatgpt/**` measurement outputs ignored and untracked.
- [x] Phase-sized commit flow audited.
- [x] Commit blockers documented when phase-sized commits were skipped: no blockers were encountered.
- [x] Commit-flow classification assigned: compliant with phase-sized commits.
- [x] Completion classification assigned honestly: `Preparation / instrumentation only`.

## Commit Audit Requirements

- Phase-sized commits are required unless the user explicitly says not to commit.
- Commit plan/recon before source implementation when plan files are created or materially updated.
- Commit instrumentation before any candidate optimization.
- Commit candidate changes separately from measurement/report docs when staging is safe.
- Do not stage unrelated untracked files.
- Do not commit generated measurement CSV files.
- Generated Pages output may be committed only when produced by `npm run build` from source changes.
