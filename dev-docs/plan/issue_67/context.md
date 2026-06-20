# Issue #67 local context: Renderer bottleneck audit before further optimization

## Current issue

GitHub issue:

* #67: Renderer bottleneck audit before further optimization

Purpose:

* Do not attempt another speculative renderer optimization immediately.
* First identify the actual bottleneck category using measured evidence.
* Treat the work as a profiling / audit task, not as an optimization implementation task.

## Background

Recent performance-related work produced two important negative results:

1. Earlier renderer / overlay optimization attempts did not produce enough reliable improvement to justify changing the default render path.
2. #65 / #66 tested canonical hit-path reuse. The A/B candidate reduced duplicated hit geometry bytes in world-wrap mode, but pan timing did not improve and in measured cases became worse. Therefore canonical hit paths should remain debug-only.

The main lesson is:

> Large SVG/path duplication is not automatically the renderer bottleneck. Future work should avoid optimizing based only on DOM size or path-data byte counts.

## Current decision

The next step should be a renderer bottleneck audit.

The audit should answer which subsystem actually dominates interaction cost:

* DOM node count
* SVG path data size
* browser paint cost
* style/layout recalculation
* JavaScript recomputation
* pointer hit testing
* labels
* world-wrap copies
* claim overlay generation
* capital hover overlay generation
* selection / pinned / envelope overlay updates

## Related issues

* #67: current umbrella audit issue.
* #65: hit-path duplication and canonical geometry reuse profiling.
* #66: PR implementing #65 instrumentation and debug-only canonical hit-path A/B mode.
* #62: label rendering performance profiling.
* #60: world-wrap layer replication and copied DOM audit.
* #24: renderer hardening tracker.
* #16: broader renderer architecture / refactor context.

## Recommended local work structure

Create local planning files under:

```text
dev-docs/plan/issue_67/
```

Suggested files:

```text
dev-docs/plan/issue_67/00-context.md
dev-docs/plan/issue_67/01-measurement-plan.md
dev-docs/plan/issue_67/02-results.md
dev-docs/plan/issue_67/03-recommendation.md
```

These files should be treated as planning/audit artifacts. They may be removed before PR if they are only temporary Codex working notes, unless the final audit report is intended to be committed.

## Suggested implementation approach

### Phase 1: Inventory existing instrumentation

Inspect the current render-stat tooling added by prior profiling work.

Likely areas to inspect:

* render-stat collection code
* map render pipeline
* label rendering
* hit path rendering
* world-wrap rendering
* overlay rendering
* measurement scripts
* Playwright map-wrap and language tests

The first task is to understand what is already measurable before adding new counters.

### Phase 2: Define controlled scenarios

Measure at least:

1. default initial map view
2. world-wrap off
3. world-wrap on
4. labels on
5. labels off / debug disabled labels, if available
6. no selected nation
7. selected nation with small claim footprint
8. selected nation with large claim footprint
9. capital hover overlay while a nation is selected
10. zoomed-out view
11. zoomed-in view with dense labels

Keep the scenario matrix small enough to be repeatable. The goal is diagnosis, not exhaustive benchmarking.

### Phase 3: Collect metrics

Useful metrics include:

* visible SVG node count
* base visual region path count
* hit path count
* hit use count
* world-copy path count
* label count
* wrapped label count
* claim overlay path count
* hover overlay path count
* path-data byte counts
* pan frame average
* pan frame max or high percentile
* hover response timing, if practical
* selection overlay update timing, if practical
* whether the bottleneck appears to be JS, style/layout, paint, or hit testing

Do not rely only on path byte counts. Timing evidence matters more.

### Phase 4: Decide next target

The final output should recommend exactly one highest-confidence next optimization target.

Possible recommendations:

* overlay recomputation caching
* label level-of-detail
* label toggle / performance mode
* world-wrap copy reduction
* pointer interaction simplification
* SVG paint reduction
* defer further SVG micro-optimization
* consider hybrid Canvas/SVG only if paint cost is proven dominant

Also list rejected or deferred ideas, especially if the data shows they are not worthwhile.

## Important constraints

Do not:

* make canonical hit paths default
* replace the renderer with Canvas/WebGL in this issue
* change user-visible behavior
* change claim semantics
* change hover/click semantics
* remove labels by default
* commit generated measurement CSVs unless explicitly intended
* modify generated assets unless required and justified

Prefer:

* debug flags
* measurement-only changes
* small instrumentation patches
* repeatable benchmark scripts
* clear before/after tables
* explicit “no optimization kept” conclusions when appropriate

## Validation commands

Run the standard validation suite before finishing:

```bash
npm run build
npm run verify
npm run test:e2e
```

Also run focused tests when relevant:

```bash
npx playwright test tests/map-wrap.spec.js
npx playwright test tests/language.spec.js
```

If render-stat tooling is changed, run the measurement command used by the project, for example:

```bash
npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6
```

Adjust command names if package scripts differ.

## Expected final report

The final report for #67 should include:

* what scenarios were measured
* what metrics were collected
* which subsystem appears most expensive
* what evidence supports that conclusion
* what optimization should be attempted next
* what optimization ideas should be avoided for now
* whether normal behavior remained unchanged
* validation commands and results

The expected outcome is not necessarily a faster renderer. The expected outcome is a reliable diagnosis that prevents a third guess-based optimization attempt.
