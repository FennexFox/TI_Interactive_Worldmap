# Phase 01: Recon and baseline map

## Goal

- Identify the current base region rendering, hit path rendering, debug stat collection, measurement scenarios, and interaction assumptions before source changes.

## Scope

- Inspect `src/render/map-layers.js`, `src/app.js`, measurement tooling, and relevant Playwright tests.
- Record current assumptions about path duplication and event-target resolution.
- Do not change source behavior in this phase.

## Non-goals

- No instrumentation changes.
- No canonical geometry candidate.
- No generated output rebuilds except if needed to verify current state.

## Affected files

- `dev-docs/plan/issue_65/01-recon.md`
- `dev-docs/plan/issue_65/00-master-plan.md`

## Implementation steps

1. Read issue #65 and local context note.
2. Map region visual and hit rendering functions.
3. Map existing debug render stat and measurement CSV columns.
4. Identify tests that assert hit path identity, wrapping, hover, click, labels, overlays, and language behavior.
5. Record the recon findings and decide instrumentation scope.

## Acceptance criteria

- Current hit-path duplication mechanism is identified.
- Current measurement gaps are identified.
- Candidate risk points are listed before implementation.

## Validation commands

- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py validate --plan-dir dev-docs/plan/issue_65`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py gate --plan-dir dev-docs/plan/issue_65 --type performance`

## Manual smoke tests

- Not applicable; this is read-only discovery.

## Rollback risks

- Low; plan-only changes can be reverted if scope is wrong.

## Evidence

- Baseline: `renderHitLayer()` currently emits a full `path.region-hit` with `d=region.path` for every region and every world copy.
- After: not applicable for read-only recon.
- Delta: current measurement only exposes `hitPathCount` and does not separate hit `<path>` versus `<use>` nodes or path-data byte duplication.
- Interpretation: instrumentation should be behavior-neutral and should measure both DOM node count and duplicated geometry size before any candidate.

## Progress

- Completed during discovery.

## Decision log

- Use `src/render/map-layers.js` as the source rendering boundary for any future candidate.
- Extend `src/app.js` debug stat sampling and `tools/measure_debug_render_stats.mjs` CSV output for instrumentation.
- Keep tests focused on interaction behavior rather than only DOM structure if a `<use>` candidate is attempted.

## Outcomes / Retrospective

- Recon found a clear measurement gap and a high-risk interaction surface, so phased instrumentation before optimization is required.
