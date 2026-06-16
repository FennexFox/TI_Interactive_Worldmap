# Phase 05: Hover and pan hot-path isolation

## Goal

- Stop hover-only changes and pan-drag movement from rebuilding reachable-capital candidate marker DOM or running large visual refresh work after multiple reachable capitals are pinned.

## Scope

- Remove hover state from reachable-capital marker render identity.
- Preserve reachable-candidate hover highlighting through class toggles or other bounded DOM updates.
- Avoid reachable marker, capital marker, hover overlay, manual-envelope, and map visual-state refreshes during active pan drag.
- Refresh hover once after pan end when needed.
- Add focused e2e coverage for the multi-pin hover and pan scenarios.

## Non-goals

- Do not change reachable-capital candidate eligibility or panel ordering.
- Do not change pinned expansion-node semantics.
- Do not change secondary-capital preview behavior outside active pan drag.
- Do not implement manual-envelope compound paths unless phase evidence contradicts the current priority.

## Affected files

- `src/app.js`
- `tests/language.spec.js`
- `tests/map-wrap.spec.js` if wrapped pan/candidate projection assertions need adjustment
- `docs/plan/issue_41/**`

## Implementation steps

- Change reachable-capital candidate marker render keys so they depend on candidates, copy plan, and language, but not `hoveredRegion`.
- Add a small helper that updates the selected/hover class on existing reachable candidate marker groups for previous and current hovered regions.
- Update hover handlers to call the class-toggle helper instead of marker DOM replacement.
- Change pan drag so pointer movement updates only map viewBox/render scheduling and does not call hover refresh work until `pointerup` / pan end.
- On pan end, resolve hover once from the final pointer location if needed.
- Add e2e assertions using debug counters after three pinned reachable capitals.

## Acceptance criteria

- Hovering two regions after three reachable-capital pins leaves `reachableCapitalCandidateDescriptorBuilds=0` and `reachableCapitalCandidateRebuilds=0`.
- Hovering two regions after three reachable-capital pins avoids full visual-state applications unless the hovered region requires secondary/foreign preview work.
- Dragging after three reachable-capital pins leaves `reachableCapitalCandidateRebuilds=0`, `capitalMarkerRebuilds=0`, `manualEnvelopeRebuilds=0`, `hoverOutlineReplacements=0`, `foreignHoverOverlayReplacements=0`, and `fullVisualStateApplications=0` during pointer movement.
- Pan still changes the map viewBox and suppresses drag selection/click as before.
- Reachable-capital selection and secondary-capital preview behavior remain covered by existing tests.

## Validation commands

- `npm run build`
- `npm run verify`
- Targeted Playwright e2e for the added/changed #41 tests.

## Manual smoke tests

- Load `/?worldWrap=0&debugRenderStats=1`.
- Choose China and pin three reachable capitals.
- Hover across two ordinary regions and confirm reachable candidate markers remain visible and highlight follows hover.
- Drag/pan across map regions and confirm the map moves while debug counters do not show hover/marker rebuild churn during drag.
- After releasing the drag, move/hover normally and confirm hover pill, secondary-capital preview, and reachable marker highlight recover.

## Rollback risks

- Class-only hover updates can leave stale candidate highlight classes if previous and current hover regions are not both updated.
- Deferring hover during drag can leave a stale hover pill or tooltip if pan end does not reconcile the final pointer location.
- Removing hover from render keys must not break language/copy-plan candidate marker rerenders.

## Evidence

- Baseline: phase 4 hover baseline after three pins produced `reachableCapitalCandidateRebuilds=2`, `capitalMarkerRebuilds=2`, and `fullVisualStateApplications=2`.
- Baseline: phase 4 pan baseline after three pins produced `reachableCapitalCandidateRebuilds=10`, `capitalMarkerRebuilds=7`, `fullVisualStateApplications=7`, `hoverOutlineReplacements=5`, and `foreignHoverOverlayReplacements=4`.
- After, single-copy hover after three pins over `Moskva` and `Paris`: `reachableCapitalCandidateDescriptorBuilds=0`, `reachableCapitalCandidateRebuilds=0`, `manualEnvelopeModelBuilds=0`, `manualEnvelopeRebuilds=0`, `fullVisualStateApplications=0`, `boundedVisualStateApplications=2`, `visiblePathsTouched=4`, `hitPathsTouched=4`, `capitalMarkerRebuilds=2`.
- After, single-copy pan during drag after three pins: `reachableCapitalCandidateRebuilds=0`, `capitalMarkerRebuilds=0`, `manualEnvelopeRebuilds=0`, `hoverOutlineReplacements=0`, `foreignHoverOverlayReplacements=0`, `fullVisualStateApplications=0`, `boundedVisualStateApplications=0`, `visiblePathsTouched=0`, `hitPathsTouched=0`.
- After, wrapped hover after three pins over `Moskva` and `Paris`: `reachableCapitalCandidateRebuilds=0`, `fullVisualStateApplications=0`, `boundedVisualStateApplications=2`, `visiblePathsTouched=12`, `hitPathsTouched=12`, `capitalMarkerRebuilds=2`.
- After, wrapped pan during drag after three pins: all tracked hover/overlay/marker/visual-state counters above were `0`, with `viewBoxDeltaX=-3.0184894699999996`, confirming panning still moved the map while avoiding churn.
- Node counts remained stable during hover: single-copy `manualEnvelopeNodeCount=110`, `reachableMarkerNodeCount=6`, `hoverOverlayNodeCount=85`; wrapped `manualEnvelopeNodeCount=333`, `reachableMarkerNodeCount=21`, `hoverOverlayNodeCount=258`.
- Delta: reachable candidate marker rebuilds dropped from `2 -> 0` on hover and `10 -> 0` during pan; full visual applications dropped from `2 -> 0` on hover and `7 -> 0` during pan; pan-time capital marker rebuilds dropped from `7 -> 0`.
- Interpretation: the prioritized hot paths are isolated. Hover still rebuilds ordinary capital markers when the hovered owner changes (`2` in this scenario), but reachable-candidate marker DOM, manual-envelope DOM, and full visual-state applications no longer rebuild on hover-only movement, and pan movement is viewBox-only until pan end.

## Progress

- Complete. Source edits began after the performance Plan Gate passed.

## Decision log

- Current baseline supports fixing reachable marker render-key invalidation and pan hover scheduling before manual-envelope SVG compounding.

## Outcomes / Retrospective

- Removed hover state from the reachable-capital candidate render key and replaced hover-only candidate marker rerenders with class synchronization on existing marker groups.
- Deferred hover reconciliation during map drag until pan end and ignored hit-layer pointer hover work while active panning is in progress.
- Broadened simple hover map visual updates to bounded previous/current-region updates, avoiding full visual-state applications for ordinary hover movement.
- Added e2e coverage for candidate marker DOM stability after three reachable-capital pins and pan-time churn avoidance after three reachable-capital pins.
- Validation passed: `npm run build`; `npm run verify`; targeted Playwright slice for changed hover/pan tests; targeted hover/preview regression slice; full `npm run test:e2e` with 61 passing tests.
