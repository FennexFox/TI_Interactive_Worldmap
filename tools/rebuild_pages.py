#!/usr/bin/env python3
"""Rebuild Terra Invicta worldmap pages from local game data and optionally push.

This mirrors the TI_Engine_Charts workflow: build generated data, build docs/, run
verification, then optionally commit and push only generated paths.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCENARIO_YEARS = ("2022", "2026", "2070")
DEFAULT_SCENARIO_YEAR = "2026"
SCENARIO_OUTPUT_ROOT = Path("data/generated/scenarios")
GENERATED_PATHS = (
    "data/generated/nations.catalog.json",
    "data/generated/research.catalog.json",
    "data/generated/region_map.generated.json",
    "data/generated/claim_map.generated.json",
    "data/generated/scenario_bundle.generated.json",
    "data/generated/scenarios",
    "docs/data/generated/nations.catalog.json",
    "docs/data/generated/research.catalog.json",
    "docs/data/region_map.generated.json",
    "docs/data/claim_map.generated.json",
    "docs/data/scenario_bundle.generated.json",
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
        Path("/mnt/c/Program Files (x86)/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates"),
        Path("/mnt/c/SteamLibrary/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates"),
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


def prepare_region_geometry(args: argparse.Namespace) -> str:
    existing_region_map = ROOT / "data/generated/region_map.generated.json"
    if args.region_map_json:
        return args.region_map_json
    if args.region_outlines and (args.refresh_region_outlines or not existing_region_map.exists()):
        raw_output = "data/generated/region_outlines.raw.json"
        run([sys.executable, "tools/extract_region_outlines.py", "--asset", args.region_outlines, "--raw-output", raw_output])
        return raw_output
    if args.region_outlines:
        print("Using existing data/generated/region_map.generated.json; pass --refresh-region-outlines to rebuild it from --region-outlines.")
    if not existing_region_map.exists():
        raise SystemExit("No region map data exists. Pass --region-outlines or --region-map-json.")
    return "data/generated/region_map.generated.json"


def require_template_files(templates_dir: Path, *, require_bilateral_template: bool = True) -> None:
    required = [
        "TIRegionTemplate.json",
        "TINationTemplate.json",
        "TITechTemplate.json",
        "TIProjectTemplate.json",
    ]
    if require_bilateral_template:
        required.append("TIBilateralTemplate.json")
    missing = [name for name in required if not (templates_dir / name).is_file()]
    if missing:
        raise SystemExit(f"Missing required template file(s): {', '.join(missing)}")


def scenario_path(scenario_year: str, filename: str) -> str:
    return str(SCENARIO_OUTPUT_ROOT / scenario_year / filename)


def build_scenario_outputs(
    args: argparse.Namespace,
    *,
    templates_dir: Path,
    bilateral_template: Path,
    raw_region_input: str,
    scenario_year: str,
) -> None:
    python = sys.executable
    region_output = scenario_path(scenario_year, "region_map.generated.json")
    nation_output = scenario_path(scenario_year, "nations.catalog.json")
    research_output = scenario_path(scenario_year, "research.catalog.json")
    claim_output = scenario_path(scenario_year, "claim_map.generated.json")

    run([
        python,
        "tools/build_region_outline_data.py",
        "--raw-json",
        raw_region_input,
        "--output",
        region_output,
        "--templates-dir",
        str(templates_dir),
        "--scenario-year",
        scenario_year,
        "--languages",
        args.catalog_languages,
    ])
    run([
        python,
        "tools/build_nation_catalog.py",
        "--templates-dir",
        str(templates_dir),
        "--languages",
        args.catalog_languages,
        "--region-map",
        region_output,
        "--bilateral-template",
        str(bilateral_template),
        "--scenario-year",
        scenario_year,
        "--output",
        nation_output,
    ])
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
        "--scenario-year",
        scenario_year,
        "--output",
        research_output,
    ])
    run([
        python,
        "tools/build_claim_data.py",
        "--region-map",
        region_output,
        "--bilateral-template",
        str(bilateral_template),
        "--aliases",
        "data/manual/region_aliases.json",
        "--nation-catalog",
        nation_output,
        "--research-catalog",
        research_output,
        "--scenario-year",
        scenario_year,
        "--output",
        claim_output,
    ])


def copy_default_scenario_outputs() -> None:
    mappings = (
        ("region_map.generated.json", "data/generated/region_map.generated.json"),
        ("claim_map.generated.json", "data/generated/claim_map.generated.json"),
        ("nations.catalog.json", "data/generated/nations.catalog.json"),
        ("research.catalog.json", "data/generated/research.catalog.json"),
    )
    for source_name, target_name in mappings:
        shutil.copyfile(ROOT / scenario_path(DEFAULT_SCENARIO_YEAR, source_name), ROOT / target_name)


def build_pages(args: argparse.Namespace) -> None:
    python = sys.executable

    templates_dir = Path(args.templates_dir) if args.templates_dir else default_templates_dir()
    bilateral_template = Path(args.bilateral_template) if args.bilateral_template else None
    if not bilateral_template:
        if not templates_dir:
            raise SystemExit("Pass --templates-dir or --bilateral-template.")
        bilateral_template = template_file(templates_dir, "TIBilateralTemplate.json")
    if not bilateral_template.is_file():
        raise SystemExit(f"Missing required bilateral template file: {bilateral_template}")
    if not templates_dir:
        templates_dir = infer_templates_dir(bilateral_template)
    if not templates_dir:
        raise SystemExit("Scenario rebuild requires --templates-dir or a bilateral template inside Templates.")
    require_template_files(templates_dir, require_bilateral_template=not args.bilateral_template)
    if args.scenario_year != DEFAULT_SCENARIO_YEAR:
        print(f"Warning: --scenario-year is deprecated; generating all scenarios and keeping {DEFAULT_SCENARIO_YEAR} as default.")

    raw_region_input = prepare_region_geometry(args)
    for scenario_year in SCENARIO_YEARS:
        build_scenario_outputs(
            args,
            templates_dir=templates_dir,
            bilateral_template=bilateral_template,
            raw_region_input=raw_region_input,
            scenario_year=scenario_year,
        )
    copy_default_scenario_outputs()
    run([
        python,
        "tools/build_scenario_bundle.py",
        "--base-dir",
        str(SCENARIO_OUTPUT_ROOT),
        "--output",
        "data/generated/scenario_bundle.generated.json",
        "--default-scenario",
        DEFAULT_SCENARIO_YEAR,
    ])
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
    parser.add_argument("--scenario-year", default=DEFAULT_SCENARIO_YEAR, choices=SCENARIO_YEARS, help="Deprecated compatibility option. Rebuilds now generate all scenarios and keep 2026 as the default.")
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
