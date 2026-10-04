# Development docs

`dev-docs/` contains internal engineering references and temporary implementation context. It is not the public GitHub Pages site or user-facing product documentation.

The public/static site is built into `docs/`. Do not use `docs/` for planning documentation in this repository.

## Working architecture map

- [`architecture.md`](architecture.md): current repository and browser-runtime architecture map. It is a living guide, not a frozen design contract. Current source, tests, and generated-output verifiers remain authoritative when they disagree with the map.
- [`performance-notes.md`](performance-notes.md): concise source-checked performance invariants and historical measurement caveats retained from completed work. It records evidence, not a performance guarantee.

## Durable versus temporary docs

Durable project documentation belongs in:

- `README.md` for user-facing setup, build, deploy, and project scope;
- `AGENTS.md` for contributor/agent workflow rules;
- `.github/**` for PR, issue, review, and automation guidance.

Temporary planning material belongs in:

- `dev-docs/plan/<issue-or-topic>/` for per-issue or per-PR plans;
- `.chatgpt/**` for local ChatGPT/Codex run handoffs and receipts;
- `.chatgpt/tool-tests/**` for generated local measurements.

Keep completed plan folders disposable. Promote only source-verified findings
that remain useful to the architecture map or focused performance notes. Do not
retain phase history, raw measurements, or stale implementation status as current
documentation.

## Plan document lifecycle

- Create per-issue and per-PR plans under `dev-docs/plan/<issue-or-topic>/`.
- Treat those plan folders as disposable after the related PR is merged, closed, or abandoned.
- Before deleting a plan folder, promote any still-useful decisions, conventions,
  or validated findings into `README.md`, `AGENTS.md`, `.github/**`, a durable
  issue body, `architecture.md`, or `performance-notes.md`.
- Do not treat old references from `dev-docs/plan/**` as compatibility blockers for reorganizing durable documentation.
- Do not review `dev-docs/plan/**` as product code unless the PR explicitly asks for planning-document review.

## Generated-output boundary

`docs/` is generated/deployment output for GitHub Pages. Source changes should normally happen in `src/**`, `tools/**`, tests, or manual data files, followed by the normal build/verify workflow.

Do not hand-edit generated `docs/**` outputs as documentation.

The shared deployment/staging contract lives in `tools/build_manifest.py`.
`tools/build_pages.py` writes only `docs/**`; `tools/rebuild_pages.py` publishes only
when `--commit` or `--push` is explicitly supplied.
