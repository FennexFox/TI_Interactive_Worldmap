# Base-color evidence and PR update

## Goal

- Record verified candidate 2 results and update existing PR #101.

## Scope

- Master plan, phase logs, MEASUREMENTS.md and PR description.

## Non-goals

- Candidates 3–5, game-data extraction, deployment, path serialization, multi-entry geometry caches and changing search semantics.

## Affected files

- Master plan, phase logs, MEASUREMENTS.md and PR description.

## Implementation steps

- Compare operation counts and browser results; review generated scope and invalidation; record limits; commit and push; rewrite PR around final candidates 1+2 scope.

## Acceptance criteria

- Measured reduction and validation are reviewable in the existing PR.

## Validation commands

- rtk git diff --check; rtk npm run check:generated; strict phase-plan validation.

## Manual smoke tests

- Exercise repeated search, language refresh, different visibility, base mode, scenario and world-wrap transitions in the built browser. Automated browser tests/probes are used; record if no human visual check is performed.

## Rollback risks

- Stale SVG colors or geometry if mutable fill/path/copy inputs are omitted. Avoid callback-identity-only keys and verify same-ID changed geometry.

## Progress

- Completed review of the bounded cache, explicit invalidation and generated scope. Before/after evidence is recorded in MEASUREMENTS.md; full validation passed.

## Decision log

- User explicitly authorized choosing by estimated benefit. Candidate 2 processes every visible region and joins long SVG paths on filter refresh, making it the strongest estimated remaining candidate; this is a hypothesis, not a measured ranking.

## Outcomes / Retrospective

- Implementation phase committed as af95e06. WSL build/verify (70 JS + 53 Python), lint, focused browser invalidation and full browser 76/76 passed. Direct before/after records show unchanged-input rebuilds 1→0 with correct changed-input rebuilding. Generated consistency, diff-check and strict six-phase plan validation also passed. Push and PR update complete the handoff.
- No manual human visual review or trace-based paint/FPS measurement; synchronous timing limitations and higher single language-refresh timings are explicitly recorded.
