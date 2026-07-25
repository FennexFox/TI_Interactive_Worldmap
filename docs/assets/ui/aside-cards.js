// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

const ASIDE_CARD_COLLAPSE_STORAGE_KEY = 'ti-map-aside-card-collapsed';
const NATION_INFO_SECTION_STORAGE_KEY = 'ti-map-nation-info-sections';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readJsonSetting(storage, key, fallback, isValid = () => true) {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function saveJsonSetting(storage, key, value) {
  try { storage?.setItem(key, JSON.stringify(value)); }
  catch (_) {}
}

export function createAsideCardController({
  document,
  storage = globalThis.window?.localStorage,
  t = key => key,
  updateMapViewControlsLabels = () => {},
} = {}) {
  let list = null;
  let bound = false;
  let destroyed = false;

  function infoSectionOpenAttribute(key) {
    const state = readJsonSetting(storage, NATION_INFO_SECTION_STORAGE_KEY, {}, isPlainObject);
    return state[key] === false ? '' : ' open';
  }

  function bindNationInfoSectionToggles(panelRoot) {
    panelRoot?.querySelectorAll('.infoSubsection[data-info-section]').forEach(section => {
      section.addEventListener('toggle', () => {
        const state = readJsonSetting(storage, NATION_INFO_SECTION_STORAGE_KEY, {}, isPlainObject);
        state[section.dataset.infoSection] = section.open;
        saveJsonSetting(storage, NATION_INFO_SECTION_STORAGE_KEY, state);
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
    saveJsonSetting(
      storage,
      ASIDE_CARD_COLLAPSE_STORAGE_KEY,
      Object.fromEntries(cards.map(card => [card.dataset.asideCard, card.dataset.collapsed === 'true']))
    );
  }

  function updateAsideCardControls() {
    const cards = [...document.querySelectorAll('#asideCardList .sideCard[data-aside-card]')];
    cards.forEach(card => {
      const toggle = card.querySelector('[data-card-toggle]');
      if (toggle) {
        const collapsed = card.dataset.collapsed === 'true';
        toggle.textContent = collapsed ? '+' : '\u2212';
        toggle.title = collapsed ? t('sectionCard.expand') : t('sectionCard.collapse');
        toggle.setAttribute('aria-label', collapsed ? t('sectionCard.expand') : t('sectionCard.collapse'));
        toggle.setAttribute('aria-expanded', String(!collapsed));
      }
    });
  }

  function initAsideCards() {
    if (bound || destroyed) return false;
    list = document.getElementById('asideCardList');
    if (!list) return false;
    const cards = [...list.querySelectorAll('.sideCard[data-aside-card]')];
    const collapsed = readJsonSetting(storage, ASIDE_CARD_COLLAPSE_STORAGE_KEY, {}, isPlainObject);
    cards.forEach(card => setAsideCardCollapsed(card, !!collapsed[card.dataset.asideCard]));
    list.addEventListener('click', onAsideCardClick);
    bound = true;
    updateAsideCardControls();
    updateMapViewControlsLabels();
    return true;
  }

  function onAsideCardClick(event) {
    const card = event.target.closest('.sideCard[data-aside-card]');
    if (!card || !list?.contains(card)) return;
    if (event.target.closest('[data-card-toggle]')) {
      setAsideCardCollapsed(card, card.dataset.collapsed !== 'true');
      saveAsideCardState();
      updateAsideCardControls();
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (bound) list?.removeEventListener('click', onAsideCardClick);
    bound = false;
    list = null;
  }

  return {
    infoSectionOpenAttribute,
    bindNationInfoSectionToggles,
    updateAsideCardControls,
    initAsideCards,
    destroy,
  };
}
