# Phase 01: Extract claim and selection composition

## Goal

- Own claim presentation, map presentation/output and selection composition.

## Scope

- Own claim presentation, map presentation/output and selection composition.

## Non-goals

- Preserve behavior; no new state model or performance work.

## Affected files

- src/runtime/claim-selection-runtime.js, src/runtime/app-runtime.js

## Implementation steps

- Move existing responsibility into factory, pass live getters, remove forwarding wrappers.

## Acceptance criteria

- Existing runtime lifecycle and selection tests pass; imports remain acyclic.

## Validation commands

- npm run lint:js; node --test tests/unit/*.test.js

## Manual smoke tests

- Existing e2e suite in final phase covers browser flows; separate manual session deferred.

## Rollback risks

- Initialization callbacks remain lazy; snapshot must stay live.

## Evidence

- Baseline app-runtime.js: 1035 lines; Claim composition extracted; final size recorded in phase 3.
- Commit: e7aded4
- Commit blocker: No commit blocker.

## Progress

- Implemented and validated.

## Decision log

- Bind UI and interaction callbacks late through selectionCoordinator.setContext; keep map/claim outputs in the focused factory.

## Outcomes / Retrospective

- Validated: JavaScript lint and all 88 JS unit tests pass. Browser coverage deferred to final validation phase.
