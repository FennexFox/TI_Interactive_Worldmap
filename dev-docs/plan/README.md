# Plan docs

This folder holds temporary per-issue and per-PR planning context.

## Current folders

- `issue_16/`: SVG overlay performance follow-up loop and related profiling reports.
- `issue_56/`: hostile-claim visual hatch implementation prompt.
- `issue_62/`: label rendering performance profiling plan and results.
- `issue_65/`: region hit-path duplication / canonical geometry profiling plan and results.
- `performance-followups/`: cross-issue performance follow-up issue drafts and planning material.

## Lifecycle

Plan folders may be deleted when the related PR is merged, closed, or abandoned.

Before deleting a folder, preserve only durable conclusions that remain useful outside the one-off run. Good promotion targets are:

- `README.md` for project/user workflow;
- `AGENTS.md` for contributor and agent workflow rules;
- `.github/**` for PR/issue/review workflow;
- active GitHub issue bodies or comments for follow-up tasks.

Do not migrate raw measurement CSVs, temporary prompts, or stale phase plans into durable docs.

## Review rules

- Treat plan files as context, not product code.
- Prefer the current source, tests, and generated-output verifiers over stale plan text.
- When a plan conflicts with current source or project instructions, update or delete the plan rather than preserving compatibility.
- Do not let references from `dev-docs/plan/**` block documentation or source reorganization.
