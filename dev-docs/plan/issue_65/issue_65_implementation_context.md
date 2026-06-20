# Issue #65 Implementation Context Notes

## Purpose

This is not a replacement for issue #65. It is a local context note for the agent or phased issue implementation skill.

Issue #65 intentionally focuses on a narrow performance question:

> Are region hit paths and duplicated region geometry creating avoidable SVG node, path-data, paint, or hit-test pressure, and can canonical geometry reuse reduce that pressure safely?

The issue body already defines scope, acceptance criteria, and validation. This document records the background and guardrails that may be easy to miss if an agent reads only the issue body.

## Current project context

Issue #65 follows a sequence of renderer performance investigations.

Recent completed work established these facts:

- World-wrap now defaults off unless explicitly enabled with `worldWrap=1`.
- A runtime world-wrap toggle exists.
- Complex overlay and world-wrap render stats are measurable through `tools/measure_debug_render_stats.mjs`.
- Claim overlay geometry has already been partially optimized with `<use>` reuse.
- Hostile hatch clip-path duplication has already been reduced by reusing emitted outline paths.
- Labels were profiled separately in #62.
- #62 found that labels add real steady-state SVG text-node cost, but they do not rebuild during pan, zoom, hover, or language refresh in the measured paths.
- #62 therefore did not keep user-visible label optimization.

The next likely structural contributor is not labels but region geometry and hit paths.

Important known profiling signals:

- Baseline single-copy complex overlay profiling recorded roughly:
  - `hitPathCount=363`
  - `labelCount=363`
  - `visibleSvgNodeCount=1315`
- #62 label profiling recorded:
  - labels add 363 SVG text nodes without world-wrap,
  - labels add 1089 SVG text nodes with world-wrap,
  - `panFrameMsAvg` deltas were roughly +0.08 ms to +0.21 ms depending on scenario,
  - label rebuilds did not occur during pan, zoom, hover, or language refresh,
  - wrap toggle rebuilt labels once.

Do not re-litigate label visibility in #65. The label work is useful context, not this issue's target.

## Relationship to existing issues

### #62

#62 is the direct predecessor. It answers the label-specific question and leaves a follow-up signal: hit paths are still a large fixed contributor.

Do not extend #62 by adding hit-path optimization there. #65 exists to keep that work separate and reviewable.

### #60

#60 is broader. It audits world-wrap layer replication and copied DOM across all layers.

#65 is narrower:

- region hit paths,
- duplicated region path data,
- canonical region geometry reuse,
- hit-test safety.

Results from #65 should inform #60. If canonical geometry reuse works for hit paths, #60 can use that evidence when auditing other copied world-wrap layers. If it does not work or does not matter, #60 should not assume hit-path canonicalization is a promising route.

### #16

#16 is the broader renderer architecture / performance umbrella. #65 should not become a #16-scale renderer rewrite.

### #24

#24 is renderer hardening context only. It should not expand #65 into a broad guardrail or generic refactor task.

## Main risk that the issue body may understate

Hit paths are not just visual SVG nodes. They are interaction infrastructure.

Changing them may break:

- hover target resolution,
- click selection,
- pinned region behavior,
- seam-adjacent world-wrap hit testing,
- region ID lookup through `event.target`,
- class and dataset assumptions,
- pointer-events behavior,
- tests that count or query `path` elements,
- CSS assumptions about paths versus `<use>` elements.

SVG `<use>` also has browser-specific interaction details. Depending on how event handlers are written, `event.target` may become an `SVGUseElement` rather than the original referenced path. A safe implementation must ensure the event path can still resolve the canonical region identity.

Before keeping any `<use>`-based hit-path change, verify that the code can still determine the intended region from events without relying on fragile shadow-instance behavior.

## Measurement nuance

Do not measure only node count.

A `<use>` strategy may not reduce DOM node count much because each visible or interactive instance may still need a node. The likely benefit is reducing duplicated `d` path-data bytes, SVG parse/setup work, memory pressure, and possibly style/hit-test work.

The instrumentation should therefore separate:

- DOM node count,
- `<path>` count,
- `<use>` count,
- duplicated path-data byte size,
- visible copy count,
- hit path count,
- base visual region path count.

Useful candidate counters include:

- `baseRegionPathCount`
- `baseRegionUseCount`
- `hitPathCount`
- `hitUseCount`
- `worldCopyBasePathCount`
- `worldCopyHitPathCount`
- `baseRegionPathDBytes`
- `hitPathDBytes`
- `totalRegionPathDBytes`
- `canonicalRegionPathCount`
- `canonicalRegionPathDBytes`

Names can differ, but the final data should clearly distinguish node count from geometry duplication.

## How to interpret performance numbers

Frame-time max values have been noisy in previous profiling.

Do not treat a single `panFrameMsMax` regression or improvement as decisive. Prefer:

- repeated measurements,
- medians,
- scenario-by-scenario comparison,
- `setupOk=true` validation,
- empty `setupFailures`,
- stable behavior across world-wrap on/off,
- stable behavior across complex overlay scenarios.

If a candidate improves path-data duplication but does not improve frame timing, document that clearly. It may still be a structural cleanup candidate, but it should not be marketed as a proven frame-time optimization.

## Suggested phased implementation shape

The phased issue implementation skill should avoid turning this into a broad renderer rewrite.

A good phase split would be:

### Phase 0: Recon and baseline map

Goal:

- identify current base region rendering, hit path rendering, world-copy rendering, and debug stat collection paths.

Likely files:

- `src/app.js`
- `tools/measure_debug_render_stats.mjs`
- `tests/map-wrap.spec.js`
- `tests/language.spec.js`
- existing `dev-docs/plan/issue_62/*` result docs if present
- existing performance follow-up docs under `dev-docs/plan/performance-followups/`

Output:

- local file map,
- current assumptions,
- no source behavior changes.

### Phase 1: Instrumentation only

Goal:

- add counters that distinguish base visual paths, hit paths, world-wrap copies, `<path>` versus `<use>`, and duplicated `d` bytes.

Rules:

- preserve normal app behavior,
- do not introduce canonical hit-path reuse yet,
- do not commit generated CSVs.

Validation:

- `npm run build`
- `node --check src/app.js`
- `node --check tools/measure_debug_render_stats.mjs`
- relevant Playwright smoke if debug stats are exposed through the browser.

### Phase 2: Baseline measurements and decision gate

Goal:

- run the expanded measurement suite and decide whether a candidate is justified.

Scenarios should include at least:

- default single-copy,
- single-copy complex overlays,
- world-wrap,
- world-wrap complex overlays.

Decision:

- if hit-path duplicated geometry is not meaningful, stop here and write the result;
- if meaningful duplication exists, proceed to a guarded A/B candidate.

### Phase 3: Optional guarded candidate

Goal:

- test canonical region path reuse for hit paths only if Phase 2 supports it.

Suggested guard:

- `debugUseCanonicalHitPaths=1`, or an equivalent debug-only path.

Candidate constraints:

- preserve region IDs,
- preserve pointer event behavior,
- preserve hover and click,
- preserve world-wrap seam behavior,
- preserve labels and overlays,
- avoid broad visual renderer changes.

Be especially careful with:

- `event.target`,
- `closest(...)`,
- dataset/class lookup,
- SVG `<use>` pointer-events,
- generated IDs,
- transform offsets for projected copies.

### Phase 4: Keep/discard and report

Goal:

- keep only a safe, measured improvement;
- otherwise keep instrumentation and document why no optimization was kept.

The result document should explain:

- what was measured,
- whether duplication exists,
- whether `<use>` helped,
- whether frame timing improved,
- whether any max-frame changes appear noisy,
- what #60 should do next.

## What not to do

Do not:

- change label visibility policy,
- add zoom-based label culling,
- start a Canvas or hybrid renderer rewrite,
- make world-wrap copy reduction the primary target except where hit paths are involved,
- merge visual geometry and hit testing in a way that makes interactions less explicit,
- remove hit paths to improve benchmark numbers,
- weaken tests to fit the new DOM structure,
- commit `.chatgpt/tool-tests/render-stats/*.csv`,
- commit generated Pages assets unless the repo workflow explicitly requires it for the final PR,
- expand the issue into generic `src/app.js` extraction.

## Likely PR shape

A successful #65 PR can have one of two valid outcomes.

### Outcome A: Instrumentation plus no kept optimization

This is acceptable if the evidence does not justify a safe hit-path change.

PR message should say:

- hit-path duplication was measured,
- no safe or meaningful candidate was kept,
- #60 should or should not continue with broader copied-DOM audit based on the evidence.

### Outcome B: Instrumentation plus guarded or kept optimization

This is acceptable only if:

- interaction tests still pass,
- measurements show a meaningful improvement,
- the normal user behavior is unchanged,
- the implementation remains narrow.

PR message should avoid overclaiming. Phrase it as:

> Reduce duplicated region hit-path geometry where safe.

not:

> Fix map performance.

## Suggested verification commands

Use the issue body as the source of truth, but this is the expected validation set:

```bash
npm run build
npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6
npm run verify
npx playwright test tests/map-wrap.spec.js
npx playwright test tests/language.spec.js
npm run test:e2e
```

Add a focused Playwright smoke script if the candidate changes event targets or DOM structure.

## Notes for future handoff

When starting implementation, base the branch on a state that includes the completed #62 instrumentation/results if possible.

If #62 has not yet been merged to `develop`, do not duplicate its counters blindly. Either merge/rebase appropriately, or explicitly account for the missing counters in the phase plan.

The main value of #65 is evidence. It should answer whether hit-path canonicalization is worth pursuing before #60 attempts a broader world-wrap copied-DOM audit.
