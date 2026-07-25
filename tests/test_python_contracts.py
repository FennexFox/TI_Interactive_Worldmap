#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

import sys
import tempfile
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

from input_contracts import (  # noqa: E402
    InputContractError,
    load_alias_map,
    load_required_json,
    load_template_rows,
    validate_override_map,
)
from localization import (  # noqa: E402
    project_nation_catalog_localizations,
    project_region_nation_localizations,
)
from scenario_config import (  # noqa: E402
    scenario_template_name,
    strip_scenario_prefix,
    validate_scenario,
)


class PythonContractTests(unittest.TestCase):
    def test_catalog_utils_supports_package_imports(self):
        from tools import catalog_utils

        self.assertEqual(catalog_utils.load_required_json.__module__, "tools.input_contracts")

    def test_scenario_contract_is_shared_and_strict(self):
        self.assertEqual(strip_scenario_prefix("2070_CAN"), "CAN")
        self.assertEqual(scenario_template_name("2022_CAN", "2026"), "2026_CAN")
        with self.assertRaisesRegex(ValueError, "Unsupported scenario year"):
            validate_scenario("2040")

    def test_required_json_reports_file_and_json_location(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "broken.json"
            path.write_text('{"value":', encoding="utf-8")
            with self.assertRaises(InputContractError) as caught:
                load_required_json(path)
            self.assertIn(str(path), str(caught.exception))
            self.assertIn("at $", str(caught.exception))
            self.assertIn("line 1", str(caught.exception))

    def test_required_json_rejects_non_finite_numbers(self):
        with tempfile.TemporaryDirectory() as temporary:
            for token in ("NaN", "Infinity", "-Infinity"):
                with self.subTest(token=token):
                    path = Path(temporary) / "non-finite.json"
                    path.write_text(f'{{"value":{token}}}', encoding="utf-8")
                    with self.assertRaisesRegex(InputContractError, "non-finite number"):
                        load_required_json(path)

    def test_template_rows_report_duplicate_identifier_and_row(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "templates.json"
            path.write_text('[{"dataName":"One"},{"dataName":"One"}]', encoding="utf-8")
            with self.assertRaises(InputContractError) as caught:
                load_template_rows(path)
            self.assertIn("$[1].dataName", str(caught.exception))
            self.assertIn("row 1", str(caught.exception))

    def test_aliases_and_overrides_fail_fast(self):
        with tempfile.TemporaryDirectory() as temporary:
            alias_path = Path(temporary) / "aliases.json"
            alias_path.write_text('{"Alias":""}', encoding="utf-8")
            with self.assertRaisesRegex(InputContractError, r"\$\.Alias"):
                load_alias_map(alias_path)
            with self.assertRaisesRegex(InputContractError, "duplicate aliases"):
                validate_override_map(
                    {"CAN": {"aliases": ["Canada", "canada"]}},
                    Path("overrides.json"),
                )

    def test_localization_projections_keep_distinct_fallback_rules(self):
        layers = {
            "IDN": {
                "base": {"displayName": {"en": "Java", "kor": "인도네시아 기본"}},
                "scenario": {"displayName": {"kor": "인도네시아"}},
            }
        }
        self.assertEqual(
            project_nation_catalog_localizations(layers)["IDN"],
            {"en": "Java", "kor": "인도네시아"},
        )
        self.assertEqual(
            project_region_nation_localizations(layers)["IDN"],
            {"en": "Java", "kor": "인도네시아"},
        )


if __name__ == "__main__":
    unittest.main()
