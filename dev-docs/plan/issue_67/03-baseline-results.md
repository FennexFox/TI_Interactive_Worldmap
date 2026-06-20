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

- Baseline:
  - Attempted full command: `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6 --summary-json --raw-json --include-canonical-hit-paths --out=.chatgpt/tool-tests/render-stats-issue67-full`.
  - The full command was stopped after about 26 minutes because it had completed only about 39 of the expected 400 page loads. At that observed rate the full run projected to multiple hours in this environment, which would not be a practical repeatable project command.
  - Working log retained locally under ignored `.chatgpt/tool-tests/render-stats-issue67-full/measure.log`; no summary JSON was produced before interruption.
- After:
  - Replacement repeated baseline command: `npm run measure:render-stats -- --repeats=3 --zoom-steps=0 --summary-json --raw-json --include-canonical-hit-paths --out=.chatgpt/tool-tests/render-stats-issue67-zoom0`.
  - Replacement zoomed-in command: `npm run measure:render-stats -- --repeats=1 --zoom-steps=6 --summary-json --out=.chatgpt/tool-tests/render-stats-issue67-zoom6`.
  - Zoom-0 artifacts: `.chatgpt/tool-tests/render-stats-issue67-zoom0/debug-render-stats-2026-06-20T05-34-32-954Z.summary.json`, `.summary.csv`, and raw `.json`.
  - Zoom-6 artifacts: summary JSON/CSV under `.chatgpt/tool-tests/render-stats-issue67-zoom6/`.
  - Zoom-0 run produced 60 rows: 20 scenarios, 3 repeats each, no setup failures, no hover-probe failures.
  - Zoom-6 run produced 12 base-scenario rows, no setup failures, no hover-probe failures.
- Delta:
  - Labels: disabling labels removed 363 SVG text nodes in single-copy scenarios and 1089 text nodes in world-wrap scenarios. At zoom 6, wrap-on selected pan max dropped from about 8.4 ms to 4.3 ms with labels disabled; wrap-on complex dropped from about 7.8 ms to 4.9 ms. Wrap-off selected dropped from about 3.2 ms to 2.2 ms.
  - World-wrap: enabling wrap tripled base paths, hit paths, label nodes, and path-data bytes. Initial label-on nodes increased from 1245 to 3728, total region path bytes from about 2.14M to 6.43M, and zoom-0 median pan max from about 3.0 ms to 7.5 ms. Selected zoom-6 pan max was about 3.2 ms wrap-off versus 8.4 ms wrap-on.
  - Selected/claim overlays: selected overlay setup added about 70 nodes in wrap-off label-on scenarios and about 198 nodes in wrap-on label-on scenarios. Claim overlay paths/uses/hatches were visible in setup counts, but pan timing did not increase consistently versus initial/no-selection rows.
  - Complex hover overlay setup: complex scenarios did not materially increase steady-state node counts beyond selected overlay rows. Hover probes succeeded; foreign hover overlay path counts were small (3 wrap-off, 9 wrap-on in selected scenarios) and replacement counters were low.
  - Canonical hit paths: in wrap-on selected label-on scenarios, canonical hit paths reduced total region path bytes from about 6.43M to 4.28M and replaced 1089 hit paths with 1089 uses, but node count increased from 3926 to 4290 and median pan max worsened from about 5.6 ms to 8.4 ms. Wrap-on complex showed the same direction, about 6.2 ms to 7.4 ms.
- Interpretation:
  - Timing does not track path-data byte size alone. Canonical hit paths are the clearest negative control: fewer hit geometry bytes did not improve pan timing.
  - The strongest measured cost signal is the combination of world-wrap copies and labels, especially for worst pan frames at high zoom. Labels are a large visible node contributor, and label disabling consistently lowers worst-frame measurements in the heavier wrap-on/zoomed cases.
  - Claim overlays and hover overlays appear less likely to be the primary pan bottleneck from these measurements. They add visible DOM and replacement events, but the measured pan spikes are better explained by wrapped persistent map/label layers than by overlay generation.
  - The measurement does not directly prove browser paint versus style/layout versus hit testing. Based on counters and timing, the safest classification is SVG/DOM rendering pressure from persistent wrapped layers and labels, with labels as the best focused next target.
- Validation:
  - `npm run build`: passed; no generated diff remained after build.
  - `npm run verify`: passed; generated output verifier passed and Python tests reported 17 tests OK.
  - `npm run test:e2e`: passed; 82 Playwright tests passed.
  - Full 5x4 measurement command: attempted and interrupted due multi-hour projected runtime.
  - Bounded repeated/zoomed measurements: passed and produced ignored summary/raw artifacts.
- Manual smoke tests: Not run separately outside automation. `npm run test:e2e` covered world-wrap, hover/click selection, labels, capital hover overlays, pinned/capital markers, and debug render stats; the measurement harness also exercised hover probes, selected claim overlay setup, wrap toggle probes, and label toggles.
- Commit: Pending.
- Commit blocker: None known.

## Progress

- Completed.

## Decision log

- 2026-06-20: The exact full validation command is not repeatable enough in this environment after Phase 02 expanded the scenario matrix. Replaced it with a 3-repeat zoom-0 run covering all 20 scenarios and a one-repeat zoom-6 run covering the 12 base scenarios.
- 2026-06-20: Treat browser category attribution as inference only. Existing data supports a DOM/SVG pressure diagnosis but does not directly separate paint, style/layout, and hit testing.

## Outcomes / Retrospective

- Phase 03 complete with bounded measurement evidence. The result is diagnostic evidence, not a performance improvement.
