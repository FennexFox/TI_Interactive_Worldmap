# Phase 04: Manual recursive envelope

## Goal

- Render the manual recursive expansion envelope for the anchor nation plus manually pinned expansion-node claimants.

## Scope

- Resolve the anchor from the locked/focused nation.
- Resolve each pinned region to claimant nations whose capital is in that region.
- Build a manual envelope source model with claimant id, depth, parent claimant id, via capital region id, project id, and claim tier where available.
- Render earliest-depth fill for each reached region.
- Show overlaps separately with an outline, marker, badge, tooltip detail, or equivalent lightweight indication.
- Preserve existing claim filter behavior where relevant to the envelope.

## Non-goals

- No automatic fixed-point closure or automatic recommendations.
- No summing tiers, blending claimant colors, or changing claim semantics.
- No rich route explanation panel beyond minimal source labels/data.

## Affected files

- `src/app.js`
- `src/styles.css`
- `src/render/map-layers.js` if shared SVG helpers are extracted.
- `docs/plan/issue_32/04-manual-recursive-envelope.md`
- Rebuilt generated Pages output after source changes.

## Implementation steps

- Add envelope builders that derive anchor and pinned claimant sources from existing claim overlay data.
- Sort source precedence by depth, focused claimant, pin order, then stable nation tag order.
- Generate fill descriptors grouped by depth and separate overlap descriptors.
- Add an envelope layer and render key that includes anchor, pin order, claim filters, language where labels are present, and world copy context.
- Update claim summary or pinned card text only as needed to explain the envelope without crowding the detail panel.

## Acceptance criteria

- The manual recursive envelope shows anchor territory/claims and pinned claimant territory/claims.
- Fill color represents earliest manual recursion depth.
- Overlapping sources use earliest-depth fill plus separate overlap indication.
- Tie behavior is deterministic.
- Existing hover, click, claim overlay, secondary capital preview, search, filters, language switching, and world-wrap behavior still work.

## Validation commands

- `npm run build`
- `npm run verify`
- `npm run test:e2e`

## Manual smoke tests

- Focus China and confirm its normal claim overlay remains usable.
- Pin Tokyo and confirm the envelope includes China plus Japan-derived regions.
- Pin another reachable capital if available and confirm the envelope updates deterministically.
- Confirm overlaps are not blended and show a separate overlap visual.

## Rollback risks

- High feature risk: envelope source precedence can be wrong or stale if model keys omit pin order or filter state.
- Medium visual risk: recursive depth fills can compete with existing claim tier colors.

## Progress

- Not started.

## Decision log

- The manual envelope is additive and explicit; #35 will own automatic maximum closure.

## Outcomes / Retrospective

- Not completed yet.
