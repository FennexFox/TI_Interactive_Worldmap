#!/usr/bin/env python3
"""Lightweight deterministic checks for generated worldmap outputs."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    region = json.loads((ROOT / "data/generated/region_map.generated.json").read_text(encoding="utf-8"))
    claim = json.loads((ROOT / "data/generated/claim_map.generated.json").read_text(encoding="utf-8"))
    assert region["summary"]["regions"] >= 300, "region map unexpectedly small"
    assert claim["claimStats"]["claimRowsNormalized"] >= 2000, "claim row count unexpectedly small"
    assert claim["claimStats"]["regionsUnmatched"] == 0, "unmatched claim regions remain"
    assert (ROOT / "docs/index.html").exists(), "docs/index.html missing"
    assert (ROOT / "docs/assets/data.generated.js").exists(), "generated JS data missing"
    print("Generated worldmap outputs verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
