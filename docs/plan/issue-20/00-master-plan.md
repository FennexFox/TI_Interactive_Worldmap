# Issue 20 Master Plan: Overlay Rendering Performance Stabilization

## Source Context

Issue: https://github.com/FennexFox/TI_Interactive_Worldmap/issues/20

Issue #20 is a post-#16 stabilization pass. The problem statement is not to redesign map behavior, but to measure and reduce avoidable render work introduced after separating canonical data, visible SVG regions, hit-test paths, overlay model calculation, overlay rendering, and explicit map visual state.

Current repository observations:

- `src/app.js` owns most interaction orchestration. Hover enters through the hit layer at `onHitLayerPointerOver`, `onHitLayerPointerMove`, and `onHitLayerPointerOut`, then calls `updateHoveredRegion`.
- `src/state/map-visual-state.js` owns the explicit visual state and `applyMapVisualState`, which currently walks all visible region paths and all hit paths whenever it runs.
- `src/render/map-layers.js` owns low-level SVG path, label, hit-layer, and layer replacement helpers.
- `buildNationOverlayModel` in `src/app.js` computes selected/hovered nation overlay models.
- `renderMapOverlay` in `src/app.js` always applies overlay visual state, applies map visual classes, rebuilds overlay paths, replaces claim labels, and refreshes capital markers.
- `applyFilters` in `src/app.js` computes hidden region state and then applies the full visual-state pass.
- Existing Playwright coverage in `tests/language.spec.js` covers hover, click, claim controls, claim cards, capital markers, and clearing the map, but uses direct event dispatch instead of real pointer movement.

## Refactor Strategy

The work should proceed from measurement to narrow optimization. Do not implement world-wrap, scenario switching, or secondary capital hover preview in this issue.

1. Establish a baseline and regression harness.
2. Add small visual-state helper seams that can update a bounded region set.
3. Route simple hover changes through the bounded update path.
4. Cache overlay model construction for unchanged effective inputs.
5. Add overlay render keys so unchanged models do not rebuild the same DOM.
6. Reduce remaining hover-preview and marker churn.
7. Apply one safe visible-overlay DOM reduction only if profiling after Phases 03-06 still shows overlay DOM node count or replacement cost as a meaningful bottleneck. Otherwise, document why this phase is intentionally deferred.
8. Complete final regression hardening, profiling notes, and rollout documentation.

Each phase must leave the app working after `npm run build`, `npm run verify`, and relevant Playwright tests.

## Phase Index

- [01 Baseline And Measurement](01-baseline-and-measurement.md)
- [02 Visual State Delta API](02-visual-state-delta-api.md)
- [03 Simple Hover Fast Path](03-simple-hover-fast-path.md)
- [04 Overlay Model Cache](04-overlay-model-cache.md)
- [05 Overlay Render Skip Keys](05-overlay-render-skip-keys.md)
- [06 Hover Preview And Marker Churn](06-hover-preview-and-marker-churn.md)
- [07 Safe Overlay DOM Reduction](07-safe-overlay-dom-reduction.md) — optional, profiling-gated
- [08 Regression Hardening And Rollout](08-regression-hardening-and-rollout.md)

## Review Boundaries

Generated and deployment artifacts should not be hand-edited. Source changes should happen in `src/**`, `tests/**`, and possibly `tools/**` if a small validation helper is needed. Run `npm run build` to regenerate checked-in Pages output when source changes affect the browser app.

These phase documents are temporary working notes. They may live under `docs/plan/issue-20/**` while implementing the issue, but they should be removed before the final PR if they are not intended to ship as public project documentation.

Prefer these boundaries:

- `src/state/map-visual-state.js`: pure visual-state helpers and bounded DOM class application.
- `src/app.js`: orchestration, cache keys, event routing, model/render call decisions.
- `src/render/map-layers.js`: low-level reusable SVG element and layer helpers.
- `tests/language.spec.js` or a new focused Playwright spec: browser behavior and regression checks.
- `docs/plan/issue-20/**`: planning and phase outcome notes.

Do not make render modules import `appState` directly. Pass state-derived values explicitly from `src/app.js`.

## Baseline Validation Commands

Run these before implementation and at the end of every source-changing phase:

```powershell
npm run build
npm run verify
npm run test:e2e
```

Because Playwright serves `docs/`, source changes in `src/` must be rebuilt before `npm run test:e2e`.

## Manual Smoke Matrix

Use this matrix throughout the phases:

- Hover quickly across dense Europe and confirm hover feedback follows the pointer.
- Hover across South America and confirm Brazil, Bolivia, French Guiana, and nearby regions resolve correctly.
- Select Brazil, hover Bolivia, and confirm selected overlay behavior remains unchanged.
- Select a large nation and move across its claim range; selected overlay state should remain stable.
- Toggle claim mode, project filter, claim kind, and "show claim targets only"; overlays and hidden regions should update correctly.
- Clear selection on empty map space; claim overlay, selection outlines, search text, and pills should reset.
- Confirm tooltip and hover pill text follow the resolved region/nation.
- Confirm hit detection still uses `#hitRegions .region-hit` paths, not visible overlay paths.

## Follow-Up Scope Catalog

These are deliberately out of scope for the issue #20 implementation, but should be preserved as future work hooks:

- Scenario-switching invalidation keys for multiple active data sets.
- Horizontal world-wrap rendering that projects one canonical state onto multiple visual copies.
- Secondary capital hover preview and its overlay priority rules.
- A formal in-app debug panel for render counts and cache hits.
- CI-friendly assertions over debug render counters, if the counters prove stable enough.
- A CI-friendly performance budget for hover transitions.
- Real pointer movement Playwright tests that use coordinates rather than direct dispatch.
- Mobile or touch-specific hit-test smoke coverage.
- Cross-browser smoke coverage beyond Chromium.
- Overlay model extraction from `src/app.js` into a dedicated source module.
- Claim overlay renderer extraction from `src/app.js` into `src/render/**`.
- Stable overlay model serialization for cache debugging.
- Optional cache size limits if future scenario switching expands input cardinality.
- Compound path experiments for more overlay tiers after profiling shows DOM node count remains a bottleneck.
- SVG symbol/use reuse for capital markers if marker churn becomes measurable.
- Deeper claim-list tests for hostile, peaceful, base, gated, and capital claim semantics.
- Accessibility checks after render optimization, especially tooltip and focus behavior.
- A documented profiling recipe using Chrome Performance traces and DOM mutation counts.

## Progress

- [x] Issue #20 read and summarized.
- [x] Current repository source boundaries inspected.
- [x] Existing validation surface inspected.
- [x] Phase plan files created.
- [x] Phase 01 implemented.
- [x] Phase 02 implemented.
- [x] Phase 03 implemented.
- [x] Phase 04 implemented.
- [x] Phase 05 implemented.
- [ ] Phase 06 implemented.
- [ ] Phase 07 implemented.
- [ ] Phase 08 implemented.

## Decision Log

- Plan documentation is repository-local under `docs/plan/issue-20/`.
- Implementation is split into small phases so each phase can be reviewed independently and leave the app working.
- Source changes should be made in `src/**` and tests first; generated `docs/**` output should be updated only through `npm run build`.
- Optimization work starts with measurement before code changes, matching issue #20 acceptance criteria.
- The bounded hover path is treated as a conservative opt-in. Default behavior remains full synchronization unless the transition is proven safe.
- Compound path / DOM-reduction work is profiling-gated rather than mandatory.

## Outcomes

Pending implementation.
