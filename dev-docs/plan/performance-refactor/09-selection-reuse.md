# Selection outline reuse

## Goal

- Complete the authorized remaining performance work while preserving behavior.

## Scope

- Selection outline reuse as described in HANDOUT.md and the current source.

## Non-goals

- Changes to search meaning, geometry simplification, game data extraction, deployment or unbounded caches.

## Affected files

- src/render/map-marker-renderer.js, debug counters if needed, renderer/browser tests and measurement tools. Browser output is regenerated through the WSL build.

## Implementation steps

- Snapshot ordered effective selected geometry, label/position/capital and normalized copies; avoid serializing paths; invalidate lifecycle operations.
- Measure baseline before source changes, validate implementation, record evidence and commit this phase.

## Acceptance criteria

- Same rendered inputs preserve DOM; all geometry, label, capital, order, copy and clear/reset changes render correctly.

## Validation commands

- `rtk proxy ./scripts/build-wsl.sh --skip-install`
- `rtk proxy env PATH="$PWD/.venv-wsl/bin:$PATH" npm run lint`
- Applicable focused `rtk npm run test:e2e` tests; final phase runs full suite with `--workers=2`.
- `rtk git diff --check`; final integration also runs `rtk npm run check:generated` after commits.

## Manual smoke tests

- Automate browser interactions for affected behavior and inspect DOM/viewBox outcomes; report human visual checks as not performed if unavailable.

## Rollback risks

- Region IDs alone cannot identify changed geometry or mutable callbacks.

## Progress

- Planned; source investigation and baseline are pending.

## Decision log

- User authorized remaining candidates; prior scope deferrals are superseded. Keep candidate measurements and commits separate.

## Outcomes / Retrospective

- Pending execution and validation; no performance claim yet.
