## Review scope

Do not review generated or deployment artifacts unless the PR explicitly asks for it.

Treat these paths as generated:
- docs/assets/data.generated.js
- docs/data/**
- docs/assets/app.js
- docs/assets/state/*.js
- docs/assets/data/*.js
- docs/assets/render/*.js
- docs/assets/styles.css
- docs/index.html
- data/generated/*.json

When these files change, review the generator scripts and source data instead:
- tools/build_pages.py
- tools/build_claim_data.py
- tools/build_region_outline_data.py
- tools/build_nation_catalog.py
- tools/build_research_catalog.py
- data/manual/**
- src/**

Also do not review tool-state or temporary planning artifacts as product code:
- graphify-out/**
- .serena/**
- .chatgpt/**
- .codex/**
- dev-docs/plan/**

Use these only as navigation or handoff context when explicitly relevant.
