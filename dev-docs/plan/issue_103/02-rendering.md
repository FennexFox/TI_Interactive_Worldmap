# Phase 02: Boundary and marker rendering

## Goal

- Reduce SVG paint cost preserving visual semantics.

## Scope

- Reduce SVG paint cost preserving visual semantics.

## Non-goals

- No computation caches or base-region filter removal.

## Affected files

- src/styles.css, interaction lifecycle if needed, regression tests, rebuilt docs.

## Implementation steps

- Compare dash/marker alternatives, implement measured choice; rebuild and measure.

## Acceptance criteria

- Inspect zoom 0/3/6 with wrap off/on; normal/overlap/depth/hostile and marker distinctions. Measured improvement required for performance completion.

## Validation commands

- npm run lint:js; ./scripts/build-wsl.sh --skip-install; targeted e2e; frame measurement.

## Manual smoke tests

- Inspect zoom 0/3/6 with wrap off/on; normal/overlap/depth/hostile and marker distinctions.

## Rollback risks

- Revert source and regenerate docs together; timings depend on the environment.

## Evidence

- Baseline: MEASUREMENTS.md records unchanged source 463e594, three repetitions per selection/input condition.
- After: Differentiated 4px/3px normal and 1px/3px overlap dashes; capital-star filter removed while existing SVG shadows, fills, strokes and hatching remain. Three-repeat dash/permanent/transient comparisons and final built-site run recorded.
- Delta: Full-window selected drag P95 35.28→18.60 ms, max 83.6→30.5 ms; wheel max 75.9→36.7 ms and >50 ms samples 8→0. Wheel full-window P95 essentially unchanged, post-update P95 increased (documented).
- Interpretation: Measured drag and wheel long-tail improvement, not a universal P95/FPS claim. Review follow-up: the existing same-points SVG shadow needs a wider outer stroke for contrast; temporary mode offered no consistent benefit and was not implemented.
- Commit: Rendering phase commit follows gate.
- Commit blocker: None.

## Progress

- Validated: WSL rebuild/verify (85 JS + 54 Python tests), 15 targeted browser tests, source diff review. Headed Chromium screenshots inspected at zoom 0/3/6, wrap off/on; four pins survived actual pans and remained readable.

## Decision log

- Preserve existing widths/depth colors/hostile hatch/base filters and marker geometry; change only two dash patterns and capital filters. No production timer/RAF lifecycle changes.

## Outcomes / Retrospective

- Implemented and validated for measured drag and long-tail zoom benefit. Full suite and headed wheel regression run remain in phase 3.
