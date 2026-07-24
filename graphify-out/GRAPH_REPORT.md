# Graph Report - TI_Interactive_Worldmap  (2026-07-24)

## Corpus Check
- 75 files · ~57,728 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 999 nodes · 2526 edges · 54 communities (42 shown, 12 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 98 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3702406`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App Interaction Flow|App Interaction Flow]]
- [[_COMMUNITY_Scenario Data Access|Scenario Data Access]]
- [[_COMMUNITY_Region Outline Builder|Region Outline Builder]]
- [[_COMMUNITY_SVG Map Layers|SVG Map Layers]]
- [[_COMMUNITY_Project Documentation Rules|Project Documentation Rules]]
- [[_COMMUNITY_Debug Render Metrics|Debug Render Metrics]]
- [[_COMMUNITY_Pages Build Tool|Pages Build Tool]]
- [[_COMMUNITY_App Runtime Shell|App Runtime Shell]]
- [[_COMMUNITY_Nation Catalog Builder|Nation Catalog Builder]]
- [[_COMMUNITY_Pages Rebuild Workflow|Pages Rebuild Workflow]]
- [[_COMMUNITY_Map Visual Rendering|Map Visual Rendering]]
- [[_COMMUNITY_Map Wrap Tests|Map Wrap Tests]]
- [[_COMMUNITY_Claim Overlay Models|Claim Overlay Models]]
- [[_COMMUNITY_Generated Output Verify|Generated Output Verify]]
- [[_COMMUNITY_WSL Build Script|WSL Build Script]]
- [[_COMMUNITY_Map View State|Map View State]]
- [[_COMMUNITY_Language E2E Tests|Language E2E Tests]]
- [[_COMMUNITY_Claim Descriptor Cache|Claim Descriptor Cache]]
- [[_COMMUNITY_Catalog Builder Tests|Catalog Builder Tests]]
- [[_COMMUNITY_Claim Data Builder|Claim Data Builder]]
- [[_COMMUNITY_Reachable Capital UI|Reachable Capital UI]]
- [[_COMMUNITY_Refresh Flow Steps|Refresh Flow Steps]]
- [[_COMMUNITY_Scenario Controls UI|Scenario Controls UI]]
- [[_COMMUNITY_Package Scripts|Package Scripts]]
- [[_COMMUNITY_Pinned Region State|Pinned Region State]]
- [[_COMMUNITY_Localized Claim Text|Localized Claim Text]]
- [[_COMMUNITY_Overlay Buffer Rendering|Overlay Buffer Rendering]]
- [[_COMMUNITY_Index HTML Structure|Index HTML Structure]]
- [[_COMMUNITY_Unity Outline Extraction|Unity Outline Extraction]]
- [[_COMMUNITY_Nation Info Panel|Nation Info Panel]]
- [[_COMMUNITY_Scenario Generation Tests|Scenario Generation Tests]]
- [[_COMMUNITY_Aside Card Settings|Aside Card Settings]]
- [[_COMMUNITY_World Wrap Context|World Wrap Context]]
- [[_COMMUNITY_Search Alias Data|Search Alias Data]]
- [[_COMMUNITY_Nation Dropdown UI|Nation Dropdown UI]]
- [[_COMMUNITY_Map Controls UI|Map Controls UI]]
- [[_COMMUNITY_Data License Scope|Data License Scope]]
- [[_COMMUNITY_Claim Hostility Logic|Claim Hostility Logic]]
- [[_COMMUNITY_Nation Search Parsing|Nation Search Parsing]]
- [[_COMMUNITY_Map Wheel Zoom|Map Wheel Zoom]]
- [[_COMMUNITY_Debug Flags|Debug Flags]]
- [[_COMMUNITY_Static Asset Links|Static Asset Links]]
- [[_COMMUNITY_Explore Select Flow|Explore Select Flow]]
- [[_COMMUNITY_Scenario E2E Tests|Scenario E2E Tests]]
- [[_COMMUNITY_Build Pages Tests|Build Pages Tests]]
- [[_COMMUNITY_Map Pan Controller|Map Pan Controller]]
- [[_COMMUNITY_Tooltip Controller|Tooltip Controller]]
- [[_COMMUNITY_MIT License Terms|MIT License Terms]]
- [[_COMMUNITY_Python Requirements|Python Requirements]]
- [[_COMMUNITY_Color Hashing|Color Hashing]]
- [[_COMMUNITY_Playwright Config|Playwright Config]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]

## God Nodes (most connected - your core abstractions)
1. `updateNationOverlay()` - 27 edges
2. `clearHoverPreview()` - 24 edges
3. `clearSelection()` - 23 edges
4. `build_catalog()` - 22 edges
5. `getActiveNation()` - 18 edges
6. `updateHoveredRegion()` - 18 edges
7. `getLockedNation()` - 17 edges
8. `renderHoverOutlines()` - 17 edges
9. `updateSelectedRegions()` - 17 edges
10. `rerenderWorldWrapLayers()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Generated And Derived Artifacts` --semantically_similar_to--> `Generated-output boundary`  [INFERRED] [semantically similar]
  AGENTS.md → dev-docs/README.md
- `Preferred Source Paths` --semantically_similar_to--> `Repository boundary`  [INFERRED] [semantically similar]
  AGENTS.md → dev-docs/architecture.md
- `Change Rules` --semantically_similar_to--> `Architectural rules`  [INFERRED] [semantically similar]
  AGENTS.md → dev-docs/architecture.md
- `Documentation and planning notes` --semantically_similar_to--> `Durable versus temporary docs`  [INFERRED] [semantically similar]
  README.md → dev-docs/README.md
- `generatedClaimModel()` --calls--> `createClaimModel()`  [EXTRACTED]
  tests/unit/state-data-boundaries.test.js → src/data/claim-model.js

## Import Cycles
- None detected.

## Communities (54 total, 12 thin omitted)

### Community 0 - "App Interaction Flow"
Cohesion: 0.13
Nodes (34): cancelPendingHoverPreview(), canUseSimpleHoverClearDelta(), canUseSimpleHoverVisualDelta(), chooseNationFromDropdown(), clearHoverPreview(), clearPinsOrSelection(), clearSelection(), closeNationDropdown() (+26 more)

### Community 1 - "Scenario Data Access"
Cohesion: 0.07
Nodes (53): createClaimCumulativeModel(), createClaimIncomingOverlayModel(), createClaimManualEnvelopeModel(), createClaimModel(), defaultSourceLabels(), createClaimProjectGraph(), clearPinnedRegions(), clearSelectionState() (+45 more)

### Community 2 - "Region Outline Builder"
Cohesion: 0.09
Nodes (63): assign_nation_color_indexes(), build_nation_adjacency(), canonical_map_region_name(), compact_region_geometry(), compact_region_outlines(), load_json(), load_nation_display_names(), load_nation_display_overrides() (+55 more)

### Community 3 - "SVG Map Layers"
Cohesion: 0.09
Nodes (45): appendWorldCopyFragment(), buildVisualFillGroups(), clearRegistry(), createGroupedVisualFillFragment(), createRegionHitUse(), createRegionPath(), createSvgElement(), datasetRenderKey() (+37 more)

### Community 4 - "Project Documentation Rules"
Cohesion: 0.05
Nodes (54): Browser App Module Boundaries, Change Rules, Generated And Derived Artifacts, Graphify And Serena Workflow, Preferred Source Paths, Subagent Policy, Architectural rules, Browser runtime flow (+46 more)

### Community 5 - "Debug Render Metrics"
Cohesion: 0.13
Nodes (25): captureInteractionProbes(), captureInteractionStats(), captureSetupStats(), captureStats(), clickSelectedRegionOnMap(), configureClaimOverlay(), configureComplexOverlayState(), configureLabelState() (+17 more)

### Community 6 - "Pages Build Tool"
Cohesion: 0.34
Nodes (14): build_scenario_bundle(), list_value(), load_json(), load_scenario_outputs(), main(), number_value(), object_value(), parse_args() (+6 more)

### Community 7 - "App Runtime Shell"
Cohesion: 0.08
Nodes (9): createMapPanController(), appLoading, appLoadingDetail, clearBufferedLayerChildrenForRenderKey(), clearClaimOverlayDom(), colorFor(), hashHue(), openNationDropdown() (+1 more)

### Community 8 - "Nation Catalog Builder"
Cohesion: 0.11
Nodes (38): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), display_name_values(), display_names_equal(), distinct_display_name(), initial_regions_by_nation(), load_nation_display_overrides() (+30 more)

### Community 9 - "Pages Rebuild Workflow"
Cohesion: 0.24
Nodes (21): CompletedProcess, build_pages(), build_scenario_outputs(), copy_default_scenario_outputs(), current_branch(), default_templates_dir(), first_existing(), generated_paths_changed() (+13 more)

### Community 10 - "Map Visual Rendering"
Cohesion: 0.10
Nodes (32): applyFilters(), applyMapVisualState(), applyMapVisualStateForRegions(), buildNationOverlayModel(), claimLabelRenderKey(), claimOverlayPathRenderKey(), clearHoverClaimPreviewOverlay(), clearOverlayVisualState() (+24 more)

### Community 11 - "Map Wrap Tests"
Cohesion: 0.12
Nodes (32): SEAM_CANDIDATES, blankMapPoint(), chooseNation(), clearMap(), clickRegion(), debugRenderStats(), dispatchPointerClick(), dispatchPointerDragAndClick() (+24 more)

### Community 12 - "Claim Overlay Models"
Cohesion: 0.08
Nodes (37): activeClaimPreviewContainsRegion(), activeClaimPreviewRegionSet(), activeClaimPreviewScopeCacheKey(), addRegionNamesToSet(), availableRuntimeNationIds(), buildManualEnvelopeModel(), buildManualEnvelopeModelUncached(), buildOverlayModelCacheKey() (+29 more)

### Community 13 - "Generated Output Verify"
Cohesion: 0.14
Nodes (37): RuntimeError, browser_source_mappings(), deployment_source_mappings(), expected_browser_deployment_files(), expected_scenario_generated_files(), Path, Return every browser JS source and its Pages destination., Return the complete source-to-Pages static asset manifest. (+29 more)

### Community 14 - "WSL Build Script"
Cohesion: 0.25
Nodes (16): build-wsl.sh script, bootstrap_node(), bootstrap_python(), die(), discover_region_outlines(), discover_templates_dir(), ensure_python_command(), first_existing() (+8 more)

### Community 15 - "Map View State"
Cohesion: 0.19
Nodes (20): applyMapViewToSvg(), invalidateTooltipLayout(), mapPointFromClientPoint(), onMapWheel(), resetMapView(), zoomMapAt(), clampMapViewX(), clampMapViewY() (+12 more)

### Community 16 - "Language E2E Tests"
Cohesion: 0.31
Nodes (17): assemble_runtime_bundle(), build_pages(), default_scenario_bundle(), deterministic_gzip(), encode_runtime_bundle(), load_json(), load_pages_inputs(), main() (+9 more)

### Community 17 - "Claim Descriptor Cache"
Cohesion: 0.33
Nodes (6): claimLabelDescriptorCacheKey(), claimOverlayDescriptorCacheKey(), claimOverlayPathDescriptors(), getClaimLabelDescriptorSet(), getClaimOverlayDescriptorSet(), overlayModelRenderDataKey()

### Community 18 - "Catalog Builder Tests"
Cohesion: 0.26
Nodes (5): CatalogBuilderTests, Path, write_json(), write_region_owner_fixture(), write_text()

### Community 19 - "Claim Data Builder"
Cohesion: 0.13
Nodes (37): PythonContractTests, BreakawayRow, build_breakaway_index(), build_claim_data(), build_claim_stats(), build_nation_profiles(), build_project_claim_metadata(), catalog_nation_metadata() (+29 more)

### Community 20 - "Reachable Capital UI"
Cohesion: 0.24
Nodes (13): clearManualEnvelopeOverlay(), getShowReachableCapitalCandidates(), reachableCapitalCandidateDescriptors(), reachableCapitalCandidateForRegion(), reachableCapitalCandidateRenderKey(), refreshReachableCapitalCandidateOutputs(), renderReachableCapitalCandidateMarkers(), renderReachableCapitalCandidatesPanel() (+5 more)

### Community 21 - "Refresh Flow Steps"
Cohesion: 0.06
Nodes (39): createAppData(), getActiveData(), getScenarioIds(), normalizeScenarioEntry(), scenarioIdFromEntry(), buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory() (+31 more)

### Community 22 - "Scenario Controls UI"
Cohesion: 0.31
Nodes (8): applyStaticTranslations(), bindAppControls(), bindNationSearchControl(), escapeHtml(), renderNationDropdown(), renderScenarioOptions(), renderSearchResults(), setSearchDropdownExpanded()

### Community 23 - "Package Scripts"
Cohesion: 0.09
Nodes (21): devDependencies, eslint, @playwright/test, license, name, private, scripts, build (+13 more)

### Community 24 - "Pinned Region State"
Cohesion: 0.18
Nodes (25): activeIncomingClaimKeysForState(), buildActiveExpansionScope(), changedRegionIds(), commitReachableCapitalSelection(), focusPinnedRegion(), focusRegions(), getActiveNation(), getFocusedRegionName() (+17 more)

### Community 25 - "Localized Claim Text"
Cohesion: 0.13
Nodes (19): claimCardResearchLabel(), claimCardTitle(), claimCardTitleParts(), localizedDisplayName(), localizedRegionName(), manualEnvelopeKindLabel(), manualEnvelopeOverlapLabel(), manualEnvelopeRegionLabel() (+11 more)

### Community 26 - "Overlay Buffer Rendering"
Cohesion: 0.21
Nodes (13): consumeSuppressedMapClick(), onHitLayerClick(), onHitLayerPointerMove(), onHitLayerPointerOut(), onHitLayerPointerOver(), onRegionEnter(), onRegionMove(), resolveHitRegion() (+5 more)

### Community 27 - "Index HTML Structure"
Cohesion: 0.20
Nodes (11): src/index.html, assets/app.js, App loading screen, assets/data.generated.js, Map bar, Map note, Map Bar, Side card list (+3 more)

### Community 28 - "Unity Outline Extraction"
Cohesion: 0.36
Nodes (9): extract_with_unitypy(), main(), _normalize_region_collection(), parse_args(), _plain(), Any, Namespace, Path (+1 more)

### Community 29 - "Nation Info Panel"
Cohesion: 0.24
Nodes (10): addCapitalMarkerNation(), capitalRegionNames(), capitalRegionNamesForNation(), capitalRegionsText(), collectCapitalMarkers(), isActiveCapitalMarkerSelected(), isCapitalRegionForNation(), isPinnedCapitalRegionForNation() (+2 more)

### Community 32 - "World Wrap Context"
Cohesion: 0.50
Nodes (4): defaultWorldCopyContext(), createWorldCopyContexts(), setWorldWrapEnabled(), updateMapViewControlsLabels()

### Community 34 - "Nation Dropdown UI"
Cohesion: 0.20
Nodes (12): buildSearchCatalog(), filterSearchCatalog(), localizedValues(), nationProjectAliases(), nationSearchAliases(), parseNationSearchValue(), projectSearchAliases(), uniqueSearchTerms() (+4 more)

### Community 36 - "Data License Scope"
Cohesion: 0.67
Nodes (3): Not Covered by MIT, Terra Invicta Data License Scope, Terms and Ownership

### Community 37 - "Claim Hostility Logic"
Cohesion: 0.25
Nodes (7): buildClaimLabelDescriptors(), buildClaimOverlayDescriptors(), claimIsEffectivelyHostile(), claimLabelDescriptors(), claimRegionSummary(), manualEnvelopeHostileContribution(), projectColor()

### Community 38 - "Nation Search Parsing"
Cohesion: 0.67
Nodes (3): isSelectedNationSearch(), parseNationSearchValue(), searchFilterText()

### Community 40 - "Debug Flags"
Cohesion: 0.33
Nodes (6): collectRegionGeometryStats(), labelsEnabledForRender(), recordLabelRenderResult(), renderLabels(), sampleDebugSvgLayerCounts(), samplePanSvgNodeCount()

### Community 41 - "Static Asset Links"
Cohesion: 0.67
Nodes (3): assets/app.js, assets/styles.css, Index HTML

### Community 42 - "Explore Select Flow"
Cohesion: 0.67
Nodes (3): Expansion Nodes, Explore and Select, Selected Region

### Community 43 - "Scenario E2E Tests"
Cohesion: 0.60
Nodes (5): escapeHtml(), pinnedRegionRow(), reachableCandidateRow(), renderPinnedRegionsPanel(), renderReachableCapitalCandidatesPanel()

### Community 45 - "Map Pan Controller"
Cohesion: 0.40
Nodes (5): buildForeignHoverOverlayDescriptorSet(), foreignHoverDescriptorCacheKey(), getForeignHoverOverlayDescriptorSet(), hoverNationProjectOpacity(), queueForeignHoverDescriptor()

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (3): appendReachableCapitalCandidateMarker(), reachableCandidateMarkerLabel(), reachableCandidateNationsText()

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (3): pinnedCapitalClaimants(), pinnedExpansionClaimants(), pinnedRegionCapitalSummary()

## Knowledge Gaps
- **74 isolated node(s):** `runtimeGlobals`, `name`, `version`, `private`, `license` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `strip_scenario_prefix()` connect `Nation Catalog Builder` to `Region Outline Builder`, `Claim Data Builder`, `Generated Output Verify`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `verify_scenario_entry()` connect `Generated Output Verify` to `Nation Catalog Builder`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `load_required_json()` connect `Claim Data Builder` to `Language E2E Tests`, `Region Outline Builder`, `Pages Build Tool`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `build_catalog()` (e.g. with `source_fingerprint()` and `unique_strings()`) actually correct?**
  _`build_catalog()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `runtimeGlobals`, `name`, `version` to the rest of the system?**
  _86 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Interaction Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.1265597147950089 - nodes in this community are weakly interconnected._
- **Should `Scenario Data Access` be split into smaller, more focused modules?**
  _Cohesion score 0.0697980684811238 - nodes in this community are weakly interconnected._