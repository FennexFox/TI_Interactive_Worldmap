# Phase 5: Overlay Model, Renderer, And Panel Split

## Goal

Separate selected-nation overlay calculation from map overlay rendering and side-panel rendering.

`updateNationOverlay()` can remain as an orchestration function, but model calculation, SVG rendering, and panel HTML generation should become separate responsibilities.

## Scope

- Extract a selected-nation overlay model builder.
- Extract map overlay rendering from that model.
- Extract side-panel rendering from that model.
- Preserve existing claim, project, and incoming/outgoing behavior.
- Keep event binding for claim cards and region rows working.

## Non-goals

- Do not change claim semantics.
- Do not change hostile, peaceful, gated, or capital classification.
- Do not add overlay caching.
- Do not add secondary capital hover preview.
- Do not introduce a dirty-layer scheduler.
- Do not redesign the panel.

## Affected Files

- `src/app.js`
- `docs/assets/app.js` after `npm run build`
- `tests/language.spec.js` if additional claim-card coverage is needed

## Implementation Steps

1. Identify all values calculated inside current overlay update flow:
   - active nation
   - base regions
   - selected incoming entry
   - display base set
   - visible entries
   - outgoing entries
   - incoming entries
   - claim set
   - result set
   - visible nation regions
   - owned, claim-target, and dimmed state
   - counts for the claim pill and panel
2. Add `buildNationOverlayModel(activeData, indices, nationId, options)` or equivalent.
3. Return a model that includes all data needed by both map rendering and panel rendering.
4. Add `renderMapOverlay(model, renderContext)` to render:
   - owned territory overlays
   - claim overlays
   - claim labels
   - capital markers, if this remains part of map overlay refresh
5. Add `renderNationInfoPanel(panelRoot, model, panelContext)` to generate panel HTML only.
6. Keep claim card and legend region event binding separate from HTML generation where practical.
7. Keep `updateNationOverlay(nation)` as the coordination point:
   - update active state
   - build model
   - update canonical visible region set
   - render map overlays
   - render panel
   - bind panel interactions
   - update pills and selected-region state
8. Run `npm run build`.
9. Run validation and smoke tests.

## Acceptance Criteria

- Overlay model calculation is separated from DOM rendering.
- Map overlay rendering and side-panel rendering are separate functions.
- Current selected-nation behavior is preserved.
- Outgoing and incoming claim cards still work.
- Project and claim-kind filters still work.
- Claim pill values still match current behavior.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Useful targeted checks:

```powershell
rg "buildNationOverlayModel|renderMapOverlay|renderNationInfoPanel|updateNationOverlay" src/app.js
```

## Manual Smoke Tests

- Select Brazil and confirm base territory, claims, project count, and capital region panel details.
- Switch claim display from all to selected project to off.
- Switch claim type between peaceful, hostile, and all.
- Click an outgoing claim card and confirm the map overlay narrows or expands correctly.
- Click an incoming claim card and confirm the active nation switches to the claimant as before.
- Click a region row inside a claim card and confirm selected-region state updates without losing the selected nation when expected.
- Switch language after rendering a nation panel and confirm panel text refreshes.

## Rollback Risks

High. The current overlay function mixes many local variables with panel HTML and event binding. Splitting it may expose hidden dependencies between panel state, selected regions, project filters, and overlay state.

Rollback should restore the previous `updateNationOverlay()` implementation for this phase only.

## Progress

- [x] Overlay data inventory completed
- [x] Model builder added
- [x] Map overlay renderer added
- [x] Panel renderer added
- [x] Panel event binding preserved
- [x] Claim pill and selected state preserved
- [x] Generated Pages assets rebuilt
- [x] Validation completed
- [x] Manual smoke completed

## Decision Log

- The model builder may be mostly pure rather than fully pure if passing all localization and control state separately would make the phase too large.
- `updateNationOverlay()` remains as the public orchestration function for this phase.
- 2026-06-11: Added `buildNationOverlayModel(activeData, indices, nationId, options)` as the selected-nation overlay calculation boundary while leaving current claim semantics and global control reads intact.
- 2026-06-11: Added `renderMapOverlay(model, renderContext)`, `renderClaimSummaryPill(model)`, `renderNationInfoPanel(panelRoot, model)`, and `bindNationOverlayPanelEvents(panelRoot, model)`.
- 2026-06-11: Kept capital marker refresh inside `renderMapOverlay()` because the current marker state depends on active overlay and selected-region context.
- 2026-06-11: Normalized the targeted-region count separator in the new panel renderer to ASCII ` - ` to avoid preserving mojibake from the previous inline block.

## Outcomes

Completed.

`updateNationOverlay()` now coordinates state reset, project options, overlay model creation, visible-region state, map rendering, claim pill rendering, panel rendering, panel event binding, filtering, and selected-region refresh. Overlay calculation, SVG overlay rendering, side-panel HTML, and panel interactions are now independently reviewable functions.

Validation completed successfully:

```powershell
node --check src/app.js
npm run build
npm run verify
npm run test:e2e
rg "buildNationOverlayModel|renderMapOverlay|renderClaimSummaryPill|renderNationInfoPanel|bindNationOverlayPanelEvents|function updateNationOverlay|targetedRegions" src/app.js
```

Manual smoke completed successfully with an inline Playwright script against the generated `docs/` site. It covered Brazil selection, base/claim/project counts, capital panel details, claim display modes, peaceful/hostile/all claim kinds, outgoing claim-card narrowing, incoming claim-card nation switching, claim-card region row selection with nation preservation, and language switching after panel render.

Residual risk: the model builder still reads some current global controls through existing helpers. That is intentional for this phase so behavior remains unchanged and the app stays working before Phase 6.
