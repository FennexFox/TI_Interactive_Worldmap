# SVG Overlay Performance Optimization Loop Plan

## Purpose

Create a bounded, measurement-driven workflow for optimizing SVG overlay rendering in TI Interactive Worldmap. The focus is hostile claims overlay, hatching, overlay copy amplification under world-wrap, and avoiding regressions in claim/selection/hover rendering.

This is a local planning document. It is intended for iterative implementation sessions and can be removed or revised before a release PR if desired.

## Current Context

Recent work established the following baseline conditions:

- Debug render statistics are available through `window.__TI_DEBUG_RENDER_STATS__` when `debugRenderStats=1` is enabled.
- `tools/measure_debug_render_stats.mjs` runs automated pan/zoom render measurements and writes CSV summaries under `.chatgpt/tool-tests/render-stats/`.
- The measurement script now records setup validation fields such as:
  - `setupOk`
  - `setupFailures`
  - `setupClaimOverlayPathCount`
  - `setupPinnedRegionMarkerCount`
  - `setupPinnedRegionsPanelChildCount`
  - `visibleSvgNodeCount`
  - `worldCopyContextCount`
  - `hostileHatchDisabled`
  - `panFrameMsAvg`
  - `panFrameMsMax`
- Default measurement setup targets `CHN + JPN + THA` unless overridden by CLI flags.
- World-wrap now defaults off and can be enabled explicitly with `worldWrap=1` or the runtime map control.
- Because world-wrap defaults off, measurement plans that study wrap amplification must explicitly include wrap-on scenarios. A `debugRenderStats=1` default scenario alone is no longer sufficient to measure wrapped rendering.
- Checked-in Pages assets may be rebuilt by implementation work, but this plan itself should not force asset changes.

Recent measurements suggest:

- World-wrap is the largest performance multiplier because it increases overlay copies and visible SVG nodes.
- Hostile hatching has measurable cost, but the effect is smaller than world-wrap copy amplification.
- With world-wrap enabled, claim overlay path count roughly scales with the number of world copies.
- Pan/zoom spikes are more important than average frame cost for perceived responsiveness.

## Primary Goals

1. Reduce worst-case overlay pan/zoom spikes, especially `panFrameMsMax`.
2. Reduce overlay path/node count without changing visual meaning.
3. Keep hostile claims overlay, selected claims, pinned regions, hover overlays, labels, hit paths, and world-wrap behavior visually correct.
4. Make every optimization decision evidence-based through before/after CSV comparisons.
5. Avoid broad renderer rewrites unless smaller changes cannot produce meaningful improvement.

## Non-Goals

- Do not remove hostile claims overlay or hatching as a performance shortcut.
- Do not remove world-wrap support; it may remain optional and default-off.
- Do not rewrite the renderer wholesale in this loop.
- Do not optimize by reducing interaction correctness or hit-path coverage.
- Do not claim success based only on subjective smoothness.

## Key Files And Areas

Likely source areas:

- `src/app.js`
  - app state, debug stats, map controls, selection/pin/hover orchestration
- `src/render/map-layers.js`
  - world copy plan, projected region rendering, overlays, labels, hit paths
- `tools/measure_debug_render_stats.mjs`
  - automated measurement, CSV summaries, setup validation
- `tests/map-wrap.spec.js`
  - world-wrap behavior coverage
- `tests/language.spec.js` or other e2e tests
  - UI text/debug key expectations if diagnostics change
- `docs/assets/*`
  - generated Pages assets, only include when intentionally rebuilding deployment output

## Measurement Commands

Use the same command set before and after each candidate change.

```bash
npm run build
npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6
npm run verify
npx playwright test tests/map-wrap.spec.js
```

Measurement prerequisite for Iteration 1:

The measurement script must include explicit wrap-on rows before any world-wrap amplification optimization is evaluated. If the script does not already emit them, first update `tools/measure_debug_render_stats.mjs` so the scenario set includes at least:

- `wrap-off`: `debugRenderStats=1&worldWrap=0`
- `wrap-off-disable-hatch`: `debugRenderStats=1&worldWrap=0&disableHostileHatch=1`
- `wrap-on`: `debugRenderStats=1&worldWrap=1`
- `wrap-on-disable-hatch`: `debugRenderStats=1&worldWrap=1&disableHostileHatch=1`

The old `debugRenderStats=1` scenario is ambiguous after world-wrap became default-off. It may remain as a smoke/default row, but it must not be used as evidence for world-wrap-on performance.

For final confidence, also run:

```bash
npm run test:e2e
```

Optional targeted world-wrap measurement:

```bash
npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --raw-json
```

Use the latest CSV in `.chatgpt/tool-tests/render-stats/` for comparison.

## Metrics To Compare

Primary metrics:

- `panFrameMsMax`
- `panFrameMsAvg`
- `visibleSvgNodeCount`
- `setupClaimOverlayPathCount`
- `worldCopyContextCount`

Setup validation metrics:

- `setupOk` must remain `true` for all rows.
- `setupFailures` must remain empty.
- `setupPinnedRegionMarkerCount` and `setupPinnedRegionsPanelChildCount` should indicate that the multi-selection/pinned setup is still present.

Interpretation notes:

- `panFrameMsMax` is more important than `panFrameMsAvg` for user-visible stutter.
- `setupClaimOverlayPathCount` is useful for detecting overlay copy/path reductions.
- `setupPinnedRegionMarkerCount` is a coarse DOM signal, not an exact selected-nation count.
- A change that reduces DOM/path count but breaks visuals is not acceptable.

Meaningful improvement threshold:

- Use median values over repeats for noisy frame metrics instead of relying on a single worst row.
- Prefer comparing the median `panFrameMsMax` for each scenario/zoom bucket, plus the overall worst retained row as a secondary signal.
- A change is worth keeping if the targeted scenario improves by at least about 10% in median `panFrameMsMax`, or reduces `visibleSvgNodeCount` / `setupClaimOverlayPathCount` by at least about 10%, with no more than about 5-10% regression in other primary metrics.
- Smaller improvements may be kept only if the code simplification is clear and verification remains strong.

## Optimization Loop Rules

Each loop iteration must follow this structure:

1. Record baseline CSV path and relevant metrics.
2. Choose one optimization hypothesis.
3. Make a small, focused source change.
4. Rebuild and rerun the same measurement command.
5. Compare before/after metrics.
6. Run verification commands.
7. Keep the change only if:
   - `setupOk` remains true,
   - tests pass,
   - visual behavior is preserved,
   - the targeted metric meets the meaningful-improvement threshold above without a significant regression elsewhere.
8. Revert the change if the benefit is unclear or correctness is affected.
9. Stop after at most three optimization iterations in one session.

## Suggested Iterations

### Iteration 1: Reduce world-wrap overlay copy amplification

Hypothesis:

When world-wrap is enabled, overlays may be copied more broadly than needed. Expensive overlay layers may not need the same copy strategy as base regions and hit paths.

Scope:

- Inspect how `src/render/map-layers.js` builds world copies for projected regions, hit paths, labels, and overlay layers.
- Inspect `src/app.js` overlay orchestration and claim/hostile overlay fragment builders, because expensive claim/hostile path creation may happen before or outside the low-level map-layer copy plan.
- Determine whether base geography/hit paths need full wrapping while certain overlays can be limited to visible or central copies.
- Preserve correct appearance when `worldWrap=1` is enabled.

Acceptance criteria:

- Explicit `wrap-on` and `wrap-on-disable-hatch` measurement rows exist before optimization starts.
- `setupClaimOverlayPathCount` decreases for world-wrap-on scenarios or wrapped overlay generation becomes less expensive.
- Median `panFrameMsMax` for wrap-on scenarios improves by about 10%, or another primary metric improves by the defined threshold without a 5-10% regression elsewhere.
- Map wrap interactions still pass `tests/map-wrap.spec.js`.
- No visible disappearance of selected, hostile, hover, or pinned overlays near wrap boundaries.

Rollback triggers:

- Overlay disappears at the horizontal seam.
- Hit paths or selected regions mismatch displayed regions.
- `setupOk` fails or setup count signals collapse.

### Iteration 2: Reduce hostile hatch overhead

Hypothesis:

Hostile claims hatching adds extra paths/pattern work. The same visual meaning may be achieved with fewer SVG nodes, grouped paths, reused pattern definitions, or more efficient class/style handling.

Scope:

- Inspect hostile claim overlay and hatch generation.
- Prefer reuse/grouping over removing visual information.
- Avoid changes that make hostile claims visually ambiguous.

Acceptance criteria:

- Difference between hatch-on and hatch-off scenarios narrows.
- `visibleSvgNodeCount` or `setupClaimOverlayPathCount` decreases when hatch is enabled.
- `panFrameMsMax` improves or remains stable.
- Hostile claim hatching remains visible and understandable.

Rollback triggers:

- Hostile regions become indistinguishable from friendly/normal claims.
- Hatch styling disappears unexpectedly.
- Localization/UI warnings or toggles become inaccurate.

### Iteration 3: Avoid unnecessary overlay rebuilds

Hypothesis:

Some overlay DOM may be rebuilt when app state has not changed, or pan/zoom may trigger work that should remain viewBox-only.

Scope:

- Check whether overlay regeneration is tied to pan/zoom or only to state changes.
- Ensure panning only updates viewBox/transform where possible.
- Cache stable overlay path strings or grouping data if safe.

Acceptance criteria:

- `mapViewApplyMsMax` remains low.
- `panFrameMsMax` improves or remains stable under repeated panning.
- No stale overlays after selection, pin, project, hover, language, or world-wrap changes.

Rollback triggers:

- Overlay state becomes stale after changing selection/project/pins.
- Hover overlays fail to update promptly.
- Tests reveal wrap/selection regressions.

## Visual Smoke Tests

Run these manually after any kept optimization:

1. Load default app with no query parameters.
2. Confirm world-wrap starts off.
3. Enable world-wrap via map control and pan horizontally across the seam.
4. Select China and apply the Greater Pan-Asia claim project.
5. Add Japan and Thailand via region clicks or the measurement script setup path.
6. Confirm claim gradient, hostile claims/hatching, pinned markers, hover overlays, and labels still render correctly.
7. Toggle world-wrap off and on again.
8. Confirm overlays and markers rebuild correctly after the toggle.
9. Check Korean and English UI text around the world-wrap performance warning.

## Reporting Template For Each Iteration

Use this format in the result note:

```markdown
### Iteration N: <hypothesis>

- Files changed:
  - ...
- Baseline CSV: `.chatgpt/tool-tests/render-stats/...summary.csv`
- After CSV: `.chatgpt/tool-tests/render-stats/...summary.csv`
- Metric comparison:
  - `panFrameMsMax`: before -> after
  - `panFrameMsAvg`: before -> after
  - `visibleSvgNodeCount`: before -> after
  - `setupClaimOverlayPathCount`: before -> after
  - comparison method: median over repeats, plus worst retained row if relevant
- Verification:
  - `npm run verify`: pass/fail
  - `npx playwright test tests/map-wrap.spec.js`: pass/fail
  - `npm run test:e2e`: pass/fail/not run
- Decision: kept/reverted
- Reason:
  - ...
```

## Stop Conditions

Stop the loop when any of the following is true:

- Three iterations have been attempted.
- The next likely improvement requires a broad renderer rewrite.
- Metrics no longer improve meaningfully.
- Visual correctness becomes uncertain.
- Verification time becomes disproportionate for the expected gain.