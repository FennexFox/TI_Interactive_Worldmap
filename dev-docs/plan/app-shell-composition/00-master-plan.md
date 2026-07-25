# `app.js` composition-root extraction

## Issue Target And Scope Summary

- Issue target: `app-shell-composition`
- Title: Make `src/app.js` a true composition root
- Source plan: the user-provided six-stage `app.js` composition-layer plan
- Work type: architecture and performance-sensitive behavior-preserving refactor
- Scope: on `origin/develop` after PR #85, move rendering, map interaction, search, and nation-overlay behavior behind explicit services/controllers; assemble those parts through `createAppRuntime({window, document, generatedData})`; leave `src/app.js` responsible only for data loading, runtime startup, and loading-failure presentation.

## Plan Contract

- User-visible problem or feature outcome: the map must look and behave exactly as it does at the baseline while the browser entrypoint becomes a small, auditable composition root with explicit teardown and scenario/language context changes.
- Implementation scope:
  - introduce `createAppRuntime({window, document, generatedData})` returning `{start, destroy, setActiveScenario, setLanguage}`;
  - extract claim overlay/label buffering and hostile hatch rendering, manual-envelope rendering, and capital/selection/hover/pin/reachable marker rendering into renderer services;
  - extract hit-layer/map pointer, hover scheduling, click/drag, wheel, pan, and teardown behavior into a map interaction controller;
  - extract search/dropdown behavior and nation-overlay panel behavior into UI controllers;
  - assemble scenario/language refresh actions and callbacks in the runtime without importing `appState` from render/UI/interaction modules;
  - add focused unit tests for the new service/controller lifecycle contracts and preserve all public browser contracts.
- Non-goals:
  - no UI or DOM redesign, TypeScript conversion, generated JSON/data schema changes, new feature, or deliberate performance optimization;
  - no changes to selector/class/dataset names, SVG path/use shape, world-copy projection, claim descriptor semantics, or debug query/localStorage keys;
  - no direct edit to `docs/**`, `data/generated/**`, or `graphify-out/**`;
  - no `appState` imports from render, UI, or interaction modules;
  - no replacement of the runtime God module with another God module.
- Frozen compatibility surface:
  - browser globals: `window.__TI_DEBUG_RENDER_STATS__` and `window.__TI_SCENARIO_API__` with `scenarios`, `activeScenario`, and `setActiveScenario`;
  - claim facade returned by `createClaimModel`;
  - query keys: `worldWrap`, `debugRenderStats`, `disableHostileHatch`, `debugDisableHostileHatch`, `debugDisableLabels`, `debugUseCanonicalHitPaths`, and `debugClaimOverlayDelayFrames`;
  - localStorage keys: `ti-debug-render-stats`, `ti-disable-hostile-hatch`, `ti-map-language`, `ti-map-aside-card-collapsed`, and `ti-map-nation-info-sections`;
  - all existing DOM selectors/classes/datasets and SVG `<path>`/`<use>` structure.
- Acceptance criteria that can fail:
  - `src/app.js` contains no direct SVG construction, HTML/CSS assembly, render-key/cache implementation, or raw map-event registration;
  - `createAppRuntime` has the required four-method public lifecycle API and a repeated `destroy()` is safe;
  - renderers expose `render`, `clear`, `reset`, and `destroy` and consume current scenario/copy/i18n/debug context through calls rather than stale module closures;
  - controllers bind listeners once, remove listeners/observers/frames on destroy, and reset pending hover/preview state on scenario change;
  - `2022 → 2026 → 2070 → 2022` preserves correct scenario UI/data without duplicated listener behavior;
  - base-mode changes preserve region, hit, and label DOM identity;
  - `window.__TI_DEBUG_RENDER_STATS__`, `window.__TI_SCENARIO_API__`, the claim-model facade, debug flags, selectors, classes, datasets, and generated JSON schema remain compatible;
  - hot-path median timing does not reproduce a regression of 10% or more, and SVG node, DOM replacement, or cache-build counters do not increase for equivalent scenarios;
  - every phase validation and final audit passes.
- Validation commands:
  - `npm run lint`
  - `npm run test:unit`
  - `npm run build`
  - `npm run verify`
  - phase-targeted `npm run test:e2e -- <specs>`
  - final `npm run test:e2e`
  - `npm run check:generated` after each intentional build/commit boundary
- Manual smoke tests:
  - exercise scenario order `2022 → 2026 → 2070 → 2022`, language changes, base modes, search, claims, hostile/manual-envelope overlays, pins, reachable capitals, hover/click/drag, zoom/pan, and world wrap;
  - inspect debug globals and reset behavior;
  - confirm base-mode DOM identity and single listener effects through existing Playwright probes.
- Files likely to change: `src/app.js`, new/updated files under `src/runtime/**`, `src/render/**`, `src/interaction/**`, `src/ui/**`, `src/styles.css`, focused `tests/unit/**`, relevant `tests/e2e/**`, `dev-docs/plan/app-shell-composition/**`, derived `docs/assets/**`, and final refreshed `graphify-out/**`.
- Files that must not change: `data/generated/**`, generated JSON schemas, external Terra Invicta assets, unrelated source/build tooling, and generated outputs by hand.
- Generated artifact policy: source files and tests are authoritative; use `npm run build` to regenerate checked-in `docs/assets/**`; do not regenerate `data/generated/**`; refresh Graphify once after source and validation are final; inspect generated outputs only with targeted verifiers.
- Stop conditions:
  - a phase cannot keep the app buildable or preserve public/UI behavior;
  - a phase gate or required targeted test fails and cannot be corrected within the phase;
  - a safe phase commit cannot exclude unrelated user changes;
  - the implementation would require generated schema, game semantics, or DOM contract changes;
  - repeated equivalent performance measurement shows a 10% or greater hot-path median regression, increased persistent SVG/DOM replacements, or increased cache builds.

### Performance Contract

- Target interaction: initial overlay render, selected/hovered claim render, manual-envelope/reachable markers, map pan/hover, world-wrap toggle, scenario refresh, language refresh, and base-mode refresh.
- Reproduction scenario: checked-in Pages data in Playwright Chromium at 1400×950; use the existing render-stat matrix with wrap off/on and the four complex-overlay/label variants, five repeats, zero zoom steps, and four pan steps.
- Baseline metrics: SVG/node counts; label/claim/manual-envelope/marker replacement and cache counters; refresh/index-build counters; `panFrameMsAvg`/`panFrameMsMax` and render timings; DOM identity probes.
- Measurement method: retain raw and summary JSON in ignored `.chatgpt/tool-tests/app-shell-composition-*`, compare scenario medians, and record concise evidence in phase files.
- Before/after comparison method: use the same commit-derived data, browser executable, viewport, arguments, scenario names, repeat count, and interaction sequence.
- Non-success outcome: this work is a preparatory architecture refactor unless measurements prove an improvement; a reproducible ≥10% regression or increased node/replacement/cache-build work blocks completion.

## Strategy

1. Freeze the plan and collect correctness/performance evidence before source edits.
2. Move low-level rendering code behind context-fed services while preserving descriptors and DOM/debug semantics.
3. Move raw map event ownership and pending-frame lifecycle into one interaction controller.
4. Move search/dropdown and nation-overlay DOM ownership into UI controllers.
5. assemble the services and refresh registry in `createAppRuntime`, then reduce `src/app.js` to bootstrapping.
6. rebuild derived Pages assets, run the complete validation/performance comparison, refresh Graphify, and audit commits and scope.

## Phase Order

1. [Plan and performance baseline](01-baseline.md)
2. [Extract rendering services](02-rendering.md)
3. [Extract map interaction controller](03-interaction.md)
4. [Extract search and nation overlay controllers](04-ui.md)
5. [Assemble `createAppRuntime` and shrink `app.js`](05-composition.md)
6. [Rebuild, compare, audit, and prepare PR](06-final-validation.md)

## Phase Dependencies

- Phase 1 must be committed before any source edit.
- Phase 2 establishes rendering lifecycle contracts consumed by later controllers/runtime.
- Phase 3 depends on renderer reset hooks for transient hover/preview teardown.
- Phase 4 depends on stable semantic callbacks provided by the runtime.
- Phase 5 composes phases 2–4 and may only contain orchestration/entrypoint movement.
- Phase 6 depends on all source phases being committed and buildable.

## Source Of Truth Decisions

- This master plan and its six phase files are the only plan for this follow-up.
- The older `architecture-refactor` plan documents PR #85 and is historical context, not a competing active plan.
- `src/**`, `tests/**`, and `tools/**` are source of truth; `docs/**`, `data/generated/**`, and `graphify-out/**` are derived.
- Graphify is navigation only; inferred relationships must be checked in source with Serena or focused reads.

## Generated-file Policy

- Never hand-edit or line-review generated output.
- Run `npm run build` after source phases when needed for browser tests and once in the final phase for checked-in Pages output.
- Keep `data/generated/**` byte-for-byte unchanged.
- Refresh Graphify once, at the end, and summarize it only as refreshed navigation output.

## Global Validation Expectations

- Each source phase: `npm run lint`, `npm run build`, `npm run verify`, targeted Playwright specs, phase gate, reviewable commit, then `npm run check:generated`.
- Rendering phase target: `rendering`, `debug`, `pins`, and `world-wrap`.
- Interaction phase target: `debug`, `pan`, `pins`, and `world-wrap`, plus lifecycle unit tests.
- UI phase target: `search`, `overlays`, and `language`, plus controller unit tests.
- Composition phase target: scenario/runtime/debug contracts plus the full relevant cross-section.
- Final: complete Node/Python unit suite, full Playwright suite, five-run before/after comparison, generated-output cleanliness, Graphify cross-check, and Final/Commit Audit.

## Known Risks And Assumptions

- Baseline `src/app.js` is 3,656 lines and its data-promise closure contains 287 behavior functions, 42 mutable top-level runtime bindings, and 43 direct DOM creation/query sites (`^function`, `^(let|var)`, and the documented `document` call pattern).
- PR #85 already extracted state, data, low-level map layers, refresh actions, debug runtime, and several UI helpers; those modules should be reused rather than duplicated.
- Overlay double buffering, transient hover order, world-copy projection, and scenario context are tightly coupled and regression-sensitive.
- The branch was created from clean commit `f06889d`, equal to `origin/develop`.
- Current checked-in data is sufficient; no game install or Unity geometry extraction is required.
- Exact app/runtime line count is not itself a goal, but low-level rendering, interaction, and HTML/CSS implementations may not remain in either entrypoint or orchestration layer.

## Completion Classification Rules

- Complete: all lifecycle/module boundaries and entrypoint outcomes are implemented; all phase/final gates, performance boundaries, generated policy, and commit audit pass.
- Partially complete: useful extraction is implemented but one planned boundary, compatibility requirement, or mandatory validation remains.
- Preparation / instrumentation only: new structure/tests exist but `app.js` remains the behavioral shell or behavior is not fully validated.
- Blocked: an unavoidable external or safety-critical constraint prevents safe progress.
- Needs follow-up issue: this scope is validly complete but a distinct additional redesign or optimization remains.

## Final Audit Checklist

- [x] Final diff reviewed against the user request and this master plan.
- [x] `app.js` and `createAppRuntime` responsibilities reviewed directly.
- [x] Every phase acceptance criterion and outcome checked.
- [x] Validation and manual smoke evidence recorded.
- [x] Public browser/DOM/data contracts preserved.
- [x] Before/after performance evidence compared.
- [x] Generated-file policy followed.
- [x] Phase-sized commits and unrelated-change exclusion audited.
- [x] Completion classification assigned honestly.

## Commit Audit Requirements

- Phase-sized commits required: yes.
- Plan/baseline phase commit expectation: commit before source implementation.
- Per-phase commit expectation: commit implementation, tests, and phase evidence together.
- Commit blocker policy: document the blocker and stop before entering the next phase.
- Generated artifact policy: include only intentionally rebuilt Pages assets in the final phase and refreshed Graphify output once.
- Commit-flow non-compliance outcome: report separately even if code works.
