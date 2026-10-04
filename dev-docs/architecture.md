# Working architecture map

This is a working architecture map for `TI_Interactive_Worldmap`, not a frozen design contract.

Update it when `src/**`, `tools/**`, or generated-output boundaries change materially. If this document becomes stale, the current source, tests, and generated-output verifiers win.

## Repository boundary

- `src/**`: browser app source. Edit this for user-facing app behavior.
- `src/state/**`: state modules for app interaction, viewport, and visual state.
- `src/data/**`: active scenario access and derived lookup indices.
- `src/interaction/**`: DOM interaction controllers for map input, viewport controls, pan, and tooltip scheduling.
- `src/render/**`: SVG scene, overlay presentation, output coordination, and low-level layer helpers.
- `src/runtime/**`: composition root, focused service wiring, and refresh sequencing; durable interaction state stays in state modules.
- `src/ui/**`: UI rendering and control-binding helpers for panels, controls, localization, and map controls.
- `tools/**`: catalog builders, page builders, generated-output verifiers, and measurement scripts.
- `tests/**`: Python and Playwright regression coverage.
- `data/manual/**`: hand-maintained normalization inputs.
- `data/generated/**`: generated Terra Invicta-derived catalogs and scenario bundles.
- `docs/**`: generated GitHub Pages output. Do not use this as a documentation folder and do not hand-edit it as source.
- `dev-docs/plan/**`: active per-issue and per-PR plans; completed folders are disposable.
- `dev-docs/performance-notes.md`: source-checked performance invariants and historical measurement limits.
- `.chatgpt/**`: local run handoffs, receipts, and generated measurement artifacts.
- `graphify-out/**`: generated code-navigation output. Use it as a map, not as source of truth.

## Browser runtime flow

```text
src/index.html
  -> src/app.js (browser bootstrap)
     -> src/runtime/app-runtime.js (composition and lifecycle)
        -> scenario-context.js (active scenario data and derived runtime)
        -> app-state-adapter.js (state transitions)
        -> claim-selection-runtime.js (claim presentation, map outputs, selection)
        -> ui-runtime-bindings.js (search and nation panel semantics)
        -> refresh-coordinator.js (scenario, language, world-wrap ordering)
        -> debug-runtime.js and browser-api.js
        -> map-view and map-interaction controllers
        -> map scene, presentation, and output controllers
        -> app-shell and focused UI controllers
```

`src/app.js` reads generated browser data and starts the runtime. `src/runtime/app-runtime.js` constructs major controllers, connects focused runtime modules, owns idempotent start/destroy, and exposes the frozen public runtime API.

The composition root retains one live scenario snapshot. Every focused runtime receives a getter for this snapshot; scenario refresh replaces it before rebuilding catalogs and reconciling state. Callbacks resolve the current snapshot at invocation time.

State modules should not render. Render modules should not own app state. Data modules should not depend on visual state. UI and interaction modules receive state-derived values and callbacks through runtime composition rather than importing app state directly.

## State modules

### `src/state/app-state.js`

Owns app-level interaction state and transition helpers. This is the place for selected nation/region, active claim context, pinned/manual-envelope state, filters, and similar interaction state.

### `src/state/map-view-state.js`

Owns viewport-oriented state: zoom, pan, world-wrap view behavior, and map view transitions. It should stay focused on view mechanics rather than semantic overlay meaning.

### `src/state/map-visual-state.js`

Owns visual bookkeeping for currently applied map classes, region visibility, overlay classes, and related render-diff state. It should not become a second app-state container.

## Data modules

### `src/data/active-data.js`

Resolves the active scenario data exposed to the app. It is the boundary between generated scenario bundles and runtime app logic.

### `src/data/derived-indices.js`

Builds lookup indices derived from active scenario data. Keep this module deterministic and data-only.

### `src/data/claim-model.js` and claim submodels

`claim-model.js` preserves the external `createClaimModel` facade. Project graph,
cumulative/hostility, incoming-overlay, and manual-envelope/reachable-capital logic
live in focused pure submodels and remain testable without DOM access.

Claim builders select scenario-filtered direct `Claim` rows. The browser claim
model applies research-prerequisite inheritance; it does not simulate save-specific
territory absorption. In `tools/build_claim_data.py`, `regionRaw` keeps the
scenario-prefix-normalized source template ID, while `region` holds the
alias-resolved canonical map-region ID used for lookup. Rendering joins by that
canonical ID and gets user-facing text from localized `displayName`, then
`primaryCity`, then a readable form of `regionName`. Keep source IDs, canonical
keys, and display labels distinct; display text is not a join key. Starting
ownership remains sourced separately from scenario-filtered `initialOwner` rows,
as documented in the root README.

### `src/data/search-catalog.js` and `src/data/overlay-descriptors.js`

Build localized search entries/query results and deterministic overlay descriptors.
Neither module reads or mutates the DOM.

## Interaction modules

### `src/interaction/map-interaction-controller.js`

Owns map and hit-layer event binding, hover and click routing, wheel input,
coalesced animation-frame scheduling, tooltip invalidation wiring, and event and
observer cleanup. It delegates drag mechanics and tooltip behavior to focused
controllers and receives semantic callbacks from runtime composition.

### `src/interaction/map-pan.js` and `map-view-controller.js`

`map-pan.js` tracks drag state, the drag threshold, pointer capture, click
suppression, and post-pan hover refresh through injected callbacks. The map view
controller owns the live viewport object, zoom and reset controls, world-wrap
copies, and the SVG `viewBox`; scheduled writes use the interaction controller's
RAF queue. Logical wheel zoom is applied for each event while the viewBox write is
batched.

### `src/interaction/tooltip.js`

Owns tooltip position scheduling, cached layout measurements, and hide/show state. It does not decide hover semantics or tooltip copy.

## Rendering modules

### `src/render/map-layers.js`

Contains low-level SVG layer and world-copy helpers. Render modules receive
state-derived values through parameters or injected context rather than importing
app state directly.

### Scene and presentation ownership

- `map-scene-renderer.js` owns base region geometry, hit paths, labels, grid,
  visibility state, and base-color rendering. Its unchanged-input base-color path
  preserves existing SVG children; invalidation follows its effective visible
  region, color, mode, and copy inputs.
- `map-presentation-controller.js` coordinates claim, manual-envelope, and marker
  renderer requests using injected presentation context.
- `map-output-controller.js` derives selection, pin, capital, reachable-capital,
  and panel outputs from injected state and data, then delegates SVG presentation.
- `claim-overlay-renderer.js`, `manual-envelope-renderer.js`, and
  `map-marker-renderer.js` own focused SVG overlay and marker construction.

Keep this module careful around:

- base visual region paths;
- hit paths and event-target identity;
- claim outlines;
- hostile claim hatching;
- labels;
- hover and selection overlays;
- pinned/manual-envelope markers;
- world-wrap copies.

## Runtime modules

### Focused runtime composition

`claim-selection-runtime.js` constructs claim presentation, map presentation and
output controllers, and selection coordination. It resolves initialization order
through injected getters and `selectionCoordinator.setContext({outputs})` rather
than forwarding wrappers.

`ui-runtime-bindings.js` binds search catalog/filter callbacks, nation panel claim and region actions, and shell filter controls. It reads current scenario data through the injected getter and owns no listeners beyond the existing shell/controller lifecycle.

`refresh-coordinator.js` orders scenario invalidation, catalog/index rebuild, state reconciliation, and view refresh. It also owns language refresh and world-wrap full redraw. It uses the existing named refresh steps and controller APIs; lifecycle guards come from the composition root.

### `src/runtime/refresh-flow.js`

Defines named refresh step order for scenario and language refresh paths. It should describe orchestration sequence without owning app data, state, DOM references, or render implementation.

### `src/runtime/refresh-actions.js`, `src/runtime/scenario-runtime.js`, and `src/runtime/scenario-context.js`

Bind explicit scenario/language refresh actions and maintain one live scenario
snapshot with its derived indices. Scenario preparation builds the indices for a
transition before view refresh consumes the new snapshot.

### `src/runtime/debug-runtime.js` and `src/runtime/lru-cache.js`

Own debug flag/stat/timing lifecycle and reusable bounded cache behavior. They are
dependency-injected and browser-unit-testable.

## UI modules

### `src/ui/i18n.js`

Owns app-local translation strings, language normalization/storage helpers, and formatting helpers.

### `src/ui/aside-cards.js`, `src/ui/panels.js`, `src/ui/controls.js`, `src/ui/map-controls.js`, and `src/ui/nation-info-panel.js`

Own focused UI rendering or event-binding concerns. They should keep DOM structure stable and receive callbacks for state transitions instead of importing app state directly.

`app-shell-controller.js` owns shell element lookup, localized control setup,
search and nation-overlay controllers, and shell lifecycle. `search-controller.js`
owns the search catalog, dropdown choices, keyboard interaction, and search
results; `nation-overlay-controller.js` and `nation-info-panel.js` own
nation-information presentation and its interaction binding.

## Build and data pipeline

Typical checked-in/UI build:

```text
src/** + committed data/generated/**
  -> tools/build_pages.py
  -> docs/**
  -> npm run verify
```

Local game-data rebuild:

```text
Terra Invicta Templates + committed/manual geometry inputs
  -> tools/rebuild_pages.py or scripts/build-wsl.sh --from-game
  -> data/generated/**
  -> docs/**
  -> npm run verify
```

Region outline refresh is intentionally separate and should only happen when validating or updating Unity region geometry.

`tools/build_manifest.py` is the shared source-to-Pages and generated-staging
contract. `tools/scenario_config.py`, `tools/input_contracts.py`, and
`tools/localization.py` own common scenario, strict input, and localization
contracts. `tools/build_pages.py` reads generated inputs and writes only `docs/**`;
it never rewrites `data/generated/**`.

`tools/rebuild_pages.py` rebuilds and verifies without Git work by default.
`--commit` and `--push` opt into manifest-scoped publication. General build/verify
uses the standard library; Unity geometry refresh alone installs
`requirements-geometry.txt` (`UnityPy==1.25.0`).

## Test boundaries

- `npm run test:unit`: browser-free Node tests plus Python unit tests.
- `npm run verify`: compilation, unit coverage, deployment parity, semantic bundle
  checks, and dataset sentinels.
- `tests/e2e/**`: behavior-focused Playwright specs for language, search, debug/pins,
  overlays, rendering, pan, and world-wrap behavior.
- `tests/fixtures/app.js`: shared app readiness, nation selection, region
  hover/click, and animation-frame helpers/fixtures.
- CI runs Playwright in two shards with two retries and limited workers.

## Performance-sensitive areas

These areas have been frequent profiling targets and should be treated carefully during refactors:

- labels and label copies;
- region hit paths;
- base visual path duplication;
- claim overlay outlines;
- hostile hatching and clip paths;
- hover, selection, pins, and manual envelopes;
- world-wrap layer replication;
- language refresh and scenario switching;
- runtime refresh ordering;
- SVG node counts and path-data byte counts.

Performance changes should preserve map meaning and interaction correctness. Prefer measurement-backed changes over speculative rewrites.

## Architectural rules

- Do not hand-edit `docs/assets/**`, `docs/data/**`, or other generated Pages outputs. Edit `src/**`, `tools/**`, or manual inputs, then rebuild.
- Do not make render modules import `appState` directly. Pass state-derived values through runtime composition arguments or injected render context.
- Do not make data modules depend on render or view state.
- Do not make UI or interaction modules own semantic app state. Pass callbacks for state transitions.
- Keep refresh-flow modules declarative and order-focused; avoid turning them into a hidden global app orchestrator.
- Keep debug/profiling flags explicit and non-user-facing unless a product decision promotes them.
- Keep measurement CSVs and local tool output out of commits.
- When Graphify or Serena suggests a relationship, verify it in the actual source before editing.

## When to update this file

Update this file when:

- a module boundary changes;
- a new durable state/data/render/interaction/runtime/UI module is added;
- generated-output policy changes;
- build or verification flow changes;
- a performance investigation produces a durable architectural decision.

Do not update this file for one-off measurement rows, temporary prompt context, or phase-local implementation notes. Those belong under `dev-docs/plan/**` and may be deleted after the PR is complete.
