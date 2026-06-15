#!/usr/bin/env python3
"""Rebuild Terra Invicta worldmap pages from local game data and optionally push.

This mirrors the TI_Engine_Charts workflow: build generated data, build docs/, run
verification, then optionally commit and push only generated paths.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATED_PATHS = (
    "data/nations.catalog.json",
    "data/research.catalog.json",
    "data/generated/region_map.generated.json",
    "data/generated/claim_map.generated.json",
    "docs/data/nations.catalog.json",
    "docs/data/research.catalog.json",
    "docs/data/region_map.generated.json",
    "docs/data/claim_map.generated.json",
    "docs/assets/data.generated.js",
    "docs/assets/app.js",
    "docs/assets/state",
    "docs/assets/data",
    "docs/assets/render",
    "docs/assets/styles.css",
    "docs/index.html",
)


def run(command: list[str], *, capture: bool = False) -> subprocess.CompletedProcess[str]:
    print("+ " + " ".join(command))
    return subprocess.run(
        command,
        cwd=ROOT,
        check=True,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )


def first_existing(paths: list[Path]) -> Path | None:
    for path in paths:
        if path.exists():
            return path
    return None


def default_templates_dir() -> Path | None:
    env = os.environ.get("TI_TEMPLATES_DIR")
    if env:
        return Path(env)
    candidates = [
        Path.home() / ".steam/steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates",
        Path.home() / ".local/share/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates",
        Path("C:/Program Files (x86)/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates"),
    ]
    return first_existing(candidates)


def template_file(templates_dir: Path, name: str) -> Path:
    path = templates_dir / name
    if not path.exists():
        raise SystemExit(f"Missing required template file: {path}")
    return path


def infer_templates_dir(path: Path | None) -> Path | None:
    if not path:
        return None
    candidate = path if path.is_dir() else path.parent
    if (candidate / "TIBilateralTemplate.json").is_file():
        return candidate
    return None


def build_pages(args: argparse.Namespace) -> None:
    python = sys.executable

    templates_dir = Path(args.templates_dir) if args.templates_dir else default_templates_dir()
    bilateral_template = Path(args.bilateral_template) if args.bilateral_template else None
    if not bilateral_template:
        if not templates_dir:
            raise SystemExit("Pass --templates-dir or --bilateral-template.")
        bilateral_template = template_file(templates_dir, "TIBilateralTemplate.json")
    if not templates_dir:
        templates_dir = infer_templates_dir(bilateral_template)

    existing_region_map = ROOT / "data/generated/region_map.generated.json"
    if args.region_map_json:
        run([
            python,
            "tools/build_region_outline_data.py",
            "--raw-json",
            args.region_map_json,
            "--output",
            "data/generated/region_map.generated.json",
        ])
    elif args.region_outlines and (args.refresh_region_outlines or not existing_region_map.exists()):
        raw_output = "data/generated/region_outlines.raw.json"
        run([python, "tools/extract_region_outlines.py", "--asset", args.region_outlines, "--raw-output", raw_output])
        run([
            python,
            "tools/build_region_outline_data.py",
            "--raw-json",
            raw_output,
            "--output",
            "data/generated/region_map.generated.json",
        ])
    elif args.region_outlines:
        print("Using existing data/generated/region_map.generated.json; pass --refresh-region-outlines to rebuild it from --region-outlines.")
    elif not existing_region_map.exists():
        raise SystemExit("No region map data exists. Pass --region-outlines or --region-map-json.")

    if templates_dir and (templates_dir / "TIRegionTemplate.json").is_file():
        run([
            python,
            "tools/build_region_outline_data.py",
            "--raw-json",
            "data/generated/region_map.generated.json",
            "--output",
            "data/generated/region_map.generated.json",
            "--templates-dir",
            str(templates_dir),
            "--scenario-year",
            args.scenario_year,
            "--languages",
            args.catalog_languages,
        ])

    if templates_dir and (templates_dir / "TINationTemplate.json").is_file():
        run([
            python,
            "tools/build_nation_catalog.py",
            "--templates-dir",
            str(templates_dir),
            "--languages",
            args.catalog_languages,
            "--region-map",
            "data/generated/region_map.generated.json",
            "--bilateral-template",
            str(bilateral_template),
            "--scenario-year",
            args.scenario_year,
            "--output",
            "data/nations.catalog.json",
        ])
    if (
        templates_dir
        and (templates_dir / "TITechTemplate.json").is_file()
        and (templates_dir / "TIProjectTemplate.json").is_file()
    ):
        run([
            python,
            "tools/build_research_catalog.py",
            "--templates-dir",
            str(templates_dir),
            "--languages",
            args.catalog_languages,
            "--bilateral-template",
            str(bilateral_template),
            "--aliases",
            "data/manual/region_aliases.json",
            "--output",
            "data/research.catalog.json",
        ])

    claim_command = [
        python,
        "tools/build_claim_data.py",
        "--region-map",
        "data/generated/region_map.generated.json",
        "--bilateral-template",
        str(bilateral_template),
        "--aliases",
        "data/manual/region_aliases.json",
        "--nation-catalog",
        "data/nations.catalog.json",
        "--research-catalog",
        "data/research.catalog.json",
        "--output",
        "data/generated/claim_map.generated.json",
    ]
    run(claim_command)
    run([python, "tools/build_pages.py"])

    if not args.skip_verify:
        npm = "npm.cmd" if os.name == "nt" else "npm"
        run([npm, "run", "verify"])


def is_git_repo() -> bool:
    return subprocess.run(["git", "rev-parse", "--is-inside-work-tree"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0


def generated_paths_changed() -> bool:
    if not is_git_repo():
        print("Not inside a git checkout; skipping generated path change detection.")
        return False
    result = run(["git", "status", "--porcelain", "--", *GENERATED_PATHS], capture=True)
    return bool(result.stdout.strip())


def current_branch() -> str:
    result = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], capture=True)
    branch = result.stdout.strip()
    if not branch or branch == "HEAD":
        raise SystemExit("Cannot push from a detached HEAD. Pass --branch or checkout a branch.")
    return branch


def remote_exists(remote: str) -> bool:
    return subprocess.run(["git", "remote", "get-url", remote], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0


def commit_and_push(args: argparse.Namespace) -> None:
    changed = generated_paths_changed()
    if args.no_commit:
        if changed:
            print("Generated page changes exist; leaving them uncommitted because --no-commit was passed.")
        else:
            print("Build completed; no git change check was needed or no generated page changes were detected.")
        return
    if not changed:
        print("No generated page changes.")
        return
    if not args.no_push and not remote_exists(args.remote):
        raise SystemExit(f"Remote '{args.remote}' is not configured. Add it or rerun with --no-push.")
    run(["git", "add", "--", *GENERATED_PATHS])
    message = args.commit_message or "chore: rebuild worldmap pages"
    run(["git", "commit", "-m", message])
    if args.no_push:
        print("Committed generated page changes; skipping push because --no-push was passed.")
        return
    run(["git", "push", args.remote, args.branch or current_branch()])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--templates-dir", help="Path to TerraInvicta_Data/StreamingAssets/Templates.")
    parser.add_argument("--bilateral-template", help="Explicit path to TIBilateralTemplate.json.")
    parser.add_argument("--region-outlines", help="Path to Terra Invicta regionoutlines Unity asset bundle.")
    parser.add_argument("--refresh-region-outlines", action="store_true", help="Rebuild region map data from --region-outlines instead of reusing existing generated region map data.")
    parser.add_argument("--region-map-json", help="Pre-extracted raw region outline JSON fixture.")
    parser.add_argument("--scenario-year", default="2026", choices=("2022", "2026", "2070"), help="Scenario start year used for template-derived region and nation metadata.")
    parser.add_argument("--catalog-languages", default="kor,en", help="Comma-separated localization languages for generated catalogs.")
    parser.add_argument("--skip-verify", action="store_true", help="Skip npm verify.")
    parser.add_argument("--no-commit", action="store_true", help="Build and verify without committing generated changes.")
    parser.add_argument("--no-push", action="store_true", help="Do not push after committing generated changes.")
    parser.add_argument("--remote", default="origin", help="Git remote to push when changes are committed.")
    parser.add_argument("--branch", help="Branch to push. Defaults to the current branch.")
    parser.add_argument("--commit-message", help="Commit message for generated page updates.")
    args = parser.parse_args()
    if args.refresh_region_outlines and not args.region_outlines:
        parser.error("--refresh-region-outlines requires --region-outlines.")
    return args


def main() -> int:
    args = parse_args()
    build_pages(args)
    commit_and_push(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
