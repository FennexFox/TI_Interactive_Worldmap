# Issue #62 Label Rendering Profiling Result

## Scope

This pass profiled labels before attempting any user-visible optimization. It added debug-only label counters and a `debugDisableLabels=1` A/B control, then compared labels rendered versus labels logically enabled but suppressed by debug instrumentation.

No permanent user-facing label optimization was implemented.

## Measurement

- Command: `npm run measure:render-stats -- --repeats=5 --zoom-steps=0,2,4,6`
- Rows: 160
- Scenarios: labels on/off pairs for `worldWrap=0`, `worldWrap=0` with complex overlays, `worldWrap=1`, and `worldWrap=1` with complex overlays.
- Generated summary: `.chatgpt/tool-tests/render-stats/debug-render-stats-2026-06-19T11-50-09-796Z.summary.csv`

## Label DOM Size

| Scenario | Labels rendered | Wrapped label copies | Avg visible SVG nodes with labels | Avg visible SVG nodes disabled |
| --- | ---: | ---: | ---: | ---: |
| `worldWrap=0` | 363 | 0 | 1315 | 952 |
| `worldWrap=0` complex overlays | 363 | 0 | 1315 | 952 |
| `worldWrap=1` | 1089 | 726 | 3926 | 2834 |
| `worldWrap=1` complex overlays | 1089 | 726 | 3926 | 2834 |

## Pan Cost A/B

Values are aggregate `panFrameMsAvg` over 5 repeats x 4 zoom levels.

| Scenario | Labels mean | Disabled mean | Mean delta | Labels median | Disabled median | Median delta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `worldWrap=0` | 0.524 ms | 0.421 ms | +0.102 ms | 0.538 ms | 0.425 ms | +0.113 ms |
| `worldWrap=0` complex overlays | 0.553 ms | 0.428 ms | +0.125 ms | 0.544 ms | 0.431 ms | +0.113 ms |
| `worldWrap=1` | 0.531 ms | 0.454 ms | +0.078 ms | 0.527 ms | 0.423 ms | +0.104 ms |
| `worldWrap=1` complex overlays | 0.571 ms | 0.361 ms | +0.210 ms | 0.506 ms | 0.348 ms | +0.158 ms |

Worst observed `panFrameMsMax` stayed noisy and scenario-dependent:

- `worldWrap=0`: labels 4.8 ms, disabled 3.8 ms.
- `worldWrap=0` complex overlays: labels 5.6 ms, disabled 3.1 ms.
- `worldWrap=1`: labels 11.0 ms, disabled 10.8 ms.
- `worldWrap=1` complex overlays: labels 23.7 ms, disabled 7.1 ms.

## Rebuild Behavior

Observed label render/replacement counters after stat resets:

| Interaction | Label rebuild result |
| --- | --- |
| Pan | No label rebuilds (`labelRenderCalls=0`). |
| Zoom | No label rebuilds (`zoomLabelRenderCalls=0`). |
| Hover | No label rebuilds (`hoverLabelRenderCalls=0`). |
| Wrap toggle | One label layer rebuild (`wrapToggleLabelRenderCalls=1`). |
| Language refresh | No map label rebuilds (`languageRefreshLabelRenderCalls=0`). |

The language result matches the current `refreshLanguage()` behavior: it refreshes static UI, dropdowns, overlays, pinned panels, and markers, but does not call `renderLabels()`.

## Interpretation

Labels are measurable DOM weight, especially under world wrap where label text nodes triple from 363 to 1089. They also add a consistent but small absolute pan cost, typically about 0.08-0.21 ms per sampled pan frame in this run.

The evidence does not support treating labels as the primary overlay bottleneck yet:

- Labels do not rebuild during pan, zoom, hover, or language refresh in the measured paths.
- The main cost is steady-state SVG node volume, not repeated label reconstruction.
- Complex overlay behavior still points at overlays and world-wrap replicated geometry as the higher-risk optimization target.

## Recommendation

Keep the new label counters and debug A/B flag. Do not ship a user-visible label optimization in issue #62. The next optimization pass should focus on reducing replicated overlay/SVG node pressure first; revisit label virtualization or label-level visibility culling only if later profiles show labels dominating frame time at higher zoom or on slower hardware.
