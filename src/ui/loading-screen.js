// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

const LOADING_FAILURE_MESSAGES = {
  en: 'Failed to load generated Terra Invicta map data.',
  ko: 'Terra Invicta 지도 데이터를 불러오지 못했습니다.',
};

function loadingLanguage(window, document) {
  let language = 'ko';
  try {
    const saved = window.localStorage?.getItem('ti-map-language');
    const fallback = document.documentElement.lang || 'ko';
    language = String(saved || fallback).toLowerCase().startsWith('en') ? 'en' : 'ko';
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return language;
}

export function createLoadingScreen({window, document}) {
  const root = document.getElementById('appLoading');
  const detail = document.getElementById('appLoadingDetail');
  let dismissed = false;

  function dismiss() {
    if (!root || dismissed) return;
    dismissed = true;
    window.requestAnimationFrame(() => {
      root.dataset.loadingState = 'done';
      root.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => root.remove(), 240);
    });
  }

  function showFailure(error) {
    const message = LOADING_FAILURE_MESSAGES[loadingLanguage(window, document)];
    if (root) {
      root.dataset.loadingState = 'error';
      root.setAttribute('role', 'alert');
      root.removeAttribute('aria-hidden');
      if (detail) {
        const suffix = error?.message ? ` ${error.message}` : '';
        detail.textContent = `${message}${suffix}`;
      }
      return;
    }
    const pre = document.createElement('pre');
    pre.style.cssText = 'white-space:pre-wrap;padding:24px;color:#f8fafc;background:#0b1020';
    pre.textContent = `${message}\n\n${String(error?.stack || error)}`;
    document.body.replaceChildren(pre);
  }

  return {dismiss, showFailure};
}
