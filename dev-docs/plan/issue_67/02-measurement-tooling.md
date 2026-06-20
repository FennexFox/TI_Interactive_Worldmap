# Phase 02: Fill measurement gaps without user-visible behavior changes

## Goal

- Fill only the measurement gaps that prevent a reliable #67 diagnosis, without changing normal user-facing renderer behavior.

## Scope

- Update `tools/measure_debug_render_stats.mjs` when scenario orchestration or summary columns are missing.
- Add targeted debug render-stat counters in `src/**` only if existing counters cannot distinguish a requested cost center.
- Add focused tests only for new debug flags, DOM structure expectations, or interaction behavior touched by instrumentation.

## Non-goals

- Do not optimize renderer behavior in this phase.
- Do not make debug-only modes default.
- Do not change normal labels, world-wrap, hover, click, claim overlay, language, or scenario behavior.
- Do not commit generated measurement CSV/JSON files.

## Affected files

- Likely: `tools/measure_debug_render_stats.mjs`
- Possible: `src/app.js`, `src/render/map-layers.js`, `tests/map-wrap.spec.js`, `tests/language.spec.js`
- Documentation: `dev-docs/plan/issue_67/**`

## Implementation steps

- Start from Phase 01 gap list.
- Prefer measurement-script additions over app source changes when the missing data can be collected from existing DOM/debug stats.
- Keep query flags explicit (`worldWrap`, `debugDisableLabels`, `debugUseCanonicalHitPaths`, `debugRenderStats`).
- Preserve ignored output paths for raw measurements.
- Update phase evidence with what changed and why.

## Acceptance criteria

- Any added metric directly answers a #67 question.
- New instrumentation is gated by existing debug-stat paths or measurement script logic.
- Normal app behavior is unchanged.
- Measurement output includes enough information to compare wrap on/off, labels on/off, selected overlay, hover overlay, and canonical hit-path debug A/B scenarios.
- Focused syntax/unit/e2e validation relevant to touched files passes before Phase 03.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e
- npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --summary-json --raw-json --include-canonical-hit-paths

## Manual smoke tests

- Open the map with worldWrap=0 and worldWrap=1 and confirm hover, click selection, labels, and capital hover overlays behave normally.

## Rollback risks

- Medium: instrumentation can perturb timings. Mitigation: keep counters simple, reuse existing debug-only collection, and interpret timing deltas conservatively.
- Medium: extra scenarios can make benchmark runtime too high. Mitigation: keep the matrix small and repeatable.

## Evidence

- Baseline: Pending Phase 01 gap list.
- After: Pending.
- Delta: Pending.
- Interpretation: Pending.
- Commit: Pending.
- Commit blocker: None known.

## Progress

- Not started.

## Decision log

- No decisions recorded yet.

## Outcomes / Retrospective

- Not completed yet.
