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


def main() -> int:
    require((ROOT / "docs/index.html").exists(), "docs/index.html missing")
    require((ROOT / "docs/assets/data.generated.js").exists(), "generated JS data missing")
    region = object_value(load_json(ROOT / "data/generated/region_map.generated.json", "region map JSON"))
    claim = object_value(load_json(ROOT / "data/generated/claim_map.generated.json", "claim map JSON"))
    region_summary = object_value(region.get("summary"))
    claim_stats = object_value(claim.get("claimStats"))
    require(number_value(region_summary, "regions") >= 300, "region map unexpectedly small")
    require(number_value(claim_stats, "claimRowsNormalized") >= 2000, "claim row count unexpectedly small")
    require(claim_stats.get("regionsUnmatched") == 0, "unmatched claim regions remain")
    print("Generated worldmap outputs verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
