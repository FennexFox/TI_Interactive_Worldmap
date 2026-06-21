#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Build a normalized Terra Invicta nation catalog for the worldmap app."""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any

from catalog_utils import (
    load_json,
    load_named_templates,
    parse_languages,
    read_localization_file,
    resolve_templates_dir,
    source_fingerprint,
    unique_strings,
    write_json_output,
)
from scenario_rows import filter_bilateral_rows_for_scenario


SCHEMA_VERSION = 1
DEFAULT_OUTPUT = Path("data/generated/nations.catalog.json")
DEFAULT_NATION_DISPLAY_OVERRIDES = Path("data/manual/nation_display_overrides.json")
SCENARIO_YEARS = ("2022", "2026", "2070")
DEFAULT_SCENARIO_YEAR = "2026"
NATION_LOCALIZATION_FAMILIES = (
    "displayName",
    "displayNameWithArticle",
    "nationAdjective",
    "unionDisplayName",
    "unionDisplayNameWithArticle",
    "unionAdjective",
)


def norm_id(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"^(?:2022|2026|2070)_", "", str(value))


def scenario_template_name(name: str, scenario_year: str) -> str:
    return f"{scenario_year}_{norm_id(name)}"


def load_nation_display_overrides(path: Path = DEFAULT_NATION_DISPLAY_OVERRIDES) -> dict[str, dict[str, Any]]:
    if not path.is_file():
        return {}
    raw = load_json(path)
    if not isinstance(raw, dict):
        return {}
    return {
        norm_id(tag): value
        for tag, value in raw.items()
        if norm_id(tag) and isinstance(value, dict)
    }


def nation_localization_priority(data_name: str, tag: str, scenario_year: str) -> int:
    if data_name == scenario_template_name(tag, scenario_year):
        return 2
    if data_name == tag:
        return 1
    return 0


def load_nation_localizations(
    templates_dir: Path,
    languages: list[str],
    scenario_year: str = DEFAULT_SCENARIO_YEAR,
) -> dict[str, dict[str, str]]:
    layers = load_nation_localization_layers(templates_dir, languages, scenario_year)
    return {
        tag: dict(
            sorted(
                {
                    **((values.get("base") or {}).get("displayName") or {}),
                    **((values.get("scenario") or {}).get("displayName") or {}),
                }.items()
            )
        )
        for tag, values in sorted(layers.items())
    }


def load_nation_localization_layers(
    templates_dir: Path,
    languages: list[str],
    scenario_year: str = DEFAULT_SCENARIO_YEAR,
) -> dict[str, dict[str, dict[str, dict[str, str]]]]:
    root = templates_dir.parent / "Localization"
    localizations: dict[str, dict[str, dict[str, dict[str, str]]]] = {}
    for language in languages:
        values = read_localization_file(root / language / f"TINationTemplate.{language}")
        for key, value in values.items():
            parts = key.split(".")
            if len(parts) != 3 or parts[0] != "TINationTemplate" or parts[1] not in NATION_LOCALIZATION_FAMILIES:
                continue
            _, family, data_name = parts
            tag = norm_id(data_name)
            if not tag:
                continue
            priority = nation_localization_priority(data_name, tag, scenario_year)
            if priority == 2:
                localizations.setdefault(tag, {}).setdefault("scenario", {}).setdefault(family, {})[language] = value
            elif priority == 1:
                localizations.setdefault(tag, {}).setdefault("base", {}).setdefault(family, {})[language] = value
    return {
        tag: {
            layer: {
                family: dict(sorted(names.items()))
                for family, names in sorted(families.items())
            }
            for layer, families in sorted(values.items())
        }
        for tag, values in sorted(localizations.items())
    }


def localized_family(
    layers: dict[str, dict[str, dict[str, str]]],
    layer: str,
    family: str,
) -> dict[str, str]:
    return dict((layers.get(layer) or {}).get(family) or {})


def preferred_localized_family(
    layers: dict[str, dict[str, dict[str, str]]],
    family: str,
) -> dict[str, str]:
    return dict(
        sorted(
            {
                **localized_family(layers, "base", family),
                **localized_family(layers, "scenario", family),
            }.items()
        )
    )


def load_nation_template_layers(templates_dir: Path, scenario_year: str) -> dict[str, dict[str, dict[str, Any]]]:
    templates: dict[str, dict[str, dict[str, Any]]] = {}
    for data_name, row in load_named_templates(templates_dir, "TINationTemplate.json").items():
        if row.get("disable"):
            continue
        tag = norm_id(data_name)
        if not tag:
            continue
        if data_name == tag:
            layer = "base"
        elif data_name == scenario_template_name(tag, scenario_year):
            layer = "scenario"
        else:
            continue
        normalized = dict(row)
        normalized["dataName"] = tag
        if normalized.get("friendlyName"):
            normalized["friendlyName"] = norm_id(normalized["friendlyName"])
        if data_name != tag:
            normalized["sourceDataName"] = data_name
        templates.setdefault(tag, {})[layer] = normalized
    return {tag: dict(sorted(values.items())) for tag, values in sorted(templates.items())}


def localized_or_friendly_display_name(
    localized: dict[str, str] | None,
    template: dict[str, Any] | None,
) -> dict[str, str]:
    if localized:
        return dict(sorted((str(language), str(value)) for language, value in localized.items() if value))
    friendly_name = template.get("friendlyName") if template else None
    if friendly_name:
        return {"en": str(friendly_name)}
    return {}


def display_names_equal(left: dict[str, str], right: dict[str, str]) -> bool:
    return {k: v for k, v in left.items() if v} == {k: v for k, v in right.items() if v}


def distinct_display_name(value: dict[str, str], *others: dict[str, str]) -> dict[str, str]:
    if not value:
        return {}
    for other in others:
        if display_names_equal(value, other):
            return {}
    return value


def display_name_values(value: dict[str, str] | None) -> list[str]:
    return list((value or {}).values())


def localization_keys_for_layer(
    tag: str,
    localized_families: dict[str, dict[str, str]],
    layer: str,
    scenario_year: str,
) -> list[str]:
    data_name = scenario_template_name(tag, scenario_year) if layer == "scenario" else tag
    return [
        f"TINationTemplate.{family}.{data_name}"
        for family in NATION_LOCALIZATION_FAMILIES
        if localized_families.get(family)
    ]


def merge_display_name_overrides(display_name: dict[str, str], override: dict[str, Any]) -> dict[str, str]:
    override_display_name = override.get("displayName") if isinstance(override.get("displayName"), dict) else {}
    if not override_display_name:
        return display_name
    merged = dict(display_name)
    merged.update({str(language): str(value) for language, value in override_display_name.items() if value})
    return dict(sorted(merged.items()))


def load_nation_templates(templates_dir: Path, scenario_year: str) -> dict[str, dict[str, Any]]:
    templates: dict[str, dict[str, Any]] = {}
    for data_name, row in load_named_templates(templates_dir, "TINationTemplate.json").items():
        if row.get("disable"):
            continue
        tag = norm_id(data_name)
        if not tag:
            continue
        current = templates.get(tag)
        scenario_name = scenario_template_name(tag, scenario_year)
        if current is None or data_name == scenario_name or (
            current.get("sourceDataName", current.get("dataName")) != scenario_name and data_name == tag
        ):
            normalized = dict(row)
            normalized["dataName"] = tag
            if normalized.get("friendlyName"):
                normalized["friendlyName"] = norm_id(normalized["friendlyName"])
            if data_name != tag:
                normalized["sourceDataName"] = data_name
            templates[tag] = normalized
    return dict(sorted(templates.items()))


def initial_regions_by_nation(region_map: dict[str, Any] | None) -> dict[str, list[str]]:
    regions: dict[str, list[str]] = {}
    for row in (region_map or {}).get("regions", []):
        if not isinstance(row, dict):
            continue
        tag = norm_id(row.get("nationTag"))
        region_name = row.get("regionName")
        if not tag or not region_name:
            continue
        regions.setdefault(tag, []).append(str(region_name))
    return {tag: sorted(set(names)) for tag, names in sorted(regions.items())}


def bilateral_nation_flags(bilateral_rows: list[dict[str, Any]] | None) -> tuple[dict[str, set[str]], dict[str, str]]:
    claim_regions: dict[str, set[str]] = {}
    breakaway_from: dict[str, str] = {}
    for row in bilateral_rows or []:
        if not isinstance(row, dict):
            continue
        relation = row.get("relationType")
        if relation == "Claim":
            nation = norm_id(row.get("nation1"))
            region = norm_id(row.get("region1"))
            if nation and region:
                claim_regions.setdefault(nation, set()).add(region)
        elif relation == "Breakaway":
            nation = norm_id(row.get("nation1"))
            parent = norm_id(row.get("nation2"))
            if nation and parent:
                breakaway_from.setdefault(nation, parent)
    return claim_regions, dict(sorted(breakaway_from.items()))


def source_reasons(
    tag: str,
    *,
    has_template: bool,
    initial_regions: dict[str, list[str]],
    claim_regions: dict[str, set[str]],
    breakaway_from: dict[str, str],
) -> list[str]:
    reasons: list[str] = []
    if has_template:
        reasons.append("template")
    if tag in initial_regions:
        reasons.append("initialRegion")
    if tag in claim_regions:
        reasons.append("claimIssuer")
    if tag in breakaway_from:
        reasons.append("breakaway")
    if tag in set(breakaway_from.values()):
        reasons.append("breakawayParent")
    return reasons


def derived_display_aliases(values: list[Any]) -> list[str]:
    aliases: list[str] = []
    for value in values:
        text = str(value or "").strip()
        if text.endswith(" of America"):
            aliases.append(text.removesuffix(" of America"))
    return aliases


def build_catalog(
    templates_dir: Path,
    languages: list[str],
    *,
    region_map: dict[str, Any] | None = None,
    bilateral_rows: list[dict[str, Any]] | None = None,
    scenario_year: str = DEFAULT_SCENARIO_YEAR,
    nation_display_overrides: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    templates = load_nation_templates(templates_dir, scenario_year)
    template_layers = load_nation_template_layers(templates_dir, scenario_year)
    localization_layers = load_nation_localization_layers(templates_dir, languages, scenario_year)
    localizations = load_nation_localizations(templates_dir, languages, scenario_year)
    display_overrides = nation_display_overrides or {}
    initial_regions = initial_regions_by_nation(region_map)
    scenario_bilateral_rows = filter_bilateral_rows_for_scenario(
        bilateral_rows or [],
        scenario_year,
        relation_types=("Claim", "Breakaway"),
    )
    claim_regions, breakaway_from = bilateral_nation_flags(scenario_bilateral_rows)
    all_tags = sorted(
        set(templates)
        | set(localizations)
        | set(initial_regions)
        | set(claim_regions)
        | set(breakaway_from)
        | set(breakaway_from.values())
        | set(display_overrides)
    )

    nations: dict[str, dict[str, Any]] = {}
    for tag in all_tags:
        template = templates.get(tag)
        layers = template_layers.get(tag, {})
        localized_layers = localization_layers.get(tag, {})
        base_display_name = localized_or_friendly_display_name(localized_family(localized_layers, "base", "displayName"), layers.get("base"))
        scenario_display_name = localized_or_friendly_display_name(localized_family(localized_layers, "scenario", "displayName"), layers.get("scenario"))
        display_name = dict(localizations.get(tag, {}))
        if not display_name:
            display_name = base_display_name or scenario_display_name
        display_name_with_article = preferred_localized_family(localized_layers, "displayNameWithArticle")
        nation_adjective = preferred_localized_family(localized_layers, "nationAdjective")
        explicit_union_display_name = preferred_localized_family(localized_layers, "unionDisplayName")
        union_display_name_with_article = preferred_localized_family(localized_layers, "unionDisplayNameWithArticle")
        union_adjective = preferred_localized_family(localized_layers, "unionAdjective")
        friendly_name = template.get("friendlyName") if template else None
        override = display_overrides.get(tag, {})
        display_name = merge_display_name_overrides(display_name, override)
        if override.get("friendlyName"):
            friendly_name = str(override["friendlyName"])
        override_aliases = override.get("aliases") if isinstance(override.get("aliases"), list) else []
        union_display_name = explicit_union_display_name or distinct_display_name(scenario_display_name, base_display_name, display_name)
        display_values = [
            *display_name_values(display_name),
            *display_name_values(base_display_name),
            *display_name_values(display_name_with_article),
            *display_name_values(nation_adjective),
            *display_name_values(union_display_name),
            *display_name_values(union_display_name_with_article),
            *display_name_values(union_adjective),
            friendly_name,
        ]
        if override_aliases:
            aliases = unique_strings([tag, *override_aliases, *display_values, *derived_display_aliases(display_values)])
        else:
            aliases = unique_strings([tag, *display_values, *derived_display_aliases(display_values)])
        localization_keys = localization_keys_for_layer(tag, localized_layers.get("base") or {}, "base", scenario_year)
        localization_keys.extend(localization_keys_for_layer(tag, localized_layers.get("scenario") or {}, "scenario", scenario_year))
        if override:
            localization_keys.append(str(DEFAULT_NATION_DISPLAY_OVERRIDES))
        entry = {
            "tag": tag,
            "displayName": dict(sorted(display_name.items())),
            "baseDisplayName": dict(sorted(base_display_name.items())),
            "displayNameWithArticle": dict(sorted(display_name_with_article.items())),
            "nationAdjective": dict(sorted(nation_adjective.items())),
            "unionDisplayName": dict(sorted(union_display_name.items())),
            "unionDisplayNameWithArticle": dict(sorted(union_display_name_with_article.items())),
            "unionAdjective": dict(sorted(union_adjective.items())),
            "friendlyName": friendly_name,
            "aliases": aliases,
            "existsAtStart": tag in initial_regions,
            "initialRegionCount": len(initial_regions.get(tag, [])),
            "isClaimIssuer": tag in claim_regions,
            "claimRegionCount": len(claim_regions.get(tag, set())),
            "isBreakaway": tag in breakaway_from,
            "breakawayFrom": breakaway_from.get(tag, ""),
            "source": {
                "template": "TINationTemplate.json" if template else "",
                "localizationKeys": localization_keys,
                "includedBecause": source_reasons(
                    tag,
                    has_template=template is not None,
                    initial_regions=initial_regions,
                    claim_regions=claim_regions,
                    breakaway_from=breakaway_from,
                ),
            },
        }
        if template and template.get("factionName"):
            entry["factionName"] = template.get("factionName")
        nations[tag] = {key: value for key, value in entry.items() if value is not None}

    return {
        "schemaVersion": SCHEMA_VERSION,
        "source": {
            "templateRoot": "TerraInvicta_Data/StreamingAssets/Templates",
            "scenarioYear": scenario_year,
            "nationTemplate": source_fingerprint(templates_dir / "TINationTemplate.json"),
            "localizationLanguages": languages,
        },
        "counts": {
            "total": len(nations),
            "withTemplate": sum(1 for tag in nations if tag in templates),
            "withLocalizedName": sum(1 for entry in nations.values() if entry.get("displayName")),
            "existsAtStart": sum(1 for entry in nations.values() if entry.get("existsAtStart")),
            "claimIssuers": sum(1 for entry in nations.values() if entry.get("isClaimIssuer")),
            "breakaways": sum(1 for entry in nations.values() if entry.get("isBreakaway")),
        },
        "nations": nations,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--templates-dir", help="Path to TerraInvicta_Data/StreamingAssets/Templates.")
    parser.add_argument("--languages", default="kor,en", help="Comma-separated localization languages to include.")
    parser.add_argument("--region-map", default="data/generated/region_map.generated.json")
    parser.add_argument("--bilateral-template", help="Path to TIBilateralTemplate.json.")
    parser.add_argument("--scenario-year", default=DEFAULT_SCENARIO_YEAR, choices=SCENARIO_YEARS)
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--nation-display-overrides", default=str(DEFAULT_NATION_DISPLAY_OVERRIDES), help="Optional manual nation display-name override JSON.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    templates_dir = resolve_templates_dir(args.templates_dir)
    if templates_dir is None:
        raise SystemExit("Templates directory not found. Pass --templates-dir.")
    languages = parse_languages(args.languages)
    region_map = load_json(Path(args.region_map)) if args.region_map and Path(args.region_map).is_file() else None
    bilateral_path = Path(args.bilateral_template) if args.bilateral_template else templates_dir / "TIBilateralTemplate.json"
    bilateral_rows = load_json(bilateral_path) if bilateral_path.is_file() else None
    catalog = build_catalog(
        templates_dir,
        languages,
        region_map=region_map,
        bilateral_rows=bilateral_rows,
        scenario_year=args.scenario_year,
        nation_display_overrides=load_nation_display_overrides(Path(args.nation_display_overrides)),
    )
    output = write_json_output(Path(args.output), catalog)
    print(f"Wrote {output}")
    print(f"Nations: {catalog['counts']['total']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
