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

- Authoritative baseline rerun from ffb1fdb after candidate4, before selection source changes. Chromium149, viewport1440×900, debug on: same-language refresh reconstructs selection (two layer child mutations); wrap change reconstructs twice (four mutations). Probe: tools/measure_selection_updates.mjs; raw selection-before.json in local measurement directory.
- Source and regression tests complete. WSL build/verify78JS+53Python, lint and focused pins/language/scenario/selection browser suite17/17 pass.

## Decision log

- User authorized remaining candidates; prior scope deferrals are superseded. Keep candidate measurements and commits separate.
- Store a WeakMap entry per layer with ordered primitive snapshots (regionName/path, resolved marker position, localized text, dot visibility) and normalized copy key. Compare before SVG allocation, then render directly from captured values. No path serialization. Clear must delete the entry even when the layer is empty; reset replaces stores; destroy remains inert.
- Existing selection highlight overrides data-id and data-nation to null; actual selection output depends on regionName/path rather than those omitted fields. Runtime presentation already forwards recordRenderStat.

## Outcomes / Retrospective

- All10 unchanged browser repeats preserved DOM with0 rebuilds/1 skip. Changed language rebuilds once; wrap construction2→1 (lifecycle clear plus replacement gives2 child mutations, formerly4). Before/after path+label signatures match in all cases.
- Per-layer primitive snapshots compare actual output dependencies; no serialized geometry key. Unit tests independently vary path, position, localization, capital, order, copies and lifecycle state. Browser test exercises pin/unpin, capital stars/dots, empty selection, language, wrap and same-ID scenario geometry. No human visual check; timings are not used for a latency claim.
