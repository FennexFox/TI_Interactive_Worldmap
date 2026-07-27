#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

import sys
import tempfile
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import build_manifest


class BuildManifestTests(unittest.TestCase):
    def test_browser_manifest_discovers_nested_modules(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "src/runtime/nested/controller.js"
            source.parent.mkdir(parents=True)
            source.write_text("export const value = 1;\n", encoding="utf-8")

            self.assertIn(
                (Path("src/runtime/nested/controller.js"), Path("docs/assets/runtime/nested/controller.js")),
                build_manifest.browser_source_mappings(root),
            )

    def test_staging_manifest_includes_every_deployment_destination(self):
        staging = set(build_manifest.GENERATED_STAGING_PATHS)

        destinations = {
            str(destination)
            for _, destination in build_manifest.deployment_source_mappings()
        }
        self.assertTrue(destinations <= staging)
        self.assertIn("data/generated/scenarios", staging)

    def test_scenario_manifest_includes_dark_skies_outputs(self):
        generated = set(build_manifest.expected_scenario_generated_files())

        for scenario in ("1962", "2003"):
            for filename in build_manifest.SCENARIO_OUTPUT_FILENAMES:
                self.assertIn(Path("data/generated/scenarios") / scenario / filename, generated)

    def test_browser_manifest_rejects_missing_source_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            with self.assertRaisesRegex(FileNotFoundError, "browser source directory is missing"):
                build_manifest.browser_source_mappings(Path(temporary))


if __name__ == "__main__":
    unittest.main()
