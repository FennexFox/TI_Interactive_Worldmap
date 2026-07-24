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
- After: pending.
- Delta: pending.
- Interpretation: pending.
- Commit: pending.
- Commit blocker: none.

## Progress

- Not started.

## Decision log

- State mutation is available only through injected semantic adapters.

## Outcomes / Retrospective

- Not completed yet.
