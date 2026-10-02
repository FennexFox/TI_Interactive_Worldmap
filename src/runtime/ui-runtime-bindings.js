// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {claimIsEffectivelyHostile} from '../ui/presentation-formatters.js';

export function createUiRuntimeBindings({
  appShell, filterControls, stateAdapter, selectionCoordinator, claimModel,
  mapOutputController, mapSceneRenderer, mapInteractionController,
  i18n, presentationFormatters, recordRenderStat, getSnapshot,
}) {
  const {searchController, nationOverlayController} = appShell;
  const selectedRegionIds = stateAdapter.selectedRegionIds;
  const {getActiveIncomingClaimKey, getHoverNation, getProjectFilter,
    setActiveIncomingClaimKeyState, setLockedNationState, setHoverNationState,
    setProjectFilterState, setFocusedRegionState} = stateAdapter;
  const {updateNationOverlay, focusNation,
    focusRegions, pinRegionState, selectRegion} = selectionCoordinator;
  const {capitalRegionsText, updateSelectedRegions} = mapOutputController;
  const {t, claimTierCountShortText, uniqueRegionCountText, regionCountText,
    claimGroupCountText} = i18n;
  const {humanizeNationLabel, localizedRegionName, prettyRegion, nationDisplayName,
    statusLabel, claimCardTitleParts, projectSummary, projectDisplay} = presentationFormatters;
  const {nationClaimTierCount, incomingTargetRegions, sortedProjectEntries,
    cumulativeClaimEntries, incomingClaimKey, outgoingClaimKey} = claimModel;
  const {infoSectionOpenAttribute, bindNationInfoSectionToggles} = appShell.asideCards;
  const setClaimsPillEmpty = appShell.setClaimsPillEmpty;
  const setHoverPill = appShell.setHoverPill;
  const updateReachableCapitalsButtonState = appShell.updateReachableCapitalsButtonState;
  const hideRegionTooltip = mapInteractionController.hideTooltip;
  const showRegionTooltip = (event, region) => mapInteractionController.showTooltip(
    event, region.id, `${localizedRegionName(region)} (${nationDisplayName(region.nationTag)})`
  );
  const setHiddenVisualState = mapSceneRenderer.setHidden;
  const applyMapVisualState = mapSceneRenderer.apply;
  const syncNormalRegionColorVisibility = mapSceneRenderer.renderBaseColors;
  function rebuildSearchCatalog() {
    searchController.setContext({
      regions: getSnapshot().regions,
      claimsByNation: getSnapshot().claimsByNation,
      nationMeta: getSnapshot().nationMeta,
      projectMeta: getSnapshot().projectMeta,
      nationLabel: humanizeNationLabel,
      localizedRegionName,
      prettyRegionName: prettyRegion,
    });
    searchController.rebuildCatalog();
  }

  function claimRegionSummary(claim) {
    if (!claim || !Object.keys(claim).length) return '';
    const parts = [];
    parts.push(claimIsEffectivelyHostile(claim) ? t('claim.hostile') : t('claim.peaceful'));
    if (claim?.capitalClaim) parts.push(t('claim.capital'));
    if (claim?.gatedClaim) parts.push(t('claim.gated'));
    return parts.join(' · ');
  }
  selectionCoordinator.setContext({
    outputs: {
      renderClaimPill: model => nationOverlayController.renderClaimPill(model),
      clearClaimPill: setClaimsPillEmpty,
      renderNationDetails: model => nationOverlayController.render(model, {renderPill: false}),
      clearNationDetails: () => nationOverlayController.clear(t('nationInfo.empty')),
      renderProjectOptions: nation => nationOverlayController.renderProjectOptions(nation),
      applyFilters: searchController.applyFilters,
      setSearchNation: nation => {
        searchController.setSelectedNation(nation);
      },
      clearSearchSelection: () => searchController.setSelectedNation(''),
      closeNationDropdown: searchController.close,
      resetClaimControls: () => {
        filterControls.setProject('');
        if (filterControls.getClaimMode() === 'project') {
          filterControls.setClaimMode('all');
        }
      },
      updateReachableCapitalsButton: updateReachableCapitalsButtonState,
      setHoverPill,
      showRegionTooltip,
      hideRegionTooltip,
      scheduleHoverPreview: nation => mapInteractionController.scheduleHoverPreview(nation),
      cancelHoverPreview: () => mapInteractionController.cancelHoverPreview(),
    },
  });
  function handleNationInfoClaimSelected({kind, source, model}) {
    if (kind === 'incoming') {
      const claimant = source.claimant || '';
      if (!claimant) return;
      setActiveIncomingClaimKeyState('');
      setLockedNationState(claimant);
      setHoverNationState();
      setProjectFilterState(outgoingClaimKey(source));
      filterControls.setClaimMode('project');
      filterControls.setProject(source.project || '');
      searchController.setSelectedNation(claimant);
      searchController.close();
      updateNationOverlay(claimant);
      return;
    }
    const key = outgoingClaimKey(source);
    setActiveIncomingClaimKeyState('');
    setProjectFilterState(
      filterControls.getClaimMode() === 'project' && getProjectFilter() === key ? '' : key
    );
    filterControls.setClaimMode(getProjectFilter() ? 'project' : 'all');
    filterControls.setProject(
      getProjectFilter() && getProjectFilter() !== '__base__' ? getProjectFilter() : ''
    );
    updateNationOverlay(model.nation);
    updateSelectedRegions();
  }
  nationOverlayController.setContext({
    t,
    getModel: () => selectionCoordinator.currentOverlayModel,
    bindSections: bindNationInfoSectionToggles,
    infoSectionOpenAttribute,
    nationDisplayName,
    nationTierText: nation => claimTierCountShortText(nationClaimTierCount(nation)),
    statusLabel,
    basicRows: model => [
      [t('nationInfo.kv.capitalRegion'), capitalRegionsText(model.data)],
      [t('nationInfo.kv.directClaims'), uniqueRegionCountText(model.data.totalClaimRegions || 0)],
      [t('nationInfo.kv.targetedRegions'), `${regionCountText(incomingTargetRegions(model.data, model.baseSet).size)} · ${claimGroupCountText(model.incomingEntries.length)}`],
      [t('nationInfo.kv.conditional'), regionCountText(model.gatedCount)],
    ],
    claimMode: filterControls.getClaimMode,
    projectFilter: getProjectFilter,
    projectOptionValue: () => {
      const project = getProjectFilter();
      return project && project !== '__base__' ? project : '';
    },
    activeIncomingClaimKey: getActiveIncomingClaimKey,
    claimIsEffectivelyHostile,
    claimCardTitleParts,
    projectSummary,
    claimKey: (entry, kind) => kind === 'incoming' ? incomingClaimKey(entry) : outgoingClaimKey(entry),
    prettyRegionName: localizedRegionName,
    regionCountText,
    regionPresentation: ({regionName, claim, prefix, source}) => {
      const meta = claimRegionSummary(claim);
      const region = getSnapshot().regionByName[regionName];
      const owner = region?.nationTag ? ` · ${region.nationTag}` : '';
      return {
        active: selectedRegionIds.has(regionName),
        name: localizedRegionName(region || regionName),
        detail: t('regionList.detail', {
          prefix: t(`regionPrefix.${prefix}`) || prefix,
          owner,
          meta: meta ? ` · ${meta}` : '',
          source: source ? ` · ${source}` : '',
        }),
      };
    },
    projectEntries: nation => {
      const data = getSnapshot().claimsByNation[nation];
      const directEntries = data
        ? sortedProjectEntries((data.projects || []).filter(entry => entry.project))
        : [];
      return cumulativeClaimEntries(directEntries);
    },
    projectDisplay,
    onClaimSelected: handleNationInfoClaimSelected,
    onRegionSelected: ({regionName}) => {
      if (!regionName) return;
      focusRegions([regionName], {selectSingle: true, preserveNation: true, refreshOverlay: true});
      pinRegionState(regionName);
    },
  });
  searchController.setContext({
    t,
    nationLabel: humanizeNationLabel,
    localizedRegionName,
    prettyRegionName: prettyRegion,
    getSelectedRegionIds: () => selectedRegionIds,
    getSearchRegions: mapSceneRenderer.getCanonicalRegions,
    onCatalogBuilt: catalog => {
      getSnapshot().indices.nationChoices = catalog.nationChoices;
      getSnapshot().indices.regionChoices = catalog.regionChoices;
      recordRenderStat('searchCatalogBuilds');
    },
    onSelectedNationCleared: () => {
      searchController.setSelectedNation('', {updateValue: false});
      setLockedNationState();
      stateAdapter.setSelectedRegionIds();
      setFocusedRegionState();
      stateAdapter.clearTransientClaim();
      filterControls.setProject('');
      if (filterControls.getClaimMode() === 'project') filterControls.setClaimMode('all');
      updateNationOverlay(getHoverNation() || '');
    },
    onNationSelected: focusNation,
    onRegionSelected: index => selectRegion(getSnapshot().regions[index]),
    onRegionVisibilityChange: ({hiddenRegionIds, visibleRegionIds, renderBaseColors}) => {
      setHiddenVisualState(hiddenRegionIds);
      applyMapVisualState();
      if (renderBaseColors) syncNormalRegionColorVisibility();
      mapSceneRenderer.setLabelRegionVisibility(visibleRegionIds);
    },
  });
  appShell.setContext({
    onBaseModeChange: () => {
      mapSceneRenderer.renderBaseColors();
      applyMapVisualState();
    },
    onClaimModeChange: mode => {
      setActiveIncomingClaimKeyState('');
      if (mode !== 'project') setProjectFilterState('');
      else if (!getProjectFilter()) setProjectFilterState(filterControls.getProject());
      updateNationOverlay(selectionCoordinator.getCurrentNation());
    },
    onClaimKindChange: () => updateNationOverlay(selectionCoordinator.getCurrentNation()),
    onProjectChange: projectId => {
      setActiveIncomingClaimKeyState('');
      setProjectFilterState(projectId || '');
      filterControls.setClaimMode(getProjectFilter() ? 'project' : 'all');
      updateNationOverlay(selectionCoordinator.getCurrentNation());
    },
    onLabelsToggle: () => {
      mapSceneRenderer.setLabelsVisible(!mapSceneRenderer.isLabelsVisible());
      mapSceneRenderer.renderLabels();
      searchController.applyFilters();
    },
    onReachableCapitalsToggle: () => {
      selectionCoordinator.toggleReachableCapitalCandidatesState();
    },
  });
  return {searchController, nationOverlayController, rebuildSearchCatalog};
}
