# Phase 01: State model

## Goal

- Add first-class state for manual expansion pins and the reachable-capital candidate toggle without changing visible behavior.

## Scope

- Add `pinnedRegionIds` and `showReachableCapitalCandidates` to `src/state/app-state.js`.
- Add helper functions to pin, unpin, clear, replace, and toggle candidate visibility.
- Wire thin wrapper helpers in `src/app.js` where app orchestration reads or mutates app state.
- Keep existing `selectedRegionIds`, hover state, locked nation state, active incoming claim state, and filter state behavior unchanged.

## Non-goals

- No UI card, button, marker, recursive envelope, or candidate marker rendering in this phase.
- No automatic closure or auto-pinning.
- No changes to generated claim data or Terra Invicta claim semantics.

## Affected files

- `src/state/app-state.js`
- `src/app.js`
- `docs/plan/issue_32/01-state-model.md`
- Rebuilt generated Pages output after source changes.

## Implementation steps

- Add normalized pin helper functions in `app-state.js`.
- Ensure clear-selection behavior clears pins and hides candidates, while ordinary hover clearing does not mutate pins.
- Add app-level getter/setter wrappers near existing state wrappers in `src/app.js`.
- Keep pin state separate from `selectedRegionIds` and avoid using selected-region visual state for pinned nodes.

## Acceptance criteria

- App state exposes `pinnedRegionIds` as a `Set`.
- Multiple region ids can be stored, removed individually, and cleared.
- Duplicate and empty pin ids are ignored.
- `showReachableCapitalCandidates` can be toggled independently of claim filters.
- Existing hover, search, selection, language, and claim-filter behavior still works.

## Validation commands

- `npm run build`
- `npm run verify`
- `npm run test:e2e`

## Manual smoke tests

- Load the app and confirm selecting China still locks the nation and renders the normal detail panel.
- Clear the map and confirm normal selection/hover state resets.
- Switch language and confirm the existing UI still refreshes.

## Rollback risks

- Low if limited to additive state fields and helpers.
- Main risk is accidentally clearing selected regions or filters when only pin state should change.

## Progress

- Not started.

## Decision log

- Pin state is distinct from selected-region state to satisfy issue #32 and issue #24 E3.

## Outcomes / Retrospective

- Not completed yet.
