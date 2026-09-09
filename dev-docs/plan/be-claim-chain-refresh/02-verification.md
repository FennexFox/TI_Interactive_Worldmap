# Phase 02: Validate generated output and publish the PR

## Goal

- Validate the rebuilt data and deployed app, then push the branch and open a PR with
  a precise description of the Broken Earth claim-chain delta.

## Scope

- Run the full generated-data verifier and unit suite.
- Run the Playwright end-to-end suite against rebuilt Pages output.
- Review the final branch diff, commits, and generated artifact scope.
- Push `update/be-claim-chain` and open a PR targeting `develop`.

## Non-goals

- Further data changes not required by validation findings.
- Deployment or merge of the PR.

## Affected files

- Generated artifacts from phase 1 if validation requires regeneration.
- `dev-docs/plan/be-claim-chain-refresh/**` for final validation evidence.

## Implementation steps

- Run `npm run verify` and fix any source-consistency failure.
- Run `npm run test:e2e` and investigate any scenario/UI regression.
- Confirm `git diff --check`, a clean worktree, and reviewable phase commits.
- Push the branch and create a GitHub PR against `develop`.

## Acceptance criteria

- All automated verification passes.
- Generated changes are limited to manifest-declared outputs and plan evidence.
- The pushed branch matches the local verified HEAD.
- The PR explains source provenance, semantic claim changes, and validation results.

## Validation commands

- npm run verify
- npm run test:e2e

## Manual smoke tests

- Switch the app to `2112 - Broken Earth (DLC)` and exercise a changed claim chain,
  confirming the displayed project/region sequence matches generated data.

## Rollback risks

- Playwright can expose unrelated environment or browser-install failures; distinguish
  those from product regressions and record exact evidence.
- Pushing and PR creation depend on configured GitHub credentials and remote access.

## Progress

- `npm run verify` passed with 66 JavaScript tests, 51 Python tests, and generated
  output verification.
- `npm run test:e2e` passed all 74 Playwright tests.
- A headless browser smoke selected Broken Earth and rendered the two changed hostile
  claim overlays for PAK/Afghanistan and VEN/Amazonia.
- Final branch and generated artifact review is complete.
- Pushed `update/be-claim-chain` and opened PR #100 against `develop`.

## Decision log

- The first manual smoke attempt looked for per-region overlay attributes, but claim
  fills are intentionally grouped under `data-regions`; the corrected smoke asserted
  the grouped fill and hostile hatch representation used by the production renderer.
- No permanent E2E case was added because exact data provenance is enforced by the
  generated verifier and recursive hostile-chain behavior already has browser coverage.

## Outcomes / Retrospective

- The rebuilt Pages app loads scenario `1962`, selects both changed claimant nations,
  and renders Afghanistan/Amazonia in hostile claim groups.
- The full browser suite found no scenario switching, map ownership, claim rendering,
  pinning, or world-wrap regressions.
- PR: https://github.com/FennexFox/TI_Interactive_Worldmap/pull/100
