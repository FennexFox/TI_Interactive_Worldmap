# Investigate and refactor megastate selection performance

## Issue Target And Scope Summary

- Issue target: #41
- Title: Investigate and refactor megastate selection performance
- Source plan: None
- Scope: reduce repeated model, descriptor, DOM, and full-map visual refresh work when users build a large manual megastate by pinning multiple reachable capital regions.

## Strategy

- Keep current #32/#40 behavior intact: manual expansion pins, reachable capital candidates, click-to-unpin, and formable-capital hover marker suppression remain required behavior.
- Make the hot path measurable first with debug counters and focused e2e guardrails.
- Cache manual envelope models by active data version, anchor nation, pin claimant set, and claim filters, then share the cached model across manual envelope rendering, active preview scope, and reachable capital candidate discovery.
- Cache reachable capital candidate descriptors and pass one descriptor list through panel and marker rendering during a refresh.
- Narrow selection/pin-only refreshes so they avoid unrelated full-map visual state work where the overlay geometry did not change.
- Avoid broad render-module extraction in this issue unless a helper boundary directly reduces repeated work.

## Phase Order

1. [Discovery, baseline, and diagnostics](01-discovery.md)
2. [Manual envelope and reachable candidate cache](02-model-cache.md)
3. [Selection/pin refresh narrowing](03-refresh-bounds.md)
4. [Validation, docs, and cleanup](04-verification.md)

## Phase Dependencies

- Phase 1 has no phase dependency beyond resolved issue context.
- Phase 2 depends on completion and validation of phase 1.
- Phase 3 depends on completion and validation of phase 2.
- Phase 4 depends on completion and validation of phase 3.

## Source Of Truth Decisions

- `00-master-plan.md` is the phased implementation plan source of truth.
- Phase files in this directory define phase-local scope and validation.
- Earlier monolithic plans are input material only unless explicitly retained.
- `src/app.js` remains the implementation owner for this issue. Extraction to `src/render/**` is deferred unless a phase needs it to avoid duplication.
- Generated and deployment artifacts must be produced by `npm run build`, not edited manually.

## Global Validation Expectations

- npm run build
- npm run verify
- npm run test:e2e

## Known Risks And Assumptions

- Debug counters are guardrails, not benchmarks. E2E tests should assert avoided repeated work where deterministic, but should not rely on wall-clock timing.
- The active nation overlay model still contains panel data such as incoming claims, so overlay cache-key changes must not make the information panel stale.
- Scenario-aware data is future work in #18. Any cache key added here must include active scenario/data-version inputs so #18 can invalidate correctly later.
- Automatic recursive closure in #35 should remain out of scope until this issue makes the manual megastate path cheaper.
