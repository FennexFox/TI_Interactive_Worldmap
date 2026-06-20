# Phase 04: Document bottleneck diagnosis and next target

## Goal

- Document the final #67 bottleneck diagnosis, the highest-confidence next optimization target, and optimization directions to defer or reject.

## Scope

- Convert Phase 03 measurements into a short evidence-backed recommendation.
- Explicitly answer each #67 question.
- Record final validation and normal-behavior evidence.
- Classify the outcome honestly.

## Non-goals

- Do not broaden into implementation of the recommended optimization.
- Do not close related issues by implication unless the evidence directly supports that.
- Do not overstate a performance improvement when the issue delivered measurement only.

## Affected files

- `dev-docs/plan/issue_67/04-recommendation.md`
- Possible final-audit section in `00-master-plan.md`

## Implementation steps

- Summarize measured scenarios and key deltas.
- Identify likely bottleneck category and confidence.
- Recommend one next target.
- List deferred/rejected ideas, including canonical hit-path defaulting if evidence remains negative.
- Record validation commands and manual smoke/e2e coverage.

## Acceptance criteria

- Recommendation cites specific metrics from Phase 03.
- One next optimization target is named.
- Rejected/deferred directions are listed.
- Normal behavior validation is recorded.
- Completion classification is assigned according to the master plan.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e
- npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --summary-json --raw-json --include-canonical-hit-paths

## Manual smoke tests

- Open the map with worldWrap=0 and worldWrap=1 and confirm hover, click selection, labels, and capital hover overlays behave normally.

## Rollback risks

- Medium: evidence may point to no single target. Mitigation: classify as needs follow-up or preparation/instrumentation rather than forcing a conclusion.

## Evidence

- Baseline: Pending Phase 03 results.
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
