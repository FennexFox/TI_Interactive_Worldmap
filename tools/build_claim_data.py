#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Build the Terra Invicta claim/unification map data pack.

The builder intentionally keeps the first pass to direct claims from
TIBilateralTemplate.json. It does not attempt save-aware ownership or recursive
megastate absorption closure.
"""
from __future__ import annotations

import argparse
import collections
import json
import re
from pathlib import Path
from typing import Any, TypedDict

from input_contracts import load_alias_map, load_optional_json, load_required_json, load_template_rows
from scenario_config import DEFAULT_SCENARIO, SUPPORTED_SCENARIOS, strip_scenario_prefix
from scenario_rows import filter_bilateral_rows_for_scenario


def load_json(path: Path) -> Any:
    return load_required_json(path)


def write_json(path: Path, data: Any, *, compact: bool = True) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    else:
        text = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True)
    path.write_text(text + ("" if compact else "\n"), encoding="utf-8")


def norm_id(value: Any) -> str:
    return strip_scenario_prefix(value)


class BreakawayRow(TypedDict):
    dataName: str
    nation: str
    parent: str


class NormalizedClaimRow(TypedDict):
    dataName: Any
    nation: str
    region: str
    regionRaw: str
    project: str
    capitalClaim: bool
    hostileClaim: bool
    initialOwner: bool
    initialColony: bool
    matchedRegion: bool
    currentOwner: str
    gatedClaim: bool


def build_breakaway_index(
    bilateral_rows: list[dict[str, Any]],
) -> tuple[dict[str, str], list[BreakawayRow]]:
    breakaway_from: dict[str, str] = {}
    normalized_rows: list[BreakawayRow] = []
    for row in bilateral_rows:
        if row.get("relationType") != "Breakaway":
            continue
        nation = norm_id(row.get("nation1"))
        parent = norm_id(row.get("nation2"))
        if not nation or not parent or breakaway_from.get(nation) == parent:
            continue
        breakaway_from[nation] = parent
        normalized_rows.append({
            "dataName": str(row.get("dataName") or ""),
            "nation": nation,
            "parent": parent,
        })
    return breakaway_from, normalized_rows


def normalize_claim_rows(
    bilateral_rows: list[dict[str, Any]],
    aliases: dict[str, str],
    region_by_name: dict[str, dict[str, Any]],
    outline_nation_by_region: dict[str, str],
    breakaway_from: dict[str, str],
) -> list[NormalizedClaimRow]:
    normalized: list[NormalizedClaimRow] = []
    seen: set[tuple[Any, ...]] = set()
    for row in bilateral_rows:
        if row.get("relationType") != "Claim":
            continue
        nation = norm_id(row.get("nation1"))
        region_raw = norm_id(row.get("region1"))
        region = aliases.get(region_raw, region_raw)
        project = str(row.get("projectUnlockName") or "")
        key = (
            nation,
            region,
            project,
            bool(row.get("capitalClaim")),
            bool(row.get("hostileClaim")),
            bool(row.get("initialOwner")),
            bool(row.get("initialColony")),
        )
        if key in seen:
            continue
        seen.add(key)
        normalized.append({
            "dataName": row.get("dataName"),
            "nation": nation,
            "region": region,
            "regionRaw": region_raw,
            "project": project,
            "capitalClaim": bool(row.get("capitalClaim")),
            "hostileClaim": bool(row.get("hostileClaim")),
            "initialOwner": bool(row.get("initialOwner")),
            "initialColony": bool(row.get("initialColony")),
            "matchedRegion": region in region_by_name,
            "currentOwner": outline_nation_by_region.get(region, ""),
            "gatedClaim": bool(project and nation in breakaway_from),
        })
    return normalized


def group_claim_rows(
    claim_rows: list[NormalizedClaimRow],
) -> tuple[
    dict[str, dict[str, dict[str, dict[str, Any]]]],
    dict[str, dict[str, dict[str, Any]]],
    list[NormalizedClaimRow],
]:
    by_nation_project: dict[str, dict[str, dict[str, dict[str, Any]]]] = collections.defaultdict(
        lambda: collections.defaultdict(dict)
    )
    base_by_nation: dict[str, dict[str, dict[str, Any]]] = collections.defaultdict(dict)
    unmatched: list[NormalizedClaimRow] = []
    for claim in claim_rows:
        if not claim["matchedRegion"]:
            unmatched.append(claim)
            continue
        payload = {
            "capitalClaim": claim["capitalClaim"],
            "hostileClaim": claim["hostileClaim"],
            "currentOwner": claim["currentOwner"],
            "initialOwner": claim["initialOwner"],
            "initialColony": claim["initialColony"],
            "regionRaw": claim["regionRaw"] or claim["region"],
            "claimKind": "hostile" if claim["hostileClaim"] else "peaceful",
            "gatedClaim": claim["gatedClaim"],
        }
        if claim["project"]:
            by_nation_project[claim["nation"]][claim["project"]][claim["region"]] = payload
        else:
            base_by_nation[claim["nation"]][claim["region"]] = payload
    return by_nation_project, base_by_nation, unmatched


def catalog_nation_metadata(nation_catalog: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    nations = (nation_catalog or {}).get("nations")
    if not isinstance(nations, dict):
        return {}
    return {
        str(tag): meta
        for tag, meta in nations.items()
        if isinstance(meta, dict)
    }


def project_metadata_from_research_catalog(research_catalog: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    nodes = (research_catalog or {}).get("nodes")
    if not isinstance(nodes, list):
        return {}
    metadata: dict[str, dict[str, Any]] = {}
    for node in nodes:
        if not isinstance(node, dict) or node.get("kind") != "project" or not node.get("dataName"):
            continue
        project = str(node["dataName"])
        metadata[project] = {
            "displayName": node.get("displayName") or {},
            "summary": node.get("summary") or {},
            "friendlyName": node.get("friendlyName"),
            "researchCost": node.get("researchCost"),
            "category": node.get("category"),
            "prerequisiteNodes": node.get("prerequisiteNodes") or [],
            "requirements": node.get("requirements") or {"all": []},
            "claimGrant": node.get("claimGrant") or {},
        }
    return metadata


def project_label(project_id: str, project_template_meta: dict[str, dict[str, Any]] | None) -> str:
    if not project_id:
        return "Base claim / no research"
    label = None
    if project_template_meta:
        meta = project_template_meta.get(project_id) or {}
        display_name = meta.get("displayName") or {}
        label = display_name.get("kor") or display_name.get("en") or meta.get("friendlyName")
    if label:
        return label
    label = project_id.replace("Project_", "").replace("_", " ")
    return re.sub(r"(?<=[a-z])(?=[A-Z])", " ", label)


def build_project_claim_metadata(
    claims_by_nation_project: dict[str, dict[str, dict[str, dict[str, Any]]]],
    project_template_meta: dict[str, dict[str, Any]] | None,
) -> dict[str, dict[str, Any]]:
    project_meta: dict[str, dict[str, Any]] = {}
    project_counts: collections.Counter[str] = collections.Counter()
    for by_project in claims_by_nation_project.values():
        for project, regions in by_project.items():
            project_counts[project] += len(regions)
            if project in project_meta:
                continue
            meta: dict[str, Any] = {"id": project, "label": project_label(project, project_template_meta)}
            if project_template_meta and project in project_template_meta:
                meta.update(project_template_meta[project])
            project_meta[project] = meta
    for project, meta in project_meta.items():
        meta["claimCount"] = project_counts[project]
    return project_meta


def build_nation_profiles(
    nation_initial_regions: dict[str, set[str]],
    claims_by_nation_project: dict[str, dict[str, dict[str, dict[str, Any]]]],
    base_claims_by_nation: dict[str, dict[str, dict[str, Any]]],
    breakaway_from: dict[str, str],
    project_meta: dict[str, dict[str, Any]],
    project_template_meta: dict[str, dict[str, Any]] | None,
) -> tuple[dict[str, dict[str, Any]], list[str]]:
    claims_by_nation: dict[str, dict[str, Any]] = {}
    nation_ids = sorted(
        set(nation_initial_regions) | set(claims_by_nation_project) | set(base_claims_by_nation)
    )
    for nation in nation_ids:
        if not nation:
            continue
        projects: list[dict[str, Any]] = []
        if base_claims_by_nation.get(nation):
            projects.append({
                "project": "",
                "label": "Base claim / no research",
                "regions": sorted(base_claims_by_nation[nation]),
                "claims": base_claims_by_nation[nation],
            })
        for project, regions in sorted(
            claims_by_nation_project.get(nation, {}).items(),
            key=lambda item: (
                project_meta.get(item[0], {}).get("researchCost")
                if project_meta.get(item[0], {}).get("researchCost") is not None
                else 9_999_999,
                project_label(item[0], project_template_meta),
            ),
        ):
            projects.append({
                "project": project,
                "label": project_meta.get(project, {}).get("label")
                or project_label(project, project_template_meta),
                "regions": sorted(regions),
                "claims": regions,
            })
        base_regions = nation_initial_regions.get(nation, set())
        status = (
            "breakaway_gated_existing"
            if base_regions and nation in breakaway_from
            else "existing"
            if base_regions
            else "formable"
        )
        claims_by_nation[nation] = {
            "nation": nation,
            "status": status,
            "breakawayFrom": breakaway_from.get(nation, ""),
            "baseRegions": sorted(base_regions),
            "capitalRegions": sorted({
                region
                for project in projects
                for region, claim in project["claims"].items()
                if claim.get("capitalClaim")
            }),
            "gatedRegions": sorted({
                region
                for project in projects
                for region, claim in project["claims"].items()
                if claim.get("gatedClaim")
            }),
            "projects": projects,
            "totalClaimRegions": len({
                region for project in projects for region in project["regions"]
            }),
            "projectCount": sum(1 for project in projects if project["project"]),
        }
    return claims_by_nation, nation_ids


def build_claim_stats(
    bilateral_rows: list[dict[str, Any]],
    breakaway_rows: list[BreakawayRow],
    claim_rows: list[NormalizedClaimRow],
    project_meta: dict[str, dict[str, Any]],
    claims_by_nation: dict[str, dict[str, Any]],
    unmatched: list[NormalizedClaimRow],
) -> dict[str, Any]:
    return {
        "bilateralRows": len(bilateral_rows),
        "claimRowsRaw": sum(1 for row in bilateral_rows if row.get("relationType") == "Claim"),
        "breakawayRowsRaw": sum(1 for row in bilateral_rows if row.get("relationType") == "Breakaway"),
        "breakawayRowsNormalized": len(breakaway_rows),
        "claimRowsNormalized": len(claim_rows),
        "projectClaimRowsNormalized": sum(1 for claim in claim_rows if claim["project"]),
        "noResearchClaimRowsNormalized": sum(1 for claim in claim_rows if not claim["project"]),
        "hostileClaimRowsNormalized": sum(1 for claim in claim_rows if claim["hostileClaim"]),
        "peacefulClaimRowsNormalized": sum(1 for claim in claim_rows if not claim["hostileClaim"]),
        "projectCount": len(project_meta),
        "nationsWithProjectClaims": sum(1 for data in claims_by_nation.values() if data["projectCount"]),
        "regionsMatched": sum(1 for claim in claim_rows if claim["matchedRegion"]),
        "regionsUnmatched": len(unmatched),
        "gatedClaimRowsNormalized": sum(1 for claim in claim_rows if claim["gatedClaim"]),
        "existingNationCount": sum(
            1 for data in claims_by_nation.values() if data.get("status") == "existing"
        ),
        "formableNationCount": sum(
            1 for data in claims_by_nation.values() if data.get("status") == "formable"
        ),
        "breakawayGatedExistingNationCount": sum(
            1
            for data in claims_by_nation.values()
            if data.get("status") == "breakaway_gated_existing"
        ),
        "aliasResolvedRows": sum(
            1
            for claim in claim_rows
            if claim["regionRaw"] and claim["regionRaw"] != claim["region"]
        ),
    }


def serialize_claim_data(
    *,
    summary: dict[str, Any],
    stats: dict[str, Any],
    project_meta: dict[str, dict[str, Any]],
    nation_ids: list[str],
    nation_template_meta: dict[str, dict[str, Any]] | None,
    claims_by_nation: dict[str, dict[str, Any]],
    unmatched: list[NormalizedClaimRow],
) -> dict[str, Any]:
    return {
        "summary": summary,
        "claimStats": stats,
        "projects": project_meta,
        "nationMeta": {
            nation: {"tag": nation, **((nation_template_meta or {}).get(nation, {}))}
            for nation in sorted(set(nation_ids) | set(nation_template_meta or {}))
            if nation
        },
        "claimsByNation": claims_by_nation,
        "unmatchedExamples": unmatched[:40],
    }


def build_claim_data(
    *,
    region_map: dict[str, Any],
    bilateral_rows: list[dict[str, Any]],
    aliases: dict[str, str],
    project_template_meta: dict[str, dict[str, Any]] | None,
    nation_template_meta: dict[str, dict[str, Any]] | None = None,
    scenario_year: str | None = None,
) -> dict[str, Any]:
    bilateral_rows = filter_bilateral_rows_for_scenario(
        bilateral_rows,
        scenario_year,
        relation_types=("Claim", "Breakaway"),
    )
    regions = region_map["regions"]
    summary = dict(region_map["summary"])

    region_by_name = {region["regionName"]: region for region in regions}
    outline_nation_by_region = {
        region["regionName"]: norm_id(region.get("nationTag")) for region in regions
    }
    nation_initial_regions: dict[str, set[str]] = collections.defaultdict(set)
    for region in regions:
        nation_initial_regions[norm_id(region.get("nationTag"))].add(region["regionName"])

    breakaway_from, breakaway_rows = build_breakaway_index(bilateral_rows)
    claim_rows = normalize_claim_rows(
        bilateral_rows,
        aliases,
        region_by_name,
        outline_nation_by_region,
        breakaway_from,
    )
    claims_by_nation_project, base_claims_by_nation, unmatched = group_claim_rows(claim_rows)

    project_meta = build_project_claim_metadata(claims_by_nation_project, project_template_meta)

    claims_by_nation, nation_ids = build_nation_profiles(
        nation_initial_regions,
        claims_by_nation_project,
        base_claims_by_nation,
        breakaway_from,
        project_meta,
        project_template_meta,
    )
    stats = build_claim_stats(
        bilateral_rows,
        breakaway_rows,
        claim_rows,
        project_meta,
        claims_by_nation,
        unmatched,
    )
    return serialize_claim_data(
        summary=summary,
        stats=stats,
        project_meta=project_meta,
        nation_ids=nation_ids,
        nation_template_meta=nation_template_meta,
        claims_by_nation=claims_by_nation,
        unmatched=unmatched,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--region-map", default="data/generated/region_map.generated.json")
    parser.add_argument("--bilateral-template", required=True)
    parser.add_argument("--aliases", default="data/manual/region_aliases.json")
    parser.add_argument("--nation-catalog", default="data/generated/nations.catalog.json")
    parser.add_argument("--research-catalog", default="data/generated/research.catalog.json")
    parser.add_argument("--scenario-year", default=DEFAULT_SCENARIO, choices=SUPPORTED_SCENARIOS)
    parser.add_argument("--output", default="data/generated/claim_map.generated.json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    region_map = load_required_json(Path(args.region_map), expected_type=dict)
    bilateral_rows = load_template_rows(Path(args.bilateral_template))
    aliases = load_alias_map(Path(args.aliases))
    nation_catalog = load_optional_json(Path(args.nation_catalog), default={}, expected_type=dict)
    research_catalog = load_optional_json(Path(args.research_catalog), default={}, expected_type=dict)
    project_template_meta = project_metadata_from_research_catalog(research_catalog)
    nation_template_meta = catalog_nation_metadata(nation_catalog)
    data = build_claim_data(
        region_map=region_map,
        bilateral_rows=bilateral_rows,
        aliases=aliases,
        project_template_meta=project_template_meta,
        nation_template_meta=nation_template_meta,
        scenario_year=args.scenario_year,
    )
    write_json(Path(args.output), data, compact=True)
    print(f"Wrote {args.output}")
    print(json.dumps(data["claimStats"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
