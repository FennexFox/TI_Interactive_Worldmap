// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

const LANGUAGE_STORAGE_KEY = 'ti-map-language';
const I18N = {
  ko: {
    'document.title': 'Terra Invicta 영유권 / 통합 지도',
    'app.title': 'Terra Invicta 영유권 / 통합 지도',
    'section.explore': '탐색 및 선택',
    'scenario.label': '시작 시나리오',
    'scenario.summary': '{scenario} · 지역 {regions}개 · 국가 {nations}개 · 영유권 행 {claims}개 · 프로젝트 {projects}개',
    'mapWrap.label': '월드 랩',
    'mapWrap.warning': '복잡한 오버레이가 보일 때 성능이 낮아질 수 있습니다.',
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
    'mapWrap.label': 'World wrap',
    'mapWrap.warning': 'It may reduce performance when complex overlays are visible.',
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

export function normalizeLanguage(value) {
  return String(value || '').toLowerCase().startsWith('en') ? 'en' : 'ko';
}

export function readSavedLanguage(storage = globalThis.window?.localStorage) {
  try { return storage?.getItem(LANGUAGE_STORAGE_KEY) || ''; }
  catch (_) { return ''; }
}

export function saveLanguage(language, storage = globalThis.window?.localStorage) {
  try { storage?.setItem(LANGUAGE_STORAGE_KEY, language); }
  catch (_) {}
}

export function createI18n({initialLanguage = 'ko'} = {}) {
  let currentLanguage = normalizeLanguage(initialLanguage);

  function t(key, values = {}) {
    const template = I18N[currentLanguage]?.[key] ?? I18N.ko[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
  }

  function dataLanguageKey() {
    return currentLanguage === 'ko' ? 'kor' : 'en';
  }

  function formatNumber(count) {
    return Number(count || 0).toLocaleString(currentLanguage === 'ko' ? 'ko-KR' : 'en-US');
  }

  function englishCount(count, singular, plural = `${singular}s`) {
    return `${formatNumber(count)} ${Number(count) === 1 ? singular : plural}`;
  }

  function regionCountText(count) {
    return currentLanguage === 'ko' ? t('count.regions', {count: formatNumber(count)}) : englishCount(count, 'region');
  }

  function uniqueRegionCountText(count) {
    return currentLanguage === 'ko'
      ? t('count.uniqueRegions', {count: formatNumber(count)})
      : `${formatNumber(count)} unique ${Number(count) === 1 ? 'region' : 'regions'}`;
  }

  function claimTierCountText(count) {
    return currentLanguage === 'ko'
      ? t('count.claimTiers', {count: formatNumber(count)})
      : `${formatNumber(count)} research ${Number(count) === 1 ? 'tier' : 'tiers'}`;
  }

  function claimTierCountShortText(count) {
    return currentLanguage === 'ko'
      ? t('count.claimTiersShort', {count: formatNumber(count)})
      : `${formatNumber(count)} ${Number(count) === 1 ? 'tier' : 'tiers'}`;
  }

  function claimGroupCountText(count) {
    return currentLanguage === 'ko' ? t('count.claimGroups', {count: formatNumber(count)}) : englishCount(count, 'claim group');
  }

  function claimModeLabel(value) {
    return t(`claimMode.${value || 'all'}`);
  }

  return {
    get language() { return currentLanguage; },
    setLanguage(value) {
      currentLanguage = normalizeLanguage(value);
      return currentLanguage;
    },
    t,
    dataLanguageKey,
    formatNumber,
    englishCount,
    regionCountText,
    uniqueRegionCountText,
    claimTierCountText,
    claimTierCountShortText,
    claimGroupCountText,
    claimModeLabel,
  };
}
