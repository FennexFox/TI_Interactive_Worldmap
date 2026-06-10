window.TI_DATA_PROMISE.then(({regionMap, claimMap, catalogs = {}}) => {
const REGIONS = regionMap.regions;
const SUMMARY = regionMap.summary;
const NATION_COLOR_PALETTE = SUMMARY.nationColorPalette || [];
const NATION_COLOR_INDEXES = SUMMARY.nationColorIndexes || {};
const CLAIMS_BY_NATION = claimMap.claimsByNation;
const PROJECT_META = claimMap.projects;
const CLAIM_STATS = claimMap.claimStats;
const BREAKAWAYS = claimMap.breakaways || [];
const NATION_CATALOG = catalogs.nations || {};
const NATION_META = {...(claimMap.nationMeta || {}), ...((NATION_CATALOG && NATION_CATALOG.nations) || {})};

const svg = document.getElementById('map');
const gRegions = document.getElementById('regions');
const gLabels = document.getElementById('labels');
const gClaimLabels = document.getElementById('claimLabels');
const gGrid = document.getElementById('grid');
const gClaimOverlays = document.getElementById('claimOverlays');
const gSelectionOutlines = document.getElementById('selectionOutlines');
const tip = document.getElementById('tip');
const search = document.getElementById('search');
const nationDropdown = document.getElementById('nationDropdown');
const nationSearchCombo = document.getElementById('nationSearchCombo');
const baseModeSel = document.getElementById('baseMode');
const claimModeSel = document.getElementById('claimMode');
const projectSel = document.getElementById('projectSel');
const claimKindSel = document.getElementById('claimKind');
const results = document.getElementById('results');
const nationInfo = document.getElementById('nationInfo');
const legend = document.getElementById('legend');
const selectedPill = document.getElementById('selectedPill');
const languageSel = document.getElementById('languageSel');
const svgWrap = document.querySelector('.svgwrap');
const regionPathElements = [];
const labelTextElements = [];

const LANGUAGE_STORAGE_KEY = 'ti-map-language';
const ASIDE_CARD_ORDER_STORAGE_KEY = 'ti-map-aside-card-order';
const ASIDE_CARD_COLLAPSE_STORAGE_KEY = 'ti-map-aside-card-collapsed';
const NATION_INFO_SECTION_STORAGE_KEY = 'ti-map-nation-info-sections';
const DEFAULT_ASIDE_CARD_ORDER = ['explore', 'selected'];
const I18N = {
  ko: {
    'document.title': 'Terra Invicta 영유권 / 통합 지도',
    'app.title': 'Terra Invicta 영유권 / 통합 지도',
    'section.explore': '탐색 및 선택',
    'search.label': '국가/지역 검색 및 선택',
    'search.placeholder': '국가 태그, 지역명, 프로젝트명 입력: CHN, Korea, Greater India...',
    'search.help': '입력창을 클릭하면 국가 목록이 열립니다. 입력하면 국가, 지역, 영유권 프로젝트 목록이 필터링되고, 항목을 클릭하면 선택됩니다. 빈 지도 공간을 클릭하면 선택이 해제됩니다.',
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
    'button.onlyClaims': '영유권 대상만 보기',
    'button.showAllMap': '전체 지도 보기',
    'section.selectedNation': '선택한 국가',
    'sectionCard.moveUp': '카드 위로 이동',
    'sectionCard.moveDown': '카드 아래로 이동',
    'sectionCard.collapse': '카드 접기',
    'sectionCard.expand': '카드 펼치기',
    'nationInfo.basic.title': '국가 기본정보',
    'nationInfo.empty': '지도에서 국가나 지역 위에 마우스를 올리세요.',
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
    'nationInfo.kv.baseTerritory': '기본 영토',
    'nationInfo.kv.directClaims': '직접 영유권',
    'nationInfo.kv.targetedRegions': '대상 지역',
    'nationInfo.kv.conditional': '조건부',
    'nationInfo.kv.claimProjects': '연구 단계',
    'nationInfo.kv.displayMode': '표시 모드',
    'nationInfo.hint': '가장 밝은 시작색은 초기/현재 영토입니다. 영유권 색상은 기본 영유권에서 연구 단계가 높아질수록 같은 색상 축을 따라 이동합니다. 푸른 테두리는 평화적 영유권, 붉은 테두리는 적대적 영유권, 점선은 수도 영유권, 보라색/잠금 스타일은 조건부 분리 영유권입니다.',
    'legend.noClaims': '이 국가에 표시 가능한 추가 영유권 프로젝트가 없습니다.',
    'legend.showAllTitle': '모든 영유권 표시',
    'legend.initial.title': '초기/현재 영토',
    'legend.initial.detail': '현재/시작 영토 · 클릭하면 모든 영유권 표시로 돌아갑니다',
    'legend.researchTier': '연구 단계 {tier}{cost}',
    'legend.researchCost': ' · 비용 {cost}',
    'legend.basicTier': '기본 영유권 · 연구 불필요 · 초기 영토 제외',
    'legend.projectLine': '{project} · {research} · {regions} · 평화 {peaceful} / 적대 {hostile}{capital}{gated}',
    'results.nation': '국가 선택 · 태그 {tag}',
    'error.loadFailed': 'Terra Invicta 지도 데이터를 불러오지 못했습니다.',
  },
  en: {
    'document.title': 'Terra Invicta Claim / Unification Map',
    'app.title': 'Terra Invicta Claim / Unification Map',
    'section.explore': 'Explore and Select',
    'search.label': 'Search and select nation/region',
    'search.placeholder': 'Enter a nation tag, region, or project: CHN, Korea, Greater India...',
    'search.help': 'Click the field to open the nation list. Typing filters nations, regions, and claim projects; click an item to select it. Click empty map space to clear the selection.',
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
    'button.onlyClaims': 'Show claim targets only',
    'button.showAllMap': 'Show full map',
    'section.selectedNation': 'Selected Nation',
    'sectionCard.moveUp': 'Move card up',
    'sectionCard.moveDown': 'Move card down',
    'sectionCard.collapse': 'Collapse card',
    'sectionCard.expand': 'Expand card',
    'nationInfo.basic.title': 'Basic Nation Info',
    'nationInfo.empty': 'Hover a nation or region on the map.',
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
    'nationInfo.kv.baseTerritory': 'Base territory',
    'nationInfo.kv.directClaims': 'Direct claims',
    'nationInfo.kv.targetedRegions': 'Targeted regions',
    'nationInfo.kv.conditional': 'Conditional',
    'nationInfo.kv.claimProjects': 'Research tiers',
    'nationInfo.kv.displayMode': 'Display mode',
    'nationInfo.hint': 'The brightest starting color marks initial/current territory. Claim colors move along one color scale from baseline claims through higher research tiers. Blue outlines are peaceful claims, red outlines are hostile claims, dashed outlines are capital claims, and purple/locked styling marks conditional breakaway claims.',
    'legend.noClaims': 'This nation has no additional claim projects to display.',
    'legend.showAllTitle': 'Show all claims',
    'legend.initial.title': 'Initial/current territory',
    'legend.initial.detail': 'Current/starting territory · click to return to all claims',
    'legend.researchTier': 'research tier {tier}{cost}',
    'legend.researchCost': ' · cost {cost}',
    'legend.basicTier': 'claim tier 0 · no research · not initial territory',
    'legend.projectLine': '{project} · {research} · {regions} · peaceful {peaceful} / hostile {hostile}{capital}{gated}',
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
function updateOnlyClaimsButtonLabel() {
  const el = document.getElementById('onlyClaimsBtn');
  if (el) el.textContent = onlyClaims ? t('button.showAllMap') : t('button.onlyClaims');
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
  updateOnlyClaimsButtonLabel();
  updateAsideCardControls();
}

const regionByName = Object.fromEntries(REGIONS.map(r => [r.regionName, r]));
const pathByRegion = new Map();
const nationRegions = new Map();
for (const r of REGIONS) {
  if (!nationRegions.has(r.nationTag)) nationRegions.set(r.nationTag, []);
  nationRegions.get(r.nationTag).push(r.regionName);
}
let activeNation = '';
let hoverNation = '';
let lockedNation = '';
let labelsVisible = false;
let onlyClaims = false;
let selectedRegionId = null;
let selectedRegionNames = new Set();
let projectFilter = '';
let nationChoices = [];
let nationDropdownOpen = false;
let highlightedNationChoiceIndex = -1;
let currentDropdownChoices = [];
let regionChoices = [];
let activeIncomingClaimKey = '';
let pendingHoverNation = '';
let hoverPreviewFrame = 0;
let tooltipRegionId = null;
const nationChoiceByValue = new Map();
const incomingClaimsByRegion = new Map();

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

function injectClaimOverlayStyles() {
  const style = document.createElement('style');
  style.textContent = `
    svg:has(#claimOverlays .claim-overlay) .region {
      fill:${MUTED_NON_CLAIM_COLOR} !important;
      opacity:1;
      filter:none;
      stroke:oklch(1 0 0 / .14);
    }
    svg:has(#claimOverlays .claim-overlay) .region.dimmed {
      fill:${MUTED_NON_CLAIM_COLOR} !important;
      opacity:1;
      filter:none;
      stroke:oklch(1 0 0 / .14);
    }
    svg:has(#claimOverlays .claim-overlay) .region.claim-target,
    svg:has(#claimOverlays .claim-overlay) .region.owned-highlight {
      fill:transparent !important;
      opacity:.82;
      filter:none;
    }
    svg:has(#claimOverlays .claim-overlay) .region.selected {
      filter:none;
      stroke:#fff;
      stroke-width:.02;
    }
    svg:has(#claimOverlays .claim-overlay) .region:hover {
      filter:none;
      stroke:white;
    }
    svg:has(#claimOverlays .claim-overlay) .claim-overlay {
      mix-blend-mode:normal;
      filter:none;
      opacity:1;
    }
    svg:has(#claimOverlays .claim-overlay) .claim-overlay.gated {
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
  // Fallback center from first path numbers is expensive; skip.
  return null;
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
  const nation = kind === 'incoming' ? (entry.claimant || '') : activeNation;
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
  nationChoices = tags.map(tag => {
    const label = humanizeNationLabel(tag);
    const aliases = nationSearchAliases(tag);
    const projectAliases = nationClaimProjectSearchAliases(tag);
    return {tag, label, aliases, projectAliases, searchText: [label, ...aliases, ...projectAliases].join(' ').toLowerCase()};
  });
  nationChoiceByValue.clear();
  for (const c of nationChoices) {
    nationChoiceByValue.set(c.label.toLowerCase(), c.tag);
    nationChoiceByValue.set(c.tag.toLowerCase(), c.tag);
    for (const alias of c.aliases || []) {
      const key = alias.toLowerCase();
      if (!nationChoiceByValue.has(key)) nationChoiceByValue.set(key, c.tag);
    }
  }
  regionChoices = REGIONS.map(r => ({
    type:'region',
    id:r.id,
    tag:r.nationTag,
    regionName:r.regionName,
    label:`${localizedRegionName(r)} · ${r.nationTag}`,
    searchText:`${r.name} ${r.regionName} ${localizedRegionName(r)} ${prettyRegion(r.regionName)} ${r.primaryCity || ''} ${Object.values(r.displayName || {}).join(' ')} ${r.nationTag}`.toLowerCase(),
  }));
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
    const selected = c.type === 'nation' ? search.dataset.selectedNation === c.tag : selectedRegionNames.has(c.regionName);
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
  projectFilter = '';
  activeIncomingClaimKey = '';
  projectSel.value = '';
  if (claimModeSel.value === 'project') claimModeSel.value = 'all';
}
function cancelPendingHoverPreview() {
  if (hoverPreviewFrame) {
    window.cancelAnimationFrame(hoverPreviewFrame);
    hoverPreviewFrame = 0;
  }
  pendingHoverNation = '';
}
function setHoverPreviewNation(nation) {
  if (lockedNation) return;
  if (hoverNation === nation && activeNation === nation) return;
  hoverNation = nation || '';
  resetTransientClaimState();
  selectedRegionId = null;
  selectedRegionNames = new Set();
  updateNationOverlay(hoverNation);
  updateSelectedRegions();
}
function scheduleHoverPreviewNation(nation) {
  if (lockedNation) return;
  const nextNation = nation || '';
  if (hoverNation === nextNation && activeNation === nextNation) return;
  pendingHoverNation = nextNation;
  if (hoverPreviewFrame) return;
  hoverPreviewFrame = window.requestAnimationFrame(() => {
    hoverPreviewFrame = 0;
    const next = pendingHoverNation;
    pendingHoverNation = '';
    if (!lockedNation && next) setHoverPreviewNation(next);
  });
}
function clearHoverPreview() {
  cancelPendingHoverPreview();
  tooltipRegionId = null;
  tip.style.display = 'none';
  setHoverPill();
  if (lockedNation) {
    hoverNation = '';
    return;
  }
  if (!hoverNation && !activeNation) return;
  hoverNation = '';
  resetTransientClaimState();
  selectedRegionId = null;
  selectedRegionNames = new Set();
  updateNationOverlay('');
  updateSelectedRegions();
}
function buildIncomingClaimIndex() {
  incomingClaimsByRegion.clear();
  for (const [claimant, data] of Object.entries(CLAIMS_BY_NATION)) {
    const claimantBaseRegions = [...new Set(data.baseRegions || nationRegions.get(claimant) || [])];
    const directEntries = sortedProjectEntries(data.projects || []);
    const cumulativeByKey = new Map(cumulativeClaimEntries(claimant, directEntries).map(e => [entryFilterValue(e), e]));
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
  const selected = [...selectedRegionNames].filter(Boolean);
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
  if (!activeIncomingClaimKey) return null;
  return entries.find(e => incomingClaimKey(e) === activeIncomingClaimKey) || null;
}
function incomingClaimsForTarget(activeNation, data, baseSet) {
  const targetRegions = incomingTargetRegions(data, baseSet);
  const grouped = new Map();
  for (const rn of targetRegions) {
    for (const item of incomingClaimsByRegion.get(rn) || []) {
      if (item.claimant === activeNation) continue;
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
  const names = [...selectedRegionNames].filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) {
    const rn = names[0];
    const r = regionByName[rn];
    return t('selected.region', {region: localizedRegionName(r || rn), nation: r?.nationTag ? ' · '+r.nationTag : ''});
  }
  return t('selected.regions', {count: names.length});
}
function renderSelectionOutlines() {
  if (!gSelectionOutlines) return;
  gSelectionOutlines.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const rn of selectedRegionNames) {
    const r = regionByName[rn];
    if (!r) continue;
    for (const cls of ['selection-fill', 'selection-outline-glow', 'selection-outline']) {
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d', r.path);
      p.setAttribute('class', cls);
      p.dataset.region = rn;
      frag.appendChild(p);
    }
    const lab = labelPosition(r);
    if (lab) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
      dot.setAttribute('class', 'selection-dot');
      dot.setAttribute('cx', lab.x);
      dot.setAttribute('cy', lab.y);
      dot.setAttribute('r', '.032');
      dot.dataset.region = rn;
      frag.appendChild(dot);
      const text = document.createElementNS('http://www.w3.org/2000/svg','text');
      text.setAttribute('class', 'selection-label');
      text.setAttribute('x', lab.x);
      text.setAttribute('y', lab.y - 0.052);
      text.textContent = localizedRegionName(r);
      text.dataset.region = rn;
      frag.appendChild(text);
    }
  }
  gSelectionOutlines.appendChild(frag);
}
function updateSelectedRegions() {
  regionPathElements.forEach(p => p.classList.toggle('selected', selectedRegionNames.has(p.dataset.region)));
  renderSelectionOutlines();
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
  const rows = (regionNames || []).map((rn, i) => {
    const claim = claims?.[rn] || {};
    const meta = claimRegionSummary(claim);
    const source = regionSourceLabels?.[rn] ? regionSourceLabels[rn] : '';
    const region = regionByName[rn];
    const owner = region?.nationTag ? ` · ${region.nationTag}` : '';
    const active = selectedRegionNames.has(rn);
    const detail = t('regionList.detail', {
      prefix: t(`regionPrefix.${prefix}`) || prefix,
      owner,
      meta: meta ? ` · ${meta}` : '',
      source: source ? ` · ${source}` : '',
    });
    return `<button type="button" class="legendRegionItem${active ? ' active' : ''}" data-region-name="${escapeHtml(rn)}"><b>${escapeHtml(localizedRegionName(region || rn))}</b><span>${escapeHtml(detail)}</span></button>`;
  }).join('');
  return `<div class="legendRegionList">${rows}</div>`;
}
function focusRegions(regionNames, {selectSingle=false, preserveNation=false, refreshOverlay=false} = {}) {
  const names = (regionNames || []).filter(Boolean);
  if (selectSingle && names.length === 1) {
    const region = regionByName[names[0]];
    if (region) {
      if (preserveNation && activeNation) {
        selectedRegionId = region.id;
        selectedRegionNames = new Set([region.regionName]);
        updateSelectedRegions();
        // TODO: When pan/zoom support is added, this focus transition should also
        // pan and zoom the map so the focused region remains visible.
        if (refreshOverlay) updateNationOverlay(activeNation);
        return;
      }
      selectRegion(region);
      return;
    }
  }
  selectedRegionNames = new Set(names);
  selectedRegionId = null;
  // TODO: When pan/zoom support is added, this focus transition should also
  // pan and zoom the map so the focused region remains visible.
  updateSelectedRegions();
  if (refreshOverlay && activeNation) updateNationOverlay(activeNation);
}
function highlightRegions(regionNames) {
  focusRegions(regionNames);
}
function clearSelection({clearSearch=true} = {}) {
  activeNation = '';
  hoverNation = '';
  lockedNation = '';
  selectedRegionId = null;
  selectedRegionNames = new Set();
  projectFilter = '';
  activeIncomingClaimKey = '';
  projectSel.value = '';
  claimModeSel.value = 'all';
  cancelPendingHoverPreview();
  tooltipRegionId = null;
  if (clearSearch) {
    search.value = '';
    search.dataset.selectedNation = '';
  }
  onlyClaims = false;
  updateOnlyClaimsButtonLabel();
  setHoverPill();
  tip.style.display = 'none';
  updateNationOverlay('');
  applyFilters(true);
  updateSelectedRegions();
}
function focusNation(nation, {fillSearch=true} = {}) {
  if (!nation) { clearSelection({clearSearch:fillSearch}); return; }
  cancelPendingHoverPreview();
  lockedNation = nation;
  hoverNation = '';
  projectFilter = '';
  activeIncomingClaimKey = '';
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
function selectProjectFilter(value) {
  activeIncomingClaimKey = '';
  projectFilter = value || '';
  claimModeSel.value = projectFilter ? 'project' : 'all';
  if (projectFilter && projectFilter !== '__base__') projectSel.value = projectFilter;
  else projectSel.value = '';
  updateNationOverlay(getCurrentNation());
}
function renderClaimSection(title, items, emptyText, kind) {
  const sectionKey = kind === 'incoming' ? 'incoming' : 'outgoing';
  if (!items.length) return `<details class="infoSubsection claimSection" data-info-section="${sectionKey}"${infoSectionOpenAttribute(sectionKey)}><summary><span>${escapeHtml(title)}</span></summary><div class="infoSubsectionBody small">${escapeHtml(emptyText)}</div></details>`;
  const activeOutgoing = claimModeSel.value === 'project' ? projectFilter : '';
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
    const active = kind === 'incoming' ? activeIncomingClaimKey === key : activeOutgoing === key;
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



function renderGrid() {
  const [x,y,w,h] = SUMMARY.viewBox;
  let out='';
  for (let lon=-3; lon<=3.01; lon+=0.5) out += `<path class="graticule" d="M ${lon} ${y} L ${lon} ${y+h}"/>`;
  for (let lat=-1.25; lat<=1.01; lat+=0.25) out += `<path class="graticule" d="M ${x} ${lat} L ${x+w} ${lat}"/>`;
  gGrid.innerHTML = out;
}
function renderRegions() {
  gRegions.innerHTML = '';
  pathByRegion.clear();
  regionPathElements.length = 0;
  const frag = document.createDocumentFragment();
  for (const r of REGIONS) {
    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d', r.path);
    p.setAttribute('class','region');
    p.setAttribute('fill', colorFor(r));
    p.dataset.id = r.id;
    p.dataset.region = r.regionName;
    p.dataset.nation = r.nationTag;
    p.addEventListener('pointerenter', e => onRegionEnter(e, r));
    p.addEventListener('pointermove', e => onRegionMove(e, r));
    p.addEventListener('pointerleave', e => onRegionLeave(e));
    p.addEventListener('click', e => { e.stopPropagation(); selectRegion(r); });
    pathByRegion.set(r.regionName, p);
    regionPathElements.push(p);
    frag.appendChild(p);
  }
  gRegions.appendChild(frag);
  renderLabels();
  applyFilters();
  updateNationOverlay(getCurrentNation());
}
function renderLabels() {
  gLabels.innerHTML = '';
  labelTextElements.length = 0;
  if (!labelsVisible) return;
  const frag = document.createDocumentFragment();
  for (const r of REGIONS) {
    const lab = labelPosition(r);
    if (!lab) continue;
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('class','label'); t.setAttribute('x', lab.x); t.setAttribute('y', lab.y);
    t.textContent = localizedRegionName(r);
    t.dataset.id = r.id;
    t.dataset.region = r.regionName;
    t.dataset.nation = r.nationTag;
    labelTextElements.push(t);
    frag.appendChild(t);
  }
  gLabels.appendChild(frag);
}
function showRegionTooltip(e, r) {
  if (tooltipRegionId !== r.id) {
    tip.textContent = `${localizedRegionName(r)} (${nationDisplayName(r.nationTag)})`;
    tooltipRegionId = r.id;
  }
  tip.style.display = 'block';
  const rect = svgWrap.getBoundingClientRect();
  const tipWidth = tip.offsetWidth || 160;
  const tipHeight = tip.offsetHeight || 26;
  tip.style.left = Math.max(8, Math.min(rect.width - tipWidth - 8, e.clientX - rect.left + 10)) + 'px';
  tip.style.top = Math.max(8, Math.min(rect.height - tipHeight - 8, e.clientY - rect.top + 10)) + 'px';
}
function onRegionEnter(e, r) {
  if (!lockedNation) scheduleHoverPreviewNation(r.nationTag);
  else hoverNation = r.nationTag;
  setHoverPill(r);
  showRegionTooltip(e, r);
}
function onRegionMove(e, r) {
  if (lockedNation) hoverNation = r.nationTag;
  else if (hoverNation !== r.nationTag || activeNation !== r.nationTag) scheduleHoverPreviewNation(r.nationTag);
  setHoverPill(r);
  showRegionTooltip(e, r);
}
function onRegionLeave(e) {
  tooltipRegionId = null;
  tip.style.display='none';
  const next = e?.relatedTarget;
  if (next?.classList?.contains('region')) return;
  clearHoverPreview();
}
function onMapMove(e) {
  const target = e.target;
  if (target?.classList?.contains('region')) return;
  if (target === svg || target === gGrid || target?.classList?.contains('graticule')) clearHoverPreview();
}
function onMapLeave() {
  clearHoverPreview();
}
function getCurrentNation() { return lockedNation || hoverNation || ''; }
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
function cumulativeClaimEntry(nation, entry, entries) {
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
function cumulativeClaimEntries(nation, entries) {
  return entries.map(entry => cumulativeClaimEntry(nation, entry, entries));
}
function getVisibleProjectEntries(nation) {
  if (claimModeSel.value === 'off') return [];
  const directEntries = getClaimKindFilteredProjectEntries(nation);
  if (claimModeSel.value === 'project' && projectFilter) {
    return cumulativeClaimEntries(nation, directEntries).filter(e => entryFilterValue(e) === projectFilter);
  }
  return directEntries;
}
function updateNationOverlay(nation) {
  activeNation = nation || '';
  regionPathElements.forEach(p => { p.classList.remove('owned-highlight','dimmed','claim-target'); });
  gClaimOverlays.innerHTML = '';
  gClaimLabels.innerHTML = '';
  updateProjectOptions(activeNation);
  if (!activeNation) {
    nationInfo.textContent = t('nationInfo.empty');
    if (legend) legend.innerHTML = `<div class="small">${escapeHtml(t('nationInfo.empty'))}</div>`;
    setClaimsPillEmpty();
    applyFilters(false);
    updateSelectedRegions();
    return;
  }
  const data = CLAIMS_BY_NATION[activeNation] || {nation:activeNation, baseRegions:nationRegions.get(activeNation)||[], projects:[], totalClaimRegions:0, projectCount:0};
  const baseSet = new Set(data.baseRegions || nationRegions.get(activeNation) || []);
  const tierByProject = countryProjectTierMap(activeNation, baseSet);
  const directEntries = getClaimKindFilteredProjectEntries(activeNation);
  const cumulativeEntries = cumulativeClaimEntries(activeNation, directEntries);
  const allEntries = getVisibleProjectEntries(activeNation);
  const outgoingEntries = cumulativeEntries.map(e => ({...e, regions:(e.regions || []).filter(rn => !baseSet.has(rn))})).filter(e => e.regions.length);
  const incomingEntries = incomingClaimsForTarget(activeNation, data, baseSet);
  const activeIncoming = selectedIncomingEntry(incomingEntries);
  if (activeIncomingClaimKey && !activeIncoming) activeIncomingClaimKey = '';
  const displayBaseSet = activeIncoming ? new Set(activeIncoming.claimantBaseRegions || []) : baseSet;
  const entries = activeIncoming ? [activeIncoming] : allEntries;
  const claimSet = new Set();
  entries.forEach(e => e.regions.forEach(r => { if (!displayBaseSet.has(r)) claimSet.add(r); }));
  const resultSet = activeIncoming ? new Set([...(activeIncoming.resultRegions || []), ...(activeIncoming.claimantBaseRegions || [])]) : new Set([...displayBaseSet, ...claimSet]);
  regionPathElements.forEach(p => {
    const rn = p.dataset.region;
    if (displayBaseSet.has(rn)) p.classList.add('owned-highlight');
    if (claimSet.has(rn)) p.classList.add('claim-target');
    if (activeNation && !resultSet.has(rn)) p.classList.add('dimmed');
  });
  const frag = document.createDocumentFragment();
  const labFrag = document.createDocumentFragment();
  if (claimModeSel.value !== 'off') {
    for (const rn of displayBaseSet) {
      const r = regionByName[rn];
      if (!r) continue;
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d', r.path);
      p.setAttribute('class', 'claim-overlay owned-territory');
      p.setAttribute('fill', BASE_TERRITORY_COLOR);
      p.setAttribute('data-project', 'initial-territory');
      frag.appendChild(p);
    }
  }
  entries.forEach((entry, i) => {
    const visibleClaimRegions = (entry.regions || []).filter(rn => !displayBaseSet.has(rn));
    if (!visibleClaimRegions.length) return;
    const tier = countryProjectTier(entry, tierByProject);
    const color = projectColor(entry.project, tier);
    for (const rn of visibleClaimRegions) {
      const r = regionByName[rn];
      if (!r) continue;
      const claim = entry.claims?.[rn] || {};
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d', r.path);
      p.setAttribute('class', 'claim-overlay ' + (entry.project ? 'research-claim ' : 'basic-claim ') + (claim.hostileClaim ? 'hostile' : 'peaceful') + (claim.capitalClaim ? ' capital' : '') + (claim.gatedClaim ? ' gated' : ''));
      p.setAttribute('fill', color);
      p.setAttribute('data-project', entry.project || 'base');
      frag.appendChild(p);
    }
    // label first few projects near their first non-owned claim region, enough for a wireframe.
    const labelRegion = visibleClaimRegions.map(rn => regionByName[rn]).find(Boolean);
    const lab = labelRegion && labelPosition(labelRegion);
    if (lab && i < 10) {
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('class','claim-label');
      t.setAttribute('x', lab.x); t.setAttribute('y', lab.y);
      t.textContent = projectDisplay(entry.project).slice(0, 18);
      labFrag.appendChild(t);
    }
  });
  gClaimOverlays.appendChild(frag);
  gClaimLabels.appendChild(labFrag);
  const ownedCount = displayBaseSet.size;
  const claimCount = claimSet.size;
  const projectCount = entries.filter(e => e.project && (e.regions || []).some(rn => !displayBaseSet.has(rn))).length;
  document.getElementById('claimPill').textContent = t('pill.claimSummary', {
    nation: nationDisplayName(activeNation),
    owned: ownedCount,
    claims: claimCount,
    projects: projectCount,
  });
  const breakawayText = data.breakawayFrom ? t('nationInfo.breakaway', {nation: data.breakawayFrom}) : '';
  const gatedCount = (data.gatedRegions || []).length;
  const activeNationName = nationDisplayName(activeNation);
  const activeNationTierText = claimTierCountShortText(nationClaimTierCount(activeNation));
  const summaryLines = [
    t('nationInfo.summary.baseTerritory', {owned: regionCountText(ownedCount)}),
    t('nationInfo.summary.visibleClaims', {claims: regionCountText(claimCount)}),
  ];
  if (data.breakawayFrom) summaryLines.push(t('nationInfo.summary.breakaway', {nation: data.breakawayFrom}));
  const summaryHtml = summaryLines.map(line => `<div class="small nationSummaryLine">${escapeHtml(line)}</div>`).join('');
  const kvRows = [
    [t('nationInfo.kv.status'), statusLabel(data.status)],
    [t('nationInfo.kv.baseTerritory'), regionCountText(ownedCount)],
    [t('nationInfo.kv.directClaims'), uniqueRegionCountText(data.totalClaimRegions || 0)],
    [t('nationInfo.kv.targetedRegions'), `${regionCountText(incomingTargetRegions(data, baseSet).size)} · ${claimGroupCountText(incomingEntries.length)}`],
    [t('nationInfo.kv.conditional'), regionCountText(gatedCount)],
    [t('nationInfo.kv.claimProjects'), claimTierCountText(nationClaimTierCount(activeNation))],
    [t('nationInfo.kv.displayMode'), claimModeLabel(claimModeSel.value)],
  ].map(([label, value]) => `<div>${escapeHtml(label)}</div><div>${escapeHtml(value)}</div>`).join('');
  const basicInfo = `<details class="infoSubsection nationBasicSection" data-info-section="basic"${infoSectionOpenAttribute('basic')}><summary><span>${escapeHtml(t('nationInfo.basic.title'))}</span></summary><div class="infoSubsectionBody"><div class="nationTitle"><b>${escapeHtml(activeNationName)}</b> <span class="status tierBadge">${escapeHtml(activeNationTierText)}</span> ${statusBadge(data.status)}</div><div class="nationSummary">${summaryHtml}</div><div class="kv">${kvRows}</div><div class="hint">${escapeHtml(t('nationInfo.hint'))}</div></div></details>`;
  nationInfo.innerHTML = `${basicInfo}<div class="claimSections">${renderClaimSection(t('claimSection.outgoing.title'), outgoingEntries, t('claimSection.outgoing.empty'), 'outgoing')}${renderClaimSection(t('claimSection.incoming.title'), incomingEntries, t('claimSection.incoming.empty'), 'incoming')}</div>`;
  bindNationInfoSectionToggles();
  nationInfo.querySelectorAll('.claimListItem').forEach(el => el.addEventListener('click', () => {
    const kind = el.dataset.claimKind;
    const index = Number(el.dataset.claimIndex);
    const source = kind === 'incoming' ? incomingEntries[index] : outgoingEntries[index];
    if (!source) return;
    if (kind === 'incoming') {
      // Incoming cards are invitations to inspect the claimant's resulting country,
      // not a special overlay mode for the currently selected target nation.
      // Switch the active nation/claim context to the claimant and select the
      // corresponding outgoing claim there; keep the current target region focused.
      const claimant = source.claimant || '';
      if (!claimant) return;
      activeIncomingClaimKey = '';
      lockedNation = claimant;
      hoverNation = '';
      projectFilter = outgoingClaimKey(source);
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
    activeIncomingClaimKey = '';
    projectFilter = claimModeSel.value === 'project' && projectFilter === key ? '' : key;
    claimModeSel.value = projectFilter ? 'project' : 'all';
    if (projectFilter && projectFilter !== '__base__') projectSel.value = projectFilter;
    else projectSel.value = '';
    // Switching claim cards should change the active claim overlay, not the
    // currently focused region. Region rows inside a claim card call
    // focusRegions(..., { preserveNation: true }) when the user explicitly
    // wants to move focus to a specific target/result region.
    updateNationOverlay(activeNation);
    updateSelectedRegions();
  }));
  nationInfo.querySelectorAll('.legendRegionItem[data-region-name]').forEach(el => el.addEventListener('click', e => {
    e.stopPropagation();
    const rn = el.dataset.regionName;
    if (rn) focusRegions([rn], {selectSingle:true, preserveNation:true, refreshOverlay:true});
  }));
  applyFilters(false);
  updateSelectedRegions();
}
function renderLegend(baseSet, entries, tierByProject) {
  const claimEntries = entries.map(e => ({...e, regions:(e.regions || []).filter(rn => !baseSet.has(rn))})).filter(e => e.regions.length);
  if (!baseSet.size && !claimEntries.length) { legend.innerHTML = `<div class="small">${escapeHtml(t('legend.noClaims'))}</div>`; return; }
  const activeFilter = claimModeSel.value === 'project' ? projectFilter : '';
  const initial = baseSet.size ? `<div class="legendGroup"><button type="button" class="legendItem${!activeFilter ? ' active' : ''}" data-project-filter="" title="${escapeHtml(t('legend.showAllTitle'))}"><span class="swatch" style="background:${BASE_TERRITORY_COLOR}"></span><div><b>${escapeHtml(t('legend.initial.title'))}</b><div class="small">${escapeHtml(t('legend.initial.detail'))}</div></div><span class="tag">${baseSet.size}</span></button></div>` : '';
  const claims = claimEntries.map((e) => {
    const meta = PROJECT_META[e.project] || {};
    const cost = meta.researchCost != null && meta.researchCost >= 0 ? meta.researchCost.toLocaleString() : '';
    const label = projectDisplay(e.project);
    const hostile = e.regions.filter(rn => e.claims?.[rn]?.hostileClaim).length;
    const peaceful = e.regions.length - hostile;
    const gated = e.regions.filter(rn => e.claims?.[rn]?.gatedClaim).length;
    const capital = e.regions.filter(rn => e.claims?.[rn]?.capitalClaim).length;
    const tier = countryProjectTier(e, tierByProject);
    const filterValue = e.project || '__base__';
    const active = activeFilter === filterValue;
    const researchText = e.project ? t('legend.researchTier', {tier: tier + 1, cost: cost ? t('legend.researchCost', {cost}) : ''}) : t('legend.basicTier');
    const regionDetails = active ? renderRegionList(e.regions, e.claims || {}, 'claimed') : '';
    const line = t('legend.projectLine', {
      project: e.project || t('project.none'),
      research: researchText,
      regions: regionCountText(e.regions.length),
      peaceful,
      hostile,
      capital: capital ? t('claimStat.capital', {count: capital}) : '',
      gated: gated ? t('claimStat.gated', {count: gated}) : '',
    });
    return `<div class="legendGroup${active ? ' active' : ''}"><button type="button" class="legendItem${active ? ' active' : ''}" data-project-filter="${escapeHtml(filterValue)}" title="${escapeHtml(e.project || 'base')}"><span class="swatch" style="background:${projectColor(e.project,tier)}"></span><div><b>${escapeHtml(label)}</b><div class="small">${escapeHtml(line)}</div></div><span class="tag">${e.regions.length}</span></button>${regionDetails}</div>`;
  }).join('');
  legend.innerHTML = initial + claims;
  legend.querySelectorAll('.legendItem[data-project-filter]').forEach(el => el.addEventListener('click', () => {
    const value = el.dataset.projectFilter || '';
    selectProjectFilter(activeFilter === value ? '' : value);
  }));
  legend.querySelectorAll('.legendRegionItem[data-region-name]').forEach(el => el.addEventListener('click', e => {
    e.stopPropagation();
    const rn = el.dataset.regionName;
    if (rn) focusRegions([rn], {selectSingle:true, preserveNation:true, refreshOverlay:true});
  }));
}

function updateProjectOptions(nation) {
  const current = projectFilter && projectFilter !== '__base__' ? projectFilter : '';
  const d = CLAIMS_BY_NATION[nation];
  const directEntries = d ? sortedProjectEntries((d.projects || []).filter(e => e.project)) : [];
  const entries = cumulativeClaimEntries(nation, directEntries);
  const opts = [`<option value="">${escapeHtml(t('project.all'))}</option>`].concat(entries.map(e => `<option value="${escapeHtml(e.project)}">${escapeHtml(projectDisplay(e.project))} (${e.regions.length})</option>`));
  projectSel.innerHTML = opts.join('');
  if ([...projectSel.options].some(o => o.value === current)) projectSel.value = current;
  else projectSel.value = '';
}
function selectRegion(r) {
  selectedRegionId = r.id;
  selectedRegionNames = new Set([r.regionName]);
  focusNation(r.nationTag);
}
function applyFilters(rerenderResults=true) {
  const q = searchFilterText();
  const currentNation = getCurrentNation();
  const entries = getVisibleProjectEntries(currentNation);
  const claimSet = new Set();
  entries.forEach(e => e.regions.forEach(r => claimSet.add(r)));
  const baseSet = new Set((CLAIMS_BY_NATION[currentNation]?.baseRegions) || (nationRegions.get(currentNation) || []));
  let visible=0; const matches=[];
  regionPathElements.forEach(p => {
    const r = REGIONS[Number(p.dataset.id)];
      const text = (r.name+' '+r.regionName+' '+localizedRegionName(r)+' '+(r.primaryCity || '')+' '+Object.values(r.displayName || {}).join(' ')+' '+r.nationTag).toLowerCase();
    const okQ = !q || text.includes(q);
    const okClaims = !onlyClaims || !currentNation || claimSet.has(r.regionName) || baseSet.has(r.regionName);
    const ok = okQ && okClaims;
    p.classList.toggle('hidden', !ok);
    if (ok) { visible++; if (matches.length<90) matches.push(r); }
  });
  labelTextElements.forEach(t => {
    const r = REGIONS[Number(t.dataset.id)];
    const okQ = !q || (r.name+' '+r.regionName+' '+localizedRegionName(r)+' '+(r.primaryCity || '')+' '+Object.values(r.displayName || {}).join(' ')+' '+r.nationTag).toLowerCase().includes(q);
    const okClaims = !onlyClaims || !currentNation || claimSet.has(r.regionName) || baseSet.has(r.regionName);
    t.style.display = okQ && okClaims ? '' : 'none';
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
  if (CLAIM_STATS.regionsUnmatched) { warn.style.display=''; warn.textContent = t('warn.unmatchedClaimRows', {count: CLAIM_STATS.regionsUnmatched}); }
}
function refreshLanguage() {
  applyStaticTranslations();
  populate();
  const selectedNation = search.dataset.selectedNation || '';
  if (selectedNation) search.value = humanizeNationLabel(selectedNation);
  renderNationDropdown();
  updateNationOverlay(getCurrentNation());
  applyFilters(true);
  updateSelectedRegions();
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
    lockedNation = '';
    selectedRegionNames = new Set();
    resetTransientClaimState();
    updateNationOverlay(hoverNation || '');
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
document.addEventListener('click', e => {
  if (!nationSearchCombo?.contains(e.target)) closeNationDropdown();
});
baseModeSel.addEventListener('change', renderRegions);
claimModeSel.addEventListener('change', () => {
  activeIncomingClaimKey = '';
  if (claimModeSel.value !== 'project') projectFilter = '';
  else if (!projectFilter) projectFilter = projectSel.value || '';
  updateNationOverlay(getCurrentNation());
});
claimKindSel.addEventListener('change', () => updateNationOverlay(getCurrentNation()));
projectSel.addEventListener('change', () => {
  activeIncomingClaimKey = '';
  projectFilter = projectSel.value || '';
  claimModeSel.value = projectFilter ? 'project' : 'all';
  updateNationOverlay(getCurrentNation());
});
document.getElementById('showLabels').addEventListener('click', () => { labelsVisible=!labelsVisible; renderLabels(); applyFilters(); });
document.getElementById('onlyClaimsBtn').addEventListener('click', () => { onlyClaims=!onlyClaims; updateOnlyClaimsButtonLabel(); applyFilters(); });
svg.addEventListener('mousemove', onMapMove);
svg.addEventListener('click', e => {
  const target = e.target;
  if (target === svg || target === gGrid || target.classList?.contains('graticule')) clearSelection();
});
svg.addEventListener('mouseleave', onMapLeave);

setHoverPill();
setClaimsPillEmpty();
populate(); renderGrid(); renderRegions();
}).catch((error) => {
  console.error(error);
  let language = 'ko';
  try { language = String(window.localStorage?.getItem(LANGUAGE_STORAGE_KEY) || document.documentElement.lang || 'ko').toLowerCase().startsWith('en') ? 'en' : 'ko'; }
  catch (_) {}
  const message = language === 'en' ? 'Failed to load generated Terra Invicta map data.' : 'Terra Invicta 지도 데이터를 불러오지 못했습니다.';
  document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:24px;color:#f8fafc;background:#0b1020">${message}

${String(error && error.stack || error)}</pre>`;
});
