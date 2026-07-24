# Phase 01: Plan and performance baseline

## Goal

- Replace the stale monolithic proposal with an executable phased contract and capture reproducible pre-change correctness/performance evidence.

## Scope

- Confirm repository policy, branch/worktree state, architecture ownership, generated-file boundaries, current validation behavior, and performance instrumentation.
- Record current `verify`, E2E, refresh, DOM replacement, timing, node-count, and identity behavior.
- Commit only plan/baseline artifacts before source implementation.

## Non-goals

- No source, test, workflow, dependency, generated-output, or user-visible behavior changes.
- No performance-improvement claim.

## Affected files

- `dev-docs/plan/README.md`
- `dev-docs/plan/architecture-refactor/README.md`
- `dev-docs/plan/architecture-refactor/00-master-plan.md`
- `dev-docs/plan/architecture-refactor/01-baseline.md`
- `dev-docs/plan/architecture-refactor/02-safeguards.md`
- `dev-docs/plan/architecture-refactor/03-browser-runtime.md`
- `dev-docs/plan/architecture-refactor/04-python-pipeline.md`
- `dev-docs/plan/architecture-refactor/05-publishing-tests-docs.md`

## Implementation steps

1. Read repository/skill/Graphify/Serena instructions and verify architecture findings against actual source.
2. Confirm worktree, branch, recent commits, current module/test layout, and generated-output policy.
3. Run the existing verification gate.
4. Run the debug render-stat suite for five repeats and retain ignored raw/summary evidence.
5. Run targeted Playwright scenario/language/wrap checks and record node-identity/current duplicate-refresh observations.
6. Validate and pass the performance Plan Gate.
7. Commit the plan/baseline before source edits.

## Acceptance criteria

- The master and every phase file contain falsifiable acceptance criteria, commands, smoke tests, affected files, rollback risks, evidence, and stop conditions.
- The old proposal is explicitly superseded.
- Baseline evidence identifies environment, repeat count, output location, current failures, and current duplicate refresh/render behavior.
- The performance Plan Gate passes.
- No source or generated file is changed.

## Validation commands

- `npm run verify`
- `npm run test:e2e -- --grep "scenario|language|world wrap"`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0 --pan-steps=4 --summary-json --raw-json --out=.chatgpt/tool-tests/architecture-refactor-baseline`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py validate --plan-dir dev-docs/plan/architecture-refactor`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py gate --plan-dir dev-docs/plan/architecture-refactor --type performance`

## Manual smoke tests

- Inspect `src/app.js` call order for scenario, base-mode, language, and world-wrap transitions.
- Confirm baseline output contains label/overlay replacement counters, SVG counts, and timings.
- Confirm `git diff --name-only` contains only plan files before commit.

## Rollback risks

- The main risk is preserving two competing plans; mitigate by converting the old README to a pointer.
- Baseline output is intentionally ignored and must be summarized in this file before it is cleaned up.

## Evidence

- Target interaction: scenario, base-mode, search, language, and world-wrap refreshes.
- Scenario: checked-in Pages data, Chromium 1400×950, debug render stats enabled.
- Environment: current local Node/Python/Chromium versions are recorded with the baseline results.
- Baseline counters: five repeats completed across 12 wrap/label/overlay scenarios; every wrap-toggle probe replaced labels once, while the post-reset pan probe performed no label or claim-overlay replacement.
- Baseline timings: median `panFrameMsAvg` ranged from 0.800–1.000 ms with wrap off and 1.000–1.675 ms with wrap on; median `panFrameMsMax` ranged from 2.4–3.2 ms off and 3.6–6.2 ms on.
- Node counts: wrap-off setup used 363 base paths, 363 hit paths, and either 363 or 0 labels; wrap-on used 1,089 base paths, 1,089 hit paths, and either 1,089 or 0 labels. Median visible SVG nodes ranged from 805–1,238 off and 2,405–3,695 on.
- Interpretation: source inspection confirms `setActiveScenario()` builds nation choices/incoming claims and then `renderActiveScenario()` calls `populate()`, which builds both again; `renderRegions()` also renders labels, filters, and overlays before the refresh registry repeats those stages. The stable pan counters establish a no-regression boundary, while wrap-toggle label replacement is expected because copy contexts change.
- Raw evidence: `.chatgpt/tool-tests/architecture-refactor-baseline/debug-render-stats-2026-07-24T13-17-09-508Z.json`
- Summary evidence: `.chatgpt/tool-tests/architecture-refactor-baseline/debug-render-stats-2026-07-24T13-17-09-508Z.summary.json`
- After: not applicable; this phase intentionally changes no runtime source.
- Delta: zero by design; this phase freezes the comparison boundary.
- Commit: this plan/baseline phase commit; the immutable hash is recorded in Git history.
- Commit blocker: none.

## Progress

- Discovery and plan draft complete.
- Existing `npm run verify` passed before source changes.
- Five-repeat render-stat baseline completed successfully under Node 24.16.0, Python 3.12.3, Playwright 1.60.0, and the installed Chromium runtime.
- Targeted Playwright scenario/language/world-wrap baseline passed: 40 tests in 16.3 seconds.
- Plan structure validation and the performance Plan Gate passed.

## Decision log

- Keep one integrated branch/PR and five reviewable implementation commits as requested.
- Treat unmeasured structural improvements as preparatory refactoring.
- Do not refresh Unity geometry in this refactor.

## Outcomes / Retrospective

- Validated baseline/instrumentation phase. Existing `npm run verify`, 40 targeted Playwright tests, the five-repeat renderer baseline, plan validation, and the performance Plan Gate passed. No source or generated output changed.
