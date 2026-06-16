# Graph Report - .  (2026-06-16)

## Corpus Check
- 5 files · ~534,539 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 689 nodes · 1702 edges · 57 communities (42 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Interaction Flow|App Interaction Flow]]
- [[_COMMUNITY_Selection And Markers|Selection And Markers]]
- [[_COMMUNITY_Catalog Build Utilities|Catalog Build Utilities]]
- [[_COMMUNITY_Map Overlay Behavior|Map Overlay Behavior]]
- [[_COMMUNITY_Map Layer Rendering|Map Layer Rendering]]
- [[_COMMUNITY_App State Management|App State Management]]
- [[_COMMUNITY_Research Catalog Builder|Research Catalog Builder]]
- [[_COMMUNITY_Overlay Cache Keys|Overlay Cache Keys]]
- [[_COMMUNITY_Nation Claim Models|Nation Claim Models]]
- [[_COMMUNITY_Issue Planning Docs|Issue Planning Docs]]
- [[_COMMUNITY_WSL Build Script|WSL Build Script]]
- [[_COMMUNITY_Map Wrap Tests|Map Wrap Tests]]
- [[_COMMUNITY_Pages Rebuild Tool|Pages Rebuild Tool]]
- [[_COMMUNITY_Map View State|Map View State]]
- [[_COMMUNITY_Map Visual State|Map Visual State]]
- [[_COMMUNITY_Index App Shell|Index App Shell]]
- [[_COMMUNITY_Hit Layer Events|Hit Layer Events]]
- [[_COMMUNITY_Claim Data Builder|Claim Data Builder]]
- [[_COMMUNITY_Generated Output Verifier|Generated Output Verifier]]
- [[_COMMUNITY_GitHub Issue Workflow|GitHub Issue Workflow]]
- [[_COMMUNITY_Package Scripts|Package Scripts]]
- [[_COMMUNITY_Manual Envelope Model|Manual Envelope Model]]
- [[_COMMUNITY_Catalog Builder Tests|Catalog Builder Tests]]
- [[_COMMUNITY_Overlay Buffer DOM|Overlay Buffer DOM]]
- [[_COMMUNITY_Pages Build Tool|Pages Build Tool]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_Language E2E Tests|Language E2E Tests]]
- [[_COMMUNITY_Region Outline Extraction|Region Outline Extraction]]
- [[_COMMUNITY_Translation And Controls|Translation And Controls]]
- [[_COMMUNITY_Derived Data Indices|Derived Data Indices]]
- [[_COMMUNITY_Map View Zoom|Map View Zoom]]
- [[_COMMUNITY_Overlay Render Keys|Overlay Render Keys]]
- [[_COMMUNITY_Overlay Fragment Creation|Overlay Fragment Creation]]
- [[_COMMUNITY_Map Pan Lifecycle|Map Pan Lifecycle]]
- [[_COMMUNITY_Nation Dropdown UI|Nation Dropdown UI]]
- [[_COMMUNITY_Capital Region Labels|Capital Region Labels]]
- [[_COMMUNITY_Search Aliases|Search Aliases]]
- [[_COMMUNITY_Pan Hover Refresh|Pan Hover Refresh]]
- [[_COMMUNITY_Active Data Access|Active Data Access]]
- [[_COMMUNITY_Foreign Hover Overlays|Foreign Hover Overlays]]
- [[_COMMUNITY_Tooltip Positioning|Tooltip Positioning]]
- [[_COMMUNITY_Search Filter Parsing|Search Filter Parsing]]
- [[_COMMUNITY_Nation Panel Events|Nation Panel Events]]
- [[_COMMUNITY_Color Hashing|Color Hashing]]
- [[_COMMUNITY_Manual Envelope Sorting|Manual Envelope Sorting]]
- [[_COMMUNITY_Nation Match Ranking|Nation Match Ranking]]
- [[_COMMUNITY_Aside Card Persistence|Aside Card Persistence]]
- [[_COMMUNITY_Copilot Instructions|Copilot Instructions]]
- [[_COMMUNITY_Pull Request Template|Pull Request Template]]
- [[_COMMUNITY_Base Map Color|Base Map Color]]
- [[_COMMUNITY_Claim Display Control|Claim Display Control]]
- [[_COMMUNITY_Claim Type Control|Claim Type Control]]
- [[_COMMUNITY_Reachable Capitals Toggle|Reachable Capitals Toggle]]
- [[_COMMUNITY_Project Control|Project Control]]
- [[_COMMUNITY_Search Selection Control|Search Selection Control]]
- [[_COMMUNITY_Region Labels Toggle|Region Labels Toggle]]

## God Nodes (most connected - your core abstractions)
1. `t()` - 40 edges
2. `updateNationOverlay()` - 30 edges
3. `clearHoverPreview()` - 25 edges
4. `clearSelection()` - 23 edges
5. `getLockedNation()` - 19 edges
6. `getActiveNation()` - 18 edges
7. `updateHoveredRegion()` - 18 edges
8. `renderNationInfoPanel()` - 18 edges
9. `renderHoverOutlines()` - 17 edges
10. `recordRenderStat()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Terra Invicta Interactive Worldmap` --references--> `GitHub Pages deployment workflow`  [EXTRACTED]
  README.md → .github/workflows/pages.yml
- `Terra Invicta Interactive Worldmap` --references--> `Python dependency requirements`  [EXTRACTED]
  README.md → requirements.txt
- `load_json()` --calls--> `sanitize_data_value()`  [INFERRED]
  tools/build_pages.py → tools/catalog_utils.py
- `clean_value()` --calls--> `compact_number()`  [INFERRED]
  tools/build_research_catalog.py → tools/catalog_utils.py
- `load_research_localizations()` --calls--> `read_localization_file()`  [INFERRED]
  tools/build_research_catalog.py → tools/catalog_utils.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Issue 32 phased implementation plan** — docs_plan_issue_32_00_master_plan, docs_plan_issue_32_01_state_model, docs_plan_issue_32_02_pinned_regions_ui, docs_plan_issue_32_03_map_visuals_and_interactions, docs_plan_issue_32_04_manual_recursive_envelope, docs_plan_issue_32_05_reachable_capital_candidates [EXTRACTED 1.00]
- **Explore and select workflow** — src_index_explore_and_select, src_index_search_and_select_nation_region, src_index_claim_display, src_index_claim_type, src_index_project, src_index_base_map_color, src_index_toggle_region_labels, src_index_hide_reachable_capitals [INFERRED 0.75]

## Communities (57 total, 15 thin omitted)

### Community 0 - "App Interaction Flow"
Cohesion: 0.06
Nodes (91): applyFilters(), applyMapVisualState(), applyMapVisualStateForRegions(), buildActiveExpansionScope(), cancelPendingHoverPreview(), canUseSimpleHoverClearDelta(), canUseSimpleHoverVisualDelta(), chooseNationFromDropdown() (+83 more)

### Community 1 - "Selection And Markers"
Cohesion: 0.07
Nodes (57): appendCapitalMarkerGroup(), appendPinnedRegionMarker(), appendReachableCapitalCandidateMarker(), appendSelectedRegionMarker(), bindReachableCapitalCandidatePanelEvents(), buildIncomingClaimIndex(), buildNationChoices(), claimCardResearchLabel() (+49 more)

### Community 2 - "Catalog Build Utilities"
Cohesion: 0.10
Nodes (52): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), initial_regions_by_nation(), load_nation_localizations(), load_nation_templates(), main(), norm_id() (+44 more)

### Community 3 - "Map Overlay Behavior"
Cohesion: 0.06
Nodes (7): bindPinnedRegionsPanelEvents(), clearOverlayVisualState(), getFocusedRegionName(), hitRegionElementFromClientPoint(), onMapLeave(), scheduleHoverFullVisualPass(), shouldRenderCommittedNationDetails()

### Community 4 - "Map Layer Rendering"
Cohesion: 0.22
Nodes (18): appendWorldCopyFragment(), buildVisualFillGroups(), clearRegistry(), createGroupedVisualFillFragment(), createRegionPath(), createSvgElement(), datasetRenderKey(), DEFAULT_COPY_CONTEXT (+10 more)

### Community 5 - "App State Management"
Cohesion: 0.21
Nodes (19): clearPinnedRegions(), clearSelectionState(), clearTransientClaimState(), createAppState(), normalizeId(), normalizeIds(), pinRegion(), setActiveIncomingClaim() (+11 more)

### Community 6 - "Research Catalog Builder"
Cohesion: 0.22
Nodes (20): build_catalog(), build_graph_links(), claim_grants_by_project(), clean_value(), infer_node_kind(), load_research_localizations(), localized_fields(), main() (+12 more)

### Community 7 - "Overlay Cache Keys"
Cohesion: 0.16
Nodes (20): activeClaimPreviewScopeCacheKey(), buildOverlayModelCacheKey(), claimLabelDescriptorCacheKey(), claimLabelDescriptors(), claimOverlayDescriptorCacheKey(), claimOverlayPathDescriptors(), foreignHoverDescriptorCacheKey(), getCachedLruValue() (+12 more)

### Community 8 - "Nation Claim Models"
Cohesion: 0.14
Nodes (20): buildForeignHoverOverlayDescriptorSet(), buildManualEnvelopeSource(), buildNationOverlayModel(), countryProjectTierMap(), cumulativeClaimEntries(), getActiveIncomingClaimKey(), getClaimKindFilteredProjectEntries(), getVisibleProjectEntries() (+12 more)

### Community 9 - "Issue Planning Docs"
Cohesion: 0.11
Nodes (19): Support manual recursive expansion pins with reachable capital candidates, Issue #24 E3, Issue #32, Issue #35, Manual recursive expansion pins with reachable capital candidates, Phased implementation plan, Phase 01: State model, focusedRegionId (+11 more)

### Community 10 - "WSL Build Script"
Cohesion: 0.25
Nodes (16): build-wsl.sh script, bootstrap_node(), bootstrap_python(), die(), discover_region_outlines(), discover_templates_dir(), ensure_python_command(), first_existing() (+8 more)

### Community 11 - "Map Wrap Tests"
Cohesion: 0.12
Nodes (5): expectProjectedCopies(), expectProjectedRegion(), SEAM_CANDIDATES, waitForAnimationFrames(), waitForHoverPreviewFrame()

### Community 12 - "Pages Rebuild Tool"
Cohesion: 0.29
Nodes (16): CompletedProcess, build_pages(), commit_and_push(), current_branch(), default_templates_dir(), first_existing(), generated_paths_changed(), infer_templates_dir() (+8 more)

### Community 13 - "Map View State"
Cohesion: 0.30
Nodes (14): clampMapViewX(), clampMapViewY(), clampNumber(), createMapViewState(), finiteNumber(), formatViewBoxForMapView(), formatViewBoxNumber(), initializeMapView() (+6 more)

### Community 14 - "Map Visual State"
Cohesion: 0.24
Nodes (15): applyHitPathVisualState(), applyMapVisualState(), applyMapVisualStateForRegions(), applyRegionPathVisualState(), clearOverlayVisualState(), createMapVisualState(), hitPathInstances(), regionPathInstances() (+7 more)

### Community 15 - "Index App Shell"
Cohesion: 0.14
Nodes (14): assets/app.js, assets/data.generated.js, assets/styles.css, Claim source note, Expansion Nodes, Explore and Select, nation1, projectUnlockName (+6 more)

### Community 16 - "Hit Layer Events"
Cohesion: 0.17
Nodes (13): consumeSuppressedMapClick(), onHitLayerClick(), onHitLayerPointerMove(), onHitLayerPointerOut(), onHitLayerPointerOver(), onRegionEnter(), reachableCapitalCandidateForRegion(), resolveHitRegion() (+5 more)

### Community 17 - "Claim Data Builder"
Cohesion: 0.36
Nodes (12): build_claim_data(), catalog_nation_metadata(), load_json(), main(), norm_id(), parse_args(), project_label(), project_metadata_from_research_catalog() (+4 more)

### Community 18 - "Generated Output Verifier"
Cohesion: 0.36
Nodes (12): aliases(), display_name(), list_value(), load_json(), main(), number_value(), object_value(), Path (+4 more)

### Community 19 - "GitHub Issue Workflow"
Cohesion: 0.23
Nodes (12): Bug report template, Issue template config, Feature request template, Feedback template, GitHub labels, bug, data, enhancement (+4 more)

### Community 20 - "Package Scripts"
Cohesion: 0.17
Nodes (11): devDependencies, @playwright/test, name, private, scripts, build, deploy, test:e2e (+3 more)

### Community 21 - "Manual Envelope Model"
Cohesion: 0.18
Nodes (12): activeClaimPreviewContainsRegion(), activeClaimPreviewRegionSet(), addManualEnvelopeContribution(), addRegionNamesToSet(), buildManualEnvelopeModel(), compareManualEnvelopeSourceSpecs(), countryProjectTier(), manualEnvelopeSourceKey() (+4 more)

### Community 22 - "Catalog Builder Tests"
Cohesion: 0.38
Nodes (4): CatalogBuilderTests, Path, write_json(), write_text()

### Community 23 - "Overlay Buffer DOM"
Cohesion: 0.20
Nodes (11): clearBufferedLayerChildrenForRenderKey(), clearClaimOverlayDom(), createOverlayBufferGroup(), getBufferedLayerState(), recordRenderStat(), replaceBufferedLayerChildrenForRenderKey(), replaceForeignHoverOverlayForKey(), replaceHoverOutlinesForKey() (+3 more)

### Community 24 - "Pages Build Tool"
Cohesion: 0.38
Nodes (10): build_pages(), copy_js_modules(), load_json(), main(), parse_args(), Any, Namespace, Path (+2 more)

### Community 25 - "Project Documentation"
Cohesion: 0.20
Nodes (10): GitHub Pages deployment workflow, Terra Invicta Interactive Worldmap, Build workflow, Claim / Unification Map, Local game data rebuild, Checked-in Pages site, Region outline refresh, Terra Invicta templates (+2 more)

### Community 26 - "Language E2E Tests"
Cohesion: 0.29
Nodes (6): clickRegion(), hoverRegion(), hoverRegionWithMouse(), regionTarget(), waitForAnimationFrames(), waitForHoverPreviewFrame()

### Community 27 - "Region Outline Extraction"
Cohesion: 0.36
Nodes (9): extract_with_unitypy(), main(), _normalize_region_collection(), parse_args(), _plain(), Any, Namespace, Path (+1 more)

### Community 28 - "Translation And Controls"
Cohesion: 0.22
Nodes (9): applyStaticTranslations(), initAsideCards(), initMapViewControls(), readJsonSetting(), toggleReachableCapitalCandidatesState(), updateAsideCardControls(), updateMapViewControlsLabels(), updateReachableCapitalsButtonState() (+1 more)

### Community 29 - "Derived Data Indices"
Cohesion: 0.48
Nodes (6): buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory(), normalizeId(), overlayResultSetContains(), resolveSecondaryCapitalPreview()

### Community 30 - "Map View Zoom"
Cohesion: 0.29
Nodes (7): applyMapViewToSvg(), invalidateTooltipLayout(), mapPointFromClientPoint(), onMapWheel(), renderGrid(), resetMapView(), zoomMapAt()

### Community 31 - "Overlay Render Keys"
Cohesion: 0.33
Nodes (7): claimLabelRenderKey(), claimOverlayPathRenderKey(), copyContextRenderKey(), hoverClaimPreviewRenderKey(), pinnedRegionMarkerRenderKey(), renderMapOverlay(), setOverlayVisualState()

### Community 32 - "Overlay Fragment Creation"
Cohesion: 0.29
Nodes (7): createClaimLabelFragment(), createClaimOverlayPathFragment(), createManualEnvelopeFragment(), createPinnedRegionMarkerFragment(), createProjectedCopyFragment(), createReachableCapitalCandidateFragment(), renderSelectionOutlines()

### Community 33 - "Map Pan Lifecycle"
Cohesion: 0.40
Nodes (5): finishMapPan(), markSuppressNextMapClick(), onMapLostPointerCapture(), onMapPointerCancel(), onMapPointerUp()

### Community 34 - "Nation Dropdown UI"
Cohesion: 0.40
Nodes (5): matchingNationChoices(), openNationDropdown(), renderNationDropdown(), setDropdownExpanded(), visibleNationChoices()

### Community 35 - "Capital Region Labels"
Cohesion: 0.50
Nodes (4): addCapitalMarkerNation(), capitalRegionNames(), capitalRegionNamesForNation(), capitalRegionsText()

### Community 36 - "Search Aliases"
Cohesion: 0.67
Nodes (4): nationClaimProjectSearchAliases(), nationSearchAliases(), projectSearchAliases(), uniqueSearchTerms()

### Community 37 - "Pan Hover Refresh"
Cohesion: 0.50
Nodes (4): onMapPointerMove(), scheduleMapViewRender(), schedulePanHoverRefresh(), viewDeltaFromPointerDelta()

### Community 39 - "Foreign Hover Overlays"
Cohesion: 0.67
Nodes (3): appendForeignHoverNationOverlay(), appendForeignHoverRegion(), secondaryCapitalFillOpacity()

### Community 40 - "Tooltip Positioning"
Cohesion: 0.67
Nodes (3): applyTooltipPosition(), measureTooltipSize(), svgWrapRect()

### Community 41 - "Search Filter Parsing"
Cohesion: 0.67
Nodes (3): isSelectedNationSearch(), parseNationSearchValue(), searchFilterText()

## Knowledge Gaps
- **57 isolated node(s):** `name`, `version`, `private`, `type`, `build` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `buildDerivedIndices()` connect `Derived Data Indices` to `Map Overlay Behavior`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `zoomMapView()` connect `Map View State` to `Map Overlay Behavior`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `applyMapVisualStateForRegions()` connect `Map Visual State` to `Map Overlay Behavior`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _63 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Interaction Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.06105006105006105 - nodes in this community are weakly interconnected._
- **Should `Selection And Markers` be split into smaller, more focused modules?**
  _Cohesion score 0.07205513784461152 - nodes in this community are weakly interconnected._
- **Should `Catalog Build Utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.1037037037037037 - nodes in this community are weakly interconnected._