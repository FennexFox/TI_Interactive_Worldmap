# Recursive claim interaction frame performance

## Issue Target And Scope Summary

- Issue target: #103
- Title: Recursive claim interaction frame performance
- Source plan: None
- Work type: performance
- Scope: Actual-input RAF measurement, readable expansion boundaries, and bounded marker rendering costs.

## Plan Contract

- User-visible problem or feature outcome: Reduce long drag/wheel frames with four selected capitals.
- Implementation scope: Measurement tools, SVG styles, interaction lifecycle if needed, regression tests.
- Non-goals: Claim computation caching, geometry extraction, broad base-map filter removal.
- Acceptance criteria that can fail: Repeatable nonempty RAF samples; lower selected-state long-frame costs; distinct depth/overlap/hostile/marker states; passing checks.
- Validation commands: npm run lint:js; ./scripts/build-wsl.sh --skip-install --e2e; repeated frame measurement.
- Manual smoke tests: Inspect Chromium screenshots at initial/3/6 zoom steps with wrap off/on; exercise wheel, drag, hover, pin/unpin and scenario change.
- Files likely to change: tools/measure*.mjs, tests/unit/*, tests/e2e/*, src/styles.css, src/interaction/map-view-controller.js, generated docs output.
- Files that must not change: data/manual, data/generated, claim computation modules, graphify-out.
- Generated artifact policy: Rebuild docs with WSL build script; no hand editing generated output.
- Stop conditions: Missing required runtime or unresolvable regression; document measured non-success rather than claim a fix.

- Target interaction: Drag and wheel zoom.
- Reproduction scenario: 2026/all, wrap off, Beijing → SouthThailand → MalayPeninsula → Java; 1440×1000, three zoom button clicks, 60 drag moves and 36 wheel events; compare no selection.
- Baseline metrics: Gather on unchanged browser styles at HEAD 463e594 before rendering edits; retain raw samples and build/model counters.
- Measurement method: Opt-in tool-side RAF observer, full input and immediately post-viewBox windows; mean/median/P95/max, >33.34 and >50 ms counts/ratios, sample count. Cancel RAF and disconnect observer on stop.
- Before/after comparison method: Same browser/environment and event sequence, three repetitions, pooled interval percentiles; compare candidate styles and final output. No absolute timing CI thresholds.
- Non-success outcome: Instrumentation only or partially complete if measured improvement is absent or visual regressions remain.

## Strategy

- Measure first; retain separate normal/overlap dash rhythms and compare cheap marker styling against transient zoom styling before choosing.

## Phase Order

1. [Reproducible frame measurement](01-measurement.md)
2. [Boundary and marker rendering](02-rendering.md)
3. [Regression and performance audit](03-validation.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Earlier monolithic plans are input material only unless explicitly retained.

## Generated-file Policy

- Rebuild checked-in docs only; summarize artifact changes, inspect source diffs.

## Global Validation Expectations

- npm run lint:js
- ./scripts/build-wsl.sh --skip-install --e2e

## Known Risks And Assumptions

- RAF intervals approximate browser scheduling and paint pressure, not display FPS. Shared-host noise requires repeated comparisons. Dense dash values use non-scaling stroke units.

## Completion Classification Rules

- Complete: Measured improvement and semantic regression checks pass.
- Partially complete: Implementation exists but evidence or regression coverage is incomplete.
- Preparation / instrumentation only: Tools added without proven rendering improvement.
- Blocked: Required runtime/data unavailable after safe alternatives.
- Needs follow-up issue: Separate computation profiling proves another bottleneck.

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
