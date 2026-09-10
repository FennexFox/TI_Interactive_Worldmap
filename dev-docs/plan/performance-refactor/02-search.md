# Phase 02: Search dropdown updates

## Goal

- Compute and replace dropdown results once per input and reuse results for keyboard navigation.

## Scope

- Candidate 1 and evidence-based assessment of remaining handout candidates.

## Non-goals

- No search semantic changes, geometry extraction, broad caches, wheel scheduling, or deployment.

## Affected files

- src/ui/controls.js, src/ui/search-controller.js, tests/unit/ui-controllers.test.js, tests/e2e/search.spec.js, tools/measure_search_updates.mjs, rebuilt docs assets.

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

- Complete. Consolidated input refresh; added bounded result reuse, in-place active updates, selection-presentation invalidation, and stale catalog protection. Added unit operation-count checks and a real-browser keyboard regression.

## Decision log

- Keep one catalog/query result cache and invalidate it on context/catalog changes and clear/destroy. Preserve full rendering for explicit state refresh; use active-class updates only for unchanged keyboard results.
- Add a small standalone browser probe for repeatable synchronous dispatch and DOM replacement measurements; never assert environment-dependent timing thresholds.

## Outcomes / Retrospective

- WSL rebuild succeeded; full verify passed (67 JavaScript, 53 Python), lint passed before the final browser test addition; the final test lint caught an unqualified MutationObserver and was corrected to window.MutationObserver.
- Existing full browser suite passed 74/74; search suite with the new regression passed 3/3. Final full lint and search 3/3 rerun also passed after the test-only lint correction. Automated smoke covers immediate Enter, arrows, selection clearing, empty results and Escape; no separate human visual review.
- Direct Chromium evidence confirms input replacements 2→1 and unchanged arrow replacements 1→0 with preserved option identity. Input median remained 1.5 ms in the small idle-host probe; no latency improvement claimed. See MEASUREMENTS.md.
- Generated rebuild changed only the two corresponding docs/assets/ui modules.
