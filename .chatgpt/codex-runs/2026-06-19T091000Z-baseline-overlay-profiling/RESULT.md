# CODEX_RESULT
status: completed
summary: Added baseline single-copy overlay profiling counters and scenario, recorded fresh evidence, and kept no compound overlay optimization because the measured safe candidates were weak or semantic-risky.
changed_files:
- src/app.js
- tools/measure_debug_render_stats.mjs
- dev-docs/plan/issue_16/00-master-plan.md
- dev-docs/plan/issue_16/04-baseline-overlay-profiling.md
- dev-docs/plan/issue_16/05-compound-visual-overlay-candidate.md
- dev-docs/plan/issue_16/baseline-overlay-profiling-compound-visual-issue.md
- .chatgpt/result.md
- .chatgpt/codex-runs/2026-06-19T091000Z-baseline-overlay-profiling/RESULT.md
commands_run:
- rtk node --check src/app.js
- rtk node --check tools/measure_debug_render_stats.mjs
- rtk npm run build
- rtk proxy npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6
- rtk python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py validate --plan-dir dev-docs/plan/issue_16
- rtk python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py gate --plan-dir dev-docs/plan/issue_16 --type performance
- rtk npm run verify
- rtk npx playwright test tests/map-wrap.spec.js
- rtk npm run test:e2e
- rtk node - <<'JS' ... focused smoke script
- rtk git commit -m "Profile baseline overlay layers" -> 91c8e57
- rtk git commit -m "Record baseline overlay profiling results" -> current HEAD report commit
tests:
- PASS: npm run verify
- PASS: npx playwright test tests/map-wrap.spec.js (28 passed)
- PASS: npm run test:e2e (75 passed)
- PASS: focused smoke script for default wrap off, wrap toggle, claims, hostile hatch, hover overlays, labels, pinned panel, and Korean/English language refresh
acceptance_criteria:
- Fresh worldWrap=0 complex overlay baseline recorded at .chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T09-46-24-773Z.summary.csv.
- Measurement rows include layer-level counters for claim fill/outline paths and uses, hatch groups/paths/clip paths, labels, hit paths, hover overlays, selection outlines, pinned markers, total clip paths, and overlay replacement counters.
- Baseline setup validation passed: 100 rows, all setupOk=true and setupFailures empty.
- wrap-off-complex-overlays median panFrameMsMax=3.750 ms, panFrameMsAvg=0.536 ms, visibleSvgNodeCount=1315.
- No candidate optimization was kept; no-safe-measurable-improvement recorded because label/hit paths dominate and claim outline grouping would conflict with per-region semantic outline expectations.
- docs/assets/** build changes were restored before final status; generated measurement CSVs remained ignored local evidence and were not committed.
blockers:
- None.
followups:
- Profile label rendering/toggling ergonomics next.
- Consider a broader renderer-strategy investigation for labels or hybrid Canvas/SVG visuals while preserving hit paths and semantic overlays.
