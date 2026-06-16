# Optimize zoomed map pan rendering and reduce SVG repaint churn

## Issue Target And Scope Summary

- Issue target: #44
- Title: Optimize zoomed map pan rendering and reduce SVG repaint churn
- Source plan: GitHub issue #44 and user-provided continuation objective
- Work type: performance
- Scope: Improve the zoomed map pan path so panning feels responsive and no longer visibly behaves like a whole-map repaint, with before/after evidence for a plain map and a heavier dynamic-layer scenario.

## Plan Contract

- User-visible problem or feature outcome: When zoomed into a regional view, dragging the map should track the pointer promptly and should not show obvious flicker, flashing, or full-map repaint behavior.
- Implementation scope: Add pan-specific debug counters/timing, stop grid DOM replacement during ordinary pan frames, cache the SVG viewport rect during a drag, and keep hover/overlay/marker refresh work out of the pan path.
- Non-goals: Do not rewrite the full renderer, do not implement viewport culling in the first loop, do not change claim/reachable-capital semantics, and do not hand-edit generated deployment artifacts.
- Acceptance criteria that can fail: Same-scenario after evidence must show no grid rebuilds during pan, no repeated SVG rect reads during pan, preserved pan viewBox movement, preserved hover/selection/reachable-capital behavior, and a manual visual smoke check without obvious flicker or sluggishness.
- Validation commands: `npm run build`; `npm run verify`; targeted Playwright pan tests; `npm run test:e2e` when the host browser can run it.
- Manual smoke tests: In Chromium, zoom to a detailed regional view and pan continuously for several seconds on a plain map; repeat after selecting China and pinning reachable-capital candidates so claims, capital markers, and manual-envelope overlays are present.
- Files likely to change: `src/app.js`, `src/render/map-layers.js`, `tests/language.spec.js`, `tests/map-wrap.spec.js`, `docs/plan/issue_44/**`, and generated `docs/**` output only through `npm run build`.
- Files that must not change: `data/generated/**` except through generators, `docs/assets/**` except through build output, `node_modules/**`, Playwright reports, and unrelated issue plans.
- Generated artifact policy: Edit source under `src/**` and tests under `tests/**`; rebuild checked-in Pages output with `npm run build` rather than editing `docs/**` by hand; summarize generated diffs at a high level only.
- Stop conditions: Stop or classify honestly if the host cannot run browser validation, if a source edit changes claim or reachable-capital semantics, if loop evidence shows viewBox repaint remains dominant after three bounded loops, or if generated artifacts diverge from source after a clean build.
- Target interaction: Zoomed pointer-drag panning on the SVG map.
- Reproduction scenario: Zoom in seven control-button steps to a detailed regional view, then pan continuously for roughly 2.5 seconds with 150 pointer moves; run once with no selected nation and once after selecting China and pinning three reachable-capital candidates.
- Baseline metrics: Recorded in Phase 01. Both baseline scenarios show 150 pan pointer moves, 150 `viewBox` applications, 150 grid DOM rebuilds during pan, and 150 SVG rect reads during pan.
- Measurement method: Use debug render stats and injected/browser counters for `panFrameMs`, `panViewBoxApplyCount`, `gridRebuildsDuringPan`, `panSvgRectReads`, timing totals, and SVG/dynamic-layer node counts.
- Before/after comparison method: Re-run the same plain and heavy zoomed-pan scenario after each optimization loop and compare counters, timings, node counts, and manual visual observations.
- Non-success outcome: The work is not sufficiently improved if final audit does not directly evaluate responsiveness and flicker/full-map repaint, lacks same-scenario before/after evidence, only improves implementation counters without tying them to zoomed-pan behavior, still observes obvious flicker/sluggishness, or ends as instrumentation/preparation only.

## Strategy

- Use an adaptive loop: measure, identify the dominant bottleneck, apply one bounded optimization, validate, audit, and repeat only if the user-visible symptoms are not sufficiently improved.
- Loop 1 will address measured hot spots already visible in baseline: grid DOM replacement on every pan frame and repeated `getBoundingClientRect()` reads on every pointermove.
- Treat transform-based pan preview as a later option only if after evidence shows `viewBox` repaint remains the dominant visible cause after smaller fixes.
- Keep render modules independent of `appState`; pass state-derived values from `src/app.js` as the existing module boundary requires.

## Phase Order

1. [Discovery, baseline, and plan gate](01-discovery-baseline.md)
2. [Optimization loop 1: pan hot path](02-optimization-loop-1.md)
3. [Verification and final audit](03-verification-final-audit.md)

## Phase Dependencies

- Phase 1 must be committed before source implementation starts.
- Phase 2 depends on Phase 1 baseline evidence and plan gate passing.
- Phase 3 depends on Phase 2 phase gate passing, or on a documented loop/blocker decision if Phase 2 is insufficient.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth for issue #44.
- The GitHub issue body is authoritative for the issue scope and non-goals.
- Generated `docs/**` output is deployment output, not source of truth; source changes belong in `src/**`, `tools/**`, and `tests/**`.
- The baseline ad-hoc browser measurement is evidence for the pre-optimization state and should be compared against post-change measurements using the same scenario.

## Generated-file Policy

- Do not hand-edit generated data or deployment files.
- It is acceptable to run `npm run build` and include generated checked-in Pages output when required by repository policy.
- Generated diffs must not be reviewed line-by-line; report them as rebuilt output from source changes.

## Global Validation Expectations

- `npm run build`
- `npm run verify`
- Targeted Playwright tests covering pan counters and no pan grid rebuild.
- `npm run test:e2e` if Chromium dependencies are available; otherwise document the exact host/browser blocker.
- Manual or visual smoke evidence for plain and heavy zoomed pan.

## Known Risks And Assumptions

- Headless/browser timing values vary by host, so pass/fail should rely on structural pan-path counters plus same-host before/after timing trends.
- The current host's bundled Playwright Chromium is missing `libnspr4.so`; system Chromium at `/snap/bin/chromium` is available and was used for baseline.
- Static grid rendering must still cover the visible map after pan and zoom.
- The after smoke test may reveal that `viewBox` repaint remains visible even after grid and layout-read fixes; that would require a second measured loop rather than overstating completion.

## Completion Classification Rules

- Complete: Same-scenario after evidence directly shows improved zoomed-pan responsiveness and no obvious visible flicker/full-map repaint in both plain and heavy scenarios, while preserving existing behavior and passing validation.
- Partially complete: Some measured pan hot spots are reduced, but one target symptom is not directly improved or not fully verified.
- Preparation / instrumentation only: The result adds counters or scaffolding but does not demonstrate user-visible zoomed-pan improvement.
- Blocked: Required browser/manual validation cannot run after repeated attempts, or an external data/source prerequisite is unavailable.
- Needs follow-up issue: Up to three bounded loops were attempted and evidence shows a larger renderer change, transform preview, or viewport culling is still needed.

## Final Audit Checklist

- [ ] Final diff reviewed against issue body and user request.
- [ ] Final diff reviewed against this master plan.
- [ ] Phase acceptance criteria checked.
- [ ] Same plain zoomed-pan scenario has before/after evidence.
- [ ] Same heavy zoomed-pan scenario has before/after evidence.
- [ ] Zoomed pan responsiveness directly evaluated.
- [ ] Visible flicker / full-map repaint directly evaluated.
- [ ] Validation results recorded.
- [ ] Manual smoke test results recorded or explicitly deferred with blocker.
- [ ] Generated-file policy followed.
- [ ] Phase-sized commit flow audited.
- [ ] Commit blockers documented when phase-sized commits were skipped.
- [ ] Commit-flow classification assigned.
- [ ] Completion classification assigned honestly.

## Commit Audit Requirements

- Phase-sized commits required: yes, unless the user explicitly says not to commit.
- Plan / baseline phase commit expectation: commit Phase 1 before source implementation.
- Per-phase commit expectation: commit each implementation phase separately when staging is safe.
- Commit blocker policy: document blocker in the relevant phase plan and final report before proceeding without a phase commit.
- Generated artifact policy: include generated artifacts only when repository policy requires them.
- Commit-flow non-compliance outcome: report separately in Final Audit even if implementation works.
