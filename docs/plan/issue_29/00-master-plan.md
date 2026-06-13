# Reduce rapid hover flicker with double-buffered claim overlay transitions

## Issue Target And Scope Summary

- Issue target: #29
- Title: Reduce rapid hover flicker with double-buffered claim overlay transitions
- Source plan: None; issue context from GitHub issue #29.
- Scope: Preserve the #27 descriptor caches while changing claim overlay path/label DOM updates to use double-buffered SVG group swaps, with stale render cancellation and debug counters for buffer activity.

## Strategy

- Keep implementation in `src/app.js`, which already owns app state orchestration and claim overlay rendering. Do not move render state into `src/render/map-layers.js`.
- Wrap the existing `#claimOverlays` and `#claimLabels` contents in two buffer groups per layer. Build replacement fragments into the inactive buffer, then swap group visibility only after the inactive buffer is complete.
- Keep the previous visible buffer mounted until the new buffer is ready. After a successful swap, clear the old inactive buffer so stable DOM counts still reflect one visible overlay set.
- Track a claim overlay render generation. Any delayed or superseded render callback must skip instead of replacing newer state.
- Preserve existing descriptor cache APIs and render keys. The buffering layer sits after descriptor lookup and before DOM visibility swap.
- Add debug render stats for inactive-buffer rebuilds, buffer swaps, and stale skips. Add a debug-only query parameter to defer claim overlay commits by a small number of frames so stale cancellation can be tested deterministically without delaying normal app behavior.
- Regenerate `docs/assets/app.js` with `npm run build`; do not hand-edit generated deployment artifacts.

## Phase Order

1. [Discovery and boundaries](01-discovery.md)
2. [Double-buffered claim overlay transitions](02-implementation.md)
3. [Regression coverage and validation](03-verification.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- There is no earlier local plan for issue #29.
- GitHub issue #29 is the authoritative product/acceptance source.
- Existing #27 descriptor cache behavior is a requirement and must remain covered by tests.

## Global Validation Expectations

- npm run build
- npm run verify
- npm run test:e2e

## Known Risks And Assumptions

- Playwright can prove stable DOM state and debug counters, but visual flicker is perceptual; include a manual browser smoke check.
- Hidden inactive buffers may temporarily contain overlay nodes during the same commit, so the implementation must clear old buffers after swaps to keep existing DOM-count assertions stable.
- A debug-only delayed commit hook is acceptable for stale-render regression testing as long as normal runtime uses immediate next-frame rendering and tooltip/hover pill updates remain immediate.
