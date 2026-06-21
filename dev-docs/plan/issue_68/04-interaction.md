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
  - TODO
- Delta:
  - TODO
- Interpretation:
  - TODO
- Commit: TODO
- Commit blocker: TODO

## Progress

- Not started.

## Decision log

- No decisions recorded yet.

## Outcomes / Retrospective

- Not completed yet.
