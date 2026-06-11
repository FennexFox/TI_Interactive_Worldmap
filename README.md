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

```powershell
python -m pip install -r requirements.txt
npm ci
npx playwright install chromium
```

## Rebuild locally from checked-in generated data

```powershell
npm run build
npm run verify
npm run test:e2e
```

`npm run test:e2e` runs Playwright against the generated `docs/` site and verifies the language selector updates both static shell copy and dynamic UI text.

## Rebuild from a local Terra Invicta install

Pass the local template directory and either a Unity `regionoutlines` asset or a pre-extracted raw region outline JSON fixture:

```powershell
python .\tools\rebuild_pages.py `
  --templates-dir "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\Templates" `
  --region-outlines "C:\Program Files (x86)\Steam\steamapps\common\Terra Invicta\TerraInvicta_Data\StreamingAssets\AssetBundles\regionoutlines" `
  --no-commit
```

`rebuild_pages.py` uses the local Templates directory to generate committed app-facing
catalogs under `data/`, then builds the claim map from those catalogs. Template-derived
region ownership and display names default to the `2026` scenario; pass
`--scenario-year 2022` or `--scenario-year 2070` to rebuild against another supported
start year.

For development fixtures, use:

```powershell
python .\tools\rebuild_pages.py `
  --bilateral-template .\fixtures\TIBilateralTemplate.json `
  --region-map-json .\fixtures\region_outlines.raw.json `
  --no-commit
```

`TI_TEMPLATES_DIR` can also point to `TerraInvicta_Data/StreamingAssets/Templates`.

## Deploy workflow

Enable GitHub Pages for the repository with GitHub Actions as the source. The workflow in `.github/workflows/pages.yml` publishes the `docs/` directory on pushes to `main`, or when run manually.

To rebuild, verify, commit generated changes, and push the current branch:

```powershell
python .\tools\rebuild_pages.py --templates-dir "<Templates>" --region-outlines "<regionoutlines>"
```

The deploy helper only stages generated paths:

- `data/nations.catalog.json`
- `data/research.catalog.json`
- `data/generated/region_map.generated.json`
- `data/generated/claim_map.generated.json`
- `docs/data/nations.catalog.json`
- `docs/data/research.catalog.json`
- `docs/data/region_map.generated.json`
- `docs/data/claim_map.generated.json`
- `docs/assets/data.generated.js`
- `docs/assets/app.js`
- `docs/assets/state/*.js`
- `docs/assets/data/*.js`
- `docs/assets/render/*.js`
- `docs/assets/styles.css`
- `docs/index.html`

Other local changes are left untouched.
