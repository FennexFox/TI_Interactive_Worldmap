# Graph Report - .  (2026-06-17)

## Corpus Check
- Corpus is ~34,882 words - fits in a single context window. You may not need a graph.

## Summary
- 685 nodes · 1770 edges · 42 communities (36 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Catalog Build Pipeline|Catalog Build Pipeline]]
- [[_COMMUNITY_App Interaction Flow|App Interaction Flow]]
- [[_COMMUNITY_Claim Data UI|Claim Data UI]]
- [[_COMMUNITY_SVG Map Layers|SVG Map Layers]]
- [[_COMMUNITY_App Render Orchestration|App Render Orchestration]]
- [[_COMMUNITY_Claim Overlay Caching|Claim Overlay Caching]]
- [[_COMMUNITY_README Claim Workflow|README Claim Workflow]]
- [[_COMMUNITY_App State Management|App State Management]]
- [[_COMMUNITY_WSL Build Script|WSL Build Script]]
- [[_COMMUNITY_Foreign Claim Overlay|Foreign Claim Overlay]]
- [[_COMMUNITY_Map View State|Map View State]]
- [[_COMMUNITY_Map Wrap Tests|Map Wrap Tests]]
- [[_COMMUNITY_Pages Rebuild Tool|Pages Rebuild Tool]]
- [[_COMMUNITY_Map Pointer Rendering|Map Pointer Rendering]]
- [[_COMMUNITY_Aside Panel UI|Aside Panel UI]]
- [[_COMMUNITY_Map Visual State|Map Visual State]]
- [[_COMMUNITY_Language E2E Tests|Language E2E Tests]]
- [[_COMMUNITY_Overlay Buffer Rendering|Overlay Buffer Rendering]]
- [[_COMMUNITY_Claim Data Builder|Claim Data Builder]]
- [[_COMMUNITY_Generated Output Verify|Generated Output Verify]]
- [[_COMMUNITY_Package Scripts|Package Scripts]]
- [[_COMMUNITY_Pinned Regions UI|Pinned Regions UI]]
- [[_COMMUNITY_Catalog Builder Tests|Catalog Builder Tests]]
- [[_COMMUNITY_Project Agent Rules|Project Agent Rules]]
- [[_COMMUNITY_Pages Build Tool|Pages Build Tool]]
- [[_COMMUNITY_Region Outline Extractor|Region Outline Extractor]]
- [[_COMMUNITY_Derived Data Indices|Derived Data Indices]]
- [[_COMMUNITY_Map Pan Lifecycle|Map Pan Lifecycle]]
- [[_COMMUNITY_Hit Layer Events|Hit Layer Events]]
- [[_COMMUNITY_Manual Envelope Model|Manual Envelope Model]]
- [[_COMMUNITY_Candidate Selection|Candidate Selection]]
- [[_COMMUNITY_Capital Marker Text|Capital Marker Text]]
- [[_COMMUNITY_Search Aliases|Search Aliases]]
- [[_COMMUNITY_Active Data Access|Active Data Access]]
- [[_COMMUNITY_Tooltip Positioning|Tooltip Positioning]]
- [[_COMMUNITY_Search Selection|Search Selection]]
- [[_COMMUNITY_Python Requirements|Python Requirements]]
- [[_COMMUNITY_Nation Panel Events|Nation Panel Events]]
- [[_COMMUNITY_Color Hashing|Color Hashing]]
- [[_COMMUNITY_Nation Choice Ranking|Nation Choice Ranking]]
- [[_COMMUNITY_Aside State Persistence|Aside State Persistence]]

## God Nodes (most connected - your core abstractions)
1. `t()` - 40 edges
2. `updateNationOverlay()` - 30 edges
3. `clearHoverPreview()` - 24 edges
4. `recordRenderStat()` - 23 edges
5. `clearSelection()` - 23 edges
6. `updateHoveredRegion()` - 18 edges
7. `renderNationInfoPanel()` - 18 edges
8. `renderHoverOutlines()` - 17 edges
9. `getActiveNation()` - 16 edges
10. `getLockedNation()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `src/index.html` --references--> `Terra Invicta Interactive Worldmap`  [EXTRACTED]
  src/index.html → README.md
- `load_json()` --calls--> `sanitize_data_value()`  [INFERRED]
  tools/build_pages.py → tools/catalog_utils.py
- `src/index.html` --references--> `Claim / Unification Map`  [EXTRACTED]
  src/index.html → README.md
- `Map note` --references--> `TIBilateralTemplate.json`  [EXTRACTED]
  src/index.html → README.md
- `copyContextRenderKey()` --calls--> `normalizeWorldCopyContexts()`  [EXTRACTED]
  src/app.js → src/render/map-layers.js

## Import Cycles
- None detected.

## Communities (42 total, 6 thin omitted)

### Community 0 - "Catalog Build Pipeline"
Cohesion: 0.07
Nodes (72): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), initial_regions_by_nation(), load_nation_localizations(), load_nation_templates(), main(), norm_id() (+64 more)

### Community 1 - "App Interaction Flow"
Cohesion: 0.09
Nodes (66): applyFilters(), applyMapVisualState(), applyMapVisualStateForRegions(), buildActiveExpansionScope(), cancelPendingHoverPreview(), chooseNationFromDropdown(), clearHoverClaimPreviewOverlay(), clearHoverPreview() (+58 more)

### Community 2 - "Claim Data UI"
Cohesion: 0.07
Nodes (58): buildIncomingClaimIndex(), buildNationChoices(), claimCardResearchLabel(), claimCardTitle(), claimCardTitleParts(), claimGroupCountText(), claimModeLabel(), claimRegionSummary() (+50 more)

### Community 3 - "SVG Map Layers"
Cohesion: 0.09
Nodes (43): appendWorldCopyFragment(), buildVisualFillGroups(), clearRegistry(), createGroupedVisualFillFragment(), createRegionPath(), createSvgElement(), datasetRenderKey(), DEFAULT_COPY_CONTEXT (+35 more)

### Community 4 - "App Render Orchestration"
Cohesion: 0.05
Nodes (12): appLoading, appLoadingDetail, canUseSimpleHoverClearDelta(), canUseSimpleHoverVisualDelta(), changedRegionIds(), clearOverlayVisualState(), clearPinsOrSelection(), hitRegionElementFromClientPoint() (+4 more)

### Community 5 - "Claim Overlay Caching"
Cohesion: 0.10
Nodes (33): activeClaimPreviewContainsRegion(), activeClaimPreviewRegionSet(), activeClaimPreviewScopeCacheKey(), addRegionNamesToSet(), buildManualEnvelopeModel(), buildOverlayModelCacheKey(), claimLabelDescriptorCacheKey(), claimLabelDescriptors() (+25 more)

### Community 6 - "README Claim Workflow"
Cohesion: 0.08
Nodes (26): breakaway_gated_existing, Build workflow overview, Claim / Unification Map, Current scope, Deploy workflow, Direct claim profiles, Hostile claims, Project-unlocked claims (+18 more)

### Community 7 - "App State Management"
Cohesion: 0.21
Nodes (19): clearPinnedRegions(), clearSelectionState(), clearTransientClaimState(), createAppState(), normalizeId(), normalizeIds(), pinRegion(), setActiveIncomingClaim() (+11 more)

### Community 8 - "WSL Build Script"
Cohesion: 0.25
Nodes (16): build-wsl.sh script, bootstrap_node(), bootstrap_python(), die(), discover_region_outlines(), discover_templates_dir(), ensure_python_command(), first_existing() (+8 more)

### Community 9 - "Foreign Claim Overlay"
Cohesion: 0.14
Nodes (18): buildForeignHoverOverlayDescriptorSet(), buildManualEnvelopeSource(), buildNationOverlayModel(), countryProjectTier(), countryProjectTierMap(), getActiveIncomingClaimKey(), getClaimKindFilteredProjectEntries(), getVisibleProjectEntries() (+10 more)

### Community 10 - "Map View State"
Cohesion: 0.27
Nodes (15): resetMapView(), clampMapViewX(), clampMapViewY(), clampNumber(), createMapViewState(), finiteNumber(), formatViewBoxForMapView(), formatViewBoxNumber() (+7 more)

### Community 11 - "Map Wrap Tests"
Cohesion: 0.12
Nodes (5): expectProjectedCopies(), expectProjectedRegion(), SEAM_CANDIDATES, waitForAnimationFrames(), waitForHoverPreviewFrame()

### Community 12 - "Pages Rebuild Tool"
Cohesion: 0.29
Nodes (16): CompletedProcess, build_pages(), commit_and_push(), current_branch(), default_templates_dir(), first_existing(), generated_paths_changed(), infer_templates_dir() (+8 more)

### Community 13 - "Map Pointer Rendering"
Cohesion: 0.15
Nodes (17): applyMapViewToSvg(), invalidateTooltipLayout(), mapPointFromClientPoint(), measurePanViewportRect(), onMapPointerMove(), onMapWheel(), recordRenderStat(), recordRenderTiming() (+9 more)

### Community 14 - "Aside Panel UI"
Cohesion: 0.15
Nodes (17): applyStaticTranslations(), bindReachableCapitalCandidatePanelEvents(), clearManualEnvelopeOverlay(), getShowReachableCapitalCandidates(), initAsideCards(), initMapViewControls(), reachableCapitalCandidateRenderKey(), readJsonSetting() (+9 more)

### Community 15 - "Map Visual State"
Cohesion: 0.24
Nodes (15): applyHitPathVisualState(), applyMapVisualState(), applyMapVisualStateForRegions(), applyRegionPathVisualState(), clearOverlayVisualState(), createMapVisualState(), hitPathInstances(), regionPathInstances() (+7 more)

### Community 16 - "Language E2E Tests"
Cohesion: 0.18
Nodes (9): clickRegion(), hoverRegion(), hoverRegionWithMouse(), pinFirstReachableCapitalCandidate(), pinReachableCapitalCandidates(), regionTarget(), waitForAnimationFrames(), waitForHoverPreviewFrame() (+1 more)

### Community 17 - "Overlay Buffer Rendering"
Cohesion: 0.15
Nodes (14): claimLabelRenderKey(), claimOverlayPathRenderKey(), clearBufferedLayerChildrenForRenderKey(), clearClaimOverlayDom(), copyContextRenderKey(), createOverlayBufferGroup(), getBufferedLayerState(), hoverClaimPreviewRenderKey() (+6 more)

### Community 18 - "Claim Data Builder"
Cohesion: 0.36
Nodes (12): build_claim_data(), catalog_nation_metadata(), load_json(), main(), norm_id(), parse_args(), project_label(), project_metadata_from_research_catalog() (+4 more)

### Community 19 - "Generated Output Verify"
Cohesion: 0.36
Nodes (12): aliases(), display_name(), list_value(), load_json(), main(), number_value(), object_value(), Path (+4 more)

### Community 20 - "Package Scripts"
Cohesion: 0.17
Nodes (11): devDependencies, @playwright/test, name, private, scripts, build, deploy, test:e2e (+3 more)

### Community 21 - "Pinned Regions UI"
Cohesion: 0.26
Nodes (12): bindPinnedRegionsPanelEvents(), clearPinnedRegionState(), getPinnedRegionIds(), isPinnedCapitalRegionForNation(), pinRegionState(), refreshPinnedRegionOutputs(), renderPinnedRegionMarkers(), renderPinnedRegionsPanel() (+4 more)

### Community 22 - "Catalog Builder Tests"
Cohesion: 0.38
Nodes (4): CatalogBuilderTests, Path, write_json(), write_text()

### Community 23 - "Project Agent Rules"
Cohesion: 0.18
Nodes (10): Browser App Module Boundaries, Change Rules, Generated And Derived Artifacts, Preferred Source Paths, src/app.js, src/data/active-data.js, src/data/derived-indices.js, src/render/map-layers.js (+2 more)

### Community 24 - "Pages Build Tool"
Cohesion: 0.38
Nodes (10): build_pages(), copy_js_modules(), load_json(), main(), parse_args(), Any, Namespace, Path (+2 more)

### Community 25 - "Region Outline Extractor"
Cohesion: 0.36
Nodes (9): extract_with_unitypy(), main(), _normalize_region_collection(), parse_args(), _plain(), Any, Namespace, Path (+1 more)

### Community 26 - "Derived Data Indices"
Cohesion: 0.48
Nodes (6): buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory(), normalizeId(), overlayResultSetContains(), resolveSecondaryCapitalPreview()

### Community 27 - "Map Pan Lifecycle"
Cohesion: 0.33
Nodes (6): finishMapPan(), markSuppressNextMapClick(), onMapLostPointerCapture(), onMapPointerCancel(), onMapPointerUp(), schedulePanHoverRefresh()

### Community 28 - "Hit Layer Events"
Cohesion: 0.53
Nodes (6): onHitLayerPointerMove(), onHitLayerPointerOut(), onHitLayerPointerOver(), resolveHitRegion(), resolveRelatedHitRegion(), shouldSuppressHitLayerPointerEvent()

### Community 29 - "Manual Envelope Model"
Cohesion: 0.40
Nodes (5): addManualEnvelopeContribution(), buildManualEnvelopeModelUncached(), compareManualEnvelopeSourceSpecs(), manualEnvelopeSourceKey(), manualEnvelopeSourceSpecs()

### Community 30 - "Candidate Selection"
Cohesion: 0.40
Nodes (5): consumeSuppressedMapClick(), onHitLayerClick(), reachableCapitalCandidateForRegion(), selectReachableCapitalCandidate(), selectReachableCapitalCandidateRegion()

### Community 31 - "Capital Marker Text"
Cohesion: 0.50
Nodes (4): addCapitalMarkerNation(), capitalRegionNames(), capitalRegionNamesForNation(), capitalRegionsText()

### Community 32 - "Search Aliases"
Cohesion: 0.67
Nodes (4): nationClaimProjectSearchAliases(), nationSearchAliases(), projectSearchAliases(), uniqueSearchTerms()

### Community 34 - "Tooltip Positioning"
Cohesion: 0.67
Nodes (3): applyTooltipPosition(), measureTooltipSize(), svgWrapRect()

### Community 35 - "Search Selection"
Cohesion: 0.67
Nodes (3): isSelectedNationSearch(), parseNationSearchValue(), searchFilterText()

## Knowledge Gaps
- **44 isolated node(s):** `name`, `version`, `private`, `type`, `build` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zoomMapView()` connect `Map View State` to `App Render Orchestration`, `Map Pointer Rendering`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `applyMapVisualStateForRegions()` connect `Map Visual State` to `App Render Orchestration`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `sanitize_data_value()` connect `Catalog Build Pipeline` to `Pages Build Tool`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Build Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.07368421052631578 - nodes in this community are weakly interconnected._
- **Should `App Interaction Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.08717948717948718 - nodes in this community are weakly interconnected._
- **Should `Claim Data UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06594071385359952 - nodes in this community are weakly interconnected._