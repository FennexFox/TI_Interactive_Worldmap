# Phase 04: Extract map interaction and visual update flow

## Goal

- Extract map interaction and visual update flow so pointer/hover/click logic is readable independently from SVG layer construction and app bootstrap.

## Scope

- Separate hit-layer pointer handling, hover preview scheduling, map pan/zoom controls, tooltip positioning, and visual refresh requests where practical.
- Keep render modules dependency-injected and state values passed from app orchestration.

## Non-goals

- Do not change zoom/pan physics, world-wrap behavior, or hover/selection semantics.
- Do not optimize label/world-wrap performance beyond preserving current behavior.

## Affected files

- `src/app.js`
- New `src/interaction/map-interactions.js` and/or `src/ui/map-controls.js`
- New `src/render/render-scheduler.js` if scheduling helpers are separable
- `src/state/map-view-state.js` if small state adapter additions are needed
- `tests/map-wrap.spec.js`
- `tests/language.spec.js`
- `docs/assets/**` after build

## Implementation steps

- Identify interaction functions with cohesive dependencies.
- Extract map view controls, pointer handling, hover scheduling, and tooltip helpers with injected callbacks.
- Keep `src/app.js` as owner of high-level transitions such as `updateNationOverlay`.
- Validate hover overlays, click selection, pan, zoom, and world-wrap.

## Acceptance criteria

- Map interaction code can be inspected outside `src/app.js`.
- Hover overlays and selected regions behave as before.
- Zoom, pan, and horizontal world-wrap behavior do not regress.
- Render scheduling remains explicit and avoids unnecessary full refreshes on repeated pointer events.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e

## Manual smoke tests

- Hover a region; click a region; pan after hover; zoom with buttons and wheel; world-wrap pan; hover capital overlay while selected.

## Rollback risks

- High: pointer event extraction can break subtle suppression, hover, or pan behavior. Mitigation: move cohesive groups with callbacks intact and run targeted Playwright coverage after each extraction.

## Evidence

- Baseline:
  - `src/app.js` owns hit-layer pointer events, tooltip scheduling, hover preview scheduling, map pan state, map view controls, and visual refresh calls.
- After:
  - In-progress slice: extracted map pan state, drag threshold handling, drag click suppression, pan delta math, pointer capture lifecycle, and post-pan hover refresh scheduling into `src/interaction/map-pan.js`.
  - `src/app.js` now creates a map pan controller with callbacks for `panMapView`, map-view render scheduling, debug stats, and hover refresh.
  - Final slice: extracted tooltip positioning/sizing/scheduled layout state into `src/interaction/tooltip.js`.
  - Final slice: extracted map view control DOM creation, labels, and click binding into `src/ui/map-controls.js`.
  - Updated `tools/build_pages.py` to copy `src/interaction/**` to `docs/assets/interaction/**`.
  - Updated `npm run verify` and `tools/verify_generated_outputs.py` to syntax-check/require the new interaction and map-control assets.
  - Ran `npm run build`; generated `docs/assets/app.js`, `docs/assets/interaction/map-pan.js`, `docs/assets/interaction/tooltip.js`, and `docs/assets/ui/map-controls.js`.
- Delta:
  - `src/app.js` reduced from 4,153 lines after phase 3 to 3,995 lines.
  - Interaction/UI logic extracted in this phase: 158 lines in `src/interaction/map-pan.js`, 83 lines in `src/interaction/tooltip.js`, and 79 lines in `src/ui/map-controls.js`.
- Interpretation:
  - Map pan state, pointer-drag suppression, tooltip scheduling, and map control DOM/event binding can now be inspected outside `src/app.js`.
  - `src/app.js` still owns high-level hover, selection, map-view mutation, and visual refresh orchestration through injected callbacks.
  - Phase 04 is complete.
- Validation:
  - `node --check src/app.js`: passed.
  - `node --check src/interaction/map-pan.js`: passed.
  - `node --check src/interaction/tooltip.js`: passed.
  - `node --check src/ui/map-controls.js`: passed.
  - Focused pan/world-wrap/hover/click/zoom/map-controls e2e grep: passed, 49 tests.
  - Focused map-control/zoom/pan e2e grep: passed, 7 tests.
  - Focused hover/tooltip/pan/click/map-controls/world-wrap e2e grep: passed, 45 tests.
  - `npm run build`: passed; wrote generated assets.
  - `npm run verify`: passed; generated outputs verified and 17 Python tests passed.
  - `npm run test:e2e`: passed, 85 tests.
- Generated artifacts:
  - `docs/assets/app.js`, `docs/assets/interaction/map-pan.js`, `docs/assets/interaction/tooltip.js`, and `docs/assets/ui/map-controls.js` changed through `npm run build`.
- Commit: partial phase-4 slice (`Extract map pan controller`).
- Commit: final phase-4 slice pending (`Extract map control and tooltip helpers`).
- Commit blocker: None known.

## Progress

- Completed.

## Decision log

- 2026-06-21: Extract map pan as the first phase-4 slice because it has cohesive internal state and broad map-wrap e2e coverage.
- 2026-06-21: Keep hover/tooltip behavior in `src/app.js` for this slice and pass post-pan hover refresh as a callback to avoid mixing pan mechanics with hover semantics.
- 2026-06-21: Extract tooltip scheduling separately from hover semantics; `src/app.js` still decides when to show/hide and what text to display.
- 2026-06-21: Extract map controls as UI, not state; callbacks keep zoom/reset/wrap behavior owned by app orchestration.

## Outcomes / Retrospective

- Completed. Map pan mechanics, tooltip scheduling, and map view control UI are extracted and validated; high-level interaction semantics remain in `src/app.js`.
