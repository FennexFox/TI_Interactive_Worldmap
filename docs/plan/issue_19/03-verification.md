# Phase 03: Automated and browser verification

## Goal

- Prove #19 behavior against automated tests, generated build output, and a live browser smoke check.

## Scope

- Run syntax checks for changed JavaScript and Playwright files.
- Run targeted Playwright tests for secondary capital hover.
- Rebuild checked-in Pages output.
- Run repository verification and full e2e tests.
- Smoke the local static app in the Browser plugin when feasible.

## Non-goals

- No extra feature work beyond issue #19.
- No commit, push, or PR unless the user asks.

## Affected files

- `docs/assets/app.js` after `npm run build`
- `docs/assets/data/derived-indices.js` after `npm run build`, if source data module changes
- `docs/assets/state/app-state.js` after `npm run build`, if source state module changes
- `docs/plan/issue_19/03-verification.md`

## Implementation steps

- Run changed-file syntax checks.
- Run targeted Playwright tests for the new behavior.
- Run `npm run build`.
- Run `npm run verify`.
- Run `npm run test:e2e`.
- Start a local static server and manually check selected `EUA` + hover `Moskva` if possible.
- Record final validation results and any residual risks.

## Acceptance criteria

- All listed validation commands pass or any failure is explained and fixed before completion.
- Generated deployment output is rebuilt from source.
- Manual smoke confirms the selected overlay remains visible while secondary preview appears and then clears.

## Validation commands

- `node --check src/data/derived-indices.js`
- `node --check src/state/app-state.js`
- `node --check src/app.js`
- `node --check tests/language.spec.js`
- `node --check tests/map-wrap.spec.js`
- `npx playwright test tests/language.spec.js tests/map-wrap.spec.js -g "secondary capital|border hover preview|world-wrap default secondary"`
- `npx playwright test tests/language.spec.js -g "hover overlay and capital marker|selected nation marks|secondary capital"`
- `npm run build`
- `npm run verify`
- `npm run test:e2e`

## Manual smoke tests

- Browser smoke passed against `http://127.0.0.1:4176/?debugRenderStats=1`.
- Selected `EUA` via the `France` search result, then hovered `Moskva`.
- Confirmed `#claimOverlays .claim-overlay[data-region="Moskva"]` and `#secondaryHoverOverlays .secondary-capital-preview[data-nation="RUS"][data-region="Moskva"]` coexist.
- Confirmed SVG layer order keeps `claimOverlays` before `secondaryHoverOverlays` before `labels`.
- Moved to `Kharkiv` and confirmed secondary overlays clear while regular `#hoverOutlines` fill/outline appears.
- Moved to `Paris` and confirmed own-capital hover does not produce a secondary preview.
- Moved to `Brasilia` and confirmed outside-range foreign hover still uses `#foreignHoverOverlays` without a secondary preview.

## Rollback risks

- Medium; generated output should be rolled back together with matching source if the feature is reverted.

## Progress

- Completed.

## Decision log

- `npm run build` regenerated checked-in Pages output from source after implementation.
- Browser smoke used a local static server on port `4176`, then stopped the server after verification.

## Outcomes / Retrospective

- Syntax checks passed for changed source and Playwright files.
- Targeted Playwright checks passed for secondary capital hover, existing border-hover behavior, and wrapped-map secondary projections.
- `npm run verify` passed.
- `npm run test:e2e` passed with 44 tests.
- No residual known functional issues remain for #19.
