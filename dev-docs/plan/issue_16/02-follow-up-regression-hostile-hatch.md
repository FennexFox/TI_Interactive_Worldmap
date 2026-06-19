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

- Baseline:
- After:
- Delta:
- Interpretation:

## Progress

- Pending fresh baseline.

## Decision log

- Pending.

## Outcomes / Retrospective

- Pending.
