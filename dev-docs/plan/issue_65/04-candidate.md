# Phase 04: Guarded canonical hit-path candidate

## Goal

- If Phase 3 justifies it, test canonical hit-path geometry reuse behind a debug flag while preserving interaction behavior.

## Scope

- Add `debugUseCanonicalHitPaths=1` or equivalent guarded path only if Phase 3 supports proceeding.
- Define canonical hit geometry safely and render hit instances through `<use>` or another low-risk reuse strategy.
- Preserve region identity on interactive elements without depending on browser-specific shadow target behavior.
- Add focused tests for hover/click and seam-adjacent wrapped regions under the guarded path.
- Rebuild generated Pages output from source.

## Non-goals

- Do not make the candidate default unless evidence clearly supports it and tests prove interaction safety.
- Do not change visual region rendering except where needed for measurement comparison.
- Do not weaken tests that protect hit path interaction.

## Affected files

- `src/app.js`
- `src/render/map-layers.js`
- `tests/map-wrap.spec.js`
- Possibly `tests/language.spec.js`
- `docs/assets/app.js`
- `docs/assets/render/map-layers.js`
- `dev-docs/plan/issue_65/04-candidate.md`

## Implementation steps

1. Re-read Phase 3 decision.
2. Implement guarded candidate if justified.
3. Ensure event resolution works from actual interactive nodes.
4. Add focused interaction tests for guarded mode.
5. Run before/after measurement with equivalent scenarios.
6. Keep, default, or discard the candidate based on evidence.

## Acceptance criteria

- Candidate is debug-guarded or explicitly justified as safe default.
- Hover and click work for canonical and wrapped/seam-adjacent regions.
- Tests verify pinned/selection/overlay interactions are not broken by hit path node changes.
- Before/after metrics are recorded if candidate is kept.

## Validation commands

- `npm run build`
- `node --check src/render/map-layers.js`
- `node --check src/app.js`
- `npx playwright test tests/map-wrap.spec.js`
- `npx playwright test tests/language.spec.js`
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`

## Manual smoke tests

- Default single-copy hover/click.
- `?worldWrap=1` seam hover/click.
- Guarded candidate URL hover/click if implemented.
- Labels, claim overlays, pinned regions, and language refresh.

## Rollback risks

- SVG `<use>` event targeting may differ from path targeting.
- CSS selectors and tests may depend on `path.region-hit`.
- Hidden-region filtering uses stored hit elements and must continue to update all copies.

## Evidence

- Baseline: pending Phase 3 decision.
- After: pending candidate.
- Delta: pending candidate.
- Interpretation: pending candidate.

## Progress

- Not started.

## Decision log

- Skip this phase if Phase 3 evidence does not justify the candidate.

## Outcomes / Retrospective

- Not completed yet.
