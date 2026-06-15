# Phase 05: Reachable capital candidates

## Goal

- Add a toggle and markers for capital regions inside the current manual recursive envelope.

## Scope

- Add UI for `showReachableCapitalCandidates` near the expansion-node card.
- Derive candidate capital regions from the current envelope and `capitalNationsByRegion`.
- Exclude already pinned nodes and distinguish candidates from ordinary capitals and pinned nodes.
- Make candidate markers practical focus and pin targets.
- Update markers when focus, pins, claim filters, language, or candidate visibility changes.

## Non-goals

- No auto-pin behavior.
- No route recommendation ranking.
- No saved candidate lists or candidate export.

## Affected files

- `src/index.html`
- `src/app.js`
- `src/styles.css`
- `tests/**` if e2e coverage is added or updated.
- `docs/plan/issue_32/05-reachable-capital-candidates.md`
- Rebuilt generated Pages output after source changes.

## Implementation steps

- Add toggle UI and bind it to app state.
- Build candidate descriptors from the current envelope set and capital index.
- Render candidate markers in a dedicated layer or a clearly keyed marker subset.
- Add marker event handling through the hit layer or overlay controls without breaking map panning and region click behavior.
- Add or update e2e coverage for toggling candidates, pinning a candidate, and ensuring candidates update after pin/focus changes.

## Acceptance criteria

- Reachable capital candidates can be toggled on and off.
- Candidate markers update when focus, pinned nodes, or relevant filters change.
- Candidate markers are visually distinct from ordinary capital markers and pinned nodes.
- Candidate markers can be used to focus or pin practical expansion targets.
- Nothing is auto-pinned.
- Existing hover, click, claim overlay, secondary capital preview, search, filters, language switching, and world-wrap behavior still work.

## Validation commands

- `npm run build`
- `npm run verify`
- `npm run test:e2e`

## Manual smoke tests

- Focus China and enable reachable capital candidates.
- Confirm capitals inside China's current boundary are marked.
- Pin Tokyo from a candidate marker or related control and confirm the marker becomes pinned rather than remaining a candidate.
- Switch language and confirm candidate labels remain correct.
- Test default wrapped mode and `?worldWrap=0`.

## Rollback risks

- Medium interaction risk: overlay markers with pointer events can interfere with pan/zoom or hit-region clicks.
- Medium noise risk: candidate markers can clutter dense regions unless styling is compact.

## Progress

- Not started.

## Decision log

- Candidate markers are derived from the current manual envelope and never perform automatic closure.

## Outcomes / Retrospective

- Not completed yet.
