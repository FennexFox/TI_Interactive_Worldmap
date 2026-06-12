# Phase 05: Overlay Render Skip Keys

## Goal

Avoid clearing and rebuilding overlay DOM when the effective overlay render key has not changed.

## Scope

- Add render keys for claim overlay paths and claim labels.
- Use an explicit empty render key and one-time clear path when no active overlay model exists.
- Skip `replaceLayerChildren` for claim overlays and labels when the render key is unchanged.
- Keep panel rendering and control options correct when only sidebar text or language-dependent content changes.
- Keep full visual-state application for broad state changes unless Phase 03 has already proven a safe bounded path.

## Non-Goals

- Do not compound paths in this phase.
- Do not change visual styling or claim tier grouping.
- Do not skip panel rendering unless a clear, separate key is introduced and tested.
- Do not merge selected overlay and hover preview overlay layers.

## Affected Files

- `src/app.js`
- `src/render/map-layers.js` only if a small keyed replacement helper is warranted
- `tests/language.spec.js` or focused overlay regression spec
- Generated `docs/assets/app.js` and possibly `docs/assets/render/map-layers.js` after `npm run build`

## Render Key Requirements

Render keys should include every input that can change the actual DOM for the keyed layer. At minimum, consider:

- active scenario or data version
- selected or active nation ID
- claim mode
- claim kind
- project filter
- active incoming claim key
- language, if labels depend on it
- visible or hidden result context, if the model does not fully encode it
- an explicit empty state key when there is no active overlay model

When there is no active overlay model, the render key must resolve to an explicit empty key and the corresponding layer must be cleared once. It must not keep the last non-empty key or leave stale nodes behind.

## Implementation Steps

1. Define an overlay render key from the cached model key plus render-affecting values such as language if labels depend on it.
2. Track the last claim overlay path key and claim label key separately.
3. In `renderMapOverlay`, build fragments only when their specific key changed.
4. Handle the empty-model case with an explicit empty key and a one-time layer clear for `#claimOverlays` and `#claimLabels`.
5. Preserve `setOverlayVisualState`, visual-state application, and capital marker refresh decisions.
6. Ensure language changes still refresh label text and panel text.
7. Ensure switching claim filters, project mode, incoming claim card, active nation, active scenario/data version, visible/hidden result context, or empty/non-empty overlay state changes the key.
8. Run build, verify, and e2e.

## Acceptance Criteria

- Unchanged overlay render keys do not clear and rebuild `#claimOverlays`.
- Unchanged label render keys do not clear and rebuild `#claimLabels`.
- Changing selected nation, claim mode, claim kind, project filter, active incoming claim, language, active scenario, visible/hidden context, or empty/non-empty overlay state updates the correct DOM.
- Clearing selection or filters clears stale overlay and label DOM exactly once for that empty state.
- Overlay rendering remains compatible with future world-wrap layer replication.
- Existing claim overlay counts and panel text assertions pass.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Select Brazil, then move within Brazil's existing claim range and confirm overlays do not flicker.
- Toggle project filter and confirm overlay paths update.
- Toggle language and confirm claim labels and panel text update.
- Click incoming and outgoing claim cards and confirm active card styling and overlays update.
- Clear selection and confirm overlays are removed.

## Rollback Risks

- Render keys can omit language or filter inputs and leave stale text or stale overlays.
- Skipping DOM replacement can preserve nodes that should have been removed after clearing selection or switching to an empty overlay model.
- Separating path and label keys can introduce inconsistent overlay/label state if keys are not coordinated.

## Progress

- [x] Overlay render key defined.
- [x] Claim overlay replacement guarded by key.
- [x] Claim label replacement guarded by key.
- [x] Language/filter invalidation verified.
- [x] Validation commands run.

## Decision Log

- Split model caching and DOM skip keys into separate phases so stale-model bugs are easier to distinguish from stale-DOM bugs.
- Empty state is a real render state and should be represented in the key instead of handled implicitly.
- Claim overlay paths and claim labels use separate render keys so language changes can refresh labels without rebuilding identical path DOM.
- Render keys are tracked per SVG layer with `WeakMap`s instead of single globals, keeping the path compatible with future replicated or alternate render contexts.
- `updateNationOverlay` no longer clears claim overlay DOM before every active render; empty map state is cleared through an explicit keyed empty render state.
- The path key is based on concrete path descriptors, including region, class, fill, and project dataset values. The label key is based on concrete label descriptors, including localized text and label positions.

## Outcomes

Implemented Phase 05 on 2026-06-13.

Source changes:

- Added keyed claim overlay and claim label DOM replacement helpers in `src/app.js`.
- Split claim overlay path descriptors from claim label descriptors so each layer can skip replacement independently.
- Preserved `setOverlayVisualState`, full visual-state application, panel rendering, project option updates, and capital marker refresh behavior.
- Added explicit empty render keys for `#claimOverlays` and `#claimLabels`.
- Added a Playwright regression proving unchanged active overlay state skips both DOM replacements, language changes replace labels only, filter changes replace both layers, and repeated empty clears do not replace again.
- Rebuilt generated Pages app output with `npm run build`.

Validation:

- `npm run build` passed.
- `npm run verify` passed: generated outputs verified, 5 Python unit tests passed.
- `npm run test:e2e` passed: 12 Playwright tests passed.
- Focused `npm run test:e2e -- --grep "overlay render skip"` passed: 1 Playwright test passed.

Manual smoke notes:

- Selecting Brazil and hovering within Brazil's claim range preserved the 26 overlay paths with `claimOverlayDomReplacements=0` and `claimLabelDomReplacements=0`.
- Selecting the Gran Colombia project filter changed the overlay to 14 paths and replaced both overlay paths and labels.
- Switching language to Korean refreshed claim labels and panel language state without replacing overlay path DOM.
- Outgoing and incoming claim card clicks preserved active card styling and updated overlays correctly.
- Clearing selection removed claim overlays and labels; the explicit empty state prevents repeated empty clears from replacing the layers again.

Retrospective:

- Path and label descriptors made the skip keys easier to reason about than a broad state-only key, because they encode the actual DOM the layer would render.
- The remaining repeated work is now mostly visual-state, hover overlay, and marker churn rather than selected-claim overlay path replacement.
