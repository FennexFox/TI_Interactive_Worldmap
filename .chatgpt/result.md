# Work Summary

## Commits Created

- `23c0d74` `Improve overlay render diagnostics`
- `05db4fc` `Default world wrap off with toggle`
- `d6dcad7` `Gate SVG overlay optimization iteration`
- `e19a5a9` `Measure explicit world-wrap render scenarios`

## World-Wrap Change

- Changed world-wrap startup behavior so it defaults off unless explicitly enabled with `worldWrap=1`.
- Added a map control checkbox for enabling world-wrap at runtime.
- Added localized warning text noting that world-wrap may reduce performance when complex overlays are visible.
- Rebuilt projected SVG layers when toggling world-wrap so base regions, hit paths, labels, overlays, markers, and selection visuals switch between single-copy and wrapped render plans.
- Kept debug render stats in sync with the current world-wrap state.
- Rebuilt checked-in Pages assets from source.

## Tests And Verification

- `npm run verify`
- `npx playwright test tests/map-wrap.spec.js`
- `npm run test:e2e`

All verification passed, including the full Playwright suite with 75 passing tests.

## SVG Overlay Optimization Iteration

- Baseline CSV: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T04-11-32-836Z.summary.csv`
- After CSV: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T04-24-52-464Z.summary.csv`
- Kept optimization: wrapped claim fill and outline copies now reuse canonical claim paths through SVG `<use>` nodes instead of duplicating path geometry for every world copy.
- Primary metric: `wrap-on` median `setupClaimOverlayPathCount` dropped from 204 to 88 (-56.9%) while median `panFrameMsMax` stayed 5.200 ms and median `panFrameMsAvg` improved from 0.461 to 0.414 ms.
- Caveat: diagnostic `wrap-on-disable-hatch` median `panFrameMsMax` regressed from 4.650 to 5.400 ms, so this is recorded as a follow-up signal.
- Fixed language refresh for the world-wrap warning title; Korean and English warning titles now update after changing the language selector.
- Validation after the final source change passed: `npm run verify`, `npx playwright test tests/map-wrap.spec.js`, `npm run test:e2e`, plus a Playwright smoke script for default wrap off, wrap toggle, wrapped claim `<use>` copies, copied hover overlay, and localized warning titles.
