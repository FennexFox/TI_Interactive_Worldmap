# Phase 03: Extract refresh sequencing and validate

## Goal

- Own ordered scenario, language and world wrap transitions.

## Scope

- Own ordered scenario, language and world wrap transitions.

## Non-goals

- Preserve behavior; no new state model or performance work.

## Affected files

- src/runtime/refresh-coordinator.js, src/runtime/app-runtime.js, dev-docs/architecture.md, docs generated build

## Implementation steps

- Move existing responsibility into factory, pass live getters, remove forwarding wrappers.

## Acceptance criteria

- Existing runtime lifecycle and selection tests pass; imports remain acyclic.

## Validation commands

- npm run lint; npm run test:unit; ./scripts/build-wsl.sh; npm run verify; npm run test:e2e; npm run check:generated; git diff --check

## Manual smoke tests

- Existing e2e suite in final phase covers browser flows; separate manual session deferred.

## Rollback risks

- Initialization callbacks remain lazy; snapshot must stay live.

## Evidence

- Baseline app-runtime.js: 1035 lines; After: 296 lines, reduced by 739 (71%). Focused owners are 234/227/193 lines.
- Commit: 584c652; clean post-commit WSL rebuild and npm run check:generated passed.
- Commit blocker: No commit blocker.

## Progress

- Implemented and validated; generated HEAD comparison and post-commit rebuild both pass.

## Decision log

- Preserve the sole composition-root snapshot; coordinator replaces it through a setter before existing catalog/index rebuild and reconciliation. Shell filter semantic callbacks moved to the UI owner; start/destroy remain at root.

## Outcomes / Retrospective

- Validated: full lint, unit (88 JS + 54 Python), WSL build/verify, standalone verify, all 84 E2E tests, import DFS (49 modules, no cycles), and git diff --check pass. Existing lifecycle E2E verifies frozen API, repeated start/destroy and inert destroyed runtime; controller unit tests verify listener removal and canceled scheduled frames. Separate manual browser session not run; automated browser suite covers planned flows.
