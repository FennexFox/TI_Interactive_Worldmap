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
- After: pending implementation.
- Delta: pending implementation.
- Interpretation: pending implementation.

## Progress

- Not started.

## Decision log

- Keep instrumentation in `sampleDebugSvgLayerCounts()` so it samples the actual served SVG DOM.

## Outcomes / Retrospective

- Not completed yet.
