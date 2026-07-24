#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Shared scenario identifiers and template-name rules."""
from __future__ import annotations

import re
from typing import Any


SUPPORTED_SCENARIOS = ("2022", "2026", "2070")
DEFAULT_SCENARIO = "2026"
_SCENARIO_PREFIX_RE = re.compile(rf"^(?:{'|'.join(SUPPORTED_SCENARIOS)})_")


def validate_scenario(value: Any) -> str:
    scenario = str(value or "")
    if scenario not in SUPPORTED_SCENARIOS:
        supported = ", ".join(SUPPORTED_SCENARIOS)
        raise ValueError(f"Unsupported scenario year {scenario!r}; expected one of: {supported}")
    return scenario


def strip_scenario_prefix(value: Any) -> str:
    if value is None:
        return ""
    return _SCENARIO_PREFIX_RE.sub("", str(value))


def scenario_template_name(name: Any, scenario: Any) -> str:
    return f"{validate_scenario(scenario)}_{strip_scenario_prefix(name)}"
