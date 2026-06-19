# Profile baseline overlay rendering and prototype compound visual overlays

## Summary

Recent SVG overlay optimization passes reduced some duplicate path work, but the measured improvement was modest. Disabling hostile hatching also does not produce a large enough improvement to explain the remaining perceived performance cost. Even with world-wrap disabled, complex claim overlay scenarios can still feel less responsive than desired.

This issue targets the baseline single-copy overlay rendering path. The goal is to measure which SVG layers are expensive in `worldWrap=0` complex-claim scenarios, then prototype one focused compound visual overlay optimization while preserving the existing user experience.

## Motivation

Previous work showed:

- World-wrap multiplies visible SVG node count and remains a useful later optimization target.
- Hostile hatch rendering is not the dominant remaining bottleneck by itself.
- `worldWrap=0` still needs improvement in complex overlay states.
- Current debug render stats do not yet explain which specific visual layers dominate baseline single-copy cost.

Before pursuing more aggressive world-wrap or Canvas architecture work, we should identify the cost centers in the baseline overlay renderer and test whether compound SVG visual paths can reduce them.

## Scope

Add or improve measurement coverage for `worldWrap=0` complex overlay scenarios, then implement at most one focused compound visual overlay candidate.

Candidate areas include:

- Claim fill overlays
- Claim outline overlays
- Hostile hatch visual support structures
- Foreign hover overlays
- Secondary capital hover overlays
- Selection/claim visual overlays that do not require per-region interactivity

The interaction layer should remain unchanged unless there is a clearly justified and separately tested reason to touch it.

## Non-goals

- Do not remove world-wrap support.
- Do not make world-wrap copy reduction the primary goal of this issue.
- Do not remove hostile hatching or change claim semantics.
- Do not degrade hover, click, pin, selection, labels, or language refresh behavior.
- Do not perform a full Canvas or spatial-hit-test rewrite in this issue.
- Do not keep generated `docs/assets/**` changes unless explicitly requested.
- Do not commit generated measurement CSV files.

## Proposed approach

### Phase 1: Baseline single-copy profiling

Extend `tools/measure_debug_render_stats.mjs` or debug render stats so the CSV can distinguish more layer-level counts, such as:

- Total visible SVG nodes
- Claim fill path/use count
- Claim outline path/use count
- Hostile hatch group count
- `clipPath` count
- Hover overlay path count
- Label count
- Hit path count
- Selection outline count
- Pinned marker count
- Overlay rebuild/mutation count during pan and zoom, if practical

Add a focused `worldWrap=0` complex-claim scenario that stresses overlays without conflating the result with world-wrap copy multiplication.

### Phase 2: Prototype one compound visual overlay candidate

Pick the largest or most promising visual-only overlay bucket from Phase 1 and implement one small, reversible candidate.

Preferred direction:

- Keep hit paths and interaction behavior unchanged.
- Group regions with the same visual styling into compound SVG paths where safe.
- Preserve existing visual meaning for claim strength, hostile claims, hover overlays, and selected/pinned states.
- Reuse existing helpers such as visual fill grouping where practical.

### Phase 3: Measure, decide, and report

Run equivalent before/after measurements and keep the candidate only if it produces meaningful improvement without correctness risk.

If the candidate does not improve meaningfully, revert it and record the result as a no-safe-measurable-improvement outcome.

## Acceptance criteria

- A fresh `worldWrap=0` complex overlay baseline is recorded.
- Measurements include layer-level counters sufficient to identify the largest SVG overlay contributors.
- The candidate optimization keeps interaction behavior unchanged.
- The before/after comparison includes at least:
  - `panFrameMsMax`
  - `panFrameMsAvg`
  - `visibleSvgNodeCount`
  - relevant layer-specific path/use/clip counts
- Any kept change meets the existing meaningful-improvement threshold or has a clear evidence-backed rationale.
- If no candidate is kept, the issue still records useful profiling evidence and a recommended next direction.
- Existing relevant tests pass:
  - `npm run verify`
  - `npx playwright test tests/map-wrap.spec.js`
  - `npm run test:e2e`
- Manual or scripted smoke confirms:
  - default world-wrap off behavior,
  - world-wrap toggle behavior,
  - claim overlays,
  - hostile hatching,
  - hover overlays,
  - labels,
  - pinned markers,
  - language refresh.

## Validation commands

```bash
npm run build
npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6
npm run verify
npx playwright test tests/map-wrap.spec.js
npm run test:e2e
```

## Priority

High for the next performance investigation.

This issue should come before deeper world-wrap copy architecture work because single-copy performance still needs improvement. It should also come before a hybrid Canvas rewrite because the added profiling will make a renderer-strategy decision more evidence-based.
