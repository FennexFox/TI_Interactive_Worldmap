// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function buildClaimOverlayDescriptors(model, {
  claimMode = 'all',
  regionExists = () => true,
  visibleClaimRegionsForEntry,
  countryProjectTier,
  projectColor,
  claimIsEffectivelyHostile,
  baseTerritoryColor,
} = {}) {
  if (!model) return [];
  const descriptors = [];
  if (claimMode !== 'off') {
    for (const region of model.displayBaseSet) {
      if (!regionExists(region)) continue;
      descriptors.push({
        region,
        className: 'claim-overlay owned-territory',
        fillClassName: 'claim-fill-group owned-territory',
        fillKey: `owned:${baseTerritoryColor}`,
        fill: baseTerritoryColor,
        project: 'initial-territory',
      });
    }
  }
  for (const entry of model.entries) {
    const visibleRegions = visibleClaimRegionsForEntry(entry, model);
    if (!visibleRegions.length) continue;
    const tier = countryProjectTier(entry, model.tierByProject);
    const color = projectColor(entry.project, tier);
    for (const region of visibleRegions) {
      if (!regionExists(region)) continue;
      const claim = entry.claims?.[region] || {};
      const hostile = claimIsEffectivelyHostile(claim);
      const claimClass = `${entry.project ? 'research-claim' : 'basic-claim'} ${hostile ? 'hostile' : 'peaceful'}${claim.capitalClaim ? ' capital' : ''}${claim.gatedClaim ? ' gated' : ''}`;
      const fillCategory = entry.project ? `research:${entry.project}` : 'basic';
      const fillClass = `${entry.project ? 'research-claim' : 'basic-claim'}${claim.gatedClaim ? ' gated' : ''}`;
      descriptors.push({
        region,
        className: `claim-overlay ${claimClass}`,
        fillClassName: `claim-fill-group ${fillClass}`,
        fillKey: `${fillCategory}:${color}:${claim.gatedClaim ? 'gated' : 'normal'}`,
        fillOpacity: claim.gatedClaim ? 0.72 : '',
        fill: color,
        hatchClassName: hostile ? `claim-hatch-group hostile ${fillClass}` : '',
        hatchKey: hostile ? `${fillCategory}:hostile-hatch:${claim.gatedClaim ? 'gated' : 'normal'}` : '',
        project: entry.project || 'base',
      });
    }
  }
  return descriptors;
}

export function buildClaimLabelDescriptors(model, {
  visibleClaimRegionsForEntry,
  regionByName = {},
  labelPosition,
  projectDisplay,
  baselineLabel,
  limit = 10,
} = {}) {
  if (!model) return [];
  const descriptors = [];
  model.entries.forEach((entry, index) => {
    const visibleRegions = visibleClaimRegionsForEntry(entry, model);
    if (!visibleRegions.length || index >= limit) return;
    const region = visibleRegions.map(name => regionByName[name]).find(Boolean);
    const position = region && labelPosition(region);
    if (!position) return;
    descriptors.push({
      region: region.regionName,
      x: position.x,
      y: position.y,
      text: entry.project ? projectDisplay(entry.project) : baselineLabel,
    });
  });
  return descriptors;
}
