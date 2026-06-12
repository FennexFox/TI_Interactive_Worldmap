# Phase 07: Antimeridian Geometry Validation

## Goal

Find and fix visible tearing, missing overlays, and broken hit detection around the horizontal map seam.

## Scope

- Validate known antimeridian-adjacent regions from checked-in generated data.
- Test regions whose path x-range spans both ends of the map.
- Add targeted rendering or preprocessing fixes where the current paths cross the seam.
- Document every targeted exception or preprocessing rule.
- Keep the fix pragmatic and Terra Invicta data-specific if that is enough for the MVP.

## Non-goals

- Do not introduce a new geospatial engine unless targeted fixes fail.
- Do not implement a globe.
- Do not redesign the source data schema.
- Do not change claim semantics, nation ownership, or region identity.
- Do not perform broad generated data refactors unrelated to seam correctness.

## Affected Files

- `src/render/map-layers.js` if fixes are render-time transforms or clipping
- `src/app.js` if copy selection or overlay offset logic needs seam-aware behavior
- `tools/build_region_outline_data.py` or `tools/extract_region_outlines.py` if preprocessing is required
- `tests/map-wrap.spec.js`
- `tests/test_catalog_builders.py` or a new Python test if generated geometry preprocessing changes
- Targeted generated files after running the appropriate build command
- `docs/assets/**` and `docs/data/**` after `npm run build`

## Implementation Steps

1. Build a targeted list of seam candidates: `Alaska`, `AmericanPacific`, `FrenchPacific`, `Micronesia`, `Polynesia`, `Kamchatka`, `RussianFarEast`, and `SakhalinKurils`.
2. Add a small inspection script or test helper that reports path x-ranges and flags regions spanning most of `worldWidth`.
3. Run manual and automated checks for base paths, hit paths, claim overlays, hover outlines, and selection outlines on those candidates.
4. Choose the smallest fix that handles the observed problems:
   - render-time duplicate with offset correction,
   - path segment split during preprocessing,
   - targeted region exception,
   - or longitude normalization before SVG path generation.
5. Add tests for the selected fix.
6. Rebuild generated outputs only through project tools.
7. Document remaining known limitations if a fully general solution is deferred.

## Acceptance Criteria

- Antimeridian-adjacent regions do not show obvious tearing during horizontal pan.
- Hit paths remain aligned with visible paths near the seam.
- Hover, click, tooltip, selection, and claim overlays work on seam-adjacent copied regions.
- Targeted geometry exceptions are documented.
- Generated artifacts, if changed, are produced through tools and not hand-edited.
- Static Pages build remains valid.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

If preprocessing changes require a full Terra Invicta rebuild:

```powershell
python tools/rebuild_pages.py --templates-dir "<Templates>" --region-outlines "<regionoutlines>" --no-commit
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Pan across the seam and inspect Alaska.
- Pan across the seam and inspect American Pacific and French Pacific.
- Pan across the seam and inspect Micronesia and Polynesia.
- Pan across the seam and inspect Kamchatka, Russian Far East, and Sakhalin/Kurils.
- Select nations with Pacific claims and verify overlays do not disappear at the seam.
- Click seam-adjacent regions on left, center, and right copies.

## Rollback Risks

- Render-time exceptions can drift from generated data if region names change.
- Preprocessing fixes can alter many generated paths and require careful generated diff review.
- Splitting paths can break labels or center calculations if helper code assumes one path per region.
- A general algorithm can become larger than the MVP if not constrained.

## Progress

- [ ] Seam candidate list confirmed.
- [ ] Path-span detection added or run manually.
- [ ] Visual seam checks performed.
- [ ] Fix approach chosen.
- [ ] Tests and documentation added.

## Decision Log

- Decision: Start with targeted Terra Invicta seam validation before adding any general geospatial dependency.
- Decision: Keep canonical region IDs unchanged even if visual geometry needs splitting.

## Outcomes

Pending implementation.

