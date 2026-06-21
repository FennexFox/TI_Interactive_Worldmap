#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Assemble scenario-aware generated worldmap data from per-scenario outputs."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from catalog_utils import sanitize_data_value


SCHEMA_VERSION = 2
SUPPORTED_SCENARIOS = ("2022", "2026", "2070")
DEFAULT_SCENARIO = "2026"
DEFAULT_BASE_DIR = Path("data/generated/scenarios")
DEFAULT_OUTPUT = Path("data/generated/scenario_bundle.generated.json")


def load_json(path: Path) -> Any:
    return sanitize_data_value(json.loads(path.read_text(encoding="utf-8")))


def write_json(path: Path, value: Any) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return path


def object_value(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def list_value(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def number_value(mapping: dict[str, Any], key: str) -> int | float:
    value = mapping.get(key)
    return value if isinstance(value, (int, float)) else 0


def scenario_summary(
    scenario: str,
    *,
    region_map: dict[str, Any],
    claim_map: dict[str, Any],
    nation_catalog: dict[str, Any],
    research_catalog: dict[str, Any],
) -> dict[str, Any]:
    region_summary = object_value(region_map.get("summary"))
    claim_stats = object_value(claim_map.get("claimStats"))
    nation_counts = object_value(nation_catalog.get("counts"))
    research_counts = object_value(research_catalog.get("counts"))
    regions = list_value(region_map.get("regions"))
    nations = object_value(nation_catalog.get("nations"))
    claim_nations = object_value(claim_map.get("claimsByNation"))
    projects = object_value(claim_map.get("projects"))
    owned_region_count = sum(1 for row in regions if isinstance(row, dict) and row.get("nationTag"))

    return {
        "scenarioYear": scenario,
        "regionCount": len(regions) or number_value(region_summary, "regions"),
        "ownedRegionCount": owned_region_count,
        "nationCount": len(nations) or number_value(nation_counts, "total"),
        "nationCountWithClaims": len(claim_nations),
        "existingNationCount": number_value(claim_stats, "existingNationCount"),
        "formableNationCount": number_value(claim_stats, "formableNationCount"),
        "breakawayGatedExistingNationCount": number_value(claim_stats, "breakawayGatedExistingNationCount"),
        "zeroRegionNationCount": max(
            0,
            number_value(nation_counts, "total") - number_value(nation_counts, "existsAtStart"),
        ),
        "claimRowsNormalized": number_value(claim_stats, "claimRowsNormalized"),
        "regionsMatched": number_value(claim_stats, "regionsMatched"),
        "regionsUnmatched": number_value(claim_stats, "regionsUnmatched"),
        "hostileClaimRowsNormalized": number_value(claim_stats, "hostileClaimRowsNormalized"),
        "peacefulClaimRowsNormalized": number_value(claim_stats, "peacefulClaimRowsNormalized"),
        "projectClaimRowsNormalized": number_value(claim_stats, "projectClaimRowsNormalized"),
        "noResearchClaimRowsNormalized": number_value(claim_stats, "noResearchClaimRowsNormalized"),
        "gatedClaimRowsNormalized": number_value(claim_stats, "gatedClaimRowsNormalized"),
        "projectCount": len(projects) or number_value(claim_stats, "projectCount"),
        "claimGrantingProjectCount": number_value(research_counts, "claimGrantingProjects"),
    }


def scenario_entry(
    scenario: str,
    *,
    region_map: dict[str, Any],
    claim_map: dict[str, Any],
    nation_catalog: dict[str, Any],
    research_catalog: dict[str, Any],
) -> dict[str, Any]:
    return {
        "label": scenario,
        "regionMap": region_map,
        "claimMap": claim_map,
        "catalogs": {
            "nations": nation_catalog,
            "research": research_catalog,
        },
        "summary": scenario_summary(
            scenario,
            region_map=region_map,
            claim_map=claim_map,
            nation_catalog=nation_catalog,
            research_catalog=research_catalog,
        ),
    }


def build_scenario_bundle(
    scenario_data: dict[str, dict[str, Any]],
    *,
    default_scenario: str = DEFAULT_SCENARIO,
    supported_scenarios: tuple[str, ...] = SUPPORTED_SCENARIOS,
) -> dict[str, Any]:
    missing = [scenario for scenario in supported_scenarios if scenario not in scenario_data]
    if missing:
        raise ValueError(f"Missing scenario data for: {', '.join(missing)}")
    if default_scenario not in supported_scenarios:
        raise ValueError(f"Default scenario {default_scenario} is not supported")

    scenarios = {}
    for scenario in supported_scenarios:
        data = scenario_data[scenario]
        scenarios[scenario] = scenario_entry(
            scenario,
            region_map=object_value(data.get("regionMap")),
            claim_map=object_value(data.get("claimMap")),
            nation_catalog=object_value(data.get("nationCatalog")),
            research_catalog=object_value(data.get("researchCatalog")),
        )
    return {
        "schemaVersion": SCHEMA_VERSION,
        "defaultScenario": default_scenario,
        "scenarios": scenarios,
    }


def load_scenario_outputs(base_dir: Path, scenarios: tuple[str, ...] = SUPPORTED_SCENARIOS) -> dict[str, dict[str, Any]]:
    outputs: dict[str, dict[str, Any]] = {}
    for scenario in scenarios:
        scenario_dir = base_dir / scenario
        outputs[scenario] = {
            "regionMap": load_json(scenario_dir / "region_map.generated.json"),
            "claimMap": load_json(scenario_dir / "claim_map.generated.json"),
            "nationCatalog": load_json(scenario_dir / "nations.catalog.json"),
            "researchCatalog": load_json(scenario_dir / "research.catalog.json"),
        }
    return outputs


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-dir", default=str(DEFAULT_BASE_DIR))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--default-scenario", default=DEFAULT_SCENARIO, choices=SUPPORTED_SCENARIOS)
    parser.add_argument("--scenario", action="append", choices=SUPPORTED_SCENARIOS, help="Scenario to include. Defaults to all supported scenarios.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    scenarios = tuple(args.scenario) if args.scenario else SUPPORTED_SCENARIOS
    if args.default_scenario not in scenarios:
        selected = ", ".join(scenarios)
        raise SystemExit(
            f"--default-scenario {args.default_scenario!r} must be included in --scenario selections ({selected})."
        )
    bundle = build_scenario_bundle(
        load_scenario_outputs(Path(args.base_dir), scenarios),
        default_scenario=args.default_scenario,
        supported_scenarios=scenarios,
    )
    output = write_json(Path(args.output), bundle)
    print(f"Wrote {output}")
    print(json.dumps({
        "schemaVersion": bundle["schemaVersion"],
        "defaultScenario": bundle["defaultScenario"],
        "scenarios": list(bundle["scenarios"]),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
