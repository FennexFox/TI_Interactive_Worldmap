# Phase 04: Validation, docs, and cleanup

## Goal

- Finish #41 with full validation, plan outcomes, and a reviewable commit history.

## Scope

- Run full repository validation.
- Rebuild generated Pages output through the build script if source changes require it.
- Update phase outcomes and summarize residual risks.
- Commit completed phases in reviewable chunks.

## Non-goals

- Do not add unrelated renderer cleanup.
- Do not implement #35 automatic closure or #18 scenario support.

## Affected files

- `docs/plan/issue_41/**`
- Any source/test files changed in prior phases
- Generated `docs/**` output only if produced by `npm run build`

## Implementation steps

- Run targeted e2e tests after each implementation phase.
- Run `npm run build`.
- Run `npm run verify`.
- Run `npm run test:e2e`.
- Inspect `git status --short` and ensure generated output matches source changes.
- Update plan outcomes and commit.

## Acceptance criteria

- All global validation commands pass or any environment failure is documented with exact output.
- The plan records completed phase outcomes.
- The final changes are committed without staging unrelated work.

## Validation commands

- npm run build
- npm run verify
- npm run test:e2e

## Manual smoke tests

- Use `/?worldWrap=0&debugRenderStats=1` to pin several reachable capitals and inspect debug counters.
- Repeat in default wrapped mode and confirm projected candidate/pinned markers still appear in copied worlds.

## Rollback risks

- Build output can create large generated diffs; only source/generator changes should be reviewed directly.

## Progress

- Ran `npm run build`.
- Ran `npm run verify`.
- Ran targeted e2e checks for `tests/language.spec.js` and `tests/map-wrap.spec.js`.
- Ran the full e2e suite with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npm run test:e2e`.
- Restored an unrelated generated `docs/assets/data.generated.js` gzip-wrapper churn diff after build; only `docs/assets/app.js` remains as generated output from the source change.

## Decision log

- Generated files, if any, are reviewed only at a high level per repo instructions.
- The bundled Playwright Chromium failed locally because `libnspr4.so` is unavailable. The snap Chromium path is available and was used for passing e2e validation.

## Outcomes / Retrospective

- Completed. Build, verifier, targeted e2e, and full e2e validation pass with the local snap Chromium path.
