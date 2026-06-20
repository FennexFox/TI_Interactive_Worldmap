# Phase 04: Guarded canonical hit-path candidate

## Goal

- If Phase 3 justifies it, test canonical hit-path geometry reuse behind a debug flag while preserving interaction behavior.

## Scope

- Add `debugUseCanonicalHitPaths=1` or equivalent guarded path only if Phase 3 supports proceeding.
- Define canonical hit geometry safely and render hit instances through `<use>` or another low-risk reuse strategy.
- Preserve region identity on interactive elements without depending on browser-specific shadow target behavior.
- Add focused tests for hover/click and seam-adjacent wrapped regions under the guarded path.
- Rebuild generated Pages output from source.

## Non-goals

- Do not make the candidate default unless evidence clearly supports it and tests prove interaction safety.
- Do not change visual region rendering except where needed for measurement comparison.
- Do not weaken tests that protect hit path interaction.

## Affected files

- `src/app.js`
- `src/render/map-layers.js`
- `tests/map-wrap.spec.js`
- Possibly `tests/language.spec.js`
- `docs/assets/app.js`
- `docs/assets/render/map-layers.js`
- `dev-docs/plan/issue_65/04-candidate.md`

## Implementation steps

1. Re-read Phase 3 decision.
2. Implement guarded candidate if justified.
3. Ensure event resolution works from actual interactive nodes.
4. Add focused interaction tests for guarded mode.
5. Run before/after measurement with equivalent scenarios.
6. Keep, default, or discard the candidate based on evidence.

## Acceptance criteria

- Candidate is debug-guarded or explicitly justified as safe default.
- Hover and click work for canonical and wrapped/seam-adjacent regions.
- Tests verify pinned/selection/overlay interactions are not broken by hit path node changes.
- Before/after metrics are recorded if candidate is kept.

## Validation commands

- `npm run build`
- `node --check src/render/map-layers.js`
- `node --check src/app.js`
- `npx playwright test tests/map-wrap.spec.js`
- `npx playwright test tests/language.spec.js`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`

## Manual smoke tests

- Default single-copy hover/click.
- `?worldWrap=1` seam hover/click.
- Guarded candidate URL hover/click if implemented.
- Labels, claim overlays, pinned regions, and language refresh.

## Rollback risks

- SVG `<use>` event targeting may differ from path targeting.
- CSS selectors and tests may depend on `path.region-hit`.
- Hidden-region filtering uses stored hit elements and must continue to update all copies.

## Evidence

- Baseline: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-20T02-19-00-121Z.summary.csv`, 160 rows, 160 setup-valid rows, no setup failures.
- Candidate: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-20T01-50-21-942Z.summary.csv`, 160 rows, 160 setup-valid rows, no setup failures, run with `--canonical-hit-paths-only`.
- Single-copy delta: candidate changes `hitPathCount=363` to `hitPathCount=0`, `hitUseCount=363`, and `hitGeometryDefPathCount=363`; total hit geometry bytes and total region path bytes remain unchanged because one canonical hit definition replaces one direct hit path copy. Visible SVG nodes increase by 364 in the single-copy scenarios.
- World-wrap delta: candidate changes `hitPathCount=1089` to `hitPathCount=0`, `hitUseCount=1089`, and `hitGeometryDefPathCount=363`; total hit geometry bytes drop from 3,212,946 to 1,070,982 (-66.7%), and total region path bytes drop from 6,425,892 to 4,283,928 (-33.3%). Visible SVG nodes increase by 364 in the wrapped scenarios.
- Timing delta: median `panFrameMsAvg` is worse in every candidate scenario in this run, including `wrap-on-labels` 0.406 -> 0.5705 and `wrap-on-labels-disabled` 0.338 -> 0.4915. `panFrameMsMax` is also worse in every candidate scenario.
- Interpretation: canonical hit geometry reuse proves the duplicated byte cost is real and can be measured, but the tested SVG `<use>` form trades path-data bytes for more DOM nodes and slower median pan samples. It should stay behind `debugRenderStats=1&debugUseCanonicalHitPaths=1` and must not become the default behavior in this issue.

## Progress

- Completed.

## Decision log

- Skip this phase if Phase 3 evidence does not justify the candidate.
- Phase 3 justified an A/B candidate because hit paths duplicated base region path-data bytes.
- Keep the candidate as a debug-only measurement control.
- Do not enable canonical hit paths by default because the measured candidate did not improve pan timing and increased visible SVG node counts.

## Outcomes / Retrospective

- Implemented a guarded `debugUseCanonicalHitPaths=1` mode that emits canonical hit geometry definitions and interactive `<use class="region-hit">` instances while preserving region identity datasets.
- Updated render-stat counters and measurement columns to distinguish direct hit paths, hit `<use>` nodes, canonical hit definition path bytes, and total hit geometry bytes.
- Added focused Playwright coverage for single-copy hover/click and wrapped seam hover/click under the guarded mode.
- Validation:
  - `rtk node --check src/render/map-layers.js` passed.
  - `rtk node --check src/app.js` passed.
  - `rtk node --check tools/measure_debug_render_stats.mjs` passed.
  - `rtk npm run build` passed.
  - `rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --canonical-hit-paths-only` passed and wrote `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-20T01-50-21-942Z.summary.csv`.
  - `rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6` passed and wrote `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-20T02-19-00-121Z.summary.csv`.
  - `rtk npx playwright test tests/map-wrap.spec.js` passed.
  - `rtk npx playwright test tests/language.spec.js` passed.
  - `rtk npm run test:e2e` passed.
- Manual smoke tests: explicitly deferred to automated Playwright coverage for hover/click, wrapped seam behavior, labels, claim overlays, pinned regions, and language refresh.
- Commit blocker: none.
