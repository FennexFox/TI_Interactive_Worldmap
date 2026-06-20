# Phase 02: Region geometry instrumentation

## Goal

- Add behavior-neutral counters that distinguish region visual paths, hit paths, copied hit paths, `<path>` versus `<use>` nodes, and duplicated `d` path-data bytes.

## Scope

- Add debug stat keys in `src/app.js`.
- Add setup and summary CSV columns in `tools/measure_debug_render_stats.mjs`.
- Add focused Playwright coverage that proves the new counters are populated in single-copy and world-wrap modes.
- Rebuild `docs/assets/**` from source.

## Non-goals

- Do not change hit path rendering behavior.
- Do not introduce `debugUseCanonicalHitPaths` yet.
- Do not claim a performance improvement.

## Affected files

- `src/app.js`
- `tools/measure_debug_render_stats.mjs`
- `tests/map-wrap.spec.js`
- `docs/assets/app.js`
- `dev-docs/plan/issue_65/02-instrumentation.md`

## Implementation steps

1. Add debug stat keys for base region paths/uses, hit paths/uses, world-copy base/hit paths, world-copy base/hit uses, region path-data bytes, and canonical path-data bytes.
2. Compute bytes from actual rendered `d` attributes so counters reflect current DOM state.
3. Extend measurement setup stats and summary rows with the new counters.
4. Add focused map-wrap assertions for single-copy and world-wrap geometry counters.
5. Run syntax/build/focused tests and record evidence.

## Acceptance criteria

- Counters distinguish DOM node count from path-data duplication.
- Counters are available in live debug stats and measurement CSV summaries.
- Single-copy and world-wrap tests verify the expected shape.
- Normal app behavior remains unchanged.

## Validation commands

- `npm run build`
- `node --check src/app.js`
- `node --check tools/measure_debug_render_stats.mjs`
- `npx playwright test tests/map-wrap.spec.js -g "region geometry"`
- `npm run verify`

## Manual smoke tests

- Covered by focused Playwright for this phase unless later source behavior changes.

## Rollback risks

- Counter selectors may undercount if future DOM structures use `<use>` or grouped visual paths.
- Byte counters can be misleading if they count only rendered DOM and not referenced geometry; document semantics clearly.

## Evidence

- Baseline: existing debug stats expose `visibleSvgNodeCount` and `hitPathCount` but not path-data bytes or hit/base path/use distinctions.
- After: debug stats now expose base visual region path/use counts, hit path/use counts, wrapped-copy base/hit path/use counts, base and hit `d` byte totals, total region `d` bytes, and canonical base/hit counts/bytes. The measurement summary also records matching setup and final-row columns. Heavy path-data aggregation is cached at layer sampling boundaries and reused during pan-frame sampling.
- Delta: instrumentation distinguishes the current all-`path` implementation from a future `<use>` candidate without changing render behavior.
- Interpretation: Phase 3 can now measure duplicated region geometry separately from DOM node count and pan timing.

## Progress

- Completed.

## Decision log

- Keep instrumentation in `sampleDebugSvgLayerCounts()` so it samples the actual served SVG DOM.
- Count `d` bytes from rendered DOM attributes. This intentionally measures duplicated geometry currently present in the SVG, not source catalog size.
- Keep single-copy and wrapped assertions focused on counter correctness and current all-`path` behavior; candidate behavior will need separate tests if Phase 4 runs.
- A first full measurement attempt was interrupted after the renderer stayed CPU-bound for several minutes. The cause was per-pan-frame `d` byte aggregation; the sampler now caches geometry stats so Phase 3 can measure pan without recomputing path-data bytes every frame.

## Outcomes / Retrospective

- Validation:
  - `rtk node --check src/app.js` passed.
  - `rtk node --check tools/measure_debug_render_stats.mjs` passed.
  - `rtk npm run build` passed and regenerated `docs/assets/app.js`.
  - `rtk npx playwright test tests/map-wrap.spec.js -g "region geometry"` passed.
  - `rtk npm run verify` passed.
  - After caching the geometry stats, `rtk npx playwright test tests/map-wrap.spec.js -g "region geometry"` passed again.
  - After caching the geometry stats, `rtk npm run verify` passed again.
- Manual smoke tests: deferred for this instrumentation-only phase; focused Playwright verifies the new counters against the served SVG DOM in single-copy and world-wrap modes.
