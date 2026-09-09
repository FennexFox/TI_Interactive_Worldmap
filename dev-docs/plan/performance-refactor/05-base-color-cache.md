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

- Not started.

## Decision log

- User explicitly authorized choosing by estimated benefit. Candidate 2 processes every visible region and joins long SVG paths on filter refresh, making it the strongest estimated remaining candidate; this is a hypothesis, not a measured ranking.

## Outcomes / Retrospective

- Pending this phase’s validation.
