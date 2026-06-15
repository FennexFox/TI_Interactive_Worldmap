# AGENTS.md

## Subagent Policy

Default to using subagents when parallel investigation, smaller context windows, or clear task ownership will materially improve the work.

Default to `gpt-5.4-mini` for subagents unless a task is high-risk, architecturally sensitive, unusually ambiguous, or a higher-priority instruction requires a different model.

Keep the main agent focused on orchestration, final synthesis, and high-risk judgment. Delegate concrete, well-scoped work when doing so is unlikely to reduce quality.

## Generated And Derived Artifacts

This repository checks in generated data, static deployment output, and data parsed or cataloged from external Terra Invicta files. These files are **not source of truth**. They are build artifacts.

Do **not** read, review, summarize, refactor, or hand-edit generated artifacts during ordinary implementation or PR review. They are large, mechanically produced, and usually waste review context. Review the generator/source files instead.

Generated and derived paths include:

- `data/generated/**`
- `data/*.catalog.json`
- `docs/index.html`
- `docs/assets/**`
- `docs/data/**`
- `node_modules/**`
- `__pycache__/**`
- `.pytest_cache/**`
- `playwright-report/**`
- `test-results/**`

For these paths:

- Do not load whole files into context.
- Do not review generated diffs line-by-line.
- Do not comment on formatting, ordering, minification, serialization, or apparent duplication inside generated outputs.
- Do not propose manual fixes to generated outputs.
- If generated artifacts changed, inspect the corresponding source or generator instead:
  - `src/**` for browser source copied into `docs/assets/**`
  - `tools/**` for generated data and page builders
  - `data/manual/**` for hand-maintained data inputs
  - external Terra Invicta `Templates` / assets only when explicitly needed
- It is acceptable to run targeted verification commands against generated outputs, such as `npm run verify`, `tools/verify_generated_outputs.py`, `node --check`, or small scripts that inspect counts/checksums/specific keys.
- It is acceptable to inspect a small targeted slice of a generated file only when debugging a failing generator or verifier. Keep the slice minimal and state why it was needed.

When reporting changes, summarize generated artifact changes at a high level, for example: “rebuilt docs and generated catalogs from updated source,” rather than reviewing the generated diff.

## Preferred Source Paths

Use these paths for ordinary implementation and review:

- `src/**` for the browser app source copied into `docs/`
- `src/state/**` for application and map visual state modules
- `src/data/**` for active data access and derived index modules
- `src/render/**` for SVG layer rendering helpers
- `tools/**` for extraction, catalog builders, page generation, and verification
- `tests/**` and `playwright.config.js` for test coverage
- `data/manual/region_aliases.json` for hand-maintained normalization aliases
- `README.md` and `.github/**` for project and workflow documentation

## Browser App Module Boundaries

The browser app uses native ES modules. Keep state, data, and rendering boundaries explicit:

- `src/state/app-state.js` owns app-level interaction state and transition helpers.
- `src/state/map-visual-state.js` owns visual state for currently applied map classes and visibility.
- `src/data/active-data.js` resolves the active scenario data, even while the app still ships one scenario.
- `src/data/derived-indices.js` builds data indices derived from the active data.
- `src/render/map-layers.js` contains low-level SVG layer rendering helpers and should receive dependencies through arguments or render context.

Do not make render modules import `appState` directly. Pass state-derived values explicitly from `src/app.js`.

## Change Rules

- Do not fix behavior by hand-editing generated or deployment artifacts. Edit `src/**`, `tools/**`, or manual source data, then rebuild.
- Use `npm run build` to regenerate the checked-in Pages output from current source and generated data.
- Use `python tools/rebuild_pages.py ... --no-commit` when rebuilding from local Terra Invicta templates on Windows. By default this reuses `data/generated/region_map.generated.json`; add `--refresh-region-outlines` only when intentionally re-extracting the Unity `regionoutlines` asset.
- Use `./scripts/build-wsl.sh` for WSL checked-in builds and `./scripts/build-wsl.sh --from-game` for WSL local-game catalog rebuilds. Add `--refresh-region-outlines` only when intentionally refreshing region geometry.
- If external Terra Invicta templates or assets are required, use `TI_TEMPLATES_DIR` or ask the user for paths. Do not invent replacement data.
- Inspect large JSON with targeted commands such as `rg`, focused scripts, or small parsed slices. Do not paste or summarize full multi-megabyte artifacts.
- When generated files change intentionally, summarize what changed and why instead of reviewing full generated diffs.
- Run `npm run verify` after source, generator, or data changes. Run `npm run test:e2e` for user-facing browser behavior.
