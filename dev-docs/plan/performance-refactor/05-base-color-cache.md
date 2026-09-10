# Reuse unchanged base-color layer

## Goal

- Skip fragment/descriptor creation for an unchanged visible base-color render.

## Scope

- src/render/map-scene-renderer.js, src/runtime/debug-runtime.js, tests/unit/render-services.test.js, tests/e2e/rendering.spec.js and rebuilt corresponding docs assets.

## Non-goals

- Candidates 3–5, game-data extraction, deployment, path serialization, multi-entry geometry caches and changing search semantics.

## Affected files

- src/render/map-scene-renderer.js, src/runtime/debug-runtime.js, tests/unit/render-services.test.js, tests/e2e/rendering.spec.js and rebuilt corresponding docs assets.

## Implementation steps

- Keep only last applied normalized copy context and visible geometry/color inputs; compare before allocating descriptors; invalidate reset/geometry/scenario changes; register separate calls/rebuild/skips; test DOM identity and all invalidation boundaries.

## Acceptance criteria

- Repeated equal visibility and language-only refresh produce zero rebuilds; changed visibility/color/mode/geometry/copies update correct DOM; reset and destroy safe.

## Validation commands

- rtk proxy ./scripts/build-wsl.sh --skip-install; rtk npm run lint; rtk npm run test:e2e -- --workers=2; rtk proxy node tools/measure_base_color_updates.mjs /tmp/base-color-after.json http://127.0.0.1:4178

## Manual smoke tests

- Exercise repeated search, language refresh, different visibility, base mode, scenario and world-wrap transitions in the built browser. Automated browser tests/probes are used; record if no human visual check is performed.

## Rollback risks

- Stale SVG colors or geometry if mutable fill/path/copy inputs are omitted. Avoid callback-identity-only keys and verify same-ID changed geometry.

## Progress

- Implemented the ordered last-input snapshot, separate debug counters and lifecycle invalidation. Focused renderer unit tests passed 7/7; WSL rebuild/verify passed 70 JavaScript + 53 Python tests; full lint passed. Focused real-browser invalidation test passed.

## Decision log

- Keep one ordered snapshot of visible region names, path strings and resolved fills, plus baseMode and normalized copy contexts. Preserve source order/multiplicity; hidden-set iteration order does not affect it. Only map-scene-renderer owns base-layer replacement, so invalidate on its renderGeometry/reset/destroy instead of observing external DOM.
- Runtime colorFor closure identity is insufficient because baseMode/data may change beneath it. Compare its actual output on each visible region. Rebuild and skip counters are registered separately so debug reset clears both.

## Outcomes / Retrospective

- Completed full browser suite (76/76) and after measurement. Both wrap modes produced 0 mutations / 0 rebuilds / 1 skip per unchanged input in all five all-visible and five Ontario repeats; language-only refresh also preserved DOM. Changed visibility still rebuilt once, and group counts/path string lengths matched baseline. Unit checks cover normalized copy equivalence, hidden-set order, changed fill from the same callback, same-ID changed geometry, source order/multiplicity, copy values, mode, empty output, reset/geometry invalidation and destroy. Browser test verifies exact canonical fill/hit membership as well as skip/rebuild counts and node identity.
- Delegated source implementation remained pending after the resumed turn; the orchestrator completed it locally using the reviewed design. No manual human visual smoke check performed.
