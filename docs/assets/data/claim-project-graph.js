// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function asSet(values) {
  return values instanceof Set ? values : new Set(values || []);
}

export function createClaimProjectGraph({
  projectMeta,
  projectLabel,
  dataForNation,
  regionListForNation,
}) {
  function projectCost(project) {
    const cost = projectMeta()[project]?.researchCost;
    return typeof cost === 'number' && cost >= 0 ? cost : Number.POSITIVE_INFINITY;
  }

  function projectSortLabel(project) {
    return projectLabel(project) || project || '';
  }

  function dependsOn(project, prerequisite, seen = new Set()) {
    if (!project || !prerequisite || project === prerequisite || seen.has(project)) return false;
    seen.add(project);
    for (const node of projectMeta()[project]?.prerequisiteNodes || []) {
      if (node === prerequisite) return true;
      if (projectMeta()[node] && dependsOn(node, prerequisite, seen)) return true;
    }
    return false;
  }

  function sortedProjectEntries(entries) {
    return [...(entries || [])].sort((left, right) => {
      if (!!left.project !== !!right.project) return left.project ? 1 : -1;
      if (!left.project && !right.project) {
        return String(left.label || '').localeCompare(String(right.label || ''));
      }
      if (dependsOn(left.project, right.project)) return 1;
      if (dependsOn(right.project, left.project)) return -1;
      const leftCost = projectCost(left.project);
      const rightCost = projectCost(right.project);
      if (leftCost !== rightCost) return leftCost < rightCost ? -1 : 1;
      return projectSortLabel(left.project).localeCompare(projectSortLabel(right.project))
        || String(left.project || '').localeCompare(String(right.project || ''));
    });
  }

  function countryProjectTierMap(nation, baseSet) {
    const data = dataForNation(nation);
    const tiers = new Map();
    if (!data) return tiers;
    const baseRegions = asSet(baseSet);
    let tier = 0;
    for (const entry of sortedProjectEntries(data.projects || [])) {
      if (!entry.project) continue;
      if (!(entry.regions || []).some(regionName => !baseRegions.has(regionName))) continue;
      tiers.set(entry.project, tier);
      tier += 1;
    }
    return tiers;
  }

  function nationClaimTierCount(nation) {
    const data = dataForNation(nation) || {};
    const baseSet = new Set(data.baseRegions || regionListForNation(nation));
    return countryProjectTierMap(nation, baseSet).size;
  }

  function countryProjectTier(entry, tierByProject) {
    if (!entry.project) return -1;
    return tierByProject.get(entry.project) ?? 0;
  }

  function isExcludedSystemClaim(claimant, project, label = '') {
    const projectId = String(project || '');
    const displayLabel = String(label || projectLabel(project) || '');
    return claimant === 'ALN'
      || projectId === 'Project_AlienMasterProject'
      || projectId === 'Project_ProtectorateAuthority'
      || /alien master project/i.test(displayLabel)
      || /protectorate authority/i.test(displayLabel)
      || /보호국 총독부/.test(displayLabel);
  }

  return Object.freeze({
    projectCost,
    projectSortLabel,
    dependsOn,
    sortedProjectEntries,
    countryProjectTierMap,
    nationClaimTierCount,
    countryProjectTier,
    isExcludedSystemClaim,
  });
}
