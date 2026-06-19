# Phase 2: Follow-Up Regression And Hostile Hatch Overhead

## Goal

- Investigate the `wrap-on-disable-hatch` regression signal from the prior `<use>` optimization and attempt one safe hostile hatch overhead optimization if evidence supports it.

## Scope

- Run a fresh current-worktree baseline before source edits.
- Compare current baseline against prior report data to decide whether the disable-hatch regression persists, is noisy, or needs follow-up.
- Inspect hostile hatch generation in `src/app.js`.
- Make at most one focused candidate change for hatch overhead.
- Rerun equivalent measurement if a candidate source change is made.

## Non-goals

- Do not remove hostile hatching or hostile claims.
- Do not change claim semantics, project filters, world-wrap behavior, or base map rendering.
- Do not keep generated `docs/assets/**` changes in the final diff unless explicitly requested later.
- Do not commit unrelated files or generated measurement artifacts; commit kept, relevant source/test/planning/report changes normally after verification.

## Affected files

- Likely: `src/app.js`, `tests/map-wrap.spec.js`, `dev-docs/plan/issue_16/02-follow-up-regression-hostile-hatch.md`.
- Local-only measurement outputs: `.chatgpt/tool-tests/render-stats/**`.

## Implementation steps

1. Run `npm run build`.
2. Run `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`.
3. Compare current baseline to prior report data for `wrap-on-disable-hatch`.
4. If a safe hatch optimization is evident, implement it narrowly.
5. Rebuild and rerun the same measurement command for any kept candidate.
6. Revert the candidate if metrics or behavior do not justify it.
7. Record decision and evidence.

## Acceptance criteria

- Fresh baseline CSV path is recorded.
- `setupOk=true` and `setupFailures` empty for measurement outputs used as evidence.
- Follow-up regression is fixed, explained as noisy/resolved, or recorded as known follow-up with evidence.
- Phase 2 either safely reduces hostile hatch overhead or records no safe measurable improvement.
- Any kept source change passes required verification later in the run.

## Validation commands

- `npm run build`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`
- Later run-wide validation if a change is kept: `npm run verify`, `npx playwright test tests/map-wrap.spec.js`, `npm run test:e2e`.

## Manual smoke tests

- Confirm hostile hatching remains visible and understandable.
- Confirm claim overlays still show owned, peaceful, hostile, and filtered project states.
- Confirm world-wrap default off and toggle behavior still works.

## Rollback risks

- Hostile claims become visually ambiguous.
- Hatch clip paths or line paths disappear near wrap copies.
- Measurement noise causes a false-positive keep decision.

## Evidence

- Baseline: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T04-55-58-854Z.summary.csv`
- After: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T05-08-48-468Z.summary.csv`
- Commit: `8eb288f` `Optimize SVG claim overlay rendering`; final evidence recorded in the `Record SVG overlay follow-up evidence` report commit.
- Setup validation: both CSVs contain 80 rows with `setupOk=true` and empty `setupFailures`.
- Follow-up regression check: the prior post-optimization report CSV had `wrap-on-disable-hatch` median `panFrameMsMax` 5.400 ms; the fresh baseline measured 5.200 ms (-3.7%) with the same median `setupClaimOverlayPathCount` of 58. The disable-hatch signal did not worsen on remeasurement and is recorded as timing noise / known residual caveat rather than a source regression requiring rollback.
- Candidate change: hostile hatch clip paths now reference the already-emitted outline path through `<use>` instead of duplicating the full region path inside each hatch clip path.
- Delta, fresh baseline -> after:
  - `wrap-off`: median `setupClaimOverlayPathCount` 68 -> 63 (-7.4%); median `panFrameMsMax` 2.950 -> 2.700 ms (-8.5%); worst `panFrameMsMax` 5.200 -> 3.400 ms.
  - `wrap-off-disable-hatch`: median `setupClaimOverlayPathCount` 58 -> 58 (+0.0%); median `panFrameMsMax` 2.700 -> 2.500 ms (-7.4%); worst `panFrameMsMax` 6.200 -> 3.700 ms.
  - `wrap-on`: median `setupClaimOverlayPathCount` 88 -> 73 (-17.0%); median `panFrameMsMax` 5.600 -> 5.100 ms (-8.9%); median `panFrameMsAvg` 0.479 -> 0.415 ms (-13.4%); worst `panFrameMsMax` 10.700 -> 10.800 ms.
  - `wrap-on-disable-hatch`: median `setupClaimOverlayPathCount` 58 -> 58 (+0.0%); median `panFrameMsMax` 5.200 -> 5.200 ms (+0.0%); median `panFrameMsAvg` 0.469 -> 0.438 ms (-6.6%); worst `panFrameMsMax` 13.000 -> 8.600 ms.
- Zoom-bucket notes: `wrap-on` median `panFrameMsMax` by zoom step was 5.000 -> 5.400 (0), 5.000 -> 5.000 (2), 5.300 -> 5.100 (4), and 8.100 -> 5.100 (6). The only worse bucket was the low-zoom 0 bucket; higher-zoom behavior improved or stayed flat.
- Interpretation: keep the hatch clip-path `<use>` optimization. It removes five duplicated hatch clip-path region paths in single-copy mode and fifteen in wrapped mode, preserves disable-hatch metrics, preserves setup validation, improves median average frame timing, and does not introduce a meaningful retained median max-frame regression. The single worst `wrap-on` row remains noisy and is recorded as residual measurement variance.

## Progress

- Fresh baseline run completed.
- Candidate implemented, rebuilt, measured, and kept.
- Targeted map-wrap behavior validation passed after the candidate.

## Decision log

- Kept `src/app.js` candidate because it reduces hostile hatch path duplication and improves the primary path-count metric for hatch-on scenarios without changing overlay semantics.
- Recorded the original `wrap-on-disable-hatch` timing signal as noisy/residual because the fresh baseline improved relative to the prior report while path counts and setup validation stayed stable.

## Outcomes / Retrospective

- Completed. Phase 2 safely reduced hostile hatch overhead by reusing outline paths for hatch clipping.
- Residual caveat: browser frame-time max values remain noisy; retained decisions rely primarily on setup validation, path-count reduction, medians over repeats, and targeted wrap correctness tests.
