# Architecture Refactor Plan

This plan captures a local working proposal for reducing coupling in the browser app and related build tooling. It is planning context, not a design contract. Current source, tests, generated-output verifiers, and `dev-docs/architecture.md` remain authoritative.

## Context

The project is a static Terra Invicta claim and unification map. The checked-in browser source lives under `src/**`; generated Pages output lives under `docs/**` and should not be hand-edited. Build and data generation work lives under `tools/**`, with verification through `npm run verify` and Playwright coverage for user-facing browser behavior.

The browser runtime is intentionally split into focused layers:

- `src/app.js`: composition and orchestration.
- `src/state/**`: app interaction state, map view state, and map visual state.
- `src/data/**`: active scenario access, derived indices, and claim model logic.
- `src/interaction/**`: local DOM interaction controllers such as map pan and tooltip scheduling.
- `src/render/**`: low-level SVG layer rendering helpers.
- `src/runtime/**`: named refresh and scheduling flows.
- `src/ui/**`: UI rendering, controls, panels, localization, and map controls.

The main architectural pressure point is that `src/app.js` still owns most browser workflow orchestration. It imports every major browser layer and contains selection, hover, overlay, scenario, language, render, debug, and DOM wiring behavior in one large module.

## Goals

- Keep `src/app.js` as the composition root while reducing its direct workflow surface.
- Preserve explicit module boundaries: state does not render, render does not own app state, data does not depend on visual state, and UI/interaction modules receive callbacks rather than importing app state.
- Make refresh, overlay, and debug flows easier to test in isolation.
- Avoid behavior changes while moving code. Each phase should have small, reviewable diffs.
- Keep generated artifacts derived from source changes only.

## Non-Goals

- Do not redesign the app UI.
- Do not change generated scenario schema unless a specific feature requires it.
- Do not hand-edit `docs/**`, `data/generated/**`, or Graphify output as source.
- Do not combine performance rewrites with mechanical module extraction unless required to keep behavior stable.

## Proposed Phases

### Phase 1: Extract Debug Runtime Helpers

Move debug and profiling helpers out of `src/app.js` into a focused runtime module, for example `src/runtime/debug.js`.

Candidate ownership:

- debug query and localStorage flag parsing;
- render stat creation and recording;
- optional debug probes used by measurement scripts;
- label and hit-path debug switches.

Why first:

- Debug paths are important but should not dominate the main app orchestration flow.
- This phase is relatively low risk because debug behavior is opt-in.
- It reduces cross-cutting branches before touching user-facing selection or overlay logic.

Validation:

- `npm run verify`
- Existing Playwright tests that exercise normal map behavior.
- Manual check with relevant debug query parameters when changing debug-visible behavior.

### Phase 2: Make Refresh Action Registries Explicit

Keep `src/runtime/refresh-flow.js` as the ordered step runner, but move action map construction into named factories, such as:

- `createScenarioRefreshActions(context)`
- `createLanguageRefreshActions(context)`

The factories should receive explicit dependencies through a context object and return the action map consumed by `runRefreshSteps()`.

Why:

- Refresh ordering is already declarative, but the dependencies behind each action are hard to inspect when defined inline inside `src/app.js`.
- A factory makes missing dependencies and refresh action names easier to test.
- This creates a stable place to add future scenario or language refresh behavior.

Validation:

- Unit-level coverage for missing action errors if practical.
- `npm run verify`
- `npm run test:e2e` because scenario and language refresh are user-facing.

### Phase 3: Split App Orchestration by Workflow

Extract workflow modules from `src/app.js` while keeping `src/app.js` responsible for composing dependencies.

Candidate modules:

- `src/runtime/app-bootstrap.js`: data promise resolution, initial runtime data construction, loading failure handling.
- `src/runtime/selection-flow.js`: selected nation, locked nation, selected regions, hover transitions, and clear-selection flow.
- `src/runtime/overlay-flow.js`: claim overlays, hover preview, manual envelope overlay, pinned region markers, and reachable capital candidates.
- `src/runtime/scenario-flow.js`: active scenario switching and runtime data alias updates.

Each module should receive dependencies as parameters. Avoid importing `appState` directly from extracted runtime modules.

Why:

- Graphify identifies app interaction flow, overlay models, visual rendering, pinned region state, reachable capital UI, and refresh flow as distinct communities.
- This phase converts those communities into source-level boundaries.
- Smaller workflow modules make future feature work easier to scope and review.

Validation:

- `npm run verify`
- `npm run test:e2e`
- Targeted manual checks for selection, hover, pins, reachable capital candidates, scenario switching, and language switching.

### Phase 4: Promote Overlay Descriptor Generation

Move pure descriptor and cache generation out of `src/app.js` into data-oriented modules where possible.

Candidate modules:

- `src/data/overlay-descriptors.js`
- or a narrower expansion of `src/data/claim-model.js`

Keep DOM and SVG mutations in rendering/runtime code. The data module should return deterministic descriptor objects, not elements.

Why:

- Overlay behavior spans claim model data, descriptor caches, render buffers, hover previews, pins, and manual envelopes.
- Separating pure descriptor generation from DOM mutation improves testability and reduces accidental visual-state coupling.

Validation:

- Focused tests for descriptor keys and region sets if practical.
- `npm run verify`
- `npm run test:e2e`
- Visual/manual checks for hostile claims, direct claims, projectless claims, capital claims, pinned regions, and manual envelopes.

### Phase 5: Consolidate Build Tool Utilities

Extract shared helper code used by `tools/build_pages.py`, `tools/rebuild_pages.py`, catalog builders, and generated-output verifiers.

Candidate utilities:

- JSON loading and writing helpers;
- deterministic gzip or serialization helpers;
- scenario bundle path helpers;
- common template path discovery or validation logic.

Why:

- Build tooling has several related communities: Pages build, Pages rebuild, claim data builder, nation catalog builder, generated output verify, and WSL build script.
- Small shared utilities can reduce duplication without changing generated output semantics.

Validation:

- Python unit tests under `tests/**`
- `npm run verify`
- A checked-in/UI build with `npm run build` when build behavior changes.

## Risk Areas

- SVG performance and node counts: labels, hit paths, world-wrap copies, claim outlines, hostile hatching, and overlay buffers are performance-sensitive.
- Refresh ordering: scenario and language refresh flows can regress subtly if an action moves earlier or later.
- App state versus visual state: avoid moving semantic state into `map-visual-state.js`.
- Generated output: source changes that affect `docs/**` must be rebuilt, not hand-edited.

## Suggested Review Strategy

- Prefer one phase per PR.
- Keep mechanical moves separate from behavior changes.
- Add or adjust tests before changing high-risk user-facing flows.
- After each phase, update `dev-docs/architecture.md` only if a durable module boundary changed.
- Refresh Graphify after meaningful source movement with `graphify . --update`.

## Remote Publication

This plan is currently documented locally only. If it should be tracked remotely, copy or adapt this document into a GitHub issue, project item, or PR description and keep this local file as implementation context until the remote tracker becomes the source of truth.
