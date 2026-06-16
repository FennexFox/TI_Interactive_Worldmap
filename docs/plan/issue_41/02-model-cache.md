# Phase 02: Manual envelope and reachable candidate cache

## Goal

- Remove duplicate manual envelope and reachable-capital descriptor computation during one selected/pinned megastate refresh.

## Scope

- Add bounded LRU caches for manual envelope models and reachable candidate descriptors.
- Key cache entries by active scenario/data version, anchor nation, pinned claimant set, claim filters, active incoming claim where conservative, and anchor-only/manual-envelope mode.
- Share one reachable candidate descriptor list between the candidates panel and SVG marker renderer.
- Preserve existing DOM render-key checks for manual envelope overlays and candidate markers.

## Non-goals

- Do not change which regions are included in the manual envelope.
- Do not change which capital candidates are shown or omitted.
- Do not extract render modules unless needed for the cache boundary.

## Affected files

- `src/app.js`
- `tests/language.spec.js`
- `tests/map-wrap.spec.js` if world-wrap candidate expectations need counter coverage

## Implementation steps

- Split uncached manual envelope construction from cached lookup.
- Replace repeated `buildManualEnvelopeModel(...)` call sites with cached lookup.
- Add reachable candidate descriptor caching and reuse the descriptor list inside `refreshReachableCapitalCandidateOutputs`.
- Remove selected-region state from claim overlay descriptor keys when the selected region does not affect overlay geometry.
- Add e2e assertions showing repeated panel/marker refreshes use cache hits instead of duplicate descriptor builds.

## Acceptance criteria

- One manual envelope model build can serve manual envelope rendering, active preview scope, and reachable candidate discovery for the same state.
- One reachable candidate descriptor build can serve both panel and SVG marker rendering for the same refresh.
- Existing manual expansion and reachable capital tests still pass.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e -- tests/language.spec.js tests/map-wrap.spec.js

## Manual smoke tests

- Select China and confirm North Honshu remains reachable.
- Pin North Honshu and confirm the manual envelope includes Japanese depth-1 claims.
- Toggle reachable capitals off/on and confirm markers/panel stay synchronized.

## Rollback risks

- Cache keys that omit a state input could show stale candidates or manual envelopes.
- Cache keys that include too much state could preserve correctness but miss the performance goal.

## Progress

- Completed local LRU caching for manual envelope models.
- Completed local LRU caching for reachable capital candidate descriptors.
- Shared one reachable candidate descriptor list across panel and SVG marker rendering in `refreshReachableCapitalCandidateOutputs`.
- Removed selected-region state from claim overlay/label descriptor keys while keeping it in the overlay model cache for panel correctness.

## Decision log

- Keep caches local to `src/app.js` for now because the surrounding inputs are still DOM/app-state owned there.

## Outcomes / Retrospective

- Completed. Repeated manual envelope and reachable candidate requests for the same state now hit caches, while cache keys still include active scenario/data version, anchor, pins, and claim filters.
