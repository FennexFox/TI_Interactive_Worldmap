window.TI_DATA_PROMISE.then(({regionMap, claimMap}) => {
const REGIONS = regionMap.regions;
const SUMMARY = regionMap.summary;
const CLAIMS_BY_NATION = claimMap.claimsByNation;
const PROJECT_META = claimMap.projects;
const CLAIM_STATS = claimMap.claimStats;
const BREAKAWAYS = claimMap.breakaways || [];

const svg = document.getElementById('map');
const gRegions = document.getElementById('regions');
const gLabels = document.getElementById('labels');
const gClaimLabels = document.getElementById('claimLabels');
const gGrid = document.getElementById('grid');
const gClaimOverlays = document.getElementById('claimOverlays');
const tip = document.getElementById('tip');
const search = document.getElementById('search');
const nationSel = document.getElementById('nation');
const baseModeSel = document.getElementById('baseMode');
const claimModeSel = document.getElementById('claimMode');
const projectSel = document.getElementById('projectSel');
const claimKindSel = document.getElementById('claimKind');
const results = document.getElementById('results');
const nationInfo = document.getElementById('nationInfo');
const legend = document.getElementById('legend');

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

const CLAIM_GRADIENT_START_HUE = 155;
const CLAIM_GRADIENT_END_HUE = 290;
const CLAIM_GRADIENT_STEPS = 6; // initial territory + no-research + 5 research tiers.
const claimGradientHue = step => CLAIM_GRADIENT_START_HUE + (CLAIM_GRADIENT_END_HUE - CLAIM_GRADIENT_START_HUE) * (step / CLAIM_GRADIENT_STEPS);
const claimGradientColor = (step, lightness, chroma) => `oklch(${lightness} ${chroma} ${claimGradientHue(step)})`;
const BASE_TERRITORY_COLOR = claimGradientColor(0, 0.78, 0.11);
const MUTED_NON_CLAIM_COLOR = 'oklch(0.25 0.022 260)';
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
      stroke:oklch(1 0 0 / .08);
    }
    svg:has(#claimOverlays .claim-overlay) .region.dimmed {
      fill:${MUTED_NON_CLAIM_COLOR} !important;
      opacity:1;
      filter:none;
      stroke:oklch(1 0 0 / .08);
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
  `;
  document.head.appendChild(style);
}

function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function projectDisplay(p) { return p ? (PROJECT_META[p]?.displayName?.kor || PROJECT_META[p]?.displayName?.en || PROJECT_META[p]?.friendlyName || PROJECT_META[p]?.label || p.replace('Project_','')) : '기본 claim / no research'; }
function prettyRegion(s) { return String(s || '').replace(/([a-z])([A-Z])/g,'$1 $2'); }
function hashHue(s) { let h=0; for (let i=0;i<String(s).length;i++) h=(h*31+String(s).charCodeAt(i))>>>0; return h%360; }
function colorFor(r) {
  const mode = baseModeSel.value;
  if (mode === 'plain') return 'hsl(215 45% 39%)';
  if (mode === 'points') { const t=Math.min(1, Math.log10(r.points+1)/3); return `hsl(${220-170*t} 58% ${34+22*t}%)`; }
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
function countryProjectTier(entry, tierByProject) {
  if (!entry.project) return -1;
  return tierByProject.get(entry.project) ?? 0;
}
function projectColor(project, i=0) {
  const tier = project ? i + 1 : 0;
  return CLAIM_TIER_COLORS[Math.min(Math.max(tier, 0), CLAIM_TIER_COLORS.length - 1)];
}
function statusLabel(status) {
  if (status === 'breakaway_gated_existing') return 'breakaway-gated existing';
  if (status === 'formable') return 'formable';
  return 'existing';
}
function statusBadge(status) {
  return `<span class="status ${escapeHtml(status || 'existing')}">${escapeHtml(statusLabel(status))}</span>`;
}
function labelPosition(r) {
  if (r.labels && r.labels[0]) return r.labels[0];
  // Fallback center from first path numbers is expensive; skip.
  return null;
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
  const frag = document.createDocumentFragment();
  for (const r of REGIONS) {
    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d', r.path);
    p.setAttribute('class','region');
    p.setAttribute('fill', colorFor(r));
    p.dataset.id = r.id;
    p.dataset.region = r.regionName;
    p.dataset.nation = r.nationTag;
    p.addEventListener('mousemove', e => onRegionMove(e, r));
    p.addEventListener('mouseleave', () => onRegionLeave());
    p.addEventListener('click', () => selectRegion(r));
    pathByRegion.set(r.regionName, p);
    frag.appendChild(p);
  }
  gRegions.appendChild(frag);
  renderLabels();
  applyFilters();
  updateNationOverlay(getCurrentNation());
}
function renderLabels() {
  gLabels.innerHTML = '';
  if (!labelsVisible) return;
  const frag = document.createDocumentFragment();
  for (const r of REGIONS) {
    const lab = labelPosition(r);
    if (!lab) continue;
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('class','label'); t.setAttribute('x', lab.x); t.setAttribute('y', lab.y);
    t.textContent = prettyRegion(r.regionName);
    t.dataset.id = r.id;
    t.dataset.region = r.regionName;
    t.dataset.nation = r.nationTag;
    frag.appendChild(t);
  }
  gLabels.appendChild(frag);
}
function onRegionMove(e, r) {
  hoverNation = r.nationTag;
  if (!lockedNation && !nationSel.value) updateNationOverlay(hoverNation);
  document.getElementById('hoverPill').textContent = `Hover nation: ${r.nationTag} · ${prettyRegion(r.regionName)}`;
  const d = CLAIMS_BY_NATION[r.nationTag];
  const claimCount = d ? d.totalClaimRegions : 0;
  const status = d ? statusLabel(d.status) : 'existing';
  tip.innerHTML = `<b>${escapeHtml(prettyRegion(r.regionName))}</b><div class="muted">${escapeHtml(r.name)} · Nation ${escapeHtml(r.nationTag)}</div><div class="small">${escapeHtml(r.nationTag)} · ${escapeHtml(status)} · potential claim regions: ${claimCount}</div>`;
  tip.style.display='block';
  const rect = document.querySelector('.svgwrap').getBoundingClientRect();
  tip.style.left = Math.max(8, Math.min(rect.width-335, e.clientX-rect.left+14)) + 'px';
  tip.style.top = Math.max(8, Math.min(rect.height-125, e.clientY-rect.top+14)) + 'px';
}
function onRegionLeave() {
  tip.style.display='none';
  if (!lockedNation && !nationSel.value) {
    hoverNation = '';
    document.getElementById('hoverPill').textContent = 'Hover nation: -';
    updateNationOverlay('');
  }
}
function getCurrentNation() { return nationSel.value || lockedNation || hoverNation || ''; }
function claimKindPass(claim) {
  const k = claimKindSel.value;
  if (k === 'all') return true;
  if (k === 'hostile') return !!claim.hostileClaim;
  if (k === 'peaceful') return !claim.hostileClaim;
  return true;
}
function getVisibleProjectEntries(nation) {
  const d = CLAIMS_BY_NATION[nation];
  if (!d) return [];
  let entries = d.projects || [];
  if (claimModeSel.value === 'off') return [];
  if (claimModeSel.value === 'project' && projectSel.value) entries = entries.filter(e => e.project === projectSel.value);
  entries = entries.map(e => {
    const claims = e.claims || {};
    const regions = (e.regions || []).filter(rn => claimKindPass(claims[rn] || {}));
    const filteredClaims = {};
    for (const rn of regions) filteredClaims[rn] = claims[rn];
    return {...e, regions, claims: filteredClaims};
  }).filter(e => e.regions.length);
  return entries;
}
function updateNationOverlay(nation) {
  activeNation = nation || '';
  document.querySelectorAll('.region').forEach(p => { p.classList.remove('owned-highlight','dimmed','claim-target'); });
  gClaimOverlays.innerHTML = '';
  gClaimLabels.innerHTML = '';
  updateProjectOptions(activeNation);
  if (!activeNation) {
    nationInfo.innerHTML = '지도에서 국가/region 위에 마우스를 올리세요.';
    legend.innerHTML = '<div class="small">hover한 국가의 claim 묶음이 여기에 표시됩니다.</div>';
    document.getElementById('claimPill').textContent = 'Claims: -';
    applyFilters(false);
    return;
  }
  const data = CLAIMS_BY_NATION[activeNation] || {nation:activeNation, baseRegions:nationRegions.get(activeNation)||[], projects:[], totalClaimRegions:0, projectCount:0};
  const baseSet = new Set(data.baseRegions || nationRegions.get(activeNation) || []);
  const tierByProject = countryProjectTierMap(activeNation, baseSet);
  const entries = sortedProjectEntries(getVisibleProjectEntries(activeNation));
  const claimSet = new Set();
  entries.forEach(e => e.regions.forEach(r => { if (!baseSet.has(r)) claimSet.add(r); }));
  document.querySelectorAll('.region').forEach(p => {
    const rn = p.dataset.region;
    if (baseSet.has(rn)) p.classList.add('owned-highlight');
    if (claimSet.has(rn)) p.classList.add('claim-target');
    if (activeNation && !baseSet.has(rn) && !claimSet.has(rn)) p.classList.add('dimmed');
  });
  const frag = document.createDocumentFragment();
  const labFrag = document.createDocumentFragment();
  if (claimModeSel.value !== 'off') {
    for (const rn of baseSet) {
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
    const visibleClaimRegions = (entry.regions || []).filter(rn => !baseSet.has(rn));
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
  const ownedCount = baseSet.size;
  const claimCount = claimSet.size;
  const projectCount = entries.filter(e => e.project && (e.regions || []).some(rn => !baseSet.has(rn))).length;
  document.getElementById('claimPill').textContent = `${activeNation}: base ${ownedCount}, claim ${claimCount}, tech ${projectCount}`;
  const breakawayText = data.breakawayFrom ? ` · breakaway from ${escapeHtml(data.breakawayFrom)}` : '';
  const gatedCount = (data.gatedRegions || []).length;
  nationInfo.innerHTML = `<b>${escapeHtml(activeNation)}</b> ${statusBadge(data.status)}<div class="small" style="margin:2px 0 10px">현재/시작 territory ${ownedCount} regions · 표시 중 claim ${claimCount} regions · project ${projectCount}${breakawayText}</div><div class="kv"><div>상태</div><div>${escapeHtml(statusLabel(data.status))}</div><div>기본 영토</div><div>${ownedCount} regions</div><div>직접 claim</div><div>${data.totalClaimRegions || 0} unique regions</div><div>conditional</div><div>${gatedCount} gated regions</div><div>claim projects</div><div>${data.projectCount || 0}</div><div>표시 모드</div><div>${claimModeSel.value}</div></div><div class="hint">지도에서 가장 밝은 시작색은 초기/현재 영토이며, claim 색상은 같은 hue 축에서 비연구 claim → 연구 tier 1 → 연구 tier 2 순서로 단계적으로 표시됩니다. 푸른 테두리는 평화적 claim, 붉은 테두리는 hostile claim, 점선은 capital claim, 보라색/잠금 스타일은 breakaway-gated conditional claim입니다.</div>`;
  renderLegend(baseSet, entries, tierByProject);
  applyFilters(false);
}
function renderLegend(baseSet, entries, tierByProject) {
  const claimEntries = entries.map(e => ({...e, regions:(e.regions || []).filter(rn => !baseSet.has(rn))})).filter(e => e.regions.length);
  if (!baseSet.size && !claimEntries.length) { legend.innerHTML = '<div class="small">이 국가에 표시 가능한 추가 claim project가 없습니다.</div>'; return; }
  const initial = baseSet.size ? `<div class="legendItem" title="initial territory"><span class="swatch" style="background:${BASE_TERRITORY_COLOR}"></span><div><b>초기 영토 / starting territory</b><div class="small">현재/시작 영토 · claim research 필요 없음</div></div><span class="tag">${baseSet.size}</span></div>` : '';
  const claims = claimEntries.map((e,i) => {
    const meta = PROJECT_META[e.project] || {};
    const cost = meta.researchCost != null && meta.researchCost >= 0 ? meta.researchCost.toLocaleString() : '';
    const label = projectDisplay(e.project);
    const hostile = e.regions.filter(rn => e.claims?.[rn]?.hostileClaim).length;
    const peaceful = e.regions.length - hostile;
    const gated = e.regions.filter(rn => e.claims?.[rn]?.gatedClaim).length;
    const tier = countryProjectTier(e, tierByProject);
    const researchText = e.project ? `research tier ${tier + 1}${cost ? ' · cost '+cost : ''}` : 'claim tier 0 · no research · 초기 영토 아님';
    return `<div class="legendItem" title="${escapeHtml(e.project || 'base')}"><span class="swatch" style="background:${projectColor(e.project,tier)}"></span><div><b>${escapeHtml(label)}</b><div class="small">${escapeHtml(e.project || 'No project')} · ${researchText} · 평화 ${peaceful} / 적대 ${hostile}${gated ? ' · gated '+gated : ''}</div></div><span class="tag">${e.regions.length}</span></div>`;
  }).join('');
  legend.innerHTML = initial + claims;
}
function updateProjectOptions(nation) {
  const current = projectSel.value;
  const d = CLAIMS_BY_NATION[nation];
  const entries = d ? sortedProjectEntries(d.projects.filter(e => e.project)) : [];
  const opts = ['<option value="">자동/전체</option>'].concat(entries.map(e => `<option value="${escapeHtml(e.project)}">${escapeHtml(projectDisplay(e.project))} (${e.regions.length})</option>`));
  projectSel.innerHTML = opts.join('');
  if ([...projectSel.options].some(o => o.value === current)) projectSel.value = current;
}
function selectRegion(r) {
  selectedRegionId = r.id;
  document.querySelectorAll('.region').forEach(p => p.classList.toggle('selected', Number(p.dataset.id) === r.id));
  lockedNation = r.nationTag;
  nationSel.value = '';
  updateNationOverlay(lockedNation);
}
function applyFilters(rerenderResults=true) {
  const q = search.value.trim().toLowerCase();
  const currentNation = getCurrentNation();
  const entries = getVisibleProjectEntries(currentNation);
  const claimSet = new Set();
  entries.forEach(e => e.regions.forEach(r => claimSet.add(r)));
  const baseSet = new Set((CLAIMS_BY_NATION[currentNation]?.baseRegions) || (nationRegions.get(currentNation) || []));
  let visible=0; const matches=[];
  document.querySelectorAll('.region').forEach(p => {
    const r = REGIONS[Number(p.dataset.id)];
    const text = (r.name+' '+r.regionName+' '+r.nationTag).toLowerCase();
    const okQ = !q || text.includes(q);
    const okClaims = !onlyClaims || !currentNation || claimSet.has(r.regionName) || baseSet.has(r.regionName);
    const ok = okQ && okClaims;
    p.classList.toggle('hidden', !ok);
    if (ok) { visible++; if (matches.length<90) matches.push(r); }
  });
  document.querySelectorAll('.label').forEach(t => {
    const r = REGIONS[Number(t.dataset.id)];
    const okQ = !q || (r.name+' '+r.regionName+' '+r.nationTag).toLowerCase().includes(q);
    const okClaims = !onlyClaims || !currentNation || claimSet.has(r.regionName) || baseSet.has(r.regionName);
    t.style.display = okQ && okClaims ? '' : 'none';
  });
  document.getElementById('visiblePill').textContent = `Visible ${visible} / ${REGIONS.length}`;
  if (rerenderResults) {
    results.innerHTML = matches.map(r => `<div class="item" data-id="${r.id}"><b>${escapeHtml(prettyRegion(r.regionName))}</b><div class="small">${escapeHtml(r.name)} · ${escapeHtml(r.nationTag)}</div></div>`).join('') || '<div class="item small">검색 결과 없음</div>';
    results.querySelectorAll('.item[data-id]').forEach(el => el.addEventListener('click', () => selectRegion(REGIONS[Number(el.dataset.id)])));
  }
}
function populate() {
  document.getElementById('stats').innerHTML = `
    <div class="stat"><b>${SUMMARY.regions}</b><span>map regions</span></div>
    <div class="stat"><b>${CLAIM_STATS.projectCount}</b><span>claim projects</span></div>
    <div class="stat"><b>${CLAIM_STATS.projectClaimRowsNormalized.toLocaleString()}</b><span>research claims</span></div>
    <div class="stat"><b>${CLAIM_STATS.noResearchClaimRowsNormalized.toLocaleString()}</b><span>basic claims</span></div>
    <div class="stat"><b>${CLAIM_STATS.formableNationCount || 0}</b><span>formable tags</span></div>
    <div class="stat"><b>${CLAIM_STATS.breakawayGatedExistingNationCount || 0}</b><span>breakaway-gated</span></div>`;
  const nations = [...new Set([...REGIONS.map(r=>r.nationTag), ...Object.keys(CLAIMS_BY_NATION)])].filter(Boolean).sort();
  nationSel.innerHTML = '<option value="">지도 hover 사용</option>' + nations.map(t => { const d = CLAIMS_BY_NATION[t]; const suffix = d ? ` · ${statusLabel(d.status)}${d.projectCount ? ' · '+d.projectCount+' techs' : ''}` : ''; return `<option value="${escapeHtml(t)}">${escapeHtml(t)}${escapeHtml(suffix)}</option>`; }).join('');
  const warn = document.getElementById('warnPill');
  if (CLAIM_STATS.regionsUnmatched) { warn.style.display=''; warn.textContent = `${CLAIM_STATS.regionsUnmatched} unmatched claim rows`; }
}

injectClaimOverlayStyles();

search.addEventListener('input', () => applyFilters(true));
baseModeSel.addEventListener('change', renderRegions);
claimModeSel.addEventListener('change', () => updateNationOverlay(getCurrentNation()));
claimKindSel.addEventListener('change', () => updateNationOverlay(getCurrentNation()));
projectSel.addEventListener('change', () => updateNationOverlay(getCurrentNation()));
nationSel.addEventListener('change', () => { lockedNation=''; hoverNation=nationSel.value; updateNationOverlay(getCurrentNation()); });
document.getElementById('showLabels').addEventListener('click', () => { labelsVisible=!labelsVisible; renderLabels(); applyFilters(); });
document.getElementById('onlyClaimsBtn').addEventListener('click', () => { onlyClaims=!onlyClaims; document.getElementById('onlyClaimsBtn').textContent = onlyClaims ? '전체 지도 보기' : 'claim 대상만 보기'; applyFilters(); });
document.getElementById('lockBtn').addEventListener('click', () => { if (hoverNation) { lockedNation=hoverNation; nationSel.value=''; updateNationOverlay(lockedNation); } });
document.getElementById('clearBtn').addEventListener('click', () => { lockedNation=''; hoverNation=''; nationSel.value=''; search.value=''; onlyClaims=false; document.getElementById('onlyClaimsBtn').textContent='claim 대상만 보기'; tip.style.display='none'; updateNationOverlay(''); applyFilters(); document.querySelectorAll('.region').forEach(p => p.classList.remove('selected')); });

populate(); renderGrid(); renderRegions();
// Start with China because it demonstrates multi-tech expansion well.
hoverNation = 'CHN'; updateNationOverlay('CHN');
}).catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:24px;color:#f8fafc;background:#0b1020">Failed to load generated Terra Invicta map data.

${String(error && error.stack || error)}</pre>`;
});
