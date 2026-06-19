# Issue #16 follow-up: zoomed SVG overlay performance

## Why this belongs under #16

Issue #16 already tracks renderer boundaries, compound overlay rendering, map view/camera state, dirty-layer scheduling, and heavier claim-overlay rendering optimizations. The current regression is a concrete example of that broader architecture risk: after hostile claim hatching and foreign/secondary hover overlays were added, zoomed-in map interaction became slower across panning, hover, and overlay replacement.

Issue #19 is related because it covers secondary capital-hover previews, and it already warns that pointer movement over dense areas should not introduce noticeable lag. However, the current problem is broader than the #19 feature behavior. It affects the general SVG rendering budget when the map is zoomed in and the page contains heavy claim/hover overlay layers.

## Observed symptoms

- Zooming in makes panning noticeably slower.
- Zooming in also makes non-pan interactions slower, including foreign hover overlays and other hover/overlay work.
- The slowdown is worse after hostile claim overlay/hatching was introduced.
- The app appears to keep the full map, hit layer, world-wrap copies, and overlay layers in the DOM even when zoomed into a small viewport.

## Likely causes to investigate

- The map view changes only the SVG `viewBox`, so the browser still has to paint and hit-test the full SVG scene.
- World-wrap rendering duplicates heavy layers across `-1`, canonical, and `+1` world copies.
- Hostile claim hatching currently creates per-region `clipPath` and hatch paths, which can be expensive to repaint under zoom/pan.
- Foreign and secondary hover overlays currently create per-region paths instead of reusing compound/grouped path rendering where possible.
- The visible SVG node count and path complexity may now be high enough that style invalidation, paint, and hit-testing dominate over JavaScript execution.

## Proposed follow-up scope

Treat this as a focused performance follow-up under #16, not as a full renderer rewrite.

1. Add a lightweight diagnostic switch or stats path for comparing:
   - normal behavior,
   - hostile hatch disabled,
   - world-wrap disabled,
   - claim display off,
   - foreign/secondary hover overlay active.
2. Reduce DOM/path pressure for transient hover overlays:
   - convert foreign/secondary hover overlays to grouped/compound paths where practical;
   - preserve the existing visual semantics and pointer behavior.
3. Isolate hostile hatching cost:
   - add a safe debug/query option to disable hostile hatching while keeping hostile claims visible by stroke/fill styling;
   - use it to verify whether hatching is the main zoomed-paint cost.
4. Consider a later follow-up if needed:
   - viewport-aware rendering/culling for heavy overlay layers;
   - rendering fewer world-wrap copies for heavy overlays when the viewport is not near a seam;
   - Canvas/SVG hybrid rendering for static fill-heavy layers.

## Acceptance criteria for the first optimization pass

- The app still renders selected nation claims, hostile/peaceful distinction, foreign hover overlays, secondary hover overlays, selection, pinned markers, and hit detection correctly.
- Foreign/secondary hover overlay replacement creates substantially fewer SVG nodes or paths than the current per-region path implementation where practical.
- A debug/query option exists to disable hostile hatching without disabling hostile claim visibility entirely.
- `?worldWrap=0`, claim display off, and hostile hatch disabled can be used as manual A/B checks.
- Existing verification passes with `npm run verify`.
- Existing or updated Playwright tests pass with `npm run test:e2e` when feasible.

## Manual smoke tests

- Select a large-claim nation and zoom into dense Europe; pan and hover across multiple regions.
- Compare the same interaction with `?worldWrap=0`.
- Compare the same interaction with hostile hatching disabled.
- Select a nation whose expansion range contains foreign capitals; hover eligible and non-eligible regions.
- Toggle claim display between all/project/off and verify stale overlays are not left behind.
