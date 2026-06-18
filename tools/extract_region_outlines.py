#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Extract Terra Invicta region outline data from the Unity regionoutlines asset.

This script uses UnityPy when reading the original Unity asset bundle. For test and
fixture workflows it can also compact a previously extracted raw outline JSON via
`tools/build_region_outline_data.py`.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def _plain(value: Any) -> Any:
    """Convert UnityPy objects into JSON-serializable plain containers."""
    if isinstance(value, dict):
        return {k: _plain(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_plain(v) for v in value]
    if hasattr(value, "__dict__"):
        return _plain(vars(value))
    return value


def _normalize_region_collection(tree: dict[str, Any]) -> dict[str, Any]:
    plain = _plain(tree)
    if isinstance(plain.get("regions"), list):
        return plain
    if isinstance(plain.get("regionOutlines"), list):
        plain["regions"] = plain["regionOutlines"]
    return plain


def extract_with_unitypy(asset: Path) -> dict[str, Any]:
    try:
        import UnityPy  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "UnityPy is required to read the original regionoutlines asset. "
            "Install dependencies with `python -m pip install -r requirements.txt`, "
            "or pass a pre-extracted raw JSON to build_region_outline_data.py."
        ) from exc

    env = UnityPy.load(str(asset))
    candidates: list[dict[str, Any]] = []
    for obj in env.objects:
        if obj.type.name != "MonoBehaviour":
            continue
        try:
            tree = obj.read_typetree()
        except Exception:
            continue
        name = tree.get("m_Name") or tree.get("name")
        regions = tree.get("regions") or tree.get("regionOutlines")
        if not isinstance(regions, list):
            continue
        normalized = _normalize_region_collection(tree)
        candidates.append(normalized)
        if name == "EarthRegionOutlines":
            return normalized
    if not candidates:
        raise SystemExit(f"No MonoBehaviour region outline collection found in {asset}")
    return max(candidates, key=lambda item: len(item.get("regions") or []))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--asset", required=True, help="Path to the Unity regionoutlines asset bundle.")
    parser.add_argument("--raw-output", required=True, help="Raw extracted JSON output path.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    raw = extract_with_unitypy(Path(args.asset))
    output = Path(args.raw_output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {output}")
    print(f"Extracted {len(raw.get('regions') or [])} regions from {args.asset}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
