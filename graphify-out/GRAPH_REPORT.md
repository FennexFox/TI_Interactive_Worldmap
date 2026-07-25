# Graph Report - /home/fennexfox/Terra Invicta/TI_Interactive_Worldmap  (2026-07-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1159 nodes · 2869 edges · 48 communities (42 shown, 6 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 309 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `38b6305e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Catalog Build Pipeline|Catalog Build Pipeline]]
- [[_COMMUNITY_Publishing Rebuild CLI|Publishing Rebuild CLI]]
- [[_COMMUNITY_E2E Map Workflows|E2E Map Workflows]]
- [[_COMMUNITY_UI Refresh Localization|UI Refresh Localization]]
- [[_COMMUNITY_Region Catalog Pipeline|Region Catalog Pipeline]]
- [[_COMMUNITY_Catalog Search Tests|Catalog Search Tests]]
- [[_COMMUNITY_Generated Output Verification|Generated Output Verification]]
- [[_COMMUNITY_Pages Build Manifest|Pages Build Manifest]]
- [[_COMMUNITY_Claim Data Builder|Claim Data Builder]]
- [[_COMMUNITY_SVG Layer Rendering|SVG Layer Rendering]]
- [[_COMMUNITY_Render Performance Measurement|Render Performance Measurement]]
- [[_COMMUNITY_Claim Overlay State|Claim Overlay State]]
- [[_COMMUNITY_Hover And Selection State|Hover And Selection State]]
- [[_COMMUNITY_SVG Marker Labels|SVG Marker Labels]]
- [[_COMMUNITY_Map Interaction Composition|Map Interaction Composition]]
- [[_COMMUNITY_App Overlay Rendering|App Overlay Rendering]]
- [[_COMMUNITY_WSL Build Bootstrap|WSL Build Bootstrap]]
- [[_COMMUNITY_Capital Region Selection|Capital Region Selection]]
- [[_COMMUNITY_Map Visual State|Map Visual State]]
- [[_COMMUNITY_Claim Model Composition|Claim Model Composition]]
- [[_COMMUNITY_Map View Navigation|Map View Navigation]]
- [[_COMMUNITY_JavaScript Tooling Config|JavaScript Tooling Config]]
- [[_COMMUNITY_Application State Transitions|Application State Transitions]]
- [[_COMMUNITY_CI And Pages Workflows|CI And Pages Workflows]]
- [[_COMMUNITY_Scenario Derived Indices|Scenario Derived Indices]]
- [[_COMMUNITY_Pinned Region UI|Pinned Region UI]]
- [[_COMMUNITY_Capital Marker Rendering|Capital Marker Rendering]]
- [[_COMMUNITY_Hit Layer Interaction|Hit Layer Interaction]]
- [[_COMMUNITY_Scenario Runtime Orchestration|Scenario Runtime Orchestration]]
- [[_COMMUNITY_Active Scenario Data|Active Scenario Data]]
- [[_COMMUNITY_World Wrap Rendering|World Wrap Rendering]]
- [[_COMMUNITY_Buffered Overlay DOM|Buffered Overlay DOM]]
- [[_COMMUNITY_Render Debug Statistics|Render Debug Statistics]]
- [[_COMMUNITY_Foreign Hover Overlays|Foreign Hover Overlays]]
- [[_COMMUNITY_Tooltip Controller|Tooltip Controller]]
- [[_COMMUNITY_Game Data Licensing|Game Data Licensing]]
- [[_COMMUNITY_Hostile Claim Summaries|Hostile Claim Summaries]]
- [[_COMMUNITY_Nation Dropdown State|Nation Dropdown State]]
- [[_COMMUNITY_Pinned Capital Claims|Pinned Capital Claims]]
- [[_COMMUNITY_MIT License Terms|MIT License Terms]]
- [[_COMMUNITY_Playwright CI Configuration|Playwright CI Configuration]]
- [[_COMMUNITY_World Wrap Toggle Test|World Wrap Toggle Test]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]

## God Nodes (most connected - your core abstractions)
1. `updateNationOverlay()` - 28 edges
2. `build_catalog()` - 28 edges
3. `clearHoverPreview()` - 24 edges
4. `clearSelection()` - 23 edges
5. `getActiveNation()` - 18 edges
6. `rerenderWorldWrapLayers()` - 18 edges
7. `updateHoveredRegion()` - 18 edges
8. `main()` - 18 edges
9. `getLockedNation()` - 17 edges
10. `renderHoverOutlines()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `claim_grants_by_project()` --implements--> `Research Grants Claims, Not Immediate Actions`  [INFERRED]
  tools/build_research_catalog.py → src/index.html
- `overlay model cache reuses unchanged inputs and misses changed filters` --semantically_similar_to--> `createLruCache()`  [INFERRED] [semantically similar]
  tests/e2e/debug.spec.js → src/runtime/lru-cache.js
- `assign_nation_color_indexes()` --shares_data_with--> `SVG Map Layer Stack`  [INFERRED]
  tools/build_region_outline_data.py → src/index.html
- `build_scenario_bundle()` --implements--> `Build and Data Pipeline`  [INFERRED]
  tools/build_scenario_bundle.py → dev-docs/architecture.md
- `extract_with_unitypy()` --references--> `UnityPy Geometry Dependency`  [EXTRACTED]
  tools/extract_region_outlines.py → requirements-geometry.txt

## Import Cycles
- None detected.

## Communities (48 total, 6 thin omitted)

### Community 0 - "Catalog Build Pipeline"
Cohesion: 0.04
Nodes (72): defaultWorldCopyContext(), addCapitalMarkerNation(), appendReachableCapitalCandidateMarker(), appLoading, appLoadingDetail, buildForeignHoverOverlayDescriptorSet(), capitalRegionNames(), capitalRegionNamesForNation() (+64 more)

### Community 1 - "Publishing Rebuild CLI"
Cohesion: 0.07
Nodes (72): Build and Data Pipeline, Initial-Owner Claim Authority, Ruff Development Dependency, UnityPy Geometry Dependency, Standard-Library Build and Verification, assign_nation_color_indexes(), build_nation_adjacency(), canonical_map_region_name() (+64 more)

### Community 2 - "E2E Map Workflows"
Cohesion: 0.11
Nodes (42): baseColorAudit(), canonicalRegionBaseState(), Scenario ownership drives one consistent base fill per nation, Issue #2 acceptance: horizontal panning passes west and east map edges without a hard stop, Issue #2 acceptance: selected claim overlays render on every visible world copy, Issue #2 acceptance: wrapped copy hover and click resolve to the same canonical region, SEAM_CANDIDATES, World-wrap default hover claim overlays reuse cached descriptors across borders (+34 more)

### Community 3 - "UI Refresh Localization"
Cohesion: 0.07
Nodes (47): copyContextRenderKey(), createManualEnvelopeFragment(), createProjectedCopyFragment(), MANUAL_ENVELOPE_DEPTH_COLORS, manualEnvelopeHostileContribution(), manualEnvelopeKindLabel(), manualEnvelopeRegionLabel(), manualEnvelopeRenderKey() (+39 more)

### Community 4 - "Region Catalog Pipeline"
Cohesion: 0.09
Nodes (46): Browser App Module Boundaries, Change Rules, Generated And Derived Artifacts, Graphify And Serena Workflow, Preferred Source Paths, Subagent Policy, Development Docs Generated-Output Boundary, Plan Document Lifecycle (+38 more)

### Community 5 - "Catalog Search Tests"
Cohesion: 0.07
Nodes (23): BuildManifestTests, BuildPagesTests, RebuildPagesPublishingTests, Path, VerifyGeneratedOutputsTests, GENERATED_STAGING_PATHS, assemble_runtime_bundle(), build_pages() (+15 more)

### Community 6 - "Generated Output Verification"
Cohesion: 0.13
Nodes (37): PythonContractTests, BreakawayRow, build_breakaway_index(), build_claim_data(), build_claim_stats(), build_nation_profiles(), build_project_claim_metadata(), catalog_nation_metadata() (+29 more)

### Community 7 - "Pages Build Manifest"
Cohesion: 0.10
Nodes (37): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), display_name_values(), display_names_equal(), distinct_display_name(), initial_regions_by_nation(), load_nation_display_overrides() (+29 more)

### Community 8 - "Claim Data Builder"
Cohesion: 0.12
Nodes (40): CompletedProcess, Region Outline Refresh Policy, Explicit Region Outline Refresh, Manifest-Scoped Publication, Three Build Levels, build_scenario_bundle(), list_value(), load_json() (+32 more)

### Community 9 - "SVG Layer Rendering"
Cohesion: 0.11
Nodes (40): activeIncomingClaimKeysForState(), applyMapVisualStateForRegions(), buildActiveExpansionScope(), canUseSimpleHoverClearDelta(), canUseSimpleHoverVisualDelta(), clearHoverClaimPreviewOverlay(), clearHoverPreview(), collectCapitalMarkers() (+32 more)

### Community 10 - "Render Performance Measurement"
Cohesion: 0.10
Nodes (30): map pan after multiple reachable capital pins avoids hover and marker churn during drag, zoomed plain map pan records counters without grid rebuilds, world-wrap default renders base, grid, label, and hit copies, World-wrap panning is disabled through the fallback query flag, createMapViewController(), createWorldCopyContexts(), shouldEnableWorldWrap(), applyMapViewToSvg() (+22 more)

### Community 11 - "Claim Overlay State"
Cohesion: 0.09
Nodes (33): Browser Runtime Flow, State, Data, Render, and UI Separation, Performance-Sensitive Map Areas, Claim / Unification Map, Claim / Unification Map Application Shell, Research Grants Claims, Not Immediate Actions, SVG Map Layer Stack, captureInteractionProbes() (+25 more)

### Community 12 - "Hover And Selection State"
Cohesion: 0.10
Nodes (26): activeClaimPreviewContainsRegion(), activeClaimPreviewRegionSet(), activeClaimPreviewScopeCacheKey(), addRegionNamesToSet(), buildManualEnvelopeModel(), buildManualEnvelopeModelUncached(), buildNationOverlayModel(), buildOverlayModelCacheKey() (+18 more)

### Community 13 - "SVG Marker Labels"
Cohesion: 0.13
Nodes (26): Generated Artifact Ignores, runtimeGlobals, Strict JavaScript Rules, build-wsl.sh script, Build Pipeline, End-to-End Testing, Verification Pipeline, Playwright E2E Runtime (+18 more)

### Community 14 - "Map Interaction Composition"
Cohesion: 0.11
Nodes (19): Claim With Effective Hostility, createClaimCumulativeModel(), Cumulative Claim Entry, Effective Hostility Propagation, Project Claim Inheritance, Build Incoming Claim Index, Build Nation Overlay Model, createClaimIncomingOverlayModel() (+11 more)

### Community 15 - "App Overlay Rendering"
Cohesion: 0.13
Nodes (36): cancelPendingHoverPreview(), changedRegionIds(), chooseNationFromDropdown(), clearOverlayVisualState(), clearPinsOrSelection(), clearSelection(), closeNationDropdown(), commitReachableCapitalSelection() (+28 more)

### Community 16 - "WSL Build Bootstrap"
Cohesion: 0.15
Nodes (23): overlay render skip keys avoid unchanged DOM replacement, pre-drag click hold still allows hit-layer hover updates, claim grouped fills preserve per-region semantic outline paths, project-specific hostile claims render hatch and follow claim kind filters, single-copy grouped base fills preserve region-specific hit paths and filtering, world-wrap default applies search filtering to every copy without duplicating canonical state, world-wrap default resolves copied hit paths to canonical region state, Base mode changes preserve region, hit, and label node identity (+15 more)

### Community 17 - "Capital Region Selection"
Cohesion: 0.09
Nodes (21): devDependencies, eslint, @playwright/test, license, name, private, scripts, build (+13 more)

### Community 18 - "Map Visual State"
Cohesion: 0.25
Nodes (19): empty map clicks clear pinned regions and selection together, clearPinnedRegions(), clearSelectionState(), clearTransientClaimState(), normalizeId(), normalizeIds(), reconcileScenarioState(), setActiveIncomingClaim() (+11 more)

### Community 19 - "Claim Model Composition"
Cohesion: 0.11
Nodes (20): replaceLayerChildren(), applyFilters(), applyMapVisualState(), availableRuntimeNationIds(), buildIncomingClaimIndex(), clearScenarioSensitiveCaches(), matchingNationChoices(), prepareScenarioRuntime() (+12 more)

### Community 20 - "Map View Navigation"
Cohesion: 0.29
Nodes (5): CatalogBuilderTests, Path, write_json(), write_region_owner_fixture(), write_text()

### Community 21 - "JavaScript Tooling Config"
Cohesion: 0.10
Nodes (5): createFakeWindow(), createHarness(), FakeClassList, FakeEventTarget, FakeNode

### Community 22 - "Application State Transitions"
Cohesion: 0.13
Nodes (21): Build Pages for E2E tests, Build Pages for quality checks, E2E shard job, E2E shard matrix, Install Chromium, Lint, Quality and reproducible build, Reusable checks (+13 more)

### Community 23 - "CI And Pages Workflows"
Cohesion: 0.15
Nodes (19): createAppData(), getActiveData(), getScenarioIds(), normalizeScenarioEntry(), Scenario Catalog, scenarioIdFromEntry(), groupedClaimRegionCount(), Scenario selector switches supported start scenarios and keeps map workflows usable (+11 more)

### Community 24 - "Scenario Derived Indices"
Cohesion: 0.11
Nodes (4): FakeClassList, FakeDocument, FakeDocumentFragment, FakeNode

### Community 25 - "Pinned Region UI"
Cohesion: 0.17
Nodes (16): Build Manual Envelope Model Data, Recursive Capital Expansion, buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory(), normalizeId(), overlayResultSetContains(), resolveSecondaryCapitalPreview() (+8 more)

### Community 26 - "Capital Marker Rendering"
Cohesion: 0.18
Nodes (16): simple selected-overlay claim hover movement uses bounded visual updates, reachable capitals omit nations fully included in the selected regions claims, pinned expansion nodes update compact rows and map markers through clicks, reachable capital activation requires the claimant capital to match the displayed region, reachable capital button shows capital markers that pin without plus buttons, createAppState(), pinRegion(), toggleReachableCapitalCandidates() (+8 more)

### Community 27 - "Hit Layer Interaction"
Cohesion: 0.16
Nodes (11): language selector switches static and dynamic UI copy, sidebar falls back when persisted settings have unexpected JSON types, claim cards show localized project flavor text from catalog metadata, createAsideCardController(), applyStaticTranslations(), bindAppControls(), createI18n(), I18N (+3 more)

### Community 28 - "Scenario Runtime Orchestration"
Cohesion: 0.21
Nodes (12): createMapInteractionController(), WHEEL_LISTENER_OPTIONS, createManualEnvelopeRenderer(), createAppRuntime(), createScenarioContext(), BASE_TERRITORY_COLOR, CLAIM_TIER_COLORS, claimGradientColor() (+4 more)

### Community 29 - "Active Scenario Data"
Cohesion: 0.18
Nodes (11): buildClaimLabelDescriptors(), buildClaimOverlayDescriptors(), Claim Visual Descriptors, unpinned hover preview leaves committed claim overlay empty until selection, claim cards synchronize map overlays, panel state, and empty map clear, claimIsEffectivelyHostile(), claimRegionSummary(), manualEnvelopeHostileContribution() (+3 more)

### Community 30 - "World Wrap Rendering"
Cohesion: 0.23
Nodes (10): overlay model cache reuses unchanged inputs and misses changed filters, createDebugRuntime(), parseDebugFlags(), Render Instrumentation, RENDER_STAT_KEYS, safeParams(), safeStorageValue(), toggleValue() (+2 more)

### Community 32 - "Buffered Overlay DOM"
Cohesion: 0.16
Nodes (14): claimLabelDescriptorCacheKey(), claimLabelDescriptors(), claimLabelRenderKey(), claimOverlayDescriptorCacheKey(), claimOverlayPathDescriptors(), claimOverlayPathRenderKey(), copyContextRenderKey(), getClaimLabelDescriptorSet() (+6 more)

### Community 34 - "Render Debug Statistics"
Cohesion: 0.26
Nodes (9): createLanguageRefreshActions(), createScenarioRefreshActions(), requireAction(), ACTIVE_SCENARIO_REFRESH_STEPS, LANGUAGE_REFRESH_STEPS, runRefreshSteps(), refreshLanguage(), runRefreshSteps rejects an incomplete action registry (+1 more)

### Community 35 - "Foreign Hover Overlays"
Cohesion: 0.12
Nodes (26): clearManualEnvelopeOverlay(), clearPinnedRegionState(), consumeSuppressedMapClick(), getPinnedRegionIds(), getShowReachableCapitalCandidates(), isPinnedCapitalRegionForNation(), onHitLayerClick(), reachableCapitalCandidateDescriptors() (+18 more)

### Community 36 - "Tooltip Controller"
Cohesion: 0.27
Nodes (10): buildSearchCatalog(), filterSearchCatalog(), Localized Alias Search, parseNationSearchValue(), Nation search matches claim project names to claimant nations, Nation search uses catalog names and keeps region names separate, Nation Display Override Table, Region Alias Mapping (+2 more)

### Community 37 - "Game Data Licensing"
Cohesion: 0.36
Nodes (9): extract_with_unitypy(), main(), _normalize_region_collection(), parse_args(), _plain(), Any, Namespace, Path (+1 more)

### Community 38 - "Hostile Claim Summaries"
Cohesion: 0.31
Nodes (7): bindNationSearchControl(), escapeHtml(), renderNationDropdown(), renderScenarioOptions(), renderSearchResults(), setSearchDropdownExpanded(), EMPTY_CATALOG

### Community 39 - "Nation Dropdown State"
Cohesion: 0.22
Nodes (4): createLoadingScreen(), LOADING_FAILURE_MESSAGES, createSearchController(), FakeSelect

### Community 41 - "MIT License Terms"
Cohesion: 0.36
Nodes (5): fakeClassList(), fakeHitPath(), fakeRegionPath(), sampleActiveData(), sampleRegions()

### Community 42 - "Playwright CI Configuration"
Cohesion: 0.57
Nodes (5): localizedValues(), nationProjectAliases(), nationSearchAliases(), projectSearchAliases(), uniqueSearchTerms()

### Community 44 - "Community 44"
Cohesion: 0.50
Nodes (3): createMapPanController(), Frame-Coalesced Map Pan, scheduleMapViewRender()

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (3): Not Covered by MIT, Terra Invicta Data License Scope, Terms and Ownership

## Knowledge Gaps
- **80 isolated node(s):** `name`, `version`, `private`, `license`, `type` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build_catalog()` connect `Pages Build Manifest` to `Publishing Rebuild CLI`, `Map View Navigation`, `Catalog Search Tests`, `Generated Output Verification`?**
  _High betweenness centrality (0.233) - this node is a cross-community bridge._
- **Why does `Localized search catalog matches nation tags, aliases, projects, and regions` connect `Tooltip Controller` to `Map View Navigation`?**
  _High betweenness centrality (0.232) - this node is a cross-community bridge._
- **Why does `Active data normalizes generated scenario bundle payloads` connect `CI And Pages Workflows` to `Catalog Search Tests`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `build_catalog()` (e.g. with `.test_localization_projections_keep_distinct_fallback_rules()` and `build_claim_data()`) actually correct?**
  _`build_catalog()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _99 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Build Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.03833943833943834 - nodes in this community are weakly interconnected._
- **Should `Publishing Rebuild CLI` be split into smaller, more focused modules?**
  _Cohesion score 0.07063063063063063 - nodes in this community are weakly interconnected._