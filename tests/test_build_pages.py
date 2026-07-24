#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

import gzip
import json
import tempfile
import sys
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import build_pages


class BuildPagesTests(unittest.TestCase):
    def test_deterministic_gzip_has_stable_header_and_payload(self):
        payload = b'{"stable":true}'

        first = build_pages.deterministic_gzip(payload)
        second = build_pages.deterministic_gzip(payload)

        self.assertEqual(first, second)
        self.assertEqual(first[4:8], b"\x00\x00\x00\x00")
        self.assertEqual(gzip.decompress(first), payload)

    def test_sync_static_assets_copies_nested_modules_and_removes_stale_modules(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            files = {
                "src/index.html": "<!doctype html>\n",
                "src/styles.css": "body {}\n",
                "src/app.js": "export {};\n",
                "src/runtime/nested/controller.js": "export const controller = true;\n",
            }
            for relative, text in files.items():
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(text, encoding="utf-8")
            stale = root / "docs/assets/ui/stale.js"
            stale.parent.mkdir(parents=True)
            stale.write_text("export {};\n", encoding="utf-8")
            generated = root / "docs/assets/data.generated.js"
            generated.write_text("generated\n", encoding="utf-8")

            build_pages.sync_static_assets(root)

            self.assertEqual(
                (root / "docs/assets/runtime/nested/controller.js").read_text(encoding="utf-8"),
                files["src/runtime/nested/controller.js"],
            )
            self.assertFalse(stale.exists())
            self.assertEqual(generated.read_text(encoding="utf-8"), "generated\n")

    def test_build_pages_never_rewrites_generated_inputs(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source_files = {
                "src/index.html": "<!doctype html>\n",
                "src/styles.css": "body {}\n",
                "src/app.js": "export {};\n",
            }
            for relative, text in source_files.items():
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(text, encoding="utf-8")
            generated = root / "data/generated"
            generated.mkdir(parents=True)
            values = {
                "region_map.generated.json": {"summary": {"scenarioYear": "2026"}, "regions": []},
                "claim_map.generated.json": {"summary": {"scenarioYear": "2026"}},
                "nations.catalog.json": {"nations": {}},
                "research.catalog.json": {"nodes": []},
            }
            scenario_entry = {
                "summary": {"scenarioYear": "2026"},
                "regionMap": values["region_map.generated.json"],
                "claimMap": values["claim_map.generated.json"],
                "catalogs": {
                    "nations": values["nations.catalog.json"],
                    "research": values["research.catalog.json"],
                },
            }
            values["scenario_bundle.generated.json"] = {
                "schemaVersion": 2,
                "defaultScenario": "2026",
                "scenarios": {"2026": scenario_entry},
            }
            for filename, value in values.items():
                (generated / filename).write_text(
                    json.dumps(value, indent=2) + "\n",
                    encoding="utf-8",
                )
            before = {path.name: path.read_bytes() for path in generated.iterdir()}

            build_pages.build_pages(root)

            after = {path.name: path.read_bytes() for path in generated.iterdir()}
            self.assertEqual(after, before)
            self.assertTrue((root / "docs/assets/data.generated.js").is_file())


if __name__ == "__main__":
    unittest.main()
