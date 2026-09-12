# Issue #103 frame measurements

These tables record the pre-review implementation and its two-trailing-RAF measurement window. PR #104 review fixes extend that window to three trailing RAFs to capture both post-update intervals when the collector runs before the final map update. The marker shadow also gains an outer stroke for contrast. The historical timings below have not been rerun for those changes and do not establish their performance.

Baseline browser source: `463e594`. Tooling is opt-in and adds no instrumentation to normal app use.

Command: `npm run measure:interaction-frames -- /tmp/issue103-baseline.json --repeats=3` against docs served on port 4178.

Environment: Chromium 149.0.7827.55, headless, WSL, viewport 1440×1000, 2026, all claims, world wrap off, three zoom-in button clicks. Four pins: Beijing → SouthThailand → MalayPeninsula → Java; 112 envelope paths. A fresh page per interaction/repetition; selection order alternates per repetition. Drag: 60 actual mouse moves over 360 px with a 30 px sine arc. Wheel: 36 actual wheel events, alternating six-event blocks of ±100, same pointer anchor, no explicit sleep. Setup clicks Beijing's hit layer and the three reachable-candidate rows.

Two priming RAFs are excluded. Observation covers the input action and two trailing RAFs. `postUpdate` includes the first two intervals following a changed viewBox, deduplicating overlapping windows; the original two-trailing-RAF window could miss the second interval for the final update when the collector ran first. Intervals use performance.now inside callbacks. These are scheduling/paint-pressure proxies, not direct paint duration or guaranteed display FPS. Percentiles interpolate pooled raw samples, not per-run percentiles. Each stop disconnects the MutationObserver and cancels RAF, including errors.

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

All candidates were measured against unchanged deployment styles using diagnostic CSS, three repeats each. Dash-only changes normal/overlap rhythms to `4 3`/`1 3`; permanent additionally removes capital-star filters; transient applies the same filter change only inside the input observation. The transient prototype excludes post-input filter restoration cost, so this comparison favors it; no production timer was added.

| Candidate | Input | Window | N | Mean | Median | P95 | Max | >33.34 ms | >50 ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dash | drag60 | fullInput | 193 | 16.993 | 16.7 | 19.94 | 35.1 | 2 (1.04%) | 0 (0.00%) |
| dash | drag60 | postUpdate | 186 | 16.855 | 16.7 | 19.275 | 35.1 | 2 (1.08%) | 0 (0.00%) |
| dash | wheel36 | fullInput | 522 | 17.715 | 16.7 | 33.1 | 50.5 | 24 (4.60%) | 1 (0.19%) |
| dash | wheel36 | postUpdate | 216 | 15.632 | 16.5 | 28.05 | 50.5 | 3 (1.39%) | 1 (0.46%) |
| permanent | drag60 | fullInput | 189 | 17.174 | 16.7 | 19.7 | 45.9 | 2 (1.06%) | 0 (0.00%) |
| permanent | drag60 | postUpdate | 183 | 16.816 | 16.7 | 19.39 | 21.5 | 0 (0.00%) | 0 (0.00%) |
| permanent | wheel36 | fullInput | 348 | 18.347 | 17.1 | 34.1 | 55.2 | 26 (7.47%) | 2 (0.57%) |
| permanent | wheel36 | postUpdate | 216 | 19.208 | 17 | 34.5 | 41.1 | 24 (11.11%) | 0 (0.00%) |
| transient | drag60 | fullInput | 192 | 17.389 | 16.75 | 22.78 | 25.4 | 0 (0.00%) | 0 (0.00%) |
| transient | drag60 | postUpdate | 186 | 17.227 | 16.7 | 21.575 | 25.3 | 0 (0.00%) | 0 (0.00%) |
| transient | wheel36 | fullInput | 345 | 17.974 | 17.1 | 34.5 | 44.6 | 24 (6.96%) | 0 (0.00%) |
| transient | wheel36 | postUpdate | 216 | 19.622 | 18.05 | 35.6 | 44.6 | 24 (11.11%) | 0 (0.00%) |

Decision: retain the existing SVG shadow polygons and remove capital-star drop-shadow filters permanently. Review found that the same-points shadow fill alone did not preserve outer contrast; the follow-up adds a wider SVG shadow stroke. The transient candidate offered no consistent frame advantage and would add restoration/timer state. Keep long normal dashes and short overlap dashes, all existing widths/depth colors/hatching/fills. Candidate wheel P95 and >33.34 ms ratio do not improve: report this explicitly. Lower >50 ms tails and shorter complete wheel-input windows demonstrate a narrower benefit; changing idle-sample proportions makes overall means misleading.

## Final built site

Rebuilt with `./scripts/build-wsl.sh --skip-install`; repeated the exact baseline command with `/tmp/issue103-after.json`, no diagnostic CSS (`--variant=baseline` means use the site's own styles). Browser and input protocol unchanged; three repeats per condition.

| Scenario | Window | N | Mean | Median | P95 | Max | >33.34 ms | >50 ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| single:none:drag60 | fullInput | 189 | 16.666 | 16.7 | 17.06 | 18.2 | 0 (0.00%) | 0 (0.00%) |
| single:none:drag60 | postUpdate | 183 | 16.626 | 16.7 | 16.99 | 17.4 | 0 (0.00%) | 0 (0.00%) |
| single:none:wheel36 | fullInput | 333 | 16.666 | 16.7 | 17.9 | 21.2 | 0 (0.00%) | 0 (0.00%) |
| single:none:wheel36 | postUpdate | 216 | 16.357 | 16.5 | 17.725 | 21.2 | 0 (0.00%) | 0 (0.00%) |
| single:selected:drag60 | fullInput | 190 | 16.749 | 16.6 | 18.6 | 30.5 | 0 (0.00%) | 0 (0.00%) |
| single:selected:drag60 | postUpdate | 184 | 16.639 | 16.6 | 18.155 | 28.1 | 0 (0.00%) | 0 (0.00%) |
| single:selected:wheel36 | fullInput | 340 | 18.039 | 17.1 | 33.005 | 36.7 | 13 (3.82%) | 0 (0.00%) |
| single:selected:wheel36 | postUpdate | 216 | 18.98 | 17.75 | 33.725 | 36.7 | 13 (6.02%) | 0 (0.00%) |

All final runs still have zero envelope model builds/rebuilds. Selected-state full-window drag P95 decreased 35.28→18.60 ms and maximum 83.6→30.5 ms; >33.34 ms samples fell 24/277→0/190. Wheel maximum decreased 75.9→36.7 ms and >50 ms samples fell 8/620→0/340. Wheel full-window P95 was essentially unchanged (33.010→33.005 ms), while post-update P95 increased 26.600→33.725 ms and >33.34 ms post-update ratio increased 1.85%→6.02%. Do not claim a universal P95 or FPS improvement.

Selected complete observation durations per repeat (ms, include two trailing RAFs):

- baseline: drag60 [1699.8, 1605.4, 1716.5]; wheel36 [3569.2, 3782.9, 3799.9].
- after: drag60 [1049.9, 1049.9, 1082.5]; wheel36 [2085.9, 2064.4, 1983.0].

The wheel action completes faster with fewer idle RAF samples (620→340 total). The duration/tail improvements alongside unchanged model counters support reduced drawing pressure, while the post-update P95 caveat remains. No device-specific timing threshold was added to CI. The historical >100 ms wheel spike was not reproduced by this exact protocol in the baseline, so its elimination is not claimed.
