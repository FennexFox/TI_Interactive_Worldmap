# Phase 02: CI, generated-output, and tooling safeguards

## Goal

- Make source/Pages drift, unstaged browser modules, invalid source JavaScript, nondeterministic Pages output, and missing CI gates fail automatically before large code movement.

## Scope

- Introduce one Python build manifest shared by Pages builder, verifier, and rebuild staging.
- Include all browser module directories, including `interaction`, `runtime`, and `ui`.
- Add structured source/deployment/generated diagnostics and syntax-check every `src/**/*.js`.
- Add reproducible build, correctness-focused lint, unit-test, reusable checks, PR/develop CI, and gated Pages deployment.
- Update Playwright to exactly `1.61.1`, configure CI retries/workers/artifacts, and add weekly Dependabot.

## Non-goals

- No browser workflow extraction, Python catalog algorithm refactor, formatter rollout, UI change, or publishing CLI change.
- No generated JSON schema or semantic data change.

## Affected files

- `tools/build_manifest.py`
- `tools/build_pages.py`
- `tools/verify_generated_outputs.py`
- `tools/rebuild_pages.py`
- `tests/test_build_manifest.py`
- `tests/test_build_pages.py`
- `tests/test_verify_generated_outputs.py`
- `package.json`, `package-lock.json`
- `playwright.config.js`
- `eslint.config.js`, `ruff.toml`
- `.github/workflows/checks.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/pages.yml`
- `.github/dependabot.yml`
- `README.md`
- derived `docs/**` from the reproducible build

## Implementation steps

1. Define static source→Pages and generated staging paths in one importable manifest.
2. Refactor Pages copy/staging and rebuild Git path selection to consume the manifest.
3. Make verifier return structured diagnostics for source/deployment parity, module extras/staleness, JavaScript syntax, standalone/bundle semantics, and sentinels.
4. Add regression tests for stale source, new/deleted modules, and staging coverage.
5. Add `lint`, `test:unit`, `check:generated`, and CI-friendly E2E scripts/configuration.
6. Add reusable checks, PR/develop entry workflow, and make Pages deployment depend on the same quality/E2E checks.
7. Add pinned runtime versions and weekly Dependabot.
8. Rebuild Pages, verify, record evidence, pass the phase gate, and commit.

## Acceptance criteria

- Adding/removing/changing any `src/**` deployment file without rebuilding causes verification failure.
- Manifest coverage includes every supported browser source module and generated staging output.
- All `src/**/*.js` files are syntax-checked without a manual filename list.
- Generated bundle objects are semantically equal to standalone outputs.
- `npm run build && npm run check:generated` proves a clean deterministic Pages rebuild.
- PR and develop CI use Node 24/Python 3.12 and share gates with Pages deployment.
- CI E2E uses two retries, bounded workers, two shards, and uploads traces/screenshots/reports on failure.
- ESLint/Ruff/ShellCheck flag correctness issues without requiring repository-wide formatting.

## Validation commands

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run check:generated`
- `npm run verify`
- `npm run test:e2e`
- `bash -n scripts/build-wsl.sh`
- `shellcheck scripts/build-wsl.sh` when installed

## Manual smoke tests

- Temporarily alter a copied `src` file and confirm source/deployment parity fails, then restore via rebuild.
- Temporarily add and remove a source module in a supported directory and confirm coverage diagnostics.
- Inspect workflow dependency graph to confirm deployment cannot bypass quality/E2E checks.

## Rollback risks

- A too-broad manifest can stage unrelated user files; all manifest paths must be explicit and tested.
- Reproducibility checks may expose pre-existing generated drift; distinguish intentional rebuild output from source defects.
- Ruff/ESLint version differences can destabilize CI; pin tool/runtime versions and use conservative rules.

## Evidence

- Baseline: current `verify` manually checks a fixed list of `docs/assets/**/*.js`, does not syntax-check `src/**`, and Pages workflow deploys without quality checks.
- After: pending.
- Delta: pending.
- Interpretation: pending.
- Commit: pending.
- Commit blocker: none.

## Progress

- Not started.

## Decision log

- Keep the manifest in Python because builder, verifier, and rebuild helper are Python entry points.
- Keep deployment outputs checked in, as required by repository policy.

## Outcomes / Retrospective

- Awaiting phase implementation and evidence.
