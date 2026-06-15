# Phase 02: Compact expansion-node card

## Goal

- Add a compact left-panel card for manually pinned expansion nodes.

## Scope

- Add a new side card in `src/index.html`.
- Render pinned rows in `src/app.js` with focus, unpin, and clear-all actions.
- Add English and Korean strings for the card, empty state, counts, and actions.
- Add CSS for compact rows and controls that fit the existing dense operational UI.
- Keep the full detail panel as a single focused nation/region path.

## Non-goals

- No recursive envelope rendering yet.
- No reachable-capital candidate markers yet.
- No drag-and-drop ordering, saved sets, import/export, or expanded detail cards.

## Affected files

- `src/index.html`
- `src/app.js`
- `src/styles.css`
- `docs/plan/issue_32/02-pinned-regions-ui.md`
- Rebuilt generated Pages output after source changes.

## Implementation steps

- Add an `expansionNodes` side card to the existing card list and default card order.
- Render pinned rows from `pinnedRegionIds` with stable pin order.
- Resolve each row to region display name, owner, and capital claimant when available.
- Bind row focus, unpin, and clear-all events without causing row-click/button event conflicts.
- Refresh the card on language change, pin changes, and clear selection.

## Acceptance criteria

- Multiple pinned regions appear simultaneously in the left panel.
- Empty state is shown when there are no pins.
- Users can focus a pinned row, unpin one row, and clear all pins.
- English and Korean labels render after language switching.
- The existing detail panel is not duplicated for every pin.

## Validation commands

- `npm run build`
- `npm run verify`
- `npm run test:e2e`

## Manual smoke tests

- Focus China and confirm the normal detail panel still works.
- Add test pins through temporary or phase-3 controls once available, then focus/unpin/clear rows.
- Switch language and confirm card labels and row action labels update.

## Rollback risks

- Medium UI risk around the existing aside-card ordering/collapse localStorage state.
- Event bubbling from row action buttons could accidentally focus rows; button handlers must stop propagation.

## Progress

- Not started.

## Decision log

- Pinned summaries are compact rows, not full detail cards, to preserve the current single-detail workflow.

## Outcomes / Retrospective

- Not completed yet.
