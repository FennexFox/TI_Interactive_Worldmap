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

    def test_staging_manifest_covers_every_browser_module_directory(self):
        staging = set(build_manifest.GENERATED_STAGING_PATHS)

        for directory in ("state", "data", "interaction", "render", "runtime", "ui"):
            self.assertIn(f"docs/assets/{directory}", staging)
        self.assertIn("data/generated/scenarios", staging)


if __name__ == "__main__":
    unittest.main()
