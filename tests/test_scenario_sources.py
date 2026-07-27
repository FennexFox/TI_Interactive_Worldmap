#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

import json
import sys
import tempfile
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import scenario_sources


class ScenarioSourceTests(unittest.TestCase):
    def test_dlc_templates_and_localizations_overlay_base_inputs(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            templates_dir = root / "game/TerraInvicta_Data/StreamingAssets/Templates"
            base_localization = templates_dir.parent / "Localization/en"
            dark_skies_dir = root / "game/DLC_Content/DarkSkies"
            overlay_templates = dark_skies_dir / "Broken_Earth_Scenario/Templates"
            overlay_localization = (
                dark_skies_dir / "Localization/en/Broken Earth Scenario"
            )

            for filename in scenario_sources.REPLACEMENT_TEMPLATE_FILES:
                self.write_json(
                    templates_dir / filename,
                    [{"dataName": "Shared", "value": "base"}, {"dataName": "BaseOnly"}],
                )
                self.write_json(
                    overlay_templates / filename,
                    [{"dataName": "Shared", "value": "dlc"}, {"dataName": "1962_DlcOnly"}],
                )
            for filename in scenario_sources.MERGED_TEMPLATE_FILES:
                self.write_json(
                    templates_dir / filename,
                    [{"dataName": "Shared", "value": "base"}, {"dataName": "BaseOnly"}],
                )
                self.write_json(
                    overlay_templates / filename,
                    [{"dataName": "Shared", "value": "dlc"}, {"dataName": "1962_DlcOnly"}],
                )
            self.write_json(
                templates_dir / "TIMapRegionTemplate.json",
                [{"dataName": "map_BaseOnly"}],
            )
            self.write_text(
                base_localization / "TINationTemplate.en",
                "TINationTemplate.displayName.Shared=Base\n",
            )
            self.write_text(
                overlay_localization / "TINationTemplate.en",
                "TINationTemplate.displayName.Shared.BrokenEarth=Broken\n",
            )

            merged_dir = scenario_sources.prepare_scenario_templates(
                templates_dir,
                dark_skies_dir,
                "1962",
                root / "merged",
                ["en"],
            )

            merged_rows = {
                row["dataName"]: row
                for row in json.loads((merged_dir / "TINationTemplate.json").read_text())
            }
            self.assertEqual(merged_rows["Shared"]["value"], "dlc")
            self.assertNotIn("BaseOnly", merged_rows)
            self.assertIn("1962_DlcOnly", merged_rows)
            merged_research_rows = {
                row["dataName"]: row
                for row in json.loads((merged_dir / "TITechTemplate.json").read_text())
            }
            self.assertEqual(merged_research_rows["Shared"]["value"], "dlc")
            self.assertIn("BaseOnly", merged_research_rows)
            self.assertTrue((merged_dir / "TIMapRegionTemplate.json").is_file())
            localization = (
                merged_dir.parent / "Localization/en/TINationTemplate.en"
            ).read_text()
            self.assertIn("TINationTemplate.displayName.Shared=Base", localization)
            self.assertIn(
                "TINationTemplate.displayName.1962_Shared=Broken",
                localization,
            )

    @staticmethod
    def write_json(path: Path, value: object) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value), encoding="utf-8")

    @staticmethod
    def write_text(path: Path, value: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
