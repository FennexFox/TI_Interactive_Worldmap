window.TI_DATA_PROMISE.then(({regionMap, claimMap}) => {
const REGIONS = regionMap.regions;
const SUMMARY = regionMap.summary;
const CLAIMS_BY_NATION = claimMap.claimsByNation;
const PROJECT_META = claimMap.projects;
const CLAIM_STATS = claimMap.claimStats;
const BREAKAWAYS = claimMap.breakaways || [];
const NATION_META = claimMap.nationMeta || {};

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
const svgWrap = document.querySelector('.svgwrap');
const regionPathElements = [];
const labelTextElements = [];

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
  return displayName.kor || displayName.en || Object.values(displayName).find(Boolean) || '';
}
function nationDisplayName(tag) {
  const meta = NATION_META[tag] || {};
  return localizedDisplayName(meta.displayName) || meta.friendlyName || meta.label || meta.name || tag;
}
function humanizeNationLabel(tag) {
  const d = CLAIMS_BY_NATION[tag] || {};
  const regionCount = (nationRegions.get(tag) || d.baseRegions || []).length;
  const techText = d.projectCount ? ` · ${d.projectCount} techs` : '';
  const statusText = d.status && d.status !== 'existing' ? ` · ${statusLabel(d.status)}` : '';
  const countText = regionCount ? ` · ${regionCount} regions` : '';
  const displayName = nationDisplayName(tag);
  return `${tag}${displayName !== tag ? ' · ' + displayName : ''}${statusText}${techText}${countText}`;
}
function buildNationChoices() {
  const tags = [...new Set([...REGIONS.map(r => r.nationTag), ...Object.keys(CLAIMS_BY_NATION)])].filter(Boolean).sort();
  nationChoices = tags.map(tag => {
    const d = CLAIMS_BY_NATION[tag] || {};
    const label = humanizeNationLabel(tag);
    const alias = nationDisplayName(tag);
    return {tag, label, searchText: `${tag} ${label} ${alias}`.toLowerCase()};
  });
  nationChoiceByValue.clear();
  for (const c of nationChoices) {
    nationChoiceByValue.set(c.label.toLowerCase(), c.tag);
    nationChoiceByValue.set(c.tag.toLowerCase(), c.tag);
  }
  regionChoices = REGIONS.map(r => ({
    type:'region',
    id:r.id,
    tag:r.nationTag,
    regionName:r.regionName,
    label:`${prettyRegion(r.regionName)} · ${r.nationTag}`,
    searchText:`${r.name} ${r.regionName} ${prettyRegion(r.regionName)} ${r.nationTag}`.toLowerCase(),
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

function visibleNationChoices() {
  const q = search.value.trim().toLowerCase();
  if (!q) return nationChoices.slice(0, 28).map(c => ({...c, type:'nation'}));
  const nationMatches = nationChoices.filter(c => c.searchText.includes(q)).slice(0, 12).map(c => ({...c, type:'nation'}));
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
    nationDropdown.innerHTML = '<div class="searchOption empty">검색 결과 없음</div>';
    setDropdownExpanded(true);
    return;
  }
  if (highlightedNationChoiceIndex >= currentDropdownChoices.length) highlightedNationChoiceIndex = currentDropdownChoices.length - 1;
  if (highlightedNationChoiceIndex < -1) highlightedNationChoiceIndex = -1;
  nationDropdown.innerHTML = currentDropdownChoices.map((c, i) => {
    const selected = c.type === 'nation' ? search.dataset.selectedNation === c.tag : selectedRegionNames.has(c.regionName);
    const active = i === highlightedNationChoiceIndex;
    const tagText = c.type === 'region' ? 'REGION' : c.tag;
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
  document.getElementById('hoverPill').textContent = 'Hover nation: -';
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
    return `Selected region: ${prettyRegion(rn)}${r?.nationTag ? ' · '+r.nationTag : ''}`;
  }
  return `Selected regions: ${names.length}`;
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
      text.textContent = prettyRegion(rn);
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
  parts.push(claim?.hostileClaim ? 'hostile' : 'peaceful');
  if (claim?.capitalClaim) parts.push('capital');
  if (claim?.gatedClaim) parts.push('gated');
  return parts.join(' · ');
}
function renderRegionList(regionNames, claims={}, prefix='targets', regionSourceLabels={}) {
  const rows = (regionNames || []).map((rn, i) => {
    const claim = claims?.[rn] || {};
    const meta = claimRegionSummary(claim);
    const source = regionSourceLabels?.[rn] ? ` · ${regionSourceLabels[rn]}` : '';
    const region = regionByName[rn];
    const owner = region?.nationTag ? ` · ${region.nationTag}` : '';
    const active = selectedRegionNames.has(rn);
    return `<button type="button" class="legendRegionItem${active ? ' active' : ''}" data-region-name="${escapeHtml(rn)}"><b>${escapeHtml(prettyRegion(rn))}</b><span>${escapeHtml(prefix)} region${owner}${meta ? ' · '+meta : ''}${escapeHtml(source)}</span></button>`;
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
  document.getElementById('onlyClaimsBtn').textContent = 'claim 대상만 보기';
  document.getElementById('hoverPill').textContent = 'Hover nation: -';
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
  if (!items.length) return `<div class="claimSection"><b>${escapeHtml(title)}</b><div class="small">${escapeHtml(emptyText)}</div></div>`;
  const activeOutgoing = claimModeSel.value === 'project' ? projectFilter : '';
  const rows = items.map((item, i) => {
    const project = item.project || '';
    const label = projectDisplay(project);
    const regions = item.regions || [];
    const targetRegions = kind === 'incoming' ? (item.targetRegions || regions) : regions;
    const detailRegions = kind === 'incoming' ? (item.resultRegions || regions) : regions;
    const detailClaims = item.claims || {};
    const hostile = item.hostile ?? targetRegions.filter(rn => item.targetClaims?.[rn]?.hostileClaim || item.claims?.[rn]?.hostileClaim).length;
    const gated = item.gated ?? targetRegions.filter(rn => item.targetClaims?.[rn]?.gatedClaim || item.claims?.[rn]?.gatedClaim).length;
    const capital = item.capital ?? targetRegions.filter(rn => item.targetClaims?.[rn]?.capitalClaim || item.claims?.[rn]?.capitalClaim).length;
    const who = kind === 'incoming' ? humanizeNationLabel(item.claimant) : humanizeNationLabel(activeNation);
    const key = kind === 'incoming' ? incomingClaimKey(item) : outgoingClaimKey(item);
    const active = kind === 'incoming' ? activeIncomingClaimKey === key : activeOutgoing === key;
    const targetNames = targetRegions.map(prettyRegion);
    const targetPreview = targetNames.slice(0, 4).join(', ') + (targetNames.length > 4 ? `, +${targetNames.length - 4}` : '');
    const direction = kind === 'incoming'
      ? `targets: ${targetPreview || 'selected region'} · resulting country ${detailRegions.length} region${detailRegions.length === 1 ? '' : 's'}`
      : `claims: ${targetPreview}`;
    const inherited = item.inheritedClaimCount || item.inheritedRegions?.length || 0;
    const direct = item.directClaimCount || item.directRegions?.length || regions.length;
    const cumulativeText = kind === 'outgoing' && inherited ? ` · cumulative: direct ${direct} + inherited ${inherited}` : '';
    const regionDetails = active ? renderRegionList(detailRegions, detailClaims, kind === 'incoming' ? 'result' : 'claimed', item.regionSourceLabels || {}) : '';
    return `<div class="claimListGroup${active ? ' active' : ''}"><button type="button" class="claimListItem${active ? ' active' : ''}" data-claim-kind="${kind}" data-claim-index="${i}" data-claim-key="${escapeHtml(key)}" title="${escapeHtml(detailRegions.map(prettyRegion).join(', '))}"><b>${escapeHtml(who)} · ${escapeHtml(label)}</b><span>${escapeHtml(direction)}${escapeHtml(cumulativeText)}${hostile ? ' · hostile '+hostile : ''}${capital ? ' · capital '+capital : ''}${gated ? ' · gated '+gated : ''}</span></button>${regionDetails}</div>`;
  }).join('');
  return `<div class="claimSection"><b>${escapeHtml(title)}</b><div class="claimList">${rows}</div></div>`;
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
    t.textContent = prettyRegion(r.regionName);
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
    const d = CLAIMS_BY_NATION[r.nationTag];
    const claimCount = d ? d.totalClaimRegions : 0;
    const status = d ? statusLabel(d.status) : 'existing';
    tip.innerHTML = `<b>${escapeHtml(prettyRegion(r.regionName))}</b><div class="muted">${escapeHtml(r.name)} · Nation ${escapeHtml(r.nationTag)}</div><div class="small">${escapeHtml(r.nationTag)} · ${escapeHtml(status)} · potential claim regions: ${claimCount}</div>`;
    tooltipRegionId = r.id;
  }
  tip.style.display='block';
  const rect = svgWrap.getBoundingClientRect();
  tip.style.left = Math.max(8, Math.min(rect.width-335, e.clientX-rect.left+14)) + 'px';
  tip.style.top = Math.max(8, Math.min(rect.height-125, e.clientY-rect.top+14)) + 'px';
}
function onRegionEnter(e, r) {
  if (!lockedNation) scheduleHoverPreviewNation(r.nationTag);
  else hoverNation = r.nationTag;
  document.getElementById('hoverPill').textContent = `Hover nation: ${r.nationTag} · ${prettyRegion(r.regionName)}`;
  showRegionTooltip(e, r);
}
function onRegionMove(e, r) {
  if (lockedNation) hoverNation = r.nationTag;
  else if (hoverNation !== r.nationTag || activeNation !== r.nationTag) scheduleHoverPreviewNation(r.nationTag);
  document.getElementById('hoverPill').textContent = `Hover nation: ${r.nationTag} · ${prettyRegion(r.regionName)}`;
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
    const sourceLabel = inherited.project ? `inherited from ${projectDisplay(inherited.project)}` : 'basic claim';
    for (const rn of inherited.regions || []) addRegion(rn, inherited.claims?.[rn], source, sourceLabel);
  }
  for (const rn of entry.regions || []) addRegion(rn, entry.claims?.[rn], 'direct', 'direct', {overwrite:true});
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
    nationInfo.innerHTML = '지도에서 국가/region 위에 마우스를 올리세요.';
    if (legend) legend.innerHTML = '<div class="small">hover한 국가의 claim 묶음이 여기에 표시됩니다.</div>';
    document.getElementById('claimPill').textContent = 'Claims: -';
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
  document.getElementById('claimPill').textContent = `${nationDisplayName(activeNation)}: base ${ownedCount}, claim ${claimCount}, tech ${projectCount}`;
  const breakawayText = data.breakawayFrom ? ` · breakaway from ${escapeHtml(data.breakawayFrom)}` : '';
  const gatedCount = (data.gatedRegions || []).length;
  const activeNationLabel = humanizeNationLabel(activeNation);
  nationInfo.innerHTML = `<b>${escapeHtml(activeNationLabel)}</b> ${statusBadge(data.status)}<div class="small" style="margin:2px 0 10px">현재/시작 territory ${ownedCount} regions · 표시 중 claim ${claimCount} regions · project ${projectCount}${breakawayText}</div><div class="kv"><div>상태</div><div>${escapeHtml(statusLabel(data.status))}</div><div>기본 영토</div><div>${ownedCount} regions</div><div>직접 claim</div><div>${data.totalClaimRegions || 0} unique regions</div><div>targeted regions</div><div>${incomingTargetRegions(data, baseSet).size} region(s) · ${incomingEntries.length} claim groups</div><div>conditional</div><div>${gatedCount} gated regions</div><div>claim projects</div><div>${data.projectCount || 0}</div><div>표시 모드</div><div>${claimModeSel.value}</div></div><div class="claimSections">${renderClaimSection('Outgoing / led claims', outgoingEntries, '이 국가가 주도하는 추가 claim이 없습니다.', 'outgoing')}${renderClaimSection('Incoming / targeting claims by region', incomingEntries, '선택된 region을 목표로 하는 다른 claim이 없습니다.', 'incoming')}</div><div class="hint">지도에서 가장 밝은 시작색은 초기/현재 영토이며, claim 색상은 같은 hue 축에서 비연구 claim → 연구 tier 1 → 연구 tier 2 순서로 단계적으로 표시됩니다. 푸른 테두리는 평화적 claim, 붉은 테두리는 hostile claim, 점선은 capital claim, 보라색/잠금 스타일은 breakaway-gated conditional claim입니다.</div>`;
  nationInfo.querySelectorAll('.claimListItem').forEach(el => el.addEventListener('click', () => {
    const kind = el.dataset.claimKind;
    const index = Number(el.dataset.claimIndex);
    const source = kind === 'incoming' ? incomingEntries[index] : outgoingEntries[index];
    if (!source) return;
    if (kind === 'incoming') {
      const key = incomingClaimKey(source);
      activeIncomingClaimKey = activeIncomingClaimKey === key ? '' : key;
      projectFilter = '';
      projectSel.value = '';
      if (claimModeSel.value === 'project') claimModeSel.value = 'all';
      focusRegions(source.targetRegions || source.regions || []);
      updateNationOverlay(activeNation);
      return;
    }
    const key = outgoingClaimKey(source);
    activeIncomingClaimKey = '';
    projectFilter = claimModeSel.value === 'project' && projectFilter === key ? '' : key;
    claimModeSel.value = projectFilter ? 'project' : 'all';
    if (projectFilter && projectFilter !== '__base__') projectSel.value = projectFilter;
    else projectSel.value = '';
    focusRegions(source.regions || []);
    updateNationOverlay(activeNation);
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
  if (!baseSet.size && !claimEntries.length) { legend.innerHTML = '<div class="small">이 국가에 표시 가능한 추가 claim project가 없습니다.</div>'; return; }
  const activeFilter = claimModeSel.value === 'project' ? projectFilter : '';
  const initial = baseSet.size ? `<div class="legendGroup"><button type="button" class="legendItem${!activeFilter ? ' active' : ''}" data-project-filter="" title="show all claims"><span class="swatch" style="background:${BASE_TERRITORY_COLOR}"></span><div><b>초기 영토 / starting territory</b><div class="small">현재/시작 영토 · 클릭하면 전체 claim으로 돌아갑니다</div></div><span class="tag">${baseSet.size}</span></button></div>` : '';
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
    const researchText = e.project ? `research tier ${tier + 1}${cost ? ' · cost '+cost : ''}` : 'claim tier 0 · no research · 초기 영토 아님';
    const regionDetails = active ? renderRegionList(e.regions, e.claims || {}, 'claimed') : '';
    return `<div class="legendGroup${active ? ' active' : ''}"><button type="button" class="legendItem${active ? ' active' : ''}" data-project-filter="${escapeHtml(filterValue)}" title="${escapeHtml(e.project || 'base')}"><span class="swatch" style="background:${projectColor(e.project,tier)}"></span><div><b>${escapeHtml(label)}</b><div class="small">${escapeHtml(e.project || 'No project')} · ${researchText} · regions ${e.regions.length} · 평화 ${peaceful} / 적대 ${hostile}${capital ? ' · capital '+capital : ''}${gated ? ' · gated '+gated : ''}</div></div><span class="tag">${e.regions.length}</span></button>${regionDetails}</div>`;
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
  const opts = ['<option value="">자동/전체</option>'].concat(entries.map(e => `<option value="${escapeHtml(e.project)}">${escapeHtml(projectDisplay(e.project))} (${e.regions.length})</option>`));
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
    const text = (r.name+' '+r.regionName+' '+r.nationTag).toLowerCase();
    const okQ = !q || text.includes(q);
    const okClaims = !onlyClaims || !currentNation || claimSet.has(r.regionName) || baseSet.has(r.regionName);
    const ok = okQ && okClaims;
    p.classList.toggle('hidden', !ok);
    if (ok) { visible++; if (matches.length<90) matches.push(r); }
  });
  labelTextElements.forEach(t => {
    const r = REGIONS[Number(t.dataset.id)];
    const okQ = !q || (r.name+' '+r.regionName+' '+r.nationTag).toLowerCase().includes(q);
    const okClaims = !onlyClaims || !currentNation || claimSet.has(r.regionName) || baseSet.has(r.regionName);
    t.style.display = okQ && okClaims ? '' : 'none';
  });
  if (rerenderResults && results) {
    const nationMatches = q ? nationChoices.filter(c => c.searchText.includes(q)).slice(0, 25) : [];
    const nationHtml = nationMatches.map(c => `<div class="item nationResult" data-nation="${escapeHtml(c.tag)}"><b>${escapeHtml(c.label)}</b><div class="small">Nation 선택 · tag ${escapeHtml(c.tag)}</div></div>`).join('');
    const regionHtml = matches.map(r => `<div class="item" data-id="${r.id}"><b>${escapeHtml(prettyRegion(r.regionName))}</b><div class="small">${escapeHtml(r.name)} · ${escapeHtml(r.nationTag)}</div></div>`).join('');
    const empty = !nationHtml && !regionHtml ? '<div class="item small">검색 결과 없음</div>' : '';
    results.innerHTML = nationHtml + regionHtml + empty;
    results.querySelectorAll('.item[data-nation]').forEach(el => el.addEventListener('click', () => focusNation(el.dataset.nation)));
    results.querySelectorAll('.item[data-id]').forEach(el => el.addEventListener('click', () => selectRegion(REGIONS[Number(el.dataset.id)])));
  }
}
function populate() {
  buildNationChoices();
  buildIncomingClaimIndex();
  const warn = document.getElementById('warnPill');
  if (CLAIM_STATS.regionsUnmatched) { warn.style.display=''; warn.textContent = `${CLAIM_STATS.regionsUnmatched} unmatched claim rows`; }
}

injectClaimOverlayStyles();

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
document.getElementById('onlyClaimsBtn').addEventListener('click', () => { onlyClaims=!onlyClaims; document.getElementById('onlyClaimsBtn').textContent = onlyClaims ? '전체 지도 보기' : 'claim 대상만 보기'; applyFilters(); });
svg.addEventListener('mousemove', onMapMove);
svg.addEventListener('click', e => {
  const target = e.target;
  if (target === svg || target === gGrid || target.classList?.contains('graticule')) clearSelection();
});
svg.addEventListener('mouseleave', onMapLeave);

populate(); renderGrid(); renderRegions();
}).catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:24px;color:#f8fafc;background:#0b1020">Failed to load generated Terra Invicta map data.

${String(error && error.stack || error)}</pre>`;
});
