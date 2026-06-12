# Phase 01: Baseline And Measurement

## Goal

Capture the current post-#16 hover and overlay behavior before optimizing it. Establish enough measurement and regression context to decide which later changes are working.

## Scope

- Document current hover/render behavior for the issue #20 scenarios.
- Add or prepare lightweight instrumentation only if it can stay isolated, disabled by default, and useful for later regression checks.
- Add at least one focused Playwright regression that exercises real pointer movement or records the current limitation if real movement is not reliable in this map.
- Record before-change observations in the phase outcome section or a linked profiling note.

## Non-Goals

- Do not optimize hover, overlay, marker, or filter paths in this phase.
- Do not change claim semantics or visual styling.
- Do not introduce persistent debug UI visible to normal users.
- Do not hand-edit generated `docs/assets/**` output.

## Affected Files

- `tests/language.spec.js` or a new `tests/render-performance.spec.js`
- `src/app.js` only if a disabled instrumentation hook is needed
- `src/index.html` only if a hidden debug marker is required, but prefer avoiding this
- `docs/plan/issue-20/01-baseline-and-measurement.md`
- Generated Pages output after `npm run build` if source/test-visible app changes are made

## Suggested Debug Counters

If a lightweight instrumentation hook is added, prefer a single disabled-by-default counter object such as `window.__TI_DEBUG_RENDER_STATS__`. It should be absent or inert in normal use unless enabled by a query parameter, local debug flag, or test-only setup.

Track the most useful counters first:

- full visual-state application count
- bounded visual-state application count
- number of visible paths touched
- number of hit paths touched
- overlay model build count
- overlay model cache hit count, once Phase 04 exists
- claim overlay DOM replacement count
- claim label DOM replacement count
- hover outline replacement count
- foreign hover overlay replacement count
- capital marker rebuild count

These counters are not a product feature. Keep them small, explicit, and easy to remove if they become noise.

## Implementation Steps

1. Run the baseline validation commands from a clean working tree.
2. Manually exercise the issue #20 smoke scenarios and note perceived pain points.
3. Use browser devtools or Playwright tracing to inspect hover across Europe and South America.
4. If needed, add a disabled-by-default render counter behind a query parameter or window flag. Prefer a single object like `window.__TI_DEBUG_RENDER_STATS__` and include the counter categories listed above.
5. When adding counters, make them useful enough for tests or manual notes, such as recording whether a hover sequence triggered full visual-state applications, bounded applications, overlay model builds, DOM replacements, or marker rebuilds.
6. Add a regression test that performs pointer movement through real hit-layer targets where possible. If coordinate-based movement is brittle, keep existing dispatch helpers and document why.
7. Update this file's Progress, Decision Log, and Outcomes with baseline results.
8. Run build, verify, and e2e after any source/test changes.

## Acceptance Criteria

- A baseline note exists with observed hover responsiveness and suspected hotspots.
- Any instrumentation is off by default and does not alter normal behavior.
- If instrumentation is added, it includes the core render counters needed to distinguish full visual-state walks, bounded updates, overlay model builds, overlay DOM replacements, hover overlay replacements, and marker rebuilds.
- Existing hover, click, selection, claim overlay, search, and panel behavior remains unchanged.
- At least one regression test is added or an explicit decision is logged for why current dispatch-based coverage remains the safe first step.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

Optional profiling:

```powershell
npm run test:e2e -- --trace on
```

## Manual Smoke Tests

- Hover quickly across Europe and note pointer-following quality.
- Hover across Brazil, Bolivia, French Guiana, and neighboring South America regions.
- Select Brazil, then hover Bolivia and Ontario.
- Toggle claim mode, project filter, claim kind, and claim-target-only filter.
- Clear selection by clicking empty map space.

## Rollback Risks

- Instrumentation can become accidental production behavior if not gated.
- New pointer tests may be flaky if they depend on precise SVG coordinates.
- Debug counters can become misleading if they are too broad or if tests assert exact numbers instead of stable upper bounds.
- Baseline notes can become stale if they include undocumented local browser conditions.

## Progress

- [ ] Baseline commands run.
- [ ] Manual smoke notes captured.
- [ ] Trace or measurement note captured.
- [ ] Regression coverage decision made.
- [ ] Phase outcomes recorded.

## Decision Log

- Start with measurement because issue #20 requires documenting the current regression before optimization.
- Keep any counters disabled by default to avoid changing runtime cost during normal use.
- Prefer counters that can support later regression checks, but avoid turning performance measurements into brittle exact-count tests.

## Outcomes

Pending implementation.
