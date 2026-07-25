# Phase 03: Extract map interaction controller

## Goal

- Give one controller exclusive ownership of map/hit-layer pointer behavior and every pending interaction frame/listener lifecycle.

## Scope

- Move hit-layer pointer over/move/out/click, map pointer down/move/up/cancel/lost-capture, wheel, map move/leave, hover preview scheduling, secondary-capital preview, click/drag suppression, and teardown.
- Compose the existing pan and tooltip controllers rather than duplicating their internals.
- Provide `bind()`, `resetContext()`, and `destroy()` with semantic transitions injected through callbacks/adapters.

## Non-goals

- No change to app-state transition semantics, pan thresholds, pointer suppression rules, tooltip copy, SVG rendering, search, or nation overlay.
- No direct `appState` import in the controller.

## Affected files

- `src/app.js`
- `src/interaction/map-interaction-controller.js`
- existing `src/interaction/{map-pan,tooltip}.js` only if lifecycle composition requires a narrow compatible hook
- focused `tests/unit/map-interaction-controller.test.js`
- relevant `tests/e2e/{debug,pan,pins,world-wrap}.spec.js`
- derived `docs/assets/**` only through build
- this phase file

## Implementation steps

1. Inventory exact listener targets/options and scheduled frame/observer ownership.
2. Create the controller around injected DOM, state adapters, current-context accessor, render callbacks, and debug hooks.
3. Make `bind()` idempotent and preserve current event registration order/options.
4. Implement `resetContext()` to cancel pending hover/full-visual frames and clear transient hover/preview/tooltip state on scenario changes.
5. Implement idempotent `destroy()` removing listeners, composed controllers/observer state, and frames.
6. Replace raw `app.js` listener registration/handlers and add lifecycle unit tests.
7. Run phase validation, record evidence, gate, and commit.

## Acceptance criteria

- No raw map/hit-layer pointer/wheel listener is registered by `app.js`.
- Calling `bind()` twice registers each listener once.
- `destroy()` removes all owned listeners/observers and cancels frames; repeated destroy is safe.
- Scenario reset clears hover/secondary preview and cannot execute a stale scheduled callback.
- Click/drag, hover, tooltip, pins, pan, zoom, and wrapped-copy behavior remain compatible.

## Validation commands

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run verify`
- `npm run test:e2e -- tests/e2e/debug.spec.js tests/e2e/pan.spec.js tests/e2e/pins.spec.js tests/e2e/world-wrap.spec.js`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py phase-gate --file dev-docs/plan/app-shell-composition/03-interaction.md`
- after commit: `npm run check:generated`

## Manual smoke tests

- Hover/click the canonical and wrapped hit layers, drag before/after hover, zoom with the wheel, pan across seams, leave/cancel pointer capture, and switch scenarios during a pending hover.
- Confirm one click causes one semantic transition after repeated runtime refreshes.

## Rollback risks

- Listener option/order drift can change propagation or passive wheel behavior.
- A scheduled hover frame may fire after scenario reset.
- Pan click-suppression state may be consumed twice or not at all.

## Evidence

- Baseline: phase-1 interaction counters and targeted E2E.
- After:
  - `npm run lint`: passed.
  - `npm run test:unit`: passed, 40 Node tests and 48 Python tests; the three new controller tests cover idempotent binding/destruction, observer cleanup, frame cancellation on context reset, fresh region lookup, and one-shot drag-click suppression.
  - `npm run build`: passed and rebuilt the checked-in Pages assets from source.
  - `npm run verify`: passed, including generated-output verification and the complete Node/Python unit suites.
  - targeted Playwright (`debug`, `pan`, `pins`, `world-wrap`): 46/46 passed.
  - source audit: `src/app.js` retains only the loading-screen `requestAnimationFrame`; raw map/hit/window interaction listeners and the `ResizeObserver` are owned by `map-interaction-controller.js`.
- Delta: listener targets, listener order/options, hit resolution, pan threshold/suppression, tooltip copy, and synchronous wheel behavior remain unchanged. Pending hover preview, full hover visual, pan map-view, pan-hover, and tooltip frames now have explicit reset/destroy cancellation.
- Interpretation: the controller boundary preserves the baseline interaction behavior while adding a testable lifecycle. Current scenario lookup is read through `getContext()` at event time, so scenario changes cannot leave a stale region index closure.
- Commit: `4007e11` (`Extract map interaction controller`).
- Commit blocker: none.

## Progress

- Implementation, required validation, and phase commit complete.

## Decision log

- State mutation is available only through injected semantic adapters.
- Existing semantic transition/render functions remain injected callbacks; the controller owns DOM event interpretation and lifecycle without importing `appState`.
- `map-pan.js` and `tooltip.js` gained narrow `reset`/`destroy` hooks so the composed controller can cancel their private frames and timeout state.

## Outcomes / Retrospective

- `bind()` is idempotent and registers the existing four hit-layer listeners, nine SVG listeners, two window listeners, and one resize observer exactly once.
- `resetContext()` cancels every interaction-owned pending frame, clears pan/tooltip transient state, and invokes the injected scenario reset callback.
- `destroy()` is idempotent and removes all listeners, disconnects the observer, and destroys the composed pan/tooltip controllers.
