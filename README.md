# Terra Invicta Interactive Worldmap

Standalone segmented world map viewer for Terra Invicta region, claim, unification, and megastate planning data.

The intended first milestone is a browser-local **Claim / Unification Map** built from a local Terra Invicta install. The tool should visualize which nations have claims on which regions, which claims are unlocked by research, and which claims are hostile, peaceful, capital, formable, or breakaway-gated.

## Initial direction

- Render Terra Invicta regions as a segmented world map.
- Use extracted region outline data for map geometry.
- Use `TIBilateralTemplate.json` as the canonical source for claim and breakaway relationships.
- Keep the first MVP independent from save-file parsing.
- Treat GitHub Pages as the primary deployment target.

## Repository workflow

Issues should be written in English and structured around:

- Summary
- Problem
- Direction
- Data/model requirements
- UI requirements
- Non-goals
- Acceptance criteria

Pull requests should describe user-visible behavior, data/model impact, UI impact, and verification steps.
