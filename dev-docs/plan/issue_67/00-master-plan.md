# Renderer bottleneck audit before further optimization

## Issue Target And Scope Summary

- Issue target: #67
- Title: Renderer bottleneck audit before further optimization
- Source plan: dev-docs/plan/issue_67/context.md
- Work type: performance
- Scope: Reuse or extend the existing debug render-stat measurement path to diagnose the renderer's current bottleneck category and document one evidence-backed next optimization target. This issue is an audit and instrumentation task, not a default behavior optimization.

## Plan Contract

- User-visible problem or feature outcome: Future renderer work is guided by measured bottleneck evidence instead of SVG/path-size guesses. Normal map behavior remains unchanged.
- Implementation scope: Planning docs under `dev-docs/plan/issue_67/`; targeted measurement script changes in `tools/measure_debug_render_stats.mjs` if existing output cannot answer #67; targeted debug-stat additions in `src/**` only when needed to classify cost centers; focused tests only when DOM or query-flag behavior changes.
- Non-goals: Do not make canonical hit paths default; do not replace SVG with Canvas/WebGL; do not remove or hide labels by default; do not change claim, hover, click, selection, world-wrap, language, or scenario semantics; do not hand-edit generated output; do not optimize merely because a DOM/path count looks large.
- Acceptance criteria that can fail: The final audit must include wrap on/off, labels on/off, at least one selected-nation overlay scenario, at least one hover-overlay scenario, pan timing, node/path/label/hit/overlay counters, a bottleneck interpretation, one recommended next optimization target, rejected/deferred ideas, normal-behavior validation, and command results.
- Validation commands: `npm run build`; `npm run verify`; `npm run test:e2e`; `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --summary-json --raw-json --include-canonical-hit-paths`. Run focused `npx playwright test tests/map-wrap.spec.js` and `npx playwright test tests/language.spec.js` when instrumentation touches wrap, hit-path, label, hover, or language behavior.
- Manual smoke tests: Open the built app with `?worldWrap=0&debugRenderStats=1` and `?worldWrap=1&debugRenderStats=1`; confirm hover, click selection, labels, pinned/capital markers, and capital hover overlays behave as before. If manual browser verification is not run, record the reason and rely on named Playwright coverage.
- Files likely to change: `dev-docs/plan/issue_67/**`; possibly `tools/measure_debug_render_stats.mjs`; possibly small targeted sections of `src/app.js` and/or `src/render/map-layers.js`; possibly focused tests under `tests/**`.
- Files that must not change: `data/generated/**`, `docs/index.html`, `docs/assets/**`, `docs/data/**`, `graphify-out/**`, `node_modules/**`, `playwright-report/**`, and `test-results/**` except through normal build/test outputs that are not reviewed as source. Generated measurement CSV/raw JSON files must stay under ignored tooling output or be summarized, not committed.
- Generated artifact policy: Source changes must be rebuilt with `npm run build`; checked-in Pages output may change only as build output from source changes and must be summarized at a high level. No generated catalogs or deployment artifacts may be hand-edited.
- Stop conditions: Stop and update the plan if measurement output cannot distinguish timing from DOM/path counts; if Playwright/browser measurement cannot run in the environment; if a required Terra Invicta external data path is missing; if source changes would require a user-visible behavior change; or if current data contradicts the issue assumptions enough to require a narrower follow-up issue.

- Target interaction: Pan, zoom, region hover, region click/selection, selected-claim overlays, capital hover overlays, label rendering/toggling, and world-wrap copies.
- Reproduction scenario: Use `npm run measure:render-stats` against the built static app at 1400x950 with controlled query flags for `worldWrap=0/1`, `debugDisableLabels=1`, complex overlays for the default primary nation/project, and canonical hit-path A/B mode.
- Baseline metrics: Current default renderer counters and timings from existing debug render stats: `panFrameMsAvg`, `panFrameMsMax`, `mapViewApplyMsMax`, visible SVG node count, base/hit/world-copy path/use counts, path-data bytes, label counts/render timings, overlay path/use counts, hover/selection/foreign overlay counts, cache/rebuild/replacement counters, and setup failures.
- Measurement method: Run repeated render-stat measurements, summarize medians or stable deltas across scenarios, inspect raw output only enough to answer #67, and avoid committing measurement files.
- Before/after comparison method: This issue compares controlled current-renderer scenarios and any instrumentation-only additions. If a measurement script/debug-stat gap is filled, compare pre-change capability versus post-change capability rather than claiming a performance speedup.
- Non-success outcome: If measurements are noisy or do not identify a confident target, classify the result as preparation/instrumentation or needs follow-up, and explicitly reject premature optimization.

## Strategy

- First inventory what the current debug-stat and measurement tooling already captures. Fill only the gaps that prevent #67 from distinguishing labels, hit geometry, world-wrap copies, overlays, hover/click selection, pan timing, and setup failures. Then run the controlled matrix, record summarized results in this directory, and make a recommendation that is traceable to the metrics.

## Phase Order

1. [Inventory current measurement coverage](01-discovery.md)
2. [Fill measurement gaps without user-visible behavior changes](02-measurement-tooling.md)
3. [Collect controlled renderer bottleneck measurements](03-baseline-results.md)
4. [Document bottleneck diagnosis and next target](04-recommendation.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.
- Phase 4 depends on completion and validation of phase 3.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Earlier monolithic plans are input material only unless explicitly retained.

## Generated-file Policy

- Follow the repository generated-artifact policy from `AGENTS.md`: inspect and edit source/generator files, not generated deployment or data artifacts. Use build/verification commands to regenerate Pages output only when source changes require it. Measurement CSV/JSON files are working artifacts and should not be committed; final docs should summarize their relevant metrics.

## Global Validation Expectations

- npm run build
- npm run verify
- npm run test:e2e
- npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --summary-json --raw-json --include-canonical-hit-paths

## Known Risks And Assumptions

- The current branch is `issue_67`; `dev-docs/plan/issue_67/` was untracked at intake.
- The issue body and local `context.md` are authoritative for scope.
- `tools/measure_debug_render_stats.mjs` already contains many of the requested scenarios and counters, so new source instrumentation should be justified by an identified missing metric.
- Timing data in local Playwright/Chromium can be noisy; conclusions should rely on repeated runs and large, consistent deltas.
- Canonical hit paths are expected to remain debug-only unless the issue scope changes.

## Completion Classification Rules

- Complete: All #67 acceptance criteria are met, final measurements and recommendation are recorded in this plan directory, normal behavior is validated, and required commands pass or have explicit environment-based explanations.
- Partially complete: Some scenarios or validation commands are missing, but enough evidence exists to narrow the next action honestly.
- Preparation / instrumentation only: The work improves measurement coverage but does not yet produce a reliable bottleneck diagnosis.
- Blocked: Measurement or validation is impossible after repeated attempts because of an environment/external-state issue that prevents meaningful progress.
- Needs follow-up issue: The audit identifies a target that is too large or separate for #67, or the current issue should close with a new focused implementation issue.

## Final Audit Checklist

- [ ] Final diff reviewed against issue body and user request.
- [ ] Final diff reviewed against this master plan.
- [ ] Phase acceptance criteria checked.
- [ ] Validation results recorded.
- [ ] Manual smoke test results recorded or explicitly deferred.
- [ ] Generated-file policy followed.
- [ ] Phase-sized commit flow audited.
- [ ] Commit blockers documented when phase-sized commits were skipped.
- [ ] Commit-flow classification assigned.
- [ ] Completion classification assigned honestly.

## Commit Audit Requirements

- Phase-sized commits required: yes, unless the user explicitly says not to commit.
- Plan / baseline phase commit expectation: commit before source implementation when the plan or baseline changed.
- Per-phase commit expectation: commit each implementation phase separately when staging is safe.
- Commit blocker policy: document blocker in the relevant phase plan and final report before proceeding without a phase commit.
- Generated artifact policy: include generated artifacts only when repository policy requires them.
- Commit-flow non-compliance outcome: report separately in Final Audit even if implementation works.
