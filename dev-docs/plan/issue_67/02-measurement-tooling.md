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

- npm run verify
- node --check tools/measure_debug_render_stats.mjs
- npm run measure:render-stats -- --repeats=1 --zoom-steps=0 --summary-json --include-canonical-hit-paths --out=.chatgpt/tool-tests/render-stats-phase2-smoke

Deferred to Phase 03 / final audit because Phase 02 changes only the measurement harness and does not change app source or generated Pages output:

- npm run build
- npm run test:e2e
- npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --summary-json --raw-json --include-canonical-hit-paths

## Manual smoke tests

- Open the map with worldWrap=0 and worldWrap=1 and confirm hover, click selection, labels, and capital hover overlays behave normally.

## Rollback risks

- Medium: instrumentation can perturb timings. Mitigation: keep counters simple, reuse existing debug-only collection, and interpret timing deltas conservatively.
- Medium: extra scenarios can make benchmark runtime too high. Mitigation: keep the matrix small and repeatable.

## Evidence

- Baseline: Phase 01 found no true default/no-selection scenario in the measurement matrix, and the summary output dropped most hover interaction-probe overlay counters even though raw debug stats had them.
- After:
  - Added `wrap-off-initial-labels`, `wrap-off-initial-labels-disabled`, `wrap-on-initial-labels`, and `wrap-on-initial-labels-disabled` scenarios with `claimOverlay: false`.
  - Left canonical hit-path A/B disabled for initial/no-selection scenarios to keep the matrix bounded; canonical A/B remains on all selected/complex overlay scenarios when requested.
  - Added hover-probe summary columns for probe success/failure, hover/claim/foreign/secondary overlay path and region counts, and hover/claim/foreign/secondary overlay replacement counters.
  - Kept all changes in `tools/measure_debug_render_stats.mjs`; no app source, generated data, or generated Pages files were changed.
- Delta: The one-repeat smoke measurement produced 20 summary rows with the new initial scenarios. Initial rows had `setupSelectionOutlinePathCount=0`, `setupClaimOverlayPathCount=0`, `setupOk=true`, and `hoverProbeOk=true`.
- Interpretation: The harness can now compare true no-selection map state against selected/complex overlay states and inspect hover-probe overlay churn from summary output. This is instrumentation/measurement coverage only, not a performance improvement.
- Validation:
  - `node --check tools/measure_debug_render_stats.mjs`: passed.
  - `npm run measure:render-stats -- --repeats=1 --zoom-steps=0 --summary-json --include-canonical-hit-paths --out=.chatgpt/tool-tests/render-stats-phase2-smoke`: passed; wrote ignored summary files under `.chatgpt/tool-tests/render-stats-phase2-smoke/`.
  - Smoke summary parse: passed; 20 rows, expected initial and canonical scenario names, initial no-selection rows had zero selected/claim overlay setup counts, and hover probe summary fields were present.
  - `npm run verify`: passed; generated output verifier passed and Python tests reported 17 tests OK.
- Manual smoke tests: Not run separately in a visible browser during Phase 02. The measurement smoke exercised browser loading, label toggles, selected claim overlay setup, hover probes, wrap toggle probes, and canonical hit-path debug scenarios. Full manual/e2e behavior validation remains for Phase 03/final audit.
- Commit: Pending.
- Commit blocker: None known.

## Progress

- Completed.

## Decision log

- 2026-06-20: Prefer measurement-script scenario/summary changes over app-level timing instrumentation. Existing app debug stats already expose enough counters for Phase 03, and adding new app timings could perturb interaction paths.
- 2026-06-20: Exclude no-selection initial scenarios from canonical hit-path A/B expansion because canonical hit-path evidence is already covered by selected and complex overlay scenarios, while initial scenarios are primarily for baseline DOM/timing comparison.

## Outcomes / Retrospective

- Phase 02 complete as instrumentation-only measurement harness work. It adds no normal app behavior changes and leaves full benchmark/result interpretation to Phase 03.
