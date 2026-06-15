# Phase 01: Group base map visual fills

## Goal

- Render base-map visual fills through grouped compound SVG paths in `#normalRegionColors`, while leaving the muted per-region `#regions` layer and `#hitRegions` interaction layer intact.

## Scope

- Add reusable grouped visual-fill helpers in `src/render/map-layers.js`.
- Group base descriptors by active visual fill key/color for nation, plain, and boundary-complexity modes.
- Exclude currently hidden regions from the grouped base fill output so search and "Show claim targets only" filtering still hides the correct display regions.
- Preserve world-wrap copy groups and datasets for grouped base fills.

## Non-goals

- Do not change claim overlay rendering in this phase.
- Do not change hit-test paths, hover handling, selection handling, labels, or capital markers.
- Do not perform polygon union or introduce GIS dependencies.
- Do not hand-edit generated `docs/**` output.

## Affected files

- `src/render/map-layers.js`
- `src/app.js`
- `docs/plan/issue_28/01-base-visual-groups.md`

## Implementation steps

- Add a helper that accepts region descriptors with `region`, `path`, `fillKey`, `fill`, `className`, and optional data attributes, then emits one compound path per group per world copy.
- Refactor `renderNormalRegionColors` to build descriptors from `REGIONS`, `colorFor(region)`, and `mapVisualState.hiddenRegionIds`.
- Change filter application to rebuild/sync grouped base fills when the hidden set changes.
- Keep `renderRegionLayers` producing region-specific muted paths and hit paths.

## Acceptance criteria

- `#normalRegionColors` renders fewer grouped fill paths than the region count in normal single-copy mode.
- Base-mode switching changes grouped fill colors for nation, plain, and boundary-complexity modes.
- Search filtering and "Show claim targets only" continue to hide/show correct region hit paths and labels.
- `?worldWrap=0` produces one grouped base-copy plan; default world wrap produces three grouped base-copy groups.

## Validation commands

- npm run build
- npm run verify

## Manual smoke tests

- Inspect DOM in single-copy and wrapped modes to confirm `#hitRegions .region-hit` remains one path per region per copy.
- Toggle base map modes and confirm grouped base fills update without losing hover/click behavior.
- Search for `Amazonia` and verify nonmatching regions are hidden from hit paths and omitted from grouped base fills.

## Rollback risks

- Reverting phase 1 returns base fills to one visual path per region and can reintroduce high-zoom same-color seams.
- If hidden-region rebuilding is missed, search/filter behavior can display stale grouped fills even though hit paths are hidden.

## Progress

- Implemented grouped compound paths for #normalRegionColors from active base-mode fill descriptors while preserving region-specific #regions and #hitRegions paths.

## Decision log

- Hidden-region filtering rebuilds grouped base fills instead of toggling per-region normal-color classes, because grouped paths do not retain per-region display nodes.

## Outcomes / Retrospective

- Phase 1 validation passed: npm run build and npm run verify completed successfully with a temporary /tmp/python-shim/python -> /usr/bin/python3 shim because this environment has python3 but no python executable.

