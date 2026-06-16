# Phase 04: Baseline correction and plan reset

## Goal

- Correct the plan so PR #42 is treated as preparation, then capture a concrete multi-pin hover/pan baseline for the remaining user-visible problem.

## Scope

- Read issue #41 and PR #42 follow-up context.
- Inspect hover, reachable-capital marker, pan, and manual-envelope paths.
- Capture current debug-counter baseline after multiple reachable capitals are pinned.
- Update this phased plan with performance acceptance criteria that can fail.

## Non-goals

- Do not edit application source in this phase.
- Do not claim #41 complete from PR #42 cache and click-path work.
- Do not optimize manual-envelope compound paths without timing/node-count evidence.

## Affected files

- `docs/plan/issue_41/**`

## Implementation steps

- Read the pasted objective, issue #41, PR #42, and existing phase files.
- Inspect `src/app.js` hover, reachable marker render key, pan drag, manual envelope, and capital marker paths.
- Run a one-off Playwright baseline against `/?worldWrap=0&debugRenderStats=1` with three pinned reachable capitals.
- Update master and phase plans so final completion requires before/after evidence.

## Acceptance criteria

- The plan no longer states or implies PR #42 fully fixed #41.
- The plan includes target interactions, reproduction scenario, baseline, measurement method, before/after comparison, and non-success outcome.
- Current baseline identifies whether hover/pan rebuild reachable markers, capital markers, hover overlays, manual envelope, or other large SVG layers.

## Validation commands

- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py validate --plan-dir docs/plan/issue_41`
- `python /home/fennexfox/.codex/skills/phased-issue-implementation/scripts/phase_plan_helper.py gate --plan-dir docs/plan/issue_41 --type performance`

## Manual smoke tests

- Use `/?worldWrap=0&debugRenderStats=1` to choose China, pin three reachable capitals, hover two regions, drag across the map, and inspect debug counters.

## Rollback risks

- Plan-only changes can overconstrain implementation if the baseline is too narrow; keep the scenario focused on the user-reported multi-pin hover/pan problem.

## Evidence

- Baseline: after pinning `MalayPeninsula`, `NorthHonshu`, and `SouthThailand`, hover over `Moskva` and `Paris` produced `reachableCapitalCandidateRebuilds=2`, `capitalMarkerRebuilds=2`, `fullVisualStateApplications=2`, `manualEnvelopeModelCacheHits=2`, `reachableCapitalCandidateDescriptorCacheHits=2`, and node counts `manualEnvelopeNodeCount=110`, `reachableMarkerNodeCount=6`, `hoverOverlayNodeCount=85`.
- Baseline: a 12-step drag from `Moskva` produced `reachableCapitalCandidateRebuilds=10`, `capitalMarkerRebuilds=7`, `fullVisualStateApplications=7`, `boundedVisualStateApplications=4`, `visiblePathsTouched=2548`, `hitPathsTouched=2548`, `manualEnvelopeModelCacheHits=11`, and `reachableCapitalCandidateDescriptorCacheHits=11`.
- After: To be captured in phase 5 after source changes.
- Delta: To be computed in phase 5 by rerunning the same scenario.
- Interpretation: current evidence shows hover-only changes rebuild reachable marker DOM and pan drag still runs hover/marker/visual-state work; this supports prioritizing hover marker stability and pan isolation before manual-envelope compound paths.

## Progress

- Read issue #41, PR #42, and the pasted follow-up objective.
- Confirmed `reachableCapitalCandidateRenderKey()` includes `hoveredRegion`.
- Confirmed hover handlers call `renderReachableCapitalCandidateMarkers(currentOverlayModel)` and `renderCapitalMarkers()`.
- Confirmed pan drag currently calls `schedulePanHoverRefresh(...)` on pointer movement.
- Captured current multi-pin hover/pan baseline counters.
- Reframed PR #42 phases as preparation rather than final performance completion.

## Decision log

- Keep manual-envelope compound-path rendering as a conditional follow-up because baseline node count is modest compared with repeated pan/hover refresh counters.
- Prefer counter-based e2e guardrails for hot-path work and add timing probes only if counter deltas are insufficient.

## Outcomes / Retrospective

- Completed as plan correction and baseline gathering. The remaining implementation work starts in phase 5.
