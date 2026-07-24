# Graph Report - .  (2026-07-25)

## Corpus Check
- 82 files · ~57,709 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1039 nodes · 2678 edges · 46 communities (42 shown, 4 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 303 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Catalog Build Pipeline|Catalog Build Pipeline]]
- [[_COMMUNITY_E2E Map Workflows|E2E Map Workflows]]
- [[_COMMUNITY_Pages Build Manifest|Pages Build Manifest]]
- [[_COMMUNITY_Nation Catalog Pipeline|Nation Catalog Pipeline]]
- [[_COMMUNITY_Publishing Rebuild CLI|Publishing Rebuild CLI]]
- [[_COMMUNITY_SVG Layer Rendering|SVG Layer Rendering]]
- [[_COMMUNITY_Claim Overlay State|Claim Overlay State]]
- [[_COMMUNITY_Claim Data Builder|Claim Data Builder]]
- [[_COMMUNITY_UI Refresh Localization|UI Refresh Localization]]
- [[_COMMUNITY_Render Performance Measurement|Render Performance Measurement]]
- [[_COMMUNITY_App Overlay Rendering|App Overlay Rendering]]
- [[_COMMUNITY_Generated Output Verification|Generated Output Verification]]
- [[_COMMUNITY_Search Overlay Panel|Search Overlay Panel]]
- [[_COMMUNITY_WSL Build Bootstrap|WSL Build Bootstrap]]
- [[_COMMUNITY_Hover Interaction State|Hover Interaction State]]
- [[_COMMUNITY_Map View Navigation|Map View Navigation]]
- [[_COMMUNITY_Claim Model Composition|Claim Model Composition]]
- [[_COMMUNITY_Map Interaction Composition|Map Interaction Composition]]
- [[_COMMUNITY_Map Visual State|Map Visual State]]
- [[_COMMUNITY_JavaScript Tooling Config|JavaScript Tooling Config]]
- [[_COMMUNITY_Application State Transitions|Application State Transitions]]
- [[_COMMUNITY_Catalog Builder Tests|Catalog Builder Tests]]
- [[_COMMUNITY_SVG Marker Rendering|SVG Marker Rendering]]
- [[_COMMUNITY_Capital Selection Logic|Capital Selection Logic]]
- [[_COMMUNITY_Pinned Region UI|Pinned Region UI]]
- [[_COMMUNITY_Active Data Boundaries|Active Data Boundaries]]
- [[_COMMUNITY_Scenario Derived Indices|Scenario Derived Indices]]
- [[_COMMUNITY_Scenario Runtime Orchestration|Scenario Runtime Orchestration]]
- [[_COMMUNITY_Region Selection Actions|Region Selection Actions]]
- [[_COMMUNITY_Nation Focus State|Nation Focus State]]
- [[_COMMUNITY_Scenario Bundle Builder|Scenario Bundle Builder]]
- [[_COMMUNITY_Localized Display Labels|Localized Display Labels]]
- [[_COMMUNITY_Overlay Descriptor Caching|Overlay Descriptor Caching]]
- [[_COMMUNITY_Buffered Overlay DOM|Buffered Overlay DOM]]
- [[_COMMUNITY_Render Debug Statistics|Render Debug Statistics]]
- [[_COMMUNITY_Foreign Hover Overlays|Foreign Hover Overlays]]
- [[_COMMUNITY_World Wrap Controls|World Wrap Controls]]
- [[_COMMUNITY_Pinned Capital Claims|Pinned Capital Claims]]
- [[_COMMUNITY_Tooltip Controller|Tooltip Controller]]
- [[_COMMUNITY_Game Data Licensing|Game Data Licensing]]
- [[_COMMUNITY_Hostile Claim Summaries|Hostile Claim Summaries]]
- [[_COMMUNITY_Search Filter Parsing|Search Filter Parsing]]
- [[_COMMUNITY_Nation Dropdown State|Nation Dropdown State]]
- [[_COMMUNITY_MIT License Terms|MIT License Terms]]
- [[_COMMUNITY_Playwright CI Configuration|Playwright CI Configuration]]
- [[_COMMUNITY_World Wrap Toggle Test|World Wrap Toggle Test]]

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
- `scenario_entry()` --conceptually_related_to--> `Three Build Levels`  [INFERRED]
  tools/build_scenario_bundle.py → README.md
- `build_scenario_bundle()` --implements--> `Build and Data Pipeline`  [INFERRED]
  tools/build_scenario_bundle.py → dev-docs/architecture.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Claim Model Composition** — data_claim_model_createclaimmodel, data_claim_project_graph_createclaimprojectgraph, data_claim_cumulative_model_createclaimcumulativemodel, data_claim_incoming_overlay_createclaimincomingoverlaymodel, data_claim_manual_envelope_createclaimmanualenvelopemodel [INFERRED 0.95]
- **Scenario Switch Pipeline** — data_active_data_getactivedata, src_app_applyruntimescenariodata, src_app_preparescenarioruntime, src_app_refreshscenarioview, src_app_setactivescenario [INFERRED 0.95]
- **World-Copy Render Pipeline** — src_app_rerenderworldwraplayers, render_map_layers_renderregiongeometry, render_map_layers_renderhitlayer, render_map_layers_renderlabels, render_map_layers_rendergrid, render_map_layers_creategroupedvisualfillfragment [INFERRED 0.85]
- **Active Scenario Refresh Pipeline** — runtime_scenario_runtime_createscenarioruntime, state_app_state_reconcilescenariostate, runtime_refresh_actions_createscenariorefreshactions, runtime_refresh_flow_active_scenario_refresh_steps, runtime_refresh_flow_runrefreshsteps [INFERRED 0.85]
- **Language Refresh Pipeline** — ui_i18n_createi18n, ui_controls_applystatictranslations, runtime_refresh_actions_createlanguagerefreshactions, runtime_refresh_flow_language_refresh_steps, runtime_refresh_flow_runrefreshsteps, ui_map_controls_updatemapviewcontrolslabels [INFERRED 0.85]
- **Pinned Region State Synchronization** — state_app_state_createappstate, state_app_state_pinregion, state_app_state_unpinpinnedregion, state_app_state_clearpinnedregions, state_map_visual_state_createmapvisualstate, state_map_visual_state_syncpinnedvisualstate, ui_panels_renderpinnedregionspanel, e2e_pins_spec_test_pinned_expansion_nodes_update_compact_rows_and_map_markers_through_clicks_callback [INFERRED 0.95]
- **Scenario Data and Refresh Pipeline** — tests_test_scenario_generation_scenariogenerationtests_test_scenario_bundle_records_default_and_summary_counts, unit_state_data_boundaries_test_active_data_normalizes_generated_scenario_bundle_payloads, unit_runtime_modules_test_scenario_runtime_exposes_one_immutable_context_around_derived_indices, unit_refresh_flow_test_runrefreshsteps_executes_each_named_action_once_in_order, e2e_scenarios_spec_one_scenario_transition_prepares_each_runtime_index_and_refresh_exactly_once [INFERRED 0.85]
- **World-Wrap Navigation and Projection Contract** — unit_map_view_state_test_normalizes_positive_and_negative_horizontal_offsets_by_whole_world_widths, e2e_world_wrap_spec_world_wrap_default_panning_updates_viewbox_and_keeps_horizontal_offset_bounded, e2e_world_wrap_spec_world_wrap_seam_candidates_keep_hit_selection_and_claim_overlays_projected, unit_state_data_boundaries_test_map_visual_state_applies_explicit_classes_and_bounded_updates_to_copied_region_instances, e2e_world_wrap_spec_issue_2_acceptance_selected_claim_overlays_render_on_every_visible_world_copy [INFERRED 0.85]
- **Catalog to Runtime Search Pipeline** — tools_build_nation_catalog_build_catalog, tools_build_claim_data_build_claim_data, tools_build_pages_assemble_runtime_bundle, unit_search_overlay_panel_test_localized_search_catalog_matches_nation_tags_aliases_projects_and_regions, e2e_search_spec_nation_search_uses_catalog_names_and_keeps_region_names_separate [INFERRED 0.85]
- **Scenario Catalog Build Pipeline** — tools_rebuild_pages_build_scenario_outputs, tools_build_region_outline_data_main, tools_build_research_catalog_main, tools_build_scenario_bundle_main, tools_verify_generated_outputs_verify_structure_and_replication, dev_docs_architecture_build_and_data_pipeline [EXTRACTED 1.00]
- **Scenario Ownership Authority** — tools_build_region_outline_data_load_scenario_initial_owners, tools_build_region_outline_data_load_region_metadata, tools_scenario_rows_bilateral_scenario_filtering, tools_verify_generated_outputs_verify_scenario_entry, readme_initial_owner_claim_authority [INFERRED 0.95]

## Communities (46 total, 4 thin omitted)

### Community 0 - "Catalog Build Pipeline"
Cohesion: 0.07
Nodes (73): Build and Data Pipeline, Initial-Owner Claim Authority, Ruff Development Dependency, UnityPy Geometry Dependency, Standard-Library Build and Verification, main(), assign_nation_color_indexes(), build_nation_adjacency() (+65 more)

### Community 1 - "E2E Map Workflows"
Cohesion: 0.10
Nodes (44): baseColorAudit(), canonicalRegionBaseState(), groupedClaimRegionCount(), Scenario ownership drives one consistent base fill per nation, Scenario selector switches supported start scenarios and keeps map workflows usable, Issue #2 acceptance: horizontal panning passes west and east map edges without a hard stop, Issue #2 acceptance: selected claim overlays render on every visible world copy, Issue #2 acceptance: wrapped copy hover and click resolve to the same canonical region (+36 more)

### Community 2 - "Pages Build Manifest"
Cohesion: 0.06
Nodes (30): BuildManifestTests, BuildPagesTests, RebuildPagesPublishingTests, Path, VerifyGeneratedOutputsTests, browser_source_mappings(), deployment_source_mappings(), expected_browser_deployment_files() (+22 more)

### Community 3 - "Nation Catalog Pipeline"
Cohesion: 0.08
Nodes (38): scenario_fixture(), ScenarioGenerationTests, bilateral_nation_flags(), build_catalog(), derived_display_aliases(), display_name_values(), display_names_equal(), distinct_display_name() (+30 more)

### Community 4 - "Publishing Rebuild CLI"
Cohesion: 0.09
Nodes (42): Browser App Module Boundaries, Change Rules, Generated And Derived Artifacts, Graphify And Serena Workflow, Preferred Source Paths, Subagent Policy, CompletedProcess, Region Outline Refresh Policy (+34 more)

### Community 5 - "SVG Layer Rendering"
Cohesion: 0.09
Nodes (38): overlay model cache reuses unchanged inputs and misses changed filters, Frame-Coalesced Map Pan, appendWorldCopyFragment(), buildVisualFillGroups(), clearRegistry(), createGroupedVisualFillFragment(), createRegionHitUse(), datasetRenderKey() (+30 more)

### Community 6 - "Claim Overlay State"
Cohesion: 0.08
Nodes (44): activeClaimPreviewContainsRegion(), activeClaimPreviewRegionSet(), activeClaimPreviewScopeCacheKey(), addRegionNamesToSet(), buildManualEnvelopeModel(), buildManualEnvelopeModelUncached(), buildOverlayModelCacheKey(), capitalRegionNames() (+36 more)

### Community 7 - "Claim Data Builder"
Cohesion: 0.13
Nodes (37): PythonContractTests, BreakawayRow, build_breakaway_index(), build_claim_data(), build_claim_stats(), build_nation_profiles(), build_project_claim_metadata(), catalog_nation_metadata() (+29 more)

### Community 8 - "UI Refresh Localization"
Cohesion: 0.07
Nodes (30): overlay render skip keys avoid unchanged DOM replacement, language selector switches static and dynamic UI copy, sidebar falls back when persisted settings have unexpected JSON types, claim cards show localized project flavor text from catalog metadata, app runtime scenario API rebuilds active scenario context without stale map data, createLanguageRefreshActions(), createScenarioRefreshActions(), requireAction() (+22 more)

### Community 9 - "Render Performance Measurement"
Cohesion: 0.09
Nodes (33): Browser Runtime Flow, State, Data, Render, and UI Separation, Performance-Sensitive Map Areas, Claim / Unification Map, Claim / Unification Map Application Shell, Research Grants Claims, Not Immediate Actions, SVG Map Layer Stack, captureInteractionProbes() (+25 more)

### Community 10 - "App Overlay Rendering"
Cohesion: 0.10
Nodes (35): replaceLayerChildren(), applyFilters(), applyMapVisualState(), buildNationOverlayModel(), claimLabelRenderKey(), claimOverlayPathRenderKey(), clearHoverClaimPreviewOverlay(), clearManualEnvelopeOverlay() (+27 more)

### Community 11 - "Generated Output Verification"
Cohesion: 0.16
Nodes (32): Plan Document Lifecycle, Generated Pages Output Boundary, RuntimeError, aliases(), collect_all_diagnostics(), collect_dataset_sentinel_diagnostics(), collect_deployment_diagnostics(), collect_javascript_syntax_diagnostics() (+24 more)

### Community 12 - "Search Overlay Panel"
Cohesion: 0.11
Nodes (24): buildClaimLabelDescriptors(), buildClaimOverlayDescriptors(), Claim Visual Descriptors, buildSearchCatalog(), filterSearchCatalog(), Localized Alias Search, localizedValues(), nationProjectAliases() (+16 more)

### Community 13 - "WSL Build Bootstrap"
Cohesion: 0.13
Nodes (26): Generated Artifact Ignores, runtimeGlobals, Strict JavaScript Rules, build-wsl.sh script, Build Pipeline, End-to-End Testing, Verification Pipeline, Playwright E2E Runtime (+18 more)

### Community 14 - "Hover Interaction State"
Cohesion: 0.12
Nodes (29): applyMapVisualStateForRegions(), cancelPendingHoverPreview(), canUseSimpleHoverClearDelta(), canUseSimpleHoverVisualDelta(), clearHoverPreview(), getCurrentNation(), getHoveredRegionName(), getHoverNation() (+21 more)

### Community 15 - "Map View Navigation"
Cohesion: 0.15
Nodes (25): map pan after multiple reachable capital pins avoids hover and marker churn during drag, zoomed plain map pan records counters without grid rebuilds, world-wrap default renders base, grid, label, and hit copies, World-wrap panning is disabled through the fallback query flag, applyMapViewToSvg(), invalidateTooltipLayout(), mapPointFromClientPoint(), onMapWheel() (+17 more)

### Community 16 - "Claim Model Composition"
Cohesion: 0.11
Nodes (19): Claim With Effective Hostility, createClaimCumulativeModel(), Cumulative Claim Entry, Effective Hostility Propagation, Project Claim Inheritance, Build Incoming Claim Index, Build Nation Overlay Model, createClaimIncomingOverlayModel() (+11 more)

### Community 17 - "Map Interaction Composition"
Cohesion: 0.08
Nodes (7): createMapPanController(), appLoading, appLoadingDetail, colorFor(), foreignHoverVisualDescriptors(), hashHue(), secondaryCapitalFillOpacity()

### Community 18 - "Map Visual State"
Cohesion: 0.17
Nodes (21): pre-drag click hold still allows hit-layer hover updates, claim grouped fills preserve per-region semantic outline paths, project-specific hostile claims render hatch and follow claim kind filters, single-copy grouped base fills preserve region-specific hit paths and filtering, world-wrap default applies search filtering to every copy without duplicating canonical state, world-wrap default resolves copied hit paths to canonical region state, Base mode changes preserve region, hit, and label node identity, applyHitPathVisualState() (+13 more)

### Community 19 - "JavaScript Tooling Config"
Cohesion: 0.09
Nodes (21): devDependencies, eslint, @playwright/test, license, name, private, scripts, build (+13 more)

### Community 20 - "Application State Transitions"
Cohesion: 0.25
Nodes (19): empty map clicks clear pinned regions and selection together, clearPinnedRegions(), clearSelectionState(), clearTransientClaimState(), normalizeId(), normalizeIds(), reconcileScenarioState(), setActiveIncomingClaim() (+11 more)

### Community 21 - "Catalog Builder Tests"
Cohesion: 0.29
Nodes (5): CatalogBuilderTests, Path, write_json(), write_region_owner_fixture(), write_text()

### Community 22 - "SVG Marker Rendering"
Cohesion: 0.15
Nodes (20): createRegionPath(), createSvgElement(), worldCopyDataset(), appendCapitalMarkerGroup(), appendPinnedRegionMarker(), appendReachableCapitalCandidateMarker(), appendRegionHighlight(), appendSelectedRegionMarker() (+12 more)

### Community 23 - "Capital Selection Logic"
Cohesion: 0.19
Nodes (20): activeIncomingClaimKeysForState(), addCapitalMarkerNation(), buildActiveExpansionScope(), capitalRegionNamesForNation(), collectCapitalMarkers(), getActiveNation(), getFocusedRegionName(), getLockedNation() (+12 more)

### Community 24 - "Pinned Region UI"
Cohesion: 0.16
Nodes (18): simple selected-overlay claim hover movement uses bounded visual updates, reachable capitals omit nations fully included in the selected regions claims, pinned expansion nodes update compact rows and map markers through clicks, reachable capital activation requires the claimant capital to match the displayed region, reachable capital button shows capital markers that pin without plus buttons, toggleReachableCapitalCandidatesState(), updateReachableCapitalsButtonState(), createAppState() (+10 more)

### Community 25 - "Active Data Boundaries"
Cohesion: 0.21
Nodes (13): createAppData(), getActiveData(), getScenarioIds(), normalizeScenarioEntry(), Scenario Catalog, scenarioIdFromEntry(), createMapVisualState(), Active data normalizes generated scenario bundle payloads (+5 more)

### Community 26 - "Scenario Derived Indices"
Cohesion: 0.18
Nodes (15): Build Manual Envelope Model Data, Recursive Capital Expansion, buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory(), normalizeId(), overlayResultSetContains(), resolveSecondaryCapitalPreview() (+7 more)

### Community 27 - "Scenario Runtime Orchestration"
Cohesion: 0.15
Nodes (17): activeScenario(), activeScenarioId(), applyRuntimeScenarioData(), availableRuntimeNationIds(), buildIncomingClaimIndex(), clearScenarioSensitiveCaches(), prepareScenarioRuntime(), reconcileStateForActiveScenario() (+9 more)

### Community 28 - "Region Selection Actions"
Cohesion: 0.26
Nodes (15): changedRegionIds(), commitReachableCapitalSelection(), consumeSuppressedMapClick(), focusPinnedRegion(), focusRegions(), onHitLayerClick(), pinRegionState(), selectActiveNationCapitalRegion() (+7 more)

### Community 29 - "Nation Focus State"
Cohesion: 0.29
Nodes (15): chooseNationFromDropdown(), clearPinsOrSelection(), clearSelection(), closeNationDropdown(), focusNation(), handleNationInfoClaimSelected(), humanizeNationLabel(), resetHoverPreviewClaimState() (+7 more)

### Community 30 - "Scenario Bundle Builder"
Cohesion: 0.34
Nodes (14): build_scenario_bundle(), list_value(), load_json(), load_scenario_outputs(), main(), number_value(), object_value(), parse_args() (+6 more)

### Community 31 - "Localized Display Labels"
Cohesion: 0.19
Nodes (13): claimCardResearchLabel(), claimCardTitle(), claimCardTitleParts(), localizedDisplayName(), manualEnvelopeKindLabel(), manualEnvelopeRegionLabel(), manualEnvelopeSourceLabel(), nationDisplayName() (+5 more)

### Community 32 - "Overlay Descriptor Caching"
Cohesion: 0.29
Nodes (7): claimLabelDescriptorCacheKey(), claimLabelDescriptors(), claimOverlayDescriptorCacheKey(), claimOverlayPathDescriptors(), getClaimLabelDescriptorSet(), getClaimOverlayDescriptorSet(), overlayModelRenderDataKey()

### Community 33 - "Buffered Overlay DOM"
Cohesion: 0.29
Nodes (7): clearBufferedLayerChildrenForRenderKey(), clearClaimOverlayDom(), createOverlayBufferGroup(), getBufferedLayerState(), replaceBufferedLayerChildrenForRenderKey(), runAfterAnimationFrames(), setOverlayBufferActive()

### Community 34 - "Render Debug Statistics"
Cohesion: 0.33
Nodes (6): collectRegionGeometryStats(), labelsEnabledForRender(), recordLabelRenderResult(), renderLabels(), sampleDebugSvgLayerCounts(), samplePanSvgNodeCount()

### Community 35 - "Foreign Hover Overlays"
Cohesion: 0.40
Nodes (5): buildForeignHoverOverlayDescriptorSet(), foreignHoverDescriptorCacheKey(), getForeignHoverOverlayDescriptorSet(), hoverNationProjectOpacity(), queueForeignHoverDescriptor()

### Community 36 - "World Wrap Controls"
Cohesion: 0.50
Nodes (4): defaultWorldCopyContext(), createWorldCopyContexts(), setWorldWrapEnabled(), updateMapViewControlsLabels()

### Community 37 - "Pinned Capital Claims"
Cohesion: 0.50
Nodes (4): getPinnedCapitalClaimant(), pinnedCapitalClaimants(), pinnedExpansionClaimants(), pinnedRegionCapitalSummary()

### Community 39 - "Game Data Licensing"
Cohesion: 0.67
Nodes (3): Not Covered by MIT, Terra Invicta Data License Scope, Terms and Ownership

### Community 40 - "Hostile Claim Summaries"
Cohesion: 0.67
Nodes (3): claimIsEffectivelyHostile(), claimRegionSummary(), manualEnvelopeHostileContribution()

### Community 41 - "Search Filter Parsing"
Cohesion: 0.67
Nodes (3): isSelectedNationSearch(), parseNationSearchValue(), searchFilterText()

### Community 42 - "Nation Dropdown State"
Cohesion: 0.67
Nodes (3): openNationDropdown(), renderNationDropdown(), visibleNationChoices()

## Knowledge Gaps
- **68 isolated node(s):** `name`, `version`, `private`, `license`, `type` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build_catalog()` connect `Nation Catalog Pipeline` to `Catalog Build Pipeline`, `Pages Build Manifest`, `Catalog Builder Tests`, `Claim Data Builder`?**
  _High betweenness centrality (0.268) - this node is a cross-community bridge._
- **Why does `Localized search catalog matches nation tags, aliases, projects, and regions` connect `Search Overlay Panel` to `Catalog Builder Tests`?**
  _High betweenness centrality (0.256) - this node is a cross-community bridge._
- **Why does `Active data normalizes generated scenario bundle payloads` connect `Active Data Boundaries` to `E2E Map Workflows`, `Pages Build Manifest`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `build_catalog()` (e.g. with `.test_localization_projections_keep_distinct_fallback_rules()` and `build_claim_data()`) actually correct?**
  _`build_catalog()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Build Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.06982456140350878 - nodes in this community are weakly interconnected._
- **Should `E2E Map Workflows` be split into smaller, more focused modules?**
  _Cohesion score 0.10087719298245613 - nodes in this community are weakly interconnected._