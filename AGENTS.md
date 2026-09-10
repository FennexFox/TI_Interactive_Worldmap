# AGENTS.md

## Subagent Policy

- Astra primarily orchestrates: preserve the overall context, decompose work, coordinate agents, and own integration and final correctness.
- Prefer delegating substantial, bounded work. Handle small, tightly coupled, or context-dependent tasks directly when delegation adds more overhead than value. Optimize total usage and completion time, not agent count.
- Explicitly use `gpt-5.6-luna` by default; never inherit the parent model or use Astra for subagents. Escalate to `gpt-5.6-terra` or `gpt-5.6-sol` as complexity, risk, or results warrant, without user confirmation or mandatory failed attempts. Choose the least costly adequate model and briefly justify escalation; work locally if none is available. Apply this policy to nested delegation too.
- Give agents concise, self-contained briefs with clear deliverables, context, file ownership, and validation expectations. Use a fresh or limited context fork when needed for explicit model selection, and coordinate shared edits and builds.
- Avoid duplicating delegated work. Track decisions and open issues, require evidence and validation results, and review critical claims and integration boundaries in proportion to risk.

## Source And Navigation

- Work in `src/**` for browser code, `tools/**` for extraction/build/verification, `data/manual/**` for maintained inputs, and `tests/**` for coverage. Deployment files are generated from these sources.
- Use focused searches and small source slices. When Serena is available, prefer symbol and reference queries for large modules such as `src/app.js`.
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

Keep state, data, and rendering responsibilities separate. Render modules must not import `appState` directly; pass state-derived values from `src/app.js` through arguments or render context.

## Build And Validation

- Rebuild checked-in Pages output with `npm run build` after changes that affect it. On WSL, use `./scripts/build-wsl.sh` for the environment-aware build and verification workflow.
- Rebuild local-game catalogs on WSL with `./scripts/build-wsl.sh --from-game`. On Windows, use `python tools/rebuild_pages.py ... --no-commit`.
- Reuse existing region geometry by default. Add `--refresh-region-outlines` only when intentionally re-extracting the Unity `regionoutlines` asset.
- Use `TI_TEMPLATES_DIR` or a confirmed local path for required game templates. Ask for missing paths when necessary; do not invent replacement game data.
- After source, generator, or data changes, run `npm run verify` and applicable lint checks. Run `npm run test:e2e` for user-facing browser behavior. Rebuild affected output before checking consistency or testing the deployed app.
- For documentation-only changes, review the diff and run `git diff --check`; app builds and browser tests are unnecessary.
- Scale additional testing to the change. Repeat or broaden checks only for new changes, failures, or unresolved concerns. Report checks actually run and any validation gaps.
- Preserve unrelated workspace changes. Keep generated rebuilds scoped to the task and inspect unexpected changed paths before finishing.
