# Plan docs

This folder holds active per-issue and per-PR planning context. There are no
active plan folders in the repository at present.

## Lifecycle

Create a folder here only while a plan is active. Delete it when the related work
is merged, closed, or abandoned.

Before deleting a folder, preserve only source-verified conclusions that remain
useful outside the one-off run. Promotion targets are:

- `README.md` for project/user workflow;
- `AGENTS.md` for contributor and agent workflow rules;
- `.github/**` for PR/issue/review workflow;
- active GitHub issue bodies or comments for follow-up tasks;
- [`../architecture.md`](../architecture.md) for current ownership and repository
  boundaries;
- [`../performance-notes.md`](../performance-notes.md) for validated performance
  invariants and measurement limitations.

Do not migrate raw measurement CSVs, temporary prompts, or stale phase plans into durable docs.

## Review rules

- Treat plan files as context, not product code.
- Prefer the current source, tests, and generated-output verifiers over stale plan text.
- When a plan conflicts with current source or project instructions, update or delete the plan rather than preserving compatibility.
- Do not treat completed phase logs or plan-template statuses as current work or
  unresolved debt.
- Do not let references from `dev-docs/plan/**` block documentation or source reorganization.
