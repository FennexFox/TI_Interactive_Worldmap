# Focused app runtime coordinators

## Issue Target And Scope Summary

- Issue target: #108
- Title: Focused app runtime coordinators
- Source plan: None
- Work type: generic
- Scope: Focused ownership of runtime claim/selection, UI semantics and refresh sequencing.

## Plan Contract

- User-visible problem or feature outcome: Preserve all browser behavior while reducing the 1035-line composition root.
- Implementation scope: Three runtime factories connected by live snapshot getters and existing setContext APIs.
- Non-goals: No performance/feature/data changes, no graph regeneration.
- Acceptance criteria that can fail: Runtime shrinks substantially; lifecycle and all existing unit/e2e checks pass; generated output reproducible.
- Validation commands: npm run lint; npm run test:unit; ./scripts/build-wsl.sh; npm run verify; npm run test:e2e; npm run check:generated; git diff --check.
- Manual smoke tests: Existing e2e coverage exercises scenario/language/search/claims/pins/world-wrap; no separate manual browser session planned.
- Files likely to change: src/runtime/*.js, dev-docs/architecture.md, plan files and generated Pages build.
- Files that must not change: data/manual/**, data/generated/** source contents, graphify-out/**.
- Generated artifact policy: Rebuild checked-in docs with WSL workflow; never hand edit generated artifacts.
- Stop conditions: Stop if a public behavior contract cannot be preserved or required local templates are missing.

## Strategy

- Extract claims first, bind UI second, move ordered refresh actions third.

## Phase Order

1. [Extract claim and selection composition](01-claims.md)
2. [Extract semantic UI bindings](02-ui.md)
3. [Extract refresh sequencing and validate](03-refresh.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Earlier monolithic plans are input material only unless explicitly retained.

## Generated-file Policy

- Rebuild docs only via build script.

## Global Validation Expectations

- Full lint, unit, WSL build/verify, standalone verify, E2E, generated consistency, import cycle check and diff check.

## Known Risks And Assumptions

- Lazy callbacks must not execute before construction completes; scenario getters always resolve current snapshot.

## Completion Classification Rules

- Complete: All acceptance criteria and checks pass.
- Partially complete: Some behavior/checks remain unresolved.
- Preparation / instrumentation only: Only structural groundwork completed.
- Blocked: External build/input blocker.
- Needs follow-up issue: Independent unresolved work exceeds issue scope.

## Final Audit Checklist

- [x] Final diff reviewed against issue body and user request.
- [x] Final diff reviewed against this master plan.
- [x] Phase acceptance criteria checked.
- [x] Validation results recorded.
- [x] Manual smoke test results recorded or explicitly deferred.
- [x] Generated-file policy followed.
- [x] Phase-sized commit flow audited.
- [x] Commit blockers documented when phase-sized commits were skipped.
- [x] Commit-flow classification assigned.
- [x] Completion classification assigned honestly.

## Commit Audit Requirements

- Phase-sized commits required: yes, unless the user explicitly says not to commit.
- Plan / baseline phase commit expectation: commit before source implementation when the plan or baseline changed.
- Per-phase commit expectation: commit each implementation phase separately when staging is safe.
- Commit blocker policy: document blocker in the relevant phase plan and final report before proceeding without a phase commit.
- Generated artifact policy: include generated artifacts only when repository policy requires them.
- Commit-flow non-compliance outcome: report separately in Final Audit even if implementation works.

## Final Audit

- Completion classification: Complete.
- Completed: extracted focused claim/selection, UI semantic binding and refresh owners; reduced composition root from 1,035 to 296 lines (739 fewer, 71%); kept frozen browser API and top-level lifecycle; updated architecture.
- Not completed: no separate manual browser session (automated E2E covers planned flows); no unrelated feature or performance work.
- Validation: full npm lint; npm unit (88 JavaScript + 54 Python); WSL checked-in build/verify; standalone npm verify; 84 Playwright E2E tests; explicit import DFS across 49 source modules without cycles; git diff --check.
- Manual smoke tests: covered by automated browser tests for scenario/language/search/overlays/pins/reachable capitals/pan/zoom/world wrap; lifecycle E2E verifies frozen public API, repeated start/destroy and inert teardown; existing controller unit tests cover removed listeners and canceled frames.
- Generated-file policy: rebuilt four runtime assets with ./scripts/build-wsl.sh --skip-install. No game data or graph changed. Post-commit repeat build left a clean tree; npm run check:generated passed.
- Commit audit: plan/baseline de5fa9f preceded source edits; claims e7aded4, UI 0fa9b2c, refresh/docs/generated 584c652 are reviewable phase commits; phase validation and evidence included; final audit recorded separately. No unrelated changes included; no blockers. Commit flow compliant.
- Known risks: lazy callbacks rely on completing construction before start, as before; live getters resolve the current snapshot. Existing browser suite passed with these boundaries.
- Follow-up recommendation: none required for #108.
