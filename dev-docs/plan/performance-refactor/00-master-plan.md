# Measured interaction and rendering refactor

## Issue Target And Scope Summary

- Issue target: performance-refactor, PR #101 against `develop`.
- Source investigation: HANDOUT.md. Its investigation-only status and original scope decisions are historical; user instructions authorize implementation.
- Scope: all five candidates. Candidates1–2 were completed first; the latest user request authorizes the remaining3–5. All source changes are implemented and individually validated.

## Strategy

- Remove measured repeated work while preserving matching, ordering, logical interaction state and visible SVG output.
- Search resolves dropdown results once per input, reuses keyboard presentation and normalized catalog/map strings with explicit context invalidation.
- Base colors and selection outlines retain only the last effective render inputs, comparing actual output dependencies before allocating SVG. Never serialize geometry for keys.
- Wheel updates every logical zoom in event order, sharing the pan animation-frame scheduler only for DOM application. Synchronous controls and scenario/reset/destroy boundaries consume or cancel pending work appropriately.

## Phase Order

1. [Baseline and scope](01-baseline.md)
2. [Search dropdown updates](02-search.md)
3. [Initial integration and PR](03-verification.md)
4. [Base-color baseline](04-base-color-baseline.md)
5. [Base-color cache](05-base-color-cache.md)
6. [Base-color integration](06-base-color-integration.md)
7. [Search computation](07-search-computation.md)
8. [Wheel batching](08-wheel-batching.md)
9. [Selection reuse](09-selection-reuse.md)
10. [Final integration](10-remaining-integration.md)

## Phase Dependencies

- Phases execute in numerical order with candidate-specific baseline evidence, validation and commits. Read-only investigations may overlap; source implementation and built measurements remain isolated by candidate.

## Source Of Truth Decisions

- This file is the current scope and strategy. Phase documents capture implementation and validation; [MEASUREMENTS.md](MEASUREMENTS.md) records evidence and limitations.
- Earlier candidate deferrals in phases1–6 and measurement history are superseded by the authorized follow-up. HANDOUT.md remains the original source investigation.

## Global Validation Expectations

- Rebuild Pages through the WSL workflow, run verify and lint, relevant focused browser tests, then the full browser suite and generated consistency check.
- Keep source and generated browser modules together in phase commits. Preserve unrelated branch content and update existing PR #101. No deployment requested.

## Known Risks And Assumptions

- Catalog and region data are stable within a context/catalog revision; rebuilding or setting context invalidates search strings. The canonical map subset/order remains authoritative.
- Renderer snapshots compare mutable callback output, path strings, positions and world copies rather than callback or region ID alone.
- Wheel rect reads remain per event; logical state can lead DOM until the next frame. Buttons/reset/wrap/scenario paths explicitly resolve this boundary; destroy never performs a delayed render.
- Synthetic operation counts and bounded trace Layout events do not establish real-device latency, FPS or paint performance. Selection benefit depends on selection size; timing samples are noisy.

## Completion Evidence

- Candidates1–5 implemented; per-candidate deterministic counts and output parity are recorded in MEASUREMENTS.md.
- Final validation and PR handoff are recorded in phase10. No human visual smoke review or real-device wheel/trackpad latency study was performed; automated browser tests cover the affected behavior.
