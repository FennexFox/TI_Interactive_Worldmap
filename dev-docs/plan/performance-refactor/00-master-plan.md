# Measured search dropdown refactor

## Issue Target And Scope Summary

- Issue target: performance-refactor
- Title: Measured search dropdown refactor
- Source investigation: HANDOUT.md; implementation authorized by the 2026-09-09 user request.
- Scope: candidate 1, eliminating redundant dropdown computation and DOM replacement; assess candidates 2–5 after baseline without bundling speculative caches.

## Strategy

- Implement one bounded search change after measuring the current built application. Preserve query semantics, highlight reset, keyboard selection, ARIA, context/catalog invalidation and teardown.

## Phase Order

1. [Baseline and scope](01-baseline.md)
2. [Search dropdown updates](02-search.md)
3. [Integration and PR](03-verification.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Earlier monolithic plans are input material only unless explicitly retained.

## Global Validation Expectations

- WSL build, npm run verify, npm run lint, full npm run test:e2e, before/after render statistics and dropdown mutation probe. All shell commands use rtk.

## Known Risks And Assumptions

- Wall-clock measurements are noisy and existing render metrics do not measure search latency. Report deterministic operation counts separately from timing; defer other candidates unless measurements justify their invalidation complexity.
