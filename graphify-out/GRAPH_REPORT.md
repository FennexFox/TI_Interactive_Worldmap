# Graph Report - .  (2026-06-15)

## Corpus Check
- Large corpus: 60 files · ~533,653 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 661 nodes · 1686 edges · 35 communities (33 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Catalog Builders|Catalog Builders]]
- [[_COMMUNITY_Nation Overlay Interactions|Nation Overlay Interactions]]
- [[_COMMUNITY_Localization Info Panels|Localization Info Panels]]
- [[_COMMUNITY_App Event Wiring|App Event Wiring]]
- [[_COMMUNITY_SVG Map Layers|SVG Map Layers]]
- [[_COMMUNITY_Issue 32 Expansion Pins|Issue 32 Expansion Pins]]
- [[_COMMUNITY_Map View State|Map View State]]
- [[_COMMUNITY_App Interaction State|App Interaction State]]
- [[_COMMUNITY_Overlay Model Cache|Overlay Model Cache]]
- [[_COMMUNITY_WSL Build Script|WSL Build Script]]
- [[_COMMUNITY_Map Wrap Tests|Map Wrap Tests]]
- [[_COMMUNITY_Pages Rebuild Workflow|Pages Rebuild Workflow]]
- [[_COMMUNITY_Project Claim Filtering|Project Claim Filtering]]
- [[_COMMUNITY_Map Visual State|Map Visual State]]
- [[_COMMUNITY_Claim Data Builder|Claim Data Builder]]
- [[_COMMUNITY_Generated Output Verification|Generated Output Verification]]
- [[_COMMUNITY_GitHub Issue Templates|GitHub Issue Templates]]
- [[_COMMUNITY_Package Scripts|Package Scripts]]
- [[_COMMUNITY_Overlay Render Keys|Overlay Render Keys]]
- [[_COMMUNITY_Catalog Builder Tests|Catalog Builder Tests]]
- [[_COMMUNITY_Reachable Capital Candidates|Reachable Capital Candidates]]
- [[_COMMUNITY_Pages Builder|Pages Builder]]
- [[_COMMUNITY_Project README Workflow|Project README Workflow]]
- [[_COMMUNITY_UI Translation Controls|UI Translation Controls]]
- [[_COMMUNITY_Language Interaction Tests|Language Interaction Tests]]
- [[_COMMUNITY_Region Outline Extraction|Region Outline Extraction]]
- [[_COMMUNITY_Hit Layer Events|Hit Layer Events]]
- [[_COMMUNITY_Derived Data Indices|Derived Data Indices]]
- [[_COMMUNITY_Buffered Overlay Layers|Buffered Overlay Layers]]
- [[_COMMUNITY_Manual Envelope Model|Manual Envelope Model]]
- [[_COMMUNITY_Nation Dropdown|Nation Dropdown]]
- [[_COMMUNITY_Capital Region Text|Capital Region Text]]
- [[_COMMUNITY_Copilot Instructions|Copilot Instructions]]
- [[_COMMUNITY_Pull Request Template|Pull Request Template]]

## God Nodes (most connected - your core abstractions)
1. `t()` - 41 edges
2. `updateNationOverlay()` - 29 edges
3. `clearHoverPreview()` - 24 edges
4. `clearSelection()` - 23 edges
5. `renderNationInfoPanel()` - 19 edges
6. `getLockedNation()` - 18 edges
7. `updateHoveredRegion()` - 17 edges
8. `refreshLanguage()` - 17 edges
9. `recordRenderStat()` - 16 edges
10. `updateHoverNationPreview()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Expansion Nodes side card` --semantically_similar_to--> `Expansion Nodes side card`  [INFERRED] [semantically similar]
  docs/plan/issue_32/02-pinned-regions-ui.md → src/index.html
- `Pinned region markers` --semantically_similar_to--> `pinnedRegionMarkers layer`  [INFERRED] [semantically similar]
  docs/plan/issue_32/03-map-visuals-and-interactions.md → src/index.html
- `Manual recursive envelope` --semantically_similar_to--> `manualEnvelopeOverlays layer`  [INFERRED] [semantically similar]
  docs/plan/issue_32/04-manual-recursive-envelope.md → src/index.html
- `Candidate markers` --semantically_similar_to--> `reachableCapitalCandidates layer`  [INFERRED] [semantically similar]
  docs/plan/issue_32/05-reachable-capital-candidates.md → src/index.html
- `Terra Invicta Interactive Worldmap` --references--> `GitHub Pages deployment workflow`  [EXTRACTED]
  README.md → .github/workflows/pages.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Issue 32 phased implementation plan** — docs_plan_issue_32_00_master_plan, docs_plan_issue_32_01_state_model, docs_plan_issue_32_02_pinned_regions_ui, docs_plan_issue_32_03_map_visuals_and_interactions, docs_plan_issue_32_04_manual_recursive_envelope, docs_plan_issue_32_05_reachable_capital_candidates [EXTRACTED 1.00]

## Communities (35 total, 2 thin omitted)

### Community 0 - "Catalog Builders"
Cohesion: 0.07
Nodes (72): bilateral_nation_flags(), build_catalog(), derived_display_aliases(), initial_regions_by_nation(), load_nation_localizations(), load_nation_templates(), main(), norm_id() (+64 more)

### Community 1 - "Nation Overlay Interactions"
Cohesion: 0.07
Nodes (75): applyFilters(), applyMapVisualState(), applyMapVisualStateForRegions(), cancelPendingHoverPreview(), canUseSimpleHoverClearDelta(), canUseSimpleHoverVisualDelta(), chooseNationFromDropdown(), clearHoverClaimPreviewOverlay() (+67 more)

### Community 2 - "Localization Info Panels"
Cohesion: 0.07
Nodes (61): bindPinnedRegionsPanelEvents(), buildIncomingClaimIndex(), buildNationChoices(), claimCardResearchLabel(), claimCardTitle(), claimCardTitleParts(), claimGroupCountText(), claimModeLabel() (+53 more)

### Community 3 - "App Event Wiring"
Cohesion: 0.05
Nodes (33): createAppData(), getActiveData(), defaultWorldCopyContext(), applyTooltipPosition(), bindNationInfoSectionToggles(), bindNationOverlayPanelEvents(), colorFor(), compareManualEnvelopeContributions() (+25 more)

### Community 4 - "SVG Map Layers"
Cohesion: 0.11
Nodes (34): appendWorldCopyFragment(), buildVisualFillGroups(), clearRegistry(), createGroupedVisualFillFragment(), createRegionPath(), createSvgElement(), datasetRenderKey(), DEFAULT_COPY_CONTEXT (+26 more)

### Community 5 - "Issue 32 Expansion Pins"
Cohesion: 0.11
Nodes (24): Support manual recursive expansion pins with reachable capital candidates, Issue #24 E3, Issue #32, Issue #35, Manual recursive expansion pins with reachable capital candidates, Phased implementation plan, Phase 01: State model, focusedRegionId (+16 more)

### Community 6 - "Map View State"
Cohesion: 0.18
Nodes (21): applyMapViewToSvg(), invalidateTooltipLayout(), mapPointFromClientPoint(), onMapWheel(), renderGrid(), resetMapView(), zoomMapAt(), clampMapViewX() (+13 more)

### Community 7 - "App Interaction State"
Cohesion: 0.21
Nodes (21): clearPinnedRegions(), clearSelectionState(), clearTransientClaimState(), createAppState(), normalizeId(), normalizeIds(), pinRegion(), setActiveIncomingClaim() (+13 more)

### Community 8 - "Overlay Model Cache"
Cohesion: 0.14
Nodes (21): buildOverlayModelCacheKey(), claimLabelDescriptorCacheKey(), claimLabelDescriptors(), claimOverlayDescriptorCacheKey(), claimOverlayPathDescriptors(), foreignHoverDescriptorCacheKey(), getCachedLruValue(), getClaimLabelDescriptorSet() (+13 more)

### Community 9 - "WSL Build Script"
Cohesion: 0.25
Nodes (16): build-wsl.sh script, bootstrap_node(), bootstrap_python(), die(), discover_region_outlines(), discover_templates_dir(), ensure_python_command(), first_existing() (+8 more)

### Community 10 - "Map Wrap Tests"
Cohesion: 0.12
Nodes (5): expectProjectedCopies(), expectProjectedRegion(), SEAM_CANDIDATES, waitForAnimationFrames(), waitForHoverPreviewFrame()

### Community 11 - "Pages Rebuild Workflow"
Cohesion: 0.29
Nodes (16): CompletedProcess, build_pages(), commit_and_push(), current_branch(), default_templates_dir(), first_existing(), generated_paths_changed(), infer_templates_dir() (+8 more)

### Community 12 - "Project Claim Filtering"
Cohesion: 0.18
Nodes (17): buildForeignHoverOverlayDescriptorSet(), buildManualEnvelopeSource(), buildNationOverlayModel(), countryProjectTierMap(), cumulativeClaimEntries(), getActiveIncomingClaimKey(), getClaimKindFilteredProjectEntries(), getProjectFilter() (+9 more)

### Community 13 - "Map Visual State"
Cohesion: 0.24
Nodes (15): applyHitPathVisualState(), applyMapVisualState(), applyMapVisualStateForRegions(), applyRegionPathVisualState(), clearOverlayVisualState(), createMapVisualState(), hitPathInstances(), regionPathInstances() (+7 more)

### Community 14 - "Claim Data Builder"
Cohesion: 0.36
Nodes (12): build_claim_data(), catalog_nation_metadata(), load_json(), main(), norm_id(), parse_args(), project_label(), project_metadata_from_research_catalog() (+4 more)

### Community 15 - "Generated Output Verification"
Cohesion: 0.36
Nodes (12): aliases(), display_name(), list_value(), load_json(), main(), number_value(), object_value(), Path (+4 more)

### Community 16 - "GitHub Issue Templates"
Cohesion: 0.23
Nodes (12): Bug report template, Issue template config, Feature request template, Feedback template, GitHub labels, bug, data, enhancement (+4 more)

### Community 17 - "Package Scripts"
Cohesion: 0.17
Nodes (11): devDependencies, @playwright/test, name, private, scripts, build, deploy, test:e2e (+3 more)

### Community 18 - "Overlay Render Keys"
Cohesion: 0.20
Nodes (12): claimLabelRenderKey(), claimOverlayPathRenderKey(), clearManualEnvelopeOverlay(), copyContextRenderKey(), hoverClaimPreviewRenderKey(), manualEnvelopeRenderKey(), pinnedRegionMarkerRenderKey(), renderManualEnvelopeOverlay() (+4 more)

### Community 19 - "Catalog Builder Tests"
Cohesion: 0.38
Nodes (4): CatalogBuilderTests, Path, write_json(), write_text()

### Community 20 - "Reachable Capital Candidates"
Cohesion: 0.24
Nodes (11): bindReachableCapitalCandidatePanelEvents(), getShowReachableCapitalCandidates(), reachableCapitalCandidateDescriptors(), reachableCapitalCandidateNations(), reachableCapitalCandidateRenderKey(), refreshReachableCapitalCandidateOutputs(), renderReachableCapitalCandidateMarkers(), renderReachableCapitalCandidatesPanel() (+3 more)

### Community 21 - "Pages Builder"
Cohesion: 0.38
Nodes (10): build_pages(), copy_js_modules(), load_json(), main(), parse_args(), Any, Namespace, Path (+2 more)

### Community 22 - "Project README Workflow"
Cohesion: 0.20
Nodes (10): GitHub Pages deployment workflow, Terra Invicta Interactive Worldmap, Build workflow, Claim / Unification Map, Local game data rebuild, Checked-in Pages site, Region outline refresh, Terra Invicta templates (+2 more)

### Community 23 - "UI Translation Controls"
Cohesion: 0.20
Nodes (10): applyStaticTranslations(), getOnlyClaims(), infoSectionOpenAttribute(), initAsideCards(), initMapViewControls(), readJsonSetting(), renderClaimSection(), updateAsideCardControls() (+2 more)

### Community 24 - "Language Interaction Tests"
Cohesion: 0.29
Nodes (6): clickRegion(), hoverRegion(), hoverRegionWithMouse(), regionTarget(), waitForAnimationFrames(), waitForHoverPreviewFrame()

### Community 25 - "Region Outline Extraction"
Cohesion: 0.36
Nodes (9): extract_with_unitypy(), main(), _normalize_region_collection(), parse_args(), _plain(), Any, Namespace, Path (+1 more)

### Community 26 - "Hit Layer Events"
Cohesion: 0.29
Nodes (8): consumeSuppressedMapClick(), onHitLayerClick(), onHitLayerPointerMove(), onHitLayerPointerOut(), onHitLayerPointerOver(), onRegionEnter(), resolveHitRegion(), resolveRelatedHitRegion()

### Community 27 - "Derived Data Indices"
Cohesion: 0.48
Nodes (6): buildCapitalNationsByRegion(), buildDerivedIndices(), hasDisplayableTerritory(), normalizeId(), overlayResultSetContains(), resolveSecondaryCapitalPreview()

### Community 28 - "Buffered Overlay Layers"
Cohesion: 0.29
Nodes (7): clearBufferedLayerChildrenForRenderKey(), clearClaimOverlayDom(), createOverlayBufferGroup(), getBufferedLayerState(), replaceBufferedLayerChildrenForRenderKey(), runAfterAnimationFrames(), setOverlayBufferActive()

### Community 29 - "Manual Envelope Model"
Cohesion: 0.33
Nodes (6): addManualEnvelopeContribution(), buildManualEnvelopeModel(), compareManualEnvelopeSourceSpecs(), countryProjectTier(), manualEnvelopeSourceKey(), manualEnvelopeSourceSpecs()

### Community 30 - "Nation Dropdown"
Cohesion: 0.40
Nodes (5): matchingNationChoices(), openNationDropdown(), renderNationDropdown(), setDropdownExpanded(), visibleNationChoices()

### Community 31 - "Capital Region Text"
Cohesion: 0.50
Nodes (4): addCapitalMarkerNation(), capitalRegionNames(), capitalRegionNamesForNation(), capitalRegionsText()

## Knowledge Gaps
- **36 isolated node(s):** `name`, `version`, `private`, `type`, `build` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zoomMapView()` connect `Map View State` to `App Event Wiring`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `sanitize_data_value()` connect `Catalog Builders` to `Pages Builder`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `applyMapVisualStateForRegions()` connect `Map Visual State` to `App Event Wiring`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Catalog Builders` be split into smaller, more focused modules?**
  _Cohesion score 0.07368421052631578 - nodes in this community are weakly interconnected._
- **Should `Nation Overlay Interactions` be split into smaller, more focused modules?**
  _Cohesion score 0.06846846846846846 - nodes in this community are weakly interconnected._
- **Should `Localization Info Panels` be split into smaller, more focused modules?**
  _Cohesion score 0.06502732240437159 - nodes in this community are weakly interconnected._