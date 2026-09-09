# Phase 02: Search dropdown updates

## Goal

- Compute and replace dropdown results once per input and reuse results for keyboard navigation.

## Scope

- Candidate 1 and evidence-based assessment of remaining handout candidates.

## Non-goals

- No search semantic changes, geometry extraction, broad caches, wheel scheduling, or deployment.

## Affected files

- src/ui/controls.js, src/ui/search-controller.js, tests/unit/ui-controllers.test.js, tests/e2e/search.spec.js, rebuilt docs assets.

## Implementation steps

- Consolidate input reset/render; cache current query/catalog results; update arrow highlight without replacing options; test context/catalog changes and lifecycle.

## Acceptance criteria

- One input replacement; zero replacements and searches for unchanged-result arrows; existing selected nation, Enter, Escape and empty-result behavior preserved.

## Validation commands

- rtk proxy ./scripts/build-wsl.sh --skip-install; rtk npm run lint; rtk npm run test:e2e -- --workers=2

## Manual smoke tests

- Use the built app to type Canada, navigate arrows, choose with Enter, clear selection, and test empty results. Automated browser probes exercise these workflows; record any human visual checks not performed.

## Rollback risks

- Stale cached choices or highlight could select the wrong item; invalidate on catalog/context changes and verify teardown.

## Progress

- Not started.

## Decision log

- No decisions recorded yet.

## Outcomes / Retrospective

- Not completed yet.
