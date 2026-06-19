# Phase 3: Overlay Rebuild Gating

## Goal

- Determine whether unnecessary overlay rebuild work can be safely reduced, and keep only a measured, correctness-preserving change.

## Scope

- Inspect claim overlay render keys and buffered layer replacement behavior.
- Confirm pan/zoom remains viewBox-oriented and does not churn overlay DOM.
- Make at most one focused gating/caching candidate if the current evidence shows avoidable rebuild work.
- Rerun equivalent measurement if a candidate source change is made.

## Non-goals

- Do not introduce broad renderer architecture changes.
- Do not skip required overlay updates after selection, project, pins, hover, language, or wrap toggles.
- Do not keep generated `docs/assets/**` changes in the final diff unless explicitly requested later.
- Do not commit unrelated files or generated measurement artifacts; commit kept, relevant source/test/planning/report changes normally after verification.

## Affected files

- Likely: `src/app.js`, `tests/*.spec.js`, `dev-docs/plan/issue_16/03-overlay-rebuild-gating.md`.
- Local-only measurement outputs: `.chatgpt/tool-tests/render-stats/**`.

## Implementation steps

1. Use Phase 2 baseline/after evidence as the input state.
2. Inspect render keys and debug counters for claim overlay buffer replacement, inactive rebuilds, swaps, and stale skips.
3. If avoidable rebuild work is found, implement one narrow candidate.
4. Rebuild and rerun measurement after any candidate.
5. Revert candidate if metrics or tests do not justify it.
6. Record decision and evidence.

## Acceptance criteria

- Phase 3 either safely reduces unnecessary overlay rebuild work or records no safe measurable improvement.
- `setupOk=true` and `setupFailures` empty for measurement outputs used as evidence.
- No stale overlays after selection, project, pins, hover, language, or world-wrap changes.
- Any kept source change passes required verification.

## Validation commands

- `npm run build`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`
- `npm run verify`
- `npx playwright test tests/map-wrap.spec.js`
- `npm run test:e2e`

## Manual smoke tests

- Confirm world-wrap default off.
- Toggle wrap on/off and confirm overlays rebuild.
- Confirm claim overlays, hostile hatching, hover overlays, labels, and pinned markers remain correct.
- Confirm language refresh still updates wrap warning text.

## Rollback risks

- Stale overlays after state changes.
- Delayed hover/selection updates.
- Render-key underfitting that skips a necessary rebuild.

## Evidence

- Baseline: Phase 2 baseline `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T04-55-58-854Z.summary.csv`
- After: Phase 2 after `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T05-08-48-468Z.summary.csv`
- Commit: `b781d05` `Document SVG overlay optimization follow-up phases`; final no-change evidence recorded in the `Record SVG overlay follow-up evidence` report commit.
- Setup validation: both CSVs contain 80 rows with `setupOk=true` and empty `setupFailures`.
- Existing gating evidence:
  - `claimOverlayPathRenderKey` keys claim overlay path buffers by copy plan, descriptor cache key, and hostile-hatch-disabled state.
  - `replaceBufferedLayerChildrenForRenderKey` returns without rebuilding when the current render key already matches.
  - `tests/map-wrap.spec.js` includes `world-wrap default projects claim overlays and markers without pan churn`, which resets debug counters during a wrapped pan and asserts no overlay model builds, claim overlay DOM replacements, claim label DOM replacements, hover replacements, foreign hover replacements, or capital marker rebuilds.
  - `tests/map-wrap.spec.js` includes `world-wrap default hover claim overlays reuse cached descriptors across borders`, which asserts descriptor cache hits and zero claim overlay inactive buffer rebuilds, swaps, and stale skips during cached hover reuse.
- Measurement evidence after Phase 2:
  - `mapViewApplyMsMax` median stayed 0.100 ms for all four scenarios from baseline to after.
  - `visibleSvgNodeCount` medians stayed stable for all four scenarios: 952 (`wrap-off`), 927 (`wrap-off-disable-hatch`), 2834 (`wrap-on`), and 2759 (`wrap-on-disable-hatch`).
  - The only kept source change targeted hatch path duplication; no additional rebuild-gating source change was identified with enough evidence to be safer than the existing render-key gate.
- Delta: no Phase 3 source delta was kept; measured rebuild-adjacent indicators stayed stable (`mapViewApplyMsMax` median 0.100 ms in every scenario, unchanged visible node counts) and existing tests already cover the no-pan-churn path.
- Interpretation: record no new Phase 3 source change. Current code already gates claim overlay DOM replacement for unchanged render keys, and the existing targeted tests verify the relevant no-pan-churn behavior. A further gating change would risk stale overlays after selection, project, hover, language, or wrap changes without clear measurement evidence.

## Progress

- Phase 2 completed with a kept hatch clip-path optimization.
- Phase 3 inspected current render keys, buffer replacement gating, debug counters, and wrap tests.
- No additional source candidate kept.

## Decision log

- No safe measurable Phase 3 improvement was found beyond the existing render-key and buffered-layer gates.
- Record Phase 3 as safely completed with a no-change decision rather than forcing a broader renderer change.

## Outcomes / Retrospective

- Completed as no-change / no-safe-measurable-improvement.
- Follow-up option: if future evidence shows rebuild churn outside the current pan/hover tests, extend the measurement CSV with claim overlay rebuild counters before changing render gating.
