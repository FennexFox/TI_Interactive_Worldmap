# Phase 01: Issue 73 grouped hostile hatch rendering

## Goal

- Make hostile hatch rendering scalable by removing per-region hatch clips and default visible claim overlay outlines.

## Scope

- Update claim overlay descriptors/rendering in `src/app.js`.
- Reuse grouped compound path machinery for hatch geometry.
- Use shared SVG pattern definitions for hatch styles.
- Preserve `disableHostileHatch` behavior and world-wrap projection.
- Update CSS and tests for grouped hatch output.

## Non-goals

- Do not alter base map seam/stroke behavior.
- Do not implement propagated hostile semantics in this phase.
- Do not remove claim fill grouping or label behavior.

## Affected files

- `src/app.js`
- `src/styles.css`
- `tests/map-wrap.spec.js`
- Possibly `tests/language.spec.js`
- Rebuilt `docs/assets/**` from `npm run build`

## Implementation steps

- Split visible outline metadata from fill and hatch descriptors.
- Build hostile hatch descriptors with region paths and group by hatch key/class/fill opacity.
- Render one pattern-backed compound path per hatch visual group and world copy instead of per-region `clipPath` plus line path.
- Stop appending visible `.claim-overlay` paths by default.
- Keep datasets such as `data-regions`, `data-visual-group-size`, `data-hatch-key`, and project metadata for diagnostics.
- Update tests that currently expect per-region outlines/hatches.

## Acceptance criteria

- Default `#claimOverlays .claim-overlay` count is 0 for ordinary claim overlays.
- `claimClipPathCount` becomes 0 for hostile overlays.
- Hatch group/path count scales by hatch visual group and copy count, not hostile region count.
- Direct hostile claims still display hatches.
- `disableHostileHatch` / `debugDisableHostileHatch` still suppress hatch output.
- World-wrap renders grouped hatch copies correctly.

## Validation commands

- `npm run build`
- `npx playwright test tests/map-wrap.spec.js -g "hostile|claim grouped"`
- `npm run verify`
- `npm run test:e2e`
- `node tools/measure_debug_render_stats.mjs --repeats=1 --zoom-steps=0 --nation=CHN --project=Project_GreaterPanAsia --extra-nations= --pan-steps=1 --summary-json --raw-json`

## Manual smoke tests

- Select China and Greater Pan-Asia; confirm hostile hatch is visible.
- Repeat with `disableHostileHatch=1`; confirm no hostile hatch nodes.
- Enable world-wrap and confirm hostile hatches appear on visible world copies.
- Pan/zoom with claims active and no obvious seam regression.

## Rollback risks

- If patterns do not render in SVG world-copy fragments, direct hatches may disappear.
- If tests rely on per-region `.claim-overlay` semantics, they must be updated carefully to avoid losing behavior checks.

## Evidence

- Baseline: China / Greater Pan-Asia, single-copy: `claimOverlayPathCount=63`, `claimOutlinePathCount=56`, `claimOutlineUseCount=0`, `claimHatchGroupCount=5`, `claimHatchPathCount=5`, `claimClipPathCount=5`, `visibleSvgNodeCount=1305`; world-wrap: `claimOverlayPathCount=73`, `claimOutlinePathCount=56`, `claimOutlineUseCount=112`, `claimHatchGroupCount=15`, `claimHatchPathCount=15`, `claimClipPathCount=15`, `visibleSvgNodeCount=3905`.
- After: TODO
- Delta: TODO
- Interpretation: TODO
- Commit: TODO
- Commit blocker: TODO

## Progress

- Baseline captured.
- Not implemented yet.

## Decision log

- #73 is required before #72 because #72 expands the set of hostile-rendered downstream claims.

## Outcomes / Retrospective

- Not completed yet.
