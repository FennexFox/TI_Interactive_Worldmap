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
- Attempted: npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --summary-json --raw-json --include-canonical-hit-paths
- Completed replacement: npm run measure:render-stats -- --repeats=3 --zoom-steps=0 --summary-json --raw-json --include-canonical-hit-paths --out=.chatgpt/tool-tests/render-stats-issue67-zoom0
- Completed replacement: npm run measure:render-stats -- --repeats=1 --zoom-steps=6 --summary-json --out=.chatgpt/tool-tests/render-stats-issue67-zoom6

## Manual smoke tests

- Open the map with worldWrap=0 and worldWrap=1 and confirm hover, click selection, labels, and capital hover overlays behave normally.

## Rollback risks

- Medium: evidence may point to no single target. Mitigation: classify as needs follow-up or preparation/instrumentation rather than forcing a conclusion.

## Evidence

- Baseline:
  - Measured scenarios covered no-selection initial state, selected claim overlays, complex hover-overlay setup, wrap on/off, labels on/off, canonical hit-path A/B, and zoomed-in dense-label state.
  - The exact 5-repeat x 4-zoom validation matrix was attempted but stopped because it projected to a multi-hour run after completing only about 39/400 page loads in about 26 minutes.
- After: Not applicable. This issue produced measurement coverage and a diagnosis; it did not keep a renderer optimization.
- Delta:
  - World-wrap is the largest structural multiplier: initial label-on node count increased from 1245 to 3728, base/hit paths from 363 to 1089 each, and total region path bytes from about 2.14M to 6.43M.
  - Labels are the strongest focused cost signal inside that multiplier: disabling labels removed 363 nodes in single-copy and 1089 nodes in world-wrap scenarios. At zoom 6, wrap-on selected pan max dropped from about 8.4 ms to 4.3 ms; wrap-on complex dropped from about 7.8 ms to 4.9 ms.
  - Claim overlays are comparatively small for pan: selected overlay setup added about 70 nodes wrap-off and about 198 nodes wrap-on; complex overlay setup did not materially increase steady-state node counts beyond selected overlay rows.
  - Hover overlay probes succeeded with small overlay counts. Selected scenarios showed foreign hover overlay paths of 3 wrap-off and 9 wrap-on, with low replacement counts.
  - Canonical hit paths remain a negative result: wrap-on selected total region path bytes dropped from about 6.43M to 4.28M, but node count rose from 3926 to 4290 and median pan max worsened from about 5.6 ms to 8.4 ms.
- Interpretation:
  - Most likely bottleneck category: SVG/DOM rendering pressure from persistent wrapped layers and labels. The data does not directly isolate paint, style/layout, or hit testing, so that category is an evidence-backed inference rather than a profiler-level proof.
  - World-wrap meaningfully changes the bottleneck by tripling persistent map/label/hit geometry and increasing worst pan frames.
  - Labels are a major cost center, especially under world-wrap and zoomed/dense-label conditions.
  - Claim overlays and capital/hover overlays do not appear to be the primary pan bottleneck from this run.
  - SVG path-byte reduction alone should not be revisited as the next optimization strategy; canonical hit paths reduced bytes but worsened timing.
  - Highest-confidence next target: label level-of-detail / label copy policy, especially reducing or deferring wrapped label copies and high-density label rendering while preserving labels by default.
- Recommendation:
  - Open or prioritize one focused label-rendering issue that measures and prototypes label level-of-detail or wrapped-label copy suppression. Keep labels enabled by default. Treat world-wrap as the stress case, but do not start with broad world-wrap layer reduction until label policy is tested.
- Defer or reject for now:
  - Do not make canonical hit paths default.
  - Do not pursue another path-data byte reduction pass without timing evidence.
  - Do not start Canvas/WebGL or hybrid renderer work from this data alone.
  - Do not optimize claim overlay grouping or hover overlay caching as the next step unless a separate hover/selection profiler shows a user-visible problem.
  - Do not remove labels by default.
- Validation:
  - `npm run build`: passed; no generated diff remained.
  - `npm run verify`: passed; generated outputs verified and 17 Python tests passed.
  - `npm run test:e2e`: passed; 82 Playwright tests passed.
  - Measurement replacement commands passed and produced ignored raw/summary artifacts.
- Manual smoke tests: Covered by e2e and measurement automation rather than a separate manual browser session. Relevant passing coverage includes world-wrap, hover/click selection, labels, capital hover overlays, pinned/capital markers, and debug render stats.
- Completion classification: Complete for #67 as a measurement/audit issue, with the explicit caveat that the originally suggested full 5x4 benchmark was replaced by bounded measurements because the expanded full matrix was not practical in this environment.
- Commit: Pending.
- Commit blocker: None known.

## Progress

- Completed.

## Decision log

- 2026-06-20: Recommend label level-of-detail / label copy policy as the next focused optimization target. World-wrap is the multiplier, but labels provide the narrowest next intervention with clear timing and node-count evidence.
- 2026-06-20: Classify canonical hit-path defaulting as rejected for now because byte reduction did not translate into timing improvement.
- 2026-06-20: Keep browser-engine attribution conservative. The data supports SVG/DOM pressure but not a precise paint/style/layout/hit-testing split.

## Outcomes / Retrospective

- Phase 04 complete. The issue delivered an evidence-backed renderer bottleneck audit and a focused next-target recommendation, not a renderer speedup.
