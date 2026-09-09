# Phase 03: Integration and PR

## Goal

- Record measured results and create the requested PR.

## Scope

- Candidate 1 and evidence-based assessment of remaining handout candidates.

## Non-goals

- No search semantic changes, geometry extraction, broad caches, wheel scheduling, or deployment.

## Affected files

- Phase documentation and PR metadata.

## Implementation steps

- Compare before/after measurements; review diff and generated output scope; document deferred candidates and limitations; commit and push branch; create PR.

## Acceptance criteria

- Validation evidence and limitations recorded with a reviewable PR.

## Validation commands

- rtk npm run measure:render-stats -- --repeats=5 --zoom-steps=0,3,6 --scenarios=wrap-off-labels,wrap-on-labels,wrap-on-complex-overlays-labels --summary-json --out=.chatgpt/tool-tests/performance-refactor/after; rtk git diff --check

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
