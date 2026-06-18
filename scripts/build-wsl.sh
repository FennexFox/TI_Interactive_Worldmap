#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODE="checked-in"
RUN_E2E=0
INSTALL=1
SKIP_VERIFY=0
SCENARIO_YEAR="${SCENARIO_YEAR:-2026}"
CATALOG_LANGUAGES="${CATALOG_LANGUAGES:-kor,en}"
VENV_DIR="${VENV_DIR:-.venv-wsl}"
SHIM_DIR="${SHIM_DIR:-.wsl-build-bin}"
TEMPLATES_DIR="${TI_TEMPLATES_DIR:-}"
REGION_OUTLINES="${TI_REGION_OUTLINES:-}"
REGION_MAP_JSON="${TI_REGION_MAP_JSON:-}"
REFRESH_REGION_OUTLINES=0

usage() {
  cat <<'USAGE'
Build Terra Invicta Interactive Worldmap from WSL.

Default mode rebuilds docs/ from checked-in generated data:
  ./scripts/build-wsl.sh

Rebuild catalogs and pages from a local Terra Invicta install while reusing the checked-in region geometry:
  ./scripts/build-wsl.sh --from-game

Refresh Unity region geometry explicitly when the game's regionoutlines asset changes:
  ./scripts/build-wsl.sh --from-game --refresh-region-outlines

Common examples:
  ./scripts/build-wsl.sh --e2e
  ./scripts/build-wsl.sh --skip-install
  ./scripts/build-wsl.sh --from-game \
    --templates-dir '/mnt/c/Program Files (x86)/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates' \
    --region-outlines '/mnt/c/Program Files (x86)/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/AssetBundles/regionoutlines'

Environment variables:
  TI_TEMPLATES_DIR      Terra Invicta StreamingAssets/Templates path.
  TI_REGION_OUTLINES   Terra Invicta StreamingAssets/AssetBundles/regionoutlines path.
  TI_REGION_MAP_JSON   Pre-extracted raw region outline JSON fixture.
  SCENARIO_YEAR        Deprecated compatibility setting. All supported scenarios are rebuilt.
  CATALOG_LANGUAGES    Comma-separated catalog languages. Defaults to kor,en.
  VENV_DIR             Python virtualenv directory. Defaults to .venv-wsl.
  SHIM_DIR             Temporary local command shim directory. Defaults to .wsl-build-bin.

Options:
  --checked-in         Build docs/ from committed data/generated/*.json. Default.
  --from-game          Rebuild generated catalogs from a local Terra Invicta install.
  --templates-dir PATH Override Terra Invicta Templates directory.
  --region-outlines PATH
                       Override regionoutlines asset bundle path.
  --region-map-json PATH
                       Use a pre-extracted raw region outline JSON fixture.
  --refresh-region-outlines
                       Re-extract region geometry from --region-outlines instead of
                       reusing data/generated/region_map.generated.json.
  --scenario-year YEAR Deprecated compatibility option. All supported scenarios are rebuilt.
  --languages LIST     Comma-separated catalog languages.
  --e2e                Run Playwright end-to-end tests after verify.
  --skip-install       Do not install Python/Node dependencies.
  --skip-verify        Build only; skip npm run verify.
  -h, --help           Show this help.
USAGE
}

die() {
  echo "error: $*" >&2
  exit 1
}

have() {
  command -v "$1" >/dev/null 2>&1
}

ensure_python_command() {
  if have python; then
    return 0
  fi
  if have python3; then
    mkdir -p "$SHIM_DIR"
    ln -sf "$(command -v python3)" "$SHIM_DIR/python"
    export PATH="$ROOT/$SHIM_DIR:$PATH"
    return 0
  fi
  die "python is required. Install it in WSL first: sudo apt install python3 python3-venv python3-pip"
}

is_windows_path() {
  [[ "$1" =~ ^[A-Za-z]:[\\/] ]]
}

to_wsl_path() {
  local input="$1"
  if [[ -z "$input" ]]; then
    return 0
  fi
  if is_windows_path "$input" && have wslpath; then
    wslpath -u "$input"
  else
    printf '%s\n' "$input"
  fi
}

first_existing() {
  local candidate
  for candidate in "$@"; do
    if [[ -e "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

steam_roots() {
  local drive
  printf '%s\n' \
    "$HOME/.steam/steam/steamapps/common/Terra Invicta" \
    "$HOME/.local/share/Steam/steamapps/common/Terra Invicta"
  for drive in c d e f g; do
    printf '/mnt/%s/Program Files (x86)/Steam/steamapps/common/Terra Invicta\n' "$drive"
    printf '/mnt/%s/SteamLibrary/steamapps/common/Terra Invicta\n' "$drive"
  done
}

discover_templates_dir() {
  if [[ -n "$TEMPLATES_DIR" ]]; then
    to_wsl_path "$TEMPLATES_DIR"
    return 0
  fi

  local root
  local candidates=()
  while IFS= read -r root; do
    candidates+=("$root/TerraInvicta_Data/StreamingAssets/Templates")
  done < <(steam_roots)

  first_existing "${candidates[@]}"
}

discover_region_outlines() {
  if [[ -n "$REGION_OUTLINES" ]]; then
    to_wsl_path "$REGION_OUTLINES"
    return 0
  fi

  local templates="$1"
  if [[ -n "$templates" ]]; then
    local streaming_assets
    streaming_assets="$(cd "$(dirname "$templates")" && pwd)"
    first_existing "$streaming_assets/AssetBundles/regionoutlines" && return 0
  fi

  local root
  local candidates=()
  while IFS= read -r root; do
    candidates+=("$root/TerraInvicta_Data/StreamingAssets/AssetBundles/regionoutlines")
  done < <(steam_roots)

  first_existing "${candidates[@]}"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --checked-in)
        MODE="checked-in"
        shift
        ;;
      --from-game)
        MODE="from-game"
        shift
        ;;
      --templates-dir)
        [[ $# -ge 2 ]] || die "--templates-dir requires a path"
        TEMPLATES_DIR="$2"
        shift 2
        ;;
      --region-outlines)
        [[ $# -ge 2 ]] || die "--region-outlines requires a path"
        REGION_OUTLINES="$2"
        shift 2
        ;;
      --region-map-json)
        [[ $# -ge 2 ]] || die "--region-map-json requires a path"
        REGION_MAP_JSON="$2"
        shift 2
        ;;
      --refresh-region-outlines)
        REFRESH_REGION_OUTLINES=1
        shift
        ;;
      --scenario-year)
        [[ $# -ge 2 ]] || die "--scenario-year requires 2022, 2026, or 2070"
        SCENARIO_YEAR="$2"
        shift 2
        ;;
      --languages)
        [[ $# -ge 2 ]] || die "--languages requires a comma-separated list"
        CATALOG_LANGUAGES="$2"
        shift 2
        ;;
      --e2e)
        RUN_E2E=1
        shift
        ;;
      --skip-install)
        INSTALL=0
        shift
        ;;
      --skip-verify)
        SKIP_VERIFY=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "unknown option: $1"
        ;;
    esac
  done

  case "$SCENARIO_YEAR" in
    2022|2026|2070) ;;
    *) die "--scenario-year must be one of: 2022, 2026, 2070" ;;
  esac
}

bootstrap_python() {
  if [[ "$INSTALL" -eq 1 ]]; then
    have python3 || die "python3 is required. Install it in WSL first: sudo apt install python3 python3-venv python3-pip"
    if [[ ! -x "$VENV_DIR/bin/python" ]]; then
      python3 -m venv "$VENV_DIR" || die "failed to create virtualenv. Try: sudo apt install python3-venv"
    fi
    export PATH="$ROOT/$VENV_DIR/bin:$PATH"
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
  else
    if [[ -x "$VENV_DIR/bin/python" ]]; then
      export PATH="$ROOT/$VENV_DIR/bin:$PATH"
    fi
    ensure_python_command
  fi
}

bootstrap_node() {
  have npm || die "npm is required. Install Node.js/npm inside WSL first."

  if [[ "$INSTALL" -eq 1 ]]; then
    if [[ -f package-lock.json ]]; then
      npm ci
    else
      npm install
    fi
    if [[ "$RUN_E2E" -eq 1 ]]; then
      npx playwright install chromium
    fi
  fi
}

run_checked_in_build() {
  python tools/build_pages.py
  if [[ "$SKIP_VERIFY" -eq 0 ]]; then
    npm run verify
  fi
}

run_from_game_build() {
  local templates
  templates="$(discover_templates_dir || true)"
  [[ -n "$templates" ]] || die "could not find Terra Invicta Templates directory. Pass --templates-dir or set TI_TEMPLATES_DIR."
  [[ -d "$templates" ]] || die "Templates directory does not exist: $templates"

  local args=(
    tools/rebuild_pages.py
    --templates-dir "$templates"
    --catalog-languages "$CATALOG_LANGUAGES"
    --no-commit
  )

  if [[ "$SCENARIO_YEAR" != "2026" ]]; then
    echo "warning: --scenario-year/SCENARIO_YEAR is deprecated; rebuilding 2022, 2026, and 2070 with 2026 as default" >&2
  fi

  if [[ "$SKIP_VERIFY" -eq 1 ]]; then
    args+=(--skip-verify)
  fi

  if [[ -n "$REGION_MAP_JSON" ]]; then
    args+=(--region-map-json "$(to_wsl_path "$REGION_MAP_JSON")")
  else
    local outlines
    outlines="$(discover_region_outlines "$templates" || true)"
    if [[ -n "$outlines" ]]; then
      args+=(--region-outlines "$outlines")
      if [[ "$REFRESH_REGION_OUTLINES" -eq 1 ]]; then
        args+=(--refresh-region-outlines)
      fi
    elif [[ "$REFRESH_REGION_OUTLINES" -eq 1 ]]; then
      die "--refresh-region-outlines requires regionoutlines. Pass --region-outlines or set TI_REGION_OUTLINES."
    elif [[ ! -f data/generated/region_map.generated.json ]]; then
      die "could not find regionoutlines and no existing data/generated/region_map.generated.json is present. Pass --region-outlines or --region-map-json."
    else
      echo "warning: regionoutlines not found; reusing existing data/generated/region_map.generated.json" >&2
    fi
  fi

  python "${args[@]}"
}

main() {
  parse_args "$@"
  bootstrap_python
  bootstrap_node

  if [[ "$MODE" == "from-game" ]]; then
    run_from_game_build
  else
    run_checked_in_build
  fi

  if [[ "$RUN_E2E" -eq 1 ]]; then
    npm run test:e2e
  fi

  echo "Build completed. Generated site is in docs/."
}

main "$@"
