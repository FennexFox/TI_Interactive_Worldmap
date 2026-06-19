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

- Baseline:
- After:
- Delta:
- Interpretation:

## Progress

- Pending.

## Decision log

- Pending.

## Outcomes / Retrospective

- Pending.
