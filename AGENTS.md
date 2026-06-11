# AGENTS.md

## Subagent Policy

Default to using subagents when parallel investigation, smaller context windows, or clear task ownership will materially improve the work.

Default to `gpt-5.4-mini` for subagents unless a task is high-risk, architecturally sensitive, unusually ambiguous, or a higher-priority instruction requires a different model.

Keep the main agent focused on orchestration, final synthesis, and high-risk judgment. Delegate concrete, well-scoped work when doing so is unlikely to reduce quality.

## Generated And Derived Artifacts

This repository checks in generated data, static deployment output, and data parsed or cataloged from external Terra Invicta files. Treat these as artifacts, not normal source.

Avoid reading, reviewing, refactoring, or hand-editing these paths unless the user explicitly asks for them or a narrow verification check requires it:

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

When one of these files appears relevant, prefer inspecting the generator, source asset, or a targeted sample instead of loading the whole artifact into context.

## Preferred Source Paths

Use these paths for ordinary implementation and review:

- `src/**` for the browser app source copied into `docs/`
- `tools/**` for extraction, catalog builders, page generation, and verification
- `tests/**` and `playwright.config.js` for test coverage
- `data/manual/region_aliases.json` for hand-maintained normalization aliases
- `README.md` and `.github/**` for project and workflow documentation

## Change Rules

- Do not fix behavior by hand-editing generated or deployment artifacts. Edit `src/**`, `tools/**`, or manual source data, then rebuild.
- Use `npm run build` to regenerate the checked-in Pages output from current source and generated data.
- Use `python tools/rebuild_pages.py ... --no-commit` when rebuilding from local Terra Invicta templates or region outline assets unless the user asks to commit or push.
- If external Terra Invicta templates or assets are required, use `TI_TEMPLATES_DIR` or ask the user for paths. Do not invent replacement data.
- Inspect large JSON with targeted commands such as `rg`, focused scripts, or small parsed slices. Do not paste or summarize full multi-megabyte artifacts.
- When generated files change intentionally, summarize what changed and why instead of reviewing full generated diffs.
- Run `npm run verify` after source, generator, or data changes. Run `npm run test:e2e` for user-facing browser behavior.
