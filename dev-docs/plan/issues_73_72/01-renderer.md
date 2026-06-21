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
- After: Same command after implementation, summary `debug-render-stats-2026-06-21T05-37-56-502Z.summary.json`. Single-copy: `claimOverlayPathCount=4`, `claimOutlinePathCount=0`, `claimOutlineUseCount=0`, `claimHatchGroupCount=1`, `claimHatchPathCount=1`, `claimClipPathCount=0`, `visibleSvgNodeCount=1228`; world-wrap: `claimOverlayPathCount=8`, `claimOutlinePathCount=0`, `claimOutlineUseCount=0`, `claimHatchGroupCount=3`, `claimHatchPathCount=3`, `claimClipPathCount=0`, `visibleSvgNodeCount=3674`.
- Delta: single-copy overlay paths `63 -> 4`, outlines `56 -> 0`, hatches `5 -> 1`, clipPaths `5 -> 0`, visible nodes `1305 -> 1228`; world-wrap overlay paths `73 -> 8`, outline uses `112 -> 0`, hatches `15 -> 3`, clipPaths `15 -> 0`, visible nodes `3905 -> 3674`.
- Interpretation: Hostile hatches now scale by hatch visual group and world copy instead of hostile region count; default committed overlays no longer emit visible per-region outline nodes.
- Validation: `npm run build` passed; focused `tests/map-view-state.spec.js tests/map-wrap.spec.js -g "hostile|claim grouped|zoomMapView"` passed; `tests/scenarios.spec.js` passed; `tests/language.spec.js tests/map-wrap.spec.js` passed; `npm run verify` passed; `npm run test:e2e` passed with 86 tests.
- Manual smoke tests: covered through browser tests for China / Greater Pan-Asia direct hostile hatch, disabled hostile hatch, world-wrap projection, hover previews, and pan churn; no separate manual browser session was run beyond automated Playwright and measurement runs.
- Commit: this phase commit (`Group hostile claim hatch rendering`).
- Commit blocker: none.

## Progress

- Baseline captured.
- Implemented and validated.

## Decision log

- #73 is required before #72 because #72 expands the set of hostile-rendered downstream claims.
- Hover claim previews keep optional outline nodes so existing lightweight preview behavior remains unchanged; committed `#claimOverlays` omit outlines by default.
- User-requested map zoom cap reduction was implemented as a separate adjacent change and will be committed separately from this phase.

## Outcomes / Retrospective

- Implemented grouped pattern-backed hostile hatches and removed default committed claim overlay outlines. Regression coverage now asserts grouped region coverage through `data-regions` and `data-visual-group-size`.
