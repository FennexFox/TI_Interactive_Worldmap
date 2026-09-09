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

- Baseline built application: synchronous40-event wheel burst writes viewBox40times for both wrap modes (also with debug off). Bounded debug-off Chromium CDP trace:40 Layout,2 UpdateLayoutTree,2 Paint,40 EventDispatch events. Source implementation complete. WSL build/verify76JS+53Python, full lint and17 focused unit checks pass. Existing pan/wrap/lifecycle browser checks25/25 pass; new wheel checks5/5 pass after matching measurement viewport1440x900.

## Decision log

- User authorized remaining candidates; prior scope deferrals are superseded. Keep candidate measurements and commits separate.
- Share the existing pan RAF scheduler with wheel, preserve every logical zoom and use a fresh viewport rect each event. Merge pan/wheel context for statistics; synchronous controls cancel/consume pending writes. No viewport caching or discarded deltas.
- Scenario preparation previously cancelled the interaction frame without reapplying viewBox; explicitly preserve pending logical state at that boundary. Destroy cancels without a late render. Unit/browser tests must exercise these same-task interleavings.

## Outcomes / Retrospective

-40 synchronous wheel events now yield1 viewBox write in all four wrap/debug combinations with identical final viewBox. Debug-off bounded trace Layout40→1; Paint remained2. The change batches DOM only; fresh viewport rect reads and logical event order are preserved.
- Initial new e2e assertions failed because default1280×720 viewport quantized MouseEvent coordinates differently from measured1440×900. Fixed test viewport, preserving baseline constants; all5 pass. Lint formatter on Node18 hid errors; corrected browser globals/unused import and full lint passes.
- No human visual smoke test or real-device wheel/trackpad latency measurement. Wrap control during a pending wheel may synchronously write twice while applying wrap adjustments; ordinary wheel/pan bursts share one frame.
