# Phase 02: Hover claim overlay cache and immediate preview

## Goal

- Implement cached hover claim overlay descriptors and remove the fixed hover preview delay while preserving existing visual output.

## Scope

- Add LRU descriptor caches and debug stats in `src/app.js`.
- Route claim overlay path and label rendering through cached descriptors with separate language-sensitive label keys.
- Cache foreign-hover overlay descriptors by nation and claim filter state.
- Change hover preview scheduling from a timeout plus animation frame to animation-frame coalescing only.
- Remove the redundant overlay-clear full visual pass for active nation updates.

## Non-goals

- Do not cache live SVG nodes or keep hidden mounted overlay groups.
- Do not change claim data, generated data builders, or map geometry.
- Do not change selected/locked nation UX beyond making hover previews respond next frame.

## Affected files

- `src/app.js`
- Generated after build: `docs/assets/app.js`

## Implementation steps

- Add descriptor cache constants/maps and small LRU helpers near the existing overlay model cache.
- Add debug counters for descriptor builds and cache hits.
- Split path descriptor cache keys from label descriptor cache keys so language changes only rebuild labels.
- Convert `renderMapOverlay` to use cached descriptor arrays and descriptor-key render keys.
- Convert foreign-hover rendering to compute/cache descriptors once per nation/filter key and project them per copy context.
- Replace `hoverPreviewTimer`/`HOVER_PREVIEW_DELAY_MS` with requestAnimationFrame-only coalescing.
- Move `clearOverlayVisualState()` and its full visual-state apply into the no-active-nation branch of `updateNationOverlay`.

## Acceptance criteria

- Hover nation preview updates after animation-frame coalescing, not an 80 ms timeout.
- Returning to a recently hovered nation reuses overlay model and descriptor caches.
- Claim overlay path DOM is not replaced solely because language changed; labels still update.
- Foreign-hover overlay output remains visually equivalent and projected through the existing copy-context renderer.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e

## Manual smoke tests

- In default wrapped mode, hover Brazil, Bolivia, and back to Brazil; confirm claim overlays update promptly and each visible world copy has overlays.
- In `?worldWrap=0`, hover neighboring nations and confirm the hover pill/tooltip updates immediately while claim overlays follow without a perceptible fixed pause.

## Rollback risks

- Cache-key omissions could reuse stale descriptors after language/filter changes.
- Removing the fixed timer increases overlay updates during fast pointer movement; requestAnimationFrame coalescing and descriptor caching should keep this bounded.

## Progress

- Completed.

## Decision log

- Use descriptor caches rather than cached DOM groups because SVG nodes cannot be mounted in multiple copy groups and descriptor keys are easier to invalidate.
- Keep copy context out of descriptor cache keys and in render keys because descriptors are canonical-region data; projection happens while creating the fragment.

## Outcomes / Retrospective

- Implemented LRU caches for claim overlay path descriptors, claim label descriptors, and foreign-hover descriptors.
- Removed the fixed 80 ms hover preview timer; unlocked hover nation previews now coalesce to the next animation frame.
- Active nation overlay updates no longer clear overlay visual state before immediately applying the next model.
- `npm run build` regenerated `docs/assets/app.js` from `src/app.js`.
