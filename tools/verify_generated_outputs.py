#!/usr/bin/env python3
"""Lightweight deterministic checks for generated worldmap outputs."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


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


def object_value(value: object) -> dict[str, object]:
    return value if isinstance(value, dict) else {}


def number_value(mapping: dict[str, object], key: str) -> float:
    value = mapping.get(key)
    return value if isinstance(value, (int, float)) else 0


def list_value(value: object) -> list[object]:
    return value if isinstance(value, list) else []


def display_name(mapping: dict[str, object], language: str) -> str:
    names = object_value(mapping.get("displayName"))
    value = names.get(language)
    return value if isinstance(value, str) else ""


def aliases(mapping: dict[str, object]) -> list[str]:
    return [item for item in list_value(mapping.get("aliases")) if isinstance(item, str)]


def region_by_name(region_map: dict[str, object], name: str) -> dict[str, object]:
    regions = list_value(region_map.get("regions"))
    for row in regions:
        if isinstance(row, dict) and row.get("regionName") == name:
            return row
    return {}


def main() -> int:
    require((ROOT / "docs/index.html").exists(), "docs/index.html missing")
    require((ROOT / "docs/assets/data.generated.js").exists(), "generated JS data missing")
    require((ROOT / "docs/data/nations.catalog.json").exists(), "docs nation catalog missing")
    require((ROOT / "docs/data/research.catalog.json").exists(), "docs research catalog missing")
    region = object_value(load_json(ROOT / "data/generated/region_map.generated.json", "region map JSON"))
    claim = object_value(load_json(ROOT / "data/generated/claim_map.generated.json", "claim map JSON"))
    nation_catalog = object_value(load_json(ROOT / "data/nations.catalog.json", "nation catalog JSON"))
    research_catalog = object_value(load_json(ROOT / "data/research.catalog.json", "research catalog JSON"))
    region_summary = object_value(region.get("summary"))
    claim_stats = object_value(claim.get("claimStats"))
    nations = object_value(nation_catalog.get("nations"))
    research_counts = object_value(research_catalog.get("counts"))
    claim_nation_meta = object_value(claim.get("nationMeta"))
    require(number_value(region_summary, "regions") >= 300, "region map unexpectedly small")
    require(region_summary.get("scenarioYear") == "2026", "region map must default to 2026 scenario data")
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
    require("Senegambia" not in aliases(object_value(nations.get("SEN"))), "SEN must not use region name as nation alias")
    require(display_name(object_value(claim_nation_meta.get("CAN")), "en") == "Canada", "claim map does not expose catalog nation metadata")
    require(display_name(object_value(claim_nation_meta.get("SAU")), "en") == "Saudi Arabia", "Saudi Arabia nation metadata missing")
    require(object_value(object_value(claim.get("claimsByNation")).get("SAU")).get("status") == "existing", "Saudi Arabia should be an existing 2026 nation")
    require("Guatemala" not in list_value(object_value(object_value(claim.get("claimsByNation")).get("GUA")).get("baseRegions")), "Liangguang/GUA must not inherit Guatemala as base territory")
    print("Generated worldmap outputs verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
