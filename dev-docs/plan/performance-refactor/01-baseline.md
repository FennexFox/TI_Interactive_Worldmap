# Phase 01: Baseline and scope

## Goal

- Establish a reproducible built baseline and bounded implementation scope.

## Scope

- Candidate 1 and evidence-based assessment of remaining handout candidates.

## Non-goals

- No search semantic changes, geometry extraction, broad caches, wheel scheduling, or deployment.

## Affected files

- Plan files and local measurement artifacts.

## Implementation steps

- Build and verify current sources; run browser suite and repeated render measurement; measure dropdown child-list replacements.

## Acceptance criteria

- Baseline operation counts and validation status recorded before implementation.

## Validation commands

- rtk proxy ./scripts/build-wsl.sh; rtk npm run test:e2e -- --workers=2; rtk npm run measure:render-stats -- --repeats=1 --zoom-steps=0 --scenarios=wrap-off-labels,wrap-on-labels,wrap-on-complex-overlays-labels --summary-json --out=.chatgpt/tool-tests/performance-refactor/baseline

## Manual smoke tests

- Use the built app to type Canada, navigate arrows, choose with Enter, clear selection, and test empty results. Automated browser probes exercise these workflows; record any human visual checks not performed.

## Rollback risks

- Stale cached choices or highlight could select the wrong item; invalidate on catalog/context changes and verify teardown.

## Progress

- Completed baseline build/verify (66 JavaScript and 53 Python tests), lint, and all 74 browser tests. Browser probe recorded 2 dropdown replacements/input and 1/ArrowDown in all five measured repeats after one warm-up.

## Decision log

- Limit implementation to candidate 1: confirmed duplicate work with a direct browser probe. Candidates 2–5 need separate workload-specific cost evidence before accepting additional invalidation/scheduling complexity.
- Installed matching Playwright Chromium 149.0.7827.55 after the initial launch failed because revision 1228 was missing; browser rerun passed.
- General render capture completed against unchanged baseline docs; all three representative presets passed setupOk and hoverProbeOk. Final comparison belongs to phase 3.

## Outcomes / Retrospective

- Baseline is buildable and all checks pass. Debug-off search probe (1440×900, no CPU throttle, one warm-up + five repeats) measured synchronous input dispatch 1.1–1.8 ms and ArrowDown 0.1–0.4 ms; these are JS dispatch durations, not paint latency or perceived responsiveness.
- Browser automation exercised search, language, scenarios, world-wrap and lifecycle; no separate human visual smoke test was performed. Local raw records: `.chatgpt/tool-tests/performance-refactor/search-baseline.json`.

- Measurement refinement: the initial 45-case general-render sweep was stopped before producing a summary because it is disproportionate to the search-only change. Retain all three presets at zoom 0, one capture each, for structural regression evidence only; no timing inference from these samples. The reproducible `tools/measure_search_updates.mjs` uses warm-up `Can` then `Canada`, `Chi`, `China`, `Seoul`, `Canada`; baseline input 1.2–2.2 ms, arrows 0.1–0.4 ms, and the same 2/1 replacement counts. This supersedes the initial repeated-Canada timing probe.
