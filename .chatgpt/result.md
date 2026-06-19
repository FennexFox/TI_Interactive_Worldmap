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

## SVG Overlay Optimization Follow-Up Pass

- Commits created:
  - `8eb288f` `Optimize SVG claim overlay rendering`
  - `b781d05` `Document SVG overlay optimization follow-up phases`
  - Final report commit: `Record SVG overlay follow-up evidence`
- Fresh baseline CSV: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T04-55-58-854Z.summary.csv`
- Phase 2 after CSV: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T05-08-48-468Z.summary.csv`
- Setup validation: both follow-up CSVs contain 80 rows with `setupOk=true` and empty `setupFailures`.
- Follow-up regression decision: the prior `wrap-on-disable-hatch` median `panFrameMsMax` was 5.400 ms; the fresh baseline remeasured it at 5.200 ms with unchanged median `setupClaimOverlayPathCount` of 58, so the signal is recorded as noisy/residual rather than a rollback trigger.
- Kept Phase 2 optimization: hostile hatch clip paths now use `<use>` references to the already-emitted outline paths instead of duplicating each full region path inside the clip path.
- Phase 2 metric comparisons, fresh baseline -> after:
  - `wrap-off`: median `setupClaimOverlayPathCount` 68 -> 63 (-7.4%); median `panFrameMsMax` 2.950 -> 2.700 ms (-8.5%); worst `panFrameMsMax` 5.200 -> 3.400 ms.
  - `wrap-off-disable-hatch`: median `setupClaimOverlayPathCount` 58 -> 58 (+0.0%); median `panFrameMsMax` 2.700 -> 2.500 ms (-7.4%); worst `panFrameMsMax` 6.200 -> 3.700 ms.
  - `wrap-on`: median `setupClaimOverlayPathCount` 88 -> 73 (-17.0%); median `panFrameMsMax` 5.600 -> 5.100 ms (-8.9%); median `panFrameMsAvg` 0.479 -> 0.415 ms (-13.4%); worst `panFrameMsMax` 10.700 -> 10.800 ms.
  - `wrap-on-disable-hatch`: median `setupClaimOverlayPathCount` 58 -> 58 (+0.0%); median `panFrameMsMax` 5.200 -> 5.200 ms (+0.0%); median `panFrameMsAvg` 0.469 -> 0.438 ms (-6.6%); worst `panFrameMsMax` 13.000 -> 8.600 ms.
- Phase 3 decision: no additional rebuild-gating source change was kept. Existing claim overlay render keys already include copy plan, descriptor cache key, and hostile-hatch-disabled state, and `tests/map-wrap.spec.js` verifies that wrapped panning does not churn claim overlay DOM, labels, hover overlays, foreign hover overlays, or capital markers.
- Verification for the follow-up pass: `npm run build`, `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6` before and after the kept change, `npm run verify`, `npx playwright test tests/map-wrap.spec.js`, and `npm run test:e2e`.
- Manual/smoke coverage reported: default world-wrap off, wrap toggle on/off, claim overlays, hostile hatching, hover overlays, labels, pinned markers, and Korean/English language refresh.
- Caveats and follow-ups: frame-time max values remain noisy, with a retained worst-row `wrap-on` max of 10.800 ms after the kept change. If future evidence shows overlay rebuild churn outside current pan/hover tests, extend `tools/measure_debug_render_stats.mjs` with rebuild-counter columns before changing render gating.

## Baseline Overlay Profiling Run

- Run ID: `2026-06-19T091000Z-baseline-overlay-profiling`
- Commits created:
  - `91c8e57` `Profile baseline overlay layers`
  - current HEAD `Record baseline overlay profiling results`
- Completion classification: preparation / instrumentation only.
- Fresh baseline CSV: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T09-46-24-773Z.summary.csv`
- Setup validation: 100 rows, all `setupOk=true`, all `setupFailures` empty.
- Added render-stat coverage for claim fill/outline path and use counts, hatch groups/paths/clip paths, claim labels, hit paths, labels, hover overlays, selection outlines, manual envelope overlays, pinned markers, total clip paths, and overlay replacement counters.
- Added `wrap-off-complex-overlays`, a single-copy scenario that selects China / Greater Pan-Asia, keeps extra pinned nations, enables labels, and primes hover overlays.
- Baseline `wrap-off-complex-overlays`: median `panFrameMsMax=3.750 ms`, median `panFrameMsAvg=0.536 ms`, median `visibleSvgNodeCount=1315`.
- Largest single-copy contributors: `hitPathCount=363`, `labelCount=363`, `claimOutlinePathCount=56`, `claimHatchGroupCount=5`, `claimClipPathCount=5`, `setupForeignHoverOverlayPathCount=3`.
- Decision: no compound visual overlay optimization was kept. Existing helpers already group claim fills and foreign/secondary hover fills; the only meaningful visual candidate was grouping 56 per-region claim outlines, but tests and DOM semantics intentionally preserve those per-region outline nodes.
- Verification: `npm run build`, `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`, `npm run verify`, `npx playwright test tests/map-wrap.spec.js`, `npm run test:e2e`, and a focused Playwright smoke script for default wrap off, wrap toggle, claims, hostile hatch, hover overlays, labels, pinned panel, and Korean/English language refresh.
- Follow-up recommendation: profile label rendering/toggling ergonomics next, or open a broader renderer-strategy investigation for labels and hybrid Canvas/SVG visuals while preserving hit paths and semantic overlays.
