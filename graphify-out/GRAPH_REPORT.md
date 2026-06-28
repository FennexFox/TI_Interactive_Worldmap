# Graph Report - .  (2026-06-22)

## Corpus Check
- 27 files · ~51,869 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 833 nodes · 2041 edges · 51 communities (42 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

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
- [[_COMMUNITY_Build Pages Tests|Build Pages Tests]]
- [[_COMMUNITY_Map Pan Controller|Map Pan Controller]]
- [[_COMMUNITY_Tooltip Controller|Tooltip Controller]]
- [[_COMMUNITY_MIT License Terms|MIT License Terms]]
- [[_COMMUNITY_Python Requirements|Python Requirements]]
- [[_COMMUNITY_Color Hashing|Color Hashing]]

## God Nodes (most connected - your core abstractions)
1. `updateNationOverlay()` - 28 edges
2. `recordRenderStat()` - 24 edges
3. `clearHoverPreview()` - 24 edges
4. `clearSelection()` - 22 edges
5. `build_catalog()` - 19 edges
6. `getActiveNation()` - 18 edges
7. `updateHoveredRegion()` - 18 edges
8. `getLockedNation()` - 17 edges
9. `renderHoverOutlines()` - 17 edges
10. `main()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Generated And Derived Artifacts` --semantically_similar_to--> `Generated-output Boundary`  [INFERRED] [semantically similar]
  AGENTS.md → dev-docs/README.md
- `Preferred Source Paths` --semantically_similar_to--> `Repository Boundary`  [INFERRED] [semantically similar]
  AGENTS.md → dev-docs/architecture.md
- `Change Rules` --semantically_similar_to--> `Architectural Rules`  [INFERRED] [semantically similar]
  AGENTS.md → dev-docs/architecture.md
- `Documentation and Planning Notes` --semantically_similar_to--> `Durable Versus Temporary Docs`  [INFERRED] [semantically similar]
  README.md → dev-docs/README.md
- `createDebugRenderStats()` --calls--> `resetStats()`  [INFERRED]
  src/app.js → tools/measure_debug_render_stats.mjs

## Import Cycles
- None detected.

## Communities (51 total, 9 thin omitted)

### Community 0 - "App Interaction Flow"
Cohesion: 0.06
Nodes (88): addCapitalMarkerNation(), applyMapVisualStateForRegions(), bindNationOverlayPanelEvents(), buildActiveExpansionScope(), cancelPendingHoverPreview(), canUseSimpleHoverClearDelta(), canUseSimpleHoverVisualDelta(), capitalRegionNamesForNation() (+80 more)

### Community 1 - "Scenario Data Access"
Cohesion: 0.06
Nodes (60): createAppData(), getActiveData(), getScenarioIds(), normalizeScenarioEntry(), scenarioIdFromEntry(), createClaimModel(), defaultSourceLabels(), buildCapitalNationsByRegion() (+52 more)

### Community 2 - "Region Outline Builder"
Cohesion: 0.09
Nodes (62): assign_nation_color_indexes(), build_nation_adjacency(), compact_region_geometry(), compact_region_outlines(), load_json(), load_nation_display_names(), load_nation_display_overrides(), load_nation_localization_layers() (+54 more)

### Community 3 - "SVG Map Layers"
Cohesion: 0.07
Nodes (54): appendWorldCopyFragment(), buildVisualFillGroups(), clearRegistry(), createGroupedVisualFillFragment(), createRegionHitUse(), createRegionPath(), createSvgElement(), datasetRenderKey() (+46 more)

### Community 4 - "Project Documentation Rules"
Cohesion: 0.07
Nodes (32): Browser App Module Boundaries, Change Rules, Generated And Derived Artifacts, Graphify And Serena Workflow, Preferred Source Paths, Subagent Policy, Working architecture map, Architectural Rules (+24 more)

### Community 5 - "Debug Render Metrics"
Cohesion: 0.13
Nodes (26): createDebugRenderStats(), captureInteractionProbes(), captureInteractionStats(), captureSetupStats(), captureStats(), clickSelectedRegionOnMap(), configureClaimOverlay(), configureComplexOverlayState() (+18 more)

### Community 6 - "Pages Build Tool"
Cohesion: 0.17
Nodes (26): build_pages(), copy_js_modules(), default_scenario_bundle(), deterministic_gzip(), load_json(), main(), parse_args(), Any (+18 more)

### Community 7 - "App Runtime Shell"
Cohesion: 0.08
Nodes (4): appLoading, appLoadingDetail, nationChoiceMatchRank(), sortNationMatches()

### Community 8 - "Nation Catalog Builder"
Cohesion: 0.21
Nodes (26): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), display_name_values(), display_names_equal(), distinct_display_name(), initial_regions_by_nation(), load_nation_display_overrides() (+18 more)

### Community 9 - "Pages Rebuild Workflow"
Cohesion: 0.24
Nodes (21): CompletedProcess, build_pages(), build_scenario_outputs(), commit_and_push(), copy_default_scenario_outputs(), current_branch(), default_templates_dir(), first_existing() (+13 more)

### Community 10 - "Map Visual Rendering"
Cohesion: 0.16
Nodes (21): applyFilters(), applyMapViewToSvg(), applyMapVisualState(), collectRegionGeometryStats(), invalidateTooltipLayout(), labelsEnabledForRender(), recordLabelRenderResult(), recordRenderStat() (+13 more)

### Community 11 - "Map Wrap Tests"
Cohesion: 0.11
Nodes (8): expectProjectedCopies(), expectProjectedGroupedRegion(), expectProjectedRegion(), pathWithQueryParam(), SEAM_CANDIDATES, waitForAnimationFrames(), waitForHoverPreviewFrame(), waitForWrappedMap()

### Community 12 - "Claim Overlay Models"
Cohesion: 0.13
Nodes (20): activeClaimPreviewContainsRegion(), activeClaimPreviewRegionSet(), activeClaimPreviewScopeCacheKey(), addRegionNamesToSet(), buildManualEnvelopeModel(), buildManualEnvelopeModelUncached(), buildOverlayModelCacheKey(), foreignHoverDescriptorCacheKey() (+12 more)

### Community 13 - "Generated Output Verify"
Cohesion: 0.29
Nodes (18): aliases(), decode_generated_js_data(), display_name(), json_key(), layered_display_name(), list_value(), load_json(), main() (+10 more)

### Community 14 - "WSL Build Script"
Cohesion: 0.25
Nodes (16): build-wsl.sh script, bootstrap_node(), bootstrap_python(), die(), discover_region_outlines(), discover_templates_dir(), ensure_python_command(), first_existing() (+8 more)

### Community 15 - "Map View State"
Cohesion: 0.27
Nodes (15): resetMapView(), clampMapViewX(), clampMapViewY(), clampNumber(), createMapViewState(), finiteNumber(), formatViewBoxForMapView(), formatViewBoxNumber() (+7 more)

### Community 16 - "Language E2E Tests"
Cohesion: 0.16
Nodes (9): clickRegion(), hoverRegion(), hoverRegionWithMouse(), pinFirstReachableCapitalCandidate(), pinReachableCapitalCandidates(), regionTarget(), waitForAnimationFrames(), waitForHoverPreviewFrame() (+1 more)

### Community 17 - "Claim Descriptor Cache"
Cohesion: 0.15
Nodes (17): buildForeignHoverOverlayDescriptorSet(), buildNationOverlayModel(), claimLabelDescriptorCacheKey(), claimLabelDescriptors(), claimOverlayDescriptorCacheKey(), claimOverlayPathDescriptors(), getCachedLruValue(), getClaimLabelDescriptorSet() (+9 more)

### Community 18 - "Catalog Builder Tests"
Cohesion: 0.33
Nodes (4): CatalogBuilderTests, Path, write_json(), write_text()

### Community 19 - "Claim Data Builder"
Cohesion: 0.25
Nodes (15): build_claim_data(), catalog_nation_metadata(), load_json(), main(), norm_id(), parse_args(), project_label(), project_metadata_from_research_catalog() (+7 more)

### Community 20 - "Reachable Capital UI"
Cohesion: 0.18
Nodes (16): clearManualEnvelopeOverlay(), consumeSuppressedMapClick(), getShowReachableCapitalCandidates(), onHitLayerClick(), reachableCapitalCandidateDescriptors(), reachableCapitalCandidateForRegion(), reachableCapitalCandidateRenderKey(), refreshReachableCapitalCandidateOutputs() (+8 more)

### Community 21 - "Refresh Flow Steps"
Cohesion: 0.14
Nodes (14): ACTIVE_SCENARIO_REFRESH_STEPS, LANGUAGE_REFRESH_STEPS, runRefreshSteps(), applyRuntimeScenarioData(), buildIncomingClaimIndex(), buildNationChoices(), clearScenarioSensitiveCaches(), populate() (+6 more)

### Community 22 - "Scenario Controls UI"
Cohesion: 0.18
Nodes (14): activeScenario(), activeScenarioId(), activeScenarioSummary(), renderScenarioOptions(), syncScenarioControls(), applyStaticTranslations(), bindAppControls(), bindNationSearchControl() (+6 more)

### Community 23 - "Package Scripts"
Cohesion: 0.14
Nodes (13): devDependencies, @playwright/test, license, name, private, scripts, build, deploy (+5 more)

### Community 24 - "Pinned Region State"
Cohesion: 0.20
Nodes (14): activeIncomingClaimKeysForState(), availableRuntimeNationIds(), clearPinnedRegionState(), getPinnedRegionIds(), isPinnedCapitalRegionForNation(), pinnedRegionMarkerRenderKey(), reconcileStateForActiveScenario(), refreshPinnedRegionOutputs() (+6 more)

### Community 25 - "Localized Claim Text"
Cohesion: 0.18
Nodes (14): claimCardResearchLabel(), claimCardTitle(), claimCardTitleParts(), humanizeNationLabel(), localizedDisplayName(), manualEnvelopeKindLabel(), manualEnvelopeRegionLabel(), manualEnvelopeSourceLabel() (+6 more)

### Community 26 - "Overlay Buffer Rendering"
Cohesion: 0.17
Nodes (13): claimLabelRenderKey(), claimOverlayPathRenderKey(), clearBufferedLayerChildrenForRenderKey(), clearClaimOverlayDom(), copyContextRenderKey(), createOverlayBufferGroup(), getBufferedLayerState(), hoverClaimPreviewRenderKey() (+5 more)

### Community 27 - "Index HTML Structure"
Cohesion: 0.20
Nodes (11): src/index.html, assets/app.js, App loading screen, assets/data.generated.js, Map bar, Map note, Map Bar, Side card list (+3 more)

### Community 28 - "Unity Outline Extraction"
Cohesion: 0.36
Nodes (9): extract_with_unitypy(), main(), _normalize_region_collection(), parse_args(), _plain(), Any, Namespace, Path (+1 more)

### Community 29 - "Nation Info Panel"
Cohesion: 0.43
Nodes (7): capitalRegionNames(), capitalRegionsText(), escapeHtml(), renderClaimSection(), renderNationInfoPanel(), statusBadge(), statusLabel()

### Community 32 - "World Wrap Context"
Cohesion: 0.40
Nodes (5): defaultWorldCopyContext(), createWorldCopyContexts(), setWorldWrapEnabled(), syncWorldWrapDebugStats(), updateMapViewControlsLabels()

### Community 33 - "Search Alias Data"
Cohesion: 0.50
Nodes (5): localizedDisplayNameValues(), nationClaimProjectSearchAliases(), nationSearchAliases(), projectSearchAliases(), uniqueSearchTerms()

### Community 34 - "Nation Dropdown UI"
Cohesion: 0.50
Nodes (4): matchingNationChoices(), openNationDropdown(), renderNationDropdown(), visibleNationChoices()

### Community 36 - "Data License Scope"
Cohesion: 0.67
Nodes (3): Not Covered by MIT, Terra Invicta Data License Scope, Terms and Ownership

### Community 37 - "Claim Hostility Logic"
Cohesion: 0.67
Nodes (3): claimIsEffectivelyHostile(), claimRegionSummary(), manualEnvelopeHostileContribution()

### Community 38 - "Nation Search Parsing"
Cohesion: 0.67
Nodes (3): isSelectedNationSearch(), parseNationSearchValue(), searchFilterText()

### Community 39 - "Map Wheel Zoom"
Cohesion: 0.67
Nodes (3): mapPointFromClientPoint(), onMapWheel(), zoomMapAt()

### Community 40 - "Debug Flags"
Cohesion: 0.67
Nodes (3): shouldDebugDisableLabels(), shouldDebugUseCanonicalHitPaths(), shouldEnableDebugRenderStats()

### Community 41 - "Static Asset Links"
Cohesion: 0.67
Nodes (3): assets/app.js, assets/styles.css, Index HTML

### Community 42 - "Explore Select Flow"
Cohesion: 0.67
Nodes (3): Expansion Nodes, Explore and Select, Selected Region

## Knowledge Gaps
- **58 isolated node(s):** `Namespace`, `Namespace`, `Namespace`, `Namespace`, `CompletedProcess` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createDebugRenderStats()` connect `Debug Render Metrics` to `App Runtime Shell`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `Namespace`, `Namespace`, `Namespace` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Interaction Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.056948798328108674 - nodes in this community are weakly interconnected._
- **Should `Scenario Data Access` be split into smaller, more focused modules?**
  _Cohesion score 0.06298904538341157 - nodes in this community are weakly interconnected._
- **Should `Region Outline Builder` be split into smaller, more focused modules?**
  _Cohesion score 0.09134615384615384 - nodes in this community are weakly interconnected._
- **Should `SVG Map Layers` be split into smaller, more focused modules?**
  _Cohesion score 0.06654567453115548 - nodes in this community are weakly interconnected._
- **Should `Project Documentation Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.07007575757575757 - nodes in this community are weakly interconnected._