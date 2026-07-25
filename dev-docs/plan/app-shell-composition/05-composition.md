# Phase 05: Assemble `createAppRuntime` and shrink `app.js`

## Goal

- Assemble state, data, renderer, interaction, and UI services in `createAppRuntime` and reduce `src/app.js` to a minimal data-loading entrypoint.

## Scope

- Add `createAppRuntime({window, document, generatedData})` returning `{start, destroy, setActiveScenario, setLanguage}`.
- Move scenario/language refresh registry assembly, service/controller creation, current-context updates, callback wiring, and refresh order into the runtime.
- Keep `src/app.js` limited to loading DOM, generated-data promise handling, runtime creation/start, and error presentation.
- Preserve public debug/scenario APIs and claim-model facade compatibility.

## Non-goals

- No low-level SVG, HTML, CSS, render-key/cache algorithm, raw map listener, or data-model implementation in the runtime.
- No behavior/schema/DOM redesign or new feature.
- No artificial file splitting solely to hit a line-count target.

## Affected files

- `src/app.js`
- `src/runtime/app-runtime.js`
- `src/runtime/refresh-actions.js`/`refresh-flow.js` only for narrow composition contracts
- extracted service/controller modules only for final wiring fixes
- focused runtime/service unit tests and `tests/e2e/runtime-lifecycle.spec.js`
- relevant scenario/debug E2E specs
- derived `docs/assets/**` only through build
- this phase file

## Implementation steps

1. Define runtime-owned semantic state adapters and current context.
2. Instantiate renderers/controllers and wire callbacks without circular imports.
3. Centralize scenario/language refresh action registration and ordering.
4. Expose lifecycle API; make `start`/`destroy` idempotent and ensure scenario/language methods update contexts before refresh.
5. Preserve `window.__TI_DEBUG_RENDER_STATS__`, `window.__TI_SCENARIO_API__`, and claim facade exposure/reset semantics.
6. Remove the data-promise implementation closure from `app.js`; retain only entrypoint/loading logic.
7. Add runtime API/orchestration unit tests and run cross-section E2E.
8. Record evidence, gate, and commit.

## Acceptance criteria

- `createAppRuntime` exposes exactly the required lifecycle/transition methods and safely starts/destroys.
- `app.js` contains only imports, loading UI helpers, data-promise startup, runtime start, and loading failure handling.
- Neither `app.js` nor the runtime contains low-level SVG/HTML/CSS, render-key/cache implementation, or raw map listener registration.
- Render/UI/interaction modules do not import `appState`; state-derived values are explicitly passed.
- Scenario/language/base/wrap refresh order, debug counters, public APIs, node identity, and UI behavior remain compatible.
- `2022 → 2026 → 2070 → 2022` shows no stale controller, cache, UI, or listener state.

## Validation commands

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run verify`
- `npm run test:e2e -- tests/e2e/scenario-runtime.spec.js tests/e2e/scenarios.spec.js tests/e2e/debug.spec.js tests/e2e/language.spec.js tests/e2e/world-wrap.spec.js`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py phase-gate --file dev-docs/plan/app-shell-composition/05-composition.md`
- after commit: `npm run check:generated`

## Manual smoke tests

- Start/destroy a runtime in unit fakes, call repeated start/destroy, and ensure no post-destroy frames/listeners execute.
- Exercise browser scenario API sequence and language changes while search/overlays/pins/wrap are active.
- Inspect `app.js` and runtime source for prohibited low-level responsibilities.

## Rollback risks

- Initialization order changes can expose incomplete DOM/context to existing services.
- Public API assignment/removal timing can break tests or external diagnostics.
- Moving all orchestration at once can conceal a new runtime God module; the responsibility audit is a hard acceptance gate.

## Evidence

- Baseline:
  - Phase 04 ended with a 2,505-line `src/app.js` that still owned runtime data aliases, selection/claim orchestration, marker aggregation, and refresh wiring.
  - Phase 01 recorded the public debug/scenario APIs, render counters, scenario/language behavior, and DOM identity requirements preserved by this phase.
- After:
  - `src/app.js` is 18 lines and now owns only generated-data promise handling, runtime creation/start, loading dismissal, and failure presentation.
  - `createAppRuntime({window, document, generatedData})` returns an exact frozen `{start, destroy, setActiveScenario, setLanguage}` API. A browser lifecycle test covers one-shot start, repeated start, idempotent destroy, API cleanup, and inert post-destroy transitions.
  - runtime composition uses one live `scenarioSnapshot`; the former mutable `REGIONS`/claims/indices/color/meta aliases and `syncRuntimeDataAliases` have been removed.
  - renderer/UI/interaction services read current scenario/model inputs through `getContext()` callbacks. `app-runtime.js` has no direct DOM query, class, dataset, style, value, or option access.
  - claim presentation, map presentation, map output aggregation, selection coordination, app-state adaptation, browser API installation, map-view behavior, app-shell UI, loading UI, and presentation formatting now have focused modules and lifecycle boundaries.
  - `npm run lint:js`: passed.
  - `npm run verify`: passed, including 61 Node tests, 48 Python tests, Pages rebuild, and generated-output verification.
  - full Playwright with a fresh two-worker server: 74/74 passed.
  - explicit `2022 → 2026 → 2070 → 2022` scenario sequence passed with stable canonical region count, cleared selection/claim state, and retained search results.
  - source audit found no `appState` imports in render/UI/interaction modules and no changes under `data/generated/**` or `graphify-out/**`.
- Delta:
  - low-level claim/manual/marker rendering and cache ownership, pointer/view interaction, search/nation UI state, output aggregation, and semantic selection transitions moved out of the entrypoint/runtime.
  - reachable-capital presentation deliberately performs the historical cached descriptor reads for panel and marker output, preserving debug cache-hit counter semantics without increasing descriptor builds or DOM replacements.
  - search selection clearing now preserves an in-progress replacement query, preventing stale default dropdown choices after changing an already selected nation.
- Interpretation: the entrypoint is now minimal and the runtime is a composition/refresh root rather than a data, DOM, interaction, or rendering implementation module. Scenario services consume a single live snapshot, lifecycle teardown is explicit and idempotent, and the public/browser/rendering contracts remain compatible across the complete automated suite.
- Commit: `eead65c` (`Introduce app runtime composition root`).
- Commit blocker: none.

## Progress

- Implementation, required validation, and phase commit complete.

## Decision log

- The runtime may own service construction and refresh sequencing only; algorithms and DOM construction stay in dedicated modules.
- A single immutable `scenarioSnapshot` is the runtime source of current scenario data; parallel mutable field aliases are prohibited because they can diverge during scenario transitions.
- Search and filter control DOM semantics stay behind app-shell/search APIs, and map class/label/path semantics stay behind the scene renderer.
- Runtime lifecycle behavior is verified in a real browser document with automatic entrypoint startup disabled for the test, avoiding a second runtime on the same DOM.

## Outcomes / Retrospective

- The composition boundary is explicit: state/data/presentation/interaction/UI services own their algorithms and local lifecycle, while `app-runtime.js` constructs them, connects callbacks, and orders scenario/language refreshes.
- `destroy()` now tears down interaction scheduling/listeners, selection context, map view controls, output/presentation services, scene state, UI controllers, and installed browser globals once.
- Focused cache-counter and replacement-query regressions found during cross-section E2E were corrected before the full suite, strengthening compatibility at the new service boundaries.
