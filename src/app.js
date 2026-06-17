import {
  clearPinnedRegions,
  clearSelectionState,
  clearTransientClaimState as clearTransientClaimAppState,
  createAppState,
  pinRegion,
  reconcileScenarioState,
  setActiveIncomingClaim,
  setActiveScenarioId,
  setClaimFilters,
  setFocusedRegion,
  setHoveredNation,
  setHoveredRegion,
  setLockedNation,
  setPinnedRegions,
  setSecondaryHoverNation,
  setSelectedNation,
  setSelectedRegions,
  toggleReachableCapitalCandidates,
  unpinPinnedRegion,
} from './state/app-state.js';
import {
  applyMapVisualState as applyVisualState,
  applyMapVisualStateForRegions as applyVisualStateForRegions,
  clearOverlayVisualState as clearOverlayState,
  createMapVisualState,
  setHiddenVisualState as setHiddenState,
  setHoverVisualState as setHoverState,
  setOverlayVisualState as setOverlayState,
  syncPinnedVisualState as syncPinnedState,
  syncSelectedVisualState as syncSelectedState,
} from './state/map-visual-state.js';
import {
  formatViewBoxForMapView,
  initializeMapView,
  panMapView,
  zoomMapView,
} from './state/map-view-state.js';
import {createAppData, getActiveData, getScenarioIds} from './data/active-data.js';
import {buildDerivedIndices} from './data/derived-indices.js';
import {
  appendWorldCopyFragment,
  buildVisualFillGroups,
  createGroupedVisualFillFragment,
  createRegionPath,
  createSvgElement,
  defaultWorldCopyContext,
  normalizeWorldCopyContexts,
  renderGrid as renderGridLayer,
  renderLabels as renderLabelsLayer,
  renderRegions as renderRegionLayers,
  replaceLayerChildren,
  worldCopyDataset,
} from './render/map-layers.js';

const appLoading = document.getElementById('appLoading');
const appLoadingDetail = document.getElementById('appLoadingDetail');

function dismissLoadingScreen() {
  if (!appLoading) return;
  window.requestAnimationFrame(() => {
    appLoading.dataset.loadingState = 'done';
    appLoading.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => appLoading.remove(), 240);
  });
}

function showLoadingFailure(message, error) {
  if (!appLoading) return false;
  appLoading.dataset.loadingState = 'error';
  appLoading.setAttribute('role', 'alert');
  appLoading.removeAttribute('aria-hidden');
  if (appLoadingDetail) {
    const suffix = error?.message ? ` ${error.message}` : '';
    appLoadingDetail.textContent = `${message}${suffix}`;
  }
  return true;
}

const tiDataPromise = window.TI_DATA_PROMISE || Promise.reject(new Error('Generated Terra Invicta map data promise is unavailable.'));

tiDataPromise.then((generatedData) => {
const appData = createAppData(generatedData || {});
function shouldEnableWorldWrap() {
  try {
    const value = new URLSearchParams(window.location.search).get('worldWrap');
    if (value === null) return true;
    return !['0', 'false', 'off'].includes(value.toLowerCase());
  } catch {
    return true;
  }
}
function createWorldCopyContexts(mapView, {enabled = false} = {}) {
  const canonical = defaultWorldCopyContext();
  const worldWidth = Number(mapView?.worldWidth) || 0;
  if (!enabled || !worldWidth) return [canonical];
  return [
    {copyIndex: -1, xOffset: -worldWidth, isCanonical: false},
    canonical,
    {copyIndex: 1, xOffset: worldWidth, isCanonical: false},
  ];
}
const appState = createAppState({activeScenarioId: appData.defaultScenario});
setActiveScenarioId(appState, appData.defaultScenario);
const mapVisualState = createMapVisualState();
let activeData = getActiveData(appData, appState.activeScenarioId);
const mapView = initializeMapView(activeData);
const worldWrapEnabled = shouldEnableWorldWrap();
const worldCopyContexts = createWorldCopyContexts(mapView, {enabled: worldWrapEnabled});
function copyContextRenderKey(copyContexts = worldCopyContexts) {
  return normalizeWorldCopyContexts(copyContexts)
    .map(context => `${context.copyIndex}:${context.xOffset}:${context.isCanonical ? 1 : 0}`)
    .join('|');
}
function createProjectedCopyFragment(copyContexts, groupClassName, buildChildren) {
  const contexts = normalizeWorldCopyContexts(copyContexts || worldCopyContexts);
  const frag = document.createDocumentFragment();
  for (const copyContext of contexts) {
    appendWorldCopyFragment(frag, copyContext, contexts.length, groupClassName, () => buildChildren(copyContext));
  }
  return frag;
}
let derivedIndices = buildDerivedIndices(activeData);
let REGIONS = derivedIndices.regions;
let SUMMARY = derivedIndices.summary;
let NATION_COLOR_PALETTE = derivedIndices.nationColorPalette;
let NATION_COLOR_INDEXES = derivedIndices.nationColorIndexes;
let CLAIMS_BY_NATION = derivedIndices.claimsByNation;
let PROJECT_META = derivedIndices.projectMeta;
let CLAIM_STATS = derivedIndices.claimStats;
let NATION_CATALOG = derivedIndices.nationCatalog;
let NATION_META = derivedIndices.nationMeta;

function syncRuntimeDataAliases() {
  REGIONS = derivedIndices.regions;
  SUMMARY = derivedIndices.summary;
  NATION_COLOR_PALETTE = derivedIndices.nationColorPalette;
  NATION_COLOR_INDEXES = derivedIndices.nationColorIndexes;
  CLAIMS_BY_NATION = derivedIndices.claimsByNation;
  PROJECT_META = derivedIndices.projectMeta;
  CLAIM_STATS = derivedIndices.claimStats;
  NATION_CATALOG = derivedIndices.nationCatalog;
  NATION_META = derivedIndices.nationMeta;
  regionByName = derivedIndices.regionByName;
  nationRegions = derivedIndices.nationRegions;
  incomingClaimsByRegion = derivedIndices.incomingClaimsByRegion;
}

const svg = document.getElementById('map');
if (svg) svg.setAttribute('viewBox', formatViewBoxForMapView(mapView));
svg?.classList.toggle('world-wrap-enabled', worldWrapEnabled);
const gRegions = document.getElementById('regions');
const gNormalRegionColors = document.getElementById('normalRegionColors');
const gHitRegions = document.getElementById('hitRegions');
const gLabels = document.getElementById('labels');
const gClaimLabels = document.getElementById('claimLabels');
const gGrid = document.getElementById('grid');
const gForeignHoverOverlays = document.getElementById('foreignHoverOverlays');
const gHoverClaimPreviewOverlays = document.getElementById('hoverClaimPreviewOverlays');
const gClaimOverlays = document.getElementById('claimOverlays');
const gManualEnvelopeOverlays = document.getElementById('manualEnvelopeOverlays');
const gSecondaryHoverOverlays = document.getElementById('secondaryHoverOverlays');
const gCapitalMarkers = document.getElementById('capitalMarkers');
const gHoverOutlines = document.getElementById('hoverOutlines');
const gSelectionOutlines = document.getElementById('selectionOutlines');
const gPinnedRegionMarkers = document.getElementById('pinnedRegionMarkers');
const gReachableCapitalCandidates = document.getElementById('reachableCapitalCandidates');
const tip = document.getElementById('tip');
const search = document.getElementById('search');
const nationDropdown = document.getElementById('nationDropdown');
const nationSearchCombo = document.getElementById('nationSearchCombo');
const scenarioSel = document.getElementById('scenarioSel');
const scenarioSummary = document.getElementById('scenarioSummary');
const pinnedRegionsPanel = document.getElementById('pinnedRegionsPanel');
const reachableCandidatesPanel = document.getElementById('reachableCandidatesPanel');
const baseModeSel = document.getElementById('baseMode');
const claimModeSel = document.getElementById('claimMode');
const projectSel = document.getElementById('projectSel');
const claimKindSel = document.getElementById('claimKind');
const results = document.getElementById('results');
const nationInfo = document.getElementById('nationInfo');
const selectedPill = document.getElementById('selectedPill');
const languageSel = document.getElementById('languageSel');
const svgWrap = document.querySelector('.svgwrap');
const regionPathElements = [];
const hitPathElements = [];
const labelTextElements = [];

const DEBUG_RENDER_STATS_QUERY = 'debugRenderStats';
function shouldEnableDebugRenderStats() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has(DEBUG_RENDER_STATS_QUERY) || window.localStorage?.getItem('ti-debug-render-stats') === '1';
  } catch {
    return false;
  }
}

function createDebugRenderStats() {
  const keys = [
    'fullVisualStateApplications',
    'boundedVisualStateApplications',
    'visiblePathsTouched',
    'hitPathsTouched',
    'overlayModelBuilds',
    'overlayModelCacheHits',
    'claimOverlayDescriptorBuilds',
    'claimOverlayDescriptorCacheHits',
    'claimLabelDescriptorBuilds',
    'claimLabelDescriptorCacheHits',
    'foreignHoverDescriptorBuilds',
    'foreignHoverDescriptorCacheHits',
    'claimOverlayInactiveBufferRebuilds',
    'claimLabelInactiveBufferRebuilds',
    'claimOverlayBufferSwaps',
    'claimLabelBufferSwaps',
    'claimOverlayStaleRenderSkips',
    'claimLabelStaleRenderSkips',
    'claimOverlayDomReplacements',
    'claimLabelDomReplacements',
    'hoverOutlineReplacements',
    'foreignHoverOverlayReplacements',
    'hoverClaimPreviewOverlayReplacements',
    'secondaryHoverOverlayReplacements',
    'manualEnvelopeModelBuilds',
    'manualEnvelopeModelCacheHits',
    'manualEnvelopeRebuilds',
    'reachableCapitalCandidateDescriptorBuilds',
    'reachableCapitalCandidateDescriptorCacheHits',
    'reachableCapitalCandidateRebuilds',
    'capitalMarkerRebuilds',
    'pinnedRegionMarkerRebuilds',
    'panPointerMoveCount',
    'panFrameMsCount',
    'panFrameMsTotal',
    'panFrameMsMax',
    'mapViewApplyMsCount',
    'mapViewApplyMsTotal',
    'mapViewApplyMsMax',
    'gridRenderMsCount',
    'gridRenderMsTotal',
    'gridRenderMsMax',
    'panViewBoxApplyCount',
    'gridRebuildsDuringPan',
    'panSvgRectReads',
    'visibleSvgNodeCount',
  ];
  const stats = {};
  for (const key of keys) stats[key] = 0;
  Object.defineProperty(stats, 'reset', {
    value: () => {
      for (const key of keys) stats[key] = 0;
    },
  });
  return stats;
}

const debugRenderStats = shouldEnableDebugRenderStats() ? createDebugRenderStats() : null;
if (debugRenderStats) window.__TI_DEBUG_RENDER_STATS__ = debugRenderStats;

function recordRenderStat(key, amount = 1) {
  if (!debugRenderStats) return;
  debugRenderStats[key] = (debugRenderStats[key] || 0) + amount;
}
function setRenderStat(key, value) {
  if (!debugRenderStats) return;
  debugRenderStats[key] = Number.isFinite(Number(value)) ? Number(value) : 0;
}
function recordRenderTiming(key, value) {
  if (!debugRenderStats) return;
  const ms = Math.max(0, Number(value) || 0);
  recordRenderStat(`${key}Count`);
  recordRenderStat(`${key}Total`, ms);
  debugRenderStats[`${key}Max`] = Math.max(debugRenderStats[`${key}Max`] || 0, ms);
}

const DEBUG_CLAIM_OVERLAY_DELAY_QUERY = 'debugClaimOverlayDelayFrames';
function debugClaimOverlayDelayFrames() {
  try {
    const value = new URLSearchParams(window.location.search).get(DEBUG_CLAIM_OVERLAY_DELAY_QUERY);
    const frames = Number.parseInt(value || '0', 10);
    return Number.isFinite(frames) && frames > 0 ? Math.min(frames, 30) : 0;
  } catch {
    return 0;
  }
}
const claimOverlayCommitDelayFrames = debugRenderStats ? debugClaimOverlayDelayFrames() : 0;

const LANGUAGE_STORAGE_KEY = 'ti-map-language';
const ASIDE_CARD_ORDER_STORAGE_KEY = 'ti-map-aside-card-order';
const ASIDE_CARD_COLLAPSE_STORAGE_KEY = 'ti-map-aside-card-collapsed';
const NATION_INFO_SECTION_STORAGE_KEY = 'ti-map-nation-info-sections';
const DEFAULT_ASIDE_CARD_ORDER = ['explore', 'expansionNodes', 'selected'];
const I18N = {
  ko: {
    'document.title': 'Terra Invicta 영유권 / 통합 지도',
    'app.title': 'Terra Invicta 영유권 / 통합 지도',
    'section.explore': '탐색 및 선택',
    'scenario.label': '시작 시나리오',
    'scenario.summary': '{scenario} · 지역 {regions}개 · 국가 {nations}개 · 영유권 행 {claims}개 · 프로젝트 {projects}개',
    'search.label': '국가/지역 검색 및 선택',
    'search.placeholder': '국가 태그, 지역명, 프로젝트명 입력: CHN, Korea, Greater India...',
    'search.help': '입력창을 클릭하면 국가 목록이 열립니다. 입력하면 국가, 지역, 영유권 프로젝트 목록이 필터링되고, 항목을 클릭하면 선택됩니다. 빈 지도 공간을 클릭하면 고정된 확장 노드와 선택이 함께 해제됩니다.',
    'search.noResults': '검색 결과 없음',
    'search.regionTag': '지역',
    'claimMode.label': '영유권 표시',
    'claimMode.all': '전체 영유권',
    'claimMode.project': '선택한 프로젝트만',
    'claimMode.off': '끄기',
    'claimKind.label': '영유권 유형',
    'claimKind.all': '평화적+적대적',
    'claimKind.peaceful': '평화적만',
    'claimKind.hostile': '적대적만',
    'project.label': '프로젝트',
    'project.all': '자동/전체',
    'baseMode.label': '기본 지도 색상',
    'baseMode.nation': '국가별',
    'baseMode.plain': '단색',
    'baseMode.points': '경계 복잡도',
    'button.toggleLabels': '지역 라벨 토글',
    'button.showReachableCapitals': '도달 가능한 수도 표시',
    'button.hideReachableCapitals': '도달 가능한 수도 숨기기',
    'section.expansionNodes': '확장 노드',
    'expansionNodes.empty': '고정된 확장 노드가 없습니다.',
    'expansionNodes.count': '고정 노드 {count}개',
    'expansionNodes.clear': '모두 해제',
    'expansionNodes.focus': '초점',
    'expansionNodes.focusRegion': '{region}에 초점',
    'expansionNodes.pin': '고정',
    'expansionNodes.pinRegion': '{region} 고정',
    'expansionNodes.unpin': '고정 해제',
    'expansionNodes.unpinRegion': '{region} 고정 해제',
    'expansionNodes.marker': '고정 노드 {index}: {region}',
    'expansionNodes.owner': '소유국 {nation}',
    'expansionNodes.capitalClaimant': '수도 국가 {nation}',
    'expansionNodes.capitalClaimants': '수도 국가 {count}개: {nations}',
    'expansionNodes.noCapitalClaimant': '수도 국가 없음',
    'manualEnvelope.depth': '수동 확장 깊이 {depth}',
    'manualEnvelope.region': '{region}: 깊이 {depth}, {source}',
    'manualEnvelope.source': '{nation} · {kind}',
    'manualEnvelope.kindBase': '기본 영토',
    'manualEnvelope.kindClaim': '{project}',
    'manualEnvelope.overlap': '{region}: {count}개 수동 확장 출처 중첩',
    'reachableCandidates.count': '후보 수도 {count}개',
    'reachableCandidates.empty': '도달 가능한 수도 후보가 없습니다.',
    'reachableCandidates.focus': '초점',
    'reachableCandidates.focusRegion': '{region}에 초점',
    'reachableCandidates.marker': '도달 가능한 수도 {region}: {nations}',
    'reachableCandidates.depth': '깊이 {depth}',
    'section.selectedNation': '선택한 지역',
    'sectionCard.moveUp': '카드 위로 이동',
    'sectionCard.moveDown': '카드 아래로 이동',
    'sectionCard.collapse': '카드 접기',
    'sectionCard.expand': '카드 펼치기',
    'nationInfo.basic.title': '국가 기본정보',
    'nationInfo.empty': '지도에서 지역을 클릭하세요.',
    'note.claimSource': '이 지도는 <code>TIBilateralTemplate.json</code>의 <code>relationType=Claim</code>, <code>projectUnlockName</code>, <code>nation1</code>, <code>region1</code> 데이터를 사용합니다. 연구가 즉시 병합을 수행한다기보다 병합/정복/통합 가능성의 전제인 영유권을 부여한다는 의미로 표시합니다. <code>projectUnlockName</code>이 없는 항목도 기본/상시 영유권으로 포함합니다.',
    'mapActions.aria': '외부 링크 및 언어',
    'language.label': '언어',
    'language.ko': '한국어',
    'language.en': 'English',
    'map.aria': 'Terra Invicta 영유권 연구 지도',
    'project.baseClaimNoResearch': '기본 영유권 / 연구 불필요',
    'project.none': '프로젝트 없음',
    'status.breakaway_gated_existing': '조건부 분리 가능 국가',
    'status.formable': '형성 가능 국가',
    'status.existing': '기존 국가',
    'count.regions': '{count}개 지역',
    'count.uniqueRegions': '고유 지역 {count}개',
    'count.claimTiers': '연구 단계 {count}개',
    'count.claimTiersShort': '단계 {count}개',
    'count.claimGroups': '영유권 묶음 {count}개',
    'pill.hoverEmpty': '호버: -',
    'pill.hoverRegion': '호버: {nation} · {region}',
    'pill.claimsEmpty': '영유권: -',
    'pill.claimSummary': '{nation}: 영토 {owned}, 영유권 {claims}, 연구 단계 {projects}',
    'warn.unmatchedClaimRows': '미매칭 영유권 행 {count}개',
    'selected.region': '선택 지역: {region}{nation}',
    'selected.regions': '선택 지역: {count}개',
    'claim.peaceful': '평화적',
    'claim.hostile': '적대적',
    'claim.capital': '수도',
    'claim.gated': '조건부',
    'regionPrefix.targets': '대상',
    'regionPrefix.result': '결과',
    'regionPrefix.claimed': '영유권',
    'regionList.detail': '{prefix} 지역{owner}{meta}{source}',
    'source.inheritedFrom': '{project}에서 상속',
    'source.basicClaim': '기본 영유권',
    'source.direct': '직접',
    'claimSection.outgoing.title': '주장하는 영유권',
    'claimSection.outgoing.empty': '이 국가가 추가로 주장하는 영유권이 없습니다.',
    'claimSection.incoming.title': '목표가 되는 영유권',
    'claimSection.incoming.empty': '선택한 지역을 목표로 하는 다른 영유권이 없습니다.',
    'claimDirection.incoming': '대상: {targets} · 형성 결과 {regions}',
    'claimDirection.outgoing': '영유권: {targets}',
    'claimDirection.selectedRegion': '선택한 지역',
    'claimDirection.noTargets': '대상 없음',
    'claimDirection.cumulative': ' · 누적: 직접 {direct} + 선행 {inherited}',
    'claimCard.title': '{tag} - {nation} - {project} - {research}',
    'claimCard.fieldTag': '코드',
    'claimCard.fieldNation': '국가',
    'claimCard.fieldProject': '프로젝트',
    'claimCard.fieldResearch': '단계',
    'claimCard.projectBaseline': '기본 영유권',
    'claimCard.researchTier': '연구 단계 {tier}',
    'claimCard.researchBaseline': '연구 불필요',
    'claimCard.researchTierValue': '{tier}',
    'claimCard.researchBaselineValue': '기본',
    'claimStat.hostile': ' · 적대 {count}',
    'claimStat.capital': ' · 수도 {count}',
    'claimStat.gated': ' · 조건부 {count}',
    'nationInfo.summary': '현재/시작 영토 {owned} · 표시 중인 영유권 {claims} · {projects}{breakaway}',
    'nationInfo.summary.baseTerritory': '현재/시작 영토 {owned}',
    'nationInfo.summary.visibleClaims': '표시 중인 영유권 {claims}',
    'nationInfo.summary.breakaway': '분리 원국 {nation}',
    'nationInfo.breakaway': ' · 분리 원국 {nation}',
    'nationInfo.kv.status': '상태',
    'nationInfo.kv.capitalRegion': '수도 지역',
    'nationInfo.kv.baseTerritory': '기본 영토',
    'nationInfo.kv.directClaims': '직접 영유권',
    'nationInfo.kv.targetedRegions': '대상 지역',
    'nationInfo.kv.conditional': '조건부',
    'nationInfo.kv.claimProjects': '연구 단계',
    'nationInfo.kv.displayMode': '표시 모드',
    'nationInfo.hint': '가장 밝은 시작색은 초기/현재 영토입니다. 빈 노란 별은 수도 지역, 채워진 노란 별은 현재 선택된 수도 지역입니다. 영유권 색상은 기본 영유권에서 연구 단계가 높아질수록 같은 색상 축을 따라 이동합니다. 푸른 테두리는 평화적 영유권, 붉은 테두리는 적대적 영유권, 점선은 수도 영유권, 보라색/잠금 스타일은 조건부 분리 영유권입니다.',
    'results.nation': '국가 선택 · 태그 {tag}',
    'error.loadFailed': 'Terra Invicta 지도 데이터를 불러오지 못했습니다.',
  },
  en: {
    'document.title': 'Terra Invicta Claim / Unification Map',
    'app.title': 'Terra Invicta Claim / Unification Map',
    'section.explore': 'Explore and Select',
    'scenario.label': 'Start scenario',
    'scenario.summary': '{scenario} · {regions} regions · {nations} nations · {claims} claim rows · {projects} projects',
    'search.label': 'Search and select nation/region',
    'search.placeholder': 'Enter a nation tag, region, or project: CHN, Korea, Greater India...',
    'search.help': 'Click the field to open the nation list. Typing filters nations, regions, and claim projects; click an item to select it. Click empty map space to clear the selection and pinned expansion nodes together.',
    'search.noResults': 'No results',
    'search.regionTag': 'REGION',
    'claimMode.label': 'Claim display',
    'claimMode.all': 'All claims',
    'claimMode.project': 'Selected project only',
    'claimMode.off': 'Off',
    'claimKind.label': 'Claim type',
    'claimKind.all': 'Peaceful + hostile',
    'claimKind.peaceful': 'Peaceful only',
    'claimKind.hostile': 'Hostile only',
    'project.label': 'Project',
    'project.all': 'Auto/all',
    'baseMode.label': 'Base map color',
    'baseMode.nation': 'By nation',
    'baseMode.plain': 'Plain',
    'baseMode.points': 'Boundary complexity',
    'button.toggleLabels': 'Toggle region labels',
    'button.showReachableCapitals': 'Show reachable capitals',
    'button.hideReachableCapitals': 'Hide reachable capitals',
    'section.expansionNodes': 'Expansion Nodes',
    'expansionNodes.empty': 'No pinned expansion nodes.',
    'expansionNodes.count': '{count} pinned nodes',
    'expansionNodes.clear': 'Clear all',
    'expansionNodes.focus': 'Focus',
    'expansionNodes.focusRegion': 'Focus {region}',
    'expansionNodes.pin': 'Pin',
    'expansionNodes.pinRegion': 'Pin {region}',
    'expansionNodes.unpin': 'Unpin',
    'expansionNodes.unpinRegion': 'Unpin {region}',
    'expansionNodes.marker': 'Pinned node {index}: {region}',
    'expansionNodes.owner': 'Owner {nation}',
    'expansionNodes.capitalClaimant': 'Capital claimant {nation}',
    'expansionNodes.capitalClaimants': '{count} capital claimants: {nations}',
    'expansionNodes.noCapitalClaimant': 'No capital claimant',
    'manualEnvelope.depth': 'Manual expansion depth {depth}',
    'manualEnvelope.region': '{region}: depth {depth}, {source}',
    'manualEnvelope.source': '{nation} · {kind}',
    'manualEnvelope.kindBase': 'base territory',
    'manualEnvelope.kindClaim': '{project}',
    'manualEnvelope.overlap': '{region}: {count} overlapping manual expansion sources',
    'reachableCandidates.count': '{count} candidate capitals',
    'reachableCandidates.empty': 'No reachable capital candidates.',
    'reachableCandidates.focus': 'Focus',
    'reachableCandidates.focusRegion': 'Focus {region}',
    'reachableCandidates.marker': 'Reachable capital {region}: {nations}',
    'reachableCandidates.depth': 'Depth {depth}',
    'section.selectedNation': 'Selected Region',
    'sectionCard.moveUp': 'Move card up',
    'sectionCard.moveDown': 'Move card down',
    'sectionCard.collapse': 'Collapse card',
    'sectionCard.expand': 'Expand card',
    'nationInfo.basic.title': 'Basic Nation Info',
    'nationInfo.empty': 'Click a region on the map.',
    'note.claimSource': 'This map uses <code>relationType=Claim</code>, <code>projectUnlockName</code>, <code>nation1</code>, and <code>region1</code> from <code>TIBilateralTemplate.json</code>. Research is shown as granting claims, which are prerequisites for merger, conquest, or unification possibilities, rather than as performing those actions immediately. Claims without <code>projectUnlockName</code> are included as baseline claims.',
    'mapActions.aria': 'External links and language',
    'language.label': 'Language',
    'language.ko': '한국어',
    'language.en': 'English',
    'map.aria': 'Terra Invicta claim research map',
    'project.baseClaimNoResearch': 'Baseline claim / no research',
    'project.none': 'No project',
    'status.breakaway_gated_existing': 'conditional breakaway nation',
    'status.formable': 'formable nation',
    'status.existing': 'existing nation',
    'count.regions': '{count} regions',
    'count.uniqueRegions': '{count} unique regions',
    'count.claimTiers': '{count} research tiers',
    'count.claimTiersShort': '{count} tiers',
    'count.claimGroups': '{count} claim groups',
    'pill.hoverEmpty': 'Hover: -',
    'pill.hoverRegion': 'Hover: {nation} · {region}',
    'pill.claimsEmpty': 'Claims: -',
    'pill.claimSummary': '{nation}: territory {owned}, claims {claims}, research tiers {projects}',
    'warn.unmatchedClaimRows': '{count} unmatched claim rows',
    'selected.region': 'Selected region: {region}{nation}',
    'selected.regions': 'Selected regions: {count}',
    'claim.peaceful': 'peaceful',
    'claim.hostile': 'hostile',
    'claim.capital': 'capital',
    'claim.gated': 'conditional',
    'regionPrefix.targets': 'target',
    'regionPrefix.result': 'result',
    'regionPrefix.claimed': 'claimed',
    'regionList.detail': '{prefix} region{owner}{meta}{source}',
    'source.inheritedFrom': 'inherited from {project}',
    'source.basicClaim': 'baseline claim',
    'source.direct': 'direct',
    'claimSection.outgoing.title': 'Claims Asserted By This Nation',
    'claimSection.outgoing.empty': 'This nation has no additional led claims.',
    'claimSection.incoming.title': 'Claims Targeting This Territory',
    'claimSection.incoming.empty': 'No other claims target the selected region.',
    'claimDirection.incoming': 'targets: {targets} · resulting country {regions}',
    'claimDirection.outgoing': 'claims: {targets}',
    'claimDirection.selectedRegion': 'selected region',
    'claimDirection.noTargets': 'no targets',
    'claimDirection.cumulative': ' · cumulative: direct {direct} + inherited {inherited}',
    'claimCard.title': '{tag} - {nation} - {project} - {research}',
    'claimCard.fieldTag': 'Code',
    'claimCard.fieldNation': 'Nation',
    'claimCard.fieldProject': 'Project',
    'claimCard.fieldResearch': 'Tier',
    'claimCard.projectBaseline': 'baseline claim',
    'claimCard.researchTier': 'research tier {tier}',
    'claimCard.researchBaseline': 'no research',
    'claimCard.researchTierValue': '{tier}',
    'claimCard.researchBaselineValue': 'base',
    'claimStat.hostile': ' · hostile {count}',
    'claimStat.capital': ' · capital {count}',
    'claimStat.gated': ' · conditional {count}',
    'nationInfo.summary': 'Current/starting territory {owned} · visible claims {claims} · {projects}{breakaway}',
    'nationInfo.summary.baseTerritory': 'Current/starting territory {owned}',
    'nationInfo.summary.visibleClaims': 'Visible claims {claims}',
    'nationInfo.summary.breakaway': 'Breakaway from {nation}',
    'nationInfo.breakaway': ' · breakaway from {nation}',
    'nationInfo.kv.status': 'Status',
    'nationInfo.kv.capitalRegion': 'Capital region',
    'nationInfo.kv.baseTerritory': 'Base territory',
    'nationInfo.kv.directClaims': 'Direct claims',
    'nationInfo.kv.targetedRegions': 'Targeted regions',
    'nationInfo.kv.conditional': 'Conditional',
    'nationInfo.kv.claimProjects': 'Research tiers',
    'nationInfo.kv.displayMode': 'Display mode',
    'nationInfo.hint': 'The brightest starting color marks initial/current territory. A hollow yellow star marks the capital region; a filled yellow star means the selected region is also the capital. Claim colors move along one color scale from baseline claims through higher research tiers. Blue outlines are peaceful claims, red outlines are hostile claims, dashed outlines are capital claims, and purple/locked styling marks conditional breakaway claims.',
    'results.nation': 'Select nation · tag {tag}',
    'error.loadFailed': 'Failed to load generated Terra Invicta map data.',
  },
};

function normalizeLanguage(value) {
  return String(value || '').toLowerCase().startsWith('en') ? 'en' : 'ko';
}
function readSavedLanguage() {
  try { return window.localStorage?.getItem(LANGUAGE_STORAGE_KEY) || ''; }
  catch (_) { return ''; }
}
function saveLanguage(language) {
  try { window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language); }
  catch (_) {}
}
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function readJsonSetting(key, fallback, isValid = () => true) {
  try {
    const raw = window.localStorage?.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}
function saveJsonSetting(key, value) {
  try { window.localStorage?.setItem(key, JSON.stringify(value)); }
  catch (_) {}
}
function infoSectionOpenAttribute(key) {
  const state = readJsonSetting(NATION_INFO_SECTION_STORAGE_KEY, {}, isPlainObject);
  return state[key] === false ? '' : ' open';
}
function bindNationInfoSectionToggles() {
  nationInfo.querySelectorAll('.infoSubsection[data-info-section]').forEach(section => {
    section.addEventListener('toggle', () => {
      const state = readJsonSetting(NATION_INFO_SECTION_STORAGE_KEY, {}, isPlainObject);
      state[section.dataset.infoSection] = section.open;
      saveJsonSetting(NATION_INFO_SECTION_STORAGE_KEY, state);
    });
  });
}
function setAsideCardCollapsed(card, collapsed) {
  card.dataset.collapsed = collapsed ? 'true' : 'false';
  const body = card.querySelector('.sideCardBody');
  const toggle = card.querySelector('[data-card-toggle]');
  if (body) body.hidden = !!collapsed;
  if (toggle) toggle.setAttribute('aria-expanded', String(!collapsed));
}
function saveAsideCardState() {
  const cards = [...document.querySelectorAll('#asideCardList .sideCard[data-aside-card]')];
  saveJsonSetting(ASIDE_CARD_ORDER_STORAGE_KEY, cards.map(card => card.dataset.asideCard));
  saveJsonSetting(ASIDE_CARD_COLLAPSE_STORAGE_KEY, Object.fromEntries(cards.map(card => [card.dataset.asideCard, card.dataset.collapsed === 'true'])));
}
function updateAsideCardControls() {
  const cards = [...document.querySelectorAll('#asideCardList .sideCard[data-aside-card]')];
  cards.forEach((card, index) => {
    const up = card.querySelector('[data-card-move="up"]');
    const down = card.querySelector('[data-card-move="down"]');
    const toggle = card.querySelector('[data-card-toggle]');
    if (up) {
      up.disabled = index === 0;
      up.title = t('sectionCard.moveUp');
      up.setAttribute('aria-label', t('sectionCard.moveUp'));
    }
    if (down) {
      down.disabled = index === cards.length - 1;
      down.title = t('sectionCard.moveDown');
      down.setAttribute('aria-label', t('sectionCard.moveDown'));
    }
    if (toggle) {
      const collapsed = card.dataset.collapsed === 'true';
      toggle.textContent = collapsed ? '+' : '−';
      toggle.title = collapsed ? t('sectionCard.expand') : t('sectionCard.collapse');
      toggle.setAttribute('aria-label', collapsed ? t('sectionCard.expand') : t('sectionCard.collapse'));
      toggle.setAttribute('aria-expanded', String(!collapsed));
    }
  });
}
function initAsideCards() {
  const list = document.getElementById('asideCardList');
  if (!list) return;
  const cardsByKey = new Map([...list.querySelectorAll('.sideCard[data-aside-card]')].map(card => [card.dataset.asideCard, card]));
  const savedOrder = readJsonSetting(ASIDE_CARD_ORDER_STORAGE_KEY, DEFAULT_ASIDE_CARD_ORDER, Array.isArray);
  const order = [...savedOrder.filter(key => cardsByKey.has(key)), ...DEFAULT_ASIDE_CARD_ORDER.filter(key => !savedOrder.includes(key))];
  order.forEach(key => list.appendChild(cardsByKey.get(key)));
  const collapsed = readJsonSetting(ASIDE_CARD_COLLAPSE_STORAGE_KEY, {}, isPlainObject);
  cardsByKey.forEach((card, key) => setAsideCardCollapsed(card, !!collapsed[key]));
  list.addEventListener('click', e => {
    const card = e.target.closest('.sideCard[data-aside-card]');
    if (!card || !list.contains(card)) return;
    if (e.target.closest('[data-card-toggle]')) {
      setAsideCardCollapsed(card, card.dataset.collapsed !== 'true');
      saveAsideCardState();
      updateAsideCardControls();
      return;
    }
    const moveButton = e.target.closest('[data-card-move]');
    if (!moveButton) return;
    const direction = moveButton.dataset.cardMove;
    if (direction === 'up' && card.previousElementSibling) list.insertBefore(card, card.previousElementSibling);
    if (direction === 'down' && card.nextElementSibling) list.insertBefore(card.nextElementSibling, card);
    saveAsideCardState();
    updateAsideCardControls();
  });
  updateAsideCardControls();
  updateMapViewControlsLabels();
}
let currentLanguage = normalizeLanguage(readSavedLanguage() || languageSel?.value || document.documentElement.lang || 'en');

function t(key, values={}) {
  const template = I18N[currentLanguage]?.[key] ?? I18N.ko[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}
function dataLanguageKey() {
  return currentLanguage === 'ko' ? 'kor' : 'en';
}
function formatNumber(count) {
  return Number(count || 0).toLocaleString(currentLanguage === 'ko' ? 'ko-KR' : 'en-US');
}
function englishCount(count, singular, plural=`${singular}s`) {
  return `${formatNumber(count)} ${Number(count) === 1 ? singular : plural}`;
}
function regionCountText(count) { return currentLanguage === 'ko' ? t('count.regions', {count: formatNumber(count)}) : englishCount(count, 'region'); }
function uniqueRegionCountText(count) { return currentLanguage === 'ko' ? t('count.uniqueRegions', {count: formatNumber(count)}) : `${formatNumber(count)} unique ${Number(count) === 1 ? 'region' : 'regions'}`; }
function claimTierCountText(count) { return currentLanguage === 'ko' ? t('count.claimTiers', {count: formatNumber(count)}) : `${formatNumber(count)} research ${Number(count) === 1 ? 'tier' : 'tiers'}`; }
function claimTierCountShortText(count) { return currentLanguage === 'ko' ? t('count.claimTiersShort', {count: formatNumber(count)}) : `${formatNumber(count)} ${Number(count) === 1 ? 'tier' : 'tiers'}`; }
function claimGroupCountText(count) { return currentLanguage === 'ko' ? t('count.claimGroups', {count: formatNumber(count)}) : englishCount(count, 'claim group'); }
function claimModeLabel(value) { return t(`claimMode.${value || 'all'}`); }
function activeScenarioSummary() {
  const entry = appData.scenarios[activeScenarioId()] || activeData || {};
  const summary = entry.summary || activeData?.summary || {};
  return {
    regions: summary.regionCount ?? entry.regionMap?.regions?.length ?? activeData?.regionMap?.regions?.length ?? 0,
    nations: summary.nationCount ?? Object.keys(entry.catalogs?.nations?.nations || activeData?.catalogs?.nations?.nations || {}).length,
    claims: summary.claimRowsNormalized ?? activeData?.claimMap?.summary?.claimRowsNormalized ?? 0,
    projects: summary.claimGrantingProjectCount ?? summary.projectCount ?? Object.keys(activeData?.catalogs?.research?.projects || {}).length,
  };
}
function renderScenarioOptions() {
  if (!scenarioSel) return;
  const scenarioIds = getScenarioIds(appData);
  const html = scenarioIds.map(id => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join('');
  if (scenarioSel.innerHTML !== html) scenarioSel.innerHTML = html;
  scenarioSel.value = activeScenarioId();
}
function syncScenarioControls() {
  renderScenarioOptions();
  if (!scenarioSummary) return;
  const summary = activeScenarioSummary();
  scenarioSummary.textContent = t('scenario.summary', {
    scenario: activeScenarioId(),
    regions: formatNumber(summary.regions),
    nations: formatNumber(summary.nations),
    claims: formatNumber(summary.claims),
    projects: formatNumber(summary.projects),
  });
}
function setHoverPill(region=null) {
  const el = document.getElementById('hoverPill');
  if (!el) return;
  el.textContent = region
    ? t('pill.hoverRegion', {nation: region.nationTag, region: localizedRegionName(region)})
    : t('pill.hoverEmpty');
}
function setClaimsPillEmpty() {
  const el = document.getElementById('claimPill');
  if (el) el.textContent = t('pill.claimsEmpty');
}
function updateReachableCapitalsButtonState() {
  const el = document.getElementById('reachableCapitalsBtn');
  if (!el) return;
  const visible = getShowReachableCapitalCandidates();
  el.textContent = visible ? t('button.hideReachableCapitals') : t('button.showReachableCapitals');
  el.setAttribute('aria-pressed', visible ? 'true' : 'false');
}
function applyStaticTranslations() {
  document.documentElement.lang = currentLanguage;
  document.title = t('document.title');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel)); });
  if (languageSel) languageSel.value = currentLanguage;
  syncScenarioControls();
  updateReachableCapitalsButtonState();
  updateAsideCardControls();
}

let regionByName = derivedIndices.regionByName;
const pathByRegion = new Map();
const pathInstancesByRegion = new Map();
const normalRegionColorElements = [];
const hitPathByRegion = new Map();
const hitPathInstancesByRegion = new Map();
let nationRegions = derivedIndices.nationRegions;
let labelsVisible = false;
const selectedRegionIds = appState.selectedRegionIds;
let nationChoices = derivedIndices.nationChoices;
let nationDropdownOpen = false;
let highlightedNationChoiceIndex = -1;
let currentDropdownChoices = [];
let regionChoices = derivedIndices.regionChoices;
let pendingHoverNation = '';
let hoverPreviewFrame = 0;
let hoverClaimPreviewNation = '';
let visibleNationRegionNames = new Set();
let currentOverlayModel = null;
let activeClaimPreviewRegionScopeKey = '';
let activeClaimPreviewRegionScope = null;
let tooltipRegionId = null;
let svgWrapRectCache = null;
let tooltipSizeCache = {width: 160, height: 26, valid: false};
let tooltipFrame = 0;
let pendingTooltipPoint = null;
let foreignHoverVisualKey = '';
let hoverClaimPreviewVisualKey = '';
let secondaryHoverVisualKey = '';
let hoverOutlineVisualKey = '';
let capitalMarkersKey = '';
let mapViewFrame = 0;
let pendingMapViewRenderContext = null;
let panHoverRefreshFrame = 0;
let pendingPanHoverPoint = null;
let mapPanState = null;
let suppressMapClick = false;
const nationChoiceByValue = new Map();
let incomingClaimsByRegion = derivedIndices.incomingClaimsByRegion;
const regionCenterCache = new Map();
const OVERLAY_MODEL_CACHE_LIMIT = 256;
const OVERLAY_DESCRIPTOR_CACHE_LIMIT = 256;
const FOREIGN_HOVER_DESCRIPTOR_CACHE_LIMIT = 128;
const MANUAL_ENVELOPE_MODEL_CACHE_LIMIT = 128;
const REACHABLE_CAPITAL_CANDIDATE_DESCRIPTOR_CACHE_LIMIT = 128;
const EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE = Symbol('empty-manual-envelope-model');
const overlayModelCache = new Map();
const claimOverlayDescriptorCache = new Map();
const claimLabelDescriptorCache = new Map();
const foreignHoverDescriptorCache = new Map();
const manualEnvelopeModelCache = new Map();
const reachableCapitalCandidateDescriptorCache = new Map();
const CLAIM_OVERLAY_EMPTY_RENDER_KEY = 'claim-overlay-paths:empty';
const CLAIM_LABEL_EMPTY_RENDER_KEY = 'claim-labels:empty';
const FOREIGN_HOVER_EMPTY_RENDER_KEY = 'foreign-hover:empty';
const HOVER_CLAIM_PREVIEW_EMPTY_RENDER_KEY = 'hover-claim-preview:empty';
const SECONDARY_HOVER_EMPTY_RENDER_KEY = 'secondary-hover:empty';
const HOVER_OUTLINE_EMPTY_RENDER_KEY = 'hover-outline:empty';
const MANUAL_ENVELOPE_EMPTY_RENDER_KEY = 'manual-envelope:empty';
const PINNED_REGION_MARKERS_EMPTY_RENDER_KEY = 'pinned-region-markers:empty';
const REACHABLE_CAPITAL_CANDIDATES_EMPTY_RENDER_KEY = 'reachable-capital-candidates:empty';
const claimOverlayLayerRenderKeys = new WeakMap();
const claimLabelLayerRenderKeys = new WeakMap();
const manualEnvelopeLayerRenderKeys = new WeakMap();
const pinnedRegionMarkerLayerRenderKeys = new WeakMap();
const reachableCapitalCandidateLayerRenderKeys = new WeakMap();
const claimOverlayBufferStates = new WeakMap();
const claimLabelBufferStates = new WeakMap();
const MAP_PAN_DRAG_THRESHOLD_PX = 4;
const MAP_ZOOM_BUTTON_FACTOR = 1.25;
const MAP_WHEEL_ZOOM_FACTOR = 1.18;

function activeScenarioId() {
  return appState.activeScenarioId || appData.defaultScenario || '';
}

function resolveScenarioId(scenarioId = '') {
  const requested = String(scenarioId || appData.defaultScenario || '').trim();
  return appData.scenarios[requested] ? requested : appData.defaultScenario;
}

function availableRuntimeNationIds() {
  return [
    ...new Set([
      ...Object.keys(NATION_META || {}),
      ...Object.keys(CLAIMS_BY_NATION || {}),
      ...[...(nationRegions?.keys?.() || [])],
      ...REGIONS.map(region => region.nationTag).filter(Boolean),
    ]),
  ];
}

function activeIncomingClaimKeysForState() {
  const nation = getLockedNation() || getActiveNation();
  if (!nation || !CLAIMS_BY_NATION[nation]) return [];
  const data = CLAIMS_BY_NATION[nation];
  const baseSet = new Set(data.baseRegions || nationRegions.get(nation) || []);
  return incomingClaimsForTarget(nation, data, baseSet).map(incomingClaimKey);
}

function applyRuntimeScenarioData(scenarioId) {
  activeData = getActiveData(appData, scenarioId);
  derivedIndices = buildDerivedIndices(activeData);
  syncRuntimeDataAliases();
}

function clearScenarioSensitiveCaches() {
  regionCenterCache.clear();
  overlayModelCache.clear();
  claimOverlayDescriptorCache.clear();
  claimLabelDescriptorCache.clear();
  foreignHoverDescriptorCache.clear();
  manualEnvelopeModelCache.clear();
  reachableCapitalCandidateDescriptorCache.clear();
  activeClaimPreviewRegionScopeKey = '';
  activeClaimPreviewRegionScope = null;
}

function resetScenarioRenderKeys() {
  foreignHoverVisualKey = '';
  hoverClaimPreviewVisualKey = '';
  secondaryHoverVisualKey = '';
  hoverOutlineVisualKey = '';
  capitalMarkersKey = '';
}

function reconcileStateForActiveScenario() {
  reconcileScenarioState(appState, {
    regionIds: Object.keys(regionByName || {}),
    nationIds: availableRuntimeNationIds(),
    projectIds: Object.keys(PROJECT_META || {}),
    incomingClaimKeys: activeIncomingClaimKeysForState(),
  });
  syncSelectedVisualState();
  syncPinnedVisualState();
  if (search.dataset.selectedNation && !availableRuntimeNationIds().includes(search.dataset.selectedNation)) {
    search.dataset.selectedNation = '';
    search.value = '';
  }
  const selectedNation = search.dataset.selectedNation || '';
  if (selectedNation) search.value = humanizeNationLabel(selectedNation);
  if (projectSel && ![...projectSel.options].some(option => option.value === getProjectFilter())) projectSel.value = '';
  if (claimModeSel.value === 'project' && !getProjectFilter()) claimModeSel.value = 'all';
}

function resetTransientScenarioInteractionState() {
  cancelPendingHoverPreview();
  hideRegionTooltip();
  hoverClaimPreviewNation = '';
  pendingHoverNation = '';
  visibleNationRegionNames = new Set();
  setHoverVisualState();
  setHoverPill();
}

function renderActiveScenario() {
  populate();
  clearOverlayVisualState();
  renderGrid({mapView});
  renderRegions({mapView});
  renderLabels({mapView});
  renderSelectionOutlines();
  renderPinnedRegionsPanel();
  renderPinnedRegionMarkers();
  renderCapitalMarkers({force: true});
  updateNationOverlay(getLockedNation() || getActiveNation(), {
    renderDetails: true,
    updateFilters: false,
    updateSelected: false,
    renderMap: true,
    updateManualExpansion: true,
  });
  applyFilters(true);
  updateSelectedRegions();
  renderNationDropdown();
  refreshReachableCapitalCandidateOutputs(currentOverlayModel);
  setHoverPill();
  if (!getLockedNation() && !getActiveNation()) setClaimsPillEmpty();
}

function setActiveScenario(nextScenarioId, {force = false} = {}) {
  const scenarioId = resolveScenarioId(nextScenarioId);
  if (!scenarioId) return false;
  if (!force && scenarioId === activeScenarioId()) return false;
  setActiveScenarioId(appState, scenarioId);
  applyRuntimeScenarioData(scenarioId);
  resetTransientScenarioInteractionState();
  clearScenarioSensitiveCaches();
  resetScenarioRenderKeys();
  buildNationChoices();
  buildIncomingClaimIndex();
  reconcileStateForActiveScenario();
  renderActiveScenario();
  syncScenarioControls();
  return true;
}

window.__TI_SCENARIO_API__ = {
  scenarios: getScenarioIds(appData),
  get activeScenario() { return activeScenarioId(); },
  setActiveScenario,
};

function pruneLruCache(cache, limit) {
  while (cache.size > limit) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

function getCachedLruValue(cache, key, hitStatKey) {
  if (!cache.has(key)) return null;
  const value = cache.get(key);
  cache.delete(key);
  cache.set(key, value);
  recordRenderStat(hitStatKey);
  return value;
}

function setCachedLruValue(cache, key, value, limit) {
  cache.set(key, value);
  pruneLruCache(cache, limit);
  return value;
}

function setActiveNationState(nation = '') {
  setSelectedNation(appState, nation);
}

function setHoverNationState(nation = '') {
  setHoveredNation(appState, nation);
}

function setSecondaryHoverNationState(nation = '') {
  setSecondaryHoverNation(appState, nation);
}

function setLockedNationState(nation = '') {
  setLockedNation(appState, nation);
}

function setHoveredRegionState(regionName = '', nationId) {
  setHoveredRegion(appState, regionName, nationId);
}

function setFocusedRegionState(regionName = '') {
  setFocusedRegion(appState, regionName);
}

function changedRegionIds(previousRegionIds = [], nextRegionIds = []) {
  return [...new Set([...(previousRegionIds || []), ...(nextRegionIds || [])].filter(Boolean))];
}

function setSelectedRegionIds(regionIds = []) {
  const previous = [...selectedRegionIds];
  setSelectedRegions(appState, regionIds);
  syncSelectedVisualState();
  return changedRegionIds(previous, [...selectedRegionIds]);
}

function setPinnedRegionIds(regionIds = []) {
  const previous = [...getPinnedRegionIds()];
  setPinnedRegions(appState, regionIds);
  refreshPinnedRegionOutputs([...previous, ...getPinnedRegionIds()]);
}

function getPinnedCapitalClaimant(regionName = '') {
  return appState.pinnedCapitalClaimants?.get?.(regionName) || '';
}

function pinRegionState(regionName = '', options = {}) {
  if (!regionName) return;
  const wasPinned = getPinnedRegionIds().has(regionName);
  const previousClaimant = getPinnedCapitalClaimant(regionName);
  pinRegion(appState, regionName, options);
  const nextClaimant = getPinnedCapitalClaimant(regionName);
  if (wasPinned && previousClaimant === nextClaimant) return;
  refreshPinnedRegionOutputs([regionName]);
}

function unpinPinnedRegionState(regionName = '') {
  unpinPinnedRegion(appState, regionName);
  refreshPinnedRegionOutputs([regionName]);
}

function clearPinnedRegionState() {
  const previous = [...getPinnedRegionIds()];
  clearPinnedRegions(appState);
  refreshPinnedRegionOutputs(previous);
}

function toggleReachableCapitalCandidatesState() {
  toggleReachableCapitalCandidates(appState);
  updateReachableCapitalsButtonState();
  refreshReachableCapitalCandidateOutputs(currentOverlayModel);
}

function setProjectFilterState(projectId = '') {
  setClaimFilters(appState, {projectId});
}

function setActiveIncomingClaimKeyState(claimKey = '') {
  setActiveIncomingClaim(appState, claimKey);
}

function syncSelectedVisualState() {
  syncSelectedState(mapVisualState, selectedRegionIds);
}

function syncPinnedVisualState() {
  syncPinnedState(mapVisualState, getPinnedRegionIds());
}

function getActiveNation() { return appState.selectedNationId || ''; }
function getHoverNation() { return appState.hoveredNationId || ''; }
function getSecondaryHoverNation() { return appState.interaction?.secondaryHoverNationId || ''; }
function getLockedNation() { return appState.lockedNationId || ''; }
function getHoveredRegionName() { return appState.hoveredRegionId || ''; }
function getFocusedRegionName() { return appState.focusedRegionId || ''; }
function getPinnedRegionIds() { return appState.pinnedRegionIds || new Set(); }
function getShowReachableCapitalCandidates() { return !!appState.showReachableCapitalCandidates; }
function getProjectFilter() { return appState.filters.projectId || ''; }
function getActiveIncomingClaimKey() { return appState.activeIncomingClaimKey || ''; }

function setHoverVisualState(regionName = '') {
  setHoverState(mapVisualState, regionName);
}

function clearOverlayVisualState() {
  clearOverlayState(mapVisualState);
}

function setOverlayVisualState(model) {
  setOverlayState(mapVisualState, model, REGIONS);
}

function syncClaimPresentationState() {
  const committed = !!currentOverlayModel?.hasClaimOverlay;
  const preview = !!hoverClaimPreviewNation;
  svg?.classList?.toggle('claims-active', committed || preview);
}

function setHiddenVisualState(hiddenRegionIds) {
  setHiddenState(mapVisualState, hiddenRegionIds);
}

function applyMapVisualState(renderContext = {}, state = mapVisualState) {
  const context = {
    svg,
    pathByRegion,
    pathInstancesByRegion,
    regionPathElements,
    hitPathByRegion,
    hitPathInstancesByRegion,
    hitPathElements,
    ...renderContext,
  };
  recordRenderStat('fullVisualStateApplications');
  recordRenderStat('visiblePathsTouched', (context.regionPathElements || []).length);
  recordRenderStat('hitPathsTouched', (context.hitPathElements || []).length || (context.hitPathByRegion || new Map()).size);
  applyVisualState(context, state);
  syncClaimPresentationState();
}

function applyMapVisualStateForRegions(regionIds, renderContext = {}, state = mapVisualState) {
  const context = {
    svg,
    pathByRegion,
    pathInstancesByRegion,
    regionPathElements,
    hitPathByRegion,
    hitPathInstancesByRegion,
    hitPathElements,
    ...renderContext,
  };
  const result = applyVisualStateForRegions(context, state, regionIds);
  recordRenderStat('boundedVisualStateApplications');
  recordRenderStat('visiblePathsTouched', result.visiblePathsTouched);
  recordRenderStat('hitPathsTouched', result.hitPathsTouched);
  syncClaimPresentationState();
  return result;
}

const CLAIM_GRADIENT_START_HUE = 155;
const CLAIM_GRADIENT_END_HUE = 290;
const CLAIM_GRADIENT_STEPS = 6; // initial territory + no-research + 5 research tiers.
const claimGradientHue = step => CLAIM_GRADIENT_START_HUE + (CLAIM_GRADIENT_END_HUE - CLAIM_GRADIENT_START_HUE) * (step / CLAIM_GRADIENT_STEPS);
const claimGradientColor = (step, lightness, chroma) => `oklch(${lightness} ${chroma} ${claimGradientHue(step)})`;
const BASE_TERRITORY_COLOR = claimGradientColor(0, 0.78, 0.11);
const MUTED_NON_CLAIM_COLOR = 'oklch(0.32 0.026 260)';
const CLAIM_TIER_COLORS = [
  claimGradientColor(1, 0.73, 0.14), // no-research claim
  claimGradientColor(2, 0.68, 0.16), // research tier 1
  claimGradientColor(3, 0.63, 0.18), // research tier 2
  claimGradientColor(4, 0.58, 0.20), // research tier 3
  claimGradientColor(5, 0.53, 0.21), // research tier 4
  claimGradientColor(6, 0.49, 0.22), // research tier 5+
];
const MANUAL_ENVELOPE_DEPTH_COLORS = [
  'oklch(0.80 0.13 168 / .30)',
  'oklch(0.76 0.15 214 / .28)',
  'oklch(0.75 0.16 285 / .26)',
  'oklch(0.78 0.14 35 / .24)',
];
// Reuse the same hue as the single-region hover fill, then fade it by tier.
// The final hidden step is no overlay at all, which returns to the muted non-hover map.
const HOVER_NATION_OVERLAY_COLOR = 'oklch(0.86 0.17 95)';
const SECONDARY_CAPITAL_OVERLAY_COLOR = 'oklch(0.91 0.16 72)';
const HOVER_NATION_BASE_TERRITORY_OPACITY = 0.18;
const SECONDARY_CAPITAL_BASE_TERRITORY_OPACITY = 0.24;
const HOVER_NATION_TIER_OPACITIES = [
  0.145, // no-research claim
  0.120, // research tier 1
  0.095, // research tier 2
  0.070, // research tier 3
  0.050, // research tier 4
  0.032, // research tier 5+
];
const SECONDARY_CAPITAL_TIER_OPACITY_BOOST = 0.035;

function injectClaimOverlayStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #normalRegionColors {
      pointer-events:none;
    }
    #normalRegionColors .normal-region-color.hidden {
      display:none;
    }
    svg.claims-active #normalRegionColors {
      display:none;
    }
    svg.claims-active .region {
      fill:${MUTED_NON_CLAIM_COLOR} !important;
      opacity:1;
      filter:none;
      stroke:oklch(1 0 0 / .14);
    }
    svg.claims-active .region.dimmed {
      fill:${MUTED_NON_CLAIM_COLOR} !important;
      opacity:1;
      filter:none;
      stroke:oklch(1 0 0 / .14);
    }
    svg.claims-active .region.claim-target,
    svg.claims-active .region.owned-highlight {
      fill:transparent !important;
      opacity:.82;
      filter:none;
    }
    svg.claims-active .region.selected {
      filter:none;
      stroke:#fff;
      stroke-width:.02;
    }
    svg.claims-active .region.pinned-node {
      stroke:#5eead4;
      stroke-width:.021;
      opacity:1;
    }
    svg.claims-active .region:hover,
    svg.claims-active .region.hovered {
      filter:none;
      stroke:white;
    }
    svg.claims-active .claim-overlay {
      mix-blend-mode:normal;
      filter:none;
      opacity:1;
    }
    .claim-fill-group {
      pointer-events:none;
      stroke:none;
      mix-blend-mode:normal;
      filter:none;
      opacity:1;
    }
    .claim-fill-group.gated {
      opacity:.72;
    }
    svg.claims-active .claim-overlay.gated {
      opacity:1;
    }
    .claim-overlay.owned-territory {
      stroke:oklch(0.90 0.08 155 / .95);
      stroke-width:.018;
    }
    .claim-overlay.basic-claim,
    .claim-overlay.research-claim {
      stroke-width:.016;
    }
    .selection-fill {
      pointer-events:none;
      fill:oklch(0.86 0.17 95 / .26);
      stroke:none;
      mix-blend-mode:screen;
    }
    .selection-outline-glow {
      pointer-events:none;
      fill:none;
      stroke:oklch(0.87 0.18 92 / .92);
      stroke-width:.082;
      vector-effect:non-scaling-stroke;
    }
    .selection-outline {
      pointer-events:none;
      fill:none;
      stroke:white;
      stroke-width:.034;
      vector-effect:non-scaling-stroke;
    }
    .selection-dot {
      pointer-events:none;
      fill:oklch(0.91 0.17 92 / .96);
      stroke:rgba(0,0,0,.8);
      stroke-width:.01;
      vector-effect:non-scaling-stroke;
    }
    .selection-label {
      pointer-events:none;
      font-size:.055px;
      font-weight:800;
      fill:#fff7b8;
      text-anchor:middle;
      paint-order:stroke;
      stroke:rgba(0,0,0,.82);
      stroke-width:.015;
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function projectDisplay(p) {
  if (!p) return t('project.baseClaimNoResearch');
  const meta = PROJECT_META[p] || {};
  return meta.displayName?.[dataLanguageKey()] || meta.displayName?.en || meta.displayName?.kor || meta.friendlyName || meta.label || p.replace('Project_','');
}
function prettyRegion(s) { return String(s || '').replace(/([a-z])([A-Z])/g,'$1 $2'); }
function localizedRegionName(regionOrName) {
  const region = typeof regionOrName === 'string' ? regionByName[regionOrName] : regionOrName;
  if (!region) return prettyRegion(regionOrName);
  return localizedDisplayName(region.displayName) || region.primaryCity || prettyRegion(region.regionName);
}
function hashHue(s) { let h=0; for (let i=0;i<String(s).length;i++) h=(h*31+String(s).charCodeAt(i))>>>0; return h%360; }
function colorFor(r) {
  const mode = baseModeSel.value;
  if (mode === 'plain') return 'hsl(215 45% 39%)';
  if (mode === 'points') { const t=Math.min(1, Math.log10(r.points+1)/3); return `hsl(${220-170*t} 58% ${34+22*t}%)`; }
  const colorIndex = NATION_COLOR_INDEXES[r.nationTag];
  if (NATION_COLOR_PALETTE.length && Number.isInteger(colorIndex)) {
    return NATION_COLOR_PALETTE[colorIndex % NATION_COLOR_PALETTE.length];
  }
  return `hsl(${hashHue(r.nationTag || r.regionName)} 50% 43%)`;
}
function projectCost(project) {
  const cost = PROJECT_META[project]?.researchCost;
  return typeof cost === 'number' && cost >= 0 ? cost : Number.POSITIVE_INFINITY;
}
function projectSortLabel(project) {
  return projectDisplay(project) || project || '';
}
function dependsOn(project, prerequisite, seen=new Set()) {
  if (!project || !prerequisite || project === prerequisite || seen.has(project)) return false;
  seen.add(project);
  const prereqs = PROJECT_META[project]?.prerequisiteNodes || [];
  for (const node of prereqs) {
    if (node === prerequisite) return true;
    if (PROJECT_META[node] && dependsOn(node, prerequisite, seen)) return true;
  }
  return false;
}
function sortedProjectEntries(entries) {
  return [...entries].sort((a, b) => {
    if (!!a.project !== !!b.project) return a.project ? 1 : -1;
    if (!a.project && !b.project) return String(a.label || '').localeCompare(String(b.label || ''));
    if (dependsOn(a.project, b.project)) return 1;
    if (dependsOn(b.project, a.project)) return -1;
    const costA = projectCost(a.project);
    const costB = projectCost(b.project);
    if (costA !== costB) return costA < costB ? -1 : 1;
    const byLabel = projectSortLabel(a.project).localeCompare(projectSortLabel(b.project));
    if (byLabel) return byLabel;
    return String(a.project || '').localeCompare(String(b.project || ''));
  });
}
function countryProjectTierMap(nation, baseSet) {
  const d = CLAIMS_BY_NATION[nation];
  const tiers = new Map();
  if (!d) return tiers;
  let tier = 0;
  for (const entry of sortedProjectEntries(d.projects || [])) {
    if (!entry.project) continue;
    const hasExpansionRegions = (entry.regions || []).some(rn => !baseSet.has(rn));
    if (!hasExpansionRegions) continue;
    tiers.set(entry.project, tier);
    tier += 1;
  }
  return tiers;
}
function nationClaimTierCount(nation) {
  const d = CLAIMS_BY_NATION[nation] || {};
  const baseSet = new Set(d.baseRegions || nationRegions.get(nation) || []);
  return countryProjectTierMap(nation, baseSet).size;
}
function countryProjectTier(entry, tierByProject) {
  if (!entry.project) return -1;
  return tierByProject.get(entry.project) ?? 0;
}
function projectColor(project, i=0) {
  const tier = project ? i + 1 : 0;
  return CLAIM_TIER_COLORS[Math.min(Math.max(tier, 0), CLAIM_TIER_COLORS.length - 1)];
}
function hoverNationProjectOpacity(project, i=0) {
  const tier = project ? i + 1 : 0;
  return HOVER_NATION_TIER_OPACITIES[Math.min(Math.max(tier, 0), HOVER_NATION_TIER_OPACITIES.length - 1)];
}
function statusLabel(status) {
  if (status === 'breakaway_gated_existing') return t('status.breakaway_gated_existing');
  if (status === 'formable') return t('status.formable');
  return t('status.existing');
}
function statusBadge(status) {
  return `<span class="status ${escapeHtml(status || 'existing')}">${escapeHtml(statusLabel(status))}</span>`;
}
function isExcludedSystemClaim(claimant, project, label='') {
  const p = String(project || '');
  const l = String(label || projectDisplay(project) || '');
  return claimant === 'ALN'
    || p === 'Project_AlienMasterProject'
    || p === 'Project_ProtectorateAuthority'
    || /alien master project/i.test(l)
    || /protectorate authority/i.test(l)
    || /보호국 총독부/.test(l);
}
function labelPosition(r) {
  if (r.labels && r.labels[0]) return r.labels[0];
  return regionPathCenter(r);
}
function regionPathCenter(r) {
  if (!r?.regionName || !r?.path) return null;
  if (regionCenterCache.has(r.regionName)) return regionCenterCache.get(r.regionName);
  const values = String(r.path).match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) || [];
  const points = [];
  for (let i = 0; i + 1 < values.length; i += 2) {
    const x = values[i];
    const y = values[i + 1];
    if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]);
  }
  if (!points.length) {
    regionCenterCache.set(r.regionName, null);
    return null;
  }
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const center = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
  regionCenterCache.set(r.regionName, center);
  return center;
}
function starPoints(cx, cy, outerRadius = 0.032, innerRadius = 0.014, points = 5) {
  const coords = [];
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + i * step;
    coords.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return coords.join(' ');
}
function capitalRegionNames(data) {
  return [...new Set(data?.capitalRegions || [])].filter(rn => regionByName[rn]);
}
function capitalRegionNamesForNation(nation) {
  return capitalRegionNames(CLAIMS_BY_NATION[nation] || null);
}
function capitalRegionsText(data) {
  const names = capitalRegionNames(data).map(rn => localizedRegionName(regionByName[rn] || rn));
  return names.length ? names.join(', ') : '-';
}
function isCapitalRegionForNation(nation, regionName) {
  return !!nation && !!regionName && capitalRegionNamesForNation(nation).includes(regionName);
}
function selectedRegionIsCapital(regionName) {
  if (isCapitalRegionForNation(getActiveNation(), regionName)) return true;
  const owner = regionByName[regionName]?.nationTag || '';
  return isCapitalRegionForNation(owner, regionName);
}
function addCapitalMarkerNation(markers, nation, {selected=false} = {}) {
  if (!nation) return;
  for (const rn of capitalRegionNamesForNation(nation)) {
    const existing = markers.get(rn);
    markers.set(rn, {
      regionName: rn,
      nation,
      selected: !!(selected || existing?.selected),
    });
  }
}
function appendCapitalMarkerGroup(frag, region, {
  nation = '',
  selected = false,
  copyContext = defaultWorldCopyContext(),
  className = '',
  ariaLabel = '',
  dataset = {},
  starClassName = '',
  starDataset = {},
} = {}) {
  const lab = labelPosition(region);
  if (!lab) return null;
  const copyData = worldCopyDataset(copyContext);
  const group = createSvgElement('g', {
    class: `capital-marker${selected ? ' is-selected' : ' is-idle'}${className ? ` ${className}` : ''}`,
    'aria-label': ariaLabel || `${t('nationInfo.kv.capitalRegion')}: ${localizedRegionName(region)}`,
  }, {
    region: region.regionName,
    nation,
    ...dataset,
    ...copyData,
  });
  const points = starPoints(lab.x, lab.y);
  group.appendChild(createSvgElement('polygon', {
    class: 'capital-star-shadow',
    points,
    'aria-hidden': 'true',
  }));
  group.appendChild(createSvgElement('polygon', {
    class: `capital-star${starClassName ? ` ${starClassName}` : ''}`,
    points,
  }, {...starDataset, ...copyData}));
  frag.appendChild(group);
  return group;
}
function isPinnedCapitalRegionForNation(nation) {
  if (!nation) return false;
  return [...getPinnedRegionIds()].some(rn => isCapitalRegionForNation(nation, rn));
}
function isActiveCapitalMarkerSelected(nation) {
  return [...selectedRegionIds].some(rn => isCapitalRegionForNation(nation, rn))
    || isCapitalRegionForNation(nation, getHoveredRegionName())
    || isPinnedCapitalRegionForNation(nation);
}
function shouldSuppressHoveredOwnerCapitalMarker(region) {
  const claimant = resolveSecondaryCapitalPreviewNation(region);
  return !!claimant && claimant !== region?.nationTag;
}
function collectCapitalMarkers() {
  const markers = new Map();
  const pinnedNation = getLockedNation() || getActiveNation();
  if (pinnedNation) {
    addCapitalMarkerNation(markers, pinnedNation, {selected:isActiveCapitalMarkerSelected(pinnedNation)});
  }

  for (const rn of selectedRegionIds) {
    const owner = regionByName[rn]?.nationTag || '';
    if (isCapitalRegionForNation(owner, rn)) addCapitalMarkerNation(markers, owner, {selected:true});
  }

  const hovered = getHoveredRegionName() ? regionByName[getHoveredRegionName()] : null;
  if (hovered) {
    if (getActiveNation() && visibleNationRegionNames.has(hovered.regionName)) {
      addCapitalMarkerNation(markers, getActiveNation(), {selected:isActiveCapitalMarkerSelected(getActiveNation())});
    }
    if (!shouldSuppressHoveredOwnerCapitalMarker(hovered)) {
      addCapitalMarkerNation(markers, hovered.nationTag, {selected:isCapitalRegionForNation(hovered.nationTag, hovered.regionName)});
    }
  }

  if (!markers.size) addCapitalMarkerNation(markers, getHoverNation());
  return [...markers.values()];
}
function renderCapitalMarkers({force=false, copyContexts=worldCopyContexts} = {}) {
  if (!gCapitalMarkers) return;
  const markers = collectCapitalMarkers()
    .sort((a, b) => a.regionName.localeCompare(b.regionName) || a.nation.localeCompare(b.nation));
  const key = `${copyContextRenderKey(copyContexts)}|${currentLanguage}|${markers.map(m => `${m.regionName}:${m.nation}:${m.selected ? 1 : 0}`).join('|')}`;
  if (!force && key === capitalMarkersKey) return;
  capitalMarkersKey = key;
  recordRenderStat('capitalMarkerRebuilds');
  replaceLayerChildren(gCapitalMarkers);
  if (!markers.length) return;
  gCapitalMarkers.appendChild(createProjectedCopyFragment(copyContexts, 'capital-marker-copy', copyContext => {
    const frag = document.createDocumentFragment();
    for (const markerInfo of markers) {
      const region = regionByName[markerInfo.regionName];
      if (!region) continue;
      appendCapitalMarkerGroup(frag, region, {
        nation: markerInfo.nation,
        selected: markerInfo.selected,
        copyContext,
      });
    }
    return frag;
  }));
}

function localizedDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'object') return '';
  return displayName[dataLanguageKey()] || displayName.en || displayName.kor || Object.values(displayName).find(Boolean) || '';
}
function uniqueSearchTerms(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const text = String(value || '').trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}
function nationDisplayName(tag) {
  const meta = NATION_META[tag] || {};
  return localizedDisplayName(meta.displayName) || meta.friendlyName || meta.label || meta.name || tag;
}
function nationSearchAliases(tag) {
  const meta = NATION_META[tag] || {};
  const displayName = meta.displayName && typeof meta.displayName === 'object' ? meta.displayName : {};
  const explicitAliases = Array.isArray(meta.aliases) ? meta.aliases : [];
  return uniqueSearchTerms([
    tag,
    ...explicitAliases,
    displayName.en,
    displayName.kor,
    ...Object.values(displayName),
    meta.friendlyName,
    meta.label,
    meta.name,
  ]);
}
function projectSearchAliases(project, entryLabel='') {
  const meta = PROJECT_META[project] || {};
  const displayName = meta.displayName && typeof meta.displayName === 'object' ? meta.displayName : {};
  return uniqueSearchTerms([
    project,
    String(project || '').replace(/^Project_/, ''),
    entryLabel,
    meta.label,
    meta.friendlyName,
    displayName.en,
    displayName.kor,
    ...Object.values(displayName),
  ]);
}
function nationClaimProjectSearchAliases(tag) {
  const data = CLAIMS_BY_NATION[tag] || {};
  const terms = [];
  for (const entry of data.projects || []) {
    if (!entry?.project) continue;
    terms.push(...projectSearchAliases(entry.project, entry.label));
  }
  return uniqueSearchTerms(terms);
}
function humanizeNationLabel(tag) {
  const displayName = nationDisplayName(tag);
  return `${displayName} / ${claimTierCountShortText(nationClaimTierCount(tag))}`;
}
function claimCardResearchLabel(entry, nation, {compact=false} = {}) {
  if (!entry?.project) return t(compact ? 'claimCard.researchBaselineValue' : 'claimCard.researchBaseline');
  const d = CLAIMS_BY_NATION[nation] || {};
  const baseSet = new Set(d.baseRegions || nationRegions.get(nation) || []);
  const tierByProject = countryProjectTierMap(nation, baseSet);
  const tier = countryProjectTier(entry, tierByProject) + 1;
  return t(compact ? 'claimCard.researchTierValue' : 'claimCard.researchTier', {tier});
}
function claimCardTitleParts(entry, kind) {
  const nation = kind === 'incoming' ? (entry.claimant || '') : getActiveNation();
  const nationName = nationDisplayName(nation);
  return {
    tag: nation || '-',
    nation: nationName || nation || '-',
    project: entry.project ? projectDisplay(entry.project) : t('claimCard.projectBaseline'),
    research: claimCardResearchLabel(entry, nation, {compact: true}),
  };
}
function claimCardTitle(entry, kind) {
  return t('claimCard.title', claimCardTitleParts(entry, kind));
}
function renderClaimCardTitle(entry, kind) {
  const parts = claimCardTitleParts(entry, kind);
  const fields = [
    ['nation', t('claimCard.fieldNation'), parts.nation],
    ['research', t('claimCard.fieldResearch'), parts.research],
    ['project', t('claimCard.fieldProject'), parts.project],
  ];
  return `<div class="claimCardTitle">${fields.map(([key, label, value]) => `<span class="claimCardTitleField claimCardTitleField--${key}"><span class="claimCardTitleLabel">${escapeHtml(label)}</span><b class="claimCardTitleValue">${escapeHtml(value)}</b></span>`).join('')}</div>`;
}
function buildNationChoices() {
  const tags = [...new Set([...REGIONS.map(r => r.nationTag), ...Object.keys(CLAIMS_BY_NATION), ...Object.keys(NATION_META)])].filter(Boolean).sort();
  derivedIndices.nationChoices = tags.map(tag => {
    const label = humanizeNationLabel(tag);
    const aliases = nationSearchAliases(tag);
    const projectAliases = nationClaimProjectSearchAliases(tag);
    return {tag, label, aliases, projectAliases, searchText: [label, ...aliases, ...projectAliases].join(' ').toLowerCase()};
  });
  nationChoices = derivedIndices.nationChoices;
  nationChoiceByValue.clear();
  for (const c of nationChoices) {
    nationChoiceByValue.set(c.label.toLowerCase(), c.tag);
    nationChoiceByValue.set(c.tag.toLowerCase(), c.tag);
    for (const alias of c.aliases || []) {
      const key = alias.toLowerCase();
      if (!nationChoiceByValue.has(key)) nationChoiceByValue.set(key, c.tag);
    }
  }
  derivedIndices.regionChoices = REGIONS.map(r => ({
    type:'region',
    id:r.id,
    tag:r.nationTag,
    regionName:r.regionName,
    label:`${localizedRegionName(r)} · ${r.nationTag}`,
    searchText:`${r.name} ${r.regionName} ${localizedRegionName(r)} ${prettyRegion(r.regionName)} ${r.primaryCity || ''} ${Object.values(r.displayName || {}).join(' ')} ${r.nationTag}`.toLowerCase(),
  }));
  regionChoices = derivedIndices.regionChoices;
}
function parseNationSearchValue(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  const direct = nationChoiceByValue.get(v.toLowerCase());
  if (direct) return direct;
  const tag = v.split(/[\s·-]+/, 1)[0]?.toUpperCase();
  if (tag && nationChoiceByValue.get(tag.toLowerCase())) return tag;
  return '';
}
function isSelectedNationSearch() {
  const tag = search.dataset.selectedNation || '';
  return !!tag && parseNationSearchValue(search.value) === tag;
}
function searchFilterText() {
  return isSelectedNationSearch() ? '' : search.value.trim().toLowerCase();
}

function nationChoiceMatchRank(choice, q) {
  const tag = choice.tag.toLowerCase();
  const aliases = (choice.aliases || []).map(alias => alias.toLowerCase());
  const projectAliases = (choice.projectAliases || []).map(alias => alias.toLowerCase());
  if (tag === q) return 0;
  if (aliases.some(alias => alias === q)) return 1;
  if (tag.startsWith(q) || aliases.some(alias => alias.startsWith(q))) return 2;
  if (choice.label.toLowerCase().startsWith(q)) return 3;
  if (projectAliases.some(alias => alias === q)) return 4;
  if (projectAliases.some(alias => alias.startsWith(q))) return 5;
  return 6;
}
function sortNationMatches(a, b, q) {
  return nationChoiceMatchRank(a, q) - nationChoiceMatchRank(b, q)
    || a.tag.localeCompare(b.tag)
    || a.label.localeCompare(b.label);
}
function matchingNationChoices(q, limit) {
  return nationChoices
    .filter(c => c.searchText.includes(q))
    .sort((a, b) => sortNationMatches(a, b, q))
    .slice(0, limit);
}

function visibleNationChoices() {
  const q = search.value.trim().toLowerCase();
  if (!q) return nationChoices.slice(0, 28).map(c => ({...c, type:'nation'}));
  const nationMatches = matchingNationChoices(q, 12).map(c => ({...c, type:'nation'}));
  const regionMatches = regionChoices.filter(c => c.searchText.includes(q)).slice(0, 16);
  return [...nationMatches, ...regionMatches].slice(0, 28);
}
function setDropdownExpanded(expanded) {
  search.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  if (nationDropdown) nationDropdown.hidden = !expanded;
}
function renderNationDropdown() {
  if (!nationDropdown) return;
  currentDropdownChoices = visibleNationChoices();
  if (!nationDropdownOpen) {
    setDropdownExpanded(false);
    return;
  }
  if (!currentDropdownChoices.length) {
    nationDropdown.innerHTML = `<div class="searchOption empty">${escapeHtml(t('search.noResults'))}</div>`;
    setDropdownExpanded(true);
    return;
  }
  if (highlightedNationChoiceIndex >= currentDropdownChoices.length) highlightedNationChoiceIndex = currentDropdownChoices.length - 1;
  if (highlightedNationChoiceIndex < -1) highlightedNationChoiceIndex = -1;
  nationDropdown.innerHTML = currentDropdownChoices.map((c, i) => {
    const selected = c.type === 'nation' ? search.dataset.selectedNation === c.tag : selectedRegionIds.has(c.regionName);
    const active = i === highlightedNationChoiceIndex;
    const tagText = c.type === 'region' ? t('search.regionTag') : c.tag;
    const labelText = c.type === 'region' ? c.label : c.label.replace(c.tag + ' · ', '');
    return `<button type="button" class="searchOption${active ? ' active' : ''}${selected ? ' selected' : ''}" role="option" aria-selected="${selected ? 'true' : 'false'}" data-index="${i}"><span class="searchOptionTag">${escapeHtml(tagText)}</span><span class="searchOptionLabel">${escapeHtml(labelText)}</span></button>`;
  }).join('');
  setDropdownExpanded(true);
}
function openNationDropdown() {
  nationDropdownOpen = true;
  renderNationDropdown();
}
function closeNationDropdown() {
  nationDropdownOpen = false;
  highlightedNationChoiceIndex = -1;
  renderNationDropdown();
}
function chooseNationFromDropdown(index=highlightedNationChoiceIndex) {
  const choice = currentDropdownChoices[index];
  if (!choice) return false;
  if (choice.type === 'region') {
    selectRegion(REGIONS[choice.id]);
  } else {
    focusNation(choice.tag);
  }
  closeNationDropdown();
  search.focus();
  return true;
}
function resetTransientClaimState() {
  clearTransientClaimAppState(appState);
  setSecondaryHoverNationState();
  setProjectFilterState('');
  setActiveIncomingClaimKeyState('');
  projectSel.value = '';
  if (claimModeSel.value === 'project') claimModeSel.value = 'all';
}
function resetHoverPreviewClaimState() {
  clearTransientClaimAppState(appState);
  setSecondaryHoverNationState();
  setProjectFilterState('');
  setActiveIncomingClaimKeyState('');
}
function shouldRenderCommittedNationDetails() {
  return !!getLockedNation();
}
function clearHoverClaimPreviewOverlay({force=false} = {}) {
  hoverClaimPreviewNation = '';
  replaceHoverClaimPreviewOverlayForKey(
    HOVER_CLAIM_PREVIEW_EMPTY_RENDER_KEY,
    () => document.createDocumentFragment(),
    {force}
  );
  syncClaimPresentationState();
}
function updateHoverNationPreview(nation) {
  if (getLockedNation()) return;
  const previewNation = nation || '';
  setActiveNationState('');
  hoverClaimPreviewNation = previewNation;
  if (!previewNation) {
    visibleNationRegionNames = new Set();
    clearHoverClaimPreviewOverlay({force: true});
    setClaimsPillEmpty();
    renderHoverOutlines();
    renderCapitalMarkers();
    return;
  }
  const overlayModel = getNationOverlayModel(activeData, derivedIndices, previewNation, {cacheKey: 'hover-preview'});
  visibleNationRegionNames = new Set(overlayModel.resultSet);
  const overlayDescriptorSet = getClaimOverlayDescriptorSet(overlayModel);
  replaceHoverClaimPreviewOverlayForKey(
    hoverClaimPreviewRenderKey(overlayModel, overlayDescriptorSet, worldCopyContexts),
    () => markHoverClaimPreviewFragment(createClaimOverlayPathFragment(overlayDescriptorSet.descriptors, {copyContexts: worldCopyContexts}))
  );
  syncClaimPresentationState();
  renderClaimSummaryPill(overlayModel);
  renderHoverOutlines();
  renderCapitalMarkers();
}
function cancelPendingHoverPreview() {
  if (hoverPreviewFrame) {
    window.cancelAnimationFrame(hoverPreviewFrame);
    hoverPreviewFrame = 0;
  }
  pendingHoverNation = '';
}
function setHoverPreviewNation(nation) {
  if (getLockedNation()) return;
  const nextNation = nation || '';
  if (hoverClaimPreviewNation === nextNation && !getActiveNation()) return;
  setHoverNationState(nextNation);
  resetHoverPreviewClaimState();
  updateHoverNationPreview(getHoverNation());
}
function scheduleHoverPreviewNation(nation) {
  if (getLockedNation()) return;
  const nextNation = nation || '';
  if (hoverClaimPreviewNation === nextNation && !getActiveNation()) return;
  pendingHoverNation = nextNation;
  if (hoverPreviewFrame) return;
  hoverPreviewFrame = window.requestAnimationFrame(() => {
    hoverPreviewFrame = 0;
    const next = pendingHoverNation;
    pendingHoverNation = '';
    if (!getLockedNation() && next) setHoverPreviewNation(next);
  });
}
function clearHoverPreview() {
  cancelPendingHoverPreview();
  hideRegionTooltip();
  const previousRegionName = getHoveredRegionName();
  const useHoverDelta = canUseSimpleHoverClearDelta(previousRegionName);
  setHoverPill();
  setHoveredRegionState();
  setHoverVisualState();
  setSecondaryHoverNationState();
  if (useHoverDelta) applyMapVisualStateForRegions([previousRegionName]);
  else applyMapVisualState();
  renderHoverOutlines();
  syncReachableCapitalCandidateHoverState();
  if (getLockedNation()) {
    setHoverNationState();
    renderCapitalMarkers();
    return;
  }
  if (!getHoverNation() && !getActiveNation()) return;
  setHoverNationState();
  resetHoverPreviewClaimState();
  updateHoverNationPreview('');
}
function buildIncomingClaimIndex() {
  incomingClaimsByRegion.clear();
  for (const [claimant, data] of Object.entries(CLAIMS_BY_NATION)) {
    const claimantBaseRegions = [...new Set(data.baseRegions || nationRegions.get(claimant) || [])];
    const directEntries = sortedProjectEntries(data.projects || []);
    const cumulativeByKey = new Map(cumulativeClaimEntries(directEntries).map(e => [entryFilterValue(e), e]));
    for (const entry of directEntries) {
      const label = entry.label || projectDisplay(entry.project);
      if (isExcludedSystemClaim(claimant, entry.project, label)) continue;
      const entryRegions = [...new Set(entry.regions || [])];
      const directEntryClaims = entry.claims || {};
      const cumulative = cumulativeByKey.get(entryFilterValue(entry)) || entry;
      const cumulativeRegions = [...new Set(cumulative.regions || entryRegions)];
      const cumulativeClaims = cumulative.claims || directEntryClaims;
      const resultRegions = [...new Set([...claimantBaseRegions, ...cumulativeRegions])].filter(Boolean).sort();
      const resultClaimRegions = cumulativeRegions.filter(rn => !claimantBaseRegions.includes(rn));
      const resultRegionSourceLabels = cumulative.regionSourceLabels || {};
      for (const rn of entryRegions) {
        const claim = directEntryClaims?.[rn] || {};
        if (!incomingClaimsByRegion.has(rn)) incomingClaimsByRegion.set(rn, []);
        incomingClaimsByRegion.get(rn).push({
          claimant,
          project: entry.project || '',
          label,
          region: rn,
          claim,
          claimantBaseRegions,
          entryRegions,
          entryClaims: cumulativeClaims,
          resultRegions,
          resultClaimRegions,
          resultRegionSourceLabels,
        });
      }
    }
  }
}
function incomingTargetRegions(data, baseSet) {
  const selected = [...selectedRegionIds].filter(Boolean);
  if (selected.length) return new Set(selected);
  const targetRegions = new Set(baseSet);
  if (!targetRegions.size) {
    for (const rn of data.capitalRegions || []) targetRegions.add(rn);
    for (const rn of data.gatedRegions || []) targetRegions.add(rn);
  }
  return targetRegions;
}
function outgoingClaimKey(item) {
  return item?.project || '__base__';
}
function incomingClaimKey(item) {
  return `${item?.claimant || ''}|${item?.project || '__base__'}`;
}
function selectedIncomingEntry(entries) {
  const activeIncomingClaimKey = getActiveIncomingClaimKey();
  if (!activeIncomingClaimKey) return null;
  return entries.find(e => incomingClaimKey(e) === activeIncomingClaimKey) || null;
}
function incomingClaimsForTarget(targetNation, data, baseSet) {
  const targetRegions = incomingTargetRegions(data, baseSet);
  const grouped = new Map();
  for (const rn of targetRegions) {
    for (const item of incomingClaimsByRegion.get(rn) || []) {
      if (item.claimant === targetNation) continue;
      const key = incomingClaimKey(item);
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...item,
          key,
          targetRegions: [],
          regions: [],
          claims: {},
          targetClaims: {},
          hostile: 0,
          gated: 0,
          capital: 0,
        });
      }
      const g = grouped.get(key);
      if (!g.targetRegions.includes(rn)) g.targetRegions.push(rn);
      g.targetClaims[rn] = item.claim || {};
      if (item.claim?.hostileClaim) g.hostile += 1;
      if (item.claim?.gatedClaim) g.gated += 1;
      if (item.claim?.capitalClaim) g.capital += 1;
      g.regions = [...new Set(item.resultClaimRegions || item.entryRegions || [])].filter(Boolean).sort();
      g.claims = item.entryClaims || {};
      g.resultRegions = [...new Set(item.resultRegions || item.entryRegions || [])].filter(Boolean).sort();
      g.claimantBaseRegions = [...new Set(item.claimantBaseRegions || [])].filter(Boolean).sort();
      g.regionSourceLabels = item.resultRegionSourceLabels || {};
    }
  }
  return [...grouped.values()].sort((a,b) => a.claimant.localeCompare(b.claimant) || projectSortLabel(a.project).localeCompare(projectSortLabel(b.project)));
}
function selectedRegionSummary() {
  const names = [...selectedRegionIds].filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) {
    const rn = names[0];
    const r = regionByName[rn];
    return t('selected.region', {region: localizedRegionName(r || rn), nation: r?.nationTag ? ' · '+r.nationTag : ''});
  }
  return t('selected.regions', {count: names.length});
}
function pinnedCapitalClaimants(regionName) {
  return [...new Set(derivedIndices.capitalNationsByRegion?.get?.(regionName) || [])].filter(Boolean);
}
function pinnedExpansionClaimants(regionName) {
  const claimants = pinnedCapitalClaimants(regionName);
  const preferredClaimant = getPinnedCapitalClaimant(regionName);
  if (preferredClaimant && claimants.includes(preferredClaimant)) return [preferredClaimant];
  return claimants;
}
function pinnedRegionCapitalSummary(regionName) {
  const claimants = pinnedExpansionClaimants(regionName);
  if (!claimants.length) return t('expansionNodes.noCapitalClaimant');
  const names = claimants.map(nation => nationDisplayName(nation));
  if (claimants.length === 1) return t('expansionNodes.capitalClaimant', {nation: names[0]});
  return t('expansionNodes.capitalClaimants', {
    count: formatNumber(claimants.length),
    nations: names.slice(0, 3).join(', ') + (names.length > 3 ? `, +${names.length - 3}` : ''),
  });
}
function pinnedRegionOwnerSummary(region) {
  return region?.nationTag ? t('expansionNodes.owner', {nation: nationDisplayName(region.nationTag)}) : '';
}
function pinnedRegionRow(regionName) {
  const region = regionByName[regionName];
  const label = localizedRegionName(region || regionName);
  const owner = pinnedRegionOwnerSummary(region);
  const capital = pinnedRegionCapitalSummary(regionName);
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
      <button type="button" class="pinnedRegionUnpin" data-pinned-unpin="${escapeHtml(regionName)}" title="${escapeHtml(t('expansionNodes.unpinRegion', {region: label}))}" aria-label="${escapeHtml(t('expansionNodes.unpinRegion', {region: label}))}">×</button>
    </div>
  `;
}
function focusPinnedRegion(regionName) {
  const region = regionByName[regionName];
  if (!region) return;
  if (getLockedNation() || getActiveNation()) {
    focusRegions([regionName], {selectSingle: true, preserveNation: true, refreshOverlay: true});
    return;
  }
  selectRegion(region);
}
function bindPinnedRegionsPanelEvents() {
  if (!pinnedRegionsPanel) return;
  pinnedRegionsPanel.querySelectorAll('[data-pinned-focus]').forEach(button => {
    button.addEventListener('click', () => focusPinnedRegion(button.dataset.pinnedFocus));
  });
  pinnedRegionsPanel.querySelectorAll('[data-pinned-unpin]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      unpinPinnedRegionState(button.dataset.pinnedUnpin);
    });
  });
  pinnedRegionsPanel.querySelector('[data-pinned-clear]')?.addEventListener('click', event => {
    event.stopPropagation();
    clearPinnedRegionState();
  });
}
function renderPinnedRegionsPanel() {
  if (!pinnedRegionsPanel) return;
  const pinned = [...getPinnedRegionIds()].filter(regionName => regionByName[regionName]);
  if (!pinned.length) {
    pinnedRegionsPanel.innerHTML = `<div class="pinnedRegionEmpty small">${escapeHtml(t('expansionNodes.empty'))}</div>`;
    return;
  }
  const rows = pinned.map(pinnedRegionRow).join('');
  pinnedRegionsPanel.innerHTML = `
    <div class="pinnedRegionToolbar">
      <span class="pinnedRegionCount">${escapeHtml(t('expansionNodes.count', {count: formatNumber(pinned.length)}))}</span>
      <button type="button" class="pinnedRegionClear" data-pinned-clear>${escapeHtml(t('expansionNodes.clear'))}</button>
    </div>
    <div class="pinnedRegionList">${rows}</div>
  `;
  bindPinnedRegionsPanelEvents();
}
function refreshPinnedRegionOutputs(changedRegionIds = []) {
  const changed = [...new Set((changedRegionIds || []).filter(Boolean))];
  syncPinnedVisualState();
  if (changed.length) applyMapVisualStateForRegions(changed);
  else applyMapVisualState();
  renderPinnedRegionsPanel();
  renderPinnedRegionMarkers();
  renderManualEnvelopeOverlay(currentOverlayModel);
  refreshReachableCapitalCandidateOutputs(currentOverlayModel);
}
function appendRegionHighlight(frag, r, classPrefix, copyContext = defaultWorldCopyContext()) {
  for (const suffix of ['fill', 'outline-glow', 'outline']) {
    const p = createRegionPath(r, {class: `${classPrefix}-${suffix}`}, {
      id: null,
      nation: null,
      ...worldCopyDataset(copyContext),
    });
    frag.appendChild(p);
  }
}
function appendSelectedRegionMarker(frag, r, {
  showDot = true,
  showLabel = true,
  copyContext = defaultWorldCopyContext(),
  dotClassName = '',
  labelClassName = '',
} = {}) {
  const lab = labelPosition(r);
  if (!lab) return;
  const copyData = worldCopyDataset(copyContext);
  if (showDot) {
    const dot = createSvgElement('circle', {
      class: `selection-dot${dotClassName ? ` ${dotClassName}` : ''}`,
      cx: lab.x,
      cy: lab.y,
      r: '.032',
    }, {region: r.regionName, ...copyData});
    frag.appendChild(dot);
  }
  if (!showLabel) return;
  const text = createSvgElement('text', {
    class: `selection-label${labelClassName ? ` ${labelClassName}` : ''}`,
    x: lab.x,
    y: lab.y - 0.052,
    textContent: localizedRegionName(r),
  }, {region: r.regionName, ...copyData});
  frag.appendChild(text);
}
function pinnedRegionMarkerRenderKey(pinned, {copyContexts = worldCopyContexts, selectedPinnedRegions = []} = {}) {
  if (!pinned.length) return PINNED_REGION_MARKERS_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'pinned-region-markers',
    copyPlan: copyContextRenderKey(copyContexts),
    language: currentLanguage,
    selectedPinnedRegions,
    pinned,
  });
}
function appendPinnedRegionMarker(frag, region, index, {copyContext = defaultWorldCopyContext(), showLabel = true} = {}) {
  const lab = labelPosition(region);
  if (!lab) return;
  const label = localizedRegionName(region);
  const isCapital = pinnedExpansionClaimants(region.regionName).length > 0;
  const group = createSvgElement('g', {
    class: `pinned-node-marker-group${isCapital ? ' capital-marker is-selected' : ''}`,
    'aria-label': t('expansionNodes.marker', {index: formatNumber(index), region: label}),
  }, {
    region: region.regionName,
    pinIndex: index,
    ...worldCopyDataset(copyContext),
  });
  if (isCapital) {
    const points = starPoints(lab.x, lab.y);
    group.appendChild(createSvgElement('polygon', {
      class: 'capital-star-shadow',
      points,
      'aria-hidden': 'true',
    }));
    group.appendChild(createSvgElement('polygon', {
      class: 'capital-star',
      points,
    }));
  }
  appendSelectedRegionMarker(group, region, {
    showDot: !isCapital,
    showLabel,
    copyContext,
    dotClassName: 'pinned-node-dot',
    labelClassName: 'pinned-node-label',
  });
  frag.appendChild(group);
}
function createPinnedRegionMarkerFragment(pinned, {copyContexts=worldCopyContexts, selectedPinnedRegions=[]} = {}) {
  const selectedPinnedRegionSet = new Set(selectedPinnedRegions);
  return createProjectedCopyFragment(copyContexts, 'pinned-region-marker-copy', copyContext => {
    const frag = document.createDocumentFragment();
    pinned.forEach((regionName, index) => {
      const region = regionByName[regionName];
      if (!region) return;
      appendRegionHighlight(frag, region, 'pinned', copyContext);
      appendPinnedRegionMarker(frag, region, index + 1, {
        copyContext,
        showLabel: !selectedPinnedRegionSet.has(regionName),
      });
    });
    return frag;
  });
}
function renderPinnedRegionMarkers({copyContexts=worldCopyContexts} = {}) {
  if (!gPinnedRegionMarkers) return;
  const pinned = [...getPinnedRegionIds()].filter(regionName => regionByName[regionName]);
  const selectedPinnedRegions = pinned.filter(regionName => selectedRegionIds.has(regionName));
  replaceLayerChildrenForRenderKey(
    gPinnedRegionMarkers,
    pinnedRegionMarkerLayerRenderKeys,
    pinnedRegionMarkerRenderKey(pinned, {copyContexts, selectedPinnedRegions}),
    () => createPinnedRegionMarkerFragment(pinned, {copyContexts, selectedPinnedRegions}),
    'pinnedRegionMarkerRebuilds'
  );
}
function shouldShowForeignHoverNationOverlay(region) {
  if (!region?.nationTag) return false;
  const pinnedNation = getLockedNation() || getActiveNation();
  if (!pinnedNation) return false;
  const scope = buildActiveExpansionScope(currentOverlayModel);
  if (scope.regionSet?.has?.(region.regionName)) return false;
  return region.nationTag !== pinnedNation;
}
function resolveSecondaryCapitalPreviewNation(region) {
  const selectedNation = getLockedNation() || getActiveNation();
  if (!selectedNation || !region?.regionName || !currentOverlayModel?.hasClaimOverlay) return '';
  return resolveCapitalClaimantForRegion(region.regionName, buildActiveExpansionScope(currentOverlayModel));
}
function updateSecondaryCapitalPreview(region) {
  const nextNation = resolveSecondaryCapitalPreviewNation(region);
  if (getSecondaryHoverNation() === nextNation) return false;
  setSecondaryHoverNationState(nextNation);
  return true;
}
function refreshSecondaryCapitalPreviewForHoveredRegion() {
  const regionName = getHoveredRegionName();
  return updateSecondaryCapitalPreview(regionName ? regionByName[regionName] : null);
}
function secondaryCapitalFillOpacity(fillOpacity) {
  const base = Number(fillOpacity);
  if (!Number.isFinite(base)) return SECONDARY_CAPITAL_BASE_TERRITORY_OPACITY;
  return Math.min(SECONDARY_CAPITAL_BASE_TERRITORY_OPACITY, base + SECONDARY_CAPITAL_TIER_OPACITY_BOOST);
}
function appendForeignHoverRegion(frag, region, className, attrs={}, copyContext = defaultWorldCopyContext(), {variant='foreign'} = {}) {
  if (!region?.path) return;
  const {fillOpacity, ...dataAttrs} = attrs;
  const secondary = variant === 'secondary-capital';
  const p = createRegionPath(region, {
    class: `${className}${secondary ? ' secondary-capital-preview' : ''}`,
    fill: secondary ? SECONDARY_CAPITAL_OVERLAY_COLOR : HOVER_NATION_OVERLAY_COLOR,
    'fill-opacity': secondary
      ? secondaryCapitalFillOpacity(fillOpacity)
      : fillOpacity ?? HOVER_NATION_BASE_TERRITORY_OPACITY,
  }, {id: null, nation: null, preview: variant, ...dataAttrs, ...worldCopyDataset(copyContext)});
  frag.appendChild(p);
}
function queueForeignHoverDescriptor(candidates, region, className, attrs={}) {
  if (!region?.path) return;
  const fillOpacity = attrs.fillOpacity ?? HOVER_NATION_BASE_TERRITORY_OPACITY;
  const existing = candidates.get(region.regionName);
  if (existing && existing.fillOpacity >= fillOpacity) return;
  candidates.set(region.regionName, {
    region: region.regionName,
    className,
    attrs: {...attrs, fillOpacity},
    fillOpacity,
  });
}
function foreignHoverDescriptorCacheKey(nation) {
  return JSON.stringify({
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, derivedIndices),
    nation: nation || '',
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
  });
}
function buildForeignHoverOverlayDescriptorSet(nation, cacheKey) {
  recordRenderStat('foreignHoverDescriptorBuilds');
  if (!nation || claimModeSel.value === 'off') return {cacheKey, descriptors: []};
  const data = CLAIMS_BY_NATION[nation] || {nation, baseRegions:nationRegions.get(nation)||[], projects:[]};
  const baseSet = new Set(data.baseRegions || nationRegions.get(nation) || []);
  const tierByProject = countryProjectTierMap(nation, baseSet);
  const candidates = new Map();
  for (const rn of baseSet) {
    queueForeignHoverDescriptor(
      candidates,
      regionByName[rn],
      'foreign-hover-overlay foreign-hover-base',
      {nation, tier:'base', fillOpacity:HOVER_NATION_BASE_TERRITORY_OPACITY}
    );
  }
  for (const entry of getClaimKindFilteredProjectEntries(nation)) {
    const visibleClaimRegions = (entry.regions || []).filter(rn => !baseSet.has(rn));
    if (!visibleClaimRegions.length) continue;
    const tier = countryProjectTier(entry, tierByProject);
    const fillOpacity = hoverNationProjectOpacity(entry.project, tier);
    const tierLabel = entry.project ? String(tier + 1) : 'basic';
    for (const rn of visibleClaimRegions) {
      queueForeignHoverDescriptor(
        candidates,
        regionByName[rn],
        `foreign-hover-overlay ${entry.project ? 'foreign-hover-research' : 'foreign-hover-basic'}`,
        {nation, tier:tierLabel, project:entry.project || 'base', fillOpacity}
      );
    }
  }
  return {
    cacheKey,
    descriptors: [...candidates.values()],
  };
}
function getForeignHoverOverlayDescriptorSet(nation) {
  const cacheKey = foreignHoverDescriptorCacheKey(nation);
  const cached = getCachedLruValue(foreignHoverDescriptorCache, cacheKey, 'foreignHoverDescriptorCacheHits');
  if (cached) return cached;
  return setCachedLruValue(
    foreignHoverDescriptorCache,
    cacheKey,
    buildForeignHoverOverlayDescriptorSet(nation, cacheKey),
    FOREIGN_HOVER_DESCRIPTOR_CACHE_LIMIT
  );
}
function appendForeignHoverNationOverlay(frag, descriptorSet, copyContext = defaultWorldCopyContext(), options = {}) {
  for (const descriptor of descriptorSet?.descriptors || []) {
    appendForeignHoverRegion(frag, regionByName[descriptor.region], descriptor.className, descriptor.attrs, copyContext, options);
  }
}
function replaceForeignHoverOverlayForKey(nextKey, buildChildren, {force=false} = {}) {
  if (!gForeignHoverOverlays) return;
  if (!force && nextKey === foreignHoverVisualKey) return;
  foreignHoverVisualKey = nextKey;
  recordRenderStat('foreignHoverOverlayReplacements');
  replaceLayerChildren(gForeignHoverOverlays, buildChildren());
}
function replaceSecondaryHoverOverlayForKey(nextKey, buildChildren, {force=false} = {}) {
  if (!gSecondaryHoverOverlays) return;
  if (!force && nextKey === secondaryHoverVisualKey) return;
  secondaryHoverVisualKey = nextKey;
  recordRenderStat('secondaryHoverOverlayReplacements');
  replaceLayerChildren(gSecondaryHoverOverlays, buildChildren());
}
function hoverClaimPreviewRenderKey(model, descriptorSet, copyContexts = worldCopyContexts) {
  if (!model) return HOVER_CLAIM_PREVIEW_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'hover-claim-preview',
    copyPlan: copyContextRenderKey(copyContexts),
    descriptorKey: descriptorSet?.cacheKey || '',
  });
}
function markHoverClaimPreviewFragment(fragment, nation = hoverClaimPreviewNation) {
  for (const el of fragment.querySelectorAll?.('.claim-overlay, .claim-fill-group') || []) {
    el.dataset.preview = 'hover-claim';
    if (nation) el.dataset.nation = nation;
  }
  return fragment;
}
function replaceHoverClaimPreviewOverlayForKey(nextKey, buildChildren, {force=false} = {}) {
  if (!gHoverClaimPreviewOverlays) return;
  if (!force && nextKey === hoverClaimPreviewVisualKey) return;
  hoverClaimPreviewVisualKey = nextKey;
  recordRenderStat('hoverClaimPreviewOverlayReplacements');
  replaceLayerChildren(gHoverClaimPreviewOverlays, buildChildren());
}
function replaceHoverOutlinesForKey(nextKey, buildChildren, {force=false} = {}) {
  if (!gHoverOutlines) return;
  if (!force && nextKey === hoverOutlineVisualKey) return;
  hoverOutlineVisualKey = nextKey;
  recordRenderStat('hoverOutlineReplacements');
  replaceLayerChildren(gHoverOutlines, buildChildren());
}
function renderHoverOutlines({force=false, copyContexts=worldCopyContexts} = {}) {
  const rn = getHoveredRegionName();
  const r = rn ? regionByName[rn] : null;
  const hidden = !rn || selectedRegionIds.has(rn) || !r;
  const secondaryNation = getSecondaryHoverNation();
  const secondary = !hidden && !!secondaryNation;
  const foreign = !hidden && !secondary && shouldShowForeignHoverNationOverlay(r);
  const copyKey = copyContextRenderKey(copyContexts);
  const foreignDescriptorSet = foreign ? getForeignHoverOverlayDescriptorSet(r.nationTag) : null;
  const secondaryDescriptorSet = secondary ? getForeignHoverOverlayDescriptorSet(secondaryNation) : null;
  const foreignKey = foreign
    ? `${copyKey}|foreign|${foreignDescriptorSet.cacheKey}|${getLockedNation() || getActiveNation()}|${visibleNationRegionNames.has(rn) ? 1 : 0}`
    : FOREIGN_HOVER_EMPTY_RENDER_KEY;
  const secondaryKey = secondary
    ? `${copyKey}|secondary-capital|${secondaryDescriptorSet.cacheKey}|${getLockedNation() || getActiveNation()}|${visibleNationRegionNames.has(rn) ? 1 : 0}`
    : SECONDARY_HOVER_EMPTY_RENDER_KEY;
  const hoverKey = !hidden && !foreign && !secondary
    ? `${copyKey}|region|${rn}|${getLockedNation() || getActiveNation()}|${selectedRegionIds.has(rn) ? 1 : 0}`
    : HOVER_OUTLINE_EMPTY_RENDER_KEY;
  replaceForeignHoverOverlayForKey(foreignKey, () => {
    if (!foreign) return document.createDocumentFragment();
    return createProjectedCopyFragment(copyContexts, 'foreign-hover-copy', copyContext => {
      const frag = document.createDocumentFragment();
      appendForeignHoverNationOverlay(frag, foreignDescriptorSet, copyContext, {variant: 'foreign'});
      return frag;
    });
  }, {force});
  replaceSecondaryHoverOverlayForKey(secondaryKey, () => {
    if (!secondary) return document.createDocumentFragment();
    return createProjectedCopyFragment(copyContexts, 'secondary-hover-copy', copyContext => {
      const frag = document.createDocumentFragment();
      appendForeignHoverNationOverlay(frag, secondaryDescriptorSet, copyContext, {variant: 'secondary-capital'});
      return frag;
    });
  }, {force});
  replaceHoverOutlinesForKey(hoverKey, () => {
    if (hidden || foreign || secondary) return document.createDocumentFragment();
    return createProjectedCopyFragment(copyContexts, 'hover-outline-copy', copyContext => {
      const frag = document.createDocumentFragment();
      appendRegionHighlight(frag, r, 'hover', copyContext);
      return frag;
    });
  }, {force});
}
function renderSelectionOutlines({copyContexts=worldCopyContexts} = {}) {
  if (!gSelectionOutlines) return;
  replaceLayerChildren(gSelectionOutlines);
  gSelectionOutlines.appendChild(createProjectedCopyFragment(copyContexts, 'selection-outline-copy', copyContext => {
    const frag = document.createDocumentFragment();
    for (const rn of selectedRegionIds) {
      const r = regionByName[rn];
      if (!r) continue;
      appendRegionHighlight(frag, r, 'selection', copyContext);
      appendSelectedRegionMarker(frag, r, {showDot: !selectedRegionIsCapital(rn), copyContext});
    }
    return frag;
  }));
}
function updateSelectedRegions({bounded = false, changedRegionIds: changed = []} = {}) {
  syncSelectedVisualState();
  if (bounded && changed.length) applyMapVisualStateForRegions(changed);
  else applyMapVisualState();
  renderHoverOutlines();
  renderSelectionOutlines();
  renderPinnedRegionMarkers();
  renderCapitalMarkers();
  const label = selectedRegionSummary();
  if (selectedPill) {
    selectedPill.textContent = label;
    selectedPill.style.display = label ? '' : 'none';
  }
}
function claimRegionSummary(claim) {
  if (!claim || !Object.keys(claim).length) return '';
  const parts = [];
  parts.push(claim?.hostileClaim ? t('claim.hostile') : t('claim.peaceful'));
  if (claim?.capitalClaim) parts.push(t('claim.capital'));
  if (claim?.gatedClaim) parts.push(t('claim.gated'));
  return parts.join(' · ');
}
function renderRegionList(regionNames, claims={}, prefix='targets', regionSourceLabels={}) {
  const rows = (regionNames || []).map((rn) => {
    const claim = claims?.[rn] || {};
    const meta = claimRegionSummary(claim);
    const source = regionSourceLabels?.[rn] ? regionSourceLabels[rn] : '';
    const region = regionByName[rn];
    const owner = region?.nationTag ? ` · ${region.nationTag}` : '';
    const active = selectedRegionIds.has(rn);
    const detail = t('regionList.detail', {
      prefix: t(`regionPrefix.${prefix}`) || prefix,
      owner,
      meta: meta ? ` · ${meta}` : '',
      source: source ? ` · ${source}` : '',
    });
    return `<div class="legendRegionRow"><button type="button" class="legendRegionItem${active ? ' active' : ''}" data-region-name="${escapeHtml(rn)}"><b>${escapeHtml(localizedRegionName(region || rn))}</b><span>${escapeHtml(detail)}</span></button></div>`;
  }).join('');
  return `<div class="legendRegionList">${rows}</div>`;
}
function focusRegions(regionNames, {selectSingle=false, preserveNation=false, refreshOverlay=false} = {}) {
  const names = (regionNames || []).filter(Boolean);
  if (selectSingle && names.length === 1) {
    const region = regionByName[names[0]];
    if (region) {
      if (preserveNation && getActiveNation()) {
        setSelectedRegionIds([region.regionName]);
        setFocusedRegionState(region.regionName);
        updateSelectedRegions();
        // TODO: Future mapView pan/zoom support should keep this focused region visible.
        if (refreshOverlay) updateNationOverlay(getActiveNation());
        return;
      }
      selectRegion(region);
      return;
    }
  }
  setSelectedRegionIds(names);
  setFocusedRegionState(names.length === 1 ? names[0] : '');
  // TODO: Future mapView pan/zoom support should keep these focused regions visible.
  updateSelectedRegions();
  if (refreshOverlay && getActiveNation()) updateNationOverlay(getActiveNation());
}
function clearSelection({clearSearch=true} = {}) {
  const clearedPins = [...getPinnedRegionIds()];
  clearSelectionState(appState);
  updateReachableCapitalsButtonState();
  setActiveNationState();
  setHoverNationState();
  setSecondaryHoverNationState();
  setHoveredRegionState();
  setFocusedRegionState();
  setHoverVisualState();
  setLockedNationState();
  setSelectedRegionIds();
  setProjectFilterState('');
  setActiveIncomingClaimKeyState('');
  projectSel.value = '';
  claimModeSel.value = 'all';
  cancelPendingHoverPreview();
  hideRegionTooltip();
  if (clearSearch) {
    search.value = '';
    search.dataset.selectedNation = '';
  }
  setHoverPill();
  updateNationOverlay('', {renderDetails: true, updateFilters: false, updateSelected: false});
  applyFilters(true);
  updateSelectedRegions();
  refreshPinnedRegionOutputs(clearedPins);
}
function clearPinsOrSelection() {
  clearSelection();
}
function unpinClickedPinnedRegion(region) {
  const regionName = region?.regionName || '';
  if (!regionName || !getPinnedRegionIds().has(regionName)) return false;
  unpinPinnedRegionState(regionName);
  refreshSecondaryCapitalPreviewForHoveredRegion();
  renderHoverOutlines();
  renderCapitalMarkers();
  return true;
}
function focusNation(nation, {fillSearch=true} = {}) {
  if (!nation) { clearSelection({clearSearch:fillSearch}); return; }
  cancelPendingHoverPreview();
  setLockedNationState(nation);
  setHoverNationState();
  setSecondaryHoverNationState();
  setProjectFilterState('');
  setActiveIncomingClaimKeyState('');
  if (fillSearch) {
    search.value = humanizeNationLabel(nation);
    search.dataset.selectedNation = nation;
  }
  closeNationDropdown();
  projectSel.value = '';
  if (claimModeSel.value === 'project') claimModeSel.value = 'all';
  updateNationOverlay(nation);
  applyFilters(true);
  updateSelectedRegions();
}
function renderClaimSection(title, items, emptyText, kind) {
  const sectionKey = kind === 'incoming' ? 'incoming' : 'outgoing';
  if (!items.length) return `<details class="infoSubsection claimSection" data-info-section="${sectionKey}"${infoSectionOpenAttribute(sectionKey)}><summary><span>${escapeHtml(title)}</span></summary><div class="infoSubsectionBody small">${escapeHtml(emptyText)}</div></details>`;
  const activeOutgoing = claimModeSel.value === 'project' ? getProjectFilter() : '';
  const rows = items.map((item, i) => {
    const project = item.project || '';
    const regions = item.regions || [];
    const targetRegions = kind === 'incoming' ? (item.targetRegions || regions) : regions;
    const detailRegions = kind === 'incoming' ? (item.resultRegions || regions) : regions;
    const detailClaims = item.claims || {};
    const hostile = item.hostile ?? targetRegions.filter(rn => item.targetClaims?.[rn]?.hostileClaim || item.claims?.[rn]?.hostileClaim).length;
    const gated = item.gated ?? targetRegions.filter(rn => item.targetClaims?.[rn]?.gatedClaim || item.claims?.[rn]?.gatedClaim).length;
    const capital = item.capital ?? targetRegions.filter(rn => item.targetClaims?.[rn]?.capitalClaim || item.claims?.[rn]?.capitalClaim).length;
    const claimTitle = claimCardTitle(item, kind);
    const claimTitleHtml = renderClaimCardTitle(item, kind);
    const key = kind === 'incoming' ? incomingClaimKey(item) : outgoingClaimKey(item);
    const active = kind === 'incoming' ? getActiveIncomingClaimKey() === key : activeOutgoing === key;
    const targetNames = targetRegions.map(prettyRegion);
    const targetPreview = targetNames.slice(0, 4).join(', ') + (targetNames.length > 4 ? `, +${targetNames.length - 4}` : '');
    const direction = kind === 'incoming'
      ? t('claimDirection.incoming', {targets: targetPreview || t('claimDirection.selectedRegion'), regions: regionCountText(detailRegions.length)})
      : t('claimDirection.outgoing', {targets: targetPreview || t('claimDirection.noTargets')});
    const inherited = item.inheritedClaimCount || item.inheritedRegions?.length || 0;
    const direct = item.directClaimCount || item.directRegions?.length || regions.length;
    const cumulativeText = kind === 'outgoing' && inherited ? t('claimDirection.cumulative', {direct, inherited}) : '';
    const statsText = `${hostile ? t('claimStat.hostile', {count: hostile}) : ''}${capital ? t('claimStat.capital', {count: capital}) : ''}${gated ? t('claimStat.gated', {count: gated}) : ''}`;
    const regionDetails = active ? renderRegionList(detailRegions, detailClaims, kind === 'incoming' ? 'result' : 'claimed', item.regionSourceLabels || {}) : '';
    return `<div class="claimListGroup${active ? ' active' : ''}"><button type="button" class="claimListItem${active ? ' active' : ''}" data-claim-kind="${kind}" data-claim-index="${i}" data-claim-key="${escapeHtml(key)}" title="${escapeHtml(claimTitle + ' · ' + detailRegions.map(prettyRegion).join(', '))}">${claimTitleHtml}<span class="claimListMeta">${escapeHtml(direction + cumulativeText + statsText)}</span></button>${regionDetails}</div>`;
  }).join('');
  return `<details class="infoSubsection claimSection" data-info-section="${sectionKey}"${infoSectionOpenAttribute(sectionKey)}><summary><span>${escapeHtml(title)}</span></summary><div class="infoSubsectionBody claimList">${rows}</div></details>`;
}



function renderGrid(renderContext = {}) {
  const start = debugRenderStats ? performance.now() : 0;
  renderGridLayer({
    layer: gGrid,
    mapView: renderContext.mapView || mapView,
    copyContexts: renderContext.copyContexts || worldCopyContexts,
  });
  if (debugRenderStats) {
    recordRenderTiming('gridRenderMs', performance.now() - start);
    if (renderContext.isPan) recordRenderStat('gridRebuildsDuringPan');
  }
}
function renderNormalRegionColors(renderContext = {}) {
  if (!gNormalRegionColors) return;
  const copyContexts = normalizeWorldCopyContexts(renderContext.copyContexts || worldCopyContexts);
  const baseMode = baseModeSel.value || 'nation';
  const descriptors = REGIONS
    .filter(region => !mapVisualState.hiddenRegionIds.has(region.regionName))
    .map(region => {
      const fill = colorFor(region);
      const fillKey = `base:${baseMode}:${fill}`;
      return {
        path: region.path,
        className: 'normal-region-color visual-fill-group',
        fill,
        groupKey: fillKey,
        dataset: {fillKey},
      };
    });
  normalRegionColorElements.length = 0;
  const frag = createGroupedVisualFillFragment({
    descriptors,
    copyContexts,
    copyGroupClassName: 'normal-region-color-copy',
  });
  normalRegionColorElements.push(...frag.querySelectorAll?.('.normal-region-color') || []);
  replaceLayerChildren(gNormalRegionColors, frag);
}
function syncNormalRegionColorVisibility() {
  renderNormalRegionColors();
}
function renderRegions(renderContext = {}) {
  renderRegionLayers({
    layer: gRegions,
    hitLayer: gHitRegions,
    labelLayer: gLabels,
    indices: derivedIndices,
    copyContexts: renderContext.copyContexts || worldCopyContexts,
    pathByRegion,
    pathInstancesByRegion,
    regionPathElements,
    hitPathByRegion,
    hitPathInstancesByRegion,
    hitPathElements,
    labelTextElements,
    labelsVisible,
    colorFor: () => MUTED_NON_CLAIM_COLOR,
    labelPosition,
    localizedRegionName,
    ...renderContext,
  });
  renderNormalRegionColors(renderContext);
  applyFilters();
  updateNationOverlay(getCurrentNation());
}
function renderLabels(renderContext = {}) {
  renderLabelsLayer({
    layer: gLabels,
    labelTextElements,
    labelsVisible,
    regions: REGIONS,
    labelPosition,
    localizedRegionName,
    copyContexts: renderContext.copyContexts || worldCopyContexts,
    ...renderContext,
  });
}
function mapPointFromClientPoint(clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return {
      x: mapView.x + mapView.width / 2,
      y: mapView.y + mapView.height / 2,
    };
  }
  return {
    x: mapView.x + ((clientX - rect.left) / rect.width) * mapView.width,
    y: mapView.y + ((clientY - rect.top) / rect.height) * mapView.height,
  };
}
function zoomMapAt(scale, anchor = null) {
  zoomMapView(mapView, {
    scale,
    anchorX: anchor?.x,
    anchorY: anchor?.y,
    normalizeX: worldWrapEnabled,
  });
  applyMapViewToSvg();
}
function resetMapView() {
  initializeMapView(activeData, mapView);
  applyMapViewToSvg();
}
function mapViewControlLabel(action) {
  const labels = {
    zoomIn: currentLanguage === 'ko' ? '확대' : 'Zoom in',
    zoomOut: currentLanguage === 'ko' ? '축소' : 'Zoom out',
    reset: currentLanguage === 'ko' ? '보기 초기화' : 'Reset view',
  };
  return labels[action] || action;
}
function updateMapViewControlsLabels() {
  const controls = document.getElementById('mapViewControls');
  if (!controls) return;
  controls.querySelectorAll('[data-map-view-action]').forEach(button => {
    const action = button.dataset.mapViewAction;
    const label = mapViewControlLabel(action);
    button.title = label;
    button.setAttribute('aria-label', label);
    if (action === 'reset') button.textContent = currentLanguage === 'ko' ? '초기화' : 'Reset';
  });
}
function initMapViewControls() {
  if (!svgWrap || document.getElementById('mapViewControls')) return;
  const controls = document.createElement('div');
  controls.id = 'mapViewControls';
  controls.className = 'mapViewControls';
  controls.innerHTML = `
    <button type="button" class="mapViewControl" data-map-view-action="zoomIn">+</button>
    <button type="button" class="mapViewControl" data-map-view-action="zoomOut">−</button>
    <button type="button" class="mapViewControl mapViewControlReset" data-map-view-action="reset">Reset</button>
  `;
  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-map-view-action]');
    if (!button) return;
    event.preventDefault();
    const action = button.dataset.mapViewAction;
    if (action === 'zoomIn') zoomMapAt(1 / MAP_ZOOM_BUTTON_FACTOR);
    else if (action === 'zoomOut') zoomMapAt(MAP_ZOOM_BUTTON_FACTOR);
    else if (action === 'reset') resetMapView();
  });
  svgWrap.appendChild(controls);
  updateMapViewControlsLabels();
}
function onMapWheel(e) {
  if (!mapView) return;
  e.preventDefault();
  const anchor = mapPointFromClientPoint(e.clientX, e.clientY);
  const scale = e.deltaY < 0 ? 1 / MAP_WHEEL_ZOOM_FACTOR : MAP_WHEEL_ZOOM_FACTOR;
  zoomMapAt(scale, anchor);
}
function applyMapViewToSvg(renderContext = {}) {
  const isPan = !!renderContext.isPan;
  const scheduledAt = Number(renderContext.scheduledAt);
  const start = debugRenderStats ? performance.now() : 0;
  if (svg) {
    svg.setAttribute('viewBox', formatViewBoxForMapView(mapView));
    if (isPan) recordRenderStat('panViewBoxApplyCount');
  }
  if (debugRenderStats) {
    const finishedAt = performance.now();
    recordRenderTiming('mapViewApplyMs', finishedAt - start);
    if (isPan && Number.isFinite(scheduledAt)) {
      recordRenderTiming('panFrameMs', finishedAt - scheduledAt);
    }
  }
  invalidateTooltipLayout();
}
function scheduleMapViewRender(renderContext = {}) {
  if (renderContext.isPan) {
    pendingMapViewRenderContext = {
      isPan: true,
      scheduledAt: Number.isFinite(Number(renderContext.scheduledAt)) ? Number(renderContext.scheduledAt) : performance.now(),
    };
  } else if (!pendingMapViewRenderContext) {
    pendingMapViewRenderContext = renderContext;
  }
  if (mapViewFrame) return;
  mapViewFrame = window.requestAnimationFrame(() => {
    const context = pendingMapViewRenderContext || {};
    pendingMapViewRenderContext = null;
    mapViewFrame = 0;
    applyMapViewToSvg(context);
  });
}
function invalidateTooltipLayout() {
  svgWrapRectCache = null;
  tooltipSizeCache.valid = false;
}
function svgWrapRect() {
  if (!svgWrapRectCache) svgWrapRectCache = svgWrap.getBoundingClientRect();
  return svgWrapRectCache;
}
function measureTooltipSize() {
  if (tooltipSizeCache.valid) return tooltipSizeCache;
  tip.classList.add('visible');
  tooltipSizeCache = {
    width: tip.offsetWidth || 160,
    height: tip.offsetHeight || 26,
    valid: true,
  };
  return tooltipSizeCache;
}
function applyTooltipPosition() {
  tooltipFrame = 0;
  if (!pendingTooltipPoint) return;
  const {clientX, clientY} = pendingTooltipPoint;
  const rect = svgWrapRect();
  const {width, height} = measureTooltipSize();
  const x = Math.max(8, Math.min(rect.width - width - 8, clientX - rect.left + 10));
  const y = Math.max(8, Math.min(rect.height - height - 8, clientY - rect.top + 10));
  tip.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  tip.classList.add('visible');
}
function scheduleTooltipPosition(e) {
  pendingTooltipPoint = {clientX: e.clientX, clientY: e.clientY};
  if (!tooltipFrame) tooltipFrame = window.requestAnimationFrame(applyTooltipPosition);
}
function hideRegionTooltip() {
  pendingTooltipPoint = null;
  tooltipRegionId = null;
  if (tooltipFrame) {
    window.cancelAnimationFrame(tooltipFrame);
    tooltipFrame = 0;
  }
  tip.classList.remove('visible');
}
function showRegionTooltip(e, r) {
  if (tooltipRegionId !== r.id) {
    tip.textContent = `${localizedRegionName(r)} (${nationDisplayName(r.nationTag)})`;
    tooltipRegionId = r.id;
    tooltipSizeCache.valid = false;
  }
  scheduleTooltipPosition(e);
}
function resolveHitRegion(event, indices = derivedIndices) {
  const target = event?.target;
  const hitTarget = target?.closest?.('[data-region-id], [data-region]');
  if (!hitTarget || !gHitRegions?.contains(hitTarget)) return null;
  const regionName = hitTarget.dataset.regionId || hitTarget.dataset.region;
  return indices.regionByName[regionName] || null;
}
function resolveRelatedHitRegion(event, indices = derivedIndices) {
  const target = event?.relatedTarget;
  const hitTarget = target?.closest?.('[data-region-id], [data-region]');
  if (!hitTarget || !gHitRegions?.contains(hitTarget)) return null;
  const regionName = hitTarget.dataset.regionId || hitTarget.dataset.region;
  return indices.regionByName[regionName] || null;
}
function canUseSimpleHoverVisualDelta(previousRegionName, nextRegion, {regionChanged=false} = {}) {
  return !!(regionChanged && nextRegion?.regionName);
}
function canUseSimpleHoverClearDelta(previousRegionName) {
  return !!previousRegionName;
}

let hoverFullVisualPassFrame = 0;
function scheduleHoverFullVisualPass() {
  if (hoverFullVisualPassFrame) return;
  hoverFullVisualPassFrame = window.requestAnimationFrame(() => {
    hoverFullVisualPassFrame = 0;
    applyMapVisualState();
  });
}

function updateHoveredRegion(r, {force=false} = {}) {
  const previousRegionName = getHoveredRegionName();
  const regionChanged = previousRegionName !== r.regionName;
  const nationChanged = getHoverNation() !== r.nationTag;
  if (!force && !regionChanged && (!getLockedNation() || !nationChanged)) return;
  const useHoverDelta = canUseSimpleHoverVisualDelta(previousRegionName, r, {force, regionChanged});
  setHoveredRegionState(r.regionName, r.nationTag);
  setHoverVisualState(r.regionName);
  updateSecondaryCapitalPreview(r);
  if (useHoverDelta) {
    applyMapVisualStateForRegions([previousRegionName, r.regionName].filter(Boolean));
  } else {
    scheduleHoverFullVisualPass();
  }
  if (!getLockedNation()) scheduleHoverPreviewNation(r.nationTag);
  else setHoverNationState(r.nationTag);
  renderHoverOutlines();
  renderCapitalMarkers();
  syncReachableCapitalCandidateHoverState();
  setHoverPill(r);
}
function onRegionEnter(e, r, {force=true} = {}) {
  updateHoveredRegion(r, {force});
  showRegionTooltip(e, r);
}
function onRegionMove(e, r) {
  updateHoveredRegion(r);
  showRegionTooltip(e, r);
}
function onRegionLeave(e) {
  hideRegionTooltip();
  const next = e?.relatedTarget;
  if (next?.closest?.('.region, .region-hit')) return;
  clearHoverPreview();
}
function onHitLayerPointerOver(e) {
  if (shouldSuppressHitLayerPointerEvent(e)) return;
  const region = resolveHitRegion(e);
  if (!region) return;
  const previousRegion = resolveRelatedHitRegion(e);
  if (previousRegion?.regionName === region.regionName) return;
  onRegionEnter(e, region, {force: !previousRegion});
}
function onHitLayerPointerMove(e) {
  if (shouldSuppressHitLayerPointerEvent(e)) return;
  const region = resolveHitRegion(e);
  if (region) onRegionMove(e, region);
}
function onHitLayerPointerOut(e) {
  if (shouldSuppressHitLayerPointerEvent(e)) return;
  const region = resolveHitRegion(e);
  if (!region) return;
  if (resolveRelatedHitRegion(e)) return;
  onRegionLeave(e);
}
function onHitLayerClick(e) {
  if (consumeSuppressedMapClick(e)) return;
  const region = resolveHitRegion(e);
  if (!region) return;
  e.stopPropagation();
  if (unpinClickedPinnedRegion(region)) return;
  if (selectReachableCapitalCandidateRegion(region.regionName)) return;
  selectRegion(region);
}
function hitRegionElementFromClientPoint(clientX, clientY) {
  const elements = document.elementsFromPoint?.(clientX, clientY)
    || [document.elementFromPoint?.(clientX, clientY)].filter(Boolean);
  for (const element of elements) {
    const hit = element?.closest?.('.region-hit[data-region-id], .region-hit[data-region]');
    if (hit && gHitRegions?.contains(hit)) return hit;
  }
  return null;
}
function refreshPanHoverFromClientPoint(clientX, clientY) {
  const hit = hitRegionElementFromClientPoint(clientX, clientY);
  if (!hit) {
    if (getHoveredRegionName() || getHoverNation() || tooltipRegionId != null || pendingTooltipPoint) {
      clearHoverPreview();
    }
    return;
  }
  const regionName = hit.dataset.regionId || hit.dataset.region;
  const region = regionByName[regionName];
  if (!region) return;
  onRegionMove({clientX, clientY, target: hit}, region);
}
function schedulePanHoverRefresh(clientX, clientY) {
  pendingPanHoverPoint = {clientX, clientY};
  if (panHoverRefreshFrame) return;
  panHoverRefreshFrame = window.requestAnimationFrame(() => {
    panHoverRefreshFrame = 0;
    const point = pendingPanHoverPoint;
    pendingPanHoverPoint = null;
    if (!point) return;
    refreshPanHoverFromClientPoint(point.clientX, point.clientY);
  });
}
function shouldSuppressHitLayerPointerEvent(e) {
  if (!mapPanState || e.pointerId !== mapPanState.pointerId) return false;
  if (mapPanState.dragging) return true;
  return Math.hypot(e.clientX - mapPanState.startX, e.clientY - mapPanState.startY) >= MAP_PAN_DRAG_THRESHOLD_PX;
}
function measurePanViewportRect() {
  recordRenderStat('panSvgRectReads');
  return svg?.getBoundingClientRect();
}
function samplePanSvgNodeCount() {
  if (!debugRenderStats || !svg) return;
  setRenderStat('visibleSvgNodeCount', svg.querySelectorAll('*').length);
}
function viewDeltaFromPointerDelta(deltaX, deltaY, rect = null) {
  const viewportRect = rect || measurePanViewportRect();
  if (!viewportRect?.width || !viewportRect?.height) return {dx: 0, dy: 0};
  return {
    dx: -(deltaX * mapView.width) / viewportRect.width,
    dy: -(deltaY * mapView.height) / viewportRect.height,
  };
}
function markSuppressNextMapClick() {
  suppressMapClick = true;
  window.setTimeout(() => {
    suppressMapClick = false;
  }, 80);
}
function consumeSuppressedMapClick(e) {
  if (!suppressMapClick) return false;
  suppressMapClick = false;
  e?.preventDefault?.();
  e?.stopPropagation?.();
  return true;
}
function finishMapPan({cancel=false} = {}) {
  if (!mapPanState) return;
  const wasDragging = mapPanState.dragging;
  const pointerId = mapPanState.pointerId;
  const finalClientX = mapPanState.lastX;
  const finalClientY = mapPanState.lastY;
  mapPanState = null;
  svg?.classList.remove('is-panning-ready', 'is-panning');
  try {
    if (svg?.hasPointerCapture?.(pointerId)) svg.releasePointerCapture(pointerId);
  } catch {}
  if (!cancel && wasDragging) {
    markSuppressNextMapClick();
    schedulePanHoverRefresh(finalClientX, finalClientY);
  }
}
function onMapPointerDown(e) {
  if (e.button !== 0 || mapPanState) return;
  mapPanState = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    lastX: e.clientX,
    lastY: e.clientY,
    dragging: false,
    viewportRect: null,
  };
  svg?.classList.add('is-panning-ready');
}
function onMapPointerMove(e) {
  if (!mapPanState || e.pointerId !== mapPanState.pointerId) return;
  const totalX = e.clientX - mapPanState.startX;
  const totalY = e.clientY - mapPanState.startY;
  if (!mapPanState.dragging && Math.hypot(totalX, totalY) < MAP_PAN_DRAG_THRESHOLD_PX) return;
  if (!mapPanState.dragging) {
    mapPanState.dragging = true;
    mapPanState.viewportRect = measurePanViewportRect();
    samplePanSvgNodeCount();
    svg?.classList.add('is-panning');
    try {
      svg?.setPointerCapture?.(e.pointerId);
    } catch {}
  }
  e.preventDefault();
  recordRenderStat('panPointerMoveCount');
  const scheduledAt = debugRenderStats ? performance.now() : 0;
  const {dx, dy} = viewDeltaFromPointerDelta(
    e.clientX - mapPanState.lastX,
    e.clientY - mapPanState.lastY,
    mapPanState.viewportRect
  );
  panMapView(mapView, {dx, dy, normalizeX: worldWrapEnabled});
  mapPanState.lastX = e.clientX;
  mapPanState.lastY = e.clientY;
  scheduleMapViewRender({isPan: true, scheduledAt});
}
function onMapPointerUp(e) {
  if (!mapPanState || e.pointerId !== mapPanState.pointerId) return;
  if (mapPanState.dragging) e.preventDefault();
  finishMapPan();
}
function onMapPointerCancel(e) {
  if (!mapPanState || e.pointerId !== mapPanState.pointerId) return;
  finishMapPan({cancel: true});
}
function onMapLostPointerCapture(e) {
  if (!mapPanState || e.pointerId !== mapPanState.pointerId) return;
  finishMapPan({cancel: true});
}
function onMapMove(e) {
  if (mapPanState?.dragging) return;
  const target = e.target;
  if (target?.classList?.contains('region') || target?.classList?.contains('region-hit')) return;
  const isBlankMap = target === svg || target === gGrid || target === gHitRegions || target?.classList?.contains('graticule');
  if (!isBlankMap) return;
  if (getHoveredRegionName() || getHoverNation() || tooltipRegionId != null || pendingTooltipPoint) clearHoverPreview();
}
function onMapLeave() {
  clearHoverPreview();
}
function getCurrentNation() { return getLockedNation() || getHoverNation() || ''; }
function claimKindPass(claim) {
  const k = claimKindSel.value;
  if (k === 'all') return true;
  if (k === 'hostile') return !!claim.hostileClaim;
  if (k === 'peaceful') return !claim.hostileClaim;
  return true;
}
function entryFilterValue(entry) {
  return entry?.project || '__base__';
}
function filterEntryByClaimKind(entry) {
  const claims = entry.claims || {};
  const regions = (entry.regions || []).filter(rn => claimKindPass(claims[rn] || {}));
  const filteredClaims = {};
  for (const rn of regions) filteredClaims[rn] = claims[rn];
  return {...entry, regions, claims: filteredClaims};
}
function getClaimKindFilteredProjectEntries(nation) {
  const d = CLAIMS_BY_NATION[nation];
  if (!d) return [];
  return sortedProjectEntries((d.projects || []).map(filterEntryByClaimKind).filter(e => e.regions.length));
}
function inheritedClaimProjectsFor(entry, entries) {
  if (!entry?.project) return [];
  return entries.filter(candidate => {
    if (candidate === entry) return false;
    if (!candidate.project) return true;
    return dependsOn(entry.project, candidate.project);
  });
}
function cumulativeClaimEntry(entry, entries) {
  const inheritedEntries = inheritedClaimProjectsFor(entry, entries);
  const regions = [];
  const claims = {};
  const regionSources = {};
  const regionSourceLabels = {};
  const addRegion = (rn, claim, source, sourceLabel, {overwrite=false} = {}) => {
    if (!rn || (!overwrite && claims[rn])) return;
    if (!claims[rn]) regions.push(rn);
    claims[rn] = claim || {};
    regionSources[rn] = source;
    regionSourceLabels[rn] = sourceLabel;
  };
  for (const inherited of inheritedEntries) {
    const source = inherited.project ? 'inherited' : 'basic';
    const sourceLabel = inherited.project ? t('source.inheritedFrom', {project: projectDisplay(inherited.project)}) : t('source.basicClaim');
    for (const rn of inherited.regions || []) addRegion(rn, inherited.claims?.[rn], source, sourceLabel);
  }
  for (const rn of entry.regions || []) addRegion(rn, entry.claims?.[rn], 'direct', t('source.direct'), {overwrite:true});
  const directSet = new Set(entry.regions || []);
  const inheritedSet = new Set(regions.filter(rn => !directSet.has(rn)));
  return {
    ...entry,
    regions,
    claims,
    directRegions: [...directSet],
    inheritedRegions: [...inheritedSet],
    inheritedClaimCount: inheritedSet.size,
    directClaimCount: directSet.size,
    regionSources,
    regionSourceLabels,
    cumulative: inheritedSet.size > 0,
  };
}
function cumulativeClaimEntries(entries) {
  return entries.map(entry => cumulativeClaimEntry(entry, entries));
}
function getVisibleProjectEntries(nation) {
  if (claimModeSel.value === 'off') return [];
  const directEntries = getClaimKindFilteredProjectEntries(nation);
  if (claimModeSel.value === 'project' && getProjectFilter()) {
    return cumulativeClaimEntries(directEntries).filter(e => entryFilterValue(e) === getProjectFilter());
  }
  return directEntries;
}
function overlayModelDataVersionKey(activeData, indices) {
  const summary = activeData?.regionMap?.summary || {};
  const claimStats = activeData?.claimMap?.claimStats || {};
  return [
    summary.scenarioYear || '',
    summary.regions ?? indices?.regions?.length ?? '',
    claimStats.claimRowsNormalized ?? '',
    claimStats.projectClaimRowsNormalized ?? '',
    claimStats.projectCount ?? '',
  ].join(':');
}
function selectedRegionOverlayKey() {
  return [...selectedRegionIds].filter(Boolean).sort().join(',');
}
function buildOverlayModelCacheKey(activeData, indices, nationId, options = {}) {
  return JSON.stringify({
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, indices),
    language: currentLanguage,
    nation: nationId || '',
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
    project: getProjectFilter(),
    activeIncomingClaim: getActiveIncomingClaimKey(),
    selectedRegions: selectedRegionOverlayKey(),
    options: options.cacheKey || '',
  });
}
function pruneOverlayModelCache() {
  pruneLruCache(overlayModelCache, OVERLAY_MODEL_CACHE_LIMIT);
}
function getNationOverlayModel(activeData, indices, nationId, options = {}) {
  const cacheKey = buildOverlayModelCacheKey(activeData, indices, nationId, options);
  const cached = getCachedLruValue(overlayModelCache, cacheKey, 'overlayModelCacheHits');
  if (cached) return cached;
  const model = buildNationOverlayModel(activeData, indices, nationId, options);
  overlayModelCache.set(cacheKey, model);
  pruneOverlayModelCache();
  return model;
}
function overlayModelRenderDataKey(model) {
  return {
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(model?.activeData, model?.indices),
    nation: model?.nation || '',
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
    project: getProjectFilter(),
    activeIncomingClaim: model?.activeIncomingClaimKey || '',
  };
}
function claimOverlayDescriptorCacheKey(model) {
  return JSON.stringify({
    kind: 'claim-overlay-path-descriptors',
    ...overlayModelRenderDataKey(model),
    options: model?.options?.cacheKey || '',
  });
}
function claimLabelDescriptorCacheKey(model) {
  return JSON.stringify({
    kind: 'claim-label-descriptors',
    ...overlayModelRenderDataKey(model),
    options: model?.options?.cacheKey || '',
    language: currentLanguage,
  });
}
function buildNationOverlayModel(activeData, indices, nationId, options = {}) {
  recordRenderStat('overlayModelBuilds');
  const nation = nationId || '';
  const data = CLAIMS_BY_NATION[nation] || {nation, baseRegions:nationRegions.get(nation)||[], projects:[], totalClaimRegions:0, projectCount:0};
  const baseSet = new Set(data.baseRegions || nationRegions.get(nation) || []);
  const tierByProject = countryProjectTierMap(nation, baseSet);
  const directEntries = getClaimKindFilteredProjectEntries(nation);
  const cumulativeEntries = cumulativeClaimEntries(directEntries);
  const allEntries = getVisibleProjectEntries(nation);
  const outgoingEntries = cumulativeEntries.map(e => ({...e, regions:(e.regions || []).filter(rn => !baseSet.has(rn))})).filter(e => e.regions.length);
  const incomingEntries = incomingClaimsForTarget(nation, data, baseSet);
  let activeIncoming = selectedIncomingEntry(incomingEntries);
  const activeIncomingClaimKey = getActiveIncomingClaimKey();
  const nextActiveIncomingClaimKey = activeIncomingClaimKey && !activeIncoming ? '' : activeIncomingClaimKey;
  if (!nextActiveIncomingClaimKey) activeIncoming = null;
  const displayBaseSet = activeIncoming ? new Set(activeIncoming.claimantBaseRegions || []) : baseSet;
  const entries = activeIncoming ? [activeIncoming] : allEntries;
  const claimSet = new Set();
  entries.forEach(e => e.regions.forEach(r => { if (!displayBaseSet.has(r)) claimSet.add(r); }));
  const resultSet = activeIncoming ? new Set([...(activeIncoming.resultRegions || []), ...(activeIncoming.claimantBaseRegions || [])]) : new Set([...displayBaseSet, ...claimSet]);
  const ownedCount = displayBaseSet.size;
  const claimCount = claimSet.size;
  const projectCount = entries.filter(e => e.project && (e.regions || []).some(rn => !displayBaseSet.has(rn))).length;
  const hasClaimOverlay = claimModeSel.value !== 'off' && (displayBaseSet.size > 0 || claimSet.size > 0);
  return {
    activeData,
    indices,
    options,
    nation,
    data,
    baseSet,
    tierByProject,
    directEntries,
    cumulativeEntries,
    allEntries,
    outgoingEntries,
    incomingEntries,
    activeIncoming,
    activeIncomingClaimKey: nextActiveIncomingClaimKey,
    displayBaseSet,
    entries,
    claimSet,
    resultSet,
    ownedCount,
    claimCount,
    projectCount,
    hasClaimOverlay,
    gatedCount: (data.gatedRegions || []).length,
  };
}
function visibleClaimRegionsForEntry(entry, model) {
  return (entry.regions || []).filter(rn => !model.displayBaseSet.has(rn));
}
function claimOverlayPathDescriptors(model) {
  if (!model) return [];
  const descriptors = [];
  if (claimModeSel.value !== 'off') {
    for (const rn of model.displayBaseSet) {
      if (!regionByName[rn]) continue;
      descriptors.push({
        region: rn,
        className: 'claim-overlay owned-territory',
        fillClassName: 'claim-fill-group owned-territory',
        fillKey: `owned:${BASE_TERRITORY_COLOR}`,
        fill: BASE_TERRITORY_COLOR,
        project: 'initial-territory',
      });
    }
  }
  model.entries.forEach(entry => {
    const visibleClaimRegions = visibleClaimRegionsForEntry(entry, model);
    if (!visibleClaimRegions.length) return;
    const tier = countryProjectTier(entry, model.tierByProject);
    const color = projectColor(entry.project, tier);
    for (const rn of visibleClaimRegions) {
      if (!regionByName[rn]) continue;
      const claim = entry.claims?.[rn] || {};
      const claimClassName = (entry.project ? 'research-claim ' : 'basic-claim ') + (claim.hostileClaim ? 'hostile' : 'peaceful') + (claim.capitalClaim ? ' capital' : '') + (claim.gatedClaim ? ' gated' : '');
      const fillCategory = entry.project ? `research:${entry.project}` : 'basic';
      descriptors.push({
        region: rn,
        className: 'claim-overlay ' + claimClassName,
        fillClassName: 'claim-fill-group ' + (entry.project ? 'research-claim' : 'basic-claim') + (claim.gatedClaim ? ' gated' : ''),
        fillKey: `${fillCategory}:${color}:${claim.gatedClaim ? 'gated' : 'normal'}`,
        fillOpacity: claim.gatedClaim ? 0.72 : '',
        fill: color,
        project: entry.project || 'base',
      });
    }
  });
  return descriptors;
}
function claimLabelDescriptors(model) {
  if (!model) return [];
  const descriptors = [];
  model.entries.forEach((entry, i) => {
    const visibleClaimRegions = visibleClaimRegionsForEntry(entry, model);
    if (!visibleClaimRegions.length || i >= 10) return;
    const labelRegion = visibleClaimRegions.map(rn => regionByName[rn]).find(Boolean);
    const lab = labelRegion && labelPosition(labelRegion);
    if (!lab) return;
    descriptors.push({
      region: labelRegion.regionName,
      x: lab.x,
      y: lab.y,
      text: entry.project ? projectDisplay(entry.project) : t('claimCard.projectBaseline'),
    });
  });
  return descriptors;
}
function manualEnvelopeDepthColor(depth = 0) {
  const index = Math.min(Math.max(Number(depth) || 0, 0), MANUAL_ENVELOPE_DEPTH_COLORS.length - 1);
  return MANUAL_ENVELOPE_DEPTH_COLORS[index];
}
function manualEnvelopeOverlapColor(sourceCount = 2, alpha = 0.92) {
  const t = Math.min(Math.max((Number(sourceCount) || 2) - 2, 0), 4) / 4;
  const lightness = (0.84 - t * 0.12).toFixed(2);
  const chroma = (0.15 + t * 0.04).toFixed(2);
  const hue = (82 - t * 102 + 360) % 360;
  return `oklch(${lightness} ${chroma} ${hue.toFixed(0)} / ${alpha})`;
}
function manualEnvelopeAnchorNation(anchorModel = currentOverlayModel) {
  return anchorModel?.nation || getLockedNation() || getActiveNation() || regionByName[getFocusedRegionName()]?.nationTag || '';
}
function manualEnvelopePinnedSourceKey() {
  return [...getPinnedRegionIds()]
    .map((regionName, index) => `${index}:${regionName}:${getPinnedCapitalClaimant(regionName)}:${pinnedExpansionClaimants(regionName).join(',')}`)
    .join('|');
}
function manualEnvelopeModelCacheKey(anchorModel = currentOverlayModel, {includeAnchorOnly = false} = {}) {
  return JSON.stringify({
    kind: 'manual-envelope-model',
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, derivedIndices),
    anchor: manualEnvelopeAnchorNation(anchorModel),
    overlayNation: anchorModel?.nation || '',
    includeAnchorOnly: !!includeAnchorOnly,
    pins: manualEnvelopePinnedSourceKey(),
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
    project: getProjectFilter(),
  });
}
function compareManualEnvelopeSourceSpecs(anchorNation) {
  return (a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    const aFocused = a.claimant === anchorNation ? 0 : 1;
    const bFocused = b.claimant === anchorNation ? 0 : 1;
    if (aFocused !== bFocused) return aFocused - bFocused;
    if (a.pinIndex !== b.pinIndex) return a.pinIndex - b.pinIndex;
    return a.claimant.localeCompare(b.claimant);
  };
}
function manualEnvelopeSourceSpecs(anchorNation) {
  if (!anchorNation || claimModeSel.value === 'off') return [];
  const specs = [{
    claimant: anchorNation,
    depth: 0,
    parentClaimant: '',
    viaCapitalRegion: '',
    pinIndex: -1,
  }];
  const seenClaimants = new Set([anchorNation]);
  [...getPinnedRegionIds()].forEach((regionName, pinIndex) => {
    for (const claimant of pinnedExpansionClaimants(regionName)) {
      if (!claimant || seenClaimants.has(claimant)) continue;
      seenClaimants.add(claimant);
      specs.push({
        claimant,
        depth: 1,
        parentClaimant: anchorNation,
        viaCapitalRegion: regionName,
        pinIndex,
      });
    }
  });
  return specs.sort(compareManualEnvelopeSourceSpecs(anchorNation));
}
function buildManualEnvelopeSource(spec, sourceOrder) {
  const data = CLAIMS_BY_NATION[spec.claimant] || {nation: spec.claimant, baseRegions: nationRegions.get(spec.claimant) || [], projects: []};
  const baseSet = new Set(data.baseRegions || nationRegions.get(spec.claimant) || []);
  const tierByProject = countryProjectTierMap(spec.claimant, baseSet);
  const entries = getVisibleProjectEntries(spec.claimant);
  return {
    ...spec,
    sourceOrder,
    data,
    baseSet,
    tierByProject,
    entries,
  };
}
function compareManualEnvelopeContributions(a, b) {
  if (a.depth !== b.depth) return a.depth - b.depth;
  if (a.sourceOrder !== b.sourceOrder) return a.sourceOrder - b.sourceOrder;
  if (a.kind !== b.kind) return a.kind === 'base' ? -1 : 1;
  if (a.tier !== b.tier) return a.tier - b.tier;
  const byProject = projectSortLabel(a.project).localeCompare(projectSortLabel(b.project));
  if (byProject) return byProject;
  return a.claimant.localeCompare(b.claimant);
}
function manualEnvelopeSourceKey(contribution) {
  return `${contribution.depth}:${contribution.claimant}:${contribution.parentClaimant || ''}:${contribution.viaCapitalRegion || ''}`;
}
function manualEnvelopeKindLabel(contribution) {
  if (contribution.kind === 'base') return t('manualEnvelope.kindBase');
  return t('manualEnvelope.kindClaim', {
    project: contribution.project ? projectDisplay(contribution.project) : t('claimCard.projectBaseline'),
  });
}
function manualEnvelopeSourceLabel(contribution) {
  return t('manualEnvelope.source', {
    nation: nationDisplayName(contribution.claimant),
    kind: manualEnvelopeKindLabel(contribution),
  });
}
function manualEnvelopeRegionLabel(item) {
  const source = manualEnvelopeSourceLabel(item.primary);
  return t('manualEnvelope.region', {
    region: localizedRegionName(regionByName[item.region] || item.region),
    depth: formatNumber(item.primary.depth),
    source,
  });
}
function manualEnvelopeOverlapLabel(item) {
  return t('manualEnvelope.overlap', {
    region: localizedRegionName(regionByName[item.region] || item.region),
    count: formatNumber(item.overlapSources.length),
  });
}
function addManualEnvelopeContribution(regionContributions, source, regionName, contribution) {
  if (!regionName || !regionByName[regionName]) return;
  if (!regionContributions.has(regionName)) regionContributions.set(regionName, []);
  regionContributions.get(regionName).push({
    ...contribution,
    region: regionName,
    claimant: source.claimant,
    depth: source.depth,
    parentClaimant: source.parentClaimant,
    viaCapitalRegion: source.viaCapitalRegion,
    pinIndex: source.pinIndex,
    sourceOrder: source.sourceOrder,
  });
}
function buildManualEnvelopeModelUncached(anchorModel = currentOverlayModel, {includeAnchorOnly = false} = {}) {
  recordRenderStat('manualEnvelopeModelBuilds');
  const anchorNation = manualEnvelopeAnchorNation(anchorModel);
  const specs = manualEnvelopeSourceSpecs(anchorNation);
  if (specs.length <= 1 && !includeAnchorOnly) return null;
  const sources = specs
    .map((spec, sourceOrder) => buildManualEnvelopeSource(spec, sourceOrder))
    .filter(source => source.baseSet.size || source.entries.length);
  if (sources.length <= 1 && !includeAnchorOnly) return null;

  const regionContributions = new Map();
  for (const source of sources) {
    for (const regionName of source.baseSet) {
      addManualEnvelopeContribution(regionContributions, source, regionName, {
        kind: 'base',
        project: '',
        tier: -1,
        claim: {},
      });
    }
    for (const entry of source.entries) {
      const tier = countryProjectTier(entry, source.tierByProject);
      for (const regionName of entry.regions || []) {
        if (source.baseSet.has(regionName)) continue;
        addManualEnvelopeContribution(regionContributions, source, regionName, {
          kind: 'claim',
          project: entry.project || '',
          tier,
          claim: entry.claims?.[regionName] || {},
        });
      }
    }
  }

  const regionItems = [];
  for (const [region, contributions] of regionContributions) {
    const sorted = [...contributions].sort(compareManualEnvelopeContributions);
    const primary = sorted[0];
    const overlapSourceKeys = new Set();
    const overlapSources = [];
    for (const contribution of sorted) {
      const key = manualEnvelopeSourceKey(contribution);
      if (overlapSourceKeys.has(key)) continue;
      overlapSourceKeys.add(key);
      overlapSources.push(contribution);
    }
    regionItems.push({
      region,
      primary,
      contributions: sorted,
      overlapSources,
    });
  }
  regionItems.sort((a, b) => (
    a.primary.depth - b.primary.depth
    || a.primary.sourceOrder - b.primary.sourceOrder
    || a.region.localeCompare(b.region)
  ));
  return {
    anchorNation,
    sources,
    regionItems,
    sourceKey: sources.map(source => `${source.depth}:${source.claimant}:${source.parentClaimant || ''}:${source.viaCapitalRegion || ''}:${source.pinIndex}`).join('|'),
    regionKey: regionItems.map(item => `${item.region}:${item.primary.depth}:${item.primary.claimant}:${item.primary.project || ''}:${item.overlapSources.length}`).join('|'),
  };
}
function buildManualEnvelopeModel(anchorModel = currentOverlayModel, options = {}) {
  const cacheKey = manualEnvelopeModelCacheKey(anchorModel, options);
  const cached = getCachedLruValue(manualEnvelopeModelCache, cacheKey, 'manualEnvelopeModelCacheHits');
  if (cached) return cached === EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE ? null : cached;
  const model = buildManualEnvelopeModelUncached(anchorModel, options);
  setCachedLruValue(
    manualEnvelopeModelCache,
    cacheKey,
    model || EMPTY_MANUAL_ENVELOPE_MODEL_CACHE_VALUE,
    MANUAL_ENVELOPE_MODEL_CACHE_LIMIT
  );
  return model;
}
function manualEnvelopeRenderKey(model, copyContexts = worldCopyContexts) {
  if (!model?.regionItems?.length) return MANUAL_ENVELOPE_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'manual-envelope',
    copyPlan: copyContextRenderKey(copyContexts),
    data: overlayModelDataVersionKey(activeData, derivedIndices),
    language: currentLanguage,
    anchor: model.anchorNation,
    sourceKey: model.sourceKey,
    regionKey: model.regionKey,
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
    project: getProjectFilter(),
  });
}
function createManualEnvelopeFragment(model, {copyContexts=worldCopyContexts} = {}) {
  const fillDescriptors = model.regionItems.map(item => {
    const region = regionByName[item.region];
    const depth = item.primary.depth;
    const fill = manualEnvelopeDepthColor(depth);
    return {
      path: region.path,
      className: `manual-envelope-fill manual-envelope-depth-${depth}`,
      fill,
      groupKey: `manual-envelope-depth:${depth}:${fill}`,
      dataset: {
        envelopeDepth: depth,
        fillKey: `depth:${depth}`,
      },
    };
  });
  const fillGroups = buildVisualFillGroups(fillDescriptors);
  return createProjectedCopyFragment(copyContexts, 'manual-envelope-copy', copyContext => {
    const frag = document.createDocumentFragment();
    const copyData = worldCopyDataset(copyContext);
    for (const group of fillGroups) {
      frag.appendChild(createSvgElement('path', {
        d: group.paths.join(' '),
        class: group.className,
        fill: group.fill,
        'aria-label': t('manualEnvelope.depth', {depth: group.dataset.envelopeDepth || '0'}),
      }, {
        ...group.dataset,
        visualGroupSize: group.paths.length,
        ...copyData,
      }));
    }
    for (const item of model.regionItems) {
      const region = regionByName[item.region];
      const primary = item.primary;
      const hasOverlap = item.overlapSources.length > 1;
      const overlapColor = hasOverlap ? manualEnvelopeOverlapColor(item.overlapSources.length) : '';
      frag.appendChild(createSvgElement('path', {
        d: region.path,
        class: `manual-envelope-region-outline manual-envelope-depth-${primary.depth}${hasOverlap ? ' has-overlap' : ''}`,
        fill: 'none',
        stroke: overlapColor || null,
        'aria-label': manualEnvelopeRegionLabel(item),
      }, {
        region: item.region,
        envelopeDepth: primary.depth,
        envelopeClaimant: primary.claimant,
        envelopeParent: primary.parentClaimant,
        envelopeViaCapital: primary.viaCapitalRegion,
        envelopeProject: primary.project,
        envelopeTier: primary.tier,
        envelopeKind: primary.kind,
        envelopeSourceCount: item.overlapSources.length,
        ...copyData,
      }));
      if (!hasOverlap) continue;
      frag.appendChild(createSvgElement('path', {
        d: region.path,
        class: 'manual-envelope-overlap',
        fill: 'none',
        stroke: overlapColor,
        'aria-label': manualEnvelopeOverlapLabel(item),
      }, {
        region: item.region,
        envelopeOverlap: '1',
        envelopeSourceCount: item.overlapSources.length,
        ...copyData,
      }));
    }
    return frag;
  });
}
function renderManualEnvelopeOverlay(anchorModel = currentOverlayModel, {copyContexts=worldCopyContexts} = {}) {
  if (!gManualEnvelopeOverlays) return;
  const model = buildManualEnvelopeModel(anchorModel);
  replaceLayerChildrenForRenderKey(
    gManualEnvelopeOverlays,
    manualEnvelopeLayerRenderKeys,
    manualEnvelopeRenderKey(model, copyContexts),
    () => (model ? createManualEnvelopeFragment(model, {copyContexts}) : document.createDocumentFragment()),
    'manualEnvelopeRebuilds'
  );
}
function clearManualEnvelopeOverlay() {
  if (!gManualEnvelopeOverlays) return;
  replaceLayerChildrenForRenderKey(
    gManualEnvelopeOverlays,
    manualEnvelopeLayerRenderKeys,
    MANUAL_ENVELOPE_EMPTY_RENDER_KEY,
    () => document.createDocumentFragment(),
    'manualEnvelopeRebuilds'
  );
}
function nationBaseRegionNames(nation) {
  return [...new Set(CLAIMS_BY_NATION[nation]?.baseRegions || nationRegions.get(nation) || [])]
    .filter(regionName => regionByName[regionName]);
}
function nationResultRegionNames(nation) {
  const resultRegions = new Set(nationBaseRegionNames(nation));
  for (const entry of getVisibleProjectEntries(nation)) {
    for (const regionName of entry.regions || []) {
      if (regionByName[regionName]) resultRegions.add(regionName);
    }
  }
  return [...resultRegions];
}
function nationFullyIncludedInResult(nation, resultSet) {
  const resultRegions = nationResultRegionNames(nation);
  return !!resultRegions.length && resultRegions.every(regionName => resultSet?.has?.(regionName));
}
function isReachableCapitalCandidateNation(regionName, nation, anchorNation, resultSet = new Set()) {
  return !!regionName
    && !!nation
    && nation !== anchorNation
    && isCapitalRegionForNation(nation, regionName)
    && !nationFullyIncludedInResult(nation, resultSet);
}
function reachableCapitalCandidateNations(regionName, anchorNation, resultSet = new Set()) {
  return [...new Set(derivedIndices.capitalNationsByRegion?.get?.(regionName) || [])]
    .filter(nation => isReachableCapitalCandidateNation(regionName, nation, anchorNation, resultSet));
}
function reachableCapitalCandidateDescriptorCacheKey(model) {
  return JSON.stringify({
    kind: 'reachable-capital-candidate-descriptors',
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, derivedIndices),
    anchor: model?.anchorNation || '',
    sourceKey: model?.sourceKey || '',
    regionKey: model?.regionKey || '',
    pins: [...getPinnedRegionIds()].map(regionName => `${regionName}:${getPinnedCapitalClaimant(regionName)}`).join('|'),
  });
}
function manualEnvelopeVisibleRegionSet(model) {
  return new Set((model?.regionItems || [])
    .map(item => item.region)
    .filter(regionName => regionByName[regionName]));
}
function addRegionNamesToSet(target, regionNames) {
  if (!regionNames) return target;
  if (regionNames instanceof Set || Array.isArray(regionNames)) {
    for (const regionName of regionNames) {
      if (regionByName[regionName]) target.add(regionName);
    }
    return target;
  }
  if (typeof regionNames === 'object') {
    Object.entries(regionNames).forEach(([regionName, included]) => {
      if (included && regionByName[regionName]) target.add(regionName);
    });
  }
  return target;
}
function activeClaimPreviewScopeCacheKey(anchorModel = currentOverlayModel) {
  const pinnedKey = [...getPinnedRegionIds()]
    .map(regionName => `${regionName}:${getPinnedCapitalClaimant(regionName)}`)
    .join('|');
  return JSON.stringify({
    scenario: appState.activeScenarioId || appData.defaultScenario || '',
    data: overlayModelDataVersionKey(activeData, derivedIndices),
    anchor: manualEnvelopeAnchorNation(anchorModel),
    overlayNation: anchorModel?.nation || '',
    incoming: getActiveIncomingClaimKey(),
    pins: pinnedKey,
    claimMode: claimModeSel.value || '',
    claimKind: claimKindSel.value || '',
    project: getProjectFilter(),
  });
}
function activeClaimPreviewRegionSet(anchorModel = currentOverlayModel) {
  if (!anchorModel) return new Set();
  const key = activeClaimPreviewScopeCacheKey(anchorModel);
  if (key === activeClaimPreviewRegionScopeKey && activeClaimPreviewRegionScope) return activeClaimPreviewRegionScope;
  const resultSet = new Set();
  addRegionNamesToSet(resultSet, anchorModel.resultSet);
  addRegionNamesToSet(
    resultSet,
    manualEnvelopeVisibleRegionSet(buildManualEnvelopeModel(anchorModel, {includeAnchorOnly: true}))
  );
  activeClaimPreviewRegionScopeKey = key;
  activeClaimPreviewRegionScope = resultSet;
  return resultSet;
}
function activeClaimPreviewContainsRegion(regionName, anchorModel = currentOverlayModel) {
  return !!regionName && activeClaimPreviewRegionSet(anchorModel).has(regionName);
}
function buildActiveExpansionScope(anchorModel = currentOverlayModel) {
  return {
    anchorNation: manualEnvelopeAnchorNation(anchorModel),
    regionSet: activeClaimPreviewRegionSet(anchorModel),
  };
}
function resolveCapitalClaimantForRegion(regionName, scope = buildActiveExpansionScope()) {
  if (!regionName || !scope?.regionSet?.has?.(regionName)) return '';
  const candidates = reachableCapitalCandidateNations(regionName, scope.anchorNation, scope.regionSet);
  const override = getPinnedCapitalClaimant(regionName);
  if (override && candidates.includes(override)) return override;
  return candidates[0] || '';
}
function resolveReachableCapitalSelectionClaimant(region, capitalClaimantId = '') {
  if (!region?.regionName || !(getLockedNation() || getActiveNation())) return '';
  const scope = buildActiveExpansionScope(currentOverlayModel);
  if (capitalClaimantId) {
    const candidates = reachableCapitalCandidateNations(region.regionName, scope.anchorNation, scope.regionSet);
    return candidates.includes(capitalClaimantId) ? capitalClaimantId : '';
  }
  return resolveCapitalClaimantForRegion(region.regionName, scope);
}
function reachableCapitalCandidateDescriptors(anchorModel = currentOverlayModel, {manualEnvelopeModel = null} = {}) {
  const model = manualEnvelopeModel || buildManualEnvelopeModel(anchorModel, {includeAnchorOnly: true});
  const cacheKey = reachableCapitalCandidateDescriptorCacheKey(model);
  const cached = getCachedLruValue(
    reachableCapitalCandidateDescriptorCache,
    cacheKey,
    'reachableCapitalCandidateDescriptorCacheHits'
  );
  if (cached) return cached;
  recordRenderStat('reachableCapitalCandidateDescriptorBuilds');
  if (!model?.regionItems?.length) {
    return setCachedLruValue(
      reachableCapitalCandidateDescriptorCache,
      cacheKey,
      [],
      REACHABLE_CAPITAL_CANDIDATE_DESCRIPTOR_CACHE_LIMIT
    );
  }
  const resultSet = manualEnvelopeVisibleRegionSet(model);
  const pinned = getPinnedRegionIds();
  const candidates = [];
  for (const item of model.regionItems) {
    if (pinned.has(item.region)) continue;
    const nations = reachableCapitalCandidateNations(item.region, model.anchorNation, resultSet);
    if (!nations.length) continue;
    const region = regionByName[item.region];
    const lab = labelPosition(region);
    const candidateNationId = nations[0];
    candidates.push({
      region: item.region,
      capitalRegionId: item.region,
      depth: item.primary.depth,
      sourceCount: item.overlapSources.length,
      primaryNation: candidateNationId,
      candidateNationId,
      nations,
      x: lab?.x,
      y: lab?.y,
    });
  }
  return setCachedLruValue(
    reachableCapitalCandidateDescriptorCache,
    cacheKey,
    candidates.sort((a, b) => (
      a.depth - b.depth
      || a.region.localeCompare(b.region)
      || a.primaryNation.localeCompare(b.primaryNation)
    )),
    REACHABLE_CAPITAL_CANDIDATE_DESCRIPTOR_CACHE_LIMIT
  );
}
function reachableCandidateNationsText(candidate) {
  const names = candidate.nations.map(nation => nationDisplayName(nation));
  return names.slice(0, 3).join(', ') + (names.length > 3 ? `, +${names.length - 3}` : '');
}
function reachableCandidateMarkerLabel(candidate) {
  return t('reachableCandidates.marker', {
    region: localizedRegionName(regionByName[candidate.region] || candidate.region),
    nations: reachableCandidateNationsText(candidate),
  });
}
function reachableCandidateRow(candidate) {
  const label = localizedRegionName(regionByName[candidate.region] || candidate.region);
  const depth = t('reachableCandidates.depth', {depth: formatNumber(candidate.depth)});
  const nations = reachableCandidateNationsText(candidate);
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
function commitReachableCapitalSelection(region, capitalClaimantId = '') {
  const claimant = resolveReachableCapitalSelectionClaimant(region, capitalClaimantId);
  if (!region?.regionName || !claimant) return false;
  const shouldRefreshIncomingOverlay = !!getActiveIncomingClaimKey();
  setHoveredRegionState(region.regionName, region.nationTag);
  setFocusedRegionState(region.regionName);
  const changedSelectionRegionIds = setSelectedRegionIds([region.regionName]);
  pinRegionState(region.regionName, {capitalClaimant: claimant});
  updateSecondaryCapitalPreview(region);
  updateSelectedRegions({bounded: true, changedRegionIds: changedSelectionRegionIds});
  if (getActiveNation()) {
    updateNationOverlay(getActiveNation(), {
      renderDetails: true,
      updateFilters: false,
      updateSelected: false,
      renderMap: shouldRefreshIncomingOverlay,
      updateManualExpansion: shouldRefreshIncomingOverlay,
    });
  }
  return true;
}
function selectReachableCapitalCandidate(candidate) {
  const region = regionByName[candidate?.region];
  return commitReachableCapitalSelection(region, candidate?.primaryNation || '');
}
function reachableCapitalCandidateForRegion(regionName, anchorModel = currentOverlayModel) {
  if (!getShowReachableCapitalCandidates() || !regionName) return null;
  return reachableCapitalCandidateDescriptors(anchorModel)
    .find(candidate => candidate.region === regionName) || null;
}
function selectReachableCapitalCandidateRegion(regionName, anchorModel = currentOverlayModel) {
  const candidate = reachableCapitalCandidateForRegion(regionName, anchorModel);
  return candidate ? selectReachableCapitalCandidate(candidate) : false;
}
function shouldKeepActiveNationForCapitalRegion(region, anchorModel = currentOverlayModel) {
  const anchorNation = manualEnvelopeAnchorNation(anchorModel);
  return !!region?.regionName
    && !!anchorNation
    && !!(getLockedNation() || getActiveNation())
    && isCapitalRegionForNation(anchorNation, region.regionName);
}
function selectActiveNationCapitalRegion(region, anchorModel = currentOverlayModel) {
  if (!shouldKeepActiveNationForCapitalRegion(region, anchorModel)) return false;
  setHoveredRegionState(region.regionName, region.nationTag);
  setFocusedRegionState(region.regionName);
  const changedSelectionRegionIds = setSelectedRegionIds([region.regionName]);
  pinRegionState(region.regionName);
  updateSecondaryCapitalPreview(region);
  updateSelectedRegions({bounded: true, changedRegionIds: changedSelectionRegionIds});
  return true;
}
function bindReachableCapitalCandidatePanelEvents() {
  if (!reachableCandidatesPanel) return;
  reachableCandidatesPanel.querySelectorAll('[data-candidate-focus]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const region = regionByName[button.dataset.candidateFocus];
      commitReachableCapitalSelection(region, button.dataset.candidateNation || '');
    });
  });
}
function renderReachableCapitalCandidatesPanel(anchorModel = currentOverlayModel, {candidates} = {}) {
  if (!reachableCandidatesPanel) return;
  const checked = getShowReachableCapitalCandidates();
  if (!checked) {
    reachableCandidatesPanel.innerHTML = '';
    return;
  }
  const resolvedCandidates = candidates ?? reachableCapitalCandidateDescriptors(anchorModel);
  const body = resolvedCandidates.length
    ? `<div class="reachableCandidateList">${resolvedCandidates.map(reachableCandidateRow).join('')}</div>`
    : `<div class="reachableCandidateEmpty small">${escapeHtml(t('reachableCandidates.empty'))}</div>`;
  reachableCandidatesPanel.innerHTML = `
    <div class="reachableCandidateToolbar">
      <span class="reachableCandidateCount">${escapeHtml(t('reachableCandidates.count', {count: formatNumber(resolvedCandidates.length)}))}</span>
    </div>
    ${body}
  `;
  bindReachableCapitalCandidatePanelEvents();
}
function reachableCapitalCandidateRenderKey(candidates, copyContexts = worldCopyContexts) {
  if (!getShowReachableCapitalCandidates() || !candidates.length) return REACHABLE_CAPITAL_CANDIDATES_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'reachable-capital-candidates',
    copyPlan: copyContextRenderKey(copyContexts),
    language: currentLanguage,
    candidates: candidates.map(candidate => `${candidate.region}:${candidate.depth}:${candidate.sourceCount}:${candidate.primaryNation}:${candidate.nations.join(',')}`).join('|'),
  });
}
function syncReachableCapitalCandidateHoverState() {
  if (!gReachableCapitalCandidates) return;
  const hoveredRegion = getHoveredRegionName();
  gReachableCapitalCandidates.querySelectorAll('.reachable-capital-candidate[data-candidate-region]').forEach(marker => {
    const active = !!hoveredRegion && marker.dataset.candidateRegion === hoveredRegion;
    marker.classList.toggle('is-selected', active);
    marker.classList.toggle('is-idle', !active);
  });
}
function appendReachableCapitalCandidateMarker(frag, candidate, copyContext = defaultWorldCopyContext()) {
  const region = regionByName[candidate.region];
  if (!region) return;
  appendCapitalMarkerGroup(frag, region, {
    nation: candidate.primaryNation,
    selected: candidate.region === getHoveredRegionName(),
    copyContext,
    className: 'reachable-capital-candidate',
    ariaLabel: reachableCandidateMarkerLabel(candidate),
    dataset: {
      candidateRegion: candidate.region,
      candidateNation: candidate.primaryNation,
      candidateDepth: candidate.depth,
      candidateSourceCount: candidate.sourceCount,
    },
    starClassName: 'reachable-capital-candidate-star',
    starDataset: {
      candidateFocus: candidate.region,
      candidateNation: candidate.primaryNation,
    },
  });
}
function createReachableCapitalCandidateFragment(candidates, {copyContexts=worldCopyContexts} = {}) {
  return createProjectedCopyFragment(copyContexts, 'reachable-capital-candidate-copy', copyContext => {
    const frag = document.createDocumentFragment();
    candidates.forEach(candidate => appendReachableCapitalCandidateMarker(frag, candidate, copyContext));
    return frag;
  });
}
function renderReachableCapitalCandidateMarkers(anchorModel = currentOverlayModel, {copyContexts=worldCopyContexts, candidates} = {}) {
  if (!gReachableCapitalCandidates) return;
  const resolvedCandidates = getShowReachableCapitalCandidates()
    ? (candidates ?? reachableCapitalCandidateDescriptors(anchorModel))
    : [];
  replaceLayerChildrenForRenderKey(
    gReachableCapitalCandidates,
    reachableCapitalCandidateLayerRenderKeys,
    reachableCapitalCandidateRenderKey(resolvedCandidates, copyContexts),
    () => createReachableCapitalCandidateFragment(resolvedCandidates, {copyContexts}),
    'reachableCapitalCandidateRebuilds'
  );
  syncReachableCapitalCandidateHoverState();
}
function refreshReachableCapitalCandidateOutputs(anchorModel = currentOverlayModel) {
  const candidates = getShowReachableCapitalCandidates()
    ? reachableCapitalCandidateDescriptors(anchorModel)
    : [];
  renderReachableCapitalCandidatesPanel(anchorModel, {candidates});
  renderReachableCapitalCandidateMarkers(anchorModel, {candidates});
}
function getClaimOverlayDescriptorSet(model) {
  const cacheKey = claimOverlayDescriptorCacheKey(model);
  const cached = getCachedLruValue(claimOverlayDescriptorCache, cacheKey, 'claimOverlayDescriptorCacheHits');
  if (cached) return cached;
  recordRenderStat('claimOverlayDescriptorBuilds');
  return setCachedLruValue(
    claimOverlayDescriptorCache,
    cacheKey,
    {cacheKey, descriptors: claimOverlayPathDescriptors(model)},
    OVERLAY_DESCRIPTOR_CACHE_LIMIT
  );
}
function getClaimLabelDescriptorSet(model) {
  const cacheKey = claimLabelDescriptorCacheKey(model);
  const cached = getCachedLruValue(claimLabelDescriptorCache, cacheKey, 'claimLabelDescriptorCacheHits');
  if (cached) return cached;
  recordRenderStat('claimLabelDescriptorBuilds');
  return setCachedLruValue(
    claimLabelDescriptorCache,
    cacheKey,
    {cacheKey, descriptors: claimLabelDescriptors(model)},
    OVERLAY_DESCRIPTOR_CACHE_LIMIT
  );
}
function claimOverlayPathRenderKey(model, descriptorSet, copyContexts = worldCopyContexts) {
  if (!model) return CLAIM_OVERLAY_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'claim-overlay-paths',
    copyPlan: copyContextRenderKey(copyContexts),
    descriptorKey: descriptorSet?.cacheKey || '',
  });
}
function claimLabelRenderKey(model, descriptorSet, copyContexts = worldCopyContexts) {
  if (!model) return CLAIM_LABEL_EMPTY_RENDER_KEY;
  return JSON.stringify({
    kind: 'claim-labels',
    copyPlan: copyContextRenderKey(copyContexts),
    descriptorKey: descriptorSet?.cacheKey || '',
  });
}
function createClaimOverlayPathFragment(descriptors, {copyContexts=worldCopyContexts} = {}) {
  const fillDescriptors = [];
  for (const descriptor of descriptors) {
    const r = regionByName[descriptor.region];
    if (!r) continue;
    fillDescriptors.push({
      path: r.path,
      className: descriptor.fillClassName || 'claim-fill-group',
      fill: descriptor.fill,
      fillOpacity: descriptor.fillOpacity,
      groupKey: descriptor.fillKey || `${descriptor.project || ''}:${descriptor.fill || ''}`,
      dataset: {
        fillKey: descriptor.fillKey || descriptor.project || descriptor.fill || '',
        project: descriptor.project,
      },
    });
  }
  const fillGroups = buildVisualFillGroups(fillDescriptors);
  return createProjectedCopyFragment(copyContexts, 'claim-overlay-copy', copyContext => {
    const frag = document.createDocumentFragment();
    const copyData = worldCopyDataset(copyContext);
    for (const group of fillGroups) {
      frag.appendChild(createSvgElement('path', {
        d: group.paths.join(' '),
        class: group.className,
        fill: group.fill,
        'fill-opacity': group.fillOpacity === '' ? null : group.fillOpacity,
      }, {
        ...group.dataset,
        visualGroupSize: group.paths.length,
        ...copyData,
      }));
    }
    for (const descriptor of descriptors) {
      const r = regionByName[descriptor.region];
      if (!r) continue;
      frag.appendChild(createSvgElement('path', {
        d: r.path,
        class: descriptor.className,
        fill: 'none',
      }, {
        region: descriptor.region,
        project: descriptor.project,
        ...copyData,
      }));
    }
    return frag;
  });
}
function createClaimLabelFragment(descriptors, {copyContexts=worldCopyContexts} = {}) {
  return createProjectedCopyFragment(copyContexts, 'claim-label-copy', copyContext => {
    const frag = document.createDocumentFragment();
    const copyData = worldCopyDataset(copyContext);
    for (const descriptor of descriptors) {
      frag.appendChild(createSvgElement('text', {
        class: 'claim-label',
        x: descriptor.x,
        y: descriptor.y,
        textContent: descriptor.text,
      }, {
        region: descriptor.region,
        ...copyData,
      }));
    }
    return frag;
  });
}

function runAfterAnimationFrames(frameCount, callback) {
  if (frameCount <= 0) {
    callback();
    return;
  }
  let remaining = frameCount;
  const step = () => {
    remaining -= 1;
    if (remaining <= 0) callback();
    else window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

function setOverlayBufferActive(buffer, active) {
  if (!buffer) return;
  buffer.style.display = active ? '' : 'none';
  buffer.dataset.overlayBufferActive = active ? '1' : '0';
  buffer.setAttribute('aria-hidden', active ? 'false' : 'true');
}

function createOverlayBufferGroup(className, index, active = false) {
  const buffer = createSvgElement('g', {class: className}, {overlayBuffer: index});
  setOverlayBufferActive(buffer, active);
  return buffer;
}

function getBufferedLayerState(layer, stateStore, bufferClassName) {
  if (!layer) return null;
  let state = stateStore.get(layer);
  if (state) return state;
  const buffers = [
    createOverlayBufferGroup(bufferClassName, 0, true),
    createOverlayBufferGroup(bufferClassName, 1, false),
  ];
  replaceLayerChildren(layer, buffers);
  state = {
    buffers,
    visibleIndex: 0,
    generation: 0,
    pendingKey: '',
    pendingGeneration: 0,
  };
  stateStore.set(layer, state);
  return state;
}

function clearBufferedLayerChildrenForRenderKey(layer, keyStore, stateStore, bufferClassName, emptyKey, statKey) {
  if (!layer) return false;
  const state = getBufferedLayerState(layer, stateStore, bufferClassName);
  const alreadyEmpty = keyStore.get(layer) === emptyKey
    && state.buffers.every(buffer => !buffer.childNodes.length)
    && !state.pendingKey;
  if (alreadyEmpty) return false;
  state.generation += 1;
  state.pendingKey = '';
  state.pendingGeneration = 0;
  state.visibleIndex = 0;
  state.buffers.forEach((buffer, index) => {
    replaceLayerChildren(buffer);
    delete buffer.dataset.renderGeneration;
    setOverlayBufferActive(buffer, index === state.visibleIndex);
  });
  keyStore.set(layer, emptyKey);
  recordRenderStat(statKey);
  return true;
}

function replaceBufferedLayerChildrenForRenderKey(
  layer,
  keyStore,
  stateStore,
  bufferClassName,
  nextKey,
  buildChildren,
  statKey,
  inactiveBufferStatKey,
  swapStatKey,
  staleStatKey
) {
  if (!layer) return false;
  const state = getBufferedLayerState(layer, stateStore, bufferClassName);
  if (keyStore.get(layer) === nextKey) {
    if (state.pendingKey && state.pendingKey !== nextKey) {
      state.generation += 1;
      state.pendingKey = '';
      state.pendingGeneration = 0;
    }
    return false;
  }

  const generation = state.generation + 1;
  state.generation = generation;
  state.pendingKey = nextKey;
  state.pendingGeneration = generation;
  const inactiveIndex = state.visibleIndex === 0 ? 1 : 0;
  const inactiveBuffer = state.buffers[inactiveIndex];
  replaceLayerChildren(inactiveBuffer, buildChildren());
  inactiveBuffer.dataset.renderGeneration = String(generation);
  recordRenderStat(inactiveBufferStatKey);

  runAfterAnimationFrames(claimOverlayCommitDelayFrames, () => {
    const stillCurrent = state.generation === generation
      && state.pendingGeneration === generation
      && state.pendingKey === nextKey;
    if (!stillCurrent) {
      recordRenderStat(staleStatKey);
      if (inactiveBuffer.dataset.renderGeneration === String(generation)) {
        replaceLayerChildren(inactiveBuffer);
        delete inactiveBuffer.dataset.renderGeneration;
      }
      return;
    }

    const previousBuffer = state.buffers[state.visibleIndex];
    state.visibleIndex = inactiveIndex;
    state.pendingKey = '';
    state.pendingGeneration = 0;
    delete inactiveBuffer.dataset.renderGeneration;
    setOverlayBufferActive(inactiveBuffer, true);
    setOverlayBufferActive(previousBuffer, false);
    replaceLayerChildren(previousBuffer);
    delete previousBuffer.dataset.renderGeneration;
    keyStore.set(layer, nextKey);
    recordRenderStat(statKey);
    recordRenderStat(swapStatKey);
  });
  return true;
}

function replaceLayerChildrenForRenderKey(layer, keyStore, nextKey, buildChildren, statKey) {
  if (!layer) return false;
  if (keyStore.get(layer) === nextKey) return false;
  recordRenderStat(statKey);
  replaceLayerChildren(layer, buildChildren());
  keyStore.set(layer, nextKey);
  return true;
}
function clearClaimOverlayDom(renderContext = {}) {
  clearBufferedLayerChildrenForRenderKey(
    renderContext.claimOverlayLayer || gClaimOverlays,
    claimOverlayLayerRenderKeys,
    claimOverlayBufferStates,
    'claim-overlay-buffer',
    CLAIM_OVERLAY_EMPTY_RENDER_KEY,
    'claimOverlayDomReplacements'
  );
  clearBufferedLayerChildrenForRenderKey(
    renderContext.claimLabelLayer || gClaimLabels,
    claimLabelLayerRenderKeys,
    claimLabelBufferStates,
    'claim-label-buffer',
    CLAIM_LABEL_EMPTY_RENDER_KEY,
    'claimLabelDomReplacements'
  );
}
function renderMapOverlay(model, renderContext = {}) {
  const copyContexts = renderContext.copyContexts || worldCopyContexts;
  setOverlayVisualState(model);
  applyMapVisualState(renderContext);
  const overlayDescriptorSet = getClaimOverlayDescriptorSet(model);
  const labelDescriptorSet = getClaimLabelDescriptorSet(model);
  replaceBufferedLayerChildrenForRenderKey(
    renderContext.claimOverlayLayer || gClaimOverlays,
    claimOverlayLayerRenderKeys,
    claimOverlayBufferStates,
    'claim-overlay-buffer',
    claimOverlayPathRenderKey(model, overlayDescriptorSet, copyContexts),
    () => createClaimOverlayPathFragment(overlayDescriptorSet.descriptors, {copyContexts}),
    'claimOverlayDomReplacements',
    'claimOverlayInactiveBufferRebuilds',
    'claimOverlayBufferSwaps',
    'claimOverlayStaleRenderSkips'
  );
  replaceBufferedLayerChildrenForRenderKey(
    renderContext.claimLabelLayer || gClaimLabels,
    claimLabelLayerRenderKeys,
    claimLabelBufferStates,
    'claim-label-buffer',
    claimLabelRenderKey(model, labelDescriptorSet, copyContexts),
    () => createClaimLabelFragment(labelDescriptorSet.descriptors, {copyContexts}),
    'claimLabelDomReplacements',
    'claimLabelInactiveBufferRebuilds',
    'claimLabelBufferSwaps',
    'claimLabelStaleRenderSkips'
  );
  renderCapitalMarkers({copyContexts});
}
function renderClaimSummaryPill(model) {
  document.getElementById('claimPill').textContent = t('pill.claimSummary', {
    nation: nationDisplayName(model.nation),
    owned: model.ownedCount,
    claims: model.claimCount,
    projects: model.projectCount,
  });
}
function renderNationInfoPanel(panelRoot, model) {
  const activeNationName = nationDisplayName(model.nation);
  const activeNationTierText = claimTierCountShortText(nationClaimTierCount(model.nation));
  const summaryLines = [
    t('nationInfo.summary.baseTerritory', {owned: regionCountText(model.ownedCount)}),
    t('nationInfo.summary.visibleClaims', {claims: regionCountText(model.claimCount)}),
  ];
  if (model.data.breakawayFrom) summaryLines.push(t('nationInfo.summary.breakaway', {nation: model.data.breakawayFrom}));
  const summaryHtml = summaryLines.map(line => `<div class="small nationSummaryLine">${escapeHtml(line)}</div>`).join('');
  const kvRows = [
    [t('nationInfo.kv.status'), statusLabel(model.data.status)],
    [t('nationInfo.kv.capitalRegion'), capitalRegionsText(model.data)],
    [t('nationInfo.kv.baseTerritory'), regionCountText(model.ownedCount)],
    [t('nationInfo.kv.directClaims'), uniqueRegionCountText(model.data.totalClaimRegions || 0)],
    [t('nationInfo.kv.targetedRegions'), `${regionCountText(incomingTargetRegions(model.data, model.baseSet).size)} · ${claimGroupCountText(model.incomingEntries.length)}`],
    [t('nationInfo.kv.conditional'), regionCountText(model.gatedCount)],
    [t('nationInfo.kv.claimProjects'), claimTierCountText(nationClaimTierCount(model.nation))],
    [t('nationInfo.kv.displayMode'), claimModeLabel(claimModeSel.value)],
  ].map(([label, value]) => `<div>${escapeHtml(label)}</div><div>${escapeHtml(value)}</div>`).join('');
  const basicInfo = `<details class="infoSubsection nationBasicSection" data-info-section="basic"${infoSectionOpenAttribute('basic')}><summary><span>${escapeHtml(t('nationInfo.basic.title'))}</span></summary><div class="infoSubsectionBody"><div class="nationTitle"><b>${escapeHtml(activeNationName)}</b> <span class="status tierBadge">${escapeHtml(activeNationTierText)}</span> ${statusBadge(model.data.status)}</div><div class="nationSummary">${summaryHtml}</div><div class="kv">${kvRows}</div><div class="hint">${escapeHtml(t('nationInfo.hint'))}</div></div></details>`;
  panelRoot.innerHTML = `${basicInfo}<div class="claimSections">${renderClaimSection(t('claimSection.outgoing.title'), model.outgoingEntries, t('claimSection.outgoing.empty'), 'outgoing')}${renderClaimSection(t('claimSection.incoming.title'), model.incomingEntries, t('claimSection.incoming.empty'), 'incoming')}</div>`;
}
function bindNationOverlayPanelEvents(panelRoot, model) {
  bindNationInfoSectionToggles();
  panelRoot.querySelectorAll('.claimListItem').forEach(el => el.addEventListener('click', () => {
    const kind = el.dataset.claimKind;
    const index = Number(el.dataset.claimIndex);
    const source = kind === 'incoming' ? model.incomingEntries[index] : model.outgoingEntries[index];
    if (!source) return;
    if (kind === 'incoming') {
      // Incoming cards are invitations to inspect the claimant's resulting country,
      // not a special overlay mode for the currently selected target nation.
      // Switch the active nation/claim context to the claimant and select the
      // corresponding outgoing claim there; keep the current target region focused.
      const claimant = source.claimant || '';
      if (!claimant) return;
      setActiveIncomingClaimKeyState('');
      setLockedNationState(claimant);
      setHoverNationState();
      setProjectFilterState(outgoingClaimKey(source));
      claimModeSel.value = 'project';
      if (source.project) projectSel.value = source.project;
      else projectSel.value = '';
      search.value = humanizeNationLabel(claimant);
      search.dataset.selectedNation = claimant;
      closeNationDropdown();
      updateNationOverlay(claimant);
      return;
    }
    const key = outgoingClaimKey(source);
    setActiveIncomingClaimKeyState('');
    setProjectFilterState(claimModeSel.value === 'project' && getProjectFilter() === key ? '' : key);
    claimModeSel.value = getProjectFilter() ? 'project' : 'all';
    if (getProjectFilter() && getProjectFilter() !== '__base__') projectSel.value = getProjectFilter();
    else projectSel.value = '';
    // Switching claim cards should change the active claim overlay, not the
    // currently focused region. Region rows inside a claim card call
    // focusRegions(..., { preserveNation: true }) when the user explicitly
    // wants to move focus to a specific target/result region.
    updateNationOverlay(model.nation);
    updateSelectedRegions();
  }));
  panelRoot.querySelectorAll('.legendRegionItem[data-region-name]').forEach(el => el.addEventListener('click', e => {
    e.stopPropagation();
    const rn = el.dataset.regionName;
    if (rn) {
      focusRegions([rn], {selectSingle:true, preserveNation:true, refreshOverlay:true});
      pinRegionState(rn);
    }
  }));
}
function updateNationOverlay(
  nation,
  {
    renderDetails = shouldRenderCommittedNationDetails(),
    updateFilters = renderDetails,
    updateSelected = renderDetails,
    renderMap = true,
    updateManualExpansion = renderMap,
  } = {}
) {
  setActiveNationState(nation);
  if (renderDetails) updateProjectOptions(getActiveNation());
  if (!getActiveNation()) {
    clearHoverClaimPreviewOverlay({force: true});
    currentOverlayModel = null;
    visibleNationRegionNames = new Set();
    clearOverlayVisualState();
    applyMapVisualState();
    setSecondaryHoverNationState();
    clearClaimOverlayDom({claimOverlayLayer: gClaimOverlays, claimLabelLayer: gClaimLabels});
    clearManualEnvelopeOverlay();
    refreshReachableCapitalCandidateOutputs(null);
    renderHoverOutlines();
    if (renderDetails) nationInfo.textContent = t('nationInfo.empty');
    setClaimsPillEmpty();
    if (updateFilters) applyFilters(false);
    if (updateSelected) updateSelectedRegions();
    return;
  }
  clearHoverClaimPreviewOverlay({force: true});
  const overlayModel = getNationOverlayModel(activeData, derivedIndices, getActiveNation());
  setActiveIncomingClaimKeyState(overlayModel.activeIncomingClaimKey);
  currentOverlayModel = overlayModel;
  visibleNationRegionNames = new Set(overlayModel.resultSet);
  if (renderMap) renderMapOverlay(overlayModel, {claimOverlayLayer: gClaimOverlays, claimLabelLayer: gClaimLabels, mapView});
  if (updateManualExpansion) {
    renderManualEnvelopeOverlay(overlayModel);
    refreshReachableCapitalCandidateOutputs(overlayModel);
  }
  if (renderMap) {
    refreshSecondaryCapitalPreviewForHoveredRegion();
    renderHoverOutlines();
  }
  renderClaimSummaryPill(overlayModel);
  if (renderDetails) {
    renderNationInfoPanel(nationInfo, overlayModel);
    bindNationOverlayPanelEvents(nationInfo, overlayModel);
  }
  if (updateFilters) applyFilters(false);
  if (updateSelected) updateSelectedRegions();
}
function updateProjectOptions(nation) {
  const current = getProjectFilter() && getProjectFilter() !== '__base__' ? getProjectFilter() : '';
  const d = CLAIMS_BY_NATION[nation];
  const directEntries = d ? sortedProjectEntries((d.projects || []).filter(e => e.project)) : [];
  const entries = cumulativeClaimEntries(directEntries);
  const opts = [`<option value="">${escapeHtml(t('project.all'))}</option>`].concat(entries.map(e => `<option value="${escapeHtml(e.project)}">${escapeHtml(projectDisplay(e.project))} (${e.regions.length})</option>`));
  projectSel.innerHTML = opts.join('');
  if ([...projectSel.options].some(o => o.value === current)) projectSel.value = current;
  else projectSel.value = '';
}
function selectRegion(r) {
  if (commitReachableCapitalSelection(r)) return;
  if (selectActiveNationCapitalRegion(r)) return;
  setHoveredRegionState(r.regionName, r.nationTag);
  setFocusedRegionState(r.regionName);
  setSelectedRegionIds([r.regionName]);
  focusNation(r.nationTag);
  pinRegionState(r.regionName);
}
function applyFilters(rerenderResults=true) {
  const q = searchFilterText();
  let visible=0; const matches=[]; const hiddenRegionIds = new Set();
  regionPathElements.filter(p => p.dataset.wrapCanonical !== '0').forEach(p => {
    const r = REGIONS[Number(p.dataset.id)];
      const text = (r.name+' '+r.regionName+' '+localizedRegionName(r)+' '+(r.primaryCity || '')+' '+Object.values(r.displayName || {}).join(' ')+' '+r.nationTag).toLowerCase();
    const okQ = !q || text.includes(q);
    const ok = okQ;
    if (!ok) hiddenRegionIds.add(r.regionName);
    if (ok) { visible++; if (matches.length<90) matches.push(r); }
  });
  setHiddenVisualState(hiddenRegionIds);
  applyMapVisualState();
  syncNormalRegionColorVisibility();
  labelTextElements.forEach(t => {
    const r = REGIONS[Number(t.dataset.id)];
    const okQ = !q || (r.name+' '+r.regionName+' '+localizedRegionName(r)+' '+(r.primaryCity || '')+' '+Object.values(r.displayName || {}).join(' ')+' '+r.nationTag).toLowerCase().includes(q);
    t.style.display = okQ ? '' : 'none';
  });
  if (rerenderResults && results) {
    const nationMatches = q ? matchingNationChoices(q, 25) : [];
    const nationHtml = nationMatches.map(c => `<div class="item nationResult" data-nation="${escapeHtml(c.tag)}"><b>${escapeHtml(c.label)}</b><div class="small">${escapeHtml(t('results.nation', {tag: c.tag}))}</div></div>`).join('');
    const regionHtml = matches.map(r => `<div class="item" data-id="${r.id}"><b>${escapeHtml(localizedRegionName(r))}</b><div class="small">${escapeHtml(r.name)} · ${escapeHtml(r.nationTag)}</div></div>`).join('');
    const empty = !nationHtml && !regionHtml ? `<div class="item small">${escapeHtml(t('search.noResults'))}</div>` : '';
    results.innerHTML = nationHtml + regionHtml + empty;
    results.querySelectorAll('.item[data-nation]').forEach(el => el.addEventListener('click', () => focusNation(el.dataset.nation)));
    results.querySelectorAll('.item[data-id]').forEach(el => el.addEventListener('click', () => selectRegion(REGIONS[Number(el.dataset.id)])));
  }
}
function populate() {
  buildNationChoices();
  buildIncomingClaimIndex();
  const warn = document.getElementById('warnPill');
  if (warn && CLAIM_STATS.regionsUnmatched) { warn.style.display=''; warn.textContent = t('warn.unmatchedClaimRows', {count: CLAIM_STATS.regionsUnmatched}); }
  else if (warn) { warn.style.display='none'; warn.textContent = ''; }
}
function refreshLanguage() {
  applyStaticTranslations();
  populate();
  const selectedNation = search.dataset.selectedNation || '';
  if (selectedNation) search.value = humanizeNationLabel(selectedNation);
  renderNationDropdown();
  const committedNation = getLockedNation();
  if (committedNation) {
    updateNationOverlay(committedNation);
  } else if (getHoverNation()) {
    updateHoverNationPreview(getHoverNation());
  } else {
    updateNationOverlay('');
  }
  applyFilters(true);
  updateSelectedRegions();
  renderPinnedRegionsPanel();
  renderPinnedRegionMarkers();
  renderManualEnvelopeOverlay(currentOverlayModel);
  refreshReachableCapitalCandidateOutputs(currentOverlayModel);
  const hoveredRegion = tooltipRegionId != null ? REGIONS[tooltipRegionId] : null;
  setHoverPill(hoveredRegion);
}

injectClaimOverlayStyles();
applyStaticTranslations();
initAsideCards();

search.addEventListener('focus', () => openNationDropdown());
search.addEventListener('click', () => openNationDropdown());
search.addEventListener('input', () => {
  if (search.dataset.selectedNation && parseNationSearchValue(search.value) !== search.dataset.selectedNation) {
    search.dataset.selectedNation = '';
    setLockedNationState();
    setSelectedRegionIds();
    setFocusedRegionState();
    resetTransientClaimState();
    updateNationOverlay(getHoverNation() || '');
  }
  openNationDropdown();
  highlightedNationChoiceIndex = currentDropdownChoices.length ? 0 : -1;
  renderNationDropdown();
  applyFilters(true);
});
search.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!nationDropdownOpen) openNationDropdown();
    highlightedNationChoiceIndex = Math.min(currentDropdownChoices.length - 1, highlightedNationChoiceIndex + 1);
    renderNationDropdown();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (!nationDropdownOpen) openNationDropdown();
    highlightedNationChoiceIndex = Math.max(0, highlightedNationChoiceIndex - 1);
    renderNationDropdown();
  } else if (e.key === 'Enter') {
    if (nationDropdownOpen && highlightedNationChoiceIndex >= 0) {
      e.preventDefault();
      chooseNationFromDropdown();
    } else {
      const selectedNation = parseNationSearchValue(search.value);
      if (selectedNation) {
        e.preventDefault();
        focusNation(selectedNation);
      }
    }
  } else if (e.key === 'Escape') {
    closeNationDropdown();
  }
});
if (nationDropdown) {
  nationDropdown.addEventListener('mousedown', e => e.preventDefault());
  nationDropdown.addEventListener('click', e => {
    const option = e.target.closest('.searchOption[data-index]');
    if (!option) return;
    chooseNationFromDropdown(Number(option.dataset.index));
  });
}
if (languageSel) {
  languageSel.addEventListener('change', () => {
    currentLanguage = normalizeLanguage(languageSel.value);
    saveLanguage(currentLanguage);
    refreshLanguage();
  });
}
if (scenarioSel) {
  scenarioSel.addEventListener('change', () => {
    if (!setActiveScenario(scenarioSel.value)) syncScenarioControls();
  });
}
document.addEventListener('click', e => {
  if (!nationSearchCombo?.contains(e.target)) closeNationDropdown();
});
baseModeSel.addEventListener('change', renderRegions);
claimModeSel.addEventListener('change', () => {
  setActiveIncomingClaimKeyState('');
  if (claimModeSel.value !== 'project') setProjectFilterState('');
  else if (!getProjectFilter()) setProjectFilterState(projectSel.value || '');
  updateNationOverlay(getCurrentNation());
});
claimKindSel.addEventListener('change', () => updateNationOverlay(getCurrentNation()));
projectSel.addEventListener('change', () => {
  setActiveIncomingClaimKeyState('');
  setProjectFilterState(projectSel.value || '');
  claimModeSel.value = getProjectFilter() ? 'project' : 'all';
  updateNationOverlay(getCurrentNation());
});
document.getElementById('showLabels').addEventListener('click', () => { labelsVisible=!labelsVisible; renderLabels(); applyFilters(); });
document.getElementById('reachableCapitalsBtn')?.addEventListener('click', () => {
  toggleReachableCapitalCandidatesState();
});
if (gHitRegions) {
  gHitRegions.addEventListener('pointerover', onHitLayerPointerOver);
  gHitRegions.addEventListener('pointermove', onHitLayerPointerMove);
  gHitRegions.addEventListener('pointerout', onHitLayerPointerOut);
  gHitRegions.addEventListener('click', onHitLayerClick);
}
  svg.addEventListener('pointerdown', onMapPointerDown);
  svg.addEventListener('pointermove', onMapPointerMove);
  svg.addEventListener('pointerup', onMapPointerUp);
  svg.addEventListener('pointercancel', onMapPointerCancel);
  svg.addEventListener('lostpointercapture', onMapLostPointerCapture);

svg.addEventListener('mousemove', onMapMove);
svg.addEventListener('wheel', onMapWheel, {passive:false});
svg.addEventListener('click', e => {
  if (consumeSuppressedMapClick(e)) return;
  const target = e.target;
  if (target === svg || target === gGrid || target === gHitRegions || target.classList?.contains('graticule')) clearPinsOrSelection();
});
svg.addEventListener('mouseleave', onMapLeave);
window.addEventListener('resize', invalidateTooltipLayout);
window.addEventListener('scroll', invalidateTooltipLayout, true);
if ('ResizeObserver' in window) new ResizeObserver(invalidateTooltipLayout).observe(svgWrap);

setHoverPill();
setClaimsPillEmpty();
initMapViewControls();
renderPinnedRegionsPanel();
refreshReachableCapitalCandidateOutputs();
populate(); renderGrid({mapView}); renderRegions({mapView}); renderPinnedRegionMarkers();
dismissLoadingScreen();
}).catch((error) => {
  console.error(error);
  let language = 'ko';
  try { language = String(window.localStorage?.getItem('ti-map-language') || document.documentElement.lang || 'ko').toLowerCase().startsWith('en') ? 'en' : 'ko'; }
  catch (_) {}
  const message = language === 'en' ? 'Failed to load generated Terra Invicta map data.' : 'Terra Invicta 지도 데이터를 불러오지 못했습니다.';
  if (!showLoadingFailure(message, error)) {
    document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:24px;color:#f8fafc;background:#0b1020">${message}

${String(error && error.stack || error)}</pre>`;
  }
});
