# Terra Invicta Interactive Worldmap

Standalone builder and GitHub Pages site for a Terra Invicta segmented world map.

The first pass is a browser-local **Claim / Unification Map**. It renders Terra Invicta regions as segmented polygons and visualizes direct nation claims from `TIBilateralTemplate.json`, including project-unlocked claims, projectless claims, hostile claims, capital claims, breakaway-gated claims, and initial territory anchors.

The generated Pages site lives in `docs/index.html`.

## Current scope

- Render extracted Terra Invicta region outlines as an SVG map.
- Build direct claim profiles from `TIBilateralTemplate.json`.
- Include projectless/basic claims as well as project-unlocked claims.
- Distinguish hostile claims from peaceful claims.
- Treat Taiwan-style cases as `breakaway_gated_existing` instead of pure formables.
- Keep the first pass static and save-file independent.
- Leave recursive megastate absorption closure for a later issue.

## Setup

Install Python dependencies and Node dependencies in the shell you plan to use.

Windows PowerShell:

```powershell
python -m pip install -r requirements.txt
npm ci
npx playwright install chromium
```

WSL:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm
./scripts/build-wsl.sh --help
```

When using WSL, make sure `node`, `npm`, and `python` resolve inside WSL, not to
Windows executables under `/mnt/c/...`:

```bash
which node
which npm
which python3
```

## Build workflow overview

There are three build levels:

1. **Checked-in/UI build**: rebuilds `docs/` from source files and committed generated
   data. It does not read the Terra Invicta install.
2. **Local game data rebuild**: reads Terra Invicta `Templates` to refresh nation,
   research, claim, and metadata catalogs for all supported start scenarios while
   reusing the committed `data/generated/region_map.generated.json` geometry.
3. **Region outline refresh**: explicitly re-extracts the Unity `regionoutlines` asset
   before rebuilding catalogs and pages. This is only needed when the game's region
   geometry changes or when validating the outline extractor.

The default local-game workflow intentionally reuses the checked-in region geometry
because Unity asset extraction is slower and more fragile than template/catalog rebuilds.
Use `--refresh-region-outlines` only when you intend to update
`data/generated/region_map.generated.json` from the Unity asset.

Generated scenario data is checked in as `data/generated/scenario_bundle.generated.json`
with schema version 2. It contains duplicated per-scenario `regionMap`, `claimMap`, and
catalog data for `2022`, `2026`, and `2070`; `2026` remains the default scenario and is
also copied to the legacy top-level generated files for compatibility.

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

This refreshes generated catalogs from the local game install while reusing the existing
region geometry:

```powershell
python .\tools\rebuild_pages.py `
  --templates-dir "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\Templates" `
  --region-outlines "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\AssetBundles\regionoutlines" `
  --no-commit
```

`--region-outlines` is accepted here so the same command can refresh geometry if needed,
but existing `data/generated/region_map.generated.json` is reused by default. To force a
Unity outline extraction, add `--refresh-region-outlines`:

```powershell
python .\tools\rebuild_pages.py `
  --templates-dir "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\Templates" `
  --region-outlines "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\AssetBundles\regionoutlines" `
  --refresh-region-outlines `
  --no-commit
```

Template-derived region ownership, nation status, research claim grants, and claim rows
are rebuilt for `2022`, `2026`, and `2070` in one pass. The `--scenario-year` option is
deprecated; `2026` remains the default and legacy top-level output.

For development fixtures, use:

```powershell
python .\tools\rebuild_pages.py `
  --bilateral-template .\fixtures\TIBilateralTemplate.json `
  --region-map-json .\fixtures\region_outlines.raw.json `
  --no-commit
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

To rebuild, verify, commit generated changes, and push the current branch:

```powershell
python .\tools\rebuild_pages.py --templates-dir "<Templates>" --region-outlines "<regionoutlines>"
```

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
- `docs/assets/render/*.js`
- `docs/assets/styles.css`
- `docs/index.html`

Other local changes are left untouched.
