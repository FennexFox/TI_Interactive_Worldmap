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
- After: `Project_Final` cumulative claims preserve peaceful `Beta`, direct hostile `Gamma`, and mark direct gated `Delta` as `effectiveHostile: true` / `propagatedHostile: true` via `Project_Bridge`.
- Delta: direct metadata remains `hostileClaim: false` and `gatedClaim: true`; propagation adds `hostileAncestor: "Gamma"`, `hostileVia: "Project_Bridge"`, and `hostileViaLabel: "Inherited from Bridge"`.
- Interpretation: project-mode hostile filtering for `Project_Final` returns `Gamma` and propagated `Delta`; peaceful filtering returns only `Beta`.
- Incoming: incoming claim index entries use the cumulative claim for direct target regions, so `Delta` previews/counts as hostile when another nation inspects that claim.
- Commit: pending final phase gate and commit.
- Commit blocker: none.
- Validation: `node --check src/data/claim-model.js`, `node --check src/app.js`, `npx playwright test tests/state-data-boundaries.spec.js`, `npm run build`, `npm run verify`, and `npm run test:e2e` passed on 2026-06-21.

## Progress

- Implemented; awaiting phase gate and commit.

## Decision log

- Use fixture-equivalent hostile-intermediate path if production Russia/EU data is not straightforward to assert in stable tests.

## Outcomes / Retrospective

- Cumulative claim construction now computes effective hostile state after inheritance, so filters and rendering can distinguish raw direct hostility from path-propagated hostility without losing original claim metadata.
