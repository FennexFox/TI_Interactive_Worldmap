#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Shared source, deployment, and generated-output path contracts."""
from __future__ import annotations

from pathlib import Path

from scenario_config import SUPPORTED_SCENARIOS


ROOT = Path(__file__).resolve().parents[1]

STATIC_SOURCE_MAPPINGS = (
    (Path("src/index.html"), Path("docs/index.html")),
    (Path("src/styles.css"), Path("docs/assets/styles.css")),
)

TOP_LEVEL_GENERATED_FILES = (
    Path("data/generated/region_map.generated.json"),
    Path("data/generated/claim_map.generated.json"),
    Path("data/generated/nations.catalog.json"),
    Path("data/generated/research.catalog.json"),
    Path("data/generated/scenario_bundle.generated.json"),
)

SCENARIO_OUTPUT_FILENAMES = (
    "region_map.generated.json",
    "claim_map.generated.json",
    "nations.catalog.json",
    "research.catalog.json",
)

PAGES_DATA_FILES = (
    Path("docs/data/region_map.generated.json"),
    Path("docs/data/claim_map.generated.json"),
    Path("docs/data/scenario_bundle.generated.json"),
    Path("docs/data/generated/nations.catalog.json"),
    Path("docs/data/generated/research.catalog.json"),
    Path("docs/assets/data.generated.js"),
)

# These paths are intentionally explicit: rebuild publishing must never stage the
# whole repository, while every derived browser module directory must be covered.
GENERATED_STAGING_PATHS = (
    *(str(path) for path in TOP_LEVEL_GENERATED_FILES),
    "data/generated/scenarios",
    *(str(path) for path in PAGES_DATA_FILES),
    "docs/index.html",
    "docs/assets/styles.css",
    "docs/assets/app.js",
    "docs/assets/state",
    "docs/assets/data",
    "docs/assets/interaction",
    "docs/assets/render",
    "docs/assets/runtime",
    "docs/assets/ui",
)


def browser_source_mappings(root: Path = ROOT) -> tuple[tuple[Path, Path], ...]:
    """Return every browser JS source and its Pages destination."""
    source_root = root / "src"
    mappings = []
    for source in sorted(source_root.rglob("*.js")):
        relative = source.relative_to(source_root)
        mappings.append((Path("src") / relative, Path("docs/assets") / relative))
    return tuple(mappings)


def deployment_source_mappings(root: Path = ROOT) -> tuple[tuple[Path, Path], ...]:
    """Return the complete source-to-Pages static asset manifest."""
    return (*STATIC_SOURCE_MAPPINGS, *browser_source_mappings(root))


def expected_browser_deployment_files(root: Path = ROOT) -> frozenset[Path]:
    return frozenset(destination for _, destination in browser_source_mappings(root))


def expected_scenario_generated_files(
    scenario_ids: tuple[str, ...] = SUPPORTED_SCENARIOS,
) -> tuple[Path, ...]:
    return tuple(
        Path("data/generated/scenarios") / scenario / filename
        for scenario in scenario_ids
        for filename in SCENARIO_OUTPUT_FILENAMES
    )
