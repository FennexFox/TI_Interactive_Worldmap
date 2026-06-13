# Phase 01: Discovery and boundaries

## Goal

- Resolve the issue requirements, current hover/render implementation, generated-file rules, and validation expectations before coding.

## Scope

- Inspect GitHub issue #27, current branch/worktree state, repo instructions, source files that own hover/claim rendering, and existing Playwright coverage.

## Non-goals

- Do not refactor module boundaries or move rendering code into new modules.
- Do not edit generated `docs/**` deployment output by hand.
- Do not implement long-lived cached SVG DOM groups unless descriptor caching proves insufficient.

## Affected files

- `AGENTS.md`
- `src/app.js`
- `tests/language.spec.js`
- `tests/map-wrap.spec.js`
- `docs/plan/issue_27/*.md`

## Implementation steps

- Fetch issue #27 metadata and acceptance criteria.
- Confirm clean worktree and current branch.
- Locate hover preview, claim overlay rendering, descriptor/model cache, render stat, and Playwright coverage.
- Decide implementation phase boundaries and validation commands.

## Acceptance criteria

- Issue #27 requirements are reflected in the master plan.
- Implementation plan identifies cache keys, invalidation inputs, wrapped/unwrapped validation, and generated artifact handling.

## Validation commands

- python C:\Users\techn\.codex\skills\phased-issue-implementation\scripts\phase_plan_helper.py validate --plan-dir docs/plan/issue_27

## Manual smoke tests

- Not applicable for discovery; source inspection only.

## Rollback risks

- Plan-only changes can be reverted without affecting runtime behavior.

## Progress

- Completed issue lookup, repo instruction review, worktree check, and source/test inspection.

## Decision log

- Use descriptor caching first, not cached SVG DOM nodes, matching the issue's suggested direction.
- Keep all implementation single-agent per user request, despite the repository's default subagent preference.
- Treat `npm run build` as required before `npm run verify` because verification checks generated `docs/assets/**`.

## Outcomes / Retrospective

- Discovery completed. The existing app already has overlay model caching and render-key skips, but hover preview still uses an 80 ms timer and active overlay updates still do extra full visual-state work.
