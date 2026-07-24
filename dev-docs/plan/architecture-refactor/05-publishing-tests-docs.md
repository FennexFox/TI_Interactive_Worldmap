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
- After:
  - plain `rebuild_pages.py` leaves changes uncommitted; `--commit` and `--push`
    explicitly opt into manifest-scoped publication, and `--push` selects the
    explicit/current branch;
  - seven Python publishing tests cover the safe default, exact staging list,
    selected/current branches, push implication, and deprecated aliases without
    running a real Git write;
  - `npm run rebuild:game` is non-publishing and `npm run deploy` explicitly passes
    `--push`; WSL from-game rebuilds rely on the safe default;
  - duplicated Playwright helpers moved to `tests/fixtures/app.js`; the 1,303-line
    language and 1,063-line wrap suites were split into behavior specs no larger
    than 611 lines while preserving every test title;
  - browser-free coverage moved out of Playwright into the Node unit command:
    30 Node tests and 42 Python tests pass, while 73 browser E2E tests pass as
    shards 37/37 and 36/36 and as a three-repeat run 219/219;
  - `npm run lint`, `npm run build`, `npm run check:generated`, and
    `npm run verify` pass; `bash -n` passes and ShellCheck was unavailable locally;
  - Graphify's code-only incremental refresh completed with 999 nodes, 2,526 edges,
    and 54 communities. Its runtime leads were checked against real imports/symbols.
- Delta: publication changed from implicit Git writes to explicit opt-in; browser-free
  tests no longer start the Pages server; E2E organization now exposes language,
  search, debug, pins, overlays, rendering, pan, scenario, and world-wrap ownership.
- Interpretation: phase scope is complete with no UI, generated schema, external
  debug/scenario API, or runtime hot-path change.
- Commit: phase-scoped implementation commit follows this gate.
- Commit blocker: none.

## Progress

- Complete.

## Decision log

- Do not execute a real push as part of implementation verification.
- Preserve deprecated negative flags only for one documented transition cycle.
- Reuse the completed phase-3 five-run baseline/browser-after/recheck evidence for the
  final audit. The user approved skipping a redundant final measurement because this
  phase changes CLI, tests, docs, and Graphify output only; the briefly started run
  was cancelled without using partial results.
- Use Graphify's code-only `update --force` path because semantic document refresh
  requires an unavailable API key and the user explicitly prohibited subagents.
- Defer from-game/Unity geometry smoke because `TI_TEMPLATES_DIR`, region outlines,
  and ShellCheck are unavailable in this environment.

## Outcomes / Retrospective

- Safe publishing defaults are now enforced in code, package scripts, WSL workflow,
  tests, and durable documentation.
- Test ownership is clearer and faster: pure tests run under Node, browser tests are
  confined to `tests/e2e`, and CI/local shard behavior matches.
- Graphify's structural code graph is current; document semantics remain cached until
  a future run has an approved LLM backend.
