# Refresh Broken Earth claim chain data

## Issue Target And Scope Summary

- Issue target: BE claim-chain refresh
- Title: Refresh Broken Earth claim chain data
- Source plan: None
- Scope: Compare the installed Dark Skies Broken Earth (`1962`) claim inputs with the
  checked-in scenario bundle, regenerate template-derived catalogs and Pages output,
  and publish the verified delta on a dedicated branch.

## Strategy

- Treat the installed Terra Invicta and Dark Skies templates as authoritative inputs.
- Use the repository's local-game rebuild path without refreshing region geometry.
- Inspect generated changes semantically with targeted parsers, concentrating on the
  Broken Earth claim graph while checking that unrelated scenarios remain coherent.
- Add deterministic Broken Earth sentinels for the new capital-chain links and the
  corrected Sensing Weakness nation requirement.
- Run repository verification and browser tests before pushing and opening a PR.

## Phase Order

1. [Verify and regenerate Broken Earth claim data](01-refresh.md)
2. [Validate generated output and publish the PR](02-verification.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Base and Dark Skies template files are data source of truth; checked-in JSON and
  `docs/**` files are generated artifacts and will not be hand-edited.
- `data/generated/scenario_bundle.generated.json` is the runtime scenario bundle;
  legacy top-level generated files continue to mirror the default `2026` scenario.
- `tools/verify_generated_outputs.py` owns exact dataset sentinels for upstream facts
  whose loss would otherwise pass broad count and reference checks.

## Global Validation Expectations

- npm run verify
- npm run test:e2e

## Known Risks And Assumptions

- The locally installed game may contain changes outside Broken Earth; any such
  generated delta must be called out and excluded when the generator permits it.
- Region geometry is assumed unchanged and will be reused from the repository.
- The local Steam install and Dark Skies DLC are assumed to be current and complete.
- Generated output is large, so review will use parsed summaries and source inputs,
  not line-by-line inspection of derived files.
