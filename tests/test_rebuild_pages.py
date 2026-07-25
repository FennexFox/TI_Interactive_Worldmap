#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

import contextlib
import io
import sys
import unittest
from pathlib import Path
from unittest import mock


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import rebuild_pages


class RebuildPagesPublishingTests(unittest.TestCase):
    def test_default_is_non_publishing(self):
        args = rebuild_pages.parse_args([])

        self.assertFalse(args.commit)
        self.assertFalse(args.push)
        with (
            mock.patch.object(rebuild_pages, "generated_paths_changed", return_value=True),
            mock.patch.object(rebuild_pages, "run") as run,
        ):
            rebuild_pages.publish_generated_changes(args)

        run.assert_not_called()

    def test_push_implies_commit(self):
        args = rebuild_pages.parse_args(["--push"])

        self.assertTrue(args.commit)
        self.assertTrue(args.push)

    def test_commit_stages_only_manifest_paths(self):
        args = rebuild_pages.parse_args(["--commit", "--commit-message", "generated update"])

        with (
            mock.patch.object(rebuild_pages, "generated_paths_changed", return_value=True),
            mock.patch.object(rebuild_pages, "run") as run,
        ):
            rebuild_pages.publish_generated_changes(args)

        self.assertEqual(
            [call.args[0] for call in run.call_args_list],
            [
                ["git", "add", "--", *rebuild_pages.GENERATED_PATHS],
                ["git", "commit", "-m", "generated update"],
            ],
        )

    def test_push_uses_selected_branch(self):
        args = rebuild_pages.parse_args(["--push", "--remote", "upstream", "--branch", "release"])

        with (
            mock.patch.object(rebuild_pages, "generated_paths_changed", return_value=True),
            mock.patch.object(rebuild_pages, "remote_exists", return_value=True),
            mock.patch.object(rebuild_pages, "run") as run,
        ):
            rebuild_pages.publish_generated_changes(args)

        self.assertEqual(run.call_args_list[-1].args[0], ["git", "push", "upstream", "release"])

    def test_push_defaults_to_current_branch(self):
        args = rebuild_pages.parse_args(["--push"])

        with (
            mock.patch.object(rebuild_pages, "generated_paths_changed", return_value=True),
            mock.patch.object(rebuild_pages, "remote_exists", return_value=True),
            mock.patch.object(rebuild_pages, "current_branch", return_value="feature/refactor"),
            mock.patch.object(rebuild_pages, "run") as run,
        ):
            rebuild_pages.publish_generated_changes(args)

        self.assertEqual(run.call_args_list[-1].args[0], ["git", "push", "origin", "feature/refactor"])

    def test_no_push_alias_preserves_commit_only_behavior_with_warning(self):
        stderr = io.StringIO()

        with contextlib.redirect_stderr(stderr):
            args = rebuild_pages.parse_args(["--no-push"])

        self.assertTrue(args.commit)
        self.assertFalse(args.push)
        self.assertIn("deprecated", stderr.getvalue())

    def test_no_commit_alias_is_non_publishing_with_warning(self):
        stderr = io.StringIO()

        with contextlib.redirect_stderr(stderr):
            args = rebuild_pages.parse_args(["--no-commit"])

        self.assertFalse(args.commit)
        self.assertFalse(args.push)
        self.assertIn("deprecated", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
