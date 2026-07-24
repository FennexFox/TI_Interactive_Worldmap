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
- After: `src/app.js` is 2,759 lines; claim, manual-envelope, and marker SVG construction now lives in three explicit renderer services. `npm run lint`, `npm run build`, `npm run verify`, 37 Node unit tests, 48 Python tests, and the 58 targeted rendering/debug/pins/world-wrap Playwright tests pass.
- Delta: no targeted E2E, SVG structure, debug-counter, buffer-churn, hostile-hatch, manual-envelope, marker, or world-wrap compatibility failures were observed. Four focused renderer lifecycle/context tests were added, including cancellation of delayed overlay and label frames during reset/destroy.
- Interpretation: the phase is behavior-neutral under the planned correctness and DOM/debug probes. The five-run timing comparison remains assigned to phase 6 so it uses the final source composition.
- Commit: parent agent owns the phase-sized commit after reviewing this uncommitted handoff.
- Commit blocker: none.

## Progress

- Implementation and validation complete; ready for the parent-owned phase commit.

## Decision log

- Descriptor calculation remains in `src/data/**`; renderers receive complete descriptors/models.

## Outcomes / Retrospective

- `createClaimOverlayRenderer`, `createManualEnvelopeRenderer`, and `createMapMarkerRenderer` each expose `render`, `clear`, `reset`, and idempotent `destroy`.
- Scenario-specific region lookup, world-copy plans, translations, model/descriptor data, and debug recorders are supplied per call; none of the render modules imports `appState`.
- Claim overlay and label generation/swap behavior remains double-buffered, including delayed-commit stale-generation protection and the established debug counter names.
- Manual-envelope descriptor/model calculation remains in the claim/data orchestration path; only keyed SVG ownership moved.
- Capital, selection, hover/foreign-preview, pinned, and reachable marker semantic collection remains in `app.js`; keyed SVG fragment construction and layer replacement moved to the marker service.
- The runtime-injected claim style element was removed. Its exact override declarations now follow the related claim/selection rules in `src/styles.css`, preserving selector specificity and cascade order.
