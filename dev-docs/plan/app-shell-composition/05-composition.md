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
- focused `tests/unit/app-runtime.test.js`
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

- Baseline: phase-1 public API/scenario/language/debug evidence.
- After: pending.
- Delta: pending.
- Interpretation: pending.
- Commit: pending.
- Commit blocker: none.

## Progress

- Not started.

## Decision log

- The runtime may own service construction and refresh sequencing only; algorithms and DOM construction stay in dedicated modules.

## Outcomes / Retrospective

- Not completed yet.
