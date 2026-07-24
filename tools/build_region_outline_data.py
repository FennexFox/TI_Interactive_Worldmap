#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Compact and enrich Terra Invicta region outlines for browser rendering."""
from __future__ import annotations

import argparse
import collections
import json
import math
import re
import sys
from pathlib import Path
from typing import Any

from catalog_utils import (
    clean_data_string,
    load_named_templates,
    parse_languages,
    read_localization_file,
    resolve_templates_dir,
    sanitize_data_value,
)
from input_contracts import load_override_map, load_required_json
from localization import (
    load_nation_localization_layers as load_shared_nation_localization_layers,
    project_region_nation_localizations,
)
from scenario_config import (
    DEFAULT_SCENARIO,
    SUPPORTED_SCENARIOS,
    scenario_template_name as shared_scenario_template_name,
    strip_scenario_prefix,
)
from scenario_rows import filter_bilateral_rows_for_scenario


SCENARIO_YEARS = SUPPORTED_SCENARIOS
DEFAULT_SCENARIO_YEAR = DEFAULT_SCENARIO
DEFAULT_NATION_DISPLAY_OVERRIDES = Path("data/manual/nation_display_overrides.json")
NATION_COLOR_PALETTE = [
    "#4f83cc",
    "#c56b5d",
    "#5f9f72",
    "#b57bc8",
    "#c5963d",
    "#4fa7a1",
    "#d06f9f",
    "#7f8f45",
    "#8b77d8",
    "#cc7f42",
    "#5d95b8",
    "#b06f70",
    "#6f9d4f",
    "#ba6fb4",
    "#9d8b47",
    "#5e9b8a",
]


def load_json(path: Path) -> Any:
    return sanitize_data_value(load_required_json(path))


def norm_id(value: Any) -> str:
    return strip_scenario_prefix(clean_data_string(str(value))) if value is not None else ""


def scenario_template_name(name: str, scenario_year: str) -> str:
    return shared_scenario_template_name(name, scenario_year)


def load_nation_display_overrides(path: Path = DEFAULT_NATION_DISPLAY_OVERRIDES) -> dict[str, dict[str, Any]]:
    return load_override_map(path)


def select_scenario_template(
    templates: dict[str, dict[str, Any]],
    data_name: str,
    scenario_year: str,
) -> dict[str, Any] | None:
    canonical = norm_id(data_name)
    return templates.get(scenario_template_name(canonical, scenario_year)) or templates.get(canonical)


def load_region_localizations(templates_dir: Path, languages: list[str]) -> dict[str, dict[str, str]]:
    root = templates_dir.parent / "Localization"
    localizations: dict[str, dict[str, str]] = {}
    for language in languages:
        values = read_localization_file(root / language / f"TIRegionTemplate.{language}")
        for key, value in values.items():
            parts = key.split(".")
            if len(parts) != 3 or parts[0] != "TIRegionTemplate" or parts[1] != "displayName":
                continue
            _, _, data_name = parts
            region_name = norm_id(data_name)
            if region_name:
                localizations.setdefault(region_name, {})[language] = value
    return localizations


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
    layers = load_shared_nation_localization_layers(
        templates_dir,
        languages,
        scenario_year,
        families=("displayName",),
    )
    return project_region_nation_localizations(layers)


def load_nation_localization_layers(
    templates_dir: Path,
    languages: list[str],
    scenario_year: str = DEFAULT_SCENARIO_YEAR,
) -> dict[str, dict[str, dict[str, str]]]:
    shared = load_shared_nation_localization_layers(
        templates_dir,
        languages,
        scenario_year,
        families=("displayName",),
    )
    return {
        tag: {
            layer: dict(sorted((families.get("displayName") or {}).items()))
            for layer, families in sorted(values.items())
        }
        for tag, values in sorted(shared.items())
    }


def load_scenario_nations(templates_dir: Path, scenario_year: str) -> dict[str, dict[str, Any]]:
    templates = load_named_templates(templates_dir, "TINationTemplate.json")
    by_tag: dict[str, dict[str, Any]] = {}
    for data_name, template in templates.items():
        tag = norm_id(data_name)
        if not tag or template.get("disable"):
            continue
        current = by_tag.get(tag)
        scenario_name = scenario_template_name(tag, scenario_year)
        if current is None or data_name == scenario_name or (
            current.get("dataName") != scenario_name and data_name == tag
        ):
            by_tag[tag] = template
    return dict(sorted(by_tag.items()))


def load_nation_display_names(
    templates_dir: Path,
    languages: list[str],
    scenario_year: str,
    nation_display_overrides: dict[str, dict[str, Any]] | None = None,
) -> dict[str, str]:
    localization_layers = load_nation_localization_layers(templates_dir, languages, scenario_year)
    display_overrides = nation_display_overrides or {}
    display_names: dict[str, str] = {}
    for tag, template in load_scenario_nations(templates_dir, scenario_year).items():
        layers = localization_layers.get(tag, {})
        scenario_localized = layers.get("scenario") or {}
        base_localized = layers.get("base") or {}
        override = display_overrides.get(tag, {})
        override_display_name = override.get("displayName") if isinstance(override.get("displayName"), dict) else {}
        display_name = (
            override_display_name.get("en")
            or next(iter(override_display_name.values()), "")
            or scenario_localized.get("en")
            or next(iter(scenario_localized.values()), "")
            or norm_id(template.get("friendlyName"))
            or base_localized.get("en")
            or next(iter(base_localized.values()), "")
            or tag
        )
        display_names[tag] = clean_data_string(str(display_name))
    return dict(sorted(display_names.items()))


def load_scenario_initial_owners(templates_dir: Path, scenario_year: str) -> dict[str, str]:
    rows = list(load_named_templates(templates_dir, "TIBilateralTemplate.json").values())
    scenario_rows = filter_bilateral_rows_for_scenario(rows, scenario_year, relation_types=("Claim",))
    owners: dict[str, str] = {}
    for row in scenario_rows:
        if row.get("initialOwner") is not True:
            continue
        region_name = norm_id(row.get("region1"))
        nation_tag = norm_id(row.get("nation1"))
        if not region_name or not nation_tag:
            raise ValueError(
                f"Invalid {scenario_year} initial-owner Claim row: {row.get('dataName') or '<unnamed>'}"
            )
        previous = owners.get(region_name)
        if previous and previous != nation_tag:
            raise ValueError(
                f"Conflicting {scenario_year} initial owners for {region_name}: {previous}, {nation_tag}"
            )
        owners[region_name] = nation_tag
    if not owners:
        raise ValueError(
            f"No {scenario_year} initial-owner Claim rows found in TIBilateralTemplate.json"
        )
    return dict(sorted(owners.items()))


def canonical_map_region_name(map_region_name: Any, fallback: str) -> str:
    value = clean_data_string(str(map_region_name or f"map_{fallback}"))
    if value.startswith("map_"):
        value = value[4:]
    return norm_id(value)


def load_region_metadata(
    templates_dir: Path | None,
    languages: list[str],
    scenario_year: str,
    nation_display_overrides: dict[str, dict[str, Any]] | None = None,
) -> dict[str, dict[str, Any]]:
    if templates_dir is None:
        return {}
    region_templates = load_named_templates(templates_dir, "TIRegionTemplate.json")
    map_region_templates = load_named_templates(templates_dir, "TIMapRegionTemplate.json")
    localizations = load_region_localizations(templates_dir, languages)
    nation_display_names = load_nation_display_names(templates_dir, languages, scenario_year, nation_display_overrides)
    initial_owners = load_scenario_initial_owners(templates_dir, scenario_year)
    metadata: dict[str, dict[str, Any]] = {}
    region_names = sorted({norm_id(name) for name in region_templates if norm_id(name)})
    resolved_region_names: set[str] = set()
    for region_name in region_names:
        template = select_scenario_template(region_templates, region_name, scenario_year)
        if not template:
            continue
        resolved_region_names.add(region_name)
        map_name = str(template.get("mapRegionName") or f"map_{region_name}")
        map_template = map_region_templates.get(map_name, {})
        display_name = dict(sorted((localizations.get(region_name) or {}).items()))
        if not display_name and template.get("primaryCity"):
            display_name = {"en": str(template["primaryCity"])}
        owner_tag = initial_owners.get(region_name, "")
        if not owner_tag:
            raise ValueError(
                f"No {scenario_year} initial-owner Claim found for region template "
                f"{template.get('dataName') or region_name}"
            )
        owner_name = nation_display_names.get(owner_tag, "") if owner_tag else ""
        geometry_region_name = canonical_map_region_name(map_name, region_name)
        if not geometry_region_name:
            raise ValueError(
                f"No canonical map region name for region template "
                f"{template.get('dataName') or region_name}"
            )
        if geometry_region_name in metadata:
            raise ValueError(
                f"Multiple {scenario_year} region templates resolve to map region {geometry_region_name}"
            )
        metadata[geometry_region_name] = {
            "regionName": geometry_region_name,
            "displayName": display_name,
            "primaryCity": template.get("primaryCity"),
            "sortNation": template.get("sortNation"),
            "mapRegionName": map_name,
            "friendlyNationName": map_template.get("friendlyNationName") if isinstance(map_template, dict) else None,
            "nationTag": owner_tag,
            "ownerName": owner_name,
            "sourceDataName": template.get("dataName"),
        }
    missing_templates = sorted(set(initial_owners) - resolved_region_names)
    if missing_templates:
        raise ValueError(
            f"{scenario_year} initial-owner Claims reference unknown region templates: "
            f"{missing_templates[:5]}"
        )
    return metadata


def parse_path_points(path: str) -> list[tuple[float, float]]:
    values = [float(item) for item in re.findall(r"-?\d+(?:\.\d+)?", path)]
    return list(zip(values[0::2], values[1::2]))


def compact_region_geometry(region: dict[str, Any]) -> tuple[list[str], list[tuple[float, float]], int, list[dict[str, Any]]]:
    def anchor_xy(anchor: Any) -> tuple[float, float] | None:
        if isinstance(anchor, dict) and "x" in anchor and "y" in anchor:
            return float(anchor["x"]), float(anchor["y"])
        if isinstance(anchor, (list, tuple)) and len(anchor) >= 2:
            return float(anchor[0]), float(anchor[1])
        return None

    if isinstance(region.get("path"), str):
        points = parse_path_points(region["path"])
        labels = [
            {**label, "name": clean_data_string(str(label.get("name") or region.get("regionName") or ""))}
            for label in list(region.get("labels") or [])
            if isinstance(label, dict)
        ]
        return [region["path"]], points, int(region.get("points") or len(points)), labels

    paths: list[str] = []
    points_for_bounds: list[tuple[float, float]] = []
    total_points = 0
    for poly in region.get("poly2DList", []):
        if isinstance(poly, dict):
            raw_points = poly.get("data")
        else:
            raw_points = poly
        if not isinstance(raw_points, list) or len(raw_points) < 3:
            continue

        points = []
        for point in raw_points:
            if not isinstance(point, dict):
                continue
            xy = anchor_xy(point.get("anchor"))
            if xy is not None:
                points.append(xy)
        deduped = []
        last_key = None
        for x, y in points:
            key = (round(x, 6), round(y, 6))
            if key != last_key:
                deduped.append((x, y))
                last_key = key
        if len(deduped) >= 3:
            paths.append("M " + " L ".join(f"{x:.6f} {y:.6f}" for x, y in deduped) + " Z")
            total_points += len(deduped)
            points_for_bounds.extend(deduped)
    labels = []
    for label in region.get("labelPositions", []):
        if not isinstance(label, dict):
            continue
        pos = label.get("pos") or label.get("labelPosition") or label.get("position")
        xy = anchor_xy(pos.get("anchor")) if isinstance(pos, dict) else None
        if xy is None:
            continue
        x, y = xy
        labels.append({
            "name": clean_data_string(str(label.get("name") or label.get("labelName") or region["regionName"])),
            "x": x,
            "y": y,
        })
    return paths, points_for_bounds, total_points, labels


def quantized_points(points: list[tuple[float, float]], scale: float = 0.003) -> set[tuple[int, int]]:
    return {(round(x / scale), round(y / scale)) for x, y in points}


def build_nation_adjacency(region_entries: list[dict[str, Any]], point_sets: list[set[tuple[int, int]]]) -> dict[str, set[str]]:
    adjacency: dict[str, set[str]] = collections.defaultdict(set)
    for i, left in enumerate(region_entries):
        left_tag = left.get("nationTag")
        if not left_tag:
            continue
        left_points = point_sets[i]
        if not left_points:
            continue
        for j in range(i + 1, len(region_entries)):
            right = region_entries[j]
            right_tag = right.get("nationTag")
            if not right_tag or right_tag == left_tag:
                continue
            right_points = point_sets[j]
            if left_points & right_points:
                adjacency[left_tag].add(right_tag)
                adjacency[right_tag].add(left_tag)
    return adjacency


def stable_hash(value: str) -> int:
    h = 0
    for char in str(value):
        h = (h * 31 + ord(char)) & 0xFFFFFFFF
    return h


def assign_nation_color_indexes(region_entries: list[dict[str, Any]], point_sets: list[set[tuple[int, int]]]) -> tuple[dict[str, int], dict[str, set[str]]]:
    adjacency = build_nation_adjacency(region_entries, point_sets)
    tags = sorted({str(row.get("nationTag")) for row in region_entries if row.get("nationTag")})
    assigned: dict[str, int] = {}
    order = sorted(tags, key=lambda tag: (-len(adjacency.get(tag, set())), tag))
    for tag in order:
        neighbors = adjacency.get(tag, set())
        best_color = 0
        best_score = math.inf
        offset = stable_hash(tag) % len(NATION_COLOR_PALETTE)
        for step in range(len(NATION_COLOR_PALETTE)):
            color = (offset + step) % len(NATION_COLOR_PALETTE)
            conflicts = sum(1 for neighbor in neighbors if assigned.get(neighbor) == color)
            if conflicts < best_score:
                best_color = color
                best_score = conflicts
                if conflicts == 0:
                    break
        assigned[tag] = best_color
    return assigned, adjacency


def compact_region_outlines(
    raw: dict[str, Any],
    *,
    region_metadata: dict[str, dict[str, Any]] | None = None,
    scenario_year: str = DEFAULT_SCENARIO_YEAR,
) -> dict[str, Any]:
    raw_regions = raw.get("regions")
    if not isinstance(raw_regions, list):
        raise ValueError("No regions array found in region outline data.")

    regions = []
    all_x: list[float] = []
    all_y: list[float] = []
    point_sets: list[set[tuple[int, int]]] = []

    for index, region in enumerate(raw_regions):
        paths, points_for_bounds, total_points, labels = compact_region_geometry(region)
        if not paths or not points_for_bounds:
            continue
        all_x.extend(x for x, _ in points_for_bounds)
        all_y.extend(y for _, y in points_for_bounds)
        region_name = norm_id(region["regionName"])
        metadata = (region_metadata or {}).get(region_name, {})
        raw_display_name = metadata.get("displayName") if isinstance(metadata.get("displayName"), dict) else {}
        display_name = {str(lang): clean_data_string(str(value)) for lang, value in raw_display_name.items()}
        display_en = clean_data_string(str(display_name.get("en") or metadata.get("primaryCity") or region_name))
        nation_tag = clean_data_string(str(metadata.get("nationTag") or region.get("nationTag") or ""))
        enriched_labels = [{**label, "name": display_en} for label in labels[:2]]
        entry = {
            "id": int(region.get("id", index)),
            "name": f"{nation_tag} - {display_en}" if nation_tag else clean_data_string(str(region.get("name") or region_name)),
            "regionName": region_name,
            "displayName": display_name,
            "primaryCity": clean_data_string(str(metadata.get("primaryCity") or display_en)),
            "nationTag": nation_tag,
            "outlineNationTag": clean_data_string(str(region.get("outlineNationTag") or region.get("nationTag") or "")),
            "ownerName": clean_data_string(str(metadata.get("ownerName") or "")),
            "path": " ".join(paths),
            "polygons": int(region.get("polygons") or len(paths)),
            "points": total_points,
            "shapes": int(region.get("shapes") or len(region.get("regionShapes", []))),
            "surfaceShapes": int(region.get("surfaceShapes") or len(region.get("regionSurfacePoints", []))),
            "labels": enriched_labels,
        }
        if metadata.get("sourceDataName"):
            entry["source"] = {
                "regionTemplate": clean_data_string(str(metadata.get("sourceDataName"))),
                "mapRegionTemplate": clean_data_string(str(metadata.get("mapRegionName"))),
            }
        regions.append(entry)
        point_sets.append(quantized_points(points_for_bounds))

    if not regions or not all_x or not all_y:
        raise ValueError("No usable polygon points found in raw region outline data.")

    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    pad_x = (max_x - min_x) * 0.005
    pad_y = (max_y - min_y) * 0.035
    view_box = [min_x - pad_x, min_y - pad_y, (max_x - min_x) + 2 * pad_x, (max_y - min_y) + 2 * pad_y]
    color_indexes, nation_adjacency = assign_nation_color_indexes(regions, point_sets)
    adjacency_pairs = [
        [left, right]
        for left, neighbors in sorted(nation_adjacency.items())
        for right in sorted(neighbors)
        if left < right
    ]
    summary = {
        "collectionName": raw.get("collectionName") or raw.get("summary", {}).get("collectionName") or "EarthRegionOutlines",
        "scenarioYear": scenario_year,
        "regions": len(regions),
        "width": raw.get("width") or raw.get("summary", {}).get("width"),
        "height": raw.get("height") or raw.get("summary", {}).get("height"),
        "polygons": sum(region["polygons"] for region in regions),
        "points": sum(region["points"] for region in regions),
        "nationTags": len({region["nationTag"] for region in regions}),
        "nationColorPalette": NATION_COLOR_PALETTE,
        "nationColorIndexes": dict(sorted(color_indexes.items())),
        "nationAdjacencyPairs": adjacency_pairs,
        "viewBox": view_box,
    }
    return {"summary": summary, "regions": regions}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw-json", required=True, help="Raw or compacted region outline JSON.")
    parser.add_argument("--output", default="data/generated/region_map.generated.json")
    parser.add_argument("--templates-dir", help="Path to TerraInvicta_Data/StreamingAssets/Templates.")
    parser.add_argument("--scenario-year", default=DEFAULT_SCENARIO_YEAR, choices=SCENARIO_YEARS)
    parser.add_argument("--languages", default="kor,en", help="Comma-separated localization languages to include.")
    parser.add_argument("--nation-display-overrides", default=str(DEFAULT_NATION_DISPLAY_OVERRIDES), help="Optional manual nation display-name override JSON.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        templates_dir = resolve_templates_dir(args.templates_dir)
        nation_display_overrides = load_nation_display_overrides(Path(args.nation_display_overrides))
        region_metadata = (
            load_region_metadata(templates_dir, parse_languages(args.languages), args.scenario_year, nation_display_overrides)
            if templates_dir
            else {}
        )
        data = compact_region_outlines(
            load_json(Path(args.raw_json)),
            region_metadata=region_metadata,
            scenario_year=args.scenario_year,
        )
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {output}")
    print(json.dumps(data["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
