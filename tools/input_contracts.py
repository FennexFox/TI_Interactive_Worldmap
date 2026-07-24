#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Strict, dependency-free loaders for generated-data source contracts."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from scenario_config import strip_scenario_prefix


class InputContractError(ValueError):
    """An input failed a file/path/row-aware contract."""


def _error(path: Path, json_path: str, message: str, *, row: int | None = None) -> InputContractError:
    row_text = f", row {row}" if row is not None else ""
    return InputContractError(f"{path} at {json_path}{row_text}: {message}")


def _reject_duplicate_pairs(path: Path):
    def hook(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise _error(path, "$", f"duplicate key {key!r}")
            result[key] = value
        return result

    return hook


def load_required_json(path: Path, *, expected_type: type[Any] | tuple[type[Any], ...] | None = None) -> Any:
    if not path.is_file():
        raise _error(path, "$", "required file is missing")
    try:
        value = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=_reject_duplicate_pairs(path))
    except InputContractError:
        raise
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        detail = f"invalid JSON ({exc})"
        if isinstance(exc, json.JSONDecodeError):
            detail = f"invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}"
        raise _error(path, "$", detail) from exc
    if expected_type is not None and not isinstance(value, expected_type):
        expected = getattr(expected_type, "__name__", str(expected_type))
        raise _error(path, "$", f"expected {expected}, got {type(value).__name__}")
    return value


def load_optional_json(
    path: Path,
    *,
    default: Any,
    expected_type: type[Any] | tuple[type[Any], ...] | None = None,
) -> Any:
    if not path.is_file():
        return default
    return load_required_json(path, expected_type=expected_type)


def validate_template_rows(rows: Any, path: Path) -> list[dict[str, Any]]:
    if not isinstance(rows, list):
        raise _error(path, "$", f"expected list, got {type(rows).__name__}")
    result: list[dict[str, Any]] = []
    seen: dict[str, int] = {}
    for index, row in enumerate(rows):
        json_path = f"$[{index}]"
        if not isinstance(row, dict):
            raise _error(path, json_path, f"expected object, got {type(row).__name__}", row=index)
        data_name = row.get("dataName")
        if not isinstance(data_name, str) or not data_name.strip():
            raise _error(path, f"{json_path}.dataName", "expected non-empty string", row=index)
        if re.search(r"\s", data_name) or any(ord(char) < 32 for char in data_name):
            raise _error(path, f"{json_path}.dataName", f"invalid identifier {data_name!r}", row=index)
        if data_name in seen:
            raise _error(
                path,
                f"{json_path}.dataName",
                f"duplicate identifier {data_name!r}; first seen at row {seen[data_name]}",
                row=index,
            )
        seen[data_name] = index
        result.append(row)
    return result


def load_template_rows(path: Path, *, required: bool = True) -> list[dict[str, Any]]:
    if not required and not path.is_file():
        return []
    return validate_template_rows(load_required_json(path), path)


def validate_alias_map(value: Any, path: Path) -> dict[str, str]:
    if not isinstance(value, dict):
        raise _error(path, "$", f"expected object, got {type(value).__name__}")
    result: dict[str, str] = {}
    for alias, target in value.items():
        json_path = f"$.{alias}"
        if not isinstance(alias, str) or not alias.strip():
            raise _error(path, json_path, "alias must be a non-empty string")
        if not isinstance(target, str) or not target.strip():
            raise _error(path, json_path, "target must be a non-empty string")
        result[alias] = target
    return result


def load_alias_map(path: Path, *, required: bool = False) -> dict[str, str]:
    value = load_required_json(path) if required else load_optional_json(path, default={})
    return validate_alias_map(value, path)


def validate_override_map(value: Any, path: Path) -> dict[str, dict[str, Any]]:
    if not isinstance(value, dict):
        raise _error(path, "$", f"expected object, got {type(value).__name__}")
    result: dict[str, dict[str, Any]] = {}
    source_keys: dict[str, str] = {}
    for raw_tag, override in value.items():
        json_path = f"$.{raw_tag}"
        tag = strip_scenario_prefix(raw_tag)
        if not tag:
            raise _error(path, json_path, "override tag must be non-empty")
        if tag in result:
            raise _error(path, json_path, f"duplicate normalized tag {tag!r}; also defined by {source_keys[tag]!r}")
        if not isinstance(override, dict):
            raise _error(path, json_path, f"expected object, got {type(override).__name__}")
        display_name = override.get("displayName", {})
        if not isinstance(display_name, dict) or any(
            not isinstance(language, str) or not isinstance(name, str) or not name.strip()
            for language, name in display_name.items()
        ):
            raise _error(path, f"{json_path}.displayName", "expected a language-to-non-empty-string object")
        aliases = override.get("aliases", [])
        if not isinstance(aliases, list) or any(not isinstance(alias, str) or not alias.strip() for alias in aliases):
            raise _error(path, f"{json_path}.aliases", "expected a list of non-empty strings")
        if len({alias.casefold() for alias in aliases}) != len(aliases):
            raise _error(path, f"{json_path}.aliases", "duplicate aliases are not allowed")
        result[tag] = override
        source_keys[tag] = str(raw_tag)
    return result


def load_override_map(path: Path, *, required: bool = False) -> dict[str, dict[str, Any]]:
    value = load_required_json(path) if required else load_optional_json(path, default={})
    return validate_override_map(value, path)
