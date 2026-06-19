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

- Baseline:
- After:
- Delta:
- Interpretation:

## Progress

- Pending Phase 2 decision.

## Decision log

- Pending.

## Outcomes / Retrospective

- Pending.
