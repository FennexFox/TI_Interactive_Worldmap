# Phase 02: Group claim and preview visual fills

## Goal

- Render claim and hover-preview fill colors through grouped compound paths while keeping per-region semantic claim outlines for peaceful, hostile, capital, gated, and owned territory styling.

## Scope

- Split claim overlay descriptors into display-fill descriptors and semantic-outline descriptors.
- Group claim fills by stable fill category such as owned territory or project/tier fill color.
- Keep semantic claim outlines as per-region `.claim-overlay` paths with `fill="none"` and existing region/project datasets.
- Apply the same grouped-fill path for committed claim overlays and hover claim previews.
- Preserve buffered overlay rendering, render keys, and world-wrap projection.

## Non-goals

- Do not change claim model semantics, filters, tier color selection, incoming/outgoing behavior, or claim card behavior.
- Do not merge hit-test paths.
- Do not group selection outlines, hover outlines, capital markers, or text labels.
- Do not introduce topology repair or external geometry dependencies.

## Affected files

- `src/app.js`
- `src/render/map-layers.js`
- `src/styles.css`
- `docs/plan/issue_28/02-claim-visual-groups.md`

## Implementation steps

- Extend claim descriptors or add companion descriptor builders so fill grouping can use `region`, `fillKey`, `fill`, and semantic metadata.
- Update `createClaimOverlayPathFragment` to append grouped fill paths first, then append per-region semantic outline paths.
- Ensure `markHoverClaimPreviewFragment` marks both grouped fill paths and semantic outline paths with preview/nation datasets when applicable.
- Add CSS for grouped claim fill paths that keeps them pointer-inert and stroke-free.
- Include grouped-fill descriptor keys in existing overlay render keys through the descriptor cache key.

## Acceptance criteria

- `#claimOverlays` contains grouped claim fill paths plus per-region semantic outline paths.
- Peaceful, hostile, capital, gated, and owned-territory outline classes still appear on region-specific `.claim-overlay` elements.
- Existing claim mode, project, kind, incoming claim, and hover preview interactions still update overlays without stale buffers.
- Default world wrap projects grouped fill paths and semantic outlines to all copies; `?worldWrap=0` remains single-copy.

## Validation commands

- npm run build
- npm run verify

## Manual smoke tests

- Select Brazil, China, EU, Russia, and India; inspect claim fill grouping and semantic outlines.
- Switch claim modes between all, selected project, and off.
- Switch claim kind between peaceful+hostile, peaceful only, and hostile only.
- Hover across selected and unselected regions and confirm hover previews do not disturb committed overlays.

## Rollback risks

- Reverting phase 2 restores per-region claim fills and can reintroduce high-zoom seams on claim overlays.
- Incorrect split between fill and outline paths could weaken semantic claim styling or break tests that target `.claim-overlay[data-region]`.

## Progress

- Split claim rendering into grouped .claim-fill-group compound paths for visual fills and per-region .claim-overlay paths for semantic outlines.

## Decision log

- Kept data-region off grouped fill paths and preserved data-region on semantic .claim-overlay outline paths; hover claim previews mark both grouped fills and outlines with preview/nation metadata.

## Outcomes / Retrospective

- Phase 2 validation passed: npm run build and npm run verify completed successfully with the temporary python shim.

