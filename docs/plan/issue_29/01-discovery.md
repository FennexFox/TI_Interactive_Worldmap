# Phase 01: Discovery and boundaries

## Goal

- Resolve issue #29 requirements, current #27 cache baseline, module boundaries, and validation gates before changing code.

## Scope

- Inspect GitHub issue #29.
- Confirm current branch/worktree and repo instructions.
- Inspect `src/app.js` claim overlay descriptor cache and DOM replacement path.
- Inspect existing Playwright tests around hover, wrapping, language changes, cache hits, and empty overlay clears.

## Non-goals

- Do not implement cached mounted SVG groups per nation.
- Do not alter Terra Invicta claim data or generated data builders.
- Do not refactor render module boundaries.

## Affected files

- `AGENTS.md`
- `src/app.js`
- `tests/language.spec.js`
- `tests/map-wrap.spec.js`
- `docs/plan/issue_29/*.md`
- Generated after build: `docs/assets/app.js`

## Implementation steps

- Fetch issue #29 from GitHub.
- Confirm branch/worktree state.
- Locate claim overlay render key, descriptor cache, DOM replacement, and debug render stats code.
- Identify regression tests that must remain true.

## Acceptance criteria

- Plan reflects all issue #29 acceptance criteria.
- Implementation approach preserves #27 descriptor cache behavior.
- Validation plan covers wrapped/unwrapped modes, language label refresh, empty clear, and stale render cancellation.

## Validation commands

- python C:\Users\techn\.codex\skills\phased-issue-implementation\scripts\phase_plan_helper.py validate --plan-dir docs/plan/issue_29

## Manual smoke tests

- Not applicable for discovery.

## Rollback risks

- Plan-only changes can be reverted without runtime impact.

## Progress

- Completed issue lookup, branch/worktree check, repo instruction review, and source/test inspection.

## Decision log

- Work directly in `src/app.js` because claim overlay rendering already lives there and render modules should remain state-agnostic.
- Do not spawn a subagent; the implementation is tightly scoped to one source file plus tests, and coordination overhead would exceed the benefit.

## Outcomes / Retrospective

- Discovery complete. Current branch includes #27 descriptor caches and regression tests; the remaining issue is the visible DOM swap strategy for claim overlay and label layers.
