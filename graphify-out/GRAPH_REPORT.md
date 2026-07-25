# Graph Report - /home/fennexfox/Terra Invicta/TI_Interactive_Worldmap  (2026-07-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1060 nodes · 2706 edges · 44 communities (40 shown, 4 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 308 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eead65c0`
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
- [[_COMMUNITY_Map View Controls|Map View Controls]]
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
- `compact_region_geometry()` --implements--> `Build and Data Pipeline`  [INFERRED]
  tools/build_region_outline_data.py → dev-docs/architecture.md
- `assign_nation_color_indexes()` --shares_data_with--> `SVG Map Layer Stack`  [INFERRED]
  tools/build_region_outline_data.py → src/index.html
- `compact_region_outlines()` --implements--> `Build and Data Pipeline`  [INFERRED]
  tools/build_region_outline_data.py → dev-docs/architecture.md

## Import Cycles
- None detected.

## Communities (44 total, 4 thin omitted)

### Community 0 - "Catalog Build Pipeline"
Cohesion: 0.08
Nodes (61): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), display_name_values(), display_names_equal(), distinct_display_name(), initial_regions_by_nation(), load_nation_display_overrides() (+53 more)

### Community 1 - "Publishing Rebuild CLI"
Cohesion: 0.08
Nodes (56): CompletedProcess, Build and Data Pipeline, Region Outline Refresh Policy, Explicit Region Outline Refresh, Manifest-Scoped Publication, Three Build Levels, Ruff Development Dependency, UnityPy Geometry Dependency (+48 more)

### Community 2 - "E2E Map Workflows"
Cohesion: 0.10
Nodes (44): baseColorAudit(), canonicalRegionBaseState(), groupedClaimRegionCount(), Scenario ownership drives one consistent base fill per nation, Scenario selector switches supported start scenarios and keeps map workflows usable, Issue #2 acceptance: horizontal panning passes west and east map edges without a hard stop, Issue #2 acceptance: selected claim overlays render on every visible world copy, Issue #2 acceptance: wrapped copy hover and click resolve to the same canonical region (+36 more)

### Community 3 - "UI Refresh Localization"
Cohesion: 0.06
Nodes (38): overlay model cache reuses unchanged inputs and misses changed filters, language selector switches static and dynamic UI copy, sidebar falls back when persisted settings have unexpected JSON types, claim cards show localized project flavor text from catalog metadata, app runtime scenario API rebuilds active scenario context without stale map data, createDebugRuntime(), parseDebugFlags(), RENDER_STAT_KEYS (+30 more)

### Community 4 - "Region Catalog Pipeline"
Cohesion: 0.08
Nodes (43): Initial-Owner Claim Authority, scenario_fixture(), ScenarioGenerationTests, assign_nation_color_indexes(), build_nation_adjacency(), canonical_map_region_name(), compact_region_geometry(), compact_region_outlines() (+35 more)

### Community 5 - "Catalog Search Tests"
Cohesion: 0.08
Nodes (31): Build Nation Overlay Model, Unified Claim Model, buildClaimLabelDescriptors(), buildClaimOverlayDescriptors(), Claim Visual Descriptors, buildSearchCatalog(), filterSearchCatalog(), Localized Alias Search (+23 more)

### Community 6 - "Generated Output Verification"
Cohesion: 0.09
Nodes (46): Browser App Module Boundaries, Change Rules, Generated And Derived Artifacts, Graphify And Serena Workflow, Preferred Source Paths, Subagent Policy, Development Docs Generated-Output Boundary, Plan Document Lifecycle (+38 more)

### Community 7 - "Pages Build Manifest"
Cohesion: 0.07
Nodes (23): BuildManifestTests, BuildPagesTests, RebuildPagesPublishingTests, Path, VerifyGeneratedOutputsTests, GENERATED_STAGING_PATHS, assemble_runtime_bundle(), build_pages() (+15 more)

### Community 8 - "Claim Data Builder"
Cohesion: 0.13
Nodes (37): PythonContractTests, BreakawayRow, build_breakaway_index(), build_claim_data(), build_claim_stats(), build_nation_profiles(), build_project_claim_metadata(), catalog_nation_metadata() (+29 more)

### Community 9 - "SVG Layer Rendering"
Cohesion: 0.12
Nodes (35): applyMapVisualStateForRegions(), cancelPendingHoverPreview(), canUseSimpleHoverClearDelta(), canUseSimpleHoverVisualDelta(), chooseNationFromDropdown(), clearHoverPreview(), clearPinsOrSelection(), clearSelection() (+27 more)

### Community 10 - "Render Performance Measurement"
Cohesion: 0.11
Nodes (35): Frame-Coalesced Map Pan, appendWorldCopyFragment(), buildVisualFillGroups(), clearRegistry(), createGroupedVisualFillFragment(), createRegionHitUse(), datasetRenderKey(), DEFAULT_COPY_CONTEXT (+27 more)

### Community 11 - "Claim Overlay State"
Cohesion: 0.09
Nodes (33): Browser Runtime Flow, State, Data, Render, and UI Separation, Performance-Sensitive Map Areas, Claim / Unification Map, Claim / Unification Map Application Shell, Research Grants Claims, Not Immediate Actions, SVG Map Layer Stack, captureInteractionProbes() (+25 more)

### Community 12 - "Hover And Selection State"
Cohesion: 0.08
Nodes (9): createMapPanController(), createRegionPath(), appendRegionHighlight(), appLoading, appLoadingDetail, colorFor(), foreignHoverVisualDescriptors(), hashHue() (+1 more)

### Community 13 - "SVG Marker Labels"
Cohesion: 0.09
Nodes (36): activeClaimPreviewContainsRegion(), activeClaimPreviewRegionSet(), activeClaimPreviewScopeCacheKey(), addRegionNamesToSet(), buildManualEnvelopeModel(), buildManualEnvelopeModelUncached(), buildOverlayModelCacheKey(), clearPinnedRegionState() (+28 more)

### Community 14 - "Map Interaction Composition"
Cohesion: 0.13
Nodes (26): Generated Artifact Ignores, runtimeGlobals, Strict JavaScript Rules, build-wsl.sh script, Build Pipeline, End-to-End Testing, Verification Pipeline, Playwright E2E Runtime (+18 more)

### Community 15 - "App Overlay Rendering"
Cohesion: 0.15
Nodes (29): activeIncomingClaimKeysForState(), availableRuntimeNationIds(), buildActiveExpansionScope(), changedRegionIds(), commitReachableCapitalSelection(), focusPinnedRegion(), focusRegions(), getActiveNation() (+21 more)

### Community 16 - "WSL Build Bootstrap"
Cohesion: 0.14
Nodes (25): overlay render skip keys avoid unchanged DOM replacement, simple selected-overlay claim hover movement uses bounded visual updates, pre-drag click hold still allows hit-layer hover updates, reachable capital button shows capital markers that pin without plus buttons, claim grouped fills preserve per-region semantic outline paths, project-specific hostile claims render hatch and follow claim kind filters, single-copy grouped base fills preserve region-specific hit paths and filtering, world-wrap default applies search filtering to every copy without duplicating canonical state (+17 more)

### Community 17 - "Capital Region Selection"
Cohesion: 0.12
Nodes (17): Claim With Effective Hostility, createClaimCumulativeModel(), Cumulative Claim Entry, Effective Hostility Propagation, Project Claim Inheritance, Build Incoming Claim Index, createClaimIncomingOverlayModel(), Incoming Claim Projection (+9 more)

### Community 18 - "Map Visual State"
Cohesion: 0.21
Nodes (19): map pan after multiple reachable capital pins avoids hover and marker churn during drag, zoomed plain map pan records counters without grid rebuilds, world-wrap default renders base, grid, label, and hit copies, World-wrap panning is disabled through the fallback query flag, clampMapViewX(), clampMapViewY(), clampNumber(), createMapViewState() (+11 more)

### Community 19 - "Claim Model Composition"
Cohesion: 0.09
Nodes (21): devDependencies, eslint, @playwright/test, license, name, private, scripts, build (+13 more)

### Community 20 - "Map View Navigation"
Cohesion: 0.25
Nodes (19): empty map clicks clear pinned regions and selection together, clearPinnedRegions(), clearSelectionState(), clearTransientClaimState(), normalizeId(), normalizeIds(), reconcileScenarioState(), setActiveIncomingClaim() (+11 more)

### Community 21 - "JavaScript Tooling Config"
Cohesion: 0.67
Nodes (3): openNationDropdown(), renderNationDropdown(), visibleNationChoices()

### Community 22 - "Application State Transitions"
Cohesion: 0.13
Nodes (21): Build Pages for E2E tests, Build Pages for quality checks, E2E shard job, E2E shard matrix, Install Chromium, Lint, Quality and reproducible build, Reusable checks (+13 more)

### Community 23 - "CI And Pages Workflows"
Cohesion: 0.14
Nodes (21): createSvgElement(), worldCopyDataset(), appendCapitalMarkerGroup(), appendPinnedRegionMarker(), appendReachableCapitalCandidateMarker(), appendSelectedRegionMarker(), createClaimHatchPattern(), formatHatchNumber() (+13 more)

### Community 24 - "Scenario Derived Indices"
Cohesion: 0.10
Nodes (31): applyMapVisualState(), buildNationOverlayModel(), claimLabelDescriptorCacheKey(), claimLabelDescriptors(), claimLabelRenderKey(), claimOverlayDescriptorCacheKey(), claimOverlayPathDescriptors(), claimOverlayPathRenderKey() (+23 more)

### Community 25 - "Pinned Region UI"
Cohesion: 0.18
Nodes (15): Build Manual Envelope Model Data, Recursive Capital Expansion, buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory(), normalizeId(), overlayResultSetContains(), resolveSecondaryCapitalPreview() (+7 more)

### Community 26 - "Capital Marker Rendering"
Cohesion: 0.18
Nodes (16): reachable capitals omit nations fully included in the selected regions claims, pinned expansion nodes update compact rows and map markers through clicks, reachable capital activation requires the claimant capital to match the displayed region, toggleReachableCapitalCandidatesState(), updateReachableCapitalsButtonState(), createAppState(), pinRegion(), toggleReachableCapitalCandidates() (+8 more)

### Community 27 - "Hit Layer Interaction"
Cohesion: 0.12
Nodes (21): claimCardResearchLabel(), claimCardTitle(), claimCardTitleParts(), localizedDisplayName(), manualEnvelopeKindLabel(), manualEnvelopeRegionLabel(), manualEnvelopeSourceLabel(), nationDisplayName() (+13 more)

### Community 28 - "Scenario Runtime Orchestration"
Cohesion: 0.21
Nodes (12): activeScenario(), activeScenarioId(), buildIncomingClaimIndex(), clearScenarioSensitiveCaches(), prepareScenarioRuntime(), refreshScenarioView(), renderScenarioOptions(), resetScenarioRenderKeys() (+4 more)

### Community 29 - "Active Scenario Data"
Cohesion: 0.33
Nodes (9): createAppData(), getActiveData(), getScenarioIds(), normalizeScenarioEntry(), Scenario Catalog, scenarioIdFromEntry(), applyRuntimeScenarioData(), syncRuntimeDataAliases() (+1 more)

### Community 30 - "World Wrap Rendering"
Cohesion: 0.15
Nodes (17): addCapitalMarkerNation(), capitalRegionNames(), capitalRegionNamesForNation(), capitalRegionsText(), collectCapitalMarkers(), escapeHtml(), getProjectFilter(), isActiveCapitalMarkerSelected() (+9 more)

### Community 32 - "Buffered Overlay DOM"
Cohesion: 0.25
Nodes (8): defaultWorldCopyContext(), createWorldCopyContexts(), getCurrentNation(), renderGrid(), renderRegionGeometry(), rerenderWorldWrapLayers(), setWorldWrapEnabled(), updateMapViewControlsLabels()

### Community 33 - "Map View Controls"
Cohesion: 0.36
Nodes (5): fakeClassList(), fakeHitPath(), fakeRegionPath(), sampleActiveData(), sampleRegions()

### Community 34 - "Render Debug Statistics"
Cohesion: 0.29
Nodes (7): clearBufferedLayerChildrenForRenderKey(), clearClaimOverlayDom(), createOverlayBufferGroup(), getBufferedLayerState(), replaceBufferedLayerChildrenForRenderKey(), runAfterAnimationFrames(), setOverlayBufferActive()

### Community 35 - "Foreign Hover Overlays"
Cohesion: 0.33
Nodes (6): applyMapViewToSvg(), invalidateTooltipLayout(), mapPointFromClientPoint(), onMapWheel(), resetMapView(), zoomMapAt()

### Community 36 - "Tooltip Controller"
Cohesion: 0.33
Nodes (6): collectRegionGeometryStats(), labelsEnabledForRender(), recordLabelRenderResult(), renderLabels(), sampleDebugSvgLayerCounts(), samplePanSvgNodeCount()

### Community 37 - "Game Data Licensing"
Cohesion: 0.40
Nodes (5): buildForeignHoverOverlayDescriptorSet(), foreignHoverDescriptorCacheKey(), getForeignHoverOverlayDescriptorSet(), hoverNationProjectOpacity(), queueForeignHoverDescriptor()

### Community 39 - "Nation Dropdown State"
Cohesion: 0.67
Nodes (3): Not Covered by MIT, Terra Invicta Data License Scope, Terms and Ownership

### Community 40 - "Pinned Capital Claims"
Cohesion: 0.67
Nodes (3): claimIsEffectivelyHostile(), claimRegionSummary(), manualEnvelopeHostileContribution()

### Community 41 - "MIT License Terms"
Cohesion: 0.33
Nodes (6): applyFilters(), isSelectedNationSearch(), parseNationSearchValue(), searchFilterText(), setHiddenVisualState(), syncNormalRegionColorVisibility()

## Knowledge Gaps
- **74 isolated node(s):** `name`, `version`, `private`, `license`, `type` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build_catalog()` connect `Catalog Build Pipeline` to `Claim Data Builder`, `Region Catalog Pipeline`, `Catalog Search Tests`, `Pages Build Manifest`?**
  _High betweenness centrality (0.229) - this node is a cross-community bridge._
- **Why does `Active data normalizes generated scenario bundle payloads` connect `Active Scenario Data` to `E2E Map Workflows`, `Pages Build Manifest`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `build_catalog()` (e.g. with `.test_localization_projections_keep_distinct_fallback_rules()` and `build_claim_data()`) actually correct?**
  _`build_catalog()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _93 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Build Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.08125 - nodes in this community are weakly interconnected._
- **Should `Publishing Rebuild CLI` be split into smaller, more focused modules?**
  _Cohesion score 0.07539450613676213 - nodes in this community are weakly interconnected._
- **Should `E2E Map Workflows` be split into smaller, more focused modules?**
  _Cohesion score 0.10087719298245613 - nodes in this community are weakly interconnected._