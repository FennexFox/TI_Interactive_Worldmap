# Graph Report - .  (2026-06-19)

## Corpus Check
- 37 files · ~44,814 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 838 nodes · 2217 edges · 54 communities (47 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Catalog Build Pipeline|Catalog Build Pipeline]]
- [[_COMMUNITY_Active Data Runtime|Active Data Runtime]]
- [[_COMMUNITY_Claim Data UI|Claim Data UI]]
- [[_COMMUNITY_SVG Overlay Rendering|SVG Overlay Rendering]]
- [[_COMMUNITY_App Render Helpers|App Render Helpers]]
- [[_COMMUNITY_README Build Workflow|README Build Workflow]]
- [[_COMMUNITY_Active Claim Model|Active Claim Model]]
- [[_COMMUNITY_Map Layer Helpers|Map Layer Helpers]]
- [[_COMMUNITY_Pages Build Tool|Pages Build Tool]]
- [[_COMMUNITY_Nation Catalog Builder|Nation Catalog Builder]]
- [[_COMMUNITY_Render Stats Measurement|Render Stats Measurement]]
- [[_COMMUNITY_Rebuild Pages Workflow|Rebuild Pages Workflow]]
- [[_COMMUNITY_Scenario Runtime Setup|Scenario Runtime Setup]]
- [[_COMMUNITY_Hover Interaction Flow|Hover Interaction Flow]]
- [[_COMMUNITY_Map View Controls|Map View Controls]]
- [[_COMMUNITY_SVG Element Creation|SVG Element Creation]]
- [[_COMMUNITY_Selection Interaction State|Selection Interaction State]]
- [[_COMMUNITY_Map Wrap Tests|Map Wrap Tests]]
- [[_COMMUNITY_Generated Output Verify|Generated Output Verify]]
- [[_COMMUNITY_WSL Build Script|WSL Build Script]]
- [[_COMMUNITY_Overlay Model Build|Overlay Model Build]]
- [[_COMMUNITY_Pinned Panel UI|Pinned Panel UI]]
- [[_COMMUNITY_Claim Card Rendering|Claim Card Rendering]]
- [[_COMMUNITY_Catalog Builder Tests|Catalog Builder Tests]]
- [[_COMMUNITY_Claim Data Builder|Claim Data Builder]]
- [[_COMMUNITY_Language E2E Tests|Language E2E Tests]]
- [[_COMMUNITY_Pan Render Timing|Pan Render Timing]]
- [[_COMMUNITY_Package Metadata|Package Metadata]]
- [[_COMMUNITY_Project Agent Rules|Project Agent Rules]]
- [[_COMMUNITY_Region Outline Extractor|Region Outline Extractor]]
- [[_COMMUNITY_Hit Layer Events|Hit Layer Events]]
- [[_COMMUNITY_Overlay Buffer Rendering|Overlay Buffer Rendering]]
- [[_COMMUNITY_Scenario Generation Tests|Scenario Generation Tests]]
- [[_COMMUNITY_License Boundaries|License Boundaries]]
- [[_COMMUNITY_Localization Helpers|Localization Helpers]]
- [[_COMMUNITY_Map Pan Lifecycle|Map Pan Lifecycle]]
- [[_COMMUNITY_Pinned Region Summaries|Pinned Region Summaries]]
- [[_COMMUNITY_Manual Envelope Model|Manual Envelope Model]]
- [[_COMMUNITY_Search Alias Generation|Search Alias Generation]]
- [[_COMMUNITY_Nation Search Dropdown|Nation Search Dropdown]]
- [[_COMMUNITY_Capital Marker Text|Capital Marker Text]]
- [[_COMMUNITY_Reachable Capital Logic|Reachable Capital Logic]]
- [[_COMMUNITY_Tooltip Positioning|Tooltip Positioning]]
- [[_COMMUNITY_Search Selection Parsing|Search Selection Parsing]]
- [[_COMMUNITY_HTML Asset Wiring|HTML Asset Wiring]]
- [[_COMMUNITY_Sidebar Sections|Sidebar Sections]]
- [[_COMMUNITY_Build Pages Tests|Build Pages Tests]]
- [[_COMMUNITY_Agent Workflow Rules|Agent Workflow Rules]]
- [[_COMMUNITY_Python Requirements|Python Requirements]]
- [[_COMMUNITY_Nation Panel Events|Nation Panel Events]]
- [[_COMMUNITY_Nation Match Ranking|Nation Match Ranking]]
- [[_COMMUNITY_Aside State Persistence|Aside State Persistence]]

## God Nodes (most connected - your core abstractions)
1. `t()` - 42 edges
2. `updateNationOverlay()` - 31 edges
3. `clearHoverPreview()` - 24 edges
4. `recordRenderStat()` - 23 edges
5. `clearSelection()` - 23 edges
6. `build_catalog()` - 22 edges
7. `renderActiveScenario()` - 20 edges
8. `getActiveNation()` - 19 edges
9. `getLockedNation()` - 19 edges
10. `updateSelectedRegions()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `createDebugRenderStats()` --calls--> `resetStats()`  [INFERRED]
  src/app.js → tools/measure_debug_render_stats.mjs
- `load_nation_localizations()` --calls--> `read_localization_file()`  [INFERRED]
  tools/build_nation_catalog.py → tools/catalog_utils.py
- `load_nation_templates()` --calls--> `load_named_templates()`  [INFERRED]
  tools/build_nation_catalog.py → tools/catalog_utils.py
- `build_catalog()` --calls--> `source_fingerprint()`  [INFERRED]
  tools/build_nation_catalog.py → tools/catalog_utils.py
- `build_catalog()` --calls--> `unique_strings()`  [INFERRED]
  tools/build_nation_catalog.py → tools/catalog_utils.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Claim Source Usage** — readme_claim_unification_map, readme_tibilateraltemplate_json, src_index_tibilateraltemplate_json [INFERRED 0.75]

## Communities (54 total, 7 thin omitted)

### Community 0 - "Catalog Build Pipeline"
Cohesion: 0.09
Nodes (62): assign_nation_color_indexes(), build_nation_adjacency(), compact_region_geometry(), compact_region_outlines(), load_json(), load_nation_display_names(), load_nation_display_overrides(), load_nation_localization_layers() (+54 more)

### Community 1 - "Active Data Runtime"
Cohesion: 0.08
Nodes (53): createAppData(), getActiveData(), getScenarioIds(), normalizeScenarioEntry(), scenarioIdFromEntry(), buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory() (+45 more)

### Community 2 - "Claim Data UI"
Cohesion: 0.08
Nodes (39): activeClaimPreviewContainsRegion(), activeClaimPreviewRegionSet(), activeClaimPreviewScopeCacheKey(), addRegionNamesToSet(), availableRuntimeNationIds(), bindPinnedRegionsPanelEvents(), buildManualEnvelopeModel(), buildOverlayModelCacheKey() (+31 more)

### Community 3 - "SVG Overlay Rendering"
Cohesion: 0.12
Nodes (38): applyFilters(), applyMapVisualState(), claimLabelRenderKey(), claimOverlayPathRenderKey(), clearHoverClaimPreviewOverlay(), clearManualEnvelopeOverlay(), clearOverlayVisualState(), copyContextRenderKey() (+30 more)

### Community 4 - "App Render Helpers"
Cohesion: 0.06
Nodes (4): appLoading, appLoadingDetail, colorFor(), hashHue()

### Community 5 - "README Build Workflow"
Cohesion: 0.08
Nodes (31): breakaway_gated_existing, Build workflow overview, Claim / Unification Map, Current scope, Deploy workflow, Direct claim profiles, docs/index.html, Hostile claims (+23 more)

### Community 6 - "Active Claim Model"
Cohesion: 0.13
Nodes (31): activeIncomingClaimKeysForState(), applyMapVisualStateForRegions(), buildActiveExpansionScope(), canUseSimpleHoverVisualDelta(), collectCapitalMarkers(), getActiveNation(), getCurrentNation(), getFocusedRegionName() (+23 more)

### Community 7 - "Map Layer Helpers"
Cohesion: 0.15
Nodes (27): appendWorldCopyFragment(), buildVisualFillGroups(), clearRegistry(), createGroupedVisualFillFragment(), datasetRenderKey(), DEFAULT_COPY_CONTEXT, finiteNumber(), normalizeDataset() (+19 more)

### Community 8 - "Pages Build Tool"
Cohesion: 0.17
Nodes (26): build_pages(), copy_js_modules(), default_scenario_bundle(), deterministic_gzip(), load_json(), main(), parse_args(), Any (+18 more)

### Community 9 - "Nation Catalog Builder"
Cohesion: 0.21
Nodes (26): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), display_name_values(), display_names_equal(), distinct_display_name(), initial_regions_by_nation(), load_nation_display_overrides() (+18 more)

### Community 10 - "Render Stats Measurement"
Cohesion: 0.15
Nodes (21): createDebugRenderStats(), captureSetupStats(), captureStats(), clickSelectedRegionOnMap(), configureClaimOverlay(), DEFAULT_EXTRA_NATIONS_BY_PRIMARY, DEFAULT_ZOOM_STEPS, main() (+13 more)

### Community 11 - "Rebuild Pages Workflow"
Cohesion: 0.24
Nodes (21): CompletedProcess, build_pages(), build_scenario_outputs(), commit_and_push(), copy_default_scenario_outputs(), current_branch(), default_templates_dir(), first_existing() (+13 more)

### Community 12 - "Scenario Runtime Setup"
Cohesion: 0.11
Nodes (22): defaultWorldCopyContext(), activeScenario(), activeScenarioId(), activeScenarioSummary(), applyStaticTranslations(), buildNationChoices(), clearScenarioSensitiveCaches(), createWorldCopyContexts() (+14 more)

### Community 13 - "Hover Interaction Flow"
Cohesion: 0.19
Nodes (22): cancelPendingHoverPreview(), canUseSimpleHoverClearDelta(), chooseNationFromDropdown(), clearHoverPreview(), clearPinsOrSelection(), clearSelection(), closeNationDropdown(), focusNation() (+14 more)

### Community 14 - "Map View Controls"
Cohesion: 0.21
Nodes (18): mapPointFromClientPoint(), onMapWheel(), resetMapView(), zoomMapAt(), clampMapViewX(), clampMapViewY(), clampNumber(), createMapViewState() (+10 more)

### Community 15 - "SVG Element Creation"
Cohesion: 0.16
Nodes (20): createRegionPath(), createSvgElement(), worldCopyDataset(), appendCapitalMarkerGroup(), appendForeignHoverNationOverlay(), appendForeignHoverRegion(), appendPinnedRegionMarker(), appendReachableCapitalCandidateMarker() (+12 more)

### Community 16 - "Selection Interaction State"
Cohesion: 0.17
Nodes (20): changedRegionIds(), commitReachableCapitalSelection(), consumeSuppressedMapClick(), focusPinnedRegion(), focusRegions(), getSecondaryHoverNation(), onHitLayerClick(), pinRegionState() (+12 more)

### Community 17 - "Map Wrap Tests"
Cohesion: 0.12
Nodes (7): expectProjectedCopies(), expectProjectedRegion(), pathWithQueryParam(), SEAM_CANDIDATES, waitForAnimationFrames(), waitForHoverPreviewFrame(), waitForWrappedMap()

### Community 18 - "Generated Output Verify"
Cohesion: 0.29
Nodes (18): aliases(), decode_generated_js_data(), display_name(), json_key(), layered_display_name(), list_value(), load_json(), main() (+10 more)

### Community 19 - "WSL Build Script"
Cohesion: 0.25
Nodes (16): build-wsl.sh script, bootstrap_node(), bootstrap_python(), die(), discover_region_outlines(), discover_templates_dir(), ensure_python_command(), first_existing() (+8 more)

### Community 20 - "Overlay Model Build"
Cohesion: 0.16
Nodes (18): buildForeignHoverOverlayDescriptorSet(), buildManualEnvelopeSource(), buildNationOverlayModel(), countryProjectTier(), countryProjectTierMap(), cumulativeClaimEntries(), getActiveIncomingClaimKey(), getClaimKindFilteredProjectEntries() (+10 more)

### Community 21 - "Pinned Panel UI"
Cohesion: 0.20
Nodes (17): bindReachableCapitalCandidatePanelEvents(), claimGroupCountText(), claimModeLabel(), claimTierCountText(), englishCount(), escapeHtml(), formatNumber(), infoSectionOpenAttribute() (+9 more)

### Community 22 - "Claim Card Rendering"
Cohesion: 0.18
Nodes (17): buildIncomingClaimIndex(), claimCardResearchLabel(), claimCardTitle(), claimCardTitleParts(), claimRegionSummary(), compareManualEnvelopeContributions(), cumulativeClaimEntry(), entryFilterValue() (+9 more)

### Community 23 - "Catalog Builder Tests"
Cohesion: 0.33
Nodes (4): CatalogBuilderTests, Path, write_json(), write_text()

### Community 24 - "Claim Data Builder"
Cohesion: 0.25
Nodes (15): build_claim_data(), catalog_nation_metadata(), load_json(), main(), norm_id(), parse_args(), project_label(), project_metadata_from_research_catalog() (+7 more)

### Community 25 - "Language E2E Tests"
Cohesion: 0.18
Nodes (9): clickRegion(), hoverRegion(), hoverRegionWithMouse(), pinFirstReachableCapitalCandidate(), pinReachableCapitalCandidates(), regionTarget(), waitForAnimationFrames(), waitForHoverPreviewFrame() (+1 more)

### Community 26 - "Pan Render Timing"
Cohesion: 0.19
Nodes (15): applyMapViewToSvg(), invalidateTooltipLayout(), measurePanViewportRect(), onMapPointerMove(), recordRenderStat(), recordRenderTiming(), renderGrid(), replaceForeignHoverOverlayForKey() (+7 more)

### Community 27 - "Package Metadata"
Cohesion: 0.14
Nodes (13): devDependencies, @playwright/test, license, name, private, scripts, build, deploy (+5 more)

### Community 28 - "Project Agent Rules"
Cohesion: 0.22
Nodes (10): Browser App Module Boundaries, Change Rules, Generated And Derived Artifacts, Preferred Source Paths, src/app.js, src/data/active-data.js, src/data/derived-indices.js, src/render/map-layers.js (+2 more)

### Community 29 - "Region Outline Extractor"
Cohesion: 0.36
Nodes (9): extract_with_unitypy(), main(), _normalize_region_collection(), parse_args(), _plain(), Any, Namespace, Path (+1 more)

### Community 30 - "Hit Layer Events"
Cohesion: 0.31
Nodes (9): onHitLayerPointerMove(), onHitLayerPointerOut(), onHitLayerPointerOver(), onRegionEnter(), resolveHitRegion(), resolveRelatedHitRegion(), scheduleTooltipPosition(), shouldSuppressHitLayerPointerEvent() (+1 more)

### Community 31 - "Overlay Buffer Rendering"
Cohesion: 0.29
Nodes (7): clearBufferedLayerChildrenForRenderKey(), clearClaimOverlayDom(), createOverlayBufferGroup(), getBufferedLayerState(), replaceBufferedLayerChildrenForRenderKey(), runAfterAnimationFrames(), setOverlayBufferActive()

### Community 33 - "License Boundaries"
Cohesion: 0.33
Nodes (6): Not Covered by MIT, Terra Invicta Data License Scope, Terms and Ownership, MIT License Terms, Warranty Disclaimer, License

### Community 34 - "Localization Helpers"
Cohesion: 0.40
Nodes (6): claimTierCountShortText(), dataLanguageKey(), humanizeNationLabel(), localizedDisplayName(), nationDisplayName(), nationEffectiveDisplayName()

### Community 35 - "Map Pan Lifecycle"
Cohesion: 0.33
Nodes (6): finishMapPan(), markSuppressNextMapClick(), onMapLostPointerCapture(), onMapPointerCancel(), onMapPointerUp(), schedulePanHoverRefresh()

### Community 36 - "Pinned Region Summaries"
Cohesion: 0.33
Nodes (6): getPinnedCapitalClaimant(), pinnedCapitalClaimants(), pinnedExpansionClaimants(), pinnedRegionCapitalSummary(), pinnedRegionOwnerSummary(), pinnedRegionRow()

### Community 37 - "Manual Envelope Model"
Cohesion: 0.40
Nodes (5): addManualEnvelopeContribution(), buildManualEnvelopeModelUncached(), compareManualEnvelopeSourceSpecs(), manualEnvelopeSourceKey(), manualEnvelopeSourceSpecs()

### Community 38 - "Search Alias Generation"
Cohesion: 0.50
Nodes (5): localizedDisplayNameValues(), nationClaimProjectSearchAliases(), nationSearchAliases(), projectSearchAliases(), uniqueSearchTerms()

### Community 39 - "Nation Search Dropdown"
Cohesion: 0.40
Nodes (5): matchingNationChoices(), openNationDropdown(), renderNationDropdown(), setDropdownExpanded(), visibleNationChoices()

### Community 40 - "Capital Marker Text"
Cohesion: 0.50
Nodes (4): addCapitalMarkerNation(), capitalRegionNames(), capitalRegionNamesForNation(), capitalRegionsText()

### Community 41 - "Reachable Capital Logic"
Cohesion: 0.50
Nodes (4): isReachableCapitalCandidateNation(), nationBaseRegionNames(), nationFullyIncludedInResult(), nationResultRegionNames()

### Community 42 - "Tooltip Positioning"
Cohesion: 0.67
Nodes (3): applyTooltipPosition(), measureTooltipSize(), svgWrapRect()

### Community 43 - "Search Selection Parsing"
Cohesion: 0.67
Nodes (3): isSelectedNationSearch(), parseNationSearchValue(), searchFilterText()

### Community 44 - "HTML Asset Wiring"
Cohesion: 0.67
Nodes (3): assets/app.js, assets/styles.css, Index HTML

### Community 45 - "Sidebar Sections"
Cohesion: 0.67
Nodes (3): Expansion Nodes, Explore and Select, Selected Region

## Knowledge Gaps
- **55 isolated node(s):** `name`, `version`, `private`, `type`, `build` (+50 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createDebugRenderStats()` connect `Render Stats Measurement` to `App Render Helpers`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `sanitize_data_value()` connect `Catalog Build Pipeline` to `Pages Build Tool`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Build Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.09134615384615384 - nodes in this community are weakly interconnected._
- **Should `Active Data Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.08361581920903954 - nodes in this community are weakly interconnected._
- **Should `Claim Data UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08097165991902834 - nodes in this community are weakly interconnected._
- **Should `SVG Overlay Rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.1166429587482219 - nodes in this community are weakly interconnected._