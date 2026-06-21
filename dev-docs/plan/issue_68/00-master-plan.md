# Refactor runtime architecture for scalable map features

## Issue Target And Scope Summary

- Issue target: #68
- Title: Refactor runtime architecture for scalable map features
- Source plan: GitHub issue #68 and current `AGENTS.md` / `dev-docs/architecture.md`
- Work type: architecture refactor
- Scope: Reduce `src/app.js` from a broad runtime owner into a bootstrap/orchestration entrypoint by extracting data/model, UI/i18n, interaction, rendering refresh, and scheduling responsibilities into explicit ES modules while preserving current behavior.

## Plan Contract

- User-visible problem or feature outcome: Existing map behavior remains unchanged, but the browser runtime becomes easier to extend for recursive merge paths, multi-claim visualization, scenario switching, translation support, and savefile-derived overlays.
- Implementation scope: Extract pure claim/reachable-capital/manual-envelope helpers, app-localized UI helpers, panel/control wiring, map interaction helpers, visual refresh scheduling, and final bootstrap orchestration boundaries from `src/app.js`; add focused tests for pure model/state boundaries; update architecture documentation; rebuild checked-in Pages output only through `npm run build`.
- Non-goals: Do not introduce a frontend framework or backend; do not redesign UI; do not change generated data schemas unless a source-compatible boundary requires it; do not implement #49 route-aware projected-state logic, recursive merge paths, multi-claim visualization, or savefile parsing; do not pursue performance optimization beyond avoiding obvious new churn.
- Acceptance criteria that can fail: `src/app.js` is materially smaller and primarily bootstraps/orchestrates; extracted modules have explicit dependency injection and do not import `appState` from render code; pure model helpers have unit coverage; search/filter/panel/language/map interactions remain behaviorally equivalent; source changes are rebuilt to `docs/**`; validation commands pass.
- Validation commands: `npm run build`; `npm run verify`; `npm run test:e2e`; focused `node --check` on new/changed source modules as needed.
- Manual smoke tests: Initial map render; select country; select region; clear selection; use search/filter controls; toggle reachable capitals; hover capital overlay while a nation is selected; zoom/pan with world-wrap; switch language.
- Files likely to change: `src/app.js`; new `src/data/claim-model.js` or related model modules; new `src/ui/**`; new `src/interaction/**` and/or `src/render/render-scheduler.js`; `src/data/derived-indices.js`; `tests/**`; `dev-docs/architecture.md`; generated `docs/**` via build.
- Files that must not change: `data/generated/**`, `graphify-out/**`, `node_modules/**`, `playwright-report/**`, `test-results/**`, and raw `.chatgpt/tool-tests/**` output. `docs/**` may change only through `npm run build`.
- Generated artifact policy: Edit source under `src/**`, tests, or durable docs first. Use `npm run build` to regenerate checked-in Pages output after source changes. Do not review generated diffs line-by-line; validate them with `npm run verify`.
- Stop conditions: Stop and document if an extraction would require user-visible behavior redesign, generated data schema changes, or a high-risk feature implementation outside #68; stop if validation reveals a behavioral regression that cannot be isolated within the active phase.

## Strategy

- Keep each phase reviewable and behavior-preserving.
- Prefer pure module extraction before UI or interaction movement so later phases can depend on tested boundaries.
- Move DOM rendering/wiring only after model behavior has tests.
- Keep `src/app.js` as the dependency composition layer: it may pass state, DOM elements, render contexts, and callbacks into modules, but extracted render modules must not import app state.
- Rebuild and validate generated Pages output after source phases, not during plan-only phase.

## Phase Order

1. [Inventory and boundaries](01-inventory.md)
2. [Extract pure data and model helpers](02-model.md)
3. [Extract UI controls panels and i18n](03-ui.md)
4. [Extract map interaction and visual update flow](04-interaction.md)
5. [Normalize runtime refresh orchestration](05-refresh.md)
6. [Cleanup documentation and validation](06-cleanup.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.
- Phase 4 depends on completion and validation of phase 3.
- Phase 5 depends on completion and validation of phase 4.
- Phase 6 depends on completion and validation of phase 5.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Earlier monolithic plans are input material only unless explicitly retained.

## Generated-file Policy

- Do not hand-edit generated deployment artifacts.
- If `docs/**` changes, it must be because `npm run build` copied current source modules and generated data into the Pages bundle.
- Large generated output diffs are summarized at a high level only.

## Global Validation Expectations

- npm run build
- npm run verify
- npm run test:e2e
- Manual smoke tests listed in the plan contract when practical after final build.

## Known Risks And Assumptions

- `src/app.js` is currently about 4,990 lines and owns initialization, DOM references, i18n, aside persistence, scenario switching, state wrappers, search/dropdown, hover/selection, map view controls, overlay model building, reachable capital candidates, panel rendering, SVG layer updates, and event listeners.
- The existing module set already separates active data, derived indices, app state, map view state, map visual state, and low-level map layers; this refactor should extend those boundaries rather than replace them.
- The highest-risk regressions are hover/selection behavior, reachable capital pins, manual recursive envelope overlays, language refresh, world-wrap, and generated Pages synchronization.
- Some extracted modules may still accept many dependencies. That is preferable to hidden global imports during the transition.

## Completion Classification Rules

- Complete: All six phases pass their phase gates; source boundaries are extracted as planned; build, verify, e2e, and manual smoke evidence are recorded; generated output policy is followed.
- Partially complete: Some behavior-preserving extraction lands and validates, but one or more issue #68 responsibility groups remain in `app.js`.
- Preparation / instrumentation only: Only plans/tests or model-only groundwork land without materially reducing `app.js` responsibilities.
- Blocked: A repeated environment or external-data blocker prevents meaningful progress after documented attempts.
- Needs follow-up issue: The refactor completes enough to satisfy #68 but exposes a separate feature, schema, or performance task that should not be folded into this umbrella.

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
