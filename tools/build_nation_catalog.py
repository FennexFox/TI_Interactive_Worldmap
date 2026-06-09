#!/usr/bin/env python3
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


SCHEMA_VERSION = 1
DEFAULT_OUTPUT = Path("data/nations.catalog.json")
SCENARIO_YEARS = ("2022", "2026", "2070")
DEFAULT_SCENARIO_YEAR = "2026"


def norm_id(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"^(?:2022|2026|2070)_", "", str(value))


def scenario_template_name(name: str, scenario_year: str) -> str:
    return f"{scenario_year}_{norm_id(name)}"


def load_nation_localizations(templates_dir: Path, languages: list[str]) -> dict[str, dict[str, str]]:
    root = templates_dir.parent / "Localization"
    localizations: dict[str, dict[str, str]] = {}
    for language in languages:
        values = read_localization_file(root / language / f"TINationTemplate.{language}")
        for key, value in values.items():
            parts = key.split(".")
            if len(parts) != 3 or parts[0] != "TINationTemplate" or parts[1] != "displayName":
                continue
            _, _, data_name = parts
            tag = norm_id(data_name)
            if not tag:
                continue
            current = localizations.setdefault(tag, {})
            if data_name == tag or language not in current:
                current[language] = value
    return dict(sorted(localizations.items()))


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
) -> dict[str, Any]:
    templates = load_nation_templates(templates_dir, scenario_year)
    localizations = load_nation_localizations(templates_dir, languages)
    initial_regions = initial_regions_by_nation(region_map)
    claim_regions, breakaway_from = bilateral_nation_flags(bilateral_rows)
    all_tags = sorted(
        set(templates)
        | set(localizations)
        | set(initial_regions)
        | set(claim_regions)
        | set(breakaway_from)
        | set(breakaway_from.values())
    )

    nations: dict[str, dict[str, Any]] = {}
    for tag in all_tags:
        template = templates.get(tag)
        display_name = localizations.get(tag, {})
        friendly_name = template.get("friendlyName") if template else None
        display_values = [*display_name.values(), friendly_name]
        aliases = unique_strings([tag, *display_values, *derived_display_aliases(display_values)])
        localization_keys = [f"TINationTemplate.displayName.{tag}"] if display_name else []
        entry = {
            "tag": tag,
            "displayName": dict(sorted(display_name.items())),
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
    )
    output = write_json_output(Path(args.output), catalog)
    print(f"Wrote {output}")
    print(f"Nations: {catalog['counts']['total']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
