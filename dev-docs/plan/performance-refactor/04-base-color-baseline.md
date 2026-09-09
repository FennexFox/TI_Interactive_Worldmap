# Base-color selection and baseline

## Goal

- Select candidate 2 by estimated benefit and measure the built current app.

## Scope

- HANDOUT candidate 2, plan documents and browser measurement tool.

## Non-goals

- Candidates 3–5, game-data extraction, deployment, path serialization, multi-entry geometry caches and changing search semantics.

## Affected files

- HANDOUT candidate 2, plan documents and browser measurement tool.

## Implementation steps

- Identify render inputs and invalidation boundaries; build current docs; measure identical filter/language refresh layer replacement; validate the appended plan.

## Acceptance criteria

- Record before counts, workload and validation before source implementation.

## Validation commands

- rtk proxy ./scripts/build-wsl.sh --skip-install; rtk proxy node tools/measure_base_color_updates.mjs /tmp/base-color-before.json http://127.0.0.1:4178; strict phase-plan validation.

## Manual smoke tests

- Exercise repeated search, language refresh, different visibility, base mode, scenario and world-wrap transitions in the built browser. Automated browser tests/probes are used; record if no human visual check is performed.

## Rollback risks

- Stale SVG colors or geometry if mutable fill/path/copy inputs are omitted. Avoid callback-identity-only keys and verify same-ID changed geometry.

## Progress

- Completed source review, current-source WSL build/verify (67 JS + 53 Python), strict plan validation and real Chromium baseline.

## Decision log

- User explicitly authorized choosing by estimated benefit. Candidate 2 processes every visible region and joins long SVG paths on filter refresh, making it the strongest estimated remaining candidate; this is a hypothesis, not a measured ranking.

## Outcomes / Retrospective

- Chromium 149.0.7827.55, 1440×900, debug enabled; one warm-up then five repeated all-visible inputs and five repeated Ontario inputs for wrap off/on. Every repeated input and language refresh caused one base-layer replacement. Full-visible path strings total 1,071,329 characters (wrap off) or 3,213,987 (on); filtered Ontario 3,103 / 9,309. Baseline built artifacts remained unchanged.
- Prior full browser suite is already validated on this unchanged source; no human visual inspection performed. The probe initially used Canada, which matched no map regions; corrected to Ontario before recording the authoritative baseline. Raw output: .chatgpt/tool-tests/performance-refactor/base-colors-before.json.
- Same visibility means set insertion order is irrelevant, but source region order/multiplicity must remain significant to preserve paint order. Compare actual path/fill values and invalidate on renderGeometry/reset/destroy; do not invent revision fields absent from current runtime.
