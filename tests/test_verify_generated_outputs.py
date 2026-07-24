#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

import shutil
import sys
import tempfile
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import verify_generated_outputs


class VerifyGeneratedOutputsTests(unittest.TestCase):
    def make_root(self) -> Path:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        files = {
            "src/index.html": "<!doctype html>\n",
            "src/styles.css": "body {}\n",
            "src/app.js": "export const ready = true;\n",
            "src/runtime/flow.js": "export const flow = true;\n",
        }
        for relative, text in files.items():
            source = root / relative
            source.parent.mkdir(parents=True, exist_ok=True)
            source.write_text(text, encoding="utf-8")
            if relative == "src/index.html":
                destination = root / "docs/index.html"
            elif relative == "src/styles.css":
                destination = root / "docs/assets/styles.css"
            else:
                destination = root / "docs/assets" / Path(relative).relative_to("src")
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
        return root

    def test_matching_deployment_has_no_diagnostics(self):
        self.assertEqual(verify_generated_outputs.collect_deployment_diagnostics(self.make_root()), [])

    def test_stale_source_copy_is_reported(self):
        root = self.make_root()
        (root / "src/app.js").write_text("export const ready = false;\n", encoding="utf-8")

        diagnostics = verify_generated_outputs.collect_deployment_diagnostics(root)

        self.assertIn(("deployment-stale", "docs/assets/app.js"), {(item.code, item.path) for item in diagnostics})

    def test_extra_deployed_module_is_reported(self):
        root = self.make_root()
        extra = root / "docs/assets/ui/stale.js"
        extra.parent.mkdir(parents=True)
        extra.write_text("export {};\n", encoding="utf-8")

        diagnostics = verify_generated_outputs.collect_deployment_diagnostics(root)

        self.assertIn(("deployment-extra", "docs/assets/ui/stale.js"), {(item.code, item.path) for item in diagnostics})

    def test_every_source_javascript_file_is_syntax_checked(self):
        root = self.make_root()
        broken = root / "src/runtime/broken.js"
        broken.write_text("const broken = {;\n", encoding="utf-8")

        diagnostics = verify_generated_outputs.collect_javascript_syntax_diagnostics(root)

        self.assertIn(("javascript-syntax", "src/runtime/broken.js"), {(item.code, item.path) for item in diagnostics})


if __name__ == "__main__":
    unittest.main()
