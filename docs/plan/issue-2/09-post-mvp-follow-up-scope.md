# Phase 09: Post-MVP Follow-up Scope

## Goal

Capture follow-up work that should remain outside the issue #2 MVP unless it is explicitly pulled into a later issue.

## Scope

- Convert deferred ideas into issue-ready scope notes.
- Identify which follow-ups depend on the world-wrap renderer.
- Keep each future work item separable from the MVP implementation.
- Document technical hooks that issue #2 should leave behind.

## Non-goals

- Do not implement any follow-up feature in issue #2.
- Do not expand world-wrap into globe mode.
- Do not combine scenario switching, save parsing, zoom, and overlay optimization into one PR.
- Do not change the current MVP acceptance criteria.

## Affected Files

- `docs/plan/issue-2/00-master-plan.md`
- Future issue templates or GitHub issues if the maintainer chooses to create them
- No application source files by default

## Implementation Steps

1. Review the completed issue #2 implementation.
2. Identify intentionally deferred behavior and any temporary constraints.
3. Group follow-ups into independent future issues.
4. Record likely affected modules and validation needs for each follow-up.
5. Remove stale planning notes that no longer match the implementation.

## Acceptance Criteria

- Follow-up scope is documented without blocking issue #2 completion.
- Each follow-up item has an independent owner boundary.
- The issue #2 implementation does not depend on unfinished follow-up work.
- No app behavior changes are included in this phase unless a new issue explicitly requests them.

## Validation Commands

```powershell
git status --short --branch
git diff --check
```

If documentation is the only change, app build commands are optional. If any source or generated file changes, run:

```powershell
npm run build
npm run verify
npm run test:e2e
```

## Manual Smoke Tests

- Confirm the issue #2 final implementation still passes the Phase 08 manual smoke tests.
- Confirm no follow-up note describes behavior that was already implemented differently.

## Rollback Risks

- Follow-up notes can become misleading if they are not updated after final implementation.
- Overly broad follow-up issues can recreate the same review-size risk this plan is avoiding.

## Progress

- [ ] Deferred scope reviewed after implementation.
- [ ] Future issue boundaries drafted.
- [ ] Temporary constraints documented.
- [ ] Stale plan notes removed or updated.

## Decision Log

- Decision: Keep post-MVP scope visible but outside the issue #2 acceptance gate.
- Decision: Split future work by module and user-facing behavior, not by vague theme.

## Outcomes

Pending implementation.

## Follow-up Candidates

- Scenario switching: generate and load `2022`, `2026`, and `2070` data, add scenario selector UI, and rebuild derived indices on scenario changes.
- Globe view: separate 3D projection, hit testing, labels, and overlay rendering from the flat map.
- Zoom support: define min/max zoom, viewport-aware copy count, and focus-region behavior.
- Keyboard and touch panning: arrow keys, touch drag, pinch prevention or support, and accessibility affordances.
- Inertial panning: kinetic motion after drag release, with strict normalization and cancel rules.
- Focus-region camera movement: update the existing `focusRegions` TODOs so search and side-panel selections keep regions visible.
- Overlay performance: compound paths, nation-level path caches, dirty layer scheduling, and offscreen copy culling.
- Antimeridian preprocessing: general split or normalization if targeted region fixes become brittle.
- Visual polish: cursor states, subtle edge continuity hints, and optional reset-view control.
- Test coverage expansion: visual screenshot checks for seam candidates and performance assertions for pan without overlay rebuilds.

