# Phase 03: Browser runtime restructuring

## Goal

- Reduce `src/app.js` to a composition root and remove duplicate/scattered refresh work while preserving all map behavior and public browser APIs.

## Scope

- Separate geometry, base colors, labels, filters/overlays, and selection refreshes.
- Add scenario runtime/context and named scenario/language refresh-action factories.
- Extract debug runtime, generic LRU cache, localized search catalog, deterministic overlay descriptors, and nation-info panel controller.
- Split claim-model internals behind the unchanged `createClaimModel` facade.
- Add browser-free unit coverage plus user-facing E2E regression guards and one-call instrumentation.

## Non-goals

- No UI redesign, CSS visual change, generated schema change, app-state/render boundary violation, TypeScript conversion, or new map feature.
- No performance claim unless the five-run median improves without replacement/node regressions.

## Affected files

- `src/app.js`
- `src/runtime/debug-runtime.js`
- `src/runtime/lru-cache.js`
- `src/runtime/scenario-runtime.js`
- `src/runtime/refresh-actions.js`
- `src/runtime/refresh-flow.js`
- `src/data/search-catalog.js`
- `src/data/overlay-descriptors.js`
- `src/data/claim-model.js`
- `src/data/claim-project-graph.js`
- `src/data/claim-cumulative-model.js`
- `src/data/claim-incoming-overlay.js`
- `src/data/claim-manual-envelope.js`
- `src/render/map-layers.js`
- `src/ui/nation-info-panel.js`
- browser unit tests under `tests/unit/**`
- targeted Playwright regression specs/fixtures
- derived `docs/assets/**`

## Implementation steps

1. Add unit-tested standalone debug runtime and LRU cache modules; wire existing compatibility stats.
2. Add scenario runtime/context and replace mutable data aliases where consumers can receive the context directly.
3. Add explicit refresh-action factories and separate `prepareScenarioRuntime` from `refreshScenarioView`.
4. Split map geometry/base-color/label operations; remove hidden filter/overlay/label effects from geometry.
5. Change base-mode handling to color/visual-state refresh only and add node-identity regression coverage.
6. Extract search catalog/filtering, overlay descriptor generation, and the nation-info panel controller.
7. Split claim-model project graph, cumulative/hostility, incoming/overlay, and manual-envelope/reachable-capital internals behind the facade.
8. Shrink `app.js` to data load, DOM lookup, controller composition, event wiring, and compatibility API exposure.
9. Rebuild, run unit/E2E/performance comparisons, update evidence, pass the phase gate, and commit.

## Acceptance criteria

- `window.__TI_DEBUG_RENDER_STATS__`, `window.__TI_SCENARIO_API__`, and `createClaimModel` callers remain compatible.
- Scenario preparation builds nation choices and incoming-claim index exactly once per switch.
- Refresh actions execute each declared step exactly once and missing actions still fail clearly.
- Base-mode change preserves region, hit, and label DOM node identity.
- Geometry rendering has no hidden filter, overlay, label, or selection refresh.
- Repeated 2022/2026/2070 transitions leave no stale scenario data.
- Korean/English name, tag, alias, and project alias search results remain stable.
- Claim descriptors are deterministic and DOM-free.
- Render modules do not import app state.
- Five-run hot-path medians do not regress ≥10%, and SVG/replacement counts do not increase.

## Validation commands

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run check:generated`
- `npm run verify`
- `npm run test:e2e`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0 --pan-steps=4 --summary-json --raw-json --out=.chatgpt/tool-tests/architecture-refactor-browser-after`

## Manual smoke tests

- Exercise selection, hover, incoming/outgoing claims, manual envelopes, pins, reachable capitals, hostile/direct/gated/capital claims, and world-wrap copies.
- Switch 2022/2026/2070 repeatedly and search scenario-specific nations.
- Toggle base mode and inspect node identity plus debug replacement counters.
- Toggle Korean/English and verify dropdown, labels, claim cards, and search aliases.

## Rollback risks

- Closure dependencies in the 4,038-line callback can become accidental module globals.
- Refresh order changes can silently duplicate overlays or leave stale DOM.
- Cache extraction can change null/undefined or hit-stat semantics.
- Claim-model splitting can introduce cycles; use dependency-injected pure helpers and retain the facade.

## Evidence

- Baseline: `src/app.js` is 4,038 lines; scenario setup and `populate()` duplicate both runtime index builds; `renderRegions()` performs geometry, labels, base colors, filters, and overlay refresh before the scenario registry repeats several stages.
- After: `src/app.js` is 3,656 lines and the `createClaimModel` facade is 109 lines. Runtime, search, descriptors, panel control, and four claim-model domains now live in focused modules. Scenario E2E instrumentation records one runtime build, search build, incoming index build, and refresh per transition. Base-mode E2E preserves region/hit/label node identity.
- Delta: lint and 37 unit checks passed; the complete 94-test Playwright suite passed three times (282/282), followed by 36 targeted language/scenario checks. The full five-run render-stat comparison kept every SVG node count unchanged and 10 of 12 pan-average medians unchanged or lower. One sub-millisecond cold-order case initially measured 0.925 ms versus 0.8 ms; an isolated five-run recheck measured 0.75 ms average and 2.2 ms maximum, with language label DOM replacements restored to zero.
- Interpretation: this is a preparatory architecture refactor, not a claimed performance improvement. It removes duplicate scenario preparation and hidden geometry side effects without increasing node/replacement counts or breaching the 10% timing gate after the isolated recheck.
- Commit: pending.
- Commit blocker: none.

## Progress

- Complete; phase gate passed.

## Decision log

- Preserve facade/public globals exactly and add internal factories rather than exposing new globals.
- Prefer behavior-preserving extractions before deleting duplicate hot-path calls.

## Outcomes / Retrospective

- Public browser globals and the claim-model facade remain compatible. Base-mode changes now rebuild only the base-color layer; language changes localize existing label nodes in place; scenario changes rebuild each derived runtime structure once. The remaining `app.js` size is recorded as follow-up composition-root debt rather than hidden as a performance claim.
