<!-- SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors -->
<!-- SPDX-License-Identifier: MIT -->

# Terra Invicta Interactive Worldmap

Standalone builder and GitHub Pages site for a Terra Invicta segmented world map.

The first pass is a browser-local **Claim / Unification Map**. It renders Terra Invicta regions as segmented polygons and visualizes direct nation claims from `TIBilateralTemplate.json`, including project-unlocked claims, projectless claims, hostile claims, capital claims, breakaway-gated claims, and initial territory anchors.

The generated Pages site lives in `docs/index.html`.

## Current scope

- Render extracted Terra Invicta region outlines as an SVG map.
- Build direct claim profiles from `TIBilateralTemplate.json`.
- Include projectless/basic claims as well as project-unlocked claims.
- Distinguish hostile claims from peaceful claims.
- Switch the visible map between `2003 (DLC)`, `2022`, `2026`, `2070`, and
  `2112 - Broken Earth (DLC)`. Broken Earth uses the internal scenario ID `1962`.
- Treat Taiwan-style cases as `breakaway_gated_existing` instead of pure formables.
- Keep the first pass static and save-file independent.
- Leave recursive megastate absorption closure for a later issue.

## Setup

Install Python dependencies and Node dependencies in the shell you plan to use.

Windows PowerShell:

```powershell
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt
npm ci
npx playwright install chromium
```

WSL:

Install `nvm` and `pyenv` inside WSL, then select the repository-pinned
toolchain from the repository root:

```bash
set -euo pipefail
nvm install "$(cat .nvmrc)"
nvm use "$(cat .nvmrc)"
pyenv install --skip-existing "$(cat .python-version)"
pyenv local "$(cat .python-version)"
node -e "if (process.versions.node.split('.')[0] !== '24') process.exit(1)"
python3 -c "import sys; assert sys.version_info[:2] == (3, 12), sys.version"
./scripts/build-wsl.sh --help
```

When using WSL, make sure `node`, `npm`, and `python` resolve inside WSL, not to
Windows executables under `/mnt/c/...`:

```bash
which node
which npm
which python3
```

CI and contributor checks use Node 24 and Python 3.12 (also recorded in
`.nvmrc` and `.python-version`). Run the correctness-focused safety gates with:

```bash
npm run lint
npm run test:unit
npm run build
npm run check:generated
npm run verify
npm run test:e2e -- --shard=1/2
npm run test:e2e -- --shard=2/2
```

The Pages build manifest is shared by the builder, generated-output verifier, and
publishing helper. Any new `src/**/*.js` module is copied to the matching
`docs/assets/**` path automatically; stale or missing deployment copies fail
`npm run verify`. Browser-free Node and Python coverage runs under
`npm run test:unit`; Playwright behavior coverage is organized under
`tests/e2e/**` and shares app-ready, selection, region interaction, and
animation-frame fixtures from `tests/fixtures/app.js`.

## Build workflow overview

There are three build levels:

1. **Checked-in/UI build**: rebuilds `docs/` from source files and committed generated
   data. It does not read the Terra Invicta install.
2. **Local game data rebuild**: reads the base Terra Invicta `Templates` and installed
   Dark Skies DLC scenario templates to refresh nation, research, claim, and metadata
   catalogs for all supported start scenarios while reusing the committed
   `data/generated/region_map.generated.json` geometry.
3. **Region outline refresh**: explicitly re-extracts the Unity `regionoutlines` asset
   before rebuilding catalogs and pages. This is only needed when the game's region
   geometry changes or when validating the outline extractor.

The default local-game workflow intentionally reuses the checked-in region geometry
because Unity asset extraction is slower and more fragile than template/catalog rebuilds.
Use `--refresh-region-outlines` only when you intend to update
`data/generated/region_map.generated.json` from the Unity asset.

Generated scenario data is checked in as `data/generated/scenario_bundle.generated.json`
with schema version 2. It contains duplicated per-scenario `regionMap`, `claimMap`, and
catalog data for `2003 (DLC)`, `2022`, `2026`, `2070`, and
`2112 - Broken Earth (DLC)` (internal ID `1962`);
`2026` remains the default scenario and is also copied to the legacy top-level generated
files for compatibility. The static app loads the bundle and exposes all five scenarios
through the sidebar selector.

### Scenario-specific region ownership

Starting ownership comes from the active scenario's `TIBilateralTemplate.json` Claim
rows where `initialOwner` is `true`. In those rows, `nation1` is the starting owner and
`region1` identifies the scenario region template. The region builder resolves that
template through `TIRegionTemplate.mapRegionName` before writing the canonical
`regions[].nationTag`. `outlineNationTag` remains separate as Unity geometry/extraction
provenance.

Do not derive starting ownership from `TIRegionTemplate.sortNation` or
`TIMapRegionTemplate.friendlyNationName`; those are sorting/display metadata and do not
represent scenario-specific 2070 ownership. The generated-output verifier cross-checks
every region's `nationTag` against its scenario-filtered `initialOwner` Claim, and the
catalog-builder tests require generation to fail when initial-owner rows conflict or a
scenario region has no initial owner.

Ownership/color regression coverage spans three levels:

- generator fixtures prove one canonical region can have different owners by scenario,
  and reject conflicting or missing initial-owner relations;
- `npm run verify` semantically compares generated region ownership with the
  authoritative Claims carried in each scenario claim map;
- Playwright checks every supported scenario for one base fill per non-empty
  `data-nation` and verifies a real 2026/2070 ownership switch restores correctly.

## Windows workflows

### Rebuild locally from checked-in generated data

```powershell
npm run build
npm run verify
npm run test:e2e
```

`npm run test:e2e` runs Playwright against the generated `docs/` site and verifies the
language selector updates both static shell copy and dynamic UI text.

### Rebuild from a local Terra Invicta install

This refreshes generated catalogs from the local game install, including installed Dark
Skies DLC scenario templates, while reusing the existing region geometry:

```powershell
python .\tools\rebuild_pages.py `
  --templates-dir "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\Templates" `
  --region-outlines "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\AssetBundles\regionoutlines"
```

`--region-outlines` is accepted here so the same command can refresh geometry if needed,
but existing `data/generated/region_map.generated.json` is reused by default. To force a
Unity outline extraction, add `--refresh-region-outlines`:

```powershell
python .\tools\rebuild_pages.py `
  --templates-dir "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\Templates" `
  --region-outlines "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\AssetBundles\regionoutlines" `
  --refresh-region-outlines
```

Template-derived region ownership, nation status, research claim grants, and claim rows
are rebuilt for `2003 (DLC)`, `2022`, `2026`, `2070`, and
`2112 - Broken Earth (DLC)` (`1962`) in one pass.
The Dark Skies DLC scenario templates are discovered alongside the base game templates.
For a nonstandard DLC location, set `TI_DLC_DIR` or pass `--dlc-dir` with the path to
`DLC_Content/DarkSkies`.
The `--scenario-year` option is deprecated; `2026` remains the default and legacy
top-level output.

For development fixtures, use:

```powershell
python .\tools\rebuild_pages.py `
  --bilateral-template .\fixtures\TIBilateralTemplate.json `
  --region-map-json .\fixtures\region_outlines.raw.json
```

`TI_TEMPLATES_DIR` can also point to `TerraInvicta_Data/StreamingAssets/Templates`.

## WSL workflows

Use `scripts/build-wsl.sh` from inside WSL. The script creates and uses `.venv-wsl`,
installs Python/Node dependencies unless `--skip-install` is passed, and writes the
static site to `docs/`.

### Rebuild locally from checked-in generated data

```bash
./scripts/build-wsl.sh
```

This is the WSL equivalent of the checked-in/UI build. It rebuilds `docs/` from committed
generated data and runs `npm run verify` unless `--skip-verify` is passed.

### Rebuild from a local Terra Invicta install

```bash
./scripts/build-wsl.sh --from-game
```

The script auto-detects common Linux Steam paths and common Windows Steam paths mounted
under `/mnt/c`, `/mnt/d`, and other drives. To pass paths explicitly:

```bash
./scripts/build-wsl.sh --from-game \
  --templates-dir "/mnt/c/Program Files (x86)/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/Templates" \
  --region-outlines "/mnt/c/Program Files (x86)/Steam/steamapps/common/Terra Invicta/TerraInvicta_Data/StreamingAssets/AssetBundles/regionoutlines"
```

`--from-game` reuses `data/generated/region_map.generated.json` by default. To refresh
Unity region geometry as well:

```bash
./scripts/build-wsl.sh --from-game --refresh-region-outlines
```

Useful WSL options:

```bash
./scripts/build-wsl.sh --from-game --languages kor,en
./scripts/build-wsl.sh --from-game --skip-verify
./scripts/build-wsl.sh --e2e
```

## Deploy workflow

Enable GitHub Pages for the repository with GitHub Actions as the source. The workflow in `.github/workflows/pages.yml` publishes the `docs/` directory on pushes to `main`, or when run manually.

`rebuild_pages.py` is non-publishing by default: it rebuilds all scenario catalogs
and Pages output, verifies them, and leaves changes in the working tree. Use
`npm run rebuild:game` for that safe workflow. Git operations are opt-in:

- `--commit` stages only manifest-declared generated/deployment paths and commits them;
- `--push` implies `--commit` and pushes the selected branch, or the current branch;
- `--no-commit` and `--no-push` remain accepted as deprecated compatibility aliases
  for one transition cycle (`--no-push` preserves the former commit-only behavior).

To rebuild, verify, commit generated changes, and push the current branch explicitly:

```powershell
python .\tools\rebuild_pages.py --templates-dir "<Templates>" --region-outlines "<regionoutlines>" --push
```

`npm run deploy` is the equivalent explicit `--push` workflow. Pass
`--branch <name>` with `--push` to select a branch; otherwise the current branch is
used. Neither local nor CI validation performs a real push.

The deploy helper only stages generated paths:

- `data/generated/nations.catalog.json`
- `data/generated/research.catalog.json`
- `data/generated/region_map.generated.json`
- `data/generated/claim_map.generated.json`
- `data/generated/scenario_bundle.generated.json`
- `data/generated/scenarios/**`
- `docs/data/generated/nations.catalog.json`
- `docs/data/generated/research.catalog.json`
- `docs/data/region_map.generated.json`
- `docs/data/claim_map.generated.json`
- `docs/data/scenario_bundle.generated.json`
- `docs/assets/data.generated.js`
- `docs/assets/app.js`
- `docs/assets/state/*.js`
- `docs/assets/data/*.js`
- `docs/assets/interaction/*.js`
- `docs/assets/render/*.js`
- `docs/assets/runtime/*.js`
- `docs/assets/ui/*.js`
- `docs/assets/styles.css`
- `docs/index.html`

Other local changes are left untouched.

## Documentation and planning notes

The repository uses `docs/` as the generated GitHub Pages output. Do not use `docs/` for planning documentation and do not hand-edit generated `docs/**` artifacts as source.

Durable project guidance lives in:

- `README.md` for setup, build, deploy, and user-facing scope;
- `AGENTS.md` for contributor and agent workflow rules;
- `.github/**` for issue, PR, review, and automation guidance.

Temporary implementation plans and profiling notes live in `dev-docs/plan/**`. Those folders may be deleted after the related PR is merged, closed, or abandoned. Before deleting a plan folder, promote only still-useful decisions or validated findings into durable documentation or the relevant GitHub issue.

## License

Project-owned source code, build/test tooling, and documentation are licensed
under the MIT License. See `LICENSE` and the SPDX metadata in `REUSE.toml`.

Generated catalogs, region geometry, scenario bundles, the generated JS data
bundle, and manual data normalization tables that contain Terra Invicta-derived
identifiers or data are not covered by MIT. They are marked with
`LicenseRef-Terra-Invicta-Data` in `REUSE.toml` and remain subject to the
terms and ownership applicable to Terra Invicta and its rightsholders.
