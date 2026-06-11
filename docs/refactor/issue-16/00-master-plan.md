# Issue #16 Master Refactor Plan

## Purpose

Issue #16 is an architecture-boundary refactor for the interactive Terra Invicta world map. The goal is to preserve current user-facing behavior while making later work safer and smaller, especially world-wrap panning, scenario switching, secondary capital hover previews, and heavier overlay rendering optimizations.

This plan intentionally splits the work into independently reviewable phases. Each phase must leave the app working as a static GitHub Pages site.

## Current Architecture

The app is a static, no-framework browser app. `src/index.html` loads generated data from `docs/assets/data.generated.js`, then runs `src/app.js`. The deployable Pages site is the generated mirror under `docs/`.

Today, `src/app.js` owns most runtime concerns in one file:

- generated data access from `regionMap`, `claimMap`, and catalogs
- derived indices such as region and nation lookup maps
- UI and map state
- base SVG map rendering
- region pointer and click handling
- claim overlay calculation and DOM rendering
- side-panel rendering and panel event binding
- hover, selection, capital marker, and tooltip rendering

That structure works for the current single rendered map, but it makes follow-up features risky because data identity, visual SVG instances, interaction targets, and overlay state are tightly coupled.

## Refactor Strategy

The refactor will move from the current single-file coupling toward explicit internal boundaries:

- active data context: wrap the current generated dataset in `appData`, `appState.activeScenario`, `getActiveData()`, and `buildDerivedIndices(activeData)`
- renderer helpers: centralize SVG element creation and layer rendering entry points
- layer separation: keep visible region paths separate from transparent hit-test paths
- delegated interaction: resolve canonical region identity through data attributes instead of visual path object identity
- overlay split: build a selected-nation overlay model before rendering map overlays or side-panel HTML
- canonical visual state: represent selected, hovered, owned, dimmed, claim-target, hidden, and claims-active state in JS sets/objects
- explicit SVG state classes: replace or isolate `svg:has(...)` state inference behind JS-controlled classes
- minimal map view state: add a camera/view object without implementing panning

## Phase List

1. `01-baseline-safety-net.md`: strengthen regression coverage before architecture edits.
2. `02-active-data-and-derived-indices.md`: introduce active data and derived-index boundaries.
3. `03-renderer-helpers-and-layer-entrypoints.md`: route SVG creation through reusable renderer helpers.
4. `04-hit-layer-and-delegated-events.md`: split visible paths from hit paths and delegate map interaction.
5. `05-overlay-model-renderer-panel-split.md`: separate overlay model building from map and panel rendering.
6. `06-canonical-visual-state.md`: make visual state explicit and remove DOM-inferred SVG state.
7. `07-map-view-and-follow-up-contracts.md`: add the minimal view state contract for future world-wrap work.

## Cross-Phase Rules

- Preserve current appearance and interaction behavior.
- Do not combine phases into one large PR or patch.
- Keep each phase independently reviewable.
- Keep `tools/` and generated data semantics unchanged unless a phase explicitly says otherwise.
- Keep `src/**` as source of truth for app code.
- Run `npm run build` after app source changes so generated `docs/**` stays synchronized.
- Review generated `docs/**` as deploy output, but focus behavioral review on source changes and tests.
- Do not introduce a frontend framework, build step, backend, or server-side runtime.

## Out Of Scope For Issue #16

- horizontal world-wrap panning
- repeated world-copy rendering
- scenario selector UI
- generation of full `2022`, `2026`, and `2070` runtime scenario bundles
- compound SVG path rendering as a required optimization
- full dirty-layer render scheduling
- secondary foreign-capital hover preview
- claim semantic changes
- hostile or peaceful claim classification changes
- project-gated claim rule changes
- backend or save-file parsing
- UI redesign beyond preserving or stabilizing current behavior

## Validation Baseline

Use the repo's existing validation sequence:

```powershell
npm run build
npm run verify
npm run test:e2e
```

`npm run verify` expands to Python syntax checks, Python unit tests, generated JavaScript syntax checks, and generated-output verification.

`npm run test:e2e` runs Playwright against the generated `docs/` site with a local static server.

## Manual Smoke Baseline

Every phase should manually check at least the changed part of this baseline:

- open the generated site and confirm the SVG map renders
- switch language and confirm static and dynamic copy update
- open the search box and confirm the dropdown appears
- search by nation tag, nation name, region name, and project name
- select a nation from search and confirm overlays and side-panel content update
- hover and click regions and confirm hover, tooltip, selection, and capital markers
- switch claim display mode, claim type, project, base map color, labels, and only-claims controls
- click empty map space and confirm selection clears
- confirm the app still works from `docs/` as a static Pages build

## Public And Internal Interfaces

No public URL, deployment, or generated data schema change is expected in this issue.

Internal runtime interfaces should emerge through the phases:

- `appData`: current data bundle wrapped as a scenario map
- `appState`: active scenario and UI/map state owner
- `getActiveData()`: returns the current scenario data
- `buildDerivedIndices(activeData)`: creates lookup maps and search choices from active data
- renderer helper functions for SVG creation and layer rendering
- `resolveHitRegion(event, indices)`: maps delegated pointer events to canonical region data
- `buildNationOverlayModel(...)`: calculates selected-nation overlay data
- `renderMapOverlay(...)`: renders map-only overlay layers
- `renderNationInfoPanel(...)`: renders side-panel HTML only
- `mapVisualState`: canonical JS state for visual classes and visibility
- `mapView`: current view state, with no pan behavior yet

## Review And Rollback Guidance

Each phase should be reversible as a coherent change. If a phase fails validation or manual smoke testing, revert that phase only and keep earlier accepted phases intact.

High-risk phases are expected to be:

- Phase 4, because event delegation changes pointer enter/leave behavior.
- Phase 5, because panel rendering currently depends on overlay-local variables.
- Phase 6, because canonical visual state can leave stale classes if update order is wrong.

## Progress

- [x] Phase 1: Baseline Safety Net
- [x] Phase 2: Active Data And Derived Indices
- [x] Phase 3: Renderer Helpers And Layer Entrypoints
- [x] Phase 4: Hit Layer And Delegated Events
- [x] Phase 5: Overlay Model, Renderer, And Panel Split
- [x] Phase 6: Canonical Visual State
- [x] Phase 7: Map View And Follow-Up Contracts

## Decision Log

- 2026-06-11: Keep the phase plan source under `docs/refactor/issue-16/`.
- 2026-06-11: Keep implementation phases source-first and rebuild `docs/**` with `npm run build`.
- 2026-06-11: Treat the existing `2026` data as the only active scenario during issue #16.
- 2026-06-11: Use current region names as canonical browser region identity unless a later phase proves numeric IDs are safer.
- 2026-06-11: Completed Phase 1 as a test-only safety-net phase; no application source or generated deploy output changed.
- 2026-06-11: Completed Phase 2 with active data and derived-index wrappers while preserving existing compatibility aliases for current callers.
- 2026-06-11: Completed Phase 3 by routing SVG creation through local renderer helpers while preserving current layer IDs and event ownership.
- 2026-06-11: Completed Phase 4 by adding a transparent hit layer and moving region hover/click handling to delegated handlers.
- 2026-06-11: Completed Phase 5 by splitting selected-nation overlay calculation, map overlay rendering, claim pill rendering, side-panel HTML, and panel event binding into separate functions.
- 2026-06-11: Completed Phase 6 by centralizing region visual classes in `appState.mapVisualState` and replacing claim-overlay `svg:has(...)` inference with explicit `svg.claims-active` state.
- 2026-06-11: Completed Phase 7 by initializing `appState.mapView` from the active viewBox and passing it through existing render contexts without changing SVG framing or adding panning.

## Outcomes

Phase 1 and Phase 2 are complete. The e2e safety net now covers claim display controls, project filtering, claim-kind filtering, outgoing and incoming claim-card synchronization, and empty-map clear behavior in addition to the existing language, search, hover, selection, and capital-marker coverage.

Phase 2 introduced active data ownership and a derived-index boundary without changing public data schemas or user-facing behavior.

Phase 3 introduced renderer helpers and migrated base map, labels, claim overlays, hover/selection overlays, and capital markers to those helpers without changing visual behavior.

Phase 4 separated visible region rendering from pointer hit testing. Region interactions now resolve canonical region identity from hit-path data attributes.

Phase 5 turned `updateNationOverlay()` into a coordinator over a selected-nation overlay model. Claim overlays, side-panel HTML, claim-pill text, and panel interactions are now separate reviewable units while preserving current claim-card, filter, language, and selected-region behavior.

Phase 6 introduced canonical map visual state sets for selected, owned, claim-target, hovered, dimmed, hidden, and claims-active state. Visible paths and hit paths now receive those classes through `applyMapVisualState()`, and generated styles no longer rely on `svg:has(#claimOverlays .claim-overlay)`.

Phase 7 added the minimal `mapView` contract for future world-wrap and pan/zoom work. The current SVG `viewBox` remains unchanged, and render contexts can now carry `mapView` without changing interaction behavior.

All seven phases are complete. The app remains a static Pages build with generated `docs/**` synchronized from `src/**`.
