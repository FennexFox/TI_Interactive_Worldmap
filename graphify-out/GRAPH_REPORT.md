# Graph Report - .  (2026-06-16)

## Corpus Check
- 37 files · ~119,375 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 685 nodes · 1755 edges · 54 communities (38 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Main App Interaction|Main App Interaction]]
- [[_COMMUNITY_Region Outline Builder|Region Outline Builder]]
- [[_COMMUNITY_Claim Summary UI|Claim Summary UI]]
- [[_COMMUNITY_SVG Map Layers|SVG Map Layers]]
- [[_COMMUNITY_App Overlay Logic|App Overlay Logic]]
- [[_COMMUNITY_Claim Overlay Caches|Claim Overlay Caches]]
- [[_COMMUNITY_Map View Controls|Map View Controls]]
- [[_COMMUNITY_App State Management|App State Management]]
- [[_COMMUNITY_Nation Claim Overlays|Nation Claim Overlays]]
- [[_COMMUNITY_WSL Build Script|WSL Build Script]]
- [[_COMMUNITY_Map Wrap Tests|Map Wrap Tests]]
- [[_COMMUNITY_Pages Rebuild Tool|Pages Rebuild Tool]]
- [[_COMMUNITY_Map Visual State|Map Visual State]]
- [[_COMMUNITY_Buffered Layer Rendering|Buffered Layer Rendering]]
- [[_COMMUNITY_Reachable Capitals UI|Reachable Capitals UI]]
- [[_COMMUNITY_Nation Catalog Builder|Nation Catalog Builder]]
- [[_COMMUNITY_Project Documentation Overview|Project Documentation Overview]]
- [[_COMMUNITY_Claim Data Builder|Claim Data Builder]]
- [[_COMMUNITY_Generated Output Verifier|Generated Output Verifier]]
- [[_COMMUNITY_GitHub Issue Templates|GitHub Issue Templates]]
- [[_COMMUNITY_Package Scripts|Package Scripts]]
- [[_COMMUNITY_Catalog Builder Tests|Catalog Builder Tests]]
- [[_COMMUNITY_Region Hit Handling|Region Hit Handling]]
- [[_COMMUNITY_Pages Build Tool|Pages Build Tool]]
- [[_COMMUNITY_README Workflow Docs|README Workflow Docs]]
- [[_COMMUNITY_Language E2E Tests|Language E2E Tests]]
- [[_COMMUNITY_Region Outline Extraction|Region Outline Extraction]]
- [[_COMMUNITY_Overlay Render Keys|Overlay Render Keys]]
- [[_COMMUNITY_Derived Data Indices|Derived Data Indices]]
- [[_COMMUNITY_Agent Project Rules|Agent Project Rules]]
- [[_COMMUNITY_Manual Envelope Model|Manual Envelope Model]]
- [[_COMMUNITY_Map Pointer Release|Map Pointer Release]]
- [[_COMMUNITY_Capital Region Labels|Capital Region Labels]]
- [[_COMMUNITY_Search Alias Builders|Search Alias Builders]]
- [[_COMMUNITY_Map Pan Rendering|Map Pan Rendering]]
- [[_COMMUNITY_Active Data Access|Active Data Access]]
- [[_COMMUNITY_Funding Metadata|Funding Metadata]]
- [[_COMMUNITY_Tooltip Positioning|Tooltip Positioning]]
- [[_COMMUNITY_Nation Search Parsing|Nation Search Parsing]]
- [[_COMMUNITY_Nation Overlay Events|Nation Overlay Events]]
- [[_COMMUNITY_Hash Color Utility|Hash Color Utility]]
- [[_COMMUNITY_Manual Envelope Sorting|Manual Envelope Sorting]]
- [[_COMMUNITY_Nation Match Ranking|Nation Match Ranking]]
- [[_COMMUNITY_Aside Card Persistence|Aside Card Persistence]]
- [[_COMMUNITY_Copilot Instructions|Copilot Instructions]]
- [[_COMMUNITY_Pull Request Template|Pull Request Template]]
- [[_COMMUNITY_Base Map Color|Base Map Color]]
- [[_COMMUNITY_Claim Display Setting|Claim Display Setting]]
- [[_COMMUNITY_Claim Type Filter|Claim Type Filter]]
- [[_COMMUNITY_Reachable Capitals Toggle|Reachable Capitals Toggle]]
- [[_COMMUNITY_Project Filter|Project Filter]]
- [[_COMMUNITY_Search Selection Control|Search Selection Control]]
- [[_COMMUNITY_Region Labels Toggle|Region Labels Toggle]]

## God Nodes (most connected - your core abstractions)
1. `t()` - 40 edges
2. `updateNationOverlay()` - 30 edges
3. `clearHoverPreview()` - 25 edges
4. `clearSelection()` - 23 edges
5. `getLockedNation()` - 19 edges
6. `recordRenderStat()` - 18 edges
7. `getActiveNation()` - 18 edges
8. `updateHoveredRegion()` - 18 edges
9. `renderNationInfoPanel()` - 18 edges
10. `renderHoverOutlines()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `load_nation_localizations()` --calls--> `read_localization_file()`  [INFERRED]
  tools/build_nation_catalog.py → tools/catalog_utils.py
- `load_nation_templates()` --calls--> `load_named_templates()`  [INFERRED]
  tools/build_nation_catalog.py → tools/catalog_utils.py
- `build_catalog()` --calls--> `source_fingerprint()`  [INFERRED]
  tools/build_nation_catalog.py → tools/catalog_utils.py
- `build_catalog()` --calls--> `unique_strings()`  [INFERRED]
  tools/build_nation_catalog.py → tools/catalog_utils.py
- `main()` --calls--> `parse_languages()`  [INFERRED]
  tools/build_nation_catalog.py → tools/catalog_utils.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Explore and select workflow** — src_index_explore_and_select, src_index_search_and_select_nation_region, src_index_claim_display, src_index_claim_type, src_index_project, src_index_base_map_color, src_index_toggle_region_labels, src_index_hide_reachable_capitals [INFERRED 0.75]

## Communities (54 total, 16 thin omitted)

### Community 0 - "Main App Interaction"
Cohesion: 0.07
Nodes (81): applyFilters(), applyMapVisualState(), applyMapVisualStateForRegions(), bindPinnedRegionsPanelEvents(), buildActiveExpansionScope(), cancelPendingHoverPreview(), canUseSimpleHoverClearDelta(), canUseSimpleHoverVisualDelta() (+73 more)

### Community 1 - "Region Outline Builder"
Cohesion: 0.09
Nodes (58): assign_nation_color_indexes(), build_nation_adjacency(), compact_region_geometry(), compact_region_outlines(), load_json(), load_nation_localizations(), load_nation_name_lookup(), load_region_localizations() (+50 more)

### Community 2 - "Claim Summary UI"
Cohesion: 0.07
Nodes (56): appendReachableCapitalCandidateMarker(), buildIncomingClaimIndex(), buildNationChoices(), claimCardTitle(), claimCardTitleParts(), claimGroupCountText(), claimModeLabel(), claimRegionSummary() (+48 more)

### Community 3 - "SVG Map Layers"
Cohesion: 0.09
Nodes (40): appendWorldCopyFragment(), buildVisualFillGroups(), clearRegistry(), createGroupedVisualFillFragment(), createRegionPath(), createSvgElement(), datasetRenderKey(), DEFAULT_COPY_CONTEXT (+32 more)

### Community 4 - "App Overlay Logic"
Cohesion: 0.06
Nodes (7): clearOverlayVisualState(), clearPinsOrSelection(), hitRegionElementFromClientPoint(), onMapLeave(), scheduleHoverFullVisualPass(), setHiddenVisualState(), shouldRenderCommittedNationDetails()

### Community 5 - "Claim Overlay Caches"
Cohesion: 0.10
Nodes (29): activeClaimPreviewContainsRegion(), activeClaimPreviewRegionSet(), activeClaimPreviewScopeCacheKey(), addRegionNamesToSet(), buildManualEnvelopeModel(), buildOverlayModelCacheKey(), claimLabelDescriptorCacheKey(), claimLabelDescriptors() (+21 more)

### Community 6 - "Map View Controls"
Cohesion: 0.18
Nodes (21): applyMapViewToSvg(), invalidateTooltipLayout(), mapPointFromClientPoint(), onMapWheel(), renderGrid(), resetMapView(), zoomMapAt(), clampMapViewX() (+13 more)

### Community 7 - "App State Management"
Cohesion: 0.21
Nodes (19): clearPinnedRegions(), clearSelectionState(), clearTransientClaimState(), createAppState(), normalizeId(), normalizeIds(), pinRegion(), setActiveIncomingClaim() (+11 more)

### Community 8 - "Nation Claim Overlays"
Cohesion: 0.14
Nodes (20): buildForeignHoverOverlayDescriptorSet(), buildManualEnvelopeSource(), buildNationOverlayModel(), claimCardResearchLabel(), countryProjectTier(), countryProjectTierMap(), cumulativeClaimEntries(), getActiveIncomingClaimKey() (+12 more)

### Community 9 - "WSL Build Script"
Cohesion: 0.25
Nodes (16): build-wsl.sh script, bootstrap_node(), bootstrap_python(), die(), discover_region_outlines(), discover_templates_dir(), ensure_python_command(), first_existing() (+8 more)

### Community 10 - "Map Wrap Tests"
Cohesion: 0.12
Nodes (5): expectProjectedCopies(), expectProjectedRegion(), SEAM_CANDIDATES, waitForAnimationFrames(), waitForHoverPreviewFrame()

### Community 11 - "Pages Rebuild Tool"
Cohesion: 0.29
Nodes (16): CompletedProcess, build_pages(), commit_and_push(), current_branch(), default_templates_dir(), first_existing(), generated_paths_changed(), infer_templates_dir() (+8 more)

### Community 12 - "Map Visual State"
Cohesion: 0.24
Nodes (15): applyHitPathVisualState(), applyMapVisualState(), applyMapVisualStateForRegions(), applyRegionPathVisualState(), clearOverlayVisualState(), createMapVisualState(), hitPathInstances(), regionPathInstances() (+7 more)

### Community 13 - "Buffered Layer Rendering"
Cohesion: 0.20
Nodes (15): replaceLayerChildren(), clearBufferedLayerChildrenForRenderKey(), clearClaimOverlayDom(), clearManualEnvelopeOverlay(), createOverlayBufferGroup(), getBufferedLayerState(), recordRenderStat(), replaceBufferedLayerChildrenForRenderKey() (+7 more)

### Community 14 - "Reachable Capitals UI"
Cohesion: 0.17
Nodes (15): applyStaticTranslations(), bindReachableCapitalCandidatePanelEvents(), getShowReachableCapitalCandidates(), initAsideCards(), initMapViewControls(), reachableCapitalCandidateRenderKey(), readJsonSetting(), refreshReachableCapitalCandidateOutputs() (+7 more)

### Community 15 - "Nation Catalog Builder"
Cohesion: 0.34
Nodes (14): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), initial_regions_by_nation(), load_nation_localizations(), load_nation_templates(), main(), norm_id() (+6 more)

### Community 16 - "Project Documentation Overview"
Cohesion: 0.14
Nodes (14): assets/app.js, assets/data.generated.js, assets/styles.css, Claim source note, Expansion Nodes, Explore and Select, nation1, projectUnlockName (+6 more)

### Community 17 - "Claim Data Builder"
Cohesion: 0.36
Nodes (12): build_claim_data(), catalog_nation_metadata(), load_json(), main(), norm_id(), parse_args(), project_label(), project_metadata_from_research_catalog() (+4 more)

### Community 18 - "Generated Output Verifier"
Cohesion: 0.36
Nodes (12): aliases(), display_name(), list_value(), load_json(), main(), number_value(), object_value(), Path (+4 more)

### Community 19 - "GitHub Issue Templates"
Cohesion: 0.23
Nodes (12): Bug report template, Issue template config, Feature request template, Feedback template, GitHub labels, bug, data, enhancement (+4 more)

### Community 20 - "Package Scripts"
Cohesion: 0.17
Nodes (11): devDependencies, @playwright/test, name, private, scripts, build, deploy, test:e2e (+3 more)

### Community 21 - "Catalog Builder Tests"
Cohesion: 0.38
Nodes (4): CatalogBuilderTests, Path, write_json(), write_text()

### Community 22 - "Region Hit Handling"
Cohesion: 0.20
Nodes (11): consumeSuppressedMapClick(), onHitLayerClick(), onHitLayerPointerMove(), onHitLayerPointerOut(), onHitLayerPointerOver(), onRegionEnter(), reachableCapitalCandidateForRegion(), resolveHitRegion() (+3 more)

### Community 23 - "Pages Build Tool"
Cohesion: 0.38
Nodes (10): build_pages(), copy_js_modules(), load_json(), main(), parse_args(), Any, Namespace, Path (+2 more)

### Community 24 - "README Workflow Docs"
Cohesion: 0.20
Nodes (10): GitHub Pages deployment workflow, Terra Invicta Interactive Worldmap, Build workflow, Claim / Unification Map, Local game data rebuild, Checked-in Pages site, Region outline refresh, Terra Invicta templates (+2 more)

### Community 25 - "Language E2E Tests"
Cohesion: 0.29
Nodes (6): clickRegion(), hoverRegion(), hoverRegionWithMouse(), regionTarget(), waitForAnimationFrames(), waitForHoverPreviewFrame()

### Community 26 - "Region Outline Extraction"
Cohesion: 0.36
Nodes (9): extract_with_unitypy(), main(), _normalize_region_collection(), parse_args(), _plain(), Any, Namespace, Path (+1 more)

### Community 27 - "Overlay Render Keys"
Cohesion: 0.25
Nodes (9): claimLabelRenderKey(), claimOverlayPathRenderKey(), copyContextRenderKey(), hoverClaimPreviewRenderKey(), manualEnvelopeRenderKey(), pinnedRegionMarkerRenderKey(), renderManualEnvelopeOverlay(), renderMapOverlay() (+1 more)

### Community 28 - "Derived Data Indices"
Cohesion: 0.48
Nodes (6): buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory(), normalizeId(), overlayResultSetContains(), resolveSecondaryCapitalPreview()

### Community 29 - "Agent Project Rules"
Cohesion: 0.33
Nodes (5): Browser App Module Boundaries, Change Rules, Generated And Derived Artifacts, Preferred Source Paths, Subagent Policy

### Community 30 - "Manual Envelope Model"
Cohesion: 0.40
Nodes (5): addManualEnvelopeContribution(), buildManualEnvelopeModelUncached(), compareManualEnvelopeSourceSpecs(), manualEnvelopeSourceKey(), manualEnvelopeSourceSpecs()

### Community 31 - "Map Pointer Release"
Cohesion: 0.40
Nodes (5): finishMapPan(), markSuppressNextMapClick(), onMapLostPointerCapture(), onMapPointerCancel(), onMapPointerUp()

### Community 32 - "Capital Region Labels"
Cohesion: 0.50
Nodes (4): addCapitalMarkerNation(), capitalRegionNames(), capitalRegionNamesForNation(), capitalRegionsText()

### Community 33 - "Search Alias Builders"
Cohesion: 0.67
Nodes (4): nationClaimProjectSearchAliases(), nationSearchAliases(), projectSearchAliases(), uniqueSearchTerms()

### Community 34 - "Map Pan Rendering"
Cohesion: 0.50
Nodes (4): onMapPointerMove(), scheduleMapViewRender(), schedulePanHoverRefresh(), viewDeltaFromPointerDelta()

### Community 37 - "Tooltip Positioning"
Cohesion: 0.67
Nodes (3): applyTooltipPosition(), measureTooltipSize(), svgWrapRect()

### Community 38 - "Nation Search Parsing"
Cohesion: 0.67
Nodes (3): isSelectedNationSearch(), parseNationSearchValue(), searchFilterText()

## Knowledge Gaps
- **48 isolated node(s):** `name`, `version`, `private`, `type`, `build` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zoomMapView()` connect `Map View Controls` to `App Overlay Logic`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `applyMapVisualStateForRegions()` connect `Map Visual State` to `App Overlay Logic`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `sanitize_data_value()` connect `Region Outline Builder` to `Pages Build Tool`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Main App Interaction` be split into smaller, more focused modules?**
  _Cohesion score 0.07037037037037037 - nodes in this community are weakly interconnected._
- **Should `Region Outline Builder` be split into smaller, more focused modules?**
  _Cohesion score 0.0912568306010929 - nodes in this community are weakly interconnected._
- **Should `Claim Summary UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06948051948051948 - nodes in this community are weakly interconnected._