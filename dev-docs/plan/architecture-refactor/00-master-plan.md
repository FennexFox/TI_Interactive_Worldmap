# Repository-wide architecture refactor and update

## Issue Target And Scope Summary

- Issue target: `architecture-refactor`
- Title: Repository-wide architecture refactor and update
- Source plan: the user-provided integrated refactor plan in the implementation request
- Work type: architecture, generated-artifact safety, performance, build tooling, and publishing safety
- Scope: preserve the current UI, external browser APIs, and generated JSON schemas while making Pages builds reproducible, separating browser/runtime responsibilities, consolidating Python build contracts, and making publication opt-in.

## Plan Contract

- User-visible problem or feature outcome: existing map behavior and data remain stable, but scenario/language/base-mode refreshes stop doing avoidable duplicate work, source and Pages output cannot silently drift, and ordinary rebuilds cannot commit or push without an explicit flag.
- Implementation scope:
  - add a shared build manifest, composable output diagnostics, PR/develop checks, lint safety rules, unit-test separation, and reproducible Pages build checks;
  - split browser debug, cache, search, overlay descriptor, panel, scenario runtime, refresh-action, and claim-model responsibilities into explicit modules;
  - separate geometry, base-color, label, overlay/filter, and selection refresh paths so base-mode changes preserve persistent geometry nodes;
  - centralize Python scenario, strict-input, localization, manifest, and deterministic Pages-output contracts;
  - change `rebuild_pages.py` to non-publishing-by-default behavior with compatibility aliases;
  - split large Playwright suites, add shared fixtures, update contributor documentation, and refresh Graphify at the end.
- Non-goals:
  - no UI redesign, TypeScript migration, automatic formatter rollout, generated JSON schema change, claim facade break, or replacement game data;
  - no manual edits to `data/generated/**`, `docs/**`, or `graphify-out/**`;
  - no geometry re-extraction without a real Terra Invicta asset and an explicit refresh request;
  - no claim of performance improvement without a five-run median comparison.
- Acceptance criteria that can fail:
  - source-only drift, missing/new/stale browser modules, invalid `src/**/*.js`, or mismatched generated bundle/standalone data must fail verification;
  - `npm run build` followed by the reproducibility check must leave no tracked diff;
  - scenario switches build runtime indices and execute named refresh actions once per switch;
  - base-mode changes preserve region, hit, and label node identity;
  - repeated `2022 → 2026 → 2070 → 2022` switches leave no stale nation/search/claim data;
  - Korean/English names, tags, aliases, and project aliases remain searchable;
  - hostile/direct/gated/capital claims and world-wrap overlays remain correct;
  - malformed required/manual/template input reports the file plus JSON path or row index;
  - default rebuild performs no Git write, while `--push` explicitly commits and publishes generated paths;
  - all listed automated gates pass, with external-game extraction explicitly deferred when unavailable.
- Validation commands:
  - `npm run lint`
  - `npm run test:unit`
  - `npm run build`
  - `npm run check:generated`
  - `npm run verify`
  - `npm run test:e2e`
  - `npm run test:e2e -- --repeat-each=3`
  - `python -m unittest discover -s tests -p "test_*.py"`
  - `bash -n scripts/build-wsl.sh`
  - `shellcheck scripts/build-wsl.sh` when ShellCheck is installed
- Manual smoke tests:
  - switch 2022, 2026, and 2070 repeatedly, then inspect scenario-specific nations and claims;
  - change base mode and compare persistent SVG region/hit/label element identity;
  - search Korean/English nation names, nation tags, aliases, and project aliases;
  - toggle language and world wrap; inspect direct, hostile, gated, capital, pinned, manual-envelope, and reachable-capital overlays;
  - run `rebuild_pages.py` without publish flags and confirm Git history/remotes are untouched.
- Files likely to change: `.github/**`, `package*.json`, `playwright.config.js`, lint configs, `src/**`, `tools/**`, `tests/**`, `scripts/**`, `README.md`, `dev-docs/**`, `requirements*.txt`, derived `docs/**`, and refreshed `graphify-out/**`.
- Files that must not change by hand: `data/generated/**`, `docs/**`, `graphify-out/**`, `node_modules/**`, caches, Playwright reports, and Terra Invicta external assets.
- Generated artifact policy: edit source/generators only; use `npm run build` to regenerate Pages output; inspect generated output only through targeted verification; summarize generated changes at a high level.
- Stop conditions:
  - a phase gate fails and cannot be corrected within that phase;
  - an unrelated dirty worktree prevents safe phase-scoped staging;
  - generated schema or game semantics would need to change;
  - required external Terra Invicta assets are unavailable for a non-deferrable step;
  - five-run medians regress by at least 10% or persistent SVG replacement counts increase.

### Performance Contract

- Target interactions: `2026 ↔ 2070` scenario switches, base-mode change, nation/region search input, language switch, and world-wrap toggle.
- Reproduction scenario: Chromium at 1400×950 using checked-in Pages data; select China and `Project_GreaterPanAsia`, exercise wrap off/on and label/debug variants, then run scenario/search/language/base-mode identity probes.
- Baseline metrics: debug render timings/counters, label/base/overlay DOM replacements, SVG node counts, refresh-action/index-build counts, and node-identity probes.
- Measurement method: five repeats per bounded interaction, compare medians, retain raw/summary evidence under ignored `.chatgpt/tool-tests/architecture-refactor-*`, and record concise results in phase docs.
- Before/after comparison method: use the same Chromium executable, viewport, data revision, interaction sequence, and repeat count for baseline and final runs.
- Non-success outcome: structural changes without measured improvement are classified as preparatory refactoring; a ≥10% hot-path median regression or increased DOM replacement/node counts blocks completion.

## Strategy

1. Freeze the plan and baseline before source changes.
2. Establish build/CI/verifier safety so every later module extraction is checked against source and Pages output.
3. Refactor the browser composition root in behavior-preserving slices, adding unit and E2E regression guards before removing duplicated refresh work.
4. Consolidate Python contracts and deterministic Pages-output boundaries without changing schemas.
5. Make publishing explicit, reorganize tests/documentation, rebuild derived artifacts, refresh Graphify, and run the final audit.

## Phase Order

1. [Plan and performance baseline](01-baseline.md)
2. [CI, generated-output, and tooling safeguards](02-safeguards.md)
3. [Browser runtime restructuring](03-browser-runtime.md)
4. [Python data and build pipeline restructuring](04-python-pipeline.md)
5. [Publishing CLI, tests, and documentation](05-publishing-tests-docs.md)

## Phase Dependencies

- Phase 1 has no source dependency and must be committed before source implementation.
- Phase 2 depends on the baseline and becomes the safety gate for later source movement.
- Phase 3 depends on manifest/verifier coverage for every new browser module.
- Phase 4 depends on the verifier/build boundary from phase 2 and preserves phase 3 browser contracts.
- Phase 5 depends on all code phases and owns final derived-output rebuild, Graphify refresh, and full-suite repetition.

## Source Of Truth Decisions

- This `00-master-plan.md` and its phase files are the only active implementation plan.
- The former `README.md` proposal in this directory is superseded and is retained only as a pointer.
- `src/**`, `tools/**`, manual data, tests, and durable architecture docs remain implementation sources of truth.
- Graphify output is a navigation aid; all inferred edges must be verified in real source before edits.

## Generated-file Policy

- Never hand-edit or line-review generated/derived outputs.
- `src/**` is copied to `docs/assets/**`; generated data is assembled by `tools/**`.
- `npm run build` is the only ordinary Pages regeneration path.
- `data/generated/**` is an input to Pages builds and must not be rewritten by `build_pages.py`.
- Derived `docs/**` and final refreshed `graphify-out/**` are committed only in the phase that intentionally regenerates them.

## Global Validation Expectations

- Node 24 and Python 3.12 are the documented CI baseline.
- ESLint, Ruff, and ShellCheck use correctness-focused rules without a formatting rollout.
- Browser-free JavaScript tests run separately from Playwright.
- E2E runs with bounded CI workers/retries and two shards in CI.
- Final local verification runs the full E2E suite three times and compares five-run performance medians.

## Known Risks And Assumptions

- `src/app.js` contains nested workflow functions inside the data promise callback, so mechanical extraction can expose closure dependencies.
- Overlay, hover, pin, world-wrap, and scenario refresh ordering is performance-sensitive and strongly coupled.
- Current generated data and UI behavior are authoritative; refactoring must adapt to them rather than normalize them.
- The worktree was clean at intake and `refactor_and_update` matched `origin/develop`.
- Unity geometry extraction may be deferred if `TI_TEMPLATES_DIR` and the `regionoutlines` asset are unavailable.
- Phase-sized commits are required; unrelated changes discovered later will be excluded.

## Completion Classification Rules

- Complete: all planned behavior, safety, publishing, test, and documentation outcomes are implemented; all phase/final gates pass; no blocking performance regression exists.
- Partially complete: useful user-visible or safety outcomes landed, but planned scope or a mandatory validation remains.
- Preparation / instrumentation only: changes improve measurement or structure without completing the requested outcomes.
- Blocked: an unavoidable external/safety blocker prevents further implementation.
- Needs follow-up issue: the integrated refactor is valid and complete for its accepted boundary, but a separately scoped follow-up remains.

## Final Audit Checklist

- [x] Final diff reviewed against the user request and this plan.
- [x] Every phase acceptance criterion and validation result is recorded.
- [x] Manual smoke tests are recorded or explicitly deferred.
- [x] Generated-file policy is followed.
- [x] External browser and data schemas remain compatible.
- [x] Five-run before/after evidence is compared honestly.
- [x] Each phase has a reviewable commit with unrelated changes excluded.
- [x] Completion classification and remaining risks are explicit.

## Final Audit Result

- Classification: complete.
- Reviewable commits exist for plan/baseline, safeguards, browser runtime, Python
  pipeline, and publishing/tests/docs.
- All lint, build reproducibility, unit, verifier, two-shard E2E, and 219-test
  three-repeat E2E gates pass.
- The browser phase's five-repeat baseline/browser-after/recheck evidence remains the
  applicable performance result because the final phase does not change runtime source;
  the user approved skipping a duplicate final measurement.
- Deferred environment-only checks: Terra Invicta from-game/Unity geometry smoke
  (`TI_TEMPLATES_DIR` and region outlines absent) and ShellCheck (binary absent).
  Graphify semantic extraction was completed after the user permitted the host-agent
  fallback.
- No product behavior, generated JSON schema, or compatibility global was intentionally
  changed. Remaining risk is limited to deprecated publishing aliases being removed
  after their documented one-cycle transition.

## Commit Audit Requirements

- Phase-sized commits required: yes.
- Plan/baseline commit expectation: before source implementation.
- Per-phase commit expectation: commit acceptance evidence with the implementation it validates.
- Commit blocker policy: document the blocker and stop before entering the next phase.
- Generated artifact policy: include only intentionally rebuilt, policy-required outputs.
- Commit-flow non-compliance outcome: report separately even if code otherwise works.
