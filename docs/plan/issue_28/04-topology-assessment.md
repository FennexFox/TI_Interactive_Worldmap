# Phase 04: Topology repair assessment

## Goal

- Assess whether the remaining seam artifacts justify a geometry-level topology repair or visual polygon union follow-up after the grouped-fill foundation.

## Scope

- Document why the current grouped compound path implementation improves render structure but does not fully repair geometry.
- Compare source-geometry normalization, visual-only subset union, and overpaint/stroke mitigation as follow-up options.
- Recommend concrete next-step goals for a follow-up issue or PR.

## Non-goals

- Do not implement geometry repair in this phase.
- Do not add GIS dependencies without a measured spike.
- Do not mutate generated region geometry or external Terra Invicta-derived data by hand.
- Do not claim issue #28 is visually complete when high-zoom seams remain visible.

## Affected files

- `docs/plan/issue_28/00-master-plan.md`
- `docs/plan/issue_28/04-topology-assessment.md`

## Implementation steps

- Record the current implementation status and limitation.
- Assess source topology normalization versus visual-only union in terms of impact on base fills, claim overlays, hit testing, and generated data.
- Define recommended follow-up acceptance criteria.
- Post the progress and next-step summary to GitHub issue #28.

## Acceptance criteria

- The repository documents that grouped fill rendering is a foundation, not full topology repair.
- The recommended next step distinguishes source geometry repair from visual fill union.
- The issue comment reports current progress, validation, remaining limitation, and proposed follow-up goals.

## Validation commands

- python3 <path-to-phased-issue-implementation>/scripts/phase_plan_helper.py validate --strict --plan-dir docs/plan/issue_28

## Manual smoke tests

- Reviewed high-zoom screenshots for a base plain-fill area around Mongolia/China/Russia and a Brazil claim overlay area near French Guiana.
- Confirmed remaining seam artifacts can still be visible, though grouped fills reduce some same-fill display artifacts.

## Rollback risks

- Removing this assessment can make the PR look like a complete visual fix instead of a structural foundation plus follow-up plan.

## Progress

- Documented topology repair options and recommended a follow-up spike.

## Decision log

- Do not mutate source region geometry in this PR. The current renderer now has a grouped-fill seam where visual group descriptors can later be replaced by unioned path data without changing hit detection or semantic outlines.
- Prefer a measured visual-union/topology spike before adding a dependency such as Shapely or changing the generated region-map format.

## Outcomes / Retrospective

- Current PR status: grouped fills improve structure and reduce some artifacts, but high-zoom seams remain. This is acceptable as a foundation if issue #28 is tracked with a follow-up geometry/topology goal.

## Assessment

The current implementation groups visual fill paths by state, but each grouped path is still a compound path made by concatenating original region path data. That means the renderer no longer depends on one display path per region, but it has not changed the underlying edges. If two neighboring region outlines have tiny coordinate mismatches, duplicated non-shared borders, slivers, or antialiasing gaps, those defects can still show through.

A true topology fix can happen at two different levels:

- **Source geometry normalization:** parse region outlines, snap shared vertices/edges within a small tolerance, rebuild region paths, and keep the corrected region geometry as the source used by all layers. This benefits base fills, claim fills, hit paths, labels, and future rendering. It is also the riskiest path because it can distort small islands, coastlines, holes, and world-wrap boundary geometry if the tolerance or ring reconstruction is wrong.
- **Visual-only subset union:** keep source region geometry and hit paths unchanged, but union each current visual fill group into display-only path data. This is lower risk for interaction and game-data fidelity because hit detection and semantic outlines remain region-specific. It can benefit both base fills and claim fills if the union helper accepts arbitrary region-id sets from the grouped descriptors. It adds complexity around dynamic claim overlays and caching, but the current grouped-fill descriptor layer is designed for this replacement.
- **Overpaint/stroke mitigation:** add small same-color strokes or underlays. This is cheap and can reduce artifacts, but it is not a topology fix and interacts poorly with semantic claim outlines. It should remain a fallback, not the main solution.

The most pragmatic next step is a measured spike rather than a broad geometry rewrite. Use a small Python tool or notebook-style script to union a few bad seam cases from existing region path data and compare screenshots:

- Plain base-fill group around Mongolia / China / Russia.
- Dense coastline/island areas such as Japan, Korea, Taiwan, the Philippines, and Southeast Asia.
- One claim-heavy case such as Brazil or EU, using the same grouped claim-fill descriptors but preserving per-region semantic outlines.

Recommended spike goals:

- Prove whether visual-only union removes the remaining high-zoom seams without obvious coastline or island distortion.
- Measure output size and build/runtime cost for base groups and representative claim groups.
- Decide whether the union cache belongs in build output, runtime LRU cache, or both.
- Keep `#hitRegions`, hover/selection outlines, and `.claim-overlay[data-region]` semantic outlines unchanged.
- If source geometry normalization appears necessary, define strict tolerances and invariants before mutating generated region geometry.

Recommended follow-up acceptance criteria:

- Same-fill base seams are eliminated or materially reduced in the known high-zoom problem areas.
- Claim fill seams are eliminated or materially reduced for at least one selected-nation overlay without weakening peaceful/hostile/capital/gated outlines.
- Region hover/click targets remain region-specific.
- World-wrap copies and `?worldWrap=0` still render correctly.
- A rollback path exists that can disable unioned visual fills and fall back to compound grouped paths.
