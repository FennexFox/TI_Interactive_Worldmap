# AGENTS.md

## Source And Navigation

- Work in `src/**` for browser code, `tools/**` for extraction/build/verification, `data/manual/**` for maintained inputs, and `tests/**` for coverage. Deployment files are generated from these sources.
- Use focused searches and small source slices. When Serena is available, prefer symbol and reference queries for large runtime and rendering modules.
- Use Graphify when it helps locate ownership or cross-module relationships. For unfamiliar or broad changes, start with `graphify-out/GRAPH_REPORT.md` if available. Simple, obvious edits do not need graph exploration.
- Treat Graphify as navigation, not source of truth: verify inferred relationships in source. Do not regenerate the graph unless the task needs a refresh.

## Generated Artifacts

Generated data and deployment output are not hand-maintained sources:

- `data/generated/**`
- `docs/index.html`, `docs/assets/**`, `docs/data/**`
- `graphify-out/**`

Do not hand-edit these paths, load whole generated files, or review generated diffs line by line. Inspect the corresponding source or generator and rebuild. Summarize intentional artifact changes at a high level.

Targeted verification of counts, keys, checksums, syntax, and output consistency is allowed. When debugging a generator or verifier, inspect only the smallest necessary output slice. Reading the Graphify report for navigation is also allowed.

Exclude dependencies, caches, and test output from ordinary source review (`node_modules/**`, `__pycache__/**`, `.pytest_cache/**`, `playwright-report/**`, `test-results/**`). Inspect relevant logs only when needed to diagnose failures.

## Browser Module Boundaries

The browser uses native ES modules:

- `src/state/app-state.js`: app interaction state and transitions.
- `src/state/map-visual-state.js`: applied map classes and visibility.
- `src/data/active-data.js`: active scenario data resolution.
- `src/data/derived-indices.js`: indices derived from active data.
- `src/render/map-layers.js`: low-level SVG rendering with explicit dependencies.

Keep state, data, and rendering responsibilities separate. `src/app.js` bootstraps `src/runtime/app-runtime.js`; focused runtime modules compose the controllers. Render modules must not import `appState` directly; pass state-derived values through arguments or render context.

## Build And Validation

- Rebuild checked-in Pages output with `npm run build` after changes that affect it. On WSL, use `./scripts/build-wsl.sh` for the environment-aware build and verification workflow.
- Rebuild local-game catalogs on WSL with `./scripts/build-wsl.sh --from-game`. On Windows, use `python tools/rebuild_pages.py --templates-dir <confirmed-path>`. Rebuilds do not commit or push unless `--commit` or `--push` is supplied.
- Reuse existing region geometry by default. Add `--refresh-region-outlines` only when intentionally re-extracting the Unity `regionoutlines` asset.
- Use `TI_TEMPLATES_DIR` or a confirmed local path for required game templates. Ask for missing paths when necessary; do not invent replacement game data.
- After source, generator, or data changes, run `npm run verify` and applicable lint checks. Run `npm run test:e2e` for user-facing browser behavior. Rebuild affected output before checking consistency or testing the deployed app.
- For documentation-only changes, review the diff and run `git diff --check`; app builds and browser tests are unnecessary.
- Scale additional testing to the change. Repeat or broaden checks only for new changes, failures, or unresolved concerns. Report checks actually run and any validation gaps.
- Preserve unrelated workspace changes. Keep generated rebuilds scoped to the task and inspect unexpected changed paths before finishing.

## Multi-agent operating model

Use the root agent primarily as a coordinator for decomposition, cross-source
reasoning, conflict resolution, and final verification. Delegate bounded work
when doing so reduces expensive reasoning, parallelizes independent evidence
collection, or materially improves quality.

### Current preferred routing

When the runtime supports explicit child model and reasoning-effort selection:

- **GPT-6.1 Sol, low**: preferred root coordinator. Use for task decomposition,
  deciding what evidence is needed, assigning workers, integrating worker
  results, and final checks. Keep the root focused on orchestration and global
  state rather than routine implementation.
- **GPT-6 Luna, low**: repository search, symbol/usages lookup, extraction,
  inventory work, repetitive read-heavy inspection, and simple log/test-output
  classification.
- **GPT-6 Luna, medium**: bounded analysis that needs modest reasoning but has
  a clear question and narrow evidence set. Also suitable for very small,
  mechanically specified code changes where implementation judgment is minimal.
- **GPT-6 Luna, xhigh**: preferred default implementation worker. Use for
  ordinary implementation, refactoring, test writing, and debugging when the
  task is reasonably well specified and the relevant code surface is bounded.
  Prefer this over Luna max for routine software-engineering work.
- **GPT-6 Luna, max**: bounded reasoning escalation. Use when Luna xhigh has
  produced an incomplete result, several plausible implementations or failure
  causes must be explored and checked, or a difficult but still well-scoped task
  benefits from deeper search, verification, and revision. Do not use max by
  default merely because a task involves coding.
- **GPT-6.1 Sol, medium**: capability and context-integration escalation. Use
  when the relevant scope is broad, several subsystems must be integrated,
  abstraction or API choices have significant downstream effects, or Luna
  repeatedly misses relevant context or produces structurally weak solutions.
  Prefer Sol over simply increasing Luna effort when the likely limitation is
  model capability or context breadth rather than insufficient deliberation.
- **GPT-6.1 Sol, high**: difficult implementation and engineering escalation.
  Use for stubborn cross-cutting debugging, complex refactors or migrations,
  subtle stateful/concurrent behavior, or other bounded technical work where Sol
  medium is insufficient. Keep final cross-source synthesis and repository-level
  semantic decisions with the GPT-6.1 Sol coordinator.
- **GPT-6.1 Sol, medium**: root-level escalation for conflicting worker
  evidence, invalidated plans, parser/game-semantics disagreements, repeated
  failures that suggest the problem framing itself may be wrong, or
  architecture/simulation-semantics decisions requiring stronger global
  reasoning.
- **GPT-6.1 Sol, high**: exceptional root escalation only for unresolved,
  high-impact, structurally difficult problems where Sol medium has not been
  sufficient.

Model names are routing preferences, not repository invariants. If a requested
model or effort is unavailable, preserve the role separation and use the
cheapest available worker that can reliably perform the bounded task.

### Worker escalation policy

Do not treat the routing list as a mandatory ladder. Escalate according to the
kind of uncertainty or failure:

- If a task remains well scoped but Luna xhigh needs more search, comparison,
  verification, or self-correction, escalate to Luna max.
- If the likely limitation is broad repository context, subsystem integration,
  abstraction quality, or model capability, skip Luna max when appropriate and
  escalate directly to Sol medium.
- If a bounded implementation remains technically difficult after Sol medium,
  escalate the worker to Sol high before moving global synthesis away from the
  coordinator.
- If evidence conflicts, assumptions collapse, or the remaining question is
  fundamentally about mechanics, architecture, provenance, or simulation
  semantics, escalate the GPT-6.1 Sol root rather than merely increasing worker
  effort.
- After the difficult decision is resolved, return routine implementation,
  search, and verification to the cheapest worker that can perform them
  reliably.

### Delegation rules

- Prefer a fresh, bounded subagent with only the context required for its task
  over cloning the root's entire conversation into a cheaper worker.
- When the runtime permits overrides, explicitly request both the worker model
  and reasoning effort rather than assuming the desired budget will be inherited.
- Do not spawn a copy of the root model for deterministic work that Luna or Sol
  can reliably perform.
- Do not delegate tiny tasks when spawn/context overhead is likely to exceed the
  work itself.
- Parallelize independent searches or checks when it can save time, but avoid
  redundant agents investigating the same question without a reason.
- Give each worker a concrete question, bounded files/scope when known, and a
  requested output format. Workers should return evidence, not a broad strategic
  conclusion unless asked for one.
- Useful worker returns include file paths/lines or symbols inspected, observed
  values, commands/tests run, assumptions, uncertainties, and a concise finding.
- The coordinator owns synthesis. Verify important worker claims against source
  evidence before changing mechanics or presenting a final conclusion.
- If two workers disagree, do not vote. Identify the differing assumptions or
  evidence and resolve the conflict at the coordinator level; escalate reasoning
  effort if needed.

### Coordinator escalation triggers

Raise the root from GPT-6.1 Sol low to medium when one or more of these occurs:

1. Independent worker results materially conflict.
2. A core assumption in the original plan is disproved during execution.
3. Game-source evidence, save state, packaged catalogs, and parser behavior do
   not agree on the same mechanic.
4. Repeated competent worker attempts suggest that the remaining failure is in
   the problem framing, assumptions, or semantics rather than a localized patch.
5. A change would alter projection semantics, provenance, fail-closed behavior,
   catalog boundaries, or public result contracts.
6. The task requires a new architecture or state-transition model rather than a
   localized implementation decision.

Return to low effort for routine follow-up work after the difficult decision is
resolved. Do not keep high reasoning enabled merely because the task is long.

## Efficiency goal

Optimize for successful work per unit of reasoning and context, not for the
fewest agent calls in isolation. Keep expensive coordinator context focused on
requirements, evidence summaries, decisions, and unresolved conflicts; push
large deterministic scans and repetitive extraction to cheaper bounded workers.
Avoid re-reading or re-sending large save, catalog, or repository context when a
small evidence summary is sufficient.
