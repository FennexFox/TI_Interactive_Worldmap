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

- [ ] Overlay data inventory completed
- [ ] Model builder added
- [ ] Map overlay renderer added
- [ ] Panel renderer added
- [ ] Panel event binding preserved
- [ ] Claim pill and selected state preserved
- [ ] Generated Pages assets rebuilt
- [ ] Validation completed
- [ ] Manual smoke completed

## Decision Log

- The model builder may be mostly pure rather than fully pure if passing all localization and control state separately would make the phase too large.
- `updateNationOverlay()` remains as the public orchestration function for this phase.

## Outcomes

Not started.
