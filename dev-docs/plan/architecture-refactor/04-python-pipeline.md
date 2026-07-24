# Phase 04: Python data and build pipeline restructuring

## Goal

- Centralize duplicated data/build contracts and produce precise fail-fast diagnostics without changing generated schemas or rewriting generated inputs during Pages builds.

## Scope

- Add shared scenario configuration, strict loaders, localization/override loaders with caller-specific projections, and manual/template validation.
- Decompose claim-data construction into typed pure stages.
- Split Pages runtime-bundle assembly, deterministic encoding, static copying, and output writing.
- Split verifier structure/deployment/sentinel diagnostics and keep exit-code policy in the CLI.
- Separate UnityPy geometry requirements from ordinary build/verify requirements.

## Non-goals

- No generated-data semantic/schema change, geometry refresh, formatter rollout, complete static typing, or replacement input data.
- No publishing behavior change; that belongs to phase 5.

## Affected files

- `tools/scenario_config.py`
- `tools/input_contracts.py`
- `tools/localization.py`
- `tools/catalog_utils.py`
- `tools/scenario_rows.py`
- `tools/build_claim_data.py`
- `tools/build_nation_catalog.py`
- `tools/build_region_outline_data.py`
- `tools/build_research_catalog.py`
- `tools/build_scenario_bundle.py`
- `tools/build_pages.py`
- `tools/verify_generated_outputs.py`
- `requirements.txt`
- `requirements-geometry.txt`
- Python unit tests under `tests/**`
- derived `docs/**`

## Implementation steps

1. Centralize supported/default scenario IDs, prefix stripping, template-name generation, and validation.
2. Add required/optional JSON/template loaders whose diagnostics include filename, JSON path, and row index.
3. Share localization and override loading while preserving nation-catalog and region-metadata fallback projections.
4. Fail fast on malformed/duplicate aliases, overrides, and template `dataName` identifiers.
5. Refactor claim-data building into normalization, alias resolution, breakaway index, grouping, nation profile, and stats/serialization stages with internal `TypedDict`s.
6. Split Pages assembly/encoding/copy/write boundaries and assert it never rewrites `data/generated/**`.
7. Make verifier functions return `list[Diagnostic]`; keep printing/exit codes in `main()`.
8. Move `UnityPy>=1.10,<2` into geometry-only requirements.
9. Run malformed-input tests, deterministic build/verify, update evidence, pass the phase gate, and commit.

## Acceptance criteria

- Every builder imports one scenario contract; unsupported scenarios fail consistently.
- Required missing/malformed inputs fail with the file and a precise path/row; optional inputs remain explicitly optional.
- Duplicate/invalid manual aliases, overrides, or template IDs fail before serialization.
- Catalog/region localization projections remain byte/semantically compatible with current outputs.
- Claim builder stages are individually testable and preserve output schema/content.
- `build_pages.py` writes only its output directory and never changes `data/generated/**`.
- Verifier diagnostics are composable/testable and CLI alone determines process exit status.
- Ordinary build/verify requires no pip install; UnityPy is pinned only for geometry refresh.

## Validation commands

- `npm run lint`
- `npm run test:unit`
- `python -m unittest discover -s tests -p "test_*.py"`
- `npm run build`
- `npm run check:generated`
- `npm run verify`
- `bash -n scripts/build-wsl.sh`
- from-game smoke test only when `TI_TEMPLATES_DIR` and required assets are available

## Manual smoke tests

- Feed malformed required JSON, duplicate alias/override IDs, and malformed template rows; inspect filename/path/row diagnostics.
- Snapshot hashes of `data/generated/**` before/after `npm run build` and confirm they are unchanged.
- Compare bundle and standalone datasets semantically after rebuild.

## Rollback risks

- Shared localization can accidentally collapse distinct fallback semantics; expose explicit projection functions.
- Strict loaders can reject previously tolerated but valid optional data; encode optionality at call sites.
- Claim builder staging can reorder serialized output; compare semantic objects and deterministic bytes where order is contractual.

## Evidence

- Baseline: scenario/localization/loading helpers are duplicated across builders; `build_pages.py`, `rebuild_pages.py`, and verifier own related path contracts independently.
- After: all builders, the verifier, manifest, and rebuild helper import `scenario_config.py`; strict loaders and shared localization/override projections live in `input_contracts.py` and `localization.py`. Claim normalization, breakaway indexing, grouping, project metadata, nation profiles, stats, and serialization are typed/testable stages. Pages loading, bundle assembly, deterministic encoding, static synchronization, and output writing are separate functions, and the builder writes only `docs/**`.
- Delta: Python tests increased from 28 to 35 and cover malformed JSON location, duplicate template IDs with row numbers, invalid aliases/overrides, distinct localization projections, structured verifier failures, deterministic gzip, and the no-source-write Pages invariant. `npm run build` left `data/generated/**` byte-clean, verifier passed, and all 94 E2E tests passed.
- Interpretation: generated schemas and checked-in generated data were unchanged. Ordinary build/verify now use only the standard library; `UnityPy>=1.10,<2` is isolated in `requirements-geometry.txt` and installed only for an explicit geometry refresh.
- Commit: pending.
- Commit blocker: the from-game smoke test is deferred because `TI_TEMPLATES_DIR` is not set in this environment.

## Progress

- Complete; phase gate passed with the documented external-asset smoke deferral.

## Decision log

- Keep Python contracts dependency-free so ordinary build/verify works with the standard library.
- Preserve caller-specific localization projections explicitly rather than forcing one fallback shape.

## Outcomes / Retrospective

- Shared contracts now fail fast instead of silently skipping malformed template/manual rows. The catalog and region localization projections intentionally remain distinct. Geometry extraction remains an opt-in, separately provisioned workflow.
