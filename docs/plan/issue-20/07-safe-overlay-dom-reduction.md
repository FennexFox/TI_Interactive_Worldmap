# Phase 07: Safe Overlay DOM Reduction

## Goal

Render at least one safe visible overlay group more efficiently through compound SVG paths or another documented DOM-reduction strategy only if profiling after Phases 03-06 still shows overlay DOM node count or replacement cost as a meaningful bottleneck. Otherwise, document why this phase is deferred.

## Scope

- Re-profile after Phases 03-06 before making any DOM-reduction change.
- Choose one low-risk overlay group for DOM reduction, likely base territory paths or a same-style claim tier group, only if the new profile justifies the complexity.
- Keep hit detection on canonical `#hitRegions .region-hit` paths.
- Preserve claim tier styling, hostile/peaceful styling, gated styling, capital styling, and label behavior.
- Document why the selected group is safe and which groups remain per-region.
- If profiling no longer shows overlay DOM node count or replacement cost as a bottleneck, document the deferral instead of implementing compound paths.

## Non-Goals

- Do not make compound paths mandatory for issue #20.
- Do not implement this phase merely because it was listed in the original plan; require post-cache/post-skip profiling evidence.
- Do not compound hit-test paths.
- Do not remove per-region data from visible paths if tests or future features still need it.
- Do not change claim semantics or layer ordering.

## Affected Files

- `src/app.js`
- `src/render/map-layers.js` if compound path creation belongs in render helpers
- `src/styles.css` only if a class needs explicit styling for compound groups
- `tests/language.spec.js` or focused overlay spec
- Generated `docs/assets/**` after `npm run build`

## Implementation Steps

1. Re-profile dense-region hover and selected overlay interactions after Phases 03-06.
2. If overlay DOM node count or replacement cost is no longer a meaningful bottleneck, skip implementation and document the deferral in this file's Outcomes.
3. If the bottleneck remains meaningful, inventory overlay path classes and their style-affecting inputs: owned territory, basic/research claim, hostile, peaceful, capital, gated, and foreign hover.
4. Pick the safest group with identical style and no per-region interaction requirement.
5. Implement a helper that joins region path `d` values into one compound path for that group, or choose another measurable DOM-reduction strategy if compound paths are too risky.
6. Keep per-region hit-layer paths unchanged.
7. Verify overlay counts in tests are updated intentionally only where the DOM-reduction strategy changes node counts. Prefer adding semantic assertions that do not depend only on raw node count.
8. Document the selected strategy, or the deferral reason, and any remaining groups in this file's Outcomes.
9. Run build, verify, and e2e if implementation changes were made.

## Acceptance Criteria

- Either profiling justifies implementation and at least one visible overlay group produces fewer DOM nodes, or profiling does not justify implementation and the deferral is documented.
- Claim tier styling and visual semantics are preserved.
- Hit detection remains per canonical region through the hit layer.
- Tests assert behavior semantically enough that reduced overlay node count does not hide regressions.
- Dense-region hover and selected overlay behavior feel no worse than before.
- `npm run build`, `npm run verify`, and `npm run test:e2e` pass if source changes are made.

## Validation Commands

```powershell
npm run build
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Re-profile after Phases 03-06 and confirm whether this phase is still necessary.
- Select Brazil and compare owned territory and claim overlay visuals before/after if implementation proceeds.
- Toggle all/project/off claim modes.
- Toggle peaceful/hostile filters.
- Hover and click regions covered by a compound or reduced overlay group.
- Confirm hit target resolution still follows `#hitRegions` and not overlay paths.

## Rollback Risks

- Compound paths remove per-region data attributes from visible overlay nodes, which can break tests or future diagnostics.
- Joining path data can make debugging individual claim regions harder.
- Grouping the wrong styles can collapse hostile, gated, capital, or tier distinctions.

## Progress

- [x] Overlay grouping inventory completed.
- [x] Post-Phase-06 profile reviewed.
- [x] Safe group selected and documented, or deferral documented.
- [x] DOM-reduction strategy deferred because profiling did not justify it.
- [x] Semantic tests reviewed; no test changes required.
- [x] Validation commands run.

## Decision Log

- Compound paths are optional in issue #20; a different documented DOM-reduction strategy is acceptable if it is safer.
- This phase is profiling-gated. Skipping it is acceptable if earlier phases remove the meaningful DOM replacement bottleneck.
- Hit testing remains canonical-region based regardless of visible overlay strategy.
- Post-Phase-06 profiling showed selected Brazil renders 26 overlay paths and 2 labels, and repeated same-key Brazil selection reuses the cached model with `claimOverlayDomReplacements=0`, `claimLabelDomReplacements=0`, and `capitalMarkerRebuilds=0`.
- Claim-hover movement inside Brazil's visible claim range touched only two visible/hit paths and did not rebuild claim overlay or label DOM.
- Moving between Canadian foreign-hover regions under selected Brazil kept `foreignHoverOverlayReplacements=0`; remaining work in that path is visual-state/capital-marker work rather than selected-claim overlay DOM churn.
- Compounding owned territory would reduce only 9 Brazil nodes in the profiled case while removing useful per-region overlay path granularity; the complexity is not justified for issue #20.

## Outcomes

Implemented Phase 07 as a documented deferral on 2026-06-13.

Post-Phase-06 profile:

- Initial Brazil selection: 26 claim overlay paths, 2 claim labels, 1 overlay DOM replacement, 1 label DOM replacement, 1 overlay model build.
- Brazil overlay grouping inventory: 9 owned-territory paths, 6 peaceful research-claim paths, and 11 hostile research-claim paths.
- Repeating the same Brazil selection: 26 paths, 2 labels, `overlayModelCacheHits=1`, `overlayModelBuilds=0`, `claimOverlayDomReplacements=0`, `claimLabelDomReplacements=0`, and `capitalMarkerRebuilds=0`.
- Moving from Amazonia to French Guiana while Brazil is selected: `boundedVisualStateApplications=1`, `visiblePathsTouched=2`, `hitPathsTouched=2`, `claimOverlayDomReplacements=0`, and `claimLabelDomReplacements=0`.
- Moving from Ontario to another Canadian region while Brazil is selected: Canadian foreign hover overlay stayed at 10 paths with `foreignHoverOverlayReplacements=0`; selected Brazil overlay DOM stayed unchanged.
- Project, hostile, and off filter changes each replaced overlay DOM exactly once because the visible overlay semantics changed.

Decision:

- No compound-path or alternate visible overlay DOM-reduction strategy was implemented in Phase 07.
- The measurable selected-overlay DOM replacement bottleneck from the baseline has been removed by Phases 04-06 for unchanged interactions.
- Remaining selected overlay node counts are small in the profiled Brazil case, and replacements now correspond to real semantic changes.
- Keeping per-region overlay paths preserves diagnostics and avoids changing tests or future features that may inspect individual overlay nodes.

Validation:

- `npm run build` passed.
- `npm run verify` passed: generated outputs verified, 5 Python unit tests passed.
- `npm run test:e2e` passed: 13 Playwright tests passed.

Manual smoke notes:

- Re-profiled selected Brazil, repeated Brazil selection, Brazil claim-hover movement, Canadian foreign-hover movement, project filter, hostile filter, and claim mode off.
- Toggle all/project/off and hostile filtering still updated overlay counts intentionally.
- No compound or reduced overlay group was introduced, so canonical hit target resolution remains unchanged through `#hitRegions .region-hit`.
- Existing semantic e2e coverage continues to assert hover, click, selection, overlay counts, panel state, language changes, and clear-map behavior.

Retrospective:

- Deferring compound paths keeps issue #20 focused on proven wins and avoids adding a second representation of region geometry.
- A future DOM-reduction task should start from a profile showing real replacement or node-count cost after the current cache and render-key work, not from the old baseline.
