# Support manual recursive expansion pins with reachable capital candidates

## Issue Target And Scope Summary

- Issue target: #32
- Title: Support manual recursive expansion pins with reachable capital candidates
- Source plan: GitHub issue #32, with renderer-readiness constraints from issue #24 workstream E3.
- Scope: add a manual recursive expansion route explorer for the existing native-module map. A focused or locked nation is the anchor; users manually pin reachable capital regions as expansion nodes; the map renders the anchor plus pinned-node envelope and can show reachable capital candidates.

## Strategy

- Keep app state explicit: anchor nation remains the focused or locked nation, focused regions continue to drive the full detail panel, and manually selected expansion nodes live in a dedicated `pinnedRegionIds` set.
- Build UI in the existing left-panel card system. Pinned nodes get compact rows and actions, while the existing detail panel remains focused on one selected region or nation.
- Add stable visual state for pinned regions before adding recursive envelope rendering. Pinned styling must not be a side effect of hover, selected regions, or ordinary capital markers.
- Reuse existing claim overlay model helpers to resolve each anchor or pinned claimant's visible claim result. The manual envelope uses earliest recursion depth for fill, and overlap is shown separately.
- Add reachable capital candidates last. Candidate markers are derived from the current manual envelope and the existing `capitalNationsByRegion` index; they are toggled manually and never auto-pin regions.
- Rebuild checked-in Pages output with `npm run build` after source changes; do not hand-edit generated `docs/**` artifacts.

## Phase Order

1. [State model](01-state-model.md)
2. [Compact expansion-node card](02-pinned-regions-ui.md)
3. [Pin controls and map visuals](03-map-visuals-and-interactions.md)
4. [Manual recursive envelope](04-manual-recursive-envelope.md)
5. [Reachable capital candidates](05-reachable-capital-candidates.md)

## Phase Dependencies

- Phase 1 has no implementation dependency beyond resolved issue context and existing state helpers.
- Phase 2 depends on phase 1's `pinnedRegionIds` and candidate-toggle state.
- Phase 3 depends on phase 2's UI affordances so pin/unpin controls and map feedback can share one state path.
- Phase 4 depends on stable pinned state and map visuals from phase 3.
- Phase 5 depends on phase 4's current manual envelope, because candidate eligibility is envelope-derived.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- #35 owns automatic maximum closure. This implementation must not auto-pin or compute/apply a fixed-point maximum route.
- #24 remains a renderer-hardening tracking issue, not a closure target for this PR. The relevant #24 points for #32 are: distinct hover/focus/pin state, stable pinned marker rendering, avoiding unrelated overlay recomputation when pin state changes, and keeping the detail panel single-focused.
- Source files under `src/**`, tests under `tests/**`, and generated-output builders under `tools/**` are implementation sources. Generated `docs/**` and `data/generated/**` files are rebuilt and summarized only.

## Global Validation Expectations

- `npm run build`
- `npm run verify`
- `npm run test:e2e`

## Known Risks And Assumptions

- The current app has `selectedRegionIds` but no separate focused-region field. This work must avoid turning selected regions into the permanent pin set.
- Existing overlay caches include selected-region state in keys. New recursive envelope and candidate keys need their own dependencies so pin changes do not create stale layers.
- Candidate and pinned markers must remain readable in wrapped map copies and while the claim overlay is active.
- The recursive envelope will use existing generated claim data; no Terra Invicta semantics or generated source data are changed.
- The first implementation can keep path explanation minimal through data attributes, titles, labels, and compact rows. A richer explanation UI is deferred.

## Progress

- Phase 0 planning completed: issue #32 was reviewed, issue #24's relevant E3 renderer-readiness notes were incorporated, and phase files were created under `docs/plan/issue_32/`.

## Decision Log

- Use dedicated `pinnedRegionIds` and `showReachableCapitalCandidates` state fields instead of overloading `selectedRegionIds`.
- Treat the locked/focused nation as the anchor and resolve pinned expansion nodes through capital-region claimant lookup.
- Keep automatic maximum closure, saved pin sets, route recommendations, and expanded per-pin detail cards as follow-ups.

## Outcomes / Retrospective

- Planning phase ready for strict helper validation and a phase-sized planning commit.
