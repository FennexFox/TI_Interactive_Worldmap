#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Lightweight deterministic checks for generated worldmap outputs."""
from __future__ import annotations

import base64
import gzip
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_SCENARIOS = ("2022", "2026", "2070")
DEFAULT_SCENARIO = "2026"
INLINE_DATA_COMMENT_RE = re.compile(r"(^|\s)//")
JS_IMPORT_RE = re.compile(r"import\s+(?:[^;]*?\s+from\s+)?[\"'](\.[^\"']+)[\"']\s*;", re.DOTALL)
GENERATED_DATA_CHUNKS_RE = re.compile(r"const compressed = \[\s*(.*?)\s*\]\.join", re.DOTALL)
EXPECTED_MODULE_ASSETS = (
    "docs/assets/app.js",
    "docs/assets/state/app-state.js",
    "docs/assets/state/map-visual-state.js",
    "docs/assets/data/active-data.js",
    "docs/assets/data/derived-indices.js",
    "docs/assets/render/map-layers.js",
)


def strings_with_inline_comments(value: object, path: str = "$", limit: int = 5) -> list[str]:
    hits: list[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            hits.extend(strings_with_inline_comments(item, f"{path}.{key}", limit))
            if len(hits) >= limit:
                break
    elif isinstance(value, list):
        for index, item in enumerate(value):
            hits.extend(strings_with_inline_comments(item, f"{path}[{index}]", limit))
            if len(hits) >= limit:
                break
    elif isinstance(value, str) and INLINE_DATA_COMMENT_RE.search(value):
        hits.append(f"{path}: {value!r}")
    return hits[:limit]


def require(condition: bool, message: str) -> None:
    if not condition:
        print(f"ERROR: {message}", file=sys.stderr)
        raise SystemExit(1)


def load_json(path: Path, label: str) -> object:
    require(path.exists(), f"{label} missing")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        require(False, f"{label} is not valid JSON: {exc}")
    raise AssertionError("unreachable")


def verify_relative_js_imports(entry: Path, module_root: Path) -> None:
    root = module_root.resolve()
    stack = [entry.resolve()]
    visited: set[Path] = set()
    while stack:
        path = stack.pop()
        if path in visited:
            continue
        visited.add(path)
        try:
            path.relative_to(root)
        except ValueError:
            require(False, f"module import escapes docs/assets: {path}")
        require(path.exists(), f"module file missing: {path.relative_to(ROOT)}")
        text = path.read_text(encoding="utf-8")
        for match in JS_IMPORT_RE.finditer(text):
            target = (path.parent / match.group(1)).resolve()
            try:
                target.relative_to(root)
            except ValueError:
                require(False, f"relative import escapes docs/assets: {match.group(1)} in {path.relative_to(ROOT)}")
            require(target.exists(), f"relative import target missing: {match.group(1)} in {path.relative_to(ROOT)}")
            stack.append(target)


def object_value(value: object) -> dict[str, object]:
    return value if isinstance(value, dict) else {}


def number_value(mapping: dict[str, object], key: str) -> float:
    value = mapping.get(key)
    return value if isinstance(value, (int, float)) else 0


def list_value(value: object) -> list[object]:
    return value if isinstance(value, list) else []


def json_key(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def require_json_equal(left: object, right: object, message: str) -> None:
    require(json_key(left) == json_key(right), message)


def decode_generated_js_data(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    match = GENERATED_DATA_CHUNKS_RE.search(text)
    require(match is not None, "generated JS data chunks missing")
    chunks = [json.loads(item.group(0)) for item in re.finditer(r'"(?:[^"\\]|\\.)*"', match.group(1))]
    require(chunks, "generated JS data has no payload chunks")
    payload = gzip.decompress(base64.b64decode("".join(chunks))).decode("utf-8")
    return object_value(json.loads(payload))


def display_name(mapping: dict[str, object], language: str) -> str:
    names = object_value(mapping.get("displayName"))
    value = names.get(language)
    return value if isinstance(value, str) else ""


def aliases(mapping: dict[str, object]) -> list[str]:
    return [item for item in list_value(mapping.get("aliases")) if isinstance(item, str)]


def layered_display_name(mapping: dict[str, object], key: str, language: str) -> str:
    names = object_value(mapping.get(key))
    value = names.get(language)
    return value if isinstance(value, str) else ""


def region_by_name(region_map: dict[str, object], name: str) -> dict[str, object]:
    regions = list_value(region_map.get("regions"))
    for row in regions:
        if isinstance(row, dict) and row.get("regionName") == name:
            return row
    return {}


def research_project_ids(research_catalog: dict[str, object]) -> set[str]:
    projects = set()
    for node in list_value(research_catalog.get("nodes")):
        if isinstance(node, dict) and node.get("kind") == "project" and isinstance(node.get("dataName"), str):
            projects.add(str(node["dataName"]))
    return projects


def verify_scenario_entry(scenario: str, entry: dict[str, object]) -> None:
    region = object_value(entry.get("regionMap"))
    claim = object_value(entry.get("claimMap"))
    catalogs = object_value(entry.get("catalogs"))
    nation_catalog = object_value(catalogs.get("nations"))
    research_catalog = object_value(catalogs.get("research"))
    summary = object_value(entry.get("summary"))
    region_summary = object_value(region.get("summary"))
    claim_summary = object_value(claim.get("summary"))
    claim_stats = object_value(claim.get("claimStats"))
    nations = object_value(nation_catalog.get("nations"))
    claims_by_nation = object_value(claim.get("claimsByNation"))
    claim_projects = object_value(claim.get("projects"))
    claim_nation_meta = object_value(claim.get("nationMeta"))
    research_projects = research_project_ids(research_catalog)
    regions = [row for row in list_value(region.get("regions")) if isinstance(row, dict)]
    region_names = {str(row.get("regionName")) for row in regions if row.get("regionName")}

    require(str(region_summary.get("scenarioYear")) == scenario, f"{scenario} region map scenarioYear mismatch")
    require(str(claim_summary.get("scenarioYear")) == scenario, f"{scenario} claim map scenarioYear mismatch")
    require(str(summary.get("scenarioYear")) == scenario, f"{scenario} scenario summary year mismatch")
    require(len(regions) >= 300, f"{scenario} region map unexpectedly small")
    require(len(nations) >= 250, f"{scenario} nation catalog unexpectedly small")
    require(number_value(claim_stats, "claimRowsNormalized") >= 1500, f"{scenario} claim row count unexpectedly small")
    require(claim_stats.get("regionsUnmatched") == 0, f"{scenario} unmatched claim regions remain")

    required_summary_keys = (
        "regionCount",
        "nationCount",
        "claimRowsNormalized",
        "regionsUnmatched",
        "hostileClaimRowsNormalized",
        "peacefulClaimRowsNormalized",
        "projectClaimRowsNormalized",
        "noResearchClaimRowsNormalized",
        "gatedClaimRowsNormalized",
        "projectCount",
        "claimGrantingProjectCount",
    )
    for key in required_summary_keys:
        require(key in summary, f"{scenario} scenario summary missing {key}")
    require(number_value(summary, "regionCount") == len(regions), f"{scenario} scenario summary region count mismatch")
    require(number_value(summary, "nationCount") == len(nations), f"{scenario} scenario summary nation count mismatch")
    require(number_value(summary, "claimRowsNormalized") == number_value(claim_stats, "claimRowsNormalized"), f"{scenario} scenario summary claim count mismatch")
    require(number_value(summary, "regionsUnmatched") == 0, f"{scenario} scenario summary records unmatched rows")

    prefixed_nations = [tag for tag in nations if re.match(r"^(?:2022|2026|2070)_", str(tag))]
    require(not prefixed_nations, f"{scenario} prefixed nation ids leaked: {prefixed_nations[:5]}")
    prefixed_regions = [name for name in region_names if re.match(r"^(?:2022|2026|2070)_", str(name))]
    require(not prefixed_regions, f"{scenario} prefixed region ids leaked: {prefixed_regions[:5]}")

    for project_id in claim_projects:
        require(str(project_id) in research_projects, f"{scenario} claim project missing from research catalog: {project_id}")
    for nation_id, nation_claims in claims_by_nation.items():
        require(str(nation_id) in nations or str(nation_id) in claim_nation_meta, f"{scenario} claim issuer missing from nation metadata: {nation_id}")
        for project in list_value(object_value(nation_claims).get("projects")):
            if not isinstance(project, dict):
                continue
            project_id = str(project.get("project") or "")
            if project_id:
                require(project_id in claim_projects, f"{scenario} nation project missing claim metadata: {project_id}")
                require(project_id in research_projects, f"{scenario} nation project missing research metadata: {project_id}")
            for region_name in list_value(project.get("regions")):
                require(str(region_name) in region_names, f"{scenario} claim target region missing: {region_name}")
            for region_name, payload in object_value(project.get("claims")).items():
                require(str(region_name) in region_names, f"{scenario} claim payload region missing: {region_name}")
                current_owner = str(object_value(payload).get("currentOwner") or "")
                require(not current_owner or current_owner in nations, f"{scenario} current owner missing from nation catalog: {current_owner}")


def main() -> int:
    require((ROOT / "docs/index.html").exists(), "docs/index.html missing")
    require((ROOT / "docs/assets/data.generated.js").exists(), "generated JS data missing")
    for module_asset in EXPECTED_MODULE_ASSETS:
        require((ROOT / module_asset).exists(), f"{module_asset} missing")
    verify_relative_js_imports(ROOT / "docs/assets/app.js", ROOT / "docs/assets")
    require((ROOT / "docs/data/generated/nations.catalog.json").exists(), "docs nation catalog missing")
    require((ROOT / "docs/data/generated/research.catalog.json").exists(), "docs research catalog missing")
    region = object_value(load_json(ROOT / "data/generated/region_map.generated.json", "region map JSON"))
    claim = object_value(load_json(ROOT / "data/generated/claim_map.generated.json", "claim map JSON"))
    nation_catalog = object_value(load_json(ROOT / "data/generated/nations.catalog.json", "nation catalog JSON"))
    research_catalog = object_value(load_json(ROOT / "data/generated/research.catalog.json", "research catalog JSON"))
    scenario_bundle = object_value(load_json(ROOT / "data/generated/scenario_bundle.generated.json", "scenario bundle JSON"))
    docs_region = object_value(load_json(ROOT / "docs/data/region_map.generated.json", "docs region map JSON"))
    docs_claim = object_value(load_json(ROOT / "docs/data/claim_map.generated.json", "docs claim map JSON"))
    docs_nation_catalog = object_value(load_json(ROOT / "docs/data/generated/nations.catalog.json", "docs nation catalog JSON"))
    docs_research_catalog = object_value(load_json(ROOT / "docs/data/generated/research.catalog.json", "docs research catalog JSON"))
    docs_scenario_bundle = object_value(load_json(ROOT / "docs/data/scenario_bundle.generated.json", "docs scenario bundle JSON"))
    generated_js_data = decode_generated_js_data(ROOT / "docs/assets/data.generated.js")
    scenarios = object_value(scenario_bundle.get("scenarios"))
    require(scenario_bundle.get("schemaVersion") == 2, "scenario bundle schemaVersion must be 2")
    require(scenario_bundle.get("defaultScenario") == DEFAULT_SCENARIO, "scenario bundle default scenario must be 2026")
    require(tuple(sorted(scenarios)) == EXPECTED_SCENARIOS, "scenario bundle must contain exactly 2022, 2026, and 2070")
    require_json_equal(scenario_bundle, docs_scenario_bundle, "docs scenario bundle differs from source generated bundle")
    require_json_equal(object_value(generated_js_data.get("scenarios")), scenarios, "generated JS scenario payload differs from source bundle")
    require(generated_js_data.get("defaultScenario") == DEFAULT_SCENARIO, "generated JS default scenario must be 2026")
    default_entry = object_value(scenarios.get(DEFAULT_SCENARIO))
    default_catalogs = object_value(default_entry.get("catalogs"))
    require_json_equal(region, object_value(default_entry.get("regionMap")), "top-level region map must match default 2026 scenario")
    require_json_equal(claim, object_value(default_entry.get("claimMap")), "top-level claim map must match default 2026 scenario")
    require_json_equal(nation_catalog, object_value(default_catalogs.get("nations")), "top-level nation catalog must match default 2026 scenario")
    require_json_equal(research_catalog, object_value(default_catalogs.get("research")), "top-level research catalog must match default 2026 scenario")
    require_json_equal(region, docs_region, "docs region map differs from source")
    require_json_equal(claim, docs_claim, "docs claim map differs from source")
    require_json_equal(nation_catalog, docs_nation_catalog, "docs nation catalog differs from source")
    require_json_equal(research_catalog, docs_research_catalog, "docs research catalog differs from source")
    for scenario, entry in sorted(scenarios.items()):
        verify_scenario_entry(str(scenario), object_value(entry))
    region_summary = object_value(region.get("summary"))
    claim_stats = object_value(claim.get("claimStats"))
    nations = object_value(nation_catalog.get("nations"))
    research_counts = object_value(research_catalog.get("counts"))
    claim_nation_meta = object_value(claim.get("nationMeta"))
    comment_hits = strings_with_inline_comments(region)
    require(not comment_hits, "inline data comments leaked into region map: " + "; ".join(comment_hits))
    require(number_value(region_summary, "regions") >= 300, "region map unexpectedly small")
    require(str(region_summary.get("scenarioYear")) in ("2022", "2026", "2070"), "region map scenarioYear must be one of 2022, 2026, or 2070")
    require(number_value(claim_stats, "claimRowsNormalized") >= 2000, "claim row count unexpectedly small")
    require(claim_stats.get("regionsUnmatched") == 0, "unmatched claim regions remain")
    require(display_name(region_by_name(region, "RockyMountains"), "en") == "Denver", "Rocky Mountains should display as Denver")
    require(display_name(region_by_name(region, "SouthKorea"), "en") == "Seoul", "South Korea region should display as Seoul")
    require(region_by_name(region, "Hijaz").get("nationTag") == "SAU", "Hijaz must be owned by Saudi Arabia")
    require(region_by_name(region, "Ireland").get("nationTag") == "IRL", "Ireland must be owned by Ireland")
    require(region_by_name(region, "Guatemala").get("nationTag") == "GTM", "Guatemala region must use GTM, not Liangguang/GUA")
    require(object_value(region_summary.get("nationColorIndexes")).get("EUA") != object_value(region_summary.get("nationColorIndexes")).get("DEU"), "France and Germany color indexes should differ")
    require(number_value(object_value(nation_catalog.get("counts")), "total") >= 300, "nation catalog unexpectedly small")
    require(number_value(research_counts, "claimGrantingProjects") >= 50, "research catalog missing claim-granting projects")
    require(display_name(object_value(nations.get("CAN")), "en") == "Canada", "CAN official English display name missing")
    require("2026_CAN" not in nations, "prefixed nation template leaked into app-facing catalog")
    require("Canada" in aliases(object_value(nations.get("CAN"))), "Canada alias missing")
    require("United States" in aliases(object_value(nations.get("USA"))), "USA shortened official alias missing")
    require(display_name(object_value(nations.get("CHN")), "en") == "China", "CHN official English display name missing")
    idn_meta = object_value(nations.get("IDN"))
    require(display_name(idn_meta, "en") == "Java", "IDN base display name should remain Java")
    require(layered_display_name(idn_meta, "unionDisplayName", "en") == "Indonesia", "IDN union display name should be Indonesia")
    require(layered_display_name(idn_meta, "displayNameWithArticle", "en") == "Java", "IDN displayNameWithArticle should be preserved")
    require(layered_display_name(idn_meta, "nationAdjective", "en") == "Javanese", "IDN nationAdjective should be preserved")
    require(layered_display_name(idn_meta, "unionDisplayNameWithArticle", "en") == "Indonesia", "IDN unionDisplayNameWithArticle should be preserved")
    require(layered_display_name(idn_meta, "unionAdjective", "en") == "Indonesian", "IDN unionAdjective should be preserved")
    require("Java" in aliases(idn_meta), "IDN Java alias missing")
    require("Indonesia" in aliases(idn_meta), "IDN Indonesia alias missing")
    idn_source = object_value(idn_meta.get("source"))
    require("data/manual/nation_display_overrides.json" not in list_value(idn_source.get("localizationKeys")), "IDN should not depend on manual display override")
    eua_meta = object_value(nations.get("EUA"))
    require(display_name(eua_meta, "en") == "France", "EUA base/current display name should remain France")
    require(layered_display_name(eua_meta, "unionDisplayName", "en") == "European Union", "EUA explicit union display name should be European Union")
    require(layered_display_name(eua_meta, "unionDisplayNameWithArticle", "en") == "the European Union", "EUA unionDisplayNameWithArticle should be preserved")
    require(layered_display_name(eua_meta, "unionAdjective", "en") == "European", "EUA unionAdjective should be preserved")
    require("Senegambia" not in aliases(object_value(nations.get("SEN"))), "SEN must not use region name as nation alias")
    require(display_name(object_value(claim_nation_meta.get("CAN")), "en") == "Canada", "claim map does not expose catalog nation metadata")
    require(display_name(object_value(claim_nation_meta.get("SAU")), "en") == "Saudi Arabia", "Saudi Arabia nation metadata missing")
    require(object_value(object_value(claim.get("claimsByNation")).get("SAU")).get("status") == "existing", "Saudi Arabia should be an existing 2026 nation")
    require("Guatemala" not in list_value(object_value(object_value(claim.get("claimsByNation")).get("GUA")).get("baseRegions")), "Liangguang/GUA must not inherit Guatemala as base territory")
    print("Generated worldmap outputs verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
