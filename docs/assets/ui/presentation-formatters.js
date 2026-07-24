// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

const CLAIM_GRADIENT_START_HUE = 155;
const CLAIM_GRADIENT_END_HUE = 290;
const CLAIM_GRADIENT_STEPS = 6;
const claimGradientHue = step => CLAIM_GRADIENT_START_HUE
  + (CLAIM_GRADIENT_END_HUE - CLAIM_GRADIENT_START_HUE) * (step / CLAIM_GRADIENT_STEPS);
const claimGradientColor = (step, lightness, chroma) => (
  `oklch(${lightness} ${chroma} ${claimGradientHue(step)})`
);
export const BASE_TERRITORY_COLOR = claimGradientColor(0, 0.78, 0.11);
const CLAIM_TIER_COLORS = [
  claimGradientColor(1, 0.73, 0.14),
  claimGradientColor(2, 0.68, 0.16),
  claimGradientColor(3, 0.63, 0.18),
  claimGradientColor(4, 0.58, 0.20),
  claimGradientColor(5, 0.53, 0.21),
  claimGradientColor(6, 0.49, 0.22),
];
export const HOVER_NATION_BASE_TERRITORY_OPACITY = 0.18;
const HOVER_NATION_TIER_OPACITIES = [0.145, 0.120, 0.095, 0.070, 0.050, 0.032];

export function claimIsEffectivelyHostile(claim) {
  return !!(claim?.effectiveHostile ?? claim?.hostileClaim);
}

export function createPresentationFormatters({getContext, getClaimHelpers} = {}) {
  const context = () => getContext?.() || {};

  function projectDisplay(project) {
    const {t, projectMeta = {}, dataLanguageKey} = context();
    if (!project) return t('project.baseClaimNoResearch');
    const meta = projectMeta[project] || {};
    const language = dataLanguageKey();
    return meta.displayName?.[language]
      || meta.displayName?.en
      || meta.displayName?.kor
      || meta.friendlyName
      || meta.label
      || project.replace('Project_', '');
  }

  function projectSummary(project) {
    if (!project) return '';
    const {projectMeta = {}, dataLanguageKey} = context();
    const summary = projectMeta[project]?.summary;
    if (!summary || typeof summary !== 'object') return '';
    return summary[dataLanguageKey()]
      || summary.en
      || summary.kor
      || Object.values(summary).find(Boolean)
      || '';
  }

  function prettyRegion(value) {
    return String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  function localizedDisplayName(displayName) {
    if (!displayName || typeof displayName !== 'object') return '';
    const {dataLanguageKey} = context();
    return displayName[dataLanguageKey()]
      || displayName.en
      || displayName.kor
      || Object.values(displayName).find(Boolean)
      || '';
  }

  function localizedRegionName(regionOrName) {
    const {regionByName = {}} = context();
    const region = typeof regionOrName === 'string' ? regionByName[regionOrName] : regionOrName;
    if (!region) return prettyRegion(regionOrName);
    return localizedDisplayName(region.displayName)
      || region.primaryCity
      || prettyRegion(region.regionName);
  }

  function nationDisplayName(tag) {
    const {nationMeta = {}} = context();
    const meta = nationMeta[tag] || {};
    return localizedDisplayName(meta.displayName)
      || meta.friendlyName
      || meta.label
      || meta.name
      || tag;
  }

  function nationEffectiveDisplayName(tag) {
    const {nationMeta = {}} = context();
    return localizedDisplayName(nationMeta[tag]?.unionDisplayName) || nationDisplayName(tag);
  }

  function humanizeNationLabel(tag) {
    const {claimTierCountShortText} = context();
    const {nationClaimTierCount} = getClaimHelpers();
    return `${nationDisplayName(tag)} / ${claimTierCountShortText(nationClaimTierCount(tag))}`;
  }

  function hashHue(value) {
    let hash = 0;
    for (let index = 0; index < String(value).length; index += 1) {
      hash = (hash * 31 + String(value).charCodeAt(index)) >>> 0;
    }
    return hash % 360;
  }

  function colorFor(region) {
    const {
      baseMode = 'nation',
      nationColorIndexes = {},
      nationColorPalette = [],
    } = context();
    if (baseMode === 'plain') return 'hsl(215 45% 39%)';
    if (baseMode === 'points') {
      const ratio = Math.min(1, Math.log10(region.points + 1) / 3);
      return `hsl(${220 - 170 * ratio} 58% ${34 + 22 * ratio}%)`;
    }
    const colorIndex = nationColorIndexes[region.nationTag];
    if (nationColorPalette.length && Number.isInteger(colorIndex)) {
      return nationColorPalette[colorIndex % nationColorPalette.length];
    }
    return `hsl(${hashHue(region.nationTag || region.regionName)} 50% 43%)`;
  }

  function projectColor(project, index = 0) {
    const tier = project ? index + 1 : 0;
    return CLAIM_TIER_COLORS[Math.min(Math.max(tier, 0), CLAIM_TIER_COLORS.length - 1)];
  }

  function hoverNationProjectOpacity(project, index = 0) {
    const tier = project ? index + 1 : 0;
    return HOVER_NATION_TIER_OPACITIES[
      Math.min(Math.max(tier, 0), HOVER_NATION_TIER_OPACITIES.length - 1)
    ];
  }

  function statusLabel(status) {
    const {t} = context();
    if (status === 'breakaway_gated_existing') return t('status.breakaway_gated_existing');
    if (status === 'formable') return t('status.formable');
    return t('status.existing');
  }

  function claimCardResearchLabel(entry, nation, {compact = false} = {}) {
    const {t, claimsByNation = {}, nationRegions = new Map()} = context();
    if (!entry?.project) {
      return t(compact ? 'claimCard.researchBaselineValue' : 'claimCard.researchBaseline');
    }
    const {countryProjectTier, countryProjectTierMap} = getClaimHelpers();
    const data = claimsByNation[nation] || {};
    const baseSet = new Set(data.baseRegions || nationRegions.get(nation) || []);
    const tier = countryProjectTier(entry, countryProjectTierMap(nation, baseSet)) + 1;
    return t(compact ? 'claimCard.researchTierValue' : 'claimCard.researchTier', {tier});
  }

  function claimCardTitleParts(entry, kind) {
    const {t, getActiveNation} = context();
    const nation = kind === 'incoming' ? (entry.claimant || '') : getActiveNation();
    const nationName = entry?.project
      ? nationEffectiveDisplayName(nation)
      : nationDisplayName(nation);
    return {
      tag: nation || '-',
      nation: nationName || nation || '-',
      project: entry.project ? projectDisplay(entry.project) : t('claimCard.projectBaseline'),
      research: claimCardResearchLabel(entry, nation, {compact: true}),
    };
  }

  return Object.freeze({
    claimCardTitleParts,
    colorFor,
    hoverNationProjectOpacity,
    humanizeNationLabel,
    localizedDisplayName,
    localizedRegionName,
    nationDisplayName,
    nationEffectiveDisplayName,
    prettyRegion,
    projectColor,
    projectDisplay,
    projectSummary,
    statusLabel,
  });
}
