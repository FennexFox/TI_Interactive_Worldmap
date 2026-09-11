# Issue #103 frame measurements

Baseline browser source: `463e594`. Tooling is opt-in and adds no instrumentation to normal app use.

Command: `npm run measure:interaction-frames -- /tmp/issue103-baseline.json --repeats=3` against docs served on port 4178.

Environment: Chromium 149.0.7827.55, headless, WSL, viewport 1440×1000, 2026, all claims, world wrap off, three zoom-in button clicks. Four pins: Beijing → SouthThailand → MalayPeninsula → Java; 112 envelope paths. A fresh page per interaction/repetition; selection order alternates per repetition. Drag: 60 actual mouse moves over 360 px with a 30 px sine arc. Wheel: 36 actual wheel events, alternating six-event blocks of ±100, same pointer anchor, no explicit sleep. Setup clicks Beijing's hit layer and the three reachable-candidate rows.

Two priming RAFs are excluded. Observation covers the input action and two trailing RAFs. `postUpdate` includes the first two intervals following a changed viewBox, deduplicating overlapping windows; this covers callback ordering in the update frame and the subsequent paint opportunity. Intervals use performance.now inside callbacks. These are scheduling/paint-pressure proxies, not direct paint duration or guaranteed display FPS. Percentiles interpolate pooled raw samples, not per-run percentiles. Each stop disconnects the MutationObserver and cancels RAF, including errors.

## Baseline

| Scenario | Window | N | Mean | Median | P95 | Max | >33.34 ms | >50 ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| single:none:drag60 | fullInput | 189 | 16.67 | 16.7 | 17 | 19.1 | 0 (0.00%) | 0 (0.00%) |
| single:none:drag60 | postUpdate | 183 | 16.625 | 16.7 | 16.9 | 17.4 | 0 (0.00%) | 0 (0.00%) |
| single:none:wheel36 | fullInput | 339 | 16.665 | 16.9 | 24.11 | 25.3 | 0 (0.00%) | 0 (0.00%) |
| single:none:wheel36 | postUpdate | 216 | 16.521 | 16.6 | 24.6 | 25.3 | 0 (0.00%) | 0 (0.00%) |
| single:selected:drag60 | fullInput | 277 | 18.129 | 16.6 | 35.28 | 83.6 | 24 (8.66%) | 5 (1.81%) |
| single:selected:drag60 | postUpdate | 249 | 17.858 | 16.6 | 35.08 | 54.1 | 22 (8.84%) | 3 (1.20%) |
| single:selected:wheel36 | fullInput | 620 | 17.987 | 16.7 | 33.01 | 75.9 | 30 (4.84%) | 8 (1.29%) |
| single:selected:wheel36 | postUpdate | 216 | 16.411 | 16.5 | 26.6 | 72.2 | 4 (1.85%) | 3 (1.39%) |

All twelve runs: manualEnvelopeModelBuilds=0 and manualEnvelopeRebuilds=0. Drag had 60 viewBox writes; wheel had 36. This run reproduces long frames but does not reproduce the issue's >100 ms wheel spike (full maximum 75.9 ms). The original issue's timings are historical evidence, not interchangeable with this input protocol.

## Candidate and final results

Pending rendering phase. No performance improvement claimed from baseline instrumentation.
