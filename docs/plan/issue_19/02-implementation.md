# Phase 02: Resolver state and secondary overlay rendering

## Goal

- Implement the secondary foreign-capital hover preview while preserving selected overlay state and existing ordinary hover behavior.

## Scope

- Add derived capital index and resolver.
- Add secondary hover state and clearing helpers.
- Wire resolver into pointer hover updates.
- Render secondary preview through the existing foreign-hover overlay layer with distinct class/data attributes.
- Add focused Playwright coverage.

## Non-goals

- Do not add a permanent capital marker layer.
- Do not change claim calculation semantics.
- Do not switch selected nation on hover.
- Do not reintroduce per-region SVG path listeners.
- Do not hand-edit generated deployment output.

## Affected files

- `src/data/derived-indices.js`
- `src/state/app-state.js`
- `src/index.html`
- `src/styles.css`
- `src/app.js`
- `tests/language.spec.js`
- `tests/map-wrap.spec.js`
- `docs/plan/issue_19/02-implementation.md`

## Implementation steps

- Build `capitalNationsByRegion` from `claimsByNation[nation].capitalRegions`, filtering to known regions.
- Implement deterministic resolver ordering: displayable current-territory nations first, then stable tag ordering.
- Return `null` unless selected nation, hovered canonical region, selected overlay result set, foreign capital, and displayable territory requirements all pass.
- Add `interaction.secondaryHoverNationId` and setter/clearer state helpers.
- Resolve secondary hover during `updateHoveredRegion` after hovered region state changes and before hover overlay rendering.
- Clear secondary hover on hover clear, selection clear/change, claim mode/kind/project changes, and language refresh via normal overlay update.
- Render secondary nation using foreign-hover descriptors while ordinary outside-range foreign hover remains unchanged.
- Add tests for eligible foreign capital, ordinary in-range non-capital, selected nation's own capital, and clearing behavior.

## Acceptance criteria

- Resolver operates only on canonical IDs, derived indices, active data, and selected overlay model.
- Hovering `Moskva` with `EUA` selected renders a secondary `RUS` preview while keeping `EUA` claim overlay visible.
- Hovering ordinary in-range non-capital regions does not render secondary preview.
- Hovering selected nation's own capital does not render secondary preview.
- Moving away clears only the secondary preview.
- Outside-range foreign hover behavior still uses the existing non-selected hover overlay.
- Selected overlay is not rebuilt solely by secondary hover pointer movement.

## Validation commands

- `node --check src/data/derived-indices.js`
- `node --check src/state/app-state.js`
- `node --check src/app.js`
- `node --check tests/language.spec.js`
- Targeted Playwright tests covering secondary capital hover.

## Manual smoke tests

- Select France (`EUA`) and hover `Moskva`; Russia preview appears and selected France overlay remains.
- Move from `Moskva` to an ordinary selected-overlay region; Russia preview clears.
- Hover outside selected range and confirm normal foreign hover preview still behaves as before.

## Rollback risks

- Medium; hover rendering is shared with existing optimization work. Rollback should remove resolver/state wiring and any secondary-specific selector assertions together.

## Progress

- Completed `capitalNationsByRegion` and `resolveSecondaryCapitalPreview`.
- Added `appState.interaction.secondaryHoverNationId` with clearing on selection and overlay option changes.
- Wired locked-selection hover movement to resolve secondary previews without rebuilding the selected overlay model.
- Added `secondaryHoverOverlays` as a dedicated SVG layer above claim overlays and below labels, using the existing foreign-hover descriptor builder for secondary nation paths.
- Added Playwright coverage for `EUA` selected + `Moskva` hover -> `RUS`, ordinary in-range non-capital hover, selected own-capital hover, outside-range normal foreign hover, and wrapped copy projection.
- Ran changed-file syntax checks and targeted Playwright tests.

## Decision log

- `getLockedNation()` is treated as the selected nation for #19. Transient non-locked hover previews do not trigger secondary capital previews.
- Secondary paths use the existing foreign-hover descriptor cache but render into a separate SVG group so selected claim overlays remain visible while the secondary preview is not hidden underneath them.
- Deterministic shared-capital behavior is documented in `resolveSecondaryCapitalPreview`: displayable current-territory nations sort first, then stable tag order.

## Outcomes / Retrospective

- Phase 2 completed. Targeted tests passed after rebuilding generated Pages assets.
