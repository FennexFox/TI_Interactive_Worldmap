# Profile and optimize label rendering performance

## Summary

The next high-priority performance investigation should focus on map label rendering, label visibility, and label toggling.

Recent baseline single-copy overlay profiling found no safe compound claim-overlay optimization worth keeping. The evidence points more strongly toward labels and interaction paths as major contributors to remaining single-copy SVG node count and responsiveness limits.

Existing issue: #62 - Profile and optimize label rendering performance.

This issue should measure how much labels contribute to pan, zoom, complex overlay states, and world-wrap copies, then prototype one low-risk improvement only if the data supports it.

## Background / Evidence

The completed baseline overlay profiling pass measured `wrap-off-complex-overlays` with:

- median `panFrameMsMax=3.750 ms`,
- median `panFrameMsAvg=0.536 ms`,
- median `visibleSvgNodeCount=1315`,
- `hitPathCount=363`,
- `labelCount=363`,
- `claimOutlinePathCount=56`,
- `claimHatchGroupCount=5`,
- `claimClipPathCount=5`,
- `setupForeignHoverOverlayPathCount=3`.

The compound visual overlay review did not keep a claim-outline optimization because grouping per-region claim outlines would risk weakening current semantic nodes, selectors, tests, and outline behavior. Hostile hatch removal also did not explain the remaining cost by itself.

Labels are therefore a more promising target than another claim compound pass:

- label nodes are numerous in the baseline,
- labels are user-visible and may be duplicated under world-wrap,
- label visibility may not always be useful at every zoom level,
- label rebuild/replacement behavior needs to be measured,
- label toggling could provide an explicit user/debug performance control if it proves useful.

## Relationship to issue #16

Parent: #16 - renderer architecture / overlay refactor / performance investigation umbrella.

This issue depends on #16's renderer boundaries because label rendering crosses several architecture concerns:

- labels are visual SVG nodes derived from canonical region data,
- labels must follow active scenario / language refresh behavior,
- labels may be projected into world-copy contexts,
- labels should remain separate from hit paths and claim semantics,
- any label visibility or copy reduction must preserve map interaction behavior.

This issue is also the direct follow-up to the completed baseline overlay profiling pass. That profiling pass should be treated as the immediate evidence source for this issue.

## Scope

Investigate label behavior in these scenarios:

- default single-copy usage,
- `worldWrap=0` complex overlay scenarios,
- `worldWrap=1` seam / wrapped map scenarios,
- pan and zoom interactions,
- language refresh,
- selected, pinned, manual-envelope, and hover states,
- wrap toggle on/off transitions.

Add or verify counters for:

- `labelCount`,
- label group count,
- wrapped label copy count,
- label rebuild count,
- label replacement count,
- label render key changes,
- label visibility/toggle state,
- visible SVG node count with labels enabled vs disabled.

Consider a safe debug A/B option such as:

- `debugDisableLabels=1`, or
- `disableLabels=1`.

The exact option name can be chosen during implementation, but the intent should be explicit: allow measurement of the label contribution without permanently removing labels from normal usage.

## Non-goals

- Do not remove labels by default.
- Do not make the normal map less readable to improve benchmark numbers.
- Do not remove labels as a substitute for measuring them.
- Do not change claim semantics, hostile/peaceful meaning, hover behavior, selection, pins, or map interaction behavior.
- Do not implement a full Canvas renderer in this issue.
- Do not make world-wrap copy reduction the primary target except for label-specific findings.
- Do not change localization semantics or make Korean/English labels inconsistent.
- Do not commit generated measurement CSVs.
- Do not modify `docs/assets/**`, generated data, `graphify-out/graph.html`, or `graphify-out/graph.json` unless a later implementation PR explicitly requires regenerated assets.

## Proposed approach

### Phase 1: Label-focused profiling

Extend or reuse the render-stat framework to answer:

- How many label SVG nodes are visible in baseline and complex scenarios?
- How many label nodes are added by world-wrap?
- Are labels rebuilt during ordinary pan?
- Are labels rebuilt during zoom?
- Are labels rebuilt during hover or selection changes?
- Are labels rebuilt during language refresh only when expected?
- How much do labels affect `panFrameMsMax`, `panFrameMsAvg`, and `visibleSvgNodeCount`?

If needed, add a temporary or permanent debug option such as `debugDisableLabels=1` / `disableLabels=1` to produce A/B measurements.

### Phase 2: Choose one low-risk candidate

Based on the profiling result, choose at most one candidate:

- avoid unnecessary label rebuilds,
- reuse label render groups or render keys where safe,
- skip wrapped label copies where they are not visible or not needed,
- add an explicit label visibility toggle if A/B data shows meaningful benefit,
- hide or simplify labels only at zoom levels where they are not useful,
- keep labels enabled by default but allow an opt-in performance mode.

### Phase 3: Measure and decide

Run before/after measurements with the same scenario set.

Keep the candidate only if it improves performance without harming readability, localization, seam behavior, or interaction correctness. If no safe candidate exists, record the evidence and recommend a broader renderer strategy.

## Acceptance criteria

- [ ] Label-focused baseline data is recorded.
- [ ] Measurements distinguish label count from visual overlays, hit paths, claim overlays, hostile hatch structures, and markers.
- [ ] Measurements include label count, label group count, wrapped label copy count, and visible SVG node count.
- [ ] Measurements record whether labels rebuild or remain stable during pan, zoom, hover, selection, wrap toggle, and language refresh.
- [ ] A `debugDisableLabels=1`, `disableLabels=1`, or equivalent A/B mechanism is evaluated if no existing label toggle is sufficient.
- [ ] Any kept optimization preserves English/Korean labels, hover, claims, hatching, selection, pins, manual envelopes, world-wrap seam behavior, and language refresh.
- [ ] Labels remain enabled by default unless a separate product decision changes that behavior.
- [ ] Before/after data includes `panFrameMsMax`, `panFrameMsAvg`, `visibleSvgNodeCount`, label-specific counts, and relevant rebuild/replacement counters.
- [ ] If no optimization is kept, useful evidence and a recommended next direction are recorded.
- [ ] Relevant tests pass.

## Validation commands

```bash
npm run build
npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6
npm run verify
npx playwright test tests/map-wrap.spec.js
npm run test:e2e
```

If a language-refresh or label-toggle behavior changes, also run the focused language tests:

```bash
npx playwright test tests/language.spec.js
```

## Priority

High for the next performance investigation.

This is the most promising immediate follow-up because the completed baseline profiling pass found labels and hit paths to be larger contributors than hostile hatch or a safe claim-outline compound candidate.

## Related follow-ups

- Parent: #16 - renderer architecture / overlay refactor / performance investigation umbrella.
- Existing issue: #62 - Profile and optimize label rendering performance.
- Direct predecessor: completed baseline overlay profiling / compound visual review recorded in PR #61.
- Structural but lower-priority follow-up: #60 - Audit world-wrap layer replication and reduce unnecessary copied DOM.
- Broader tracker context: #24 - Renderer hardening tracking.
