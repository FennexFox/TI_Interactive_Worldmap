# Reduce polygon seam artifacts with grouped visual fill rendering

## Issue Target And Scope Summary

- Issue target: #28
- Title: Reduce polygon seam artifacts with grouped visual fill rendering
- Source plan: GitHub issue #28 is the authoritative issue context.
- Scope: Reduce high-zoom SVG polygon seam artifacts by rendering display-only fills as grouped compound paths while preserving per-region hit paths, hover/selection overlays, claim semantics, filtering, and world-wrap copies.

## Strategy

- Keep `#hitRegions` region-specific for pointer, hover, and click behavior.
- Keep selection, hover, capital markers, labels, and semantic claim outlines as region-specific overlays.
- Add reusable grouped visual-fill helpers in `src/render/map-layers.js` that build compound SVG path data from descriptors grouped by stable visual fill keys.
- Replace per-region base display fills in `#normalRegionColors` with grouped fill paths derived from the active base-map mode and current hidden-region state.
- Replace claim fill rendering with grouped display fills and separate semantic outline paths so peaceful/hostile/capital/gated styling remains encoded by per-region outline paths.
- Update Playwright tests so they assert grouped fill layers and region-specific hit/semantic layers rather than counting display-fill paths as one path per region.
- Rebuild checked-in Pages output with `npm run build`; do not hand-edit generated `docs/**` assets.

## Phase Order

1. [Group base map visual fills](01-base-visual-groups.md)
2. [Group claim and preview visual fills](02-claim-visual-groups.md)
3. [Regression tests, build, and generated output](03-verification.md)
4. [Topology repair assessment](04-topology-assessment.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.
- Phase 4 depends on the completed grouped-fill implementation and observed remaining seam artifacts.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- There was no existing local plan for issue #28.
- Browser behavior changes are made in `src/**` and `tests/**`.
- Generated Pages output under `docs/**` is rebuilt by `npm run build` and summarized only at a high level.
- No external Terra Invicta templates or assets are required; existing committed generated data is sufficient.

## Global Validation Expectations

- npm run build
- npm run verify
- npm run test:e2e

## Known Risks And Assumptions

- Compound SVG paths reduce same-fill antialiasing seams but are not full topology union; visible boundaries between different fill categories remain expected.
- Filtering can no longer hide individual base-fill members by toggling a grouped path class, so grouped base fills must rebuild or be keyed when hidden regions change.
- Claim tests currently count `.claim-overlay` paths as both fill and outline; the implementation must preserve semantic per-region outline hooks while adding grouped fill hooks.
- The implementation assumes region `path` values are valid complete SVG subpaths that can be concatenated into a compound path string.
- The current implementation is not a source geometry/topology repair. Remaining seams should be evaluated through a separate geometry-normalization or visual-union spike before broad pipeline changes.
