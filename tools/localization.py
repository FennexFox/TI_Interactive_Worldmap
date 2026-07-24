#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Shared localization loading with caller-specific fallback projections."""
from __future__ import annotations

from pathlib import Path

from catalog_utils import read_localization_file
from scenario_config import DEFAULT_SCENARIO, scenario_template_name, strip_scenario_prefix, validate_scenario


NATION_LOCALIZATION_FAMILIES = (
    "displayName",
    "displayNameWithArticle",
    "nationAdjective",
    "unionDisplayName",
    "unionDisplayNameWithArticle",
    "unionAdjective",
)


def nation_localization_priority(data_name: str, tag: str, scenario: str) -> int:
    if data_name == scenario_template_name(tag, scenario):
        return 2
    return 1 if data_name == tag else 0


def load_nation_localization_layers(
    templates_dir: Path,
    languages: list[str],
    scenario: str = DEFAULT_SCENARIO,
    *,
    families: tuple[str, ...] = NATION_LOCALIZATION_FAMILIES,
) -> dict[str, dict[str, dict[str, dict[str, str]]]]:
    scenario = validate_scenario(scenario)
    root = templates_dir.parent / "Localization"
    localizations: dict[str, dict[str, dict[str, dict[str, str]]]] = {}
    for language in languages:
        values = read_localization_file(root / language / f"TINationTemplate.{language}")
        for key, value in values.items():
            parts = key.split(".")
            if len(parts) != 3 or parts[0] != "TINationTemplate" or parts[1] not in families:
                continue
            _, family, data_name = parts
            tag = strip_scenario_prefix(data_name)
            priority = nation_localization_priority(data_name, tag, scenario)
            layer = "scenario" if priority == 2 else "base" if priority == 1 else ""
            if tag and layer:
                localizations.setdefault(tag, {}).setdefault(layer, {}).setdefault(family, {})[language] = value
    return {
        tag: {
            layer: {
                family: dict(sorted(names.items()))
                for family, names in sorted(family_values.items())
            }
            for layer, family_values in sorted(layer_values.items())
        }
        for tag, layer_values in sorted(localizations.items())
    }


def project_nation_catalog_localizations(
    layers: dict[str, dict[str, dict[str, dict[str, str]]]],
) -> dict[str, dict[str, str]]:
    return {
        tag: dict(sorted({
            **((values.get("base") or {}).get("displayName") or {}),
            **((values.get("scenario") or {}).get("displayName") or {}),
        }.items()))
        for tag, values in sorted(layers.items())
    }


def project_region_nation_localizations(
    layers: dict[str, dict[str, dict[str, dict[str, str]]]],
) -> dict[str, dict[str, str]]:
    return {
        tag: dict(sorted({
            **((values.get("base") or {}).get("displayName") or {}),
            **((values.get("scenario") or {}).get("displayName") or {}),
        }.items()))
        for tag, values in sorted(layers.items())
    }
