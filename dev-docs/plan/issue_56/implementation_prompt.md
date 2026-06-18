# Issue #56 Implementation Prompt

Work on issue #56 for `FennexFox/TI_Interactive_Worldmap`.

## Goal

Implement a narrow visual pass for hostile claims.

Regions whose active claim overlay has `hostileClaim: true` should be visually distinguishable with a hatch/pattern fill or an equivalent non-color-only treatment. Keep the scope limited to hostile claim visualization and claim filter regressions.

## Repository context

- The app already has generated claim data that distinguishes peaceful and hostile claims.
- The UI already has a claim kind filter for peaceful + hostile, peaceful only, and hostile only.
- The README describes hostile claims as part of the current direct claim-map scope.
- This task should not implement recursive hostile-claim semantics, automatic hostile path expansion, route-aware successor-state modeling, or maximum recursive closure logic.
- Hostile claims should not be visually presented as having the same semantic confidence as ordinary peaceful merger paths.

## Implementation requirements

1. Add a visible hatch/pattern treatment for active overlay regions where the active claim row/context has `hostileClaim: true`.
2. Do not apply the hostile hatch/pattern to peaceful claims.
3. Preserve the existing hostile red outline styling, unless replacing it with an equally clear hostile outline treatment is cleaner.
4. Ensure the existing `claimKind` filter still works:
   - Peaceful + hostile
   - Peaceful only
   - Hostile only
5. Ensure project-specific claim views only hatch hostile claims that belong to the active project/context.
6. Avoid broad renderer rewrites or data schema changes unless strictly necessary.
7. Keep generated build artifacts out of the patch unless the repository's normal workflow explicitly requires them.

## Preferred approach

- First inspect the current overlay rendering path and identify where hostile claim metadata reaches the renderer.
- Prefer a reusable SVG pattern definition, CSS class, or renderer-level styling hook over duplicating per-region styling logic.
- Avoid relying on color alone; the hatch/pattern should improve readability and accessibility.
- Keep the implementation robust for mixed peaceful/hostile overlays and dense recursive/expansion views.
- If the renderer already has an SVG `<defs>` area or layer setup, reuse that rather than creating a separate ad-hoc pattern path per region.
- If multiple overlay modes can draw the same region, make sure the hostile treatment follows the active displayed claim context, not a stale or unrelated claim row.

## Validation

Run the repository's existing validation scripts:

```bash
npm run build
npm run verify
```

If Playwright/browser validation is available in the local environment, also run:

```bash
npm run test:e2e
```

If any script cannot run in the current environment, report the exact command, failure reason, and whether the failure appears environment-related or implementation-related.

## Manual smoke tests

1. Select a nation with known hostile claims, such as China or another large claimant, and confirm hostile regions are hatched/patterned.
2. Confirm peaceful claim regions are not hatched.
3. Switch the claim kind filter between:
   - Peaceful + hostile
   - Peaceful only
   - Hostile only
   and confirm the hatch appears only when hostile claims are actually displayed.
4. Select a project-specific claim view and confirm only hostile claims in that active context are hatched.
5. Confirm normal selection, hover overlays, reachable-capital overlays, zoom, pan, and world-wrap behavior are not visibly regressed.

## Deliverables

- Source changes implementing the hostile claim hatch/pattern.
- Any minimal test or smoke-test documentation updates that fit the existing repository style.
- A concise summary of changed files, validation results, and any follow-up concerns.

## Do not

- Do not implement automatic maximum recursive closure.
- Do not change the semantics of hostile claims.
- Do not treat hostile recursive paths as ordinary peaceful merger inheritance.
- Do not add unrelated UI redesigns.
- Do not perform broad refactors outside the rendering/styling path needed for this issue.
