# Grouped hostile hatches and propagated hostile claims

## Issue Target And Scope Summary

- Issue target: #73 and #72
- Title: Grouped hostile hatches and propagated hostile claims
- Source plan: GitHub issues #73 and #72, no prior repo-local plan.
- Work type: performance plus claim classification.
- Scope: Implement #73 first because #72 explicitly depends on scalable hostile visualization, then implement #72 hostile propagation through successive claim paths.

## Plan Contract

- User-visible problem or feature outcome: hostile claim hatches remain visually available without per-region hatch/clip DOM growth, and downstream claims reached through a hostile intermediate claim display as hostile.
- Implementation scope: grouped pattern/path hostile hatch rendering, default removal of visible per-region claim overlay outlines, direct plus propagated hostile metadata in claim model entries, and focused regression coverage.
- Non-goals: no base map seam/stroke changes, no redesign of recursive merge path UI, no hand edits to generated Pages output, no new Terra Invicta data extraction.
- Acceptance criteria that can fail: default claim overlays have no visible `.claim-overlay` outline nodes; hostile hatch groups are grouped by visual key; `disableHostileHatch` still removes hatches; claim kind filtering treats effective propagated hostile claims as hostile; regression tests cover hostile-intermediate propagation.
- Validation commands: `npm run build`, `npm run verify`, `npm run test:e2e`, focused Playwright tests for hostile hatch and propagation.
- Manual smoke tests: select China / Greater Pan-Asia for direct hostile hatch, toggle hostile hatch disabled mode, select Russia or fixture equivalent for propagated hostile claims, pan at zoom with claims active, verify world-wrap projection.
- Files likely to change: `src/app.js`, `src/data/claim-model.js`, `src/styles.css`, `tests/map-wrap.spec.js`, `tests/language.spec.js`, `tests/state-data-boundaries.spec.js`, rebuilt `docs/**` assets copied from source.
- Files that must not change: external Terra Invicta templates/assets, `data/generated/**` unless a source generator requires it, generated output by hand, unrelated docs.
- Generated artifact policy: edit `src/**` and tests, then run `npm run build` so checked-in `docs` output mirrors source; summarize generated output at a high level only.
- Stop conditions: unable to preserve direct hostile hatch behavior, inability to distinguish direct vs propagated hostile metadata, validation failures that imply a broader model rewrite, or missing source data needed for real-game propagation validation.

- Target interaction: selecting claim overlays, toggling claim kind filters, panning/zooming with hostile overlays active, and recursive/successive claim traversal.
- Reproduction scenario: pre-change China / Greater Pan-Asia with debug stats; single-copy has 56 outline paths, 5 hatch groups, 5 hatch paths, 5 clipPaths, visible SVG nodes 1305. World-wrap has 56 outline paths plus 112 outline uses, 15 hatch groups, 15 hatch paths, 15 clipPaths, visible SVG nodes 3905.
- Baseline metrics: captured with `node tools/measure_debug_render_stats.mjs --repeats=1 --zoom-steps=0 --nation=CHN --project=Project_GreaterPanAsia --extra-nations= --pan-steps=1 --summary-json --raw-json`; summary `debug-render-stats-2026-06-21T05-25-56-952Z.summary.json`.
- Measurement method: compare `claimOverlayPathCount`, `claimOutlinePathCount`, `claimOutlineUseCount`, `claimHatchGroupCount`, `claimHatchPathCount`, `claimClipPathCount`, and `visibleSvgNodeCount` before/after with the same measurement command.
- Before/after comparison method: same scenario and command after implementation; tests assert grouped DOM shape independent of timing noise.
- Non-success outcome: if counters do not improve but semantics are correct, classify as partial/preparatory; if propagation cannot preserve metadata, classify as blocked or needs follow-up.

## Strategy

- Phase 1 (#73): keep claim fill grouping, replace per-region hatch clips with compound hatch paths filled by shared SVG patterns, and stop emitting visible per-region claim overlay outlines by default.
- Phase 2 (#72): compute effective hostile state during cumulative claim composition so inherited downstream regions carry `effectiveHostile` / `propagatedHostile` metadata when a hostile ancestor exists.
- Preserve public DOM semantics where useful through datasets and grouped `data-regions` attributes instead of per-region visible paths.
- Update tests to assert behavior, not obsolete per-region implementation details.

## Phase Order

1. [Issue 73 grouped hostile hatch rendering](01-renderer.md)
2. [Issue 72 propagated hostile claim status](02-propagation.md)

## Phase Dependencies

- Phase 1 must complete before phase 2 because issue #72 deliberately expands hostile visualization and would multiply current per-region hatch/clip objects.
- Phase 2 depends on phase 1 grouped hatch rendering and claim-kind behavior that can use effective hostile metadata.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- GitHub issue bodies are authoritative for acceptance criteria; Graphify is navigation only and source files remain source of truth.

## Generated-file Policy

- Do not hand-edit `docs/**` or `data/generated/**`.
- Run `npm run build` after source edits to update checked-in Pages assets.
- Review generated changes only by targeted diff/stat and verification commands.

## Global Validation Expectations

- `npm run build`
- `npm run verify`
- `npm run test:e2e`
- Before/after `tools/measure_debug_render_stats.mjs` counter comparison for #73.

## Known Risks And Assumptions

- Existing tests assert `.claim-overlay` outline counts and must be moved to grouped hatch/fill assertions.
- Removing visible outlines may require retaining non-visible metadata through datasets for tests and diagnostics.
- The production data may not contain an obvious Russia -> EU downstream hostile path in the current scenario; fixture coverage is sufficient for the model rule if real data is absent or ambiguous.
- Phase-sized commits are expected; the current branch already contains prior issue 74 work.

## Completion Classification Rules

- Complete: #73 grouped hatch rendering and #72 propagated hostile semantics implemented, docs rebuilt, tests and measurement pass with improved hatch/clip counters.
- Partially complete: one issue completes but the other remains unimplemented with a documented blocker.
- Preparation / instrumentation only: only counters/tests/plans change without behavior changes.
- Blocked: source data or model structure prevents preserving required metadata safely.
- Needs follow-up issue: implemented core behavior but UI copy/tooltips need a separate broader design pass.

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
