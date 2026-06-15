# Phase 03: Regression tests, build, and generated output

## Goal

- Add regression coverage for grouped visual fills, rebuild generated Pages output from source, and validate the completed issue end to end.

## Scope

- Update Playwright expectations that currently assume every display-fill path is region-specific.
- Add DOM-level checks for grouped base fills, grouped claim fills, semantic claim outlines, world-wrap copies, and unchanged hit-region specificity.
- Run the repository build, verifier, and e2e suite.
- Update checked-in generated Pages output only via `npm run build`.

## Non-goals

- Do not add brittle pixel or screenshot assertions for antialiasing seams.
- Do not inspect or hand-review generated artifact diffs line by line.
- Do not introduce new browser dependencies.

## Affected files

- `tests/map-wrap.spec.js`
- `tests/language.spec.js` if claim overlay count expectations need semantic-outline clarification.
- Generated `docs/**` files produced by `npm run build`.
- `docs/plan/issue_28/03-verification.md`

## Implementation steps

- Update tests to wait on stable hit paths while asserting grouped fill layer selectors.
- Replace claim overlay path count assertions only where they are counting display fill implementation details.
- Add or update world-wrap tests for grouped base and claim fill copies.
- Run `npm run build`, `npm run verify`, and `npm run test:e2e`; fix regressions within issue scope.

## Acceptance criteria

- Automated tests cover grouped visual fills without relying on exact screenshot pixels.
- Existing hover, click, search, claim target, claim mode, project, and world-wrap tests pass.
- Generated `docs/**` output is rebuilt from `src/**`.
- Plan status documents completed work and any smoke-test limitations.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e

## Manual smoke tests

- Use Playwright/DOM inspection for `?worldWrap=0` and default world wrap.
- Manually or semi-manually inspect high-zoom regions listed in the issue when a browser viewport is available.
- If visual inspection is not possible, document that limitation and rely on DOM/regression tests.

## Rollback risks

- Tests that assert exact DOM counts may need future updates if later topology union changes grouping granularity.
- Generated output must not be partially rebuilt; if build fails, do not keep stale generated Pages assets.

## Progress

- Added Playwright DOM-contract tests for grouped base fills, grouped claim fills with per-region semantic outlines, and world-wrap projection for grouped fill paths.

## Decision log

- Used DOM shape, dataset, class, and interaction assertions instead of screenshots because seam artifacts are antialiasing-dependent and brittle in pixel tests.

## Outcomes / Retrospective

- Final validation passed: npm run build, npm run verify, targeted map-wrap e2e (22 tests), and full npm run test:e2e (48 tests) all completed successfully with the temporary python shim.
- Manual-style smoke screenshots were generated for high-zoom base Mongolia/China/Russia plain fill and Brazil claim overlay near French Guiana; both rendered nonblank grouped fill/outline layers. The claim screenshot is label-heavy at that zoom, so final confidence primarily comes from DOM and interaction regression tests.

