# Phase 02: Boundary and marker rendering

## Goal

- Reduce SVG paint cost preserving visual semantics.

## Scope

- Reduce SVG paint cost preserving visual semantics.

## Non-goals

- No computation caches or base-region filter removal.

## Affected files

- src/styles.css, interaction lifecycle if needed, regression tests, rebuilt docs.

## Implementation steps

- Compare dash/marker alternatives, implement measured choice; rebuild and measure.

## Acceptance criteria

- Inspect zoom 0/3/6 with wrap off/on; normal/overlap/depth/hostile and marker distinctions. Measured improvement required for performance completion.

## Validation commands

- npm run lint:js; ./scripts/build-wsl.sh --skip-install; targeted e2e; frame measurement.

## Manual smoke tests

- Inspect zoom 0/3/6 with wrap off/on; normal/overlap/depth/hostile and marker distinctions.

## Rollback risks

- Revert source and regenerate docs together; timings depend on the environment.

## Evidence

- Baseline: Pending phase evidence
- After: Pending phase evidence
- Delta: Pending phase evidence
- Interpretation: Pending phase evidence
- Commit: Pending phase evidence
- Commit blocker: Pending phase evidence

## Progress

- Planned; awaiting gate.

## Decision log

- Preserve semantics and isolate phase commits.

## Outcomes / Retrospective

- Pending execution.
