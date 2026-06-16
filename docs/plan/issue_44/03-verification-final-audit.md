# Phase 03: Verification and final audit

## Goal

- Verify issue #44 against the actual user-visible symptoms and classify the result honestly.

## Scope

- Re-run the same plain and heavy zoomed-pan measurement scenarios used for baseline.
- Run build, verify, and available Playwright tests.
- Perform or document manual visual smoke testing for flicker and responsiveness.
- Decide whether loop 1 is enough or whether another measured optimization loop is required.
- Record final audit and commit audit.

## Non-goals

- Do not add a second optimization in this phase unless Phase 2 evidence shows loop 1 is not sufficiently improved and the plan is explicitly updated.
- Do not claim completion from counters alone without a user-visible smoke interpretation.
- Do not hide browser validation blockers.

## Affected files

- `docs/plan/issue_44/03-verification-final-audit.md`
- Additional source/test files only if an explicitly documented loop update is required.
- Generated Pages output only through `npm run build`.

## Implementation steps

- Re-run the baseline measurement script against the changed app and record after values next to baseline values.
- Capture manual or visual smoke evidence for plain and heavy zoomed pan.
- Run required validation commands and record results.
- Run helper phase gates and final audit checklist.
- If not sufficiently improved, update the plan with the next measured hypothesis and run at most two more bounded loops in this issue run.

## Acceptance criteria

- Final audit directly evaluates zoomed pan responsiveness.
- Final audit directly evaluates visible flicker / full-map repaint.
- Same-scenario before/after evidence exists for plain and heavy pan.
- Validation results are recorded with exact pass/fail/blocker status.
- Completion classification is one of Complete, Partially complete, Preparation / instrumentation only, Blocked, or Needs follow-up issue.
- Commit audit reports whether phase-sized commits were made.

## Validation commands

- `npm run build`
- `npm run verify`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npm run test:e2e`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py phase-gate --file docs/plan/issue_44/02-optimization-loop-1.md --type performance`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py phase-gate --file docs/plan/issue_44/03-verification-final-audit.md --type performance`

## Manual smoke tests

- Plain map: zoom in to a detailed regional view, pan continuously for several seconds, and record whether movement feels prompt and whether flicker/full-map repaint is visible.
- Heavy map: select China, pin reachable-capital candidates to create dynamic overlays, zoom in to a detailed regional view, pan continuously for several seconds, and record the same observations.

## Rollback risks

- If final validation fails after generated output is rebuilt, source and generated output may need another build/verification pass before any final claim.
- If browser smoke cannot run on this host, the final classification must reflect the validation gap.

## Evidence

- Baseline: Phase 01 records same-scenario before values.
- After: Pending Phase 2 implementation.
- Delta: Pending Phase 2 implementation.
- Interpretation: Pending final audit.
- Commit: Pending Phase 3 commit or final commit audit.
- Commit blocker: None known.

## Progress

- Pending Phase 2 implementation evidence.

## Decision log

- The final audit must classify the work as incomplete or needing follow-up if manual smoke still observes obvious sluggishness or flicker.

## Outcomes / Retrospective

- Pending final audit.
