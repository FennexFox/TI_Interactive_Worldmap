# Add scenario-aware claim maps for 2022, 2026, and 2070 starts

## Issue Target And Scope Summary

- Issue target: #18
- Title: Add scenario-aware claim maps for 2022, 2026, and 2070 starts
- Source plan: None
- Work type: feature
- Scope: add first-class support for the Terra Invicta 2022, 2026, and 2070 start scenarios across generated data, static Pages packaging, active frontend data context, UI selection, verification, and E2E coverage. The app must continue to default to 2026.

## Plan Contract

- User-visible problem or feature outcome: the static world map loads the 2026 scenario by default, exposes a compact selector for 2022, 2026, and 2070, and updates ownership, claims, search, panels, overlays, incoming claims, and summaries from the active scenario only.
- Implementation scope: introduce a scenario bundle generated from the existing per-scenario builders, update verification and build scripts, update the frontend active-data lifecycle, reconcile scenario-sensitive state on switch, add selector UI and tests, rebuild checked-in Pages output.
- Non-goals: no save parsing, backend, modded scenario support, scenario diff dashboard, projection changes, broad renderer redesign, or unrelated module cleanup.
- Acceptance criteria that can fail: missing scenario bundle, default not 2026, unresolved claim targets/owners/projects, stale single-scenario frontend data reads, stale selection/hover/filter state after switching, selector missing or unusable, failing static build, failing verifier, failing E2E smoke paths.
- Validation commands: `npm run build`, `npm run verify`, `npm run test:e2e`; phase-local targeted commands may be run earlier when faster feedback is enough.
- Manual smoke tests: load default scenario, switch to 2022, switch to 2070, select/search nations and regions after each switch, verify overlays/panels/incoming claims reflect the active scenario, return to 2026.
- Files likely to change: `tools/build_pages.py`, `tools/rebuild_pages.py`, `tools/verify_generated_outputs.py`, possibly a new `tools/build_scenario_bundle.py`, `scripts/build-wsl.sh`, `README.md`, `src/data/active-data.js`, `src/state/app-state.js`, `src/app.js`, `src/index.html`, `src/styles.css`, `tests/**`, `data/generated/**`, and rebuilt `docs/**`.
- Files that must not change: external Terra Invicta files, manual aliases unless a verified normalization bug blocks #18, generated files by hand, and renderer internals beyond the state/data handoff needed for scenario switching.
- Generated artifact policy: edit source/generator/manual files only, then rebuild generated and Pages outputs with repository tools. Do not hand-edit `data/generated/**` or `docs/**`. Review generated changes by schema/count/hash/smoke checks, not line-by-line.
- Stop conditions: local Terra Invicta templates unavailable for scenario generation, scenario outputs contain unresolved regions that cannot be explained by existing aliases, 2070 exposes schema assumptions that require a separate data-model decision, or runtime switching requires broad renderer rewrites outside the issue scope.

## Strategy

- Use the issue-approved intermediate schema that duplicates complete `regionMap`, `claimMap`, and catalogs per scenario. This matches the existing lower-level builders, reduces migration risk, and keeps the 2026 public behavior compatible.
- Add a checked-in scenario bundle, expected shape:

```json
{
  "schemaVersion": 2,
  "defaultScenario": "2026",
  "scenarios": {
    "2022": {"label": "2022", "regionMap": {}, "claimMap": {}, "catalogs": {}, "summary": {}},
    "2026": {"label": "2026", "regionMap": {}, "claimMap": {}, "catalogs": {}, "summary": {}},
    "2070": {"label": "2070", "regionMap": {}, "claimMap": {}, "catalogs": {}, "summary": {}}
  }
}
```

- Keep legacy top-level generated files and top-level `regionMap`/`claimMap` entries in `data.generated.js` pointed at the default 2026 scenario so older code paths and reviewer comparisons remain straightforward while the app migrates to `scenarios`.
- Build all scenarios from the same raw geometry input and scenario-specific Terra Invicta templates; avoid stripping scenario prefixes before the target scenario is known.
- Treat frontend data as a replaceable runtime context: active data, derived indices, cache namespace, and render/search/panel inputs must update together through one `setActiveScenario` lifecycle.
- Keep phase commits reviewable: plan commit first, then data/tooling, runtime, UI/test/build.

## Phase Order

1. [Scenario generated data schema, builders, and verifier](01-data.md)
2. [Runtime active-scenario lifecycle and state reconciliation](02-runtime.md)
3. [Scenario selector UI, documentation, E2E, and Pages build](03-ui.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Earlier monolithic plans are input material only unless explicitly retained.

## Generated-file Policy

- `data/generated/**` and `docs/**` are build artifacts. They may change only through the updated build/rebuild commands. Verification may inspect targeted keys/counts/checksums, but implementation review should focus on `tools/**`, `src/**`, `tests/**`, `README.md`, and this plan.
- For WSL/local-game rebuilds, use the discovered Templates path or `TI_TEMPLATES_DIR`; do not invent replacement data. Do not refresh region outlines unless explicitly needed.

## Global Validation Expectations

- npm run build
- npm run verify
- npm run test:e2e

## Known Risks And Assumptions

- Local WSL templates are available at `/mnt/c/Program Files (x86)/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates`; `TI_TEMPLATES_DIR` is not set.
- Existing lower-level builders already support `--scenario-year`, so orchestration should be enough for Phase 1.
- Duplicating geometry increases generated payload size. Accept temporarily for correctness; measure or at least record packed size after rebuild.
- `2070` may include zero-region or consolidated nations that expose frontend assumptions around nation existence and selection preservation.
- `src/app.js` currently stores derived indices in constants, so Phase 2 must replace those with a controlled mutable runtime context without broad unrelated refactors.
- Cache keys already include scenario in several places, but stale data can still leak if the active derived indices are not rebuilt and render caches are not invalidated.

## Completion Classification Rules

- Complete: all acceptance criteria pass, generated scenario data is checked in, selector works, validation commands pass, and phase commits are present.
- Partially complete: one or two phases landed with passing validation but later phases remain unimplemented; issue #18 must stay open with a concrete update.
- Preparation / instrumentation only: plan, tests, or guardrails land without scenario data/runtime/UI behavior.
- Blocked: required Terra Invicta templates or trustworthy scenario source data are unavailable, or generation reveals data conflicts requiring user/project decision.
- Needs follow-up issue: shared-geometry deduplication, payload-size optimization, scenario comparison UI, or modded scenario support.

## Final Audit Checklist

- [ ] Final diff reviewed against issue body and user request.
- [ ] Final diff reviewed against this master plan.
- [ ] Phase acceptance criteria checked.
- [ ] Validation results recorded.
- [ ] Manual smoke test results recorded or explicitly deferred.
- [ ] Generated-file policy followed.
- [ ] Phase-sized commit flow audited.
- [ ] Commit blockers documented when phase-sized commits were skipped.
- [ ] Commit-flow classification assigned.
- [ ] Completion classification assigned honestly.

## Commit Audit Requirements

- Phase-sized commits required: yes, unless the user explicitly says not to commit.
- Plan / baseline phase commit expectation: commit before source implementation when the plan or baseline changed.
- Per-phase commit expectation: commit each implementation phase separately when staging is safe.
- Commit blocker policy: document blocker in the relevant phase plan and final report before proceeding without a phase commit.
- Generated artifact policy: include generated artifacts only when repository policy requires them.
- Commit-flow non-compliance outcome: report separately in Final Audit even if implementation works.
