# Phase 05: Publishing CLI, tests, and documentation

## Goal

- Make Git publication explicit, reorganize browser coverage for maintainability, align documentation with the implemented contracts, rebuild derived outputs, and complete the final verification/audit.

## Scope

- Change rebuild CLI defaults and implement `--commit`/`--push` plus one-cycle deprecated aliases.
- Update package scripts and WSL workflow for non-publishing rebuilds versus explicit deploy.
- Add shared Playwright fixtures, split large specs by behavior, and keep browser-free tests in the unit command.
- Update README, architecture, Copilot, plan index, runtime/version/build/staging/test documentation.
- Rebuild Pages, refresh Graphify incrementally, cross-check source, run repeated/full validation, and record final audit.

## Non-goals

- No change to remote branch policy, UI design, generated schemas, or Unity geometry without external assets.
- No actual push is performed during automated/local validation.

## Affected files

- `tools/rebuild_pages.py`
- `scripts/build-wsl.sh`
- `package.json`, `package-lock.json`
- `playwright.config.js`
- `tests/fixtures/app.js`
- split Playwright specs under `tests/e2e/**`
- Python CLI tests
- `README.md`
- `dev-docs/README.md`
- `dev-docs/architecture.md`
- `dev-docs/plan/README.md`
- `.github/copilot-instructions.md`
- derived `docs/**`
- refreshed `graphify-out/**`

## Implementation steps

1. Change default rebuild to generate+verify only; add explicit commit/push semantics and compatibility warnings.
2. Make `--push` imply `--commit`, constrain staging to manifest-generated paths, and unit-test Git commands without touching a remote.
3. Make `rebuild:game` non-publishing and `deploy` explicitly pass `--push`.
4. Introduce shared app-ready/nation/region/animation-frame fixtures and split language/wrap suites into search, overlay, pins, rendering, pan, and debug specs.
5. Run unit tests separately from two-shard E2E in CI/local commands.
6. Align all durable documentation with actual module, manifest, generated-output, publishing, and version contracts.
7. Rebuild Pages, run Graphify incremental refresh, and verify graph leads against actual source.
8. Run full validation, three-repeat E2E, five-run performance comparison, manual smoke tests, phase gate, commit, and final audit.

## Acceptance criteria

- Plain `rebuild_pages.py` never stages, commits, or pushes.
- `--commit` commits only manifest-declared generated/deployment paths.
- `--push` implies commit and pushes only the selected/current branch.
- `--no-commit` and `--no-push` remain accepted with deprecation warnings for one transition cycle.
- No validation test performs a real commit or push.
- Shared fixtures replace duplicated readiness/selection/hover/click/frame helpers.
- E2E suites are behavior-focused, discoverable, and pass in two shards and three full repeats.
- README/architecture/Copilot/plan index match the implemented source/deployment/staging/test contracts.
- Pages and Graphify derived outputs are rebuilt from source, not hand-edited.
- Final audit includes deferred external-game geometry smoke, if applicable, and exact completion classification.

## Validation commands

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run check:generated`
- `npm run verify`
- `npm run test:e2e -- --shard=1/2`
- `npm run test:e2e -- --shard=2/2`
- `npm run test:e2e -- --repeat-each=3`
- `bash -n scripts/build-wsl.sh`
- `shellcheck scripts/build-wsl.sh` when installed
- `npm run measure:render-stats -- --repeats=5 --zoom-steps=0 --pan-steps=4 --summary-json --raw-json --out=.chatgpt/tool-tests/architecture-refactor-final`
- `graphify . --update`

## Manual smoke tests

- Run the rebuild CLI with no flags and inspect Git log/status/remotes for no publication action.
- Validate mocked/dry command plans for `--commit`, `--push`, current branch, and explicit branch.
- Exercise app ready, scenario, search, language, base mode, overlays, pins, reachable capitals, pan, zoom, and world wrap.
- Inspect final generated Pages site through the local Playwright server.

## Rollback risks

- CLI default reversal can surprise existing automation; retain aliases, warnings, docs, and explicit package scripts.
- Test splitting can accidentally duplicate or omit cases; compare test titles/counts before and after.
- Graphify refresh is derived and potentially large; review only source changes and use the refreshed report as navigation.

## Evidence

- Baseline: `deploy` currently invokes `python tools/rebuild_pages.py` without an explicit publish flag; Playwright has two very large suites and no shared project fixture.
- After: pending.
- Delta: pending.
- Interpretation: pending.
- Commit: pending.
- Commit blocker: none.

## Progress

- Not started.

## Decision log

- Do not execute a real push as part of implementation verification.
- Preserve deprecated negative flags only for one documented transition cycle.

## Outcomes / Retrospective

- Awaiting phase implementation and evidence.
