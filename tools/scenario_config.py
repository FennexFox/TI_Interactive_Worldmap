#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Shared scenario identifiers and template-name rules."""
from __future__ import annotations

import re
from typing import Any


SUPPORTED_SCENARIOS = ("2022", "2026", "2070", "2003", "1962")
DEFAULT_SCENARIO = "2026"
SCENARIO_LABELS = {
    "1962": "2112 - Broken Earth (DLC)",
    "2003": "2003 (DLC)",
    "2022": "2022",
    "2026": "2026",
    "2070": "2070",
}
SCENARIO_START_YEARS = {
    "1962": 2112,
    "2003": 2003,
    "2022": 2022,
    "2026": 2026,
    "2070": 2070,
}
DLC_SCENARIOS = frozenset({"1962", "2003"})
_SCENARIO_PREFIX_RE = re.compile(
    rf"^(?:{'|'.join(re.escape(scenario) for scenario in SUPPORTED_SCENARIOS)})_"
)


def validate_scenario(value: Any) -> str:
    scenario = str(value or "")
    if scenario not in SUPPORTED_SCENARIOS:
        supported = ", ".join(SUPPORTED_SCENARIOS)
        raise ValueError(f"Unsupported scenario {scenario!r}; expected one of: {supported}")
    return scenario


def scenario_label(value: Any) -> str:
    scenario = validate_scenario(value)
    return SCENARIO_LABELS.get(scenario, scenario)


def scenario_start_year(value: Any) -> int:
    scenario = validate_scenario(value)
    return SCENARIO_START_YEARS[scenario]


def scenario_group(value: Any) -> str:
    scenario = validate_scenario(value)
    return "dlc" if scenario in DLC_SCENARIOS else "base"


def strip_scenario_prefix(value: Any) -> str:
    if value is None:
        return ""
    return _SCENARIO_PREFIX_RE.sub("", str(value))


def scenario_template_name(name: Any, scenario: Any) -> str:
    return f"{validate_scenario(scenario)}_{strip_scenario_prefix(name)}"
