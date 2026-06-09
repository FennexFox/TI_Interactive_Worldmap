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


def main() -> int:
    region = json.loads((ROOT / "data/generated/region_map.generated.json").read_text(encoding="utf-8"))
    claim = json.loads((ROOT / "data/generated/claim_map.generated.json").read_text(encoding="utf-8"))
    require(region["summary"]["regions"] >= 300, "region map unexpectedly small")
    require(claim["claimStats"]["claimRowsNormalized"] >= 2000, "claim row count unexpectedly small")
    require(claim["claimStats"]["regionsUnmatched"] == 0, "unmatched claim regions remain")
    require((ROOT / "docs/index.html").exists(), "docs/index.html missing")
    require((ROOT / "docs/assets/data.generated.js").exists(), "generated JS data missing")
    print("Generated worldmap outputs verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
