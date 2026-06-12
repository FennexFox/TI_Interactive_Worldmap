# Phase 03: Render Instance Infrastructure

## Goal

Prepare rendering and visual-state application for multiple SVG instances while still rendering one visible world copy.

## Scope

- Introduce a renderer-level world-copy context with copy offset metadata.
- Keep the active copy plan as `[0]` for default behavior.
- Change element registries from one element per region to structures that can represent multiple visual and hit elements per canonical region.
- Preserve compatibility for existing app code during the transition.
- Keep canonical data and app state unchanged.

## Non-goals

- Do not enable repeated world copies yet.
- Do not add panning gestures.
- Do not change visible map output.
- Do not change claim or overlay semantics.
- Do not rebuild derived indices during rendering.

## Affected Files

- `src/app.js`
- `src/render/map-layers.js`
- `src/state/map-visual-state.js`
- `tests/language.spec.js`
- `tests/map-wrap.spec.js` if new assertions are easier in a separate file
- Generated copies under `docs/assets/**` after `npm run build`

## Implementation Steps

1. Define a copy context shape, for example `{copyIndex, xOffset, isCanonical}`.
2. Add renderer helpers that can render a layer once per copy context.
3. Preserve the current single-copy path by using a copy plan with only `{copyIndex: 0, xOffset: 0}`.
4. Update path registries so canonical region IDs can map to all rendered instances.
5. Keep any legacy single-element map populated with the canonical copy while migration is in progress.
6. Update `applyMapVisualState` and `applyMapVisualStateForRegions` to touch every instance of a canonical region.
7. Update debug render stats so they remain meaningful when multiple instances exist.
8. Run the full baseline validation suite.

## Acceptance Criteria

- The default DOM output is still effectively one visible map copy.
- `pathByRegion` and `hitPathByRegion` compatibility is preserved or all callers are migrated safely.
- Visual state changes apply through canonical region IDs.
- Search and filter logic does not duplicate result rows.
- Current Playwright tests pass.
- No user-visible layout or interaction change occurs.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Focused browser checks:

```powershell
npx playwright test tests/language.spec.js -g "bounded visual updates"
npx playwright test tests/language.spec.js -g "overlay render skip keys"
```

## Manual Smoke Tests

- Hover consecutive same-nation regions and confirm bounded visual updates still behave.
- Select a nation and confirm overlays render once in the visible map.
- Use search filters and confirm result counts do not appear duplicated.
- Toggle labels and confirm labels are not duplicated in the default view.

## Rollback Risks

- Multi-instance registries can accidentally double-count regions in filters or debug stats.
- Keeping legacy maps and new maps in sync can hide bugs.
- Applying visual state to every instance can increase DOM work if not bounded by canonical region IDs.

## Progress

- [ ] Copy context shape chosen.
- [ ] Single-copy plan wired through render helpers.
- [ ] Multi-instance registries added.
- [ ] Visual state application migrated.
- [ ] Baseline behavior verified.

## Decision Log

- Decision: Build multi-instance support before rendering extra copies so review can focus on data structures first.
- Decision: Keep copy identity in renderer context and DOM metadata only, never in app state.

## Outcomes

Pending implementation.

