# Phase 03: Selection/pin refresh narrowing

## Goal

- Reduce unnecessary full-map visual-state applications when the user only changes selected/pinned expansion nodes.

## Scope

- Review `commitReachableCapitalSelection`, `refreshPinnedRegionOutputs`, `updateSelectedRegions`, and `updateNationOverlay` call ordering.
- Use bounded visual-state updates for changed selected/pinned regions where overlay/filter state has not changed.
- Avoid rerendering the active claim overlay on selection-only changes when the overlay descriptors are unchanged.

## Non-goals

- Do not change search/filter behavior.
- Do not change incoming/outgoing claim card semantics.
- Do not remove required panel updates.

## Affected files

- `src/app.js`
- `tests/language.spec.js`

## Implementation steps

- Add an option or helper for selection-only region updates.
- Add an option or helper for refreshing committed nation details without forcing overlay DOM replacement when the active overlay geometry is unchanged.
- Apply the narrower path to reachable-capital candidate selection and panel pin/unpin interactions.
- Keep full refresh paths for claim mode, claim kind, project, language, scenario/data, and active incoming claim changes.

## Acceptance criteria

- Candidate pinning no longer causes multiple full visual-state applications for the same click when the active overlay geometry is unchanged.
- Selection outlines, pinned markers, capital markers, manual envelope overlays, reachable candidates, and panels remain synchronized.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e -- tests/language.spec.js tests/map-wrap.spec.js

## Manual smoke tests

- Select China, pin North Honshu, then pin another reachable capital if available.
- Confirm selected outlines and pinned markers update immediately.
- Confirm clearing the map still removes selection, pins, overlays, and panels.

## Rollback risks

- Over-narrowing refreshes can leave stale CSS classes, stale panels, or stale markers.

## Progress

- Completed bounded selected-region updates for reachable-capital selection.
- Added `renderMap` / `updateManualExpansion` options to `updateNationOverlay` so the reachable-capital click path can refresh details without rerendering unchanged active claim geometry.
- Added e2e assertions that the reachable-capital click path performs bounded visual updates and no full visual-state applications.

## Decision log

- Prefer small optional update flags over a broad rewrite of `updateNationOverlay`.

## Outcomes / Retrospective

- Completed. The candidate click path now updates selected/pinned visuals, panels, manual envelopes, and candidate outputs without forcing the active claim overlay through another full map refresh.
