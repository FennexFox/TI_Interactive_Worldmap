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

- npm run lint:js

## Known Risks And Assumptions

- Lazy callbacks must not execute before construction completes; scenario getters always resolve current snapshot.

## Completion Classification Rules

- Complete: All acceptance criteria and checks pass.
- Partially complete: Some behavior/checks remain unresolved.
- Preparation / instrumentation only: Only structural groundwork completed.
- Blocked: External build/input blocker.
- Needs follow-up issue: Independent unresolved work exceeds issue scope.

## Final Audit Checklist

- [ ] Final diff reviewed against issue body and user request.
- [ ] Final diff reviewed against this master plan.
- [ ] Phase acceptance criteria checked.
- [ ] Validation results recorded.
- [ ] Manual smoke test results recorded or explicitly deferred.
- [ ] Generated-file policy followed.
- [ ] Phase-sized commit flow audited.
- [ ] Commit blockers documented when phase-sized commits were skipped.
- [ ] Commit-flow classification assigned.
- [ ] Completion classification assigned honestly.

## Commit Audit Requirements

- Phase-sized commits required: yes, unless the user explicitly says not to commit.
- Plan / baseline phase commit expectation: commit before source implementation when the plan or baseline changed.
- Per-phase commit expectation: commit each implementation phase separately when staging is safe.
- Commit blocker policy: document blocker in the relevant phase plan and final report before proceeding without a phase commit.
- Generated artifact policy: include generated artifacts only when repository policy requires them.
- Commit-flow non-compliance outcome: report separately in Final Audit even if implementation works.
