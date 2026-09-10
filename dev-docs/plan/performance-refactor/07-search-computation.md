# Search computation reuse

## Goal

- Complete the authorized remaining performance work while preserving behavior.

## Scope

- Search computation reuse as described in HANDOUT.md and the current source.

## Non-goals

- Changes to search meaning, geometry simplification, game data extraction, deployment or unbounded caches.

## Affected files

- src/data/search-catalog.js, src/ui/search-controller.js, related unit/search browser tests and measurement tools. Browser output is regenerated through the WSL build.

## Implementation steps

- Precompute catalog rank inputs; rank once per matched nation; skip zero-limit categories; cache canonical map search strings with explicit context invalidation.
- Measure baseline before source changes, validate implementation, record evidence and commit this phase.

## Acceptance criteria

- Match existing aliases, project aliases, labels, ordering, limits, canonical visibility and language/scenario refresh.

## Validation commands

- `rtk proxy ./scripts/build-wsl.sh --skip-install`
- `rtk proxy env PATH="$PWD/.venv-wsl/bin:$PATH" npm run lint`
- Applicable focused `rtk npm run test:e2e` tests; final phase runs full suite with `--workers=2`.
- `rtk git diff --check`; final integration also runs `rtk npm run check:generated` after commits.

## Manual smoke tests

- Automate browser interactions for affected behavior and inspect DOM/viewBox outcomes; report human visual checks as not performed if unavailable.

## Rollback risks

- Missing invalidation could retain translated or scenario strings.

## Progress

- Completed source, unit coverage, WSL build/verify (73 JavaScript + 53 Python), full lint and focused browser search/language/scenario suite (9/9).

## Decision log

- User authorized remaining candidates; prior scope deferrals are superseded. Keep candidate measurements and commits separate.
- Cache map search strings by region object in a WeakMap per context/catalog revision because canonical arrays are freshly allocated. Iterate the runtime canonical subset/order, preserve separate dropdown pretty-name semantics, and skip preparation for empty queries. Context/catalog/clear/destroy invalidate; region data is stable within that revision.
- Precompute catalog normalized rank fields, calculate rank once per matching nation, skip exactly zero limits while preserving slice behavior for other limits. Unit tests cover all rank tiers and label/tag ties.
- Previous delegated draft was interrupted between turns; root reviewed and completed it, fixing canonical-array cache misses and strengthening tests/measurement. Baseline source restored in an isolated temporary source tree from13b73ac for the final identical measurement tool.

## Outcomes / Retrospective

- Fixed synthetic workload: rank input evaluations 240→121; zero-limit region searchText reads 363→0; three canonical-map filters localized callbacks 1,089→363. All 24 query/limit signatures match baseline. No application paint or perceived-speed claim. Human visual smoke check not performed; built browser tests cover search aliases/projects/keyboard/language/scenario.
