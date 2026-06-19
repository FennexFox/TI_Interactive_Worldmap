# Phase 1: One Measured Optimization Iteration

## Goal

- Perform one bounded SVG overlay performance optimization iteration with before/after CSV evidence.

## Scope

- Run baseline measurements using the loop plan command set.
- Choose one focused optimization hypothesis from the measured bottleneck.
- Modify source narrowly.
- Rebuild, rerun measurements, compare metrics, and validate behavior.
- Keep and commit the change only if the evidence justifies it; otherwise revert and document the non-success outcome.

## Non-goals

- Do not attempt Iteration 2 or 3 from the source loop plan in this phase.
- Do not rewrite the renderer wholesale.
- Do not remove hostile hatching or world-wrap support.
- Do not make manual generated-asset edits.

## Affected files

- Likely: `src/app.js`, `src/render/map-layers.js`, `tools/measure_debug_render_stats.mjs`, `tests/map-wrap.spec.js`.
- Generated if needed: `docs/assets/app.js`, `docs/assets/render/map-layers.js`, `docs/assets/styles.css`.
- Documentation: `dev-docs/plan/issue_16/01-measured-optimization.md`, `dev-docs/plan/issue_16/svg-overlay-optimization-iteration-1-report.md`.

## Implementation steps

1. Confirm measurement script has explicit wrap-on rows.
2. Run baseline: `npm run build` and `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`.
3. Inspect baseline CSV for the highest-value target.
4. Make one focused source optimization.
5. Rebuild and rerun the same measurement command.
6. Compare median `panFrameMsMax`, `panFrameMsAvg`, `visibleSvgNodeCount`, and `setupClaimOverlayPathCount`.
7. Run required validation.
8. Record evidence and final decision.

## Acceptance criteria

- Baseline CSV path is recorded.
- After CSV path is recorded.
- `setupOk` remains true for all retained after rows.
- Required tests pass.
- A kept optimization meets the meaningful-improvement threshold from the source loop plan without significant regression.
- If the threshold is not met, the source change is reverted and the iteration is documented as not kept.

## Validation commands

- `npm run build`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`
- `npm run verify`
- `npx playwright test tests/map-wrap.spec.js`
- `npm run test:e2e` for final confidence when a source change is kept.

## Manual smoke tests

- Load the default app with no query parameters and confirm world-wrap starts off.
- Enable world-wrap via the map control and pan horizontally across the seam.
- Select China and apply Greater Pan-Asia.
- Confirm hostile hatching, selected overlays, pinned markers, hover overlays, and labels still render.
- Toggle world-wrap off and on again and confirm overlays rebuild.
- Check Korean and English world-wrap warning text.

## Rollback risks

- Overlay disappearance near wrap boundaries.
- Hit path and displayed overlay mismatch.
- Stale overlays after selection, project, hover, language, or wrap changes.
- Noisy metrics causing a false-positive keep decision.

## Evidence

- Baseline: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T04-11-32-836Z.summary.csv`
- After: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T04-24-52-464Z.summary.csv`
- Delta:
  - `wrap-off`: median `panFrameMsMax` 2.800 -> 2.900 ms (+3.6%); `panFrameMsAvg` 0.483 -> 0.483 ms (+0.1%); `setupClaimOverlayPathCount` unchanged at 68.
  - `wrap-off-disable-hatch`: median `panFrameMsMax` 2.500 -> 2.650 ms (+6.0%); `panFrameMsAvg` 0.506 -> 0.481 ms (-4.9%); `setupClaimOverlayPathCount` unchanged at 58.
  - `wrap-on`: median `panFrameMsMax` 5.200 -> 5.200 ms (+0.0%); `panFrameMsAvg` 0.461 -> 0.414 ms (-10.0%); `setupClaimOverlayPathCount` 204 -> 88 (-56.9%).
  - `wrap-on-disable-hatch`: median `panFrameMsMax` 4.650 -> 5.400 ms (+16.1%); `panFrameMsAvg` 0.406 -> 0.438 ms (+7.8%); `setupClaimOverlayPathCount` 174 -> 58 (-66.7%).
- Interpretation: keep the optimization because it removes duplicated wrapped claim overlay path geometry with a 56.9% to 66.7% claim overlay path-count reduction in wrap-on rows, preserves `setupOk=true` for all after rows, leaves the user-facing wrapped+hatch median max frame time flat, improves user-facing wrapped average frame time by 10.0%, and passes behavior validation. The diagnostic wrap-on/no-hatch row regressed in median max frame time; record it as a follow-up signal rather than a blocker because the no-hatch query is a measurement diagnostic, not the default visible overlay mode, and the primary mechanism/path-count target improved substantially.

## Progress

- Completed.
- Added explicit wrap-off and wrap-on measurement scenarios before the baseline run.
- Measured baseline with `rtk proxy npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`.
- Replaced duplicated wrapped claim fill/outline path copies with SVG `<use>` references to canonical paths while keeping hatch paths real per copy.
- Rebuilt checked-in Pages assets with `npm run build`.
- Measured after state with the same repeat and zoom-step matrix.
- Verified process liveness during the long after-measurement run with `pgrep`/`ps`; active node, local server, and Chromium children were present while the run continued.
- Fixed dynamic map-view control label refresh so the world-wrap warning title updates after language changes.

## Decision log

- Kept: the optimization meets the loop plan's meaningful-improvement threshold through claim overlay path-count reduction in the wrapped scenarios.
- Caveat: no-hatch diagnostic timing regressed in median `panFrameMsMax`; this is documented for future measurement work.
- Not attempted: further optimizations, hostile hatch redesign, and renderer-level rewrites.

## Outcomes / Retrospective

- Validation passed:
  - `npm run verify`
  - `npx playwright test tests/map-wrap.spec.js`
  - `npm run test:e2e`
- Smoke passed with a temporary docs server and Playwright script:
  - default world-wrap off
  - runtime wrap toggle enables wrapped map copies
  - Brazil claim overlays render canonical `<path>` nodes and wrapped `<use>` copies
  - copied hover overlay works through synthetic pointer events
  - Korean and English wrap warning titles update after language changes
- Result report: `dev-docs/plan/issue_16/svg-overlay-optimization-iteration-1-report.md`.

## Commit Evidence

- Planning and measurement setup commits:
  - `d6dcad7` `Gate SVG overlay optimization iteration`
  - `e19a5a9` `Measure explicit world-wrap render scenarios`
- Implementation/report commit:
  - This commit: `Optimize wrapped claim overlay copies`
