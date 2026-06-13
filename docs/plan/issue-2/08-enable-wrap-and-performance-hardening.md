# Phase 08: Enable Wrap and Performance Hardening

## Goal

Enable horizontal world-wrap panning by default and harden the finished feature for static GitHub Pages.

## Scope

- Remove or invert the temporary review flag once all wrapped layers are complete.
- Keep a debug or emergency disable switch only if useful for rollback.
- Ensure pan work is throttled with `requestAnimationFrame`.
- Verify panning does not rebuild active data, derived indices, or overlay models.
- Tune DOM updates and copy counts if performance is poor.
- Add final E2E coverage for the issue #2 acceptance criteria.
- Rebuild and verify checked-in `docs/` output.

## Non-goals

- Do not add globe mode.
- Do not add zoom, inertial panning, minimap, or keyboard/touch polish unless required for basic usability.
- Do not change side-panel layout.
- Do not add server dependencies.
- Do not perform broad overlay optimization beyond what is needed for smooth wrapping.

## Affected Files

- `src/app.js`
- `src/state/map-view-state.js`
- `src/render/map-layers.js`
- `src/state/map-visual-state.js`
- `src/styles.css`
- `tests/map-wrap.spec.js`
- `tests/language.spec.js`
- `README.md` if user-facing development notes change
- Generated copies under `docs/**` after `npm run build`

## Implementation Steps

1. Review all previous phase tests and issue #2 acceptance criteria.
2. Enable world-wrap panning in the default app path.
3. Keep an optional debug query switch for diagnostics if it has low maintenance cost.
4. Check debug render stats while panning and while changing overlays.
5. Ensure copy count is the minimum required for the current viewport.
6. Add final E2E tests for continuous east and west pan, wrapped hover, wrapped click, overlay alignment, and offset normalization.
7. Run full validation.
8. Review generated diffs and summarize intentional generated output changes.

## Acceptance Criteria

- Users can pan horizontally beyond western and eastern boundaries without a hard edge.
- At least one repeated world copy is visible on each horizontal side when needed.
- Internal pan offsets remain normalized.
- Canonical region, nation, claim, project, and scenario records are not duplicated.
- Hovering and clicking any visible copy resolve to canonical region and nation state.
- Tooltips, selection, and overlays remain canonical.
- Claim and unification overlays render correctly on wrapped copies.
- Ordinary panning does not rebuild derived claim or nation indices.
- Antimeridian candidates are validated.
- The app works as a static GitHub Pages build.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
git diff --check
```

## Manual Smoke Tests

- Open the default app at `/`.
- Pan east continuously for multiple map widths.
- Pan west continuously for multiple map widths.
- Select a large multi-region nation and verify overlays across copies.
- Hover and click left, center, and right visible copies of the same region.
- Test Alaska, American Pacific, French Pacific, Micronesia, Polynesia, Kamchatka, Russian Far East, and Sakhalin/Kurils.
- Toggle claim filters, labels, language, and only-claims while panned.
- Refresh the page and confirm the initial framing is sane.

## Rollback Risks

- Enabling by default can expose mobile or low-power performance issues.
- A debug disable switch can become permanent if not documented and scoped.
- Generated `docs/` output can drift from `src/` if build is skipped.
- Copy count or overlay projection can increase DOM size enough to slow hover interactions.

## Progress

- [x] Review flag removed or default-enabled.
- [x] Final E2E acceptance tests added.
- [x] Performance checked with debug stats.
- [x] Static output rebuilt.
- [x] Final smoke tests completed.

## Decision Log

- Decision: Enable by default only after base, hit, overlay, panning, and seam behavior are all covered.
- Decision: Keep rollback simple by isolating world-wrap activation in one small decision point.
- Decision: Enable world wrap by default on `/` and keep `?worldWrap=0`, `?worldWrap=false`, and `?worldWrap=off` as the explicit single-copy fallback.
- Decision: Rename the runtime CSS hook from review terminology to `world-wrap-enabled`.
- Decision: Keep language/cache tests on the single-copy fallback where they assert exact single-copy counts, while `tests/map-wrap.spec.js` owns default wrapped behavior and issue #2 acceptance coverage.

## Outcomes

- Default static app route now renders three world copies, enables horizontal pan input, and keeps the wrapped cursor/touch behavior active without requiring `?worldWrap=1`.
- Added final active issue #2 acceptance tests for continuous east/west panning, copied hover/click canonical resolution, and selected claim overlay projection on every visible copy.
- Retained a low-cost rollback/debug path through `?worldWrap=0`; baseline single-copy behavior remains covered by E2E tests.
- Confirmed ordinary panning uses `requestAnimationFrame` viewBox updates and does not rebuild overlay models or projected overlay DOM during drag.
- Rebuilt checked-in static output with `npm run build`.
- Validation passed: `npx playwright test tests/map-wrap.spec.js`, `npx playwright test tests/language.spec.js`, `npm run verify`, and `npm run test:e2e` with 32 tests passing.
- Manual static-site smoke passed against `http://127.0.0.1:4180/`: default wrap activation, long east/west panning, seam candidates, left/center/right copied interactions, Brazil overlays, claim filters, labels, only-claims, language switching, and refresh framing.
- Retrospective: the main compatibility risk is tests or future code assuming one DOM path per region. Canonical selectors should use `data-wrap-canonical="1"` or region-instance registries, while user-facing default behavior should be validated through projected-copy assertions.
