#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


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

    def test_node_check_runtime_failures_are_aggregated(self):
        root = self.make_root()
        with mock.patch.object(
            verify_generated_outputs.subprocess,
            "run",
            side_effect=[
                subprocess.TimeoutExpired(["node", "--check"], 10),
                OSError("node unavailable"),
            ],
        ) as run:
            diagnostics = verify_generated_outputs.collect_javascript_syntax_diagnostics(root)

        self.assertEqual(run.call_count, 2)
        self.assertEqual(
            [(item.code, item.path) for item in diagnostics],
            [
                ("javascript-syntax", "src/app.js"),
                ("javascript-syntax", "src/runtime/flow.js"),
            ],
        )
        self.assertIn("timed out", diagnostics[0].message)
        self.assertIn("node unavailable", diagnostics[1].message)

    def test_unknown_scenario_output_filename_is_a_verification_failure(self):
        with self.assertRaisesRegex(
            verify_generated_outputs.VerificationFailure,
            "unsupported scenario output filename",
        ):
            verify_generated_outputs.scenario_bundle_value({}, "unknown.generated.json")

    def test_collector_failure_does_not_discard_later_diagnostics(self):
        root = self.make_root()
        syntax_diagnostic = verify_generated_outputs.Diagnostic(
            "javascript-syntax",
            "src/app.js",
            "broken syntax",
        )
        with (
            mock.patch.object(
                verify_generated_outputs,
                "collect_deployment_diagnostics",
                side_effect=OSError("deployment unavailable"),
            ),
            mock.patch.object(
                verify_generated_outputs,
                "collect_javascript_syntax_diagnostics",
                return_value=[syntax_diagnostic],
            ) as syntax_collector,
        ):
            diagnostics = verify_generated_outputs.collect_all_diagnostics(root)

        syntax_collector.assert_called_once_with(root)
        self.assertEqual(
            [(item.code, item.message) for item in diagnostics],
            [
                ("deployment-collector", "collector failed: deployment unavailable"),
                ("javascript-syntax", "broken syntax"),
            ],
        )

    def test_sentinel_failures_are_returned_as_diagnostics(self):
        with mock.patch.object(
            verify_generated_outputs,
            "verify_dataset_sentinels",
            side_effect=verify_generated_outputs.VerificationFailure("bad sentinel"),
        ):
            diagnostics = verify_generated_outputs.collect_dataset_sentinel_diagnostics()

        self.assertEqual(len(diagnostics), 1)
        self.assertEqual(diagnostics[0].code, "dataset-sentinel")
        self.assertIn("bad sentinel", diagnostics[0].message)


if __name__ == "__main__":
    unittest.main()
