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

- [ ] Overlay render key defined.
- [ ] Claim overlay replacement guarded by key.
- [ ] Claim label replacement guarded by key.
- [ ] Language/filter invalidation verified.
- [ ] Validation commands run.

## Decision Log

- Split model caching and DOM skip keys into separate phases so stale-model bugs are easier to distinguish from stale-DOM bugs.
- Empty state is a real render state and should be represented in the key instead of handled implicitly.

## Outcomes

Pending implementation.
