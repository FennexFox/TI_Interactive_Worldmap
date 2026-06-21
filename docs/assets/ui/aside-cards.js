// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

const ASIDE_CARD_ORDER_STORAGE_KEY = 'ti-map-aside-card-order';
const ASIDE_CARD_COLLAPSE_STORAGE_KEY = 'ti-map-aside-card-collapsed';
const NATION_INFO_SECTION_STORAGE_KEY = 'ti-map-nation-info-sections';
const DEFAULT_ASIDE_CARD_ORDER = ['explore', 'expansionNodes', 'selected'];

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
    saveJsonSetting(storage, ASIDE_CARD_ORDER_STORAGE_KEY, cards.map(card => card.dataset.asideCard));
    saveJsonSetting(
      storage,
      ASIDE_CARD_COLLAPSE_STORAGE_KEY,
      Object.fromEntries(cards.map(card => [card.dataset.asideCard, card.dataset.collapsed === 'true']))
    );
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
        toggle.textContent = collapsed ? '+' : '\u2212';
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
    const savedOrder = readJsonSetting(storage, ASIDE_CARD_ORDER_STORAGE_KEY, DEFAULT_ASIDE_CARD_ORDER, Array.isArray);
    const order = [...savedOrder.filter(key => cardsByKey.has(key)), ...DEFAULT_ASIDE_CARD_ORDER.filter(key => !savedOrder.includes(key))];
    order.forEach(key => list.appendChild(cardsByKey.get(key)));
    const collapsed = readJsonSetting(storage, ASIDE_CARD_COLLAPSE_STORAGE_KEY, {}, isPlainObject);
    cardsByKey.forEach((card, key) => setAsideCardCollapsed(card, !!collapsed[key]));
    list.addEventListener('click', event => {
      const card = event.target.closest('.sideCard[data-aside-card]');
      if (!card || !list.contains(card)) return;
      if (event.target.closest('[data-card-toggle]')) {
        setAsideCardCollapsed(card, card.dataset.collapsed !== 'true');
        saveAsideCardState();
        updateAsideCardControls();
        return;
      }
      const moveButton = event.target.closest('[data-card-move]');
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

  return {
    infoSectionOpenAttribute,
    bindNationInfoSectionToggles,
    updateAsideCardControls,
    initAsideCards,
  };
}
