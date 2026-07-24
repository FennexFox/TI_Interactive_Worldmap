// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function createNationInfoPanelController({
  root,
  renderHtml,
  bindSections = () => {},
  onClaimSelected = () => {},
  onRegionSelected = () => {},
  getModel = null,
} = {}) {
  let currentModel = null;
  let context = {};
  let destroyed = false;
  const activeModel = () => getModel?.() || currentModel;
  const onClick = event => {
    if (destroyed) return;
    const model = activeModel();
    const claim = event.target?.closest?.('.claimListItem');
    if (claim && root?.contains?.(claim)) {
      const kind = claim.dataset.claimKind || '';
      const index = Number(claim.dataset.claimIndex);
      const source = kind === 'incoming'
        ? model?.incomingEntries?.[index]
        : model?.outgoingEntries?.[index];
      if (source) onClaimSelected({kind, index, source, model, element: claim, context});
      return;
    }
    const region = event.target?.closest?.('.legendRegionItem[data-region-name]');
    if (region && root?.contains?.(region)) {
      event.stopPropagation();
      onRegionSelected({regionName: region.dataset.regionName || '', model, element: region, context});
    }
  };
  root?.addEventListener?.('click', onClick);
  return Object.freeze({
    setContext(nextContext = {}) {
      context = {...context, ...nextContext};
    },
    render(model) {
      if (destroyed) return;
      if (!getModel) currentModel = model;
      if (!root) return;
      root.innerHTML = renderHtml(model, context);
      bindSections(root);
    },
    clear(text = '') {
      if (!getModel) currentModel = null;
      if (root) root.textContent = text;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      currentModel = null;
      context = {};
      root?.removeEventListener?.('click', onClick);
    },
    get model() {
      return activeModel();
    },
  });
}
