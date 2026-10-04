# Performance notes

Current source and tests are authoritative; these notes record workload-specific
observations, not performance guarantees or thresholds.

## Current baseline — 2026-10-04

The measurements below are a fresh baseline for commit
`5419661c02bf1a63360b6c64a74665a4f66464e4`, captured after
`./scripts/build-wsl.sh --skip-install` completed its build and verification
workflow. The generated-output check passed; the workflow ran 88 JavaScript and
54 Python tests. The tracked `src`, `tools`, `data/manual`, and `data/generated`
inputs had composite SHA-256
`25c88ba1c38c45056af81bca0a6a49c4ce88e52279041033151290344e1fd8c5`.

Captures ran sequentially, without CPU throttling, in headless Chromium 149.0.7827.55
(Playwright 1.61.1) on WSL2 x86_64, kernel
`6.6.87.2-microsoft-standard-WSL2`, Intel Core i5-13600KF (20 logical CPUs),
Node 24.16.0 and Python 3.12.3. The browser had no real display; these results do
not represent display FPS. The repository pins Playwright 1.63.0, but this
capture used the existing installed Playwright 1.61.1 because the WSL build ran
with `--skip-install`; reproduce with the same tool version before comparing
measurements. Search, base-color, selection, and wheel probes used 1440×900; the
frame-interval run used 1440×1000 and the render-statistics matrix used
1400×950. The raw JSON and summaries are retained locally, outside version
control, in
`.chatgpt/tool-tests/benchmark-2026-10-04/`; its `metadata.json` records commands
and environment details.

To reproduce, build and verify first, then start the static server in its own
terminal. Run each `-NN.json` probe command five times sequentially, replacing
`NN` with `01` through `05`; the interaction-frame and render-statistics tools
contain their own five repeats.

```sh
rtk proxy ./scripts/build-wsl.sh --skip-install
rtk npm run check:generated
```

```sh
rtk python -m http.server 4178 --directory docs
```

```sh
rtk mkdir -p .chatgpt/tool-tests/benchmark-2026-10-04
rtk node tools/measure_interaction_frames.mjs .chatgpt/tool-tests/benchmark-2026-10-04/interaction-frames.json http://127.0.0.1:4178 --repeats=5 --wrap=both
rtk node tools/measure_search_updates.mjs .chatgpt/tool-tests/benchmark-2026-10-04/search-updates-NN.json http://127.0.0.1:4178
rtk node tools/measure_search_computation.mjs .chatgpt/tool-tests/benchmark-2026-10-04/search-computation-NN.json
rtk node tools/measure_base_color_updates.mjs .chatgpt/tool-tests/benchmark-2026-10-04/base-color-updates-NN.json http://127.0.0.1:4178
rtk node tools/measure_selection_updates.mjs .chatgpt/tool-tests/benchmark-2026-10-04/selection-updates-NN.json http://127.0.0.1:4178
rtk node tools/measure_wheel_updates.mjs .chatgpt/tool-tests/benchmark-2026-10-04/wheel-updates-NN.json http://127.0.0.1:4178
rtk node tools/measure_debug_render_stats.mjs --base-url=http://127.0.0.1:4178 --repeats=5 --raw-json --summary-json --out=.chatgpt/tool-tests/benchmark-2026-10-04/render-stats
```

### Interaction frame intervals

`tools/measure_interaction_frames.mjs` captured 40 action samples: five repeats
for each combination of world-wrap off/on, selected/unselected, and 60-move drag
or 36-event wheel burst. The workload used scenario 2026, all claims, three zoom
buttons, and three trailing animation frames. The table gives pooled P95 and the
range of the five repeat-level P95 values for each window; `n` is the pooled
interval count. Tail counts use the tool's 33.34 ms and 50 ms cutoffs.

| Wrap | Selection | Input | Full-input P95 (repeat range), n | Post-update P95 (repeat range), n | >33.34 ms full/post | >50 ms full/post | Max full/post (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Off | None | Drag | 17.00 (16.885–17.085), 320 | 16.90 (16.800–17.000), 305 | 0 / 0 | 0 / 0 | 26.5 / 17.3 |
| Off | None | Wheel | 17.20 (16.900–17.950), 558 | 17.20 (16.800–18.450), 360 | 0 / 0 | 0 / 0 | 30.1 / 30.1 |
| Off | Selected | Drag | 19.59 (16.900–22.200), 323 | 19.60 (16.900–22.320), 308 | 0 / 0 | 0 / 0 | 23.1 / 23.1 |
| Off | Selected | Wheel | 32.83 (30.600–35.005), 575 | 33.71 (31.535–35.705), 360 | 23 / 23 | 0 / 0 | 39.1 / 39.1 |
| On | None | Drag | 17.00 (16.800–17.155), 321 | 16.80 (16.800–16.900), 305 | 0 / 0 | 0 / 0 | 20.6 / 20.6 |
| On | None | Wheel | 19.50 (18.600–20.305), 570 | 19.91 (18.745–21.005), 360 | 0 / 0 | 0 / 0 | 24.0 / 24.0 |
| On | Selected | Drag | 20.30 (19.885–20.625), 321 | 20.10 (19.700–20.700), 306 | 0 / 0 | 0 / 0 | 23.8 / 23.8 |
| On | Selected | Wheel | 28.40 (27.340–29.010), 570 | 28.905 (28.335–29.445), 360 | 3 / 3 | 0 / 0 | 35.9 / 35.9 |

These values are `performance.now()` intervals observed in animation-frame
callbacks. They are scheduling/render-pressure proxies, not paint durations or
display FPS. Compare only captures with the same tool protocol and workload.

### Bounded renderer and update probes

Each standalone update probe ran as five independent, sequential captures. The
search-computation tool uses a deterministic synthetic fixture; browser probes
use deliberately bounded, mostly synthetic DOM events. Synchronous dispatch
times do not include browser paint.

| Probe | Workload and observed result |
| --- | --- |
| Search updates | 25 measured query samples after warm-up. Programmatic `input` events replaced dropdown children once per query (0.4–1.0 ms synchronous dispatch); generated ArrowDown events replaced none and retained option identity (0–0.1 ms). |
| Search computation | Synthetic fixture of 363 regions and 121 nations; six queries × four limit settings, five warm-ups and 25 measured iterations per run. Semantic outputs matched across all five runs; each run read 121 rank inputs and zero region text values. Per-run median was 0.250–0.264 ms; observed measured range across runs was 0.239–0.855 ms. |
| Base-color updates | Across wrap off/on, 50 repeated all-visible cases and 50 repeated Ontario-filter cases preserved children with zero rebuilds and one skip; ten language-refresh cases did the same. Ten Ontario filter changes caused one child-list mutation and one rebuild each. |
| Selection updates | Fifty repeated same-language cases preserved children with zero rebuilds and one skip. Ten language changes rebuilt once with one child-list mutation; ten wrap transitions rebuilt once, skipped once, and recorded two child-list mutations including lifecycle clearing. |
| Wheel writes | Twenty cases (five runs × wrap off/on × debug off/on), each dispatching 40 synthetic `WheelEvent`s synchronously. Every burst performed zero `viewBox` writes before the next frame and one write total; debug instrumentation counted one application. Five separate debug-off traces each showed one Layout, two or three UpdateLayoutTree events, and two Paint events. |

The render-statistics default matrix used a 1400×950 viewport and captured one
scenario date (2026), not all
five scenario dates: five repeats × zoom steps 0, 3, and 6 × twelve presets
(wrap off/on crossed with initial-labels, initial-labels-disabled, labels,
labels-disabled, complex-overlays-labels, and
complex-overlays-labels-disabled), for 180 captures. All setup and hover probes
reported success. Across those captures, the visible SVG node count ranged
805–3,695 and measured pan JavaScript averages ranged 0.229–0.525 ms (per-capture
maxima 1.6–6.7 ms). Full-input pan RAF P95s ranged 16.8–37.52 ms across captures
(7,096 intervals; maximum 44.1 ms, 116 over 33.34 ms, none over 50 ms); zoom RAF
P95s ranged 16.97–49.36 ms (3,439 intervals; maximum 55 ms, 25 over 33.34 ms,
one over 50 ms). Setup configuration and per-capture details remain in the raw
local summary; these ranges describe this headless matrix only.

### Source invariants

- Search keyboard navigation reuses existing dropdown option nodes for an
  unchanged query. The browser regression test checks that ArrowUp/ArrowDown do
  not replace them: `tests/e2e/search.spec.js`.
- The scene renderer skips rebuilding the base-color layer when its effective
  visible regions, colors, mode, and world-copy inputs are unchanged. Tests cover
  invalidation after filters, mode, scenario, and world-wrap changes:
  `tests/e2e/rendering.spec.js`.
- Selection outlines reuse their SVG children when geometry, labels, markers,
  and copies are unchanged; language, scenario, and copy changes trigger the
  needed rebuilds: `tests/e2e/selection-reuse.spec.js`.
- Wheel events each update logical zoom using the event's anchor, while a burst's
  SVG `viewBox` write is queued through the shared animation-frame scheduler. The
  browser test sends 40 events at a fixed 1440×900 viewport, verifies one write
  and the expected final viewBox, and covers scenario reset ordering:
  `tests/e2e/wheel.spec.js`. This proves write batching and behavior for that
  synthetic case, not real-device responsiveness.

## Historical frame-measurement limit

The Issue #103 experiment used a pre-review two-trailing-RAF protocol. In its
selected-map 36-event wheel case, full-input P95 was effectively unchanged
(33.010 ms before, 33.005 ms after), while the maximum and samples over 50 ms
fell (75.9 to 36.7 ms; 8/620 to 0/340). Post-update P95 increased from 26.600 to
33.725 ms. PR #104 later extended the observation window to three trailing RAFs
and adjusted marker contrast; its workload and protocol are not a comparable
before/after pair with the 2026-10-04 baseline above. Treat the older numbers as
historical evidence only.