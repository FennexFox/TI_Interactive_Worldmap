#!/usr/bin/env python3
"""Build a normalized Terra Invicta research/project catalog for the worldmap app."""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any

from catalog_utils import (
    as_float,
    compact_number,
    load_json,
    load_named_templates,
    parse_languages,
    read_localization_file,
    resolve_templates_dir,
    source_fingerprint,
    write_json_output,
)


SCHEMA_VERSION = 1
DEFAULT_OUTPUT = Path("data/generated/research.catalog.json")
RESEARCH_TEMPLATE_FILES = {
    "tech": "TITechTemplate.json",
    "project": "TIProjectTemplate.json",
}
LOCALIZATION_FILES = {
    "tech": "TITechTemplate",
    "project": "TIProjectTemplate",
}


def norm_id(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"^(?:2022|2026|2070)_", "", str(value))


def clean_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): clean_value(item) for key, item in value.items() if item is not None}
    if isinstance(value, list):
        return [clean_value(item) for item in value if item is not None]
    return compact_number(value)


def nonempty_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def normalize_string_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if item]
    if isinstance(value, str) and value:
        return [value]
    return []


def load_research_localizations(
    templates_dir: Path,
    languages: list[str],
) -> dict[str, dict[str, dict[str, dict[str, str]]]]:
    root = templates_dir.parent / "Localization"
    localizations: dict[str, dict[str, dict[str, dict[str, str]]]] = {"tech": {}, "project": {}}
    for kind, prefix in LOCALIZATION_FILES.items():
        for language in languages:
            loc_file = root / language / f"{prefix}.{language}"
            loc_values = read_localization_file(loc_file)
            entries: dict[str, dict[str, str]] = {}
            for key, value in loc_values.items():
                parts = key.split(".")
                if len(parts) != 3 or parts[0] != prefix or parts[1] != "displayName":
                    continue
                _, field, data_name = parts
                entries.setdefault(data_name, {})[field] = value
            localizations[kind][language] = entries
    return localizations


def infer_node_kind(data_name: str) -> str:
    return "project" if data_name.startswith("Project_") else "tech"


def node_requirement(data_name: str) -> dict[str, str]:
    return {"node": data_name, "kind": infer_node_kind(data_name)}


def normalize_requirements(template: dict[str, Any]) -> dict[str, Any]:
    groups: list[dict[str, Any]] = []
    prereqs = normalize_string_list(template.get("prereqs"))
    alt_prereq = template.get("altPrereq0")
    if prereqs:
        first_group = [node_requirement(prereqs[0])]
        if alt_prereq:
            first_group.append(node_requirement(str(alt_prereq)))
        groups.append({"any": first_group} if len(first_group) > 1 else first_group[0])
        groups.extend(node_requirement(name) for name in prereqs[1:])
    elif alt_prereq:
        groups.append(node_requirement(str(alt_prereq)))

    objectives = [
        name
        for name in (template.get("requiredObjectiveName"), template.get("altRequiredObjectiveName"))
        if name
    ]
    if objectives:
        objective_group = [{"objective": str(name)} for name in objectives]
        groups.append({"any": objective_group} if len(objective_group) > 1 else objective_group[0])

    required_milestone = template.get("requiredMilestone")
    if required_milestone:
        groups.append({"milestone": str(required_milestone)})

    factions = normalize_string_list(template.get("factionPrereq"))
    if factions:
        groups.append({"factionAny": factions})

    required_nation = template.get("requiresNation")
    if required_nation:
        groups.append({"nation": str(required_nation)})

    return {"all": groups}


def requirement_nodes(requirement: dict[str, Any]) -> list[str]:
    nodes: set[str] = set()

    def visit(item: Any) -> None:
        if not isinstance(item, dict):
            return
        node = item.get("node")
        if isinstance(node, str):
            nodes.add(node)
        for child in nonempty_list(item.get("all")) + nonempty_list(item.get("any")):
            visit(child)

    visit(requirement)
    return sorted(nodes)


def localized_fields(
    localizations: dict[str, dict[str, dict[str, dict[str, str]]]],
    kind: str,
    data_name: str,
) -> dict[str, str]:
    values: dict[str, str] = {}
    for language, entries in localizations.get(kind, {}).items():
        value = entries.get(data_name, {}).get("displayName")
        if value:
            values[language] = value
    return dict(sorted(values.items()))


def claim_grants_by_project(
    bilateral_rows: list[dict[str, Any]] | None,
    aliases: dict[str, str] | None,
) -> dict[str, dict[str, Any]]:
    grants: dict[str, dict[str, Any]] = {}
    for row in bilateral_rows or []:
        if not isinstance(row, dict) or row.get("relationType") != "Claim":
            continue
        project = row.get("projectUnlockName")
        if not project:
            continue
        project_id = str(project)
        nation = norm_id(row.get("nation1"))
        region_raw = norm_id(row.get("region1"))
        region = (aliases or {}).get(region_raw, region_raw)
        grant = grants.setdefault(project_id, {"claimRows": 0, "nations": set(), "regions": set()})
        grant["claimRows"] += 1
        if nation:
            grant["nations"].add(nation)
        if region:
            grant["regions"].add(region)
    return {
        project: {
            "claimRows": grant["claimRows"],
            "nations": sorted(grant["nations"]),
            "regions": sorted(grant["regions"]),
        }
        for project, grant in sorted(grants.items())
    }


def normalize_research_node(
    template: dict[str, Any],
    kind: str,
    localizations: dict[str, dict[str, dict[str, dict[str, str]]]],
    claim_grants: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    data_name = str(template.get("dataName"))
    requirements = normalize_requirements(template)
    node = {
        "dataName": data_name,
        "kind": kind,
        "friendlyName": template.get("friendlyName"),
        "displayName": localized_fields(localizations, kind, data_name),
        "category": template.get("techCategory"),
        "researchCost": compact_number(as_float(template.get("researchCost"), 0.0)),
        "requirements": requirements,
        "prerequisiteNodes": requirement_nodes(requirements),
        "effects": normalize_string_list(template.get("effects")),
    }
    if kind == "tech":
        node["flags"] = {
            "endGameTech": bool(template.get("endGameTech")),
        }
    else:
        node["flags"] = {
            "oneTimeGlobally": bool(template.get("oneTimeGlobally")),
            "repeatable": bool(template.get("repeatable")),
            "disable": bool(template.get("disable")),
        }
        if data_name in claim_grants:
            node["claimGrant"] = claim_grants[data_name]
    return clean_value(node)


def node_sort_key(node: dict[str, Any]) -> tuple[Any, ...]:
    return (
        0 if node.get("kind") == "tech" else 1,
        node.get("category") or "",
        node.get("researchCost") if isinstance(node.get("researchCost"), (int, float)) else 0,
        node.get("friendlyName") or node.get("dataName"),
    )


def build_graph_links(nodes: list[dict[str, Any]]) -> tuple[list[dict[str, str]], dict[str, list[str]], list[str]]:
    known = {str(node["dataName"]) for node in nodes}
    edges: list[dict[str, str]] = []
    children: dict[str, list[str]] = {}
    unknown: set[str] = set()
    for node in nodes:
        target = str(node["dataName"])
        for prereq in node.get("prerequisiteNodes", []):
            if prereq not in known:
                unknown.add(str(prereq))
            edge = {"from": str(prereq), "to": target}
            edges.append(edge)
            children.setdefault(str(prereq), []).append(target)
    for values in children.values():
        values.sort()
    edges.sort(key=lambda item: (item["from"], item["to"]))
    return edges, dict(sorted(children.items())), sorted(unknown)


def build_catalog(
    templates_dir: Path,
    languages: list[str],
    *,
    bilateral_rows: list[dict[str, Any]] | None = None,
    aliases: dict[str, str] | None = None,
) -> dict[str, Any]:
    localizations = load_research_localizations(templates_dir, languages)
    claim_grants = claim_grants_by_project(bilateral_rows, aliases)
    nodes: list[dict[str, Any]] = []
    for kind, filename in RESEARCH_TEMPLATE_FILES.items():
        templates = load_named_templates(templates_dir, filename)
        for template in templates.values():
            if kind == "project" and template.get("disable"):
                continue
            nodes.append(normalize_research_node(template, kind, localizations, claim_grants))
    nodes.sort(key=node_sort_key)
    edges, children, unknown_prerequisites = build_graph_links(nodes)
    by_data_name = {str(node["dataName"]): index for index, node in enumerate(nodes)}
    counts_by_kind = {
        "tech": sum(1 for node in nodes if node.get("kind") == "tech"),
        "project": sum(1 for node in nodes if node.get("kind") == "project"),
    }
    counts_by_category: dict[str, int] = {}
    for node in nodes:
        category = str(node.get("category") or "None")
        counts_by_category[category] = counts_by_category.get(category, 0) + 1
    return {
        "schemaVersion": SCHEMA_VERSION,
        "source": {
            "templateRoot": "TerraInvicta_Data/StreamingAssets/Templates",
            "techTemplate": source_fingerprint(templates_dir / RESEARCH_TEMPLATE_FILES["tech"]),
            "projectTemplate": source_fingerprint(templates_dir / RESEARCH_TEMPLATE_FILES["project"]),
            "localizationLanguages": languages,
        },
        "notes": [
            "Nodes are static template data; save-specific completion and availability should be evaluated separately.",
            "claimGrant is derived from projectUnlockName claim rows in TIBilateralTemplate.json.",
        ],
        "counts": {
            "total": len(nodes),
            "byKind": counts_by_kind,
            "byCategory": dict(sorted(counts_by_category.items())),
            "edges": len(edges),
            "unknownPrerequisites": len(unknown_prerequisites),
            "claimGrantingProjects": len(claim_grants),
        },
        "nodes": nodes,
        "byDataName": by_data_name,
        "edges": edges,
        "childrenByPrereq": children,
        "unknownPrerequisites": unknown_prerequisites,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--templates-dir", help="Path to TerraInvicta_Data/StreamingAssets/Templates.")
    parser.add_argument("--languages", default="kor,en", help="Comma-separated localization languages to include.")
    parser.add_argument("--bilateral-template", help="Path to TIBilateralTemplate.json.")
    parser.add_argument("--aliases", default="data/manual/region_aliases.json")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    templates_dir = resolve_templates_dir(args.templates_dir)
    if templates_dir is None:
        raise SystemExit("Templates directory not found. Pass --templates-dir.")
    languages = parse_languages(args.languages)
    bilateral_path = Path(args.bilateral_template) if args.bilateral_template else templates_dir / "TIBilateralTemplate.json"
    bilateral_rows = load_json(bilateral_path) if bilateral_path.is_file() else None
    aliases = load_json(Path(args.aliases)) if args.aliases and Path(args.aliases).is_file() else {}
    catalog = build_catalog(templates_dir, languages, bilateral_rows=bilateral_rows, aliases=aliases)
    output = write_json_output(Path(args.output), catalog)
    print(f"Wrote {output}")
    print(f"Nodes: {catalog['counts']['total']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
