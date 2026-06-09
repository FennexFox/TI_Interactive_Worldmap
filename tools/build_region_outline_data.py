#!/usr/bin/env python3
"""Compact extracted Terra Invicta region outlines for browser rendering."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def compact_region_outlines(raw: dict[str, Any]) -> dict[str, Any]:
    regions = []
    all_x: list[float] = []
    all_y: list[float] = []

    for index, region in enumerate(raw["regions"]):
        paths: list[str] = []
        total_points = 0
        for poly in region.get("poly2DList", []):
            if len(poly) < 3:
                continue
            points = []
            for point in poly:
                x, y = point["anchor"]
                points.append((x, y))
            deduped = []
            last_key = None
            for x, y in points:
                key = (round(x, 6), round(y, 6))
                if key != last_key:
                    deduped.append((x, y))
                    last_key = key
            if len(deduped) >= 3:
                paths.append("M " + " L ".join(f"{x:.6f} {y:.6f}" for x, y in deduped) + " Z")
                total_points += len(deduped)
                all_x.extend(x for x, _ in deduped)
                all_y.extend(y for _, y in deduped)
        if not paths:
            continue
        labels = []
        for label in region.get("labelPositions", []):
            try:
                x, y = label["pos"]["anchor"]
            except Exception:
                continue
            labels.append({"name": label.get("name") or region["regionName"], "x": x, "y": y})
        regions.append(
            {
                "id": index,
                "name": region["name"],
                "regionName": region["regionName"],
                "nationTag": region["nationTag"],
                "path": " ".join(paths),
                "polygons": len(paths),
                "points": total_points,
                "shapes": len(region.get("regionShapes", [])),
                "surfaceShapes": len(region.get("regionSurfacePoints", [])),
                "labels": labels[:2],
            }
        )

    if not regions or not all_x or not all_y:
        raise ValueError("No usable polygon points found in raw region outline data.")

    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    pad_x = (max_x - min_x) * 0.005
    pad_y = (max_y - min_y) * 0.035
    view_box = [min_x - pad_x, min_y - pad_y, (max_x - min_x) + 2 * pad_x, (max_y - min_y) + 2 * pad_y]
    summary = {
        "collectionName": raw["collectionName"],
        "regions": len(regions),
        "width": raw["width"],
        "height": raw["height"],
        "polygons": sum(region["polygons"] for region in regions),
        "points": sum(region["points"] for region in regions),
        "nationTags": len({region["nationTag"] for region in regions}),
        "viewBox": view_box,
    }
    return {"summary": summary, "regions": regions}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw-json", required=True, help="Raw region outline JSON extracted from regionoutlines.")
    parser.add_argument("--output", default="data/generated/region_map.generated.json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        data = compact_region_outlines(load_json(Path(args.raw_json)))
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {output}")
    print(json.dumps(data["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
