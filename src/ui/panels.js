// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function pinnedRegionRow({
  regionName,
  regionByName,
  localizedRegionName,
  ownerSummary,
  capitalSummary,
  t,
} = {}) {
  const region = regionByName[regionName];
  const label = localizedRegionName(region || regionName);
  const owner = ownerSummary(region);
  const capital = capitalSummary(regionName);
  const meta = [owner, capital].filter(Boolean).join(' · ');
  return `
    <div class="pinnedRegionRow" data-pinned-region="${escapeHtml(regionName)}">
      <button type="button" class="pinnedRegionFocus" data-pinned-focus="${escapeHtml(regionName)}" aria-label="${escapeHtml(t('expansionNodes.focusRegion', {region: label}))}">
        <span class="pinnedRegionMain">
          <b>${escapeHtml(label)}</b>
          <span>${escapeHtml(meta)}</span>
        </span>
        <span class="pinnedRegionFocusText">${escapeHtml(t('expansionNodes.focus'))}</span>
      </button>
      <button type="button" class="pinnedRegionUnpin" data-pinned-unpin="${escapeHtml(regionName)}" title="${escapeHtml(t('expansionNodes.unpinRegion', {region: label}))}" aria-label="${escapeHtml(t('expansionNodes.unpinRegion', {region: label}))}">\u00d7</button>
    </div>
  `;
}

export function renderPinnedRegionsPanel({
  root,
  pinnedRegionIds,
  regionByName,
  localizedRegionName,
  ownerSummary,
  capitalSummary,
  t,
  formatNumber,
  onFocus,
  onUnpin,
  onClear,
} = {}) {
  if (!root) return;
  const pinned = [...(pinnedRegionIds || [])].filter(regionName => regionByName[regionName]);
  if (!pinned.length) {
    root.innerHTML = `<div class="pinnedRegionEmpty small">${escapeHtml(t('expansionNodes.empty'))}</div>`;
    return;
  }
  root.innerHTML = `
    <div class="pinnedRegionToolbar">
      <span class="pinnedRegionCount">${escapeHtml(t('expansionNodes.count', {count: formatNumber(pinned.length)}))}</span>
      <button type="button" class="pinnedRegionClear" data-pinned-clear>${escapeHtml(t('expansionNodes.clear'))}</button>
    </div>
    <div class="pinnedRegionList">${pinned.map(regionName => pinnedRegionRow({
      regionName,
      regionByName,
      localizedRegionName,
      ownerSummary,
      capitalSummary,
      t,
    })).join('')}</div>
  `;
  root.querySelectorAll('[data-pinned-focus]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      onFocus?.(button.dataset.pinnedFocus || '');
    });
  });
  root.querySelectorAll('[data-pinned-unpin]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      onUnpin?.(button.dataset.pinnedUnpin || '');
    });
  });
  root.querySelector('[data-pinned-clear]')?.addEventListener('click', event => {
    event.stopPropagation();
    onClear?.();
  });
}

function reachableCandidateRow({
  candidate,
  regionByName,
  localizedRegionName,
  candidateNationsText,
  t,
  formatNumber,
} = {}) {
  const label = localizedRegionName(regionByName[candidate.region] || candidate.region);
  const depth = t('reachableCandidates.depth', {depth: formatNumber(candidate.depth)});
  const nations = candidateNationsText(candidate);
  return `
    <div class="reachableCandidateRow" data-candidate-row="${escapeHtml(candidate.region)}">
      <button type="button" class="reachableCandidateFocus" data-candidate-focus="${escapeHtml(candidate.region)}" data-candidate-nation="${escapeHtml(candidate.primaryNation)}" aria-label="${escapeHtml(t('reachableCandidates.focusRegion', {region: label}))}">
        <span class="reachableCandidateMain">
          <b>${escapeHtml(label)}</b>
          <span>${escapeHtml(`${depth} · ${nations}`)}</span>
        </span>
        <span class="reachableCandidateFocusText">${escapeHtml(t('reachableCandidates.focus'))}</span>
      </button>
    </div>
  `;
}

export function renderReachableCapitalCandidatesPanel({
  root,
  visible,
  candidates,
  regionByName,
  localizedRegionName,
  candidateNationsText,
  t,
  formatNumber,
  onSelect,
} = {}) {
  if (!root) return;
  if (!visible) {
    root.innerHTML = '';
    return;
  }
  const resolvedCandidates = candidates || [];
  const body = resolvedCandidates.length
    ? `<div class="reachableCandidateList">${resolvedCandidates.map(candidate => reachableCandidateRow({
      candidate,
      regionByName,
      localizedRegionName,
      candidateNationsText,
      t,
      formatNumber,
    })).join('')}</div>`
    : `<div class="reachableCandidateEmpty small">${escapeHtml(t('reachableCandidates.empty'))}</div>`;
  root.innerHTML = `
    <div class="reachableCandidateToolbar">
      <span class="reachableCandidateCount">${escapeHtml(t('reachableCandidates.count', {count: formatNumber(resolvedCandidates.length)}))}</span>
    </div>
    ${body}
  `;
  root.querySelectorAll('[data-candidate-focus]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      onSelect?.(button.dataset.candidateFocus || '', button.dataset.candidateNation || '');
    });
  });
}
