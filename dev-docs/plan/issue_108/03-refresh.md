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

- Baseline app-runtime.js: 1035 lines; capture after extraction.
- Commit: Will record phase commit after gate.
- Commit blocker: None.

## Progress

- Not started.

## Decision log

- No decisions recorded yet.

## Outcomes / Retrospective

- Not completed yet.
