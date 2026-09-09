# Measured search and base-color refactor

## Issue Target And Scope Summary

- Issue target: performance-refactor
- Title: Measured search dropdown refactor
- Source investigation: HANDOUT.md; implementation authorized by the 2026-09-09 user request.
- Scope: candidates 1 and 2. Candidate 1 is complete; the follow-up user request authorizes choosing the most promising remaining candidate by estimation. Candidate 2 adds single-last-input base-color reuse with explicit invalidation.

## Strategy

- Implement one bounded search change after measuring the current built application. Preserve query semantics, highlight reset, keyboard selection, ARIA, context/catalog invalidation and teardown.

## Phase Order

1. [Baseline and scope](01-baseline.md)
2. [Search dropdown updates](02-search.md)
3. [Integration and PR](03-verification.md)
4. [Base-color baseline](04-base-color-baseline.md)
5. [Base-color cache](05-base-color-cache.md)
6. [Base-color integration](06-base-color-integration.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.
- Follow-up phases 4 → 5 → 6 extend the completed candidate 1 work; phase 5 starts after baseline validation.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Earlier monolithic plans are input material only unless explicitly retained.

## Global Validation Expectations

- WSL build, npm run verify, npm run lint, full npm run test:e2e, before/after render statistics and dropdown mutation probe. All shell commands use rtk.

## Known Risks And Assumptions

- Wall-clock measurements are noisy and existing render metrics do not measure search latency. Report deterministic operation counts separately from timing; defer other candidates unless measurements justify their invalidation complexity.

## Completion evidence

- Candidate 1 implemented and verified; see [MEASUREMENTS.md](MEASUREMENTS.md) for direct before/after evidence and explicit deferral reasons for candidates 2–5.
- Initial phases 1–3 are complete. Follow-up phases 4–6 implement candidate 2 and update PR #101 against `develop`.

## Follow-up strategy

- Compare visible region order, geometry/path and resolved fill inputs plus normalized world-copy values before constructing SVG descriptors or fragments. Keep only the last applied snapshot. Recompute cheap colors to detect mutable callback outputs; never serialize geometry into a key. Reset/geometry/scenario transitions invalidate. Separate rebuild and skip counters from invocation counters.
