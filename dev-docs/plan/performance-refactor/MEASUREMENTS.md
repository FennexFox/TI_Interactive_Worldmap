# Search dropdown measurements

Date: 2026-09-09. Baseline browser sources: `4a37838f` (baseline build produced no tracked changes). Candidate 1 only.

## Direct operation evidence

| Operation | Before | After |
| --- | ---: | ---: |
| Changed nonempty input: dropdown filter resolutions | 2 | 1 |
| Changed nonempty input: dropdown DOM replacements | 2 | 1 |
| Unchanged query/catalog ArrowUp/Down: dropdown resolutions | 1 | 0 |
| Unchanged query/catalog ArrowUp/Down: DOM replacements | 1 | 0 |

Resolution counts are covered by the controller unit test with the production filter wrapped in a counting dependency. DOM replacement and node identity are also checked in Chromium. Results-panel filtering remains separate: total catalog filters per changed nonempty input decrease from 3 to 2, not to 1. A repeated unchanged query reuses choices but still resets highlight and updates presentation once. Selection-only changes can rebuild presentation without refiltering.

## Browser dispatch measurements

Run the same `tools/measure_search_updates.mjs` against separately served baseline and rebuilt docs. Chromium 149.0.7827.55, viewport 1440×900, debug disabled, no CPU throttle, same checked-in data and default game scenario. One `Can` warm-up, then `Canada`, `Chi`, `China`, `Seoul`, `Canada`; each input is immediately followed by ArrowDown. Five samples cover different queries rather than statistical repeats of one identical workload.

| Synchronous dispatch | Before median (min–max), ms | After median (min–max), ms |
| --- | ---: | ---: |
| Input | 1.5 (1.1–4.2) | 1.5 (1.3–2.9) |
| ArrowDown | 0.2 (0.1–0.3) | 0.1 (0.0–0.2) |

All five samples: replacements 2→1/input and 1→0/arrow; arrow option identity false→true. Option counts were unchanged (2, 21, 12, 1, 2). Input median did not improve at this resolution. The defensible gain is eliminated work, not a demonstrated end-to-end latency improvement. Zero-ms samples reflect timer resolution, not zero cost.

The first after capture overlapped the full browser suite and had elevated timings (input 2.5–3.8 ms). The paired baseline/after capture above ran sequentially after that suite finished. The host was not CPU-isolated; small samples, JIT, allocation and timer noise remain. These synchronous event durations exclude paint/composite completion. No FPS, perceived-speed, browser-trace or percentage-latency claim is made.

Local raw records: `search-baseline-idle.json`, `search-after-idle.json`, and earlier `search-baseline.json` / `search-after.json` under `.chatgpt/tool-tests/performance-refactor/`. Raw tool output is intentionally untracked. Reproduce after building and serving each version:

```sh
rtk proxy node tools/measure_search_updates.mjs /tmp/search-baseline.json http://127.0.0.1:4177
rtk proxy node tools/measure_search_updates.mjs /tmp/search-after.json http://127.0.0.1:4176
```

## General rendering regression capture

Same Chromium, viewport 1400×950, debug enabled, zoom 0, default selection/setup and 24 pan steps. One capture per preset, no discarded warm-up or repeat variance estimate: these are structural checks only. The initial 45-case sweep was stopped before a summary and is excluded. Both baseline and after were built before capture.

| Preset | setupOk / hoverProbeOk, both versions | Visible SVG nodes, before / after | Base / hit / label count, each version |
| --- | --- | ---: | ---: |
| wrap-off-labels | true / true | 1238 / 1238 | 363 / 363 / 363 |
| wrap-on-labels | true / true | 3695 / 3695 | 1089 / 1089 / 1089 |
| wrap-on-complex-overlays-labels | true / true | 3695 / 3695 | 1089 / 1089 / 1089 |

Every non-timing Count/Bytes summary field matched. No failed setup/hover captures were mixed into results. Pan JS timings are not frame-completion or FPS measurements and were captured with different background test load; they are not used for performance inference. Reproduction command (use `baseline` then `after` output directories):

```sh
rtk npm run measure:render-stats -- --repeats=1 --zoom-steps=0 --scenarios=wrap-off-labels,wrap-on-labels,wrap-on-complex-overlays-labels --summary-json --out=.chatgpt/tool-tests/performance-refactor/after
```

## Deferred handout candidates

- Candidate 2: no isolated base-layer rebuild timing or invalidation benefit measured; do not add another render key based on call counts alone.
- Candidate 3: rank/string preparation costs were not isolated after removing the duplicate dropdown resolution; preserve existing search meanings and canonical region membership.
- Candidate 4: no high-frequency wheel trace or burst baseline; current preset wheel spacing cannot justify scheduler changes.
- Candidate 5: no isolated selection-outline replacement timing under a representative selection workload; defer the capital/language/geometry invalidation complexity.

The handout permits selecting candidates by evidence. These deferrals complete this bounded implementation; they do not claim the remaining candidates are ineffective.
