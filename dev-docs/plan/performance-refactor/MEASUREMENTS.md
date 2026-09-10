# Search dropdown and base-color measurements

Date: 2026-09-09. Baseline browser sources: `4a37838f` (baseline build produced no tracked changes). Initial capture: candidate 1 only; follow-up candidate 2 evidence is below.

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

## Initial deferral decisions (before the follow-up request)

- Candidate 2 was initially deferred because its cost had not been isolated. The user subsequently authorized choosing by estimated benefit; this deferral is superseded by the implementation and measurements below.
- Candidate 3: rank/string preparation costs were not isolated after removing the duplicate dropdown resolution; preserve existing search meanings and canonical region membership.
- Candidate 4: no high-frequency wheel trace or burst baseline; current preset wheel spacing cannot justify scheduler changes.
- Candidate 5: no isolated selection-outline replacement timing under a representative selection workload; defer the capital/language/geometry invalidation complexity.

The handout permits selecting candidates by evidence. These deferrals complete this bounded implementation; they do not claim the remaining candidates are ineffective.

## Candidate 2 follow-up: unchanged base-color reuse

Baseline source `f4bef75`; implementation `af95e06`. Selected from candidates 2–5 by estimated benefit: repeated whole-map SVG grouping/path joins can process much more data than the bounded dropdown or a small selected outline. This is not a measured ranking of all remaining candidates.

The renderer keeps one ordered visible-input snapshot and normalized copy contexts. It still resolves visibility and colors in O(region count), including colors returned by a stable callback; it avoids descriptor creation, geometry joins, SVG construction and replacement when inputs match. Snapshot strings reference existing paths rather than serializing geometry into a cache key. Source ordering and multiplicity are preserved. Geometry render/reset/destroy invalidate; the runtime resets on scenario changes.

### Direct browser evidence

Same Chromium 149.0.7827.55, viewport 1440×900, checked-in default scenario, debug enabled, no CPU throttle. Build/verify preceded both captures. One all-visible input warm-up, then five repeated all-visible inputs, one Ontario input, five repeated Ontario inputs, restore all visible, then language toggle. After timing capture ran after the full e2e suite, not concurrently. Host CPU is not isolated; before/after captures occurred at different times.

| Workload, both wrap modes | Before layer replacements | After layer replacements | After calls / rebuilds / skips |
| --- | ---: | ---: | --- |
| Unchanged all-visible input, each of 5 repeats | 1 | 0 | 1 / 0 / 1 |
| Unchanged Ontario input, each of 5 repeats | 1 | 0 | 1 / 0 / 1 |
| Language refresh, unchanged all-visible membership | 1 | 0 | 1 / 0 / 1 |
| Change all-visible to Ontario | 1 | 1 | 1 / 1 / 0 |

All unchanged-input samples preserved DOM identity. Group counts and total path-string lengths matched baseline. Full-map path strings total 1,071,329 characters without wrap and 3,213,987 with wrap; Ontario totals 3,103 / 9,309. Unit tests additionally confirm no fragment allocation on a skip, including empty visibility. Before instrumentation had only invocation counts; baseline actual rebuilds are established from DOM mutation/identity and the unconditional source path, not retroactively fabricated counters.

### Synchronous input timing (milliseconds)

| Workload | Before median (min–max) | After median (min–max) |
| --- | ---: | ---: |
| All visible, wrap off | 2.4 (2.2–3.8) | 0.9 (0.6–1.7) |
| Ontario, wrap off | 1.0 (0.7–3.9) | 0.9 (0.9–1.2) |
| All visible, wrap on | 7.5 (6.6–13.1) | 1.4 (1.3–1.5) |
| Ontario, wrap on | 1.9 (1.4–2.0) | 1.9 (1.5–3.0) |

The repeated full-visible workload improved in this sample; the already-small filtered workload changed little. These five-sample synchronous dispatch timings include other input work and debug overhead. They are not paint/composite latency, FPS, or a general typing speed guarantee. Single language-refresh dispatch times were unchanged or higher despite skipping the base layer (off 15.2→15.2 ms, on 12.2→27.2 ms); they include other refresh work and are not sufficient to attribute a language-refresh speed change. The deterministic reduction in SVG work is the primary result.

Reproduce against separately built and served before/after versions:

```sh
rtk proxy node tools/measure_base_color_updates.mjs /tmp/base-color-before.json http://127.0.0.1:4178
rtk proxy node tools/measure_base_color_updates.mjs /tmp/base-color-after.json http://127.0.0.1:4178
```

Authoritative raw records remain untracked at `.chatgpt/tool-tests/performance-refactor/base-colors-before.json` and `base-colors-after.json`. The initial trial query Canada matched no map regions and was replaced with Ontario before the recorded baseline. One after attempt could not connect because the local server had stopped across the resumed turn; restarting the server produced the successful capture above.

### Validation and limits

- WSL rebuild and verify: 70 JavaScript + 53 Python tests passed.
- Full JavaScript/Python/shell lint passed.
- Full Playwright suite: 76/76 passed; the new base-color invalidation test also passed independently.
- Unit tests: normalized copies, hidden-set order, stable callback/mutable fill, same-ID changed path, mode, region order/multiplicity, copy offset/index/canonical flag, empty visibility, renderGeometry/reset/destroy.
- Browser tests: node identity, counters and exact canonical fill/hit membership through repeated filters, language, base mode, wrap, scenario 2070 and empty results.
- Rebuilt artifacts are limited to `docs/assets/render/map-scene-renderer.js` and `docs/assets/runtime/debug-runtime.js` for this follow-up.
- No manual human visual review or debug-off browser performance trace; no perceived-speed claim or deployment.

Candidates 3–5 remain outside this request, which asked to choose one remaining candidate. Candidate 2 is now implemented, not deferred.


## Candidate 3 — search computation (completed)

`tools/measure_search_computation.mjs OUTPUT.json` runs a synthetic Node workload, not game/browser latency: 363 regions, 121 nations, 6 queries × 4 limit combinations. Baseline source13b73ac was restored in a temporary source tree and selected with `PERF_SOURCE_ROOT`; the working source ran the identical tool. All 24 result signatures (including zero/negative limits) match. Local raw records: `search-computation-before.json` and `search-computation-after.json` in `.chatgpt/tool-tests/performance-refactor/`.

| Fixed-workload operation | Before | After |
| --- | ---: | ---: |
| Rank input evaluations for 121 matched nations | 240 | 121 |
| Region searchText reads with regionLimit0 | 363 | 0 |
| Localized map text callbacks over3 filters with fresh canonical arrays | 1,089 | 363 |

Map strings retain the original matching fields, independently of dropdown pretty names, and canonical subset/order. The WeakMap is discarded on context/catalog rebuild, clear and destroy. Catalog normalization moves work to catalog construction; ranks remain query specific and computed once per matching nation. Per-query sorting remains. Empty map queries do no string preparation.

The local query-matrix timing median was1.174→0.455ms (25 measured iterations after5 warmups; ranges0.782–3.154 and0.414–1.644ms). Getter instrumentation, synthetic data and unisolated CPU limit interpretation; these are not browser typing/paint/FPS measurements. No timing threshold tests. Source tests assert rank ordering, skipped categories, canonical subset/order, language/context/catalog/clear invalidation and dropdown/map semantic separation. Build/verify73JS+53Python, full lint and9 focused search/language/scenario browser tests passed. No human visual smoke check.


## Candidate 4 — shared wheel/pan frame (completed)

`tools/measure_wheel_updates.mjs OUTPUT.json [BASE_URL]` measures the built app with Chromium149.0.7827.55 at1440×900. Each fresh-page probe sends40 synchronous zoom-in wheel events with moving anchors, reaching the existing zoom clamp. Four cases cover wrap off/on and debug off/on. All cases preserved final viewBox `-1.713348185 -0.298490727 0.815710845 0.323611201`, while viewBox writes fell40→1 (after:0 before RAF,1 after). An independent bounded debug-off CDP `devtools.timeline` trace observed Layout40→1 and Paint2→2. The final tool trace observed UpdateLayoutTree3→3; an earlier exploratory baseline observed2. These counts are evidence of removed forced layout work in this synthetic burst, not measured FPS or real-device responsiveness.

The existing pan RAF queue now accepts wheel work and combines pan/wheel flags. Every wheel event still reads a fresh viewport rect and updates logical zoom using its own anchor and delta sign. Buttons/reset/apply consume the pending write; wrap flushes pending state before runtime wrap adjustments (possibly2 synchronous writes at that control boundary). Scenario reset flushes accumulated view state; destroy cancels without rendering. No rect cache or delta truncation added.

Validation: build/verify76JS+53Python, full lint,17 focused map-view/interaction unit tests,25 existing pan/wrap/lifecycle browser tests and5 new wheel tests passed. The new browser tests initially used the default viewport and failed the measured coordinate constants; explicitly matching1440×900 fixed quantized event-coordinate differences without changing expected values. New tests assert actual writes with debug off/on, final viewBox at clamp, and same-task scenario transition plus subsequent frames. Unit checks cover sequential moving-anchor zoom, changed viewport rect, merged pan/wheel scheduling, synchronous controls and destroy. No human visual check, real wheel/trackpad input study or paint-duration claim. Local files: `wheel-before.json`, `wheel-after.json` in the measurement directory.


## Candidate 5 — selection outline reuse (completed)

The authoritative baseline was rerun from built ffb1fdb after candidate4 with `tools/measure_selection_updates.mjs OUTPUT.json [BASE_URL]`; after uses the candidate5 working source. Chromium149.0.7827.55,1440×900, debug enabled; Amazonia selected, wrap off/on, one warmup plus5 equal-language refreshes each. The probe compares actual SVG path and label arrays as well as first-child identity. All before/after output signatures match, including language and wrap transitions. Local raw records: `selection-before.json`, `selection-after.json`.

| Selection work | Before | After |
| --- | ---: | ---: |
| Equal-language refresh: outline construction | 1 | 0 |
| Equal-language refresh: layer child mutations | 2 | 0 |
| Wrap transition: outline construction | 2 | 1 |
| Wrap transition: layer child mutations (including lifecycle clear) | 4 | 2 |
| Actual language change: outline construction | 1 | 1 |

All10 equal-language samples retained node identity and recorded0 rebuilds/1 skip. The changed-language samples rebuilt correct labels. Wrap transition still clears renderer lifecycle state and builds required copies, then skips the redundant second render. One snapshot per layer compares ordered effective region paths/names, resolved label coordinates/text and capital-dot visibility, and normalized world-copy values. It recomputes cheap callback outputs each attempt, then builds SVG from captured values only on change. Clear (even empty), reset and destroy invalidate. Geometry is never serialized into a key.

Selection counts are the evidence; the small synchronous refresh timing samples include all UI work, debug overhead and concurrent browser test load in the after run, and do not establish latency/paint/FPS improvement. Benefit is bounded by selected-region count. WSL build/verify78JS+53Python, full lint and17 focused pins/language/scenario/selection browser checks passed. Unit checks isolate mutable path/position/localization/capital inputs, order/multiplicity, copy values, independent layers, force, null labels and lifecycle invalidation. No human visual review.


## Final integration

All candidates1–5 are complete. Final source build/verify passed78JavaScript+53Python tests, full JS/Python/shell lint passed, and full Playwright passed82/82. Generated consistency and strict10-phase plan validation passed. PR #101 against develop includes all candidate commits and rebuilt9 browser modules. Per-candidate timing limitations above still apply; no real-device latency, FPS or human visual-review claim.
