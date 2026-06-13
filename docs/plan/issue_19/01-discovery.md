# Phase 01: Discovery and resolver boundaries

## Goal

- Confirm the issue requirements, local architecture boundaries, and data-backed test cases before editing behavior.

## Scope

- Inspect GitHub issue #19 acceptance criteria.
- Inspect state/data/render boundaries in `src/state/app-state.js`, `src/data/derived-indices.js`, `src/render/map-layers.js`, and `src/app.js`.
- Identify a current-data example for foreign capital hover inside a selected overlay result set.
- Decide where the pure resolver and canonical capital index belong.

## Non-goals

- No behavior changes in this phase.
- No generated output changes in this phase.
- No permanent capital marker layer.

## Affected files

- `docs/plan/issue_19/00-master-plan.md`
- `docs/plan/issue_19/01-discovery.md`

## Implementation steps

- Fetch issue #19 through the GitHub connector.
- Read current AGENTS instructions and local source boundaries.
- Search targeted source sections for hover, overlay model, capital marker, and foreign hover renderer logic.
- Decode generated data in memory only to find an automated test fixture.

## Acceptance criteria

- Issue requirements are summarized in the master plan.
- Chosen implementation boundary avoids SVG DOM state inference.
- At least one realistic test case is identified.

## Validation commands

- `python C:\Users\techn\.codex\skills\phased-issue-implementation\scripts\phase_plan_helper.py validate --plan-dir docs/plan/issue_19`

## Manual smoke tests

- Not applicable for discovery.

## Rollback risks

- Low; this phase only creates planning documentation.

## Progress

- Completed issue lookup and source review.
- Confirmed current branch is `issue_29` and worktree was clean before #19 edits.
- Confirmed existing hover interactions are delegated through `#hitRegions` and canonical `data-region-id` / `data-region` lookup.
- Confirmed selected overlay model exposes `resultSet`, `baseSet`, and `claimSet`.
- Confirmed existing foreign-hover overlay descriptors can render a non-selected nation's territory and claim range without mutating selected overlay state.
- Confirmed current generated data supports the manual example with selected `EUA` and hovered `Moskva`, resolving secondary nation `RUS`.

## Decision log

- Add `capitalNationsByRegion` to `buildDerivedIndices(activeData)`.
- Add `resolveSecondaryCapitalPreview` in `src/data/derived-indices.js`; keep it pure over canonical IDs and overlay model data.
- Use `appState.interaction.secondaryHoverNationId` for secondary hover state.
- Reuse the foreign-hover descriptor path with a secondary class instead of creating a new overlay model family.

## Outcomes / Retrospective

- Discovery completed. The issue can be implemented in a narrow pass over derived indices, app state, `src/app.js` hover wiring, and Playwright tests.
