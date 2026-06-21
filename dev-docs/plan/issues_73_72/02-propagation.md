# Phase 02: Issue 72 propagated hostile claim status

## Goal

- Carry hostile status through cumulative/successive claim paths so downstream claims reached through a hostile intermediate are displayed and filtered as hostile.

## Scope

- Update `src/data/claim-model.js` cumulative claim composition.
- Preserve direct claim metadata while adding effective/propagated hostile metadata.
- Update app rendering to use effective hostile classification.
- Add fixture/unit coverage for a hostile-intermediate path.

## Non-goals

- Do not redesign recursive merge path visualization.
- Do not require real-game Russia/EU data to be present for acceptance.
- Do not alter non-hostile direct claim behavior.
- Do not implement a separate UI design for explaining propagation beyond metadata available to existing list/render paths.

## Affected files

- `src/data/claim-model.js`
- `src/app.js`
- `tests/state-data-boundaries.spec.js`
- Possibly `tests/language.spec.js` or `tests/map-wrap.spec.js`
- Rebuilt `docs/assets/**` from `npm run build`

## Implementation steps

- Add helpers that classify `effectiveHostile`, `propagatedHostile`, and hostile ancestor/via metadata.
- During cumulative claim entry construction, carry hostile path state from inherited/direct sources to downstream direct claims.
- Make `claimKindPass`, incoming grouping, and renderer hostile styling use effective hostile status.
- Preserve direct `hostileClaim` on original claim objects and avoid overwriting it without metadata.
- Add a fixture equivalent to Russia -> hostile intermediate -> downstream claim.

## Acceptance criteria

- A downstream claim inherited/reached through a hostile intermediate has `effectiveHostile: true` and `propagatedHostile: true`.
- Direct hostile claims remain hostile and direct non-hostile claims remain peaceful when no hostile ancestor exists.
- Claim kind filter `hostile` includes propagated hostile claims; `peaceful` excludes them.
- Renderer hatches direct and propagated hostile claims with the same grouped hatch path from phase 1.
- Unit or e2e regression covers hostile propagation.

## Validation commands

- `npm run build`
- `npx playwright test tests/state-data-boundaries.spec.js`
- Focused browser regression if app-level rendering changes are covered there.
- `npm run verify`
- `npm run test:e2e`

## Manual smoke tests

- Select a nation/fixture path with hostile intermediate claims and verify downstream hostile classification.
- Toggle claim kind filters and verify propagated hostile claims move with hostile, not peaceful.
- Confirm direct non-successive claims are unchanged.

## Rollback risks

- Overwriting direct claim metadata could make claim lists misleading.
- Filtering before propagation could drop upstream hostile entries and prevent downstream classification.

## Evidence

- Baseline: current cumulative fixture final claim inherits `Beta` and `Gamma` but direct `Delta` remains non-hostile; no propagated-hostile metadata exists.
- After: TODO
- Delta: TODO
- Interpretation: TODO
- Commit: TODO
- Commit blocker: TODO

## Progress

- Not started; blocked on phase 1 completion.

## Decision log

- Use fixture-equivalent hostile-intermediate path if production Russia/EU data is not straightforward to assert in stable tests.

## Outcomes / Retrospective

- Not completed yet.
