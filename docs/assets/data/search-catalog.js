// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function uniqueSearchTerms(values) {
  const seen = new Set();
  const result = [];
  for (const value of values || []) {
    const text = String(value || '').trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function localizedValues(value) {
  return value && typeof value === 'object' ? Object.values(value).filter(Boolean) : [];
}

export function nationSearchAliases(tag, nationMeta = {}) {
  const meta = nationMeta[tag] || {};
  return uniqueSearchTerms([
    tag,
    ...(Array.isArray(meta.aliases) ? meta.aliases : []),
    ...localizedValues(meta.displayName),
    ...localizedValues(meta.baseDisplayName),
    ...localizedValues(meta.unionDisplayName),
    meta.friendlyName,
    meta.label,
    meta.name,
  ]);
}

export function projectSearchAliases(project, projectMeta = {}, entryLabel = '') {
  const meta = projectMeta[project] || {};
  return uniqueSearchTerms([
    project,
    String(project || '').replace(/^Project_/, ''),
    entryLabel,
    meta.label,
    meta.friendlyName,
    ...localizedValues(meta.displayName),
  ]);
}

function nationProjectAliases(tag, claimsByNation, projectMeta) {
  const terms = [];
  for (const entry of claimsByNation[tag]?.projects || []) {
    if (entry?.project) terms.push(...projectSearchAliases(entry.project, projectMeta, entry.label));
  }
  return uniqueSearchTerms(terms);
}

export function buildSearchCatalog({
  regions = [],
  claimsByNation = {},
  nationMeta = {},
  projectMeta = {},
  nationLabel = tag => tag,
  localizedRegionName = region => region?.regionName || '',
  prettyRegionName = value => String(value || ''),
} = {}) {
  const tags = [...new Set([
    ...regions.map(region => region.nationTag),
    ...Object.keys(claimsByNation),
    ...Object.keys(nationMeta),
  ])].filter(Boolean).sort();
  const nationChoices = tags.map(tag => {
    const label = nationLabel(tag);
    const aliases = nationSearchAliases(tag, nationMeta);
    const projectAliases = nationProjectAliases(tag, claimsByNation, projectMeta);
    return {
      tag,
      label,
      aliases,
      projectAliases,
      searchText: [label, ...aliases, ...projectAliases].join(' ').toLowerCase(),
    };
  });
  const nationChoiceByValue = new Map();
  for (const choice of nationChoices) {
    nationChoiceByValue.set(choice.label.toLowerCase(), choice.tag);
    nationChoiceByValue.set(choice.tag.toLowerCase(), choice.tag);
    for (const alias of choice.aliases) {
      const key = alias.toLowerCase();
      if (!nationChoiceByValue.has(key)) nationChoiceByValue.set(key, choice.tag);
    }
  }
  const regionChoices = regions.map(region => ({
    type: 'region',
    id: region.id,
    tag: region.nationTag,
    regionName: region.regionName,
    label: `${localizedRegionName(region)} · ${region.nationTag}`,
    searchText: [
      region.name,
      region.regionName,
      localizedRegionName(region),
      prettyRegionName(region.regionName),
      region.primaryCity,
      ...localizedValues(region.displayName),
      region.nationTag,
    ].filter(Boolean).join(' ').toLowerCase(),
  }));
  return {nationChoices, nationChoiceByValue, regionChoices};
}

function nationMatchRank(choice, query) {
  const tag = choice.tag.toLowerCase();
  const aliases = choice.aliases.map(alias => alias.toLowerCase());
  const projectAliases = choice.projectAliases.map(alias => alias.toLowerCase());
  if (tag === query) return 0;
  if (aliases.some(alias => alias === query)) return 1;
  if (tag.startsWith(query) || aliases.some(alias => alias.startsWith(query))) return 2;
  if (choice.label.toLowerCase().startsWith(query)) return 3;
  if (projectAliases.some(alias => alias === query)) return 4;
  if (projectAliases.some(alias => alias.startsWith(query))) return 5;
  return 6;
}

export function filterSearchCatalog(catalog, query, {nationLimit = 25, regionLimit = 90} = {}) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return {nationMatches: [], regionMatches: []};
  const nationMatches = catalog.nationChoices
    .filter(choice => choice.searchText.includes(normalized))
    .sort((left, right) => (
      nationMatchRank(left, normalized) - nationMatchRank(right, normalized)
      || left.label.localeCompare(right.label)
      || left.tag.localeCompare(right.tag)
    ))
    .slice(0, nationLimit);
  const regionMatches = catalog.regionChoices
    .filter(choice => choice.searchText.includes(normalized))
    .slice(0, regionLimit);
  return {nationMatches, regionMatches};
}

export function parseNationSearchValue(catalog, value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  const direct = catalog.nationChoiceByValue.get(normalized.toLowerCase());
  if (direct) return direct;
  const tag = normalized.split(/[\s·-]+/, 1)[0]?.toUpperCase();
  return tag && catalog.nationChoiceByValue.has(tag.toLowerCase()) ? tag : '';
}
