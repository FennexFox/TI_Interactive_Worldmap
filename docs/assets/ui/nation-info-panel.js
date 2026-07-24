// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function createNationInfoPanelController({
  root,
  renderHtml,
  bindSections = () => {},
  onClaimSelected = () => {},
  onRegionSelected = () => {},
} = {}) {
  let currentModel = null;
  const onClick = event => {
    const claim = event.target?.closest?.('.claimListItem');
    if (claim && root?.contains?.(claim)) {
      const kind = claim.dataset.claimKind || '';
      const index = Number(claim.dataset.claimIndex);
      const source = kind === 'incoming'
        ? currentModel?.incomingEntries?.[index]
        : currentModel?.outgoingEntries?.[index];
      if (source) onClaimSelected({kind, index, source, model: currentModel, element: claim});
      return;
    }
    const region = event.target?.closest?.('.legendRegionItem[data-region-name]');
    if (region && root?.contains?.(region)) {
      event.stopPropagation();
      onRegionSelected({regionName: region.dataset.regionName || '', model: currentModel, element: region});
    }
  };
  root?.addEventListener?.('click', onClick);
  return Object.freeze({
    render(model) {
      currentModel = model;
      if (!root) return;
      root.innerHTML = renderHtml(model);
      bindSections(root);
    },
    clear(text = '') {
      currentModel = null;
      if (root) root.textContent = text;
    },
    get model() {
      return currentModel;
    },
  });
}
