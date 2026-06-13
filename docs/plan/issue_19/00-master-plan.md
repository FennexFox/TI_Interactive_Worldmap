# Add secondary nation preview when hovering foreign capitals inside selected expansion range

## Issue Target And Scope Summary

- Issue target: #19
- Title: Add secondary nation preview when hovering foreign capitals inside selected expansion range
- Source plan: none
- Scope: implement a canonical secondary-capital hover preview. When a selected nation's displayed overlay result set contains a foreign nation's capital region, hovering that capital renders the foreign nation through the existing non-selected hover overlay while the selected nation overlay remains primary.

## Strategy

- Build a canonical `capitalNationsByRegion` index in `src/data/derived-indices.js` from active claim/nation data rather than SVG elements.
- Add a mostly pure `resolveSecondaryCapitalPreview` resolver that accepts active data, derived indices, selected nation ID, hovered region ID, and selected overlay model.
- Store secondary hover state separately from selected and ordinary hover state in `appState.interaction.secondaryHoverNationId`.
- Reuse the existing foreign-hover overlay descriptor/render path in `src/app.js`, with a distinct secondary visual class and render key, so the selected overlay model is not rebuilt on pointer movement unless selection or overlay options changed.
- Clear secondary state on ineligible hover movement, pointer leave, selection clear/change, and claim option changes.
- Cover the feature with Playwright tests using the current data-backed manual example: `EUA` (France / European Union path) selected, hover `Moskva`, preview `RUS`.

## Phase Order

1. [Discovery and resolver boundaries](01-discovery.md)
2. [Resolver state and secondary overlay rendering](02-implementation.md)
3. [Automated and browser verification](03-verification.md)

## Phase Dependencies

- Phase 1 resolves issue context, local boundaries, and data-backed examples.
- Phase 2 depends on Phase 1 and implements only the canonical resolver, state, rendering, and focused tests.
- Phase 3 depends on Phase 2 and runs generated build, repository verification, Playwright, and a manual browser smoke check.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth for #19.
- The GitHub issue body is authoritative for acceptance criteria.
- `src/data/derived-indices.js` owns canonical derived indices and the secondary-capital resolver.
- `src/app.js` owns UI state wiring and map overlay rendering orchestration.
- `docs/assets/**` may change only through `npm run build`; do not hand-edit generated deployment output.

## Global Validation Expectations

- `node --check src/app.js`
- `node --check src/data/derived-indices.js`
- `node --check tests/language.spec.js`
- Targeted Playwright tests for the secondary capital hover behavior.
- `npm run build`
- `npm run verify`
- `npm run test:e2e`
- Browser smoke against a local static server when feasible.

## Known Risks And Assumptions

- The current static data uses `EUA` as the France / European Union-like nation and `Moskva` as Russia's capital region.
- Multiple nations can share a capital region; MVP ordering will prefer displayable nations with current territory, then stable tag ordering.
- The secondary preview should not change claim semantics, selection, project filters, or permanent capital marker behavior.
- The user requested no subagents; all work is executed by the main agent.
