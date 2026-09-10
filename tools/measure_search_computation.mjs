// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

// Deterministic search-computation probe. It reports fixed-workload callback
// counts and semantic signatures; timings are supplementary local diagnostics.
// Run before and after a source change:
//   node tools/measure_search_computation.mjs OUTPUT.json
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const sourceRoot = process.env.PERF_SOURCE_ROOT || resolve('src');
const {buildSearchCatalog, filterSearchCatalog} = await import(pathToFileURL(resolve(sourceRoot, 'data/search-catalog.js')));
const {createSearchController} = await import(pathToFileURL(resolve(sourceRoot, 'ui/search-controller.js')));

const outputPath = process.argv[2];
if (!outputPath) throw new Error('Usage: node tools/measure_search_computation.mjs OUTPUT.json');

const counters = {localizedRegionName: 0, prettyRegionName: 0, nationLabel: 0};
const regions = Array.from({length: 363}, (_, index) => {
  const nationIndex = index % 121;
  const tag = `N${String(nationIndex).padStart(3, '0')}`;
  return {
    id: index,
    regionName: `Region${String(index).padStart(3, '0')}`,
    nationTag: tag,
    name: `Province ${index}`,
    primaryCity: index % 3 === 0 ? `City ${index}` : '',
    displayName: {en: `Province ${index}`, ko: `지역 ${index}`},
  };
});
const nationMeta = Object.fromEntries(Array.from({length: 121}, (_, index) => {
  const tag = `N${String(index).padStart(3, '0')}`;
  return [tag, {
    aliases: [`Nation Alias ${index}`, `Shared ${index % 7}`],
    displayName: {en: `Nation ${index}`, ko: `국가 ${index}`},
  }];
}));
const claimsByNation = Object.fromEntries(Object.keys(nationMeta).map((tag, index) => [tag, {
  projects: [{project: `Project_${index % 17}`, label: `Project Label ${index % 17}`}],
}]));
const projectMeta = Object.fromEntries(Array.from({length: 17}, (_, index) => [
  `Project_${index}`, {displayName: {en: `Research ${index}`, ko: `연구 ${index}`}},
]));

const catalog = buildSearchCatalog({
  regions,
  claimsByNation,
  nationMeta,
  projectMeta,
  nationLabel: tag => {
    counters.nationLabel += 1;
    return `Label ${tag}`;
  },
  localizedRegionName: region => {
    counters.localizedRegionName += 1;
    return region.displayName.en;
  },
  prettyRegionName: value => {
    counters.prettyRegionName += 1;
    return String(value).replace(/^Region/, 'Pretty Region ');
  },
});

const queries = ['N01', 'Nation Alias 42', 'Research 3', 'Province 12', 'Shared 4', 'missing'];
const limits = [
  {nationLimit: 12, regionLimit: 16},
  {nationLimit: 25, regionLimit: 0},
  {nationLimit: 0, regionLimit: 0},
  {nationLimit: -1, regionLimit: -1},
];
const signature = result => ({
  nations: result.nationMatches.map(choice => choice.tag),
  regions: result.regionMatches.map(choice => choice.id),
});
const semantic = {};
for (const query of queries) {
  for (const limit of limits) {
    const key = `${query}:${limit.nationLimit}/${limit.regionLimit}`;
    semantic[key] = signature(filterSearchCatalog(catalog, query, limit));
  }
}

let rankInputReads = 0;
let regionTextReads = 0;
for (const choice of catalog.nationChoices) {
  const key = 'normalizedAliases' in choice ? 'normalizedAliases' : 'aliases';
  const value = choice[key];
  Object.defineProperty(choice, key, {get() { rankInputReads += 1; return value; }});
}
for (const choice of catalog.regionChoices) {
  const value = choice.searchText;
  Object.defineProperty(choice, 'searchText', {get() { regionTextReads += 1; return value; }});
}
filterSearchCatalog(catalog, 'shared', {nationLimit: 25, regionLimit: 0});
const operationCounts = {rankInputReads, regionTextReads};

const timed = [];
for (let iteration = 0; iteration < 30; iteration += 1) {
  const started = performance.now();
  for (const query of queries) {
    for (const limit of limits) filterSearchCatalog(catalog, query, limit);
  }
  if (iteration >= 5) timed.push(performance.now() - started);
}
timed.sort((left, right) => left - right);
const result = {
  workload: {regions: regions.length, nations: Object.keys(nationMeta).length, queries, limits, warmupIterations: 5, measuredIterations: 25},
  callbackCounts: counters,
  operationCounts,
  catalogCounts: {nationChoices: catalog.nationChoices.length, regionChoices: catalog.regionChoices.length},
  semantic,
  timingMs: {median: timed[Math.floor(timed.length / 2)], min: timed[0], max: timed.at(-1)},
};
const controllerSearch = {
  value: 'Province',
  dataset: {},
  addEventListener: () => {},
  removeEventListener: () => {},
};
let controllerLocalizedCalls = 0;
const controller = createSearchController({search: controllerSearch});
controller.setContext({
  getSearchRegions: () => regions.slice(),
  localizedRegionName: region => {
    controllerLocalizedCalls += 1;
    return region.displayName.en;
  },
  onRegionVisibilityChange: () => {},
});
for (let iteration = 0; iteration < 3; iteration += 1) controller.applyFilters(false);
result.controllerRepeatedFilter = {iterations: 3, localizedRegionNameCalls: controllerLocalizedCalls};
controller.destroy();
await writeFile(outputPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
