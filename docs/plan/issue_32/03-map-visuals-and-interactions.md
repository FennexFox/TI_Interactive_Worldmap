# Phase 03: Pin controls and map visuals

## Goal

- Let users pin and unpin regions and make pinned nodes visible on the map with stable, distinct styling.

## Scope

- Add pin/unpin controls in the focused detail path and practical map interactions for capital regions.
- Extend map visual state with pinned-region ids or render a dedicated pinned-node layer that is driven only by pin state.
- Add map styling that remains distinct from hover, selected, ordinary capital, candidate capital, claim overlay, and secondary-capital preview visuals.
- Ensure pinned visuals project into world-wrap copies.

## Non-goals

- No recursive envelope fill yet beyond the existing selected-nation claim overlay.
- No reachable-capital candidate toggle or markers yet.
- No keyboard shortcut system.

## Affected files

- `src/state/map-visual-state.js`
- `src/render/map-layers.js` if a reusable marker helper is needed.
- `src/app.js`
- `src/styles.css`
- `docs/plan/issue_32/03-map-visuals-and-interactions.md`
- Rebuilt generated Pages output after source changes.

## Implementation steps

- Add pin/unpin affordances for the focused region and pinned rows.
- Add a dedicated render key for pinned visuals so unchanged pin state does not replace the marker layer.
- Render pinned highlights and node markers through `createProjectedCopyFragment` or an equivalent copy-aware helper.
- Include pinned state in hover-delta hazard checks only when necessary for visual correctness.
- Update clear-selection and language-refresh flows to keep marker labels accurate.

## Acceptance criteria

- Users can pin multiple regions and unpin any pinned region.
- Pinned regions are visible on the map.
- Pinned visuals remain distinct from selected and hover visuals.
- Pinned visuals render in default wrapped mode and in `?worldWrap=0`.
- Pin/unpin updates do not require unrelated claim overlay descriptor rebuilds except where the envelope layer later depends on pins.

## Validation commands

- `npm run build`
- `npm run verify`
- `npm run test:e2e`

## Manual smoke tests

- Focus China, pin Tokyo once controls exist, and confirm Tokyo remains visually pinned.
- Hover selected, ordinary, and pinned capital regions to confirm styles remain distinguishable.
- Unpin and clear pins, confirming the marker layer updates.
- Test default wrapped mode and `?worldWrap=0`.

## Rollback risks

- Medium renderer risk: new marker layers can become stale if render keys omit language, copy context, or pin order.
- Medium interaction risk: pin/unpin controls can conflict with existing region focus and row actions.

## Progress

- Not started.

## Decision log

- Issue #24 E3 favors a stable pinned marker/highlight layer rather than piggybacking on hover or selected overlay classes.

## Outcomes / Retrospective

- Not completed yet.
