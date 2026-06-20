# Phase 01: Inventory current measurement coverage

## Goal

- Inventory existing debug render-stat counters, measurement scenarios, relevant tests, and source boundaries so implementation only fills real measurement gaps.

## Scope

- Read the #67 issue body, `context.md`, package scripts, Graphify navigation report, current measurement script, and focused debug-stat sections in `src/app.js`.
- Identify which #67 metrics and scenarios are already covered.
- Identify missing metrics or scenario gaps that justify source/tool changes.

## Non-goals

- Do not edit source or generated files in this phase.
- Do not run broad benchmark suites as a substitute for understanding the current measurement surface.
- Do not inspect generated deployment/data artifacts except through targeted validation commands.

## Affected files

- `dev-docs/plan/issue_67/**`
- Read-only discovery in `package.json`, `tools/measure_debug_render_stats.mjs`, `src/app.js`, `tests/map-wrap.spec.js`, and `tests/language.spec.js`.

## Implementation steps

- Confirm available npm scripts and measurement command.
- Map existing measurement scenarios to #67 dimensions: wrap, labels, selection/overlay state, hover state, zoom, pan, canonical hit-path A/B.
- Map existing counters to #67 metrics: SVG nodes, visual/hit/world-copy counts, path bytes, labels, overlays, pan timing, setup failures.
- Decide whether Phase 02 needs code changes or can be documentation/measurement-only.

## Acceptance criteria

- Existing tooling coverage is documented in the decision log or evidence section.
- Missing coverage, if any, is specific enough to implement in Phase 02.
- No source or generated artifacts are changed during discovery.
- Plan gate passes before source edits begin.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e
- npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --summary-json --raw-json --include-canonical-hit-paths

## Manual smoke tests

- Open the map with worldWrap=0 and worldWrap=1 and confirm hover, click selection, labels, and capital hover overlays behave normally.

## Rollback risks

- Low: discovery docs may become stale if source changes later. Mitigation: final audit must compare docs against current source and command output.

## Evidence

- Baseline: At intake, `dev-docs/plan/issue_67/` contained only `context.md`; no gated master/phase plan existed.
- After:
  - `package.json` exposes `measure:render-stats` as `node tools/measure_debug_render_stats.mjs`.
  - `tools/measure_debug_render_stats.mjs` already measures wrap on/off, labels on/off through `debugDisableLabels=1`, selected claim overlay setup for `CHN` / `Project_GreaterPanAsia`, complex hover overlay setup, zoom probes, pan probes, and optional canonical hit-path A/B scenarios.
  - `src/app.js` debug stats already include visible SVG node count, base/hit/world-copy path and use counts, path-data byte counts, label counts and render timing, claim overlay counts, hover/foreign/secondary overlay counts, pan frame timing, map-view apply timing, grid render timing, cache/rebuild/replacement counters, world-copy context count, and debug flag state.
  - Current summary output includes pan timing and steady-state counts, but mostly exposes only label rebuild fields from interaction probes.
  - The current scenario matrix configures a selected claim overlay before every measured scenario, so it does not include a true default/no-selection initial map state.
- Delta: Phase 02 should focus on the measurement script, not normal app behavior: add explicit no-selection initial scenarios and surface hover-probe overlay counters/replacement counts in the summary.
- Interpretation: Existing app instrumentation is sufficient for #67's first diagnosis without adding intrusive hover/selection timing inside `src/app.js`. Hover response timing remains "if measurable"; the safer near-term proxy is probe-specific overlay counts/rebuilds plus existing pan/map/label timing.
- Commit: `20e7102` (`Plan renderer bottleneck audit`).
- Commit blocker: None known.

## Progress

- Completed.

## Decision log

- 2026-06-20: Use `context.md` as input material, but make `00-master-plan.md` the source of truth for phased execution.
- 2026-06-20: Treat generated Graphify output as navigation only. Verified measurement leads against `package.json`, `tools/measure_debug_render_stats.mjs`, and targeted `src/app.js` slices.
- 2026-06-20: Do not add app-level hover/selection timing unless Phase 03 evidence proves the current proxies are too weak; adding timing around complex async UI state could perturb the exact interactions being measured.

## Outcomes / Retrospective

- Phase 01 complete. The main implementation gap is measurement orchestration/summary coverage, not renderer source behavior.
