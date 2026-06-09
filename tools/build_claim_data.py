#!/usr/bin/env python3
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
import os
from pathlib import Path
from typing import Any


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any, *, compact: bool = True) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    else:
        text = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True)
    path.write_text(text + ("" if compact else "\n"), encoding="utf-8")


def norm_id(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"^(?:2026|2070)_", "", str(value))


def normalize_string_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if item]
    if isinstance(value, str) and value:
        return [value]
    return []


def parse_languages(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def candidate_templates_dirs() -> list[Path]:
    env = os.environ.get("TI_TEMPLATES_DIR")
    candidates = [
        Path.home() / ".steam/steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates",
        Path.home() / ".local/share/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates",
        Path("C:/Program Files (x86)/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates"),
        Path("C:/Program Files/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates"),
        Path("D:/SteamLibrary/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates"),
        Path("E:/SteamLibrary/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates"),
    ]
    return ([Path(env)] if env else []) + candidates


def resolve_templates_dir(templates_arg: str | None) -> Path | None:
    if templates_arg:
        path = Path(templates_arg).expanduser()
        if not path.is_dir():
            raise SystemExit(f"Templates directory not found: {path}")
        return path
    for path in candidate_templates_dirs():
        if (path / "TIProjectTemplate.json").is_file():
            return path
    return None


def read_localization_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    with path.open("r", encoding="utf-8-sig") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    return values


def load_project_localizations(templates_dir: Path, languages: list[str]) -> dict[str, dict[str, str]]:
    root = templates_dir.parent / "Localization"
    localizations: dict[str, dict[str, str]] = {}
    for language in languages:
        values = read_localization_file(root / language / f"TIProjectTemplate.{language}")
        for key, value in values.items():
            parts = key.split(".")
            if len(parts) != 3 or parts[0] != "TIProjectTemplate" or parts[1] != "displayName":
                continue
            _, _, data_name = parts
            localizations.setdefault(data_name, {})[language] = value
    return localizations


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
            localizations.setdefault(data_name, {})[language] = value
    return localizations


def load_nation_metadata(templates_dir: Path | None, languages: list[str]) -> dict[str, dict[str, Any]]:
    if templates_dir is None:
        return {}
    path = templates_dir / "TINationTemplate.json"
    if not path.is_file():
        return {}
    templates = load_json(path)
    localizations = load_nation_localizations(templates_dir, languages)
    metadata: dict[str, dict[str, Any]] = {}
    for template in templates if isinstance(templates, list) else []:
        if not isinstance(template, dict) or not template.get("dataName") or template.get("disable"):
            continue
        nation = str(template["dataName"])
        metadata[nation] = {
            "tag": nation,
            "displayName": localizations.get(nation, {}),
            "friendlyName": template.get("friendlyName"),
            "factionName": template.get("factionName"),
        }
    return metadata


def load_project_metadata(templates_dir: Path | None, languages: list[str]) -> dict[str, dict[str, Any]]:
    if templates_dir is None:
        return {}
    path = templates_dir / "TIProjectTemplate.json"
    if not path.is_file():
        return {}
    templates = load_json(path)
    localizations = load_project_localizations(templates_dir, languages)
    metadata: dict[str, dict[str, Any]] = {}
    for template in templates if isinstance(templates, list) else []:
        if not isinstance(template, dict) or not template.get("dataName") or template.get("disable"):
            continue
        project = str(template["dataName"])
        prereqs = normalize_string_list(template.get("prereqs"))
        alt_prereq = template.get("altPrereq0")
        if alt_prereq:
            prereqs.append(str(alt_prereq))
        metadata[project] = {
            "displayName": localizations.get(project, {}),
            "friendlyName": template.get("friendlyName"),
            "researchCost": template.get("researchCost"),
            "category": template.get("techCategory"),
            "prerequisiteNodes": sorted(set(prereqs)),
        }
    return metadata


def project_label(project_id: str, project_template_meta: dict[str, dict[str, Any]] | None) -> str:
    if not project_id:
        return "기본 claim / no research"
    label = None
    if project_template_meta:
        meta = project_template_meta.get(project_id) or {}
        display_name = meta.get("displayName") or {}
        label = display_name.get("kor") or display_name.get("en") or meta.get("friendlyName")
    if label:
        return label
    label = project_id.replace("Project_", "").replace("_", " ")
    return re.sub(r"(?<=[a-z])(?=[A-Z])", " ", label)


def build_claim_data(
    *,
    region_map: dict[str, Any],
    bilateral_rows: list[dict[str, Any]],
    aliases: dict[str, str],
    project_template_meta: dict[str, dict[str, Any]] | None,
    nation_template_meta: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    regions = region_map["regions"]
    summary = dict(region_map["summary"])

    def norm_region_id(value: Any) -> str:
        raw = norm_id(value)
        return aliases.get(raw, raw)

    region_by_name = {region["regionName"]: region for region in regions}
    outline_nation_by_region = {
        region["regionName"]: norm_id(region.get("nationTag")) for region in regions
    }
    nation_initial_regions: dict[str, set[str]] = collections.defaultdict(set)
    for region in regions:
        nation_initial_regions[norm_id(region.get("nationTag"))].add(region["regionName"])

    breakaway_from: dict[str, str] = {}
    breakaway_rows: list[dict[str, str]] = []
    for row in bilateral_rows:
        if row.get("relationType") != "Breakaway":
            continue
        nation = norm_id(row.get("nation1"))
        parent = norm_id(row.get("nation2"))
        if not nation or not parent or breakaway_from.get(nation) == parent:
            continue
        breakaway_from[nation] = parent
        breakaway_rows.append({"dataName": row.get("dataName") or "", "nation": nation, "parent": parent})

    claim_rows: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for row in bilateral_rows:
        if row.get("relationType") != "Claim":
            continue
        nation = norm_id(row.get("nation1"))
        region_raw = norm_id(row.get("region1"))
        region = norm_region_id(row.get("region1"))
        project = row.get("projectUnlockName") or ""
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
        claim_rows.append(
            {
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
            }
        )

    claims_by_nation_project: dict[str, dict[str, dict[str, Any]]] = collections.defaultdict(
        lambda: collections.defaultdict(dict)
    )
    base_claims_by_nation: dict[str, dict[str, Any]] = collections.defaultdict(dict)
    unmatched: list[dict[str, Any]] = []

    for claim in claim_rows:
        if not claim["matchedRegion"]:
            unmatched.append(claim)
            continue
        claim_payload = {
            "capitalClaim": claim["capitalClaim"],
            "hostileClaim": claim["hostileClaim"],
            "currentOwner": claim["currentOwner"],
            "initialOwner": claim["initialOwner"],
            "initialColony": claim["initialColony"],
            "regionRaw": claim.get("regionRaw") or claim["region"],
            "claimKind": "hostile" if claim["hostileClaim"] else "peaceful",
            "gatedClaim": claim["gatedClaim"],
        }
        if claim["project"]:
            claims_by_nation_project[claim["nation"]][claim["project"]][claim["region"]] = claim_payload
        else:
            base_claims_by_nation[claim["nation"]][claim["region"]] = claim_payload

    project_meta: dict[str, dict[str, Any]] = {}
    project_counts: collections.Counter[str] = collections.Counter()
    for by_project in claims_by_nation_project.values():
        for project, regs in by_project.items():
            project_counts[project] += len(regs)
            if project in project_meta:
                continue
            meta: dict[str, Any] = {"id": project, "label": project_label(project, project_template_meta)}
            if project_template_meta and project in project_template_meta:
                meta.update(project_template_meta[project])
            project_meta[project] = meta

    for project, meta in project_meta.items():
        meta["claimCount"] = project_counts[project]

    def nation_status(nation: str, base_regions: set[str]) -> str:
        if base_regions and nation in breakaway_from:
            return "breakaway_gated_existing"
        if base_regions:
            return "existing"
        return "formable"

    claims_by_nation: dict[str, Any] = {}
    nation_ids = sorted(
        set(nation_initial_regions) | set(claims_by_nation_project) | set(base_claims_by_nation)
    )
    for nation in nation_ids:
        if not nation:
            continue
        projects = []
        if base_claims_by_nation.get(nation):
            projects.append(
                {
                    "project": "",
                    "label": "기본 claim / no research",
                    "regions": sorted(base_claims_by_nation[nation]),
                    "claims": base_claims_by_nation[nation],
                }
            )
        for project, regs in sorted(
            claims_by_nation_project.get(nation, {}).items(),
            key=lambda item: (
                project_meta.get(item[0], {}).get("researchCost")
                if project_meta.get(item[0], {}).get("researchCost") is not None
                else 9_999_999,
                project_label(item[0], project_template_meta),
            ),
        ):
            projects.append(
                {
                    "project": project,
                    "label": project_meta.get(project, {}).get("label") or project_label(project, project_template_meta),
                    "regions": sorted(regs),
                    "claims": regs,
                }
            )
        base_regions = nation_initial_regions.get(nation, set())
        status = nation_status(nation, base_regions)
        capital_regions = sorted({
            region
            for project in projects
            for region, claim in project["claims"].items()
            if claim.get("capitalClaim")
        })
        gated_regions = sorted({
            region
            for project in projects
            for region, claim in project["claims"].items()
            if claim.get("gatedClaim")
        })
        claims_by_nation[nation] = {
            "nation": nation,
            "status": status,
            "breakawayFrom": breakaway_from.get(nation, ""),
            "baseRegions": sorted(base_regions),
            "capitalRegions": capital_regions,
            "gatedRegions": gated_regions,
            "projects": projects,
            "totalClaimRegions": len({region for project in projects for region in project["regions"]}),
            "projectCount": sum(1 for project in projects if project["project"]),
        }

    stats = {
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
        "gatedClaimRowsNormalized": sum(1 for claim in claim_rows if claim.get("gatedClaim")),
        "existingNationCount": sum(1 for data in claims_by_nation.values() if data.get("status") == "existing"),
        "formableNationCount": sum(1 for data in claims_by_nation.values() if data.get("status") == "formable"),
        "breakawayGatedExistingNationCount": sum(1 for data in claims_by_nation.values() if data.get("status") == "breakaway_gated_existing"),
        "aliasResolvedRows": sum(
            1 for claim in claim_rows if claim.get("regionRaw") and claim["regionRaw"] != claim["region"]
        ),
    }

    return {
        "summary": summary,
        "claimStats": stats,
        "projects": project_meta,
        "nationMeta": {
            nation: {**({"tag": nation}), **((nation_template_meta or {}).get(nation, {}))}
            for nation in nation_ids
            if nation
        },
        "claimsByNation": claims_by_nation,
        "unmatchedExamples": unmatched[:40],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--region-map", default="data/generated/region_map.generated.json")
    parser.add_argument("--bilateral-template", required=True)
    parser.add_argument("--aliases", default="data/manual/region_aliases.json")
    parser.add_argument("--templates-dir", help="Optional local Terra Invicta Templates directory used for project labels, costs, and prerequisites.")
    parser.add_argument("--project-languages", default="kor,en", help="Comma-separated localization languages for --templates-dir project metadata.")
    parser.add_argument("--output", default="data/generated/claim_map.generated.json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    region_map = load_json(Path(args.region_map))
    bilateral_rows = load_json(Path(args.bilateral_template))
    aliases = load_json(Path(args.aliases)) if Path(args.aliases).exists() else {}
    templates_dir = resolve_templates_dir(args.templates_dir)
    languages = parse_languages(args.project_languages)
    project_template_meta = load_project_metadata(templates_dir, languages)
    nation_template_meta = load_nation_metadata(templates_dir, languages)
    data = build_claim_data(
        region_map=region_map,
        bilateral_rows=bilateral_rows,
        aliases=aliases,
        project_template_meta=project_template_meta,
        nation_template_meta=nation_template_meta,
    )
    write_json(Path(args.output), data, compact=True)
    print(f"Wrote {args.output}")
    print(json.dumps(data["claimStats"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
