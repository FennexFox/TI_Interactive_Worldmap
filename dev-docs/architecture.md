# Working architecture map

This is a working architecture map for `TI_Interactive_Worldmap`, not a frozen design contract.

Update it when `src/**`, `tools/**`, or generated-output boundaries change materially. If this document becomes stale, the current source, tests, and generated-output verifiers win.

## Repository boundary

- `src/**`: browser app source. Edit this for user-facing app behavior.
- `src/state/**`: state modules for app interaction, viewport, and visual state.
- `src/data/**`: active scenario access and derived lookup indices.
- `src/interaction/**`: DOM interaction controllers with local interaction state, such as map pan and tooltip scheduling.
- `src/render/**`: low-level SVG layer rendering helpers.
- `src/runtime/**`: explicit refresh/scheduling flow helpers that describe orchestration order without owning app state.
- `src/ui/**`: UI rendering and control-binding helpers for panels, controls, localization, and map controls.
- `tools/**`: catalog builders, page builders, generated-output verifiers, and measurement scripts.
- `tests/**`: Python and Playwright regression coverage.
- `data/manual/**`: hand-maintained normalization inputs.
- `data/generated/**`: generated Terra Invicta-derived catalogs and scenario bundles.
- `docs/**`: generated GitHub Pages output. Do not use this as a documentation folder and do not hand-edit it as source.
- `dev-docs/plan/**`: temporary per-issue and per-PR plans, profiling notes, and implementation context.
- `.chatgpt/**`: local run handoffs, receipts, and generated measurement artifacts.
- `graphify-out/**`: generated code-navigation output. Use it as a map, not as source of truth.

## Browser runtime flow

```text
src/index.html
  -> src/app.js
     -> src/data/active-data.js
     -> src/data/derived-indices.js
     -> src/data/claim-model.js
     -> src/state/app-state.js
     -> src/state/map-view-state.js
     -> src/state/map-visual-state.js
     -> src/interaction/map-pan.js
     -> src/interaction/tooltip.js
     -> src/render/map-layers.js
     -> src/runtime/refresh-flow.js
     -> src/ui/*
```

`src/app.js` is the orchestration layer. It wires data, state, rendering, events, language, selection, hover, pins, scenario switching, and diagnostics together, while delegated modules own focused model, UI, interaction, and refresh-flow responsibilities.

State modules should not render. Render modules should not own app state. Data modules should not depend on visual state. UI and interaction modules should receive state-derived values and callbacks from `src/app.js` rather than importing app state directly.

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

### `src/data/claim-model.js`

Builds claim/overlay models and related pure data used by the browser runtime. Keep this module testable without DOM access.

## Interaction modules

### `src/interaction/map-pan.js`

Owns transient map pan state, drag threshold handling, pointer capture lifecycle, drag-click suppression, and post-pan hover refresh scheduling. It mutates map view only through injected callbacks.

### `src/interaction/tooltip.js`

Owns tooltip position scheduling, cached layout measurements, and hide/show state. It does not decide hover semantics or tooltip copy.

## Rendering modules

### `src/render/map-layers.js`

Contains low-level SVG layer rendering helpers. It should receive state-derived values through parameters or render context rather than importing app state directly.

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

### `src/runtime/refresh-flow.js`

Defines named refresh step order for scenario and language refresh paths. It should describe orchestration sequence without owning app data, state, DOM references, or render implementation.

## UI modules

### `src/ui/i18n.js`

Owns app-local translation strings, language normalization/storage helpers, and formatting helpers.

### `src/ui/aside-cards.js`, `src/ui/panels.js`, `src/ui/controls.js`, and `src/ui/map-controls.js`

Own focused UI rendering or event-binding concerns. They should keep DOM structure stable and receive callbacks for state transitions instead of importing app state directly.

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
- Do not make render modules import `appState` directly. Pass state-derived values from `src/app.js`.
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
