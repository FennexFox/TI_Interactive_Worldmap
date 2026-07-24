## Review scope

Do not review generated or deployment artifacts unless the PR explicitly asks for it.

Treat these paths as generated:
- docs/assets/data.generated.js
- docs/data/**
- docs/assets/app.js
- docs/assets/state/*.js
- docs/assets/data/*.js
- docs/assets/interaction/*.js
- docs/assets/render/*.js
- docs/assets/runtime/*.js
- docs/assets/ui/*.js
- docs/assets/styles.css
- docs/index.html
- data/generated/**

When these files change, review the generator scripts and source data instead:
- tools/build_pages.py
- tools/build_manifest.py
- tools/build_claim_data.py
- tools/build_region_outline_data.py
- tools/build_nation_catalog.py
- tools/build_research_catalog.py
- tools/scenario_config.py
- tools/input_contracts.py
- tools/localization.py
- data/manual/**
- src/**

Run `npm run build` after source changes, then `npm run verify`. Browser-free tests
belong in `npm run test:unit`; user-facing behavior belongs in the behavior-focused
Playwright specs under `tests/e2e/**`, using `tests/fixtures/app.js`.

`tools/rebuild_pages.py` does not commit or push by default. Publication must be
explicit with `--commit` or `--push`, and only manifest-declared generated paths may
be staged.

Also do not review tool-state or temporary planning artifacts as product code:
- graphify-out/**
- .serena/**
- .chatgpt/**
- .codex/**
- dev-docs/plan/**

Use these only as navigation or handoff context when explicitly relevant.
