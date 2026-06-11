# Phase 6: Canonical Visual State

## Goal

Represent map visual state in canonical JS state objects or sets instead of relying on DOM classes as the source of truth.

This phase should also replace or isolate DOM-inferred SVG state such as `svg:has(#claimOverlays .claim-overlay)` behind explicit state classes.

## Scope

- Add `appState.mapVisualState` or an equivalent visual-state object.
- Track visual sets for:
  - selected regions
  - owned regions
  - claim-target regions
  - hovered regions
  - dimmed regions
  - hidden regions
  - claims-active state
- Apply visual state to rendered visual instances through renderer helpers.
- Keep DOM element maps as render caches only, not state owners.
- Replace or isolate `svg:has(...)` claim-overlay state with explicit SVG classes.

## Non-goals

- Do not implement a dirty-layer scheduler.
- Do not implement multi-copy projection.
- Do not combine SVG paths.
- Do not change overlay color semantics.
- Do not change claim or selection behavior.

## Affected Files

- `src/app.js`
- `src/styles.css`
- `docs/assets/app.js` after `npm run build`
- `docs/assets/styles.css` after `npm run build`
- `tests/language.spec.js` only if explicit state classes make new behavior easier to assert

## Implementation Steps

1. Add a visual state object:

   ```js
   const mapVisualState = {
     selectedRegionIds: new Set(),
     ownedRegionIds: new Set(),
     claimTargetRegionIds: new Set(),
     hoverRegionIds: new Set(),
     dimmedRegionIds: new Set(),
     hiddenRegionIds: new Set(),
     hasClaimOverlay: false,
   };
   ```

   Use the repo's chosen canonical region identity from earlier phases.

2. Move selected, owned, claim-target, dimmed, hidden, and hovered calculations into state update helpers.
3. Add `applyMapVisualState(renderContext, mapVisualState)` or equivalent.
4. Ensure all visual instances receive state consistently.
5. Keep `regionPathElements` only as a render cache if it is still needed.
6. Toggle explicit SVG state classes:

   ```js
   svg.classList.toggle('claims-active', mapVisualState.hasClaimOverlay);
   ```

7. Replace CSS selectors that infer state from overlay DOM:

   ```css
   svg.claims-active .region { ... }
   ```

8. Remove or isolate runtime-injected `svg:has(...)` rules.
9. Run `npm run build`.
10. Run validation and smoke tests.

## Acceptance Criteria

- Visual state exists as canonical JS data.
- DOM classes are applied from canonical state rather than used as the source of truth.
- `svg:has(#claimOverlays .claim-overlay)` is replaced or isolated behind explicit state classes.
- Clearing selection, changing filters, switching nations, and hover transitions leave no stale visual classes.
- Current visual behavior is preserved.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Targeted state-selector check:

```powershell
rg ":has\\(#claimOverlays|svg:has" src docs/assets
```

This command should return no matches unless a documented compatibility fallback remains.

## Manual Smoke Tests

- Select Brazil, then clear the selection and confirm no stale owned, claim-target, selected, or dimmed state remains.
- Select Brazil, hover Ontario, then hover Amazonia and confirm hover and foreign-hover layers update correctly.
- Switch claim display off and confirm base map visual state returns correctly.
- Toggle only-claims on and off.
- Toggle base map color modes.
- Toggle labels.
- Switch language while a nation is selected and confirm state is preserved.
- Click empty map space and confirm all visual state resets.

## Rollback Risks

High. Visual state is broad and touches many render paths. The main failure modes are stale classes, incorrect layer visibility, claim overlays not activating muted base-map styling, or hidden regions remaining hidden after filters change.

Rollback should restore DOM class mutation behavior from the previous phase.

## Progress

- [ ] Visual state object added
- [ ] State update helpers added
- [ ] Visual state apply helper added
- [ ] Selected state migrated
- [ ] Overlay owned/claim/dimmed state migrated
- [ ] Hover/hidden state migrated
- [ ] Explicit SVG classes added
- [ ] `svg:has(...)` selectors replaced or documented
- [ ] Generated Pages assets rebuilt
- [ ] Validation completed
- [ ] Manual smoke completed

## Decision Log

- DOM path collections may remain render caches, but canonical state must live in JS sets or objects.
- Explicit `svg.claims-active` state is preferred over `svg:has(...)` inference.

## Outcomes

Not started.
