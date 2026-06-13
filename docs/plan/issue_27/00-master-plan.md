# Cache or reuse hover claim overlays to reduce border-hover flicker

## Issue Target And Scope Summary

- Issue target: #27
- Title: Cache or reuse hover claim overlays to reduce border-hover flicker
- Source plan: None; issue context from GitHub issue #27.
- Scope: Reduce border-hover claim overlay churn in the browser app by caching derived overlay descriptors, making hover nation preview a next-frame update instead of a fixed delayed timer, and adding focused regression coverage for cache reuse and wrapped/unwrapped rendering.

## Strategy

- Keep implementation in `src/app.js` and tests; regenerate checked-in `docs/**` output with `npm run build`.
- Preserve the existing ES module boundaries: `src/app.js` owns app orchestration and passes render inputs to `src/render/map-layers.js`; render helpers remain state-agnostic.
- Add small LRU caches for derived claim overlay path descriptors, claim label descriptors, and foreign-hover descriptors. Keys include scenario/data version, nation, claim mode, claim kind, project/active incoming filters where relevant, language only for label descriptors, and copy context only in final render keys.
- Replace the 80 ms hover preview debounce with requestAnimationFrame coalescing so region hover outlines and tooltips remain immediate while claim overlays update on the next frame.
- Avoid clearing overlay visual state before rendering the next active nation model; only clear when there is no active nation. This prevents an unnecessary full visual pass and avoids transient overlay-off state during hover transitions.
- Extend debug render stats and Playwright tests to prove cache hits when returning to a recently hovered nation and to verify both `?worldWrap=0` and default wrapped rendering.

## Phase Order

1. [Discovery and boundaries](01-discovery.md)
2. [Hover claim overlay cache and immediate preview](02-implementation.md)
3. [Regression coverage and validation](03-verification.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- There is no earlier local plan for issue #27.
- Generated deployment output under `docs/**` must come from `npm run build`, not hand edits.

## Global Validation Expectations

- npm run build
- npm run verify
- npm run test:e2e

## Known Risks And Assumptions

- Debug render stats are test-only instrumentation exposed only when `debugRenderStats` is enabled.
- Descriptor caches must not let language-specific claim labels reuse stale text; path descriptors should remain reusable across language changes.
- World wrapping is static for the current page load, so descriptor caches can stay copy-context agnostic while render keys include the active copy plan.
- Playwright tests exercise DOM churn and projection behavior, but visual flicker is ultimately human-perceptual; manual smoke checks still matter.
