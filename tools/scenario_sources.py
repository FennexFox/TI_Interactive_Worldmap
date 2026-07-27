#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Prepare layered base-game and DLC template inputs for scenario builds."""
from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

from catalog_utils import read_localization_file
from input_contracts import load_template_rows
from scenario_config import validate_scenario


DLC_SCENARIO_SOURCES = {
    "1962": ("Broken_Earth_Scenario", "Broken Earth Scenario", "BrokenEarth"),
    "2003": ("2003_Scenario", "2003 Scenario", "2003"),
}
REPLACEMENT_TEMPLATE_FILES = (
    "TIRegionTemplate.json",
    "TINationTemplate.json",
)
MERGED_TEMPLATE_FILES = (
    "TIBilateralTemplate.json",
    "TITechTemplate.json",
    "TIProjectTemplate.json",
)
PASSTHROUGH_TEMPLATE_FILES = ("TIMapRegionTemplate.json",)
LOCALIZATION_FAMILIES = (
    "TIRegionTemplate",
    "TINationTemplate",
    "TITechTemplate",
    "TIProjectTemplate",
)


def default_dark_skies_dir(templates_dir: Path) -> Path:
    configured = os.environ.get("TI_DLC_DIR")
    if configured:
        return Path(configured)
    return templates_dir.parents[2] / "DLC_Content" / "DarkSkies"


def merge_template_file(base_path: Path, overlay_path: Path, output_path: Path) -> None:
    rows = {
        str(row["dataName"]): row
        for row in load_template_rows(base_path)
    }
    rows.update({
        str(row["dataName"]): row
        for row in load_template_rows(overlay_path)
    })
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps([rows[name] for name in sorted(rows)], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def normalize_dlc_localization_key(key: str, scenario: str, suffix: str) -> str:
    postfix = f".{suffix}"
    if not key.endswith(postfix):
        return key
    parts = key[:-len(postfix)].split(".", 2)
    if len(parts) != 3 or parts[0] not in {"TINationTemplate", "TIRegionTemplate"}:
        return key
    family, field, data_name = parts
    return f"{family}.{field}.{scenario}_{data_name}"


def merge_localization_file(
    base_path: Path,
    overlay_path: Path,
    output_path: Path,
    *,
    scenario: str,
    suffix: str,
) -> None:
    values = read_localization_file(base_path)
    values.update({
        normalize_dlc_localization_key(key, scenario, suffix): value
        for key, value in read_localization_file(overlay_path).items()
    })
    if not values:
        return
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        "".join(f"{key}={values[key]}\n" for key in sorted(values)),
        encoding="utf-8",
    )


def prepare_scenario_templates(
    templates_dir: Path,
    dark_skies_dir: Path,
    scenario: str,
    output_root: Path,
    languages: list[str],
) -> Path:
    scenario = validate_scenario(scenario)
    source = DLC_SCENARIO_SOURCES.get(scenario)
    if not source:
        return templates_dir

    scenario_directory, localization_directory, localization_suffix = source
    overlay_templates_dir = dark_skies_dir / scenario_directory / "Templates"
    if not overlay_templates_dir.is_dir():
        raise SystemExit(
            f"Missing Dark Skies DLC scenario templates for {scenario}: "
            f"{overlay_templates_dir}. Set TI_DLC_DIR or pass --dlc-dir "
            "to point to the Dark Skies installation."
        )

    scenario_root = output_root / scenario
    merged_templates_dir = scenario_root / "Templates"
    for filename in REPLACEMENT_TEMPLATE_FILES:
        source_path = overlay_templates_dir / filename
        if not source_path.is_file():
            raise SystemExit(f"Missing Dark Skies DLC template for {scenario}: {source_path}")
        merged_templates_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_path, merged_templates_dir / filename)
    for filename in MERGED_TEMPLATE_FILES:
        merge_template_file(
            templates_dir / filename,
            overlay_templates_dir / filename,
            merged_templates_dir / filename,
        )
    for filename in PASSTHROUGH_TEMPLATE_FILES:
        source_path = templates_dir / filename
        if source_path.is_file():
            merged_templates_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, merged_templates_dir / filename)

    base_localization_root = templates_dir.parent / "Localization"
    dlc_localization_root = dark_skies_dir / "Localization"
    for language in languages:
        for family in LOCALIZATION_FAMILIES:
            filename = f"{family}.{language}"
            merge_localization_file(
                base_localization_root / language / filename,
                dlc_localization_root / language / localization_directory / filename,
                scenario_root / "Localization" / language / filename,
                scenario=scenario,
                suffix=localization_suffix,
            )
    return merged_templates_dir
