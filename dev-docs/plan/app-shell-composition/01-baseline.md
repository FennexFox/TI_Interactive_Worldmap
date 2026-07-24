# Phase 01: Plan and performance baseline

## Goal

- Freeze an executable contract and capture reproducible correctness, structure, and performance evidence before source edits.

## Scope

- Confirm repository/skill policy, clean branch base, current module ownership, generated boundaries, app-shell structural counts, validation behavior, and renderer measurement scenarios.
- Run the existing verification, targeted browser baseline, and five-repeat render-stat baseline.
- Commit only plan/baseline documentation before source implementation.

## Non-goals

- No source, test, generated-output, UI, schema, or performance behavior change.
- No performance-improvement claim.

## Affected files

- `dev-docs/plan/app-shell-composition/**`
- `dev-docs/plan/README.md`
- ignored `.chatgpt/tool-tests/app-shell-composition-baseline/**` evidence

## Implementation steps

1. Read repository, Graphify, Serena, and phased-workflow guidance and verify graph leads in actual source.
2. Record branch/base/worktree and the baseline `app.js` structural counts.
3. Identify exact existing phase-targeted tests and lifecycle gaps.
4. Run `npm run verify` and the scenario/language/world-wrap correctness baseline.
5. Run the selected wrap off/on complex-overlay variants five times and retain raw/summary JSON.
6. Update evidence, validate the plan structure, and pass the performance Plan Gate.
7. Commit this phase before source edits.

## Acceptance criteria

- All seven plan files contain falsifiable acceptance criteria, validation, smoke tests, affected files, rollback risks, evidence, stop conditions, and commit expectations.
- Baseline evidence records environment, exact scenarios/repeats, output locations, counters/node counts/timing ranges, and failures.
- The source worktree remains unchanged and generated paths remain clean.
- Plan validation and performance Plan Gate pass.

## Validation commands

- `npm run verify`
- `npm run test:e2e -- --grep "scenario|language|world wrap"`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0 --pan-steps=4 --scenarios=wrap-off-labels,wrap-off-labels-disabled,wrap-off-complex-overlays-labels,wrap-off-complex-overlays-labels-disabled,wrap-on-labels,wrap-on-labels-disabled,wrap-on-complex-overlays-labels,wrap-on-complex-overlays-labels-disabled --summary-json --raw-json --out=.chatgpt/tool-tests/app-shell-composition-baseline`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py validate --plan-dir dev-docs/plan/app-shell-composition`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py gate --plan-dir dev-docs/plan/app-shell-composition --type performance`

## Manual smoke tests

- Inspect scenario, language, base-mode, world-wrap, search, overlay, hover, and marker call order using focused source slices.
- Confirm measurement output includes node/replacement/cache/timing fields for each selected scenario.
- Confirm `git diff --name-only` lists only plan documentation before commit.

## Rollback risks

- Ambiguous active plans could misdirect implementation; this plan explicitly treats `architecture-refactor` as completed historical context.
- Raw measurements are ignored, so all durable comparison facts and paths must be summarized here before commit.

## Evidence

- Target interaction: overlay render, hover/pan, scenario/language/base refresh, and world wrap.
- Scenario: checked-in Pages data, Chromium 1400×950, eight wrap/label/complex-overlay scenarios, five repeats, zero zoom steps, four pan steps.
- Environment: commit `f06889d`; Node 24.16.0; Python 3.12.3; Playwright 1.61.1; Chromium 149.0.7827.55; 1400×950 viewport.
- Baseline counters: all 40 captures reported `setupOk=1`. Pan medians for every scenario had zero claim-overlay, claim-label, and label DOM replacements. Wrap-off hover cleanup recorded one foreign-hover replacement; wrap-on recorded zero. Equivalent language probes built the overlay model once and hit claim-overlay descriptors once; wrap-toggle probes hit overlay-model/claim-overlay/claim-label caches once without increasing descriptor builds.
- Baseline timings:
  - wrap off: 0.875 ms pan average / 3.0 ms maximum; complex 0.950 / 3.1 ms;
  - wrap off labels disabled: 1.025 / 3.2 ms; complex disabled 0.675 / 2.1 ms;
  - wrap on: 1.725 / 6.3 ms; complex 1.650 / 5.9 ms;
  - wrap on labels disabled: 1.400 / 5.1 ms; complex disabled 1.150 / 3.9 ms.
- Node counts: wrap-off base/hit counts were 363/363, with 1,238 visible SVG nodes when labels were enabled and 875 when disabled. Wrap-on base/hit counts were 1,089/1,089, with 3,695 visible nodes when labels were enabled and 2,603 when disabled.
- Raw evidence: `.chatgpt/tool-tests/app-shell-composition-baseline/debug-render-stats-2026-07-24T21-33-01-604Z.json`
- Summary evidence: `.chatgpt/tool-tests/app-shell-composition-baseline/debug-render-stats-2026-07-24T21-33-01-604Z.summary.json`
- After: not applicable; no runtime changes in this phase.
- Delta: zero by design.
- Interpretation: the branch starts with stable pan DOM counters and fixed single/wrapped geometry identities. The existing `complexOverlays` probe primes the foreign-hover path but does not simultaneously install every manual-envelope/secondary/reachable overlay, so those cache/lifecycle contracts remain covered by debug/world-wrap E2E and require focused service unit tests during extraction.
- Commit: the phase commit immediately following this evidence update.
- Commit blocker: none.

## Progress

- Repository/skill/Graphify/Serena guidance read.
- Clean branch `refactor/app-shell-composition` created from `f06889d` (`origin/develop`).
- Baseline structure recorded: `src/app.js` 3,656 lines; prior-plan structural count 287 behavior functions, 42 mutable runtime bindings, and 43 direct DOM construction/query sites.
- Plan draft completed and performance Plan Gate passed.
- `npm run lint`, `npm run build && npm run check:generated`, and `npm run verify` passed; verify covered 33 Node tests, 48 Python tests, and generated-output verification.
- The complete Playwright suite passed 73/73 in 22.1 seconds during delegated baseline validation; the local scenario/language grep passed 7/7.
- Eight render-stat scenarios completed five repeats each with no setup failure.
- Source and generated paths remain unchanged; only plan documentation is present in the worktree.

## Decision log

- Use eight measured scenarios: four label/complex-overlay variants for both wrap off and wrap on.
- Treat this refactor as performance-sensitive preparatory architecture work, not a performance improvement.
- Do not reuse pre-PR #85 baseline as the comparison boundary; collect a branch-local baseline.
- Preserve the measurement tool limitation in the evidence instead of overstating “complex overlays” as all overlays simultaneously.

## Outcomes / Retrospective

- Validated baseline/instrumentation phase. The plan structure and performance Plan Gate pass, the clean PR #85 merge commit is the comparison boundary, all correctness baselines pass, 40 renderer captures are retained, and no source or generated output changed.
