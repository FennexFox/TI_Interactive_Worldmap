// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {createNationInfoPanelController} from './nation-info-panel.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function renderClaimCardTitle(context, entry, kind) {
  const parts = context.claimCardTitleParts(entry, kind);
  const flavorText = context.projectSummary(entry?.project);
  const fields = [
    ['nation', context.t('claimCard.fieldNation'), parts.nation],
    ['research', context.t('claimCard.fieldResearch'), parts.research],
    ['project', context.t('claimCard.fieldProject'), parts.project],
  ];
  return `<div class="claimCardTitle">${fields.map(([key, label, value]) => {
    const quoteHtml = key === 'project' && flavorText
      ? `<q class="claimCardQuote">${escapeHtml(flavorText)}</q>`
      : '';
    return `<span class="claimCardTitleField claimCardTitleField--${key}"><span class="claimCardTitleLabel">${escapeHtml(label)}</span><b class="claimCardTitleValue">${escapeHtml(value)}</b>${quoteHtml}</span>`;
  }).join('')}</div>`;
}

function renderRegionList(context, regionNames, claims = {}, prefix = 'targets', regionSourceLabels = {}) {
  const rows = (regionNames || []).map(regionName => {
    const presentation = context.regionPresentation({
      regionName,
      claim: claims?.[regionName] || {},
      prefix,
      source: regionSourceLabels?.[regionName] || '',
    });
    return `<div class="legendRegionRow"><button type="button" class="legendRegionItem${presentation.active ? ' active' : ''}" data-region-name="${escapeHtml(regionName)}"><b>${escapeHtml(presentation.name)}</b><span>${escapeHtml(presentation.detail)}</span></button></div>`;
  }).join('');
  return `<div class="legendRegionList">${rows}</div>`;
}

function renderClaimSection(context, title, items, emptyText, kind) {
  const sectionKey = kind === 'incoming' ? 'incoming' : 'outgoing';
  const sectionOpen = context.infoSectionOpenAttribute(sectionKey);
  if (!items.length) {
    return `<details class="infoSubsection claimSection" data-info-section="${sectionKey}"${sectionOpen}><summary><span>${escapeHtml(title)}</span></summary><div class="infoSubsectionBody small">${escapeHtml(emptyText)}</div></details>`;
  }
  const activeOutgoing = context.claimMode() === 'project' ? context.projectFilter() : '';
  const rows = items.map((item, index) => {
    const regions = item.regions || [];
    const targetRegions = kind === 'incoming' ? (item.targetRegions || regions) : regions;
    const detailRegions = kind === 'incoming' ? (item.resultRegions || regions) : regions;
    const detailClaims = item.claims || {};
    const hostile = item.hostile ?? targetRegions.filter(regionName => (
      context.claimIsEffectivelyHostile(item.targetClaims?.[regionName])
      || context.claimIsEffectivelyHostile(item.claims?.[regionName])
    )).length;
    const gated = item.gated ?? targetRegions.filter(regionName => (
      item.targetClaims?.[regionName]?.gatedClaim || item.claims?.[regionName]?.gatedClaim
    )).length;
    const capital = item.capital ?? targetRegions.filter(regionName => (
      item.targetClaims?.[regionName]?.capitalClaim || item.claims?.[regionName]?.capitalClaim
    )).length;
    const titleParts = context.claimCardTitleParts(item, kind);
    const claimTitle = context.t('claimCard.title', titleParts);
    const claimTitleHtml = renderClaimCardTitle(context, item, kind);
    const key = context.claimKey(item, kind);
    const selected = kind === 'incoming'
      ? context.activeIncomingClaimKey() === key
      : activeOutgoing === key;
    // Baseline claims have no project filter to guide the user to their individual
    // regions. Keep their full target list visible when the outgoing section is
    // opened, while reserving the active treatment for an explicitly selected card.
    const expanded = selected || (kind === 'outgoing' && !item.project);
    const targetNames = targetRegions.map(context.prettyRegionName);
    const targetPreview = targetNames.slice(0, 4).join(', ')
      + (targetNames.length > 4 ? `, +${targetNames.length - 4}` : '');
    const direction = kind === 'incoming'
      ? context.t('claimDirection.incoming', {
        targets: targetPreview || context.t('claimDirection.selectedRegion'),
        regions: context.regionCountText(detailRegions.length),
      })
      : context.t('claimDirection.outgoing', {
        targets: targetPreview || context.t('claimDirection.noTargets'),
      });
    const inherited = item.inheritedClaimCount || item.inheritedRegions?.length || 0;
    const direct = item.directClaimCount || item.directRegions?.length || regions.length;
    const cumulativeText = kind === 'outgoing' && inherited
      ? context.t('claimDirection.cumulative', {direct, inherited})
      : '';
    const statsText = `${hostile ? context.t('claimStat.hostile', {count: hostile}) : ''}${capital ? context.t('claimStat.capital', {count: capital}) : ''}${gated ? context.t('claimStat.gated', {count: gated}) : ''}`;
    const regionDetails = expanded
      ? renderRegionList(
        context,
        detailRegions,
        detailClaims,
        kind === 'incoming' ? 'result' : 'claimed',
        item.regionSourceLabels || {},
      )
      : '';
    return `<div class="claimListGroup${selected ? ' active' : ''}"><button type="button" class="claimListItem${selected ? ' active' : ''}" data-claim-kind="${kind}" data-claim-index="${index}" data-claim-key="${escapeHtml(key)}" title="${escapeHtml(claimTitle + ' · ' + detailRegions.map(context.prettyRegionName).join(', '))}">${claimTitleHtml}<span class="claimListMeta">${escapeHtml(direction + cumulativeText + statsText)}</span></button>${regionDetails}</div>`;
  }).join('');
  return `<details class="infoSubsection claimSection" data-info-section="${sectionKey}"${sectionOpen}><summary><span>${escapeHtml(title)}</span></summary><div class="infoSubsectionBody claimList">${rows}</div></details>`;
}

function renderPanelHtml(context, model) {
  const kvRows = context.basicRows(model)
    .map(([label, value]) => `<div>${escapeHtml(label)}</div><div>${escapeHtml(value)}</div>`)
    .join('');
  const basicInfo = `<details class="infoSubsection nationBasicSection" data-info-section="basic"${context.infoSectionOpenAttribute('basic')}><summary><span>${escapeHtml(context.t('nationInfo.basic.title'))}</span></summary><div class="infoSubsectionBody"><div class="nationTitle"><b>${escapeHtml(context.nationDisplayName(model.nation))}</b> <span class="status tierBadge">${escapeHtml(context.nationTierText(model.nation))}</span> <span class="status ${escapeHtml(model.data.status || 'existing')}">${escapeHtml(context.statusLabel(model.data.status))}</span></div><div class="kv">${kvRows}</div></div></details>`;
  return `${basicInfo}<div class="claimSections">${renderClaimSection(context, context.t('claimSection.outgoing.title'), model.outgoingEntries, context.t('claimSection.outgoing.empty'), 'outgoing')}${renderClaimSection(context, context.t('claimSection.incoming.title'), model.incomingEntries, context.t('claimSection.incoming.empty'), 'incoming')}</div>`;
}

export function createNationOverlayController({
  root,
  projectSelect,
  claimPill,
} = {}) {
  let context = {};
  let destroyed = false;
  const panelController = createNationInfoPanelController({
    root,
    getModel: () => context.getModel?.() || null,
    renderHtml: model => renderPanelHtml(context, model),
    bindSections: panelRoot => context.bindSections?.(panelRoot),
    onClaimSelected: event => context.onClaimSelected?.(event),
    onRegionSelected: event => context.onRegionSelected?.(event),
  });
  const renderClaimPill = model => {
    if (!claimPill || !model) return;
    claimPill.textContent = context.t('pill.claimSummary', {
      nation: context.nationDisplayName(model.nation),
      owned: model.ownedCount,
      claims: model.claimCount,
      projects: model.projectCount,
    });
  };
  const controller = {
    setContext(nextContext = {}) {
      if (destroyed) return;
      context = {...context, ...nextContext};
      panelController.setContext(context);
    },
    render(model, {renderPanel = true, renderPill = true} = {}) {
      if (destroyed || !model) return;
      if (renderPill) renderClaimPill(model);
      if (renderPanel) panelController.render(model);
    },
    renderProjectOptions(nation) {
      if (destroyed || !projectSelect) return;
      const current = context.projectOptionValue();
      const entries = context.projectEntries(nation);
      const options = [
        `<option value="">${escapeHtml(context.t('project.all'))}</option>`,
        ...entries.map(entry => (
          `<option value="${escapeHtml(entry.project)}">${escapeHtml(context.projectDisplay(entry.project))} (${entry.regions.length})</option>`
        )),
      ];
      projectSelect.innerHTML = options.join('');
      projectSelect.value = [...projectSelect.options].some(option => option.value === current)
        ? current
        : '';
    },
    renderClaimPill,
    clearClaimPill(text = '') {
      if (claimPill) claimPill.textContent = text;
    },
    clear(text = '') {
      if (destroyed) return;
      controller.renderProjectOptions('');
      panelController.clear(text);
      controller.clearClaimPill();
    },
    destroy() {
      if (destroyed) return;
      panelController.destroy();
      destroyed = true;
      context = {};
    },
  };
  return Object.freeze(controller);
}
