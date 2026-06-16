# Phase 01: Discovery, baseline, and plan gate

## Goal

- Establish the issue #44 source of truth, current pan-path evidence, and executable plan before source implementation.

## Scope

- Read the GitHub issue, repository instructions, and relevant pan/render/test code.
- Record the user-visible "not sufficiently improved" definition in the master plan.
- Capture baseline counters for the required plain and heavy zoomed-pan scenarios.
- Run plan validation and plan gate.

## Non-goals

- Do not edit `src/**` or tests in this phase.
- Do not claim a performance improvement from baseline evidence alone.
- Do not review generated build output line-by-line.

## Affected files

- `docs/plan/issue_44/00-master-plan.md`
- `docs/plan/issue_44/01-discovery-baseline.md`
- `docs/plan/issue_44/02-optimization-loop-1.md`
- `docs/plan/issue_44/03-verification-final-audit.md`

## Implementation steps

- Confirm issue #44 is open and scoped to zoomed pan responsiveness and repaint/flicker.
- Inspect `src/app.js`, `src/render/map-layers.js`, and existing Playwright pan tests.
- Build current Pages output once so browser baseline uses current source-derived app output.
- Inject read-only browser counters for current `viewBox`, grid, rect-read, and frame-latency behavior.
- Record the baseline below and commit this planning phase before source implementation.

## Acceptance criteria

- The plan states the user-visible target symptoms and the "not sufficiently improved" definition.
- Baseline evidence includes one plain zoomed-pan scenario and one heavier dynamic-layer scenario.
- Baseline evidence includes `panFrameMs` or equivalent timing, `gridRebuildsDuringPan`, `panViewBoxApplyCount`, `panSvgRectReads`, and node-count context.
- No source implementation starts before the plan gate passes.

## Validation commands

- `npm run build` - passed; wrote `docs/index.html` and generated assets.
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py validate --plan-dir docs/plan/issue_44`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py gate --plan-dir docs/plan/issue_44 --type performance`

## Manual smoke tests

- Baseline browser run used system Chromium headless at 1440x1000 through a local `docs/` HTTP server.
- Full human-visible smoke is reserved for Phase 3 after source changes; this phase captures repeatable baseline evidence.

## Rollback risks

- Plan-only rollback risk is low.
- The baseline build refreshed generated Pages output; generated output should be staged only with the phase where repository policy requires it.

## Evidence

- Target interaction: Zoomed pointer-drag pan after seven zoom-in control clicks.
- Scenario: Plain map, `worldWrap=0`, `debugRenderStats=1`, 150 pointer moves over roughly 2.5 seconds.
- Environment: System Chromium headless via `/snap/bin/chromium`, viewport 1440x1000, local `docs/` server.
- Baseline counters: `panPointerMoveCount=150`, `panViewBoxApplyCount=150`, `gridRebuildsDuringPan=150`, `panSvgRectReads=150`.
- Baseline timings: `panFrameMs avg=0.255ms`, `p95=0.4ms`, `max=4.8ms`; `mapViewApplyMsTotal=3.4ms`; `gridRenderMsTotal=6.1ms`.
- Node counts: Before pan `svgNodeCount=785`, `gridNodeCount=23`, no claim/manual/reachable overlays; after pan `svgNodeCount=839`, `gridNodeCount=23`, one capital marker after hover refresh.
- Interpretation: Plain pan already rebuilds the grid and reads SVG layout on every pointermove, which matches two initial hypotheses and can contribute to visible whole-map churn even without dynamic overlays.
- Scenario: Heavy map after selecting China and pinning three reachable-capital candidates, with claims, capital markers, manual-envelope overlays, and reachable-capital candidates present.
- Baseline counters: `panPointerMoveCount=150`, `panViewBoxApplyCount=150`, `gridRebuildsDuringPan=150`, `panSvgRectReads=150`.
- Baseline timings: `panFrameMs avg=0.258ms`, `p95=0.4ms`, `max=5.7ms`; `mapViewApplyMsTotal=2.0ms`; `gridRenderMsTotal=5.3ms`.
- Node counts: Before pan `svgNodeCount=994`, `gridNodeCount=23`, `claimOverlayCount=56`, `claimLabelCount=3`, `capitalMarkerCount=2`, `manualEnvelopeCount=74`, `reachableCapitalCount=2`; after pan `svgNodeCount=1024`, `capitalMarkerCount=3`.
- Interpretation: Heavy pan has the same repeated grid and layout-read pattern as plain pan, so loop 1 should remove those costs before considering transform preview or culling.
- After: No implementation in this phase.
- Delta: No performance delta claimed in this phase.
- Commit: Pending Phase 1 commit.
- Commit blocker: None known.

## Progress

- Issue #44 context read from GitHub.
- Relevant pan/render/test paths inspected.
- Baseline gathered for the same plain and heavy scenarios required by the objective.
- Plan drafted and ready for helper validation/gate.

## Decision log

- Treat loop 1 as bounded source work: add pan counters, remove grid rebuild from the pan frame path, and cache one SVG viewport rect per drag.
- Defer transform-based pan preview until after evidence proves smaller fixes are insufficient.

## Outcomes / Retrospective

- Baseline is complete; no performance improvement is claimed yet.
