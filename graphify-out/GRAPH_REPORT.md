# Graph Report - /home/fennexfox/Terra Invicta/TI_Interactive_Worldmap  (2026-10-04)

## Corpus Check
- 130 files · ~82,476 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 987 nodes · 2169 edges · 57 communities (38 shown, 19 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 108 edges (avg confidence: 0.81)
- Token cost: unavailable (host semantic extraction does not expose measured usage)

## Graph Freshness
- Built from commit: `b2d630f7`
- Includes the current working-tree documentation updates; manifest hashes are the freshness baseline.
- Run `graphify update .` after source changes; document changes also require semantic extraction.

## Community Hubs (Navigation)
- Claim overlay rendering
- Region geometry catalogs
- Map state and indices
- Browser regression coverage
- Interaction frame measurements
- Scenario bundles and Pages
- Claim extraction contracts
- Generated output verification
- World wrap and refresh
- Architecture and performance guidance
- Rebuild and publishing workflow
- Map input interactions
- Nation catalog localization
- Package scripts and dependencies
- Catalog builder coverage
- Claim presentation caching
- WSL build environment
- Search computation measurements
- UI shell and localization
- Claim projection models
- Map rendering test doubles
- Startup and loading UI
- Output verification tests
- Claim selection and formatting
- Scenario data resolution
- Nation search catalog
- Search dropdown interactions
- Map output panels
- Map presentation lifecycle
- Unity geometry extraction
- UI element test doubles
- Selection refresh coordination
- Publishing regression tests
- Nation information panels
- Runtime composition and API
- Debug runtime instrumentation
- Scenario generation coverage
- DLC source loading coverage
- Build manifest coverage
- Render node test doubles
- Pages packaging coverage
- Game data licensing
- Wheel burst measurements
- ESLint browser globals
- MIT license terms
- Playwright CI setup
- Continuous integration workflow
- Python lint dependency
- Unity extraction dependency
- Standard library build tools
- Application shell markup
- Research claim semantics
- SVG map layers

## God Nodes (most connected - your core abstractions)
1. `normalizeWorldCopyContexts()` - 23 edges
2. `build_catalog()` - 22 edges
3. `load_required_json()` - 19 edges
4. `CatalogBuilderTests` - 17 edges
5. `createSvgElement()` - 16 edges
6. `replaceLayerChildren()` - 16 edges
7. `main()` - 16 edges
8. `write_json()` - 15 edges
9. `scripts` - 14 edges
10. `appendWorldCopyFragment()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Generated artifact review boundary` --semantically_similar_to--> `Generated build and staging contract`  [INFERRED] [semantically similar]
  AGENTS.md → dev-docs/architecture.md
- `Browser module boundaries` --semantically_similar_to--> `State, data, and rendering separation`  [INFERRED] [semantically similar]
  AGENTS.md → dev-docs/architecture.md
- `Local game-data rebuild requirements` --semantically_similar_to--> `Generated build and staging contract`  [INFERRED] [semantically similar]
  README.md → dev-docs/architecture.md
- `Durable documentation versus temporary plans` --conceptually_related_to--> `Project README`  [INFERRED]
  dev-docs/README.md → README.md
- `generatedClaimModel()` --calls--> `createClaimModel()`  [EXTRACTED]
  tests/unit/state-data-boundaries.test.js → src/data/claim-model.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Reusable checks shared by CI and Pages** — workflows_checks_reusable_checks, workflows_ci_checks, workflows_pages_checks [EXTRACTED 1.00]

## Communities (57 total, 19 thin omitted)

### Community 0 - "Claim overlay rendering"
Cohesion: 0.07
Nodes (67): clearBufferedLayer(), copyContextRenderKey(), createClaimHatchPattern(), createClaimLabelFragment(), createClaimOverlayPathFragment(), createOverlayBufferGroup(), createProjectedCopyFragment(), formatHatchNumber() (+59 more)

### Community 1 - "Region geometry catalogs"
Cohesion: 0.08
Nodes (66): assign_nation_color_indexes(), build_nation_adjacency(), canonical_map_region_name(), compact_region_geometry(), compact_region_outlines(), load_json(), load_nation_display_names(), load_nation_display_overrides() (+58 more)

### Community 2 - "Map state and indices"
Cohesion: 0.10
Nodes (49): buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory(), normalizeId(), overlayResultSetContains(), resolveSecondaryCapitalPreview(), changedRegionIds(), clearPinnedRegions() (+41 more)

### Community 3 - "Browser regression coverage"
Cohesion: 0.09
Nodes (36): dragMap(), inspectMarkerContrast(), selectFourCapitalChain(), EXPECTED_BURST_VIEW_BOX, SEAM_CANDIDATES, blankMapPoint(), chooseNation(), clearMap() (+28 more)

### Community 4 - "Interaction frame measurements"
Cohesion: 0.07
Nodes (38): installRafCollector(), measureFrameIntervals(), parseWorldWrapArg(), percentile(), poolIntervalSummaries(), summarizeIntervals(), captureInteractionProbes(), captureInteractionStats() (+30 more)

### Community 5 - "Scenario bundles and Pages"
Cohesion: 0.09
Nodes (43): assemble_runtime_bundle(), build_pages(), default_scenario_bundle(), deterministic_gzip(), encode_runtime_bundle(), load_json(), load_pages_inputs(), main() (+35 more)

### Community 6 - "Claim extraction contracts"
Cohesion: 0.12
Nodes (38): PythonContractTests, BreakawayRow, build_breakaway_index(), build_claim_data(), build_claim_stats(), build_nation_profiles(), build_project_claim_metadata(), catalog_nation_metadata() (+30 more)

### Community 7 - "Generated output verification"
Cohesion: 0.12
Nodes (40): RuntimeError, browser_source_mappings(), deployment_source_mappings(), expected_browser_deployment_files(), expected_scenario_generated_files(), Path, Return every browser JS source and its Pages destination., Return the complete source-to-Pages static asset manifest. (+32 more)

### Community 8 - "World wrap and refresh"
Cohesion: 0.10
Nodes (27): createMapViewController(), createWorldCopyContexts(), shouldEnableWorldWrap(), worldCopyContextsRenderKey(), defaultWorldCopyContext(), createLanguageRefreshActions(), createScenarioRefreshActions(), requireAction() (+19 more)

### Community 9 - "Architecture and performance guidance"
Cohesion: 0.08
Nodes (39): Browser module boundaries, Repository agent guidance, Documentation-only validation rule, Generated artifact review boundary, Source directory ownership, Working architecture map, Working architecture map role, Claim source IDs, canonical keys, and display labels (+31 more)

### Community 10 - "Rebuild and publishing workflow"
Cohesion: 0.17
Nodes (27): CompletedProcess, build_pages(), build_scenario_outputs(), copy_default_scenario_outputs(), current_branch(), default_templates_dir(), first_existing(), generated_paths_changed() (+19 more)

### Community 11 - "Map input interactions"
Cohesion: 0.09
Nodes (9): createMapInteractionController(), WHEEL_LISTENER_OPTIONS, createMapPanController(), createTooltipController(), createFakeWindow(), createHarness(), FakeClassList, FakeEventTarget (+1 more)

### Community 12 - "Nation catalog localization"
Cohesion: 0.20
Nodes (25): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), display_name_values(), display_names_equal(), distinct_display_name(), initial_regions_by_nation(), load_nation_display_overrides() (+17 more)

### Community 13 - "Package scripts and dependencies"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, @playwright/test, license, name, private, scripts, build (+14 more)

### Community 14 - "Catalog builder coverage"
Cohesion: 0.26
Nodes (5): CatalogBuilderTests, Path, write_json(), write_region_owner_fixture(), write_text()

### Community 15 - "Claim presentation caching"
Cohesion: 0.13
Nodes (10): BASE_TERRITORY_COLOR, CLAIM_TIER_COLORS, claimGradientColor(), claimGradientHue(), EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE, HOVER_NATION_TIER_OPACITIES, projectColor(), buildClaimLabelDescriptors() (+2 more)

### Community 16 - "WSL build environment"
Cohesion: 0.25
Nodes (16): build-wsl.sh script, bootstrap_node(), bootstrap_python(), die(), discover_region_outlines(), discover_templates_dir(), ensure_python_command(), first_existing() (+8 more)

### Community 17 - "Search computation measurements"
Cohesion: 0.12
Nodes (14): catalog, claimsByNation, controller, controllerSearch, counters, limits, nationMeta, operationCounts (+6 more)

### Community 18 - "UI shell and localization"
Cohesion: 0.18
Nodes (11): createAppShellController(), queryElements(), createAsideCardController(), applyStaticTranslations(), bindAppControls(), updateReachableCapitalsButton(), createI18n(), I18N (+3 more)

### Community 19 - "Claim projection models"
Cohesion: 0.20
Nodes (8): createClaimCumulativeModel(), createClaimIncomingOverlayModel(), createClaimManualEnvelopeModel(), createClaimModel(), defaultSourceLabels(), createClaimProjectGraph(), generatedClaimModel(), sampleClaimModelFixture()

### Community 20 - "Map rendering test doubles"
Cohesion: 0.15
Nodes (7): createMapSceneRenderer(), baseColorFixture(), canonicalCopies(), FakeClassList, FakeDocument, FakeDocumentFragment, statRecorder()

### Community 21 - "Startup and loading UI"
Cohesion: 0.14
Nodes (6): loadingScreen, renderScenarioOptions(), createLoadingScreen(), LOADING_FAILURE_MESSAGES, FakeDropdown, FakeSelect

### Community 23 - "Claim selection and formatting"
Cohesion: 0.22
Nodes (12): createClaimPresentationService(), createClaimOverlayRenderer(), createManualEnvelopeRenderer(), manualEnvelopeHostileContribution(), createMapMarkerRenderer(), createClaimSelectionRuntime(), BASE_TERRITORY_COLOR, CLAIM_TIER_COLORS (+4 more)

### Community 24 - "Scenario data resolution"
Cohesion: 0.33
Nodes (8): createAppData(), getActiveData(), getScenarioChoices(), getScenarioIds(), normalizeScenarioEntry(), scenarioIdFromEntry(), createScenarioContext(), createScenarioRuntime()

### Community 25 - "Nation search catalog"
Cohesion: 0.27
Nodes (8): buildSearchCatalog(), filterSearchCatalog(), localizedValues(), nationProjectAliases(), nationSearchAliases(), parseNationSearchValue(), projectSearchAliases(), uniqueSearchTerms()

### Community 26 - "Search dropdown interactions"
Cohesion: 0.33
Nodes (8): bindNationSearchControl(), escapeHtml(), renderNationDropdown(), renderSearchResults(), setSearchDropdownExpanded(), updateNationDropdownHighlight(), createSearchController(), EMPTY_CATALOG

### Community 27 - "Map output panels"
Cohesion: 0.38
Nodes (7): createMapOutputController(), escapeHtml(), pinnedRegionRow(), reachableCandidateRow(), renderPinnedRegionsPanel(), renderReachableCapitalCandidatesPanel(), createHarness()

### Community 28 - "Map presentation lifecycle"
Cohesion: 0.31
Nodes (7): copyContextRenderKey(), createMapPresentationController(), hoverClaimPreviewRenderKey(), MARKER_KINDS, createHarness(), createLayer(), createRendererDouble()

### Community 29 - "Unity geometry extraction"
Cohesion: 0.36
Nodes (9): extract_with_unitypy(), main(), _normalize_region_collection(), parse_args(), _plain(), Any, Namespace, Path (+1 more)

### Community 31 - "Selection refresh coordination"
Cohesion: 0.33
Nodes (4): createAppStateAdapter(), createSelectionCoordinator(), createDouble(), createHarness()

### Community 33 - "Nation information panels"
Cohesion: 0.36
Nodes (5): createNationInfoPanelController(), createNationOverlayController(), escapeHtml(), renderClaimSection(), renderPanelHtml()

### Community 34 - "Runtime composition and API"
Cohesion: 0.43
Nodes (5): createAppRuntime(), installBrowserApi(), createRefreshCoordinator(), createUiRuntimeBindings(), createPresentationFormatters()

### Community 35 - "Debug runtime instrumentation"
Cohesion: 0.39
Nodes (6): createDebugRuntime(), parseDebugFlags(), RENDER_STAT_KEYS, safeParams(), safeStorageValue(), toggleValue()

### Community 41 - "Game data licensing"
Cohesion: 0.67
Nodes (3): Not Covered by MIT, Terra Invicta Data License Scope, Terms and Ownership

## Knowledge Gaps
- **87 isolated node(s):** `runtimeGlobals`, `name`, `version`, `private`, `license` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `strip_scenario_prefix()` connect `Scenario bundles and Pages` to `Region geometry catalogs`, `Nation catalog localization`, `Claim extraction contracts`, `Generated output verification`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `verify_scenario_entry()` connect `Generated output verification` to `Scenario bundles and Pages`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `prepare_scenario_templates()` connect `Rebuild and publishing workflow` to `Scenario bundles and Pages`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `build_catalog()` (e.g. with `source_fingerprint()` and `unique_strings()`) actually correct?**
  _`build_catalog()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `load_required_json()` (e.g. with `.test_required_json_rejects_non_finite_numbers()` and `.test_required_json_reports_file_and_json_location()`) actually correct?**
  _`load_required_json()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `runtimeGlobals`, `name`, `version` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Claim overlay rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.07074504442925496 - nodes in this community are weakly interconnected._
