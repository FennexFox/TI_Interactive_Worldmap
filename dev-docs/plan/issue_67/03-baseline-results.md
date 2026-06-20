# Phase 03: Collect controlled renderer bottleneck measurements

## Goal

- Collect controlled current-renderer measurements and summarize enough evidence to classify the dominant bottleneck category.

## Scope

- Run the render-stat matrix for wrap on/off, labels on/off, complex selected overlays, hover/capital overlay probes, zoom steps, pan frames, and canonical hit-path A/B.
- Summarize stable metrics in this document or a companion recommendation doc.
- Keep raw CSV/JSON measurement files out of committed source unless explicitly requested.

## Non-goals

- Do not tune the renderer based on intermediate numbers during this phase.
- Do not cherry-pick one noisy run as a conclusion.
- Do not claim browser-engine categories such as paint or style/layout unless supported by available evidence or explicitly marked as inference.

## Affected files

- `dev-docs/plan/issue_67/03-baseline-results.md`
- `dev-docs/plan/issue_67/04-recommendation.md`
- Measurement output under ignored `.chatgpt/tool-tests/render-stats/` as working data.

## Implementation steps

- Run the agreed measurement command with repeats and zoom steps.
- Record command, environment, output file names, and whether setup failures occurred.
- Compare medians or consistent deltas across scenario families: wrap, labels, complex overlays, canonical hit paths.
- Identify where timing changes do or do not track DOM/path/label/overlay counts.

## Acceptance criteria

- Results include default/single-copy, world-wrap, labels disabled, selected/complex overlay, hover overlay, and canonical hit-path debug comparisons.
- Results include pan timing plus node/path/label/hit/overlay counters.
- Interpretation distinguishes evidence from inference.
- Raw measurement artifacts are not committed.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e
- npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --summary-json --raw-json --include-canonical-hit-paths

## Manual smoke tests

- Open the map with worldWrap=0 and worldWrap=1 and confirm hover, click selection, labels, and capital hover overlays behave normally.

## Rollback risks

- Medium: local machine/browser noise may blur small deltas. Mitigation: use repeats, look for consistent large effects, and mark weak evidence honestly.
- Low: long-running e2e/measurement commands may fail because of environment dependencies. Mitigation: record exact failure and continue with narrower evidence where possible.

## Evidence

- Baseline: Pending measurement run.
- After: Not applicable unless Phase 02 changes instrumentation.
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
