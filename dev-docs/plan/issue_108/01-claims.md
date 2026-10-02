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

- Baseline app-runtime.js: 1035 lines; capture after extraction.
- Commit: Will record phase commit after gate.
- Commit blocker: None.

## Progress

- Not started.

## Decision log

- No decisions recorded yet.

## Outcomes / Retrospective

- Not completed yet.
