#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Scenario-aware filtering for Terra Invicta bilateral template rows."""
from __future__ import annotations

import re
from typing import Any, Iterable


SUPPORTED_SCENARIOS = ("2022", "2026", "2070")
DEFAULT_SCENARIO = "2026"
SCENARIO_TOKEN_RE = re.compile(r"(2022|2026|2070)_")


def scenario_refs(row: dict[str, Any]) -> set[str]:
    refs: set[str] = set()
    for key in ("dataName", "nation1", "nation2", "region1", "region2"):
        value = row.get(key)
        if not isinstance(value, str):
            continue
        refs.update(SCENARIO_TOKEN_RE.findall(value))
    return refs


def filter_bilateral_rows_for_scenario(
    rows: Iterable[dict[str, Any]],
    scenario_year: str | None,
    *,
    relation_types: Iterable[str] | None = None,
) -> list[dict[str, Any]]:
    if not scenario_year:
        return list(rows)
    scenario = str(scenario_year)
    if scenario not in SUPPORTED_SCENARIOS:
        raise ValueError(f"Unsupported scenario year: {scenario}")

    relation_filter = set(relation_types or [])
    relevant_rows = [
        row
        for row in rows
        if isinstance(row, dict) and (not relation_filter or str(row.get("relationType")) in relation_filter)
    ]
    has_specific_by_relation: dict[str, bool] = {}
    for row in relevant_rows:
        relation = str(row.get("relationType") or "")
        refs = scenario_refs(row)
        has_specific_by_relation[relation] = has_specific_by_relation.get(relation, False) or refs == {scenario}

    filtered = []
    for row in relevant_rows:
        relation = str(row.get("relationType") or "")
        refs = scenario_refs(row)
        if refs == {scenario}:
            filtered.append(row)
        elif not refs and not has_specific_by_relation.get(relation, False):
            filtered.append(row)
    return filtered
