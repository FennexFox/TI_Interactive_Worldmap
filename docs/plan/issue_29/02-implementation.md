# Phase 02: Double-buffered claim overlay transitions

## Goal

- Add double-buffered claim overlay and label transitions with stale render cancellation while keeping #27 descriptor caching intact.

## Scope

- Add debug counters and a debug-only delayed overlay commit query option.
- Add claim overlay/label buffer state and swap helpers.
- Replace direct `replaceLayerChildrenForRenderKey` use for claim path/label render with buffered swaps.
- Keep empty clears synchronous and correct.

## Non-goals

- Do not cache per-nation mounted SVG groups.
- Do not change claim semantics, project filtering, or language text.
- Do not introduce a framework or broad rendering rewrite.

## Affected files

- `src/app.js`
- Generated after build: `docs/assets/app.js`

## Implementation steps

- Add debug stats: inactive buffer rebuilds, buffer swaps, stale render skips.
- Add `debugClaimOverlayDelayFrames` parsing for deterministic stale-render tests.
- Add WeakMap-backed buffer states for claim path and label layers.
- Build next fragments into inactive buffers, check generation before and after build, then swap visibility and clear the old inactive buffer.
- Increment generation on clear to cancel pending render commits.
- Keep render-key skip behavior so unchanged overlays still avoid DOM churn.

## Acceptance criteria

- Previous overlay stays visible until the next buffer is complete.
- Buffer swaps are counted in debug stats.
- Stale render requests skip and cannot replace newer hover state.
- Existing descriptor cache counters still record hits/builds.
- Empty states clear both buffers correctly.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e

## Manual smoke tests

- Open default wrapped mode with `?debugRenderStats=1`, rapidly hover Brazil/Bolivia, and confirm claim overlays do not blank between transitions.
- Repeat with `?worldWrap=0&debugRenderStats=1`.

## Rollback risks

- Buffer DOM wrappers could affect tests that count descendants under `#claimOverlays` or `#claimLabels`; stable states must keep inactive buffers empty.
- Async commit ordering could make tests flaky unless stale tokens and wait helpers are precise.

## Progress

- Completed.

## Decision log

- Use SVG `<g>` buffers under existing `#claimOverlays` and `#claimLabels` nodes so CSS and layer ordering remain unchanged.
- Keep path and label buffering separately so language changes can swap labels without path overlay churn.

## Outcomes / Retrospective

- Added double-buffered SVG group state for claim overlay paths and labels.
- Claim overlay and label fragments now build into the inactive buffer and swap visibility only after the inactive buffer is complete.
- Pending overlay renders are guarded by generation tokens. Returning to the current visible key cancels a stale pending render before it can swap.
- Empty clears synchronously clear both buffers and cancel pending renders.
- Added debug counters for inactive buffer rebuilds, buffer swaps, and stale render skips, plus `debugClaimOverlayDelayFrames` for deterministic stale-render tests.
