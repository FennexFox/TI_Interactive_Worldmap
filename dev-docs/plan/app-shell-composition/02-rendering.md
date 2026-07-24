# Phase 02: Extract rendering services

## Goal

- Move low-level overlay, envelope, and marker SVG rendering behind explicit lifecycle services without changing visual/debug/DOM behavior.

## Scope

- Extract claim overlay/label double buffering, hostile hatch and render keys.
- Extract manual-envelope SVG rendering.
- Extract capital, selection, hover, pinned, and reachable-capital marker rendering.
- Move injected claim CSS into `src/styles.css`.
- Pass current descriptors, region lookup, world-copy contexts, translations, and debug recorder through render calls/context.

## Non-goals

- No descriptor/data-model movement out of `src/data/**`.
- No class, dataset, path/use, z-order, color, animation-frame, projection, counter-name, cache-key-semantic, or SVG node-count change.
- No state transition, raw event, search, nation-panel, or runtime orchestration extraction.

## Affected files

- `src/app.js`
- `src/render/claim-overlay-renderer.js`
- `src/render/manual-envelope-renderer.js`
- `src/render/map-marker-renderer.js`
- supporting focused render module(s) if a single responsibility requires them
- `src/styles.css`
- focused `tests/unit/render-services.test.js`
- relevant `tests/e2e/{rendering,debug,pins,world-wrap}.spec.js`
- derived `docs/assets/**` only through build
- this phase file

## Implementation steps

1. Define renderer factories with `render`, `clear`, `reset`, and `destroy`.
2. Move pure SVG fragment/build-buffer code first and inject DOM/debug/world-copy dependencies.
3. Move envelope and marker render ownership, keeping semantic descriptor/model calculations in data/runtime code.
4. Replace `app.js` low-level calls with service calls and explicit current context.
5. Remove `injectClaimOverlayStyles`; place identical rules in `src/styles.css`.
6. Add unit lifecycle/context tests and run targeted rendering tests.
7. Record evidence, pass Phase Gate, and commit before phase 3.

## Acceptance criteria

- All three renderer responsibilities are outside `app.js` and expose the required lifecycle methods.
- Render modules do not import `appState` and do not retain scenario-specific region/data/translator closures after `reset`.
- Existing selectors, classes, datasets, SVG construction, render keys, buffering behavior, debug counters, node counts, and DOM replacement counts remain compatible.
- Relevant unit/E2E/build/verify gates pass.

## Validation commands

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run verify`
- `npm run test:e2e -- tests/e2e/rendering.spec.js tests/e2e/debug.spec.js tests/e2e/pins.spec.js tests/e2e/world-wrap.spec.js`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py phase-gate --file dev-docs/plan/app-shell-composition/02-rendering.md`
- after commit: `npm run check:generated`

## Manual smoke tests

- Compare direct/hostile/gated claim paths and labels with wrap off/on.
- Exercise manual envelope, pins, capital stars, selection/hover outlines, and reachable-capital markers.
- Reset debug stats and confirm renderer replacement/cache counters retain their meaning.

## Rollback risks

- Buffer activation ordering can create a one-frame blank or duplicate overlay.
- A stale region/translation/world-copy closure can survive scenario/language/wrap changes.
- Moving styles can alter selector precedence if declaration order changes.

## Evidence

- Baseline: phase-1 render stats and targeted E2E.
- After: pending.
- Delta: pending.
- Interpretation: pending.
- Commit: pending.
- Commit blocker: none.

## Progress

- Not started.

## Decision log

- Descriptor calculation remains in `src/data/**`; renderers receive complete descriptors/models.

## Outcomes / Retrospective

- Not completed yet.
