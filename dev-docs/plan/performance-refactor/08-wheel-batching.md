# Wheel frame batching

## Goal

- Complete the authorized remaining performance work while preserving behavior.

## Scope

- Wheel frame batching as described in HANDOUT.md and the current source.

## Non-goals

- Changes to search meaning, geometry simplification, game data extraction, deployment or unbounded caches.

## Affected files

- src/interaction/map-view-controller.js, related interaction code if required, unit/browser tests and measurement tools. Browser output is regenerated through the WSL build.

## Implementation steps

- Measure wheel burst writes; accumulate logical zoom per event while scheduling DOM application once per frame. Preserve synchronous control ordering and cancel pending lifecycle work.
- Measure baseline before source changes, validate implementation, record evidence and commit this phase.

## Acceptance criteria

- Same final viewBox for moving anchors, clamping, wrap and interleaved controls; one write per burst/frame, no writes after destruction.

## Validation commands

- `rtk proxy ./scripts/build-wsl.sh --skip-install`
- `rtk proxy env PATH="$PWD/.venv-wsl/bin:$PATH" npm run lint`
- Applicable focused `rtk npm run test:e2e` tests; final phase runs full suite with `--workers=2`.
- `rtk git diff --check`; final integration also runs `rtk npm run check:generated` after commits.

## Manual smoke tests

- Automate browser interactions for affected behavior and inspect DOM/viewBox outcomes; report human visual checks as not performed if unavailable.

## Rollback risks

- Pending wheel state can conflict with pan, buttons, reset or viewport layout changes.

## Progress

- Planned; source investigation and baseline are pending.

## Decision log

- User authorized remaining candidates; prior scope deferrals are superseded. Keep candidate measurements and commits separate.

## Outcomes / Retrospective

- Pending execution and validation; no performance claim yet.
