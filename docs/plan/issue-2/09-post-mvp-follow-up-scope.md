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

- [x] Deferred scope reviewed after implementation.
- [x] Future issue boundaries drafted.
- [x] Temporary constraints documented.
- [x] Stale plan notes removed or updated.

## Decision Log

- Decision: Keep post-MVP scope visible but outside the issue #2 acceptance gate.
- Decision: Split future work by module and user-facing behavior, not by vague theme.
- Decision: Keep `?worldWrap=0` documented as a rollback/debug fallback, not as a separate user-facing mode.
- Decision: Treat fixed three-copy rendering as sufficient for the MVP because zoom and viewport-aware copy counts are not part of issue #2.
- Decision: Keep future work issue-ready in this document rather than creating GitHub issues during this phase.

## Outcomes

- Reviewed the completed issue #2 implementation and confirmed no follow-up work blocks the MVP.
- Updated `00-master-plan.md` with the final MVP state and canonical-selector invariant.
- Grouped future scope by owner boundary and likely affected modules.
- Documented temporary constraints: fixed three-copy renderer, no zoom, no inertia, no keyboard or touch polish beyond pointer drag, no scenario switching, and no general antimeridian preprocessing.
- Validation for this documentation-only phase: `git status --short --branch` and `git diff --check`.
- Manual smoke reuse: Phase 08 default-route smoke already covered the final implementation after source changes; no additional app behavior changed in this phase.

## Follow-up Issue Notes

### Scenario Switching

- Goal: Generate and load multiple scenario datasets such as `2022`, `2026`, and `2070`.
- Scope: Scenario selector UI, active data reload, derived-index rebuilds, selected-state reset or migration rules, and generated catalog naming.
- Likely files: `src/data/active-data.js`, `src/data/derived-indices.js`, `src/app.js`, `tools/build_pages.py`, catalog builders, and generated `docs/data/**`.
- Validation: Unit tests for active scenario resolution and E2E tests for switching while overlays, labels, and wrap panning are active.

### Save-File Data Import

- Goal: Support user-provided Terra Invicta save-derived state without changing the static Pages MVP.
- Scope: Input format, parsing, validation, merge rules with generated templates, and privacy handling.
- Likely files: new tools under `tools/**`, source data documentation, and possibly a separate local-only UI flow.
- Validation: Parser fixtures, malformed input tests, and explicit no-network/static-site checks.

### Globe View

- Goal: Add an optional 3D globe or alternate projection.
- Scope: Separate projection math, camera, hit testing, labels, overlays, and antimeridian handling from the flat map renderer.
- Likely files: new render modules under `src/render/**`, new state for globe camera, and separate E2E/visual tests.
- Validation: Browser screenshots, interaction tests for globe picking, and regression tests proving flat wrap still works.

### Zoom Support

- Goal: Add bounded zoom while preserving horizontal wrapping.
- Scope: Min/max zoom, wheel or button controls, viewBox scaling, viewport-aware copy counts, label density, and reset-view behavior.
- Likely files: `src/state/map-view-state.js`, `src/app.js`, `src/render/map-layers.js`, `src/styles.css`, and `tests/map-wrap.spec.js`.
- Validation: Unit tests for zoom normalization, E2E tests for copied hit alignment at min/max zoom, and manual smoke on desktop and narrow viewports.

### Keyboard And Touch Panning

- Goal: Make panning usable beyond mouse drag.
- Scope: Arrow-key panning, touch drag, pointer-type handling, pinch prevention or zoom integration, focus management, and accessible control labels.
- Likely files: `src/app.js`, `src/styles.css`, and Playwright input tests.
- Validation: Keyboard E2E, touch emulation tests, and checks that click selection is not suppressed after non-drag input.

### Inertial Panning

- Goal: Add kinetic continuation after drag release.
- Scope: Velocity tracking, animation cancellation, normalization during animation, reduced-motion behavior, and interaction handoff.
- Likely files: `src/state/map-view-state.js`, `src/app.js`, and tests for animation bounds.
- Validation: Deterministic unit tests for velocity/normalization helpers and E2E tests using mocked animation frames.

### Focus-Region Camera Movement

- Goal: Make search and side-panel selections pan the map to visible wrapped copies.
- Scope: Implement the existing focus-region TODOs, choose nearest visible copy, avoid fighting user pan state, and keep selected overlays canonical.
- Likely files: `src/app.js`, `src/state/map-view-state.js`, and `tests/map-wrap.spec.js`.
- Validation: E2E tests selecting regions near the seam and checking the chosen copy remains visible.

### Overlay Performance

- Goal: Reduce DOM and layout cost if wrapped overlays become slow with larger datasets or zoom.
- Scope: Compound paths, nation-level overlay caches, dirty layer scheduling, offscreen copy culling, and copy-aware render keys.
- Likely files: `src/app.js`, `src/render/map-layers.js`, `src/state/map-visual-state.js`, and debug-stat tests.
- Validation: Debug render stats, focused E2E interaction loops, and optional browser performance trace comparison.

### Antimeridian Preprocessing

- Goal: Generalize geometry splitting if future generated data introduces single subpaths that cross most of the world width.
- Scope: Region outline normalization, generated-data tests, migration notes, and visual verification of affected regions.
- Likely files: `tools/build_region_outline_data.py`, `tools/extract_region_outlines.py`, generated map data, and Python tests.
- Validation: Path-span unit tests, generated-output verification, and E2E seam candidate interaction tests.

### Visual Polish

- Goal: Refine wrap affordances without changing core mechanics.
- Scope: Reset-view control, subtle copy continuity hints, cursor polish, hover tooltip placement while panned, and optional current-offset diagnostics.
- Likely files: `src/app.js`, `src/styles.css`, and user-facing E2E tests.
- Validation: Manual desktop/mobile smoke and screenshot comparison if visual assets are introduced.

### Test Coverage Expansion

- Goal: Add heavier regression coverage after the MVP is stable.
- Scope: Seam candidate screenshots, canvas/pixel checks if rendering moves beyond SVG DOM assertions, performance assertions for pan without overlay rebuilds, and mobile viewport coverage.
- Likely files: `tests/**`, `playwright.config.js`, and optional image snapshots.
- Validation: CI runtime review and clear snapshot update policy.
