from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any


def compact_number(value: Any, digits: int = 6) -> Any:
    if not isinstance(value, float):
        return value
    rounded = round(value, digits)
    if rounded == 0:
        return 0
    if rounded.is_integer():
        return int(rounded)
    return rounded


def as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json_output(path: Path, value: Any) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


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


def parse_languages(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def source_fingerprint(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {"file": path.name, "missing": True}
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return {
        "file": path.name,
        "size": path.stat().st_size,
        "sha256": digest,
    }


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
        if (path / "TINationTemplate.json").is_file() or (path / "TIProjectTemplate.json").is_file():
            return path
    return None


def load_named_templates(templates_dir: Path, filename: str) -> dict[str, dict[str, Any]]:
    rows = load_json(templates_dir / filename)
    if not isinstance(rows, list):
        return {}
    templates: dict[str, dict[str, Any]] = {}
    for row in rows:
        if not isinstance(row, dict) or not row.get("dataName"):
            continue
        templates[str(row["dataName"])] = row
    return dict(sorted(templates.items()))


def unique_strings(values: list[Any]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if not text or text in seen:
            continue
        seen.add(text)
        result.append(text)
    return result
