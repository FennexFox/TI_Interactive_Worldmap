# Issue 2 Master Plan: Horizontal World-Wrap Panning

## Source Context

Issue: [#2 Add horizontal world-wrap panning for the segmented map](https://github.com/FennexFox/TI_Interactive_Worldmap/issues/2)

Base branch: `develop`

Planning branch: `issue-2-refactor-plan`

Issue #2 asks for flat-map horizontal wrapping, not a 3D globe. The map should behave like repeated horizontal world copies while preserving one canonical region, nation, claim, project, and scenario data model. Hover, click, tooltip, selection, and claim overlays must resolve to canonical IDs on every copy.

Issue #16 is closed and the current `develop` branch already contains the intended preparation work:

- `src/state/app-state.js` owns app interaction and filter state.
- `src/state/map-visual-state.js` owns canonical visual state sets.
- `src/data/active-data.js` wraps the active data scenario.
- `src/data/derived-indices.js` builds active data indices.
- `src/render/map-layers.js` owns low-level SVG layer helpers.
- `src/app.js` still orchestrates map rendering, interaction, overlays, and side panel flow.
- `src/app.js` has a minimal `mapView` with `x`, `y`, `width`, `height`, and `worldWidth`, but no pan behavior yet.
- Visible region paths and transparent hit paths are already separated.
- Hit-layer pointer handling is already delegated through `gHitRegions`.

The generated region map currently has 363 regions and a summary viewBox of approximately `[-3.17409138, -1.543560305, 6.52568676, 2.58888961]`. Antimeridian-adjacent candidates found in the checked-in generated data include `Alaska`, `AmericanPacific`, `FrenchPacific`, `Micronesia`, `Polynesia`, `Kamchatka`, `RussianFarEast`, and `SakhalinKurils`.

## Strategy

Implement world wrapping as renderer-level visual instances over one canonical data model. Do not duplicate `regionMap`, `claimMap`, catalogs, derived indices, app state, or overlay models.

Use a camera-like `mapView` as the source of truth for the SVG viewport. Horizontal panning updates `mapView.x` and the SVG `viewBox`; `mapView.x` is normalized by `worldWidth` so it cannot grow without bound. Vertical panning stays bounded to the original map extent unless a later phase intentionally expands it.

Introduce a world-copy plan that can render horizontal copies at `-worldWidth`, `0`, and `+worldWidth` relative offsets. Keep copy identity inside renderer context only, for example via group transforms and `data-wrap-copy` attributes. Canonical app state should continue to store region names and nation tags only.

Preserve current review safety by staging the work:

1. Establish baseline validation and wrap contract tests.
2. Extract map-view primitives without changing behavior.
3. Make renderer and visual-state code capable of multiple instances while still rendering one copy.
4. Render repeated base, label, grid, and hit layers behind a review flag.
5. Add horizontal drag panning and offset normalization behind the same review flag.
6. Project claim, hover, selection, and capital overlays onto every visible copy.
7. Validate and fix antimeridian geometry issues.
8. Enable the feature by default and harden performance and static build output.
9. Keep larger follow-up work out of the MVP but documented.

## Phase Index

- [01 Baseline and Contract Tests](01-baseline-and-contract-tests.md)
- [02 Map View State and Normalization](02-map-view-state-and-normalization.md)
- [03 Render Instance Infrastructure](03-render-instance-infrastructure.md)
- [04 World Copy Base and Hit Layers](04-world-copy-base-and-hit-layers.md)
- [05 Horizontal Pan Input and Viewport Updates](05-horizontal-pan-input-and-viewport-updates.md)
- [06 Overlay and Visual State Projection](06-overlay-and-visual-state-projection.md)
- [07 Antimeridian Geometry Validation](07-antimeridian-geometry-validation.md)
- [08 Enable Wrap and Performance Hardening](08-enable-wrap-and-performance-hardening.md)
- [09 Post-MVP Follow-up Scope](09-post-mvp-follow-up-scope.md)

## Final MVP State

The issue #2 MVP enables flat horizontal world-wrap panning by default on `/`. The renderer creates left, canonical, and right world-copy instances while app state, derived indices, overlay models, and region/nation identifiers remain canonical. The explicit fallback query `?worldWrap=0` keeps the single-copy route available for rollback, debugging, and legacy single-copy assertions.

The implementation intentionally keeps copy count fixed at three copies, preserves the original vertical view extent, and avoids adding zoom, inertia, keyboard/touch polish, scenario switching, a globe, or a general geospatial preprocessing layer.

## Review Invariants

Every implementation phase should be reviewable on its own and leave the default app working.

Required invariants:

- No phase hand-edits generated deployment artifacts. Change `src/**`, `tools/**`, tests, or manual source data, then run `npm run build`.
- Repeated copies are renderer instances only.
- `src/render/**` must not import `appState` directly.
- App state, map visual state, derived indices, and overlay models remain canonical.
- Hit paths and visible paths stay aligned for every visible copy.
- Ordinary panning does not rebuild derived claim or nation indices.
- Static GitHub Pages output in `docs/` is regenerated for source changes.
- Tests or future code that need exactly one region path should select `data-wrap-canonical="1"` or use canonical registries instead of assuming one DOM path per region.

## Validation Cadence

For source, generator, or data changes:

```powershell
npm run build
npm run verify
```

For user-facing browser behavior:

```powershell
npm run test:e2e
```

For focused phase development, run the narrow new Playwright spec first, then the full suite before review.

## Follow-up Scope To Keep Visible

These are intentionally outside the issue #2 MVP unless a later review explicitly pulls them in:

- 3D globe view.
- Scenario switching UI and multi-scenario generated data.
- Save-file parsing.
- Server-side processing.
- A new geospatial engine.
- Broad side-panel redesign.
- Deep map zoom, minimap, inertia, kinetic scrolling, keyboard navigation, and touch gesture polish.
- Nation-level compound path rendering and heavier overlay caching beyond what panning requires.
- A general antimeridian preprocessing framework if targeted Terra Invicta fixes are enough for the MVP.
- Accessibility help text or tutorial overlays beyond necessary cursor and focus affordances.
