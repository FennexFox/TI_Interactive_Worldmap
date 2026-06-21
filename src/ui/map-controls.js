// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

function mapViewControlLabel(action, language) {
  const labels = {
    zoomIn: language === 'ko' ? '\ud655\ub300' : 'Zoom in',
    zoomOut: language === 'ko' ? '\ucd95\uc18c' : 'Zoom out',
    reset: language === 'ko' ? '\ubcf4\uae30 \ucd08\uae30\ud654' : 'Reset view',
  };
  return labels[action] || action;
}

export function updateMapViewControlsLabels({
  document,
  t,
  currentLanguage = 'en',
  worldWrapEnabled = false,
} = {}) {
  const controls = document?.getElementById('mapViewControls');
  if (!controls) return;
  controls.querySelectorAll('[data-map-view-action]').forEach(button => {
    const action = button.dataset.mapViewAction;
    const label = mapViewControlLabel(action, currentLanguage);
    button.title = label;
    button.setAttribute('aria-label', label);
    if (action === 'reset') button.textContent = currentLanguage === 'ko' ? '\ucd08\uae30\ud654' : 'Reset';
  });
  const wrapToggle = controls.querySelector('[data-map-view-wrap-toggle]');
  const wrapLabel = controls.querySelector('[data-map-view-wrap-label]');
  const wrapTitle = t('mapWrap.warning');
  if (wrapToggle) {
    wrapToggle.title = wrapTitle;
    wrapToggle.setAttribute('aria-pressed', worldWrapEnabled ? 'true' : 'false');
    wrapToggle.setAttribute('aria-label', `${t('mapWrap.label')}. ${wrapTitle}`);
  }
  if (wrapLabel) wrapLabel.textContent = t('mapWrap.label');
}

export function initMapViewControls({
  document,
  svgWrap,
  t,
  currentLanguage = 'en',
  worldWrapEnabled = false,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleWrap,
} = {}) {
  if (!svgWrap || document?.getElementById('mapViewControls')) return;
  const controls = document.createElement('div');
  controls.id = 'mapViewControls';
  controls.className = 'mapViewControls';
  controls.innerHTML = `
    <button type="button" class="mapViewControl" data-map-view-action="zoomIn">+</button>
    <button type="button" class="mapViewControl" data-map-view-action="zoomOut">\u2212</button>
    <button type="button" class="mapViewControl mapViewControlReset" data-map-view-action="reset">Reset</button>
    <button type="button" class="mapViewControl mapViewWrapToggle" data-map-view-wrap-toggle aria-pressed="false">
      <span data-map-view-wrap-label></span>
    </button>
  `;
  controls.addEventListener('click', event => {
    const wrapToggle = event.target.closest('[data-map-view-wrap-toggle]');
    if (wrapToggle) {
      event.preventDefault();
      onToggleWrap?.();
      return;
    }
    const button = event.target.closest('[data-map-view-action]');
    if (!button) return;
    event.preventDefault();
    const action = button.dataset.mapViewAction;
    if (action === 'zoomIn') onZoomIn?.();
    else if (action === 'zoomOut') onZoomOut?.();
    else if (action === 'reset') onReset?.();
  });
  svgWrap.appendChild(controls);
  updateMapViewControlsLabels({document, t, currentLanguage, worldWrapEnabled});
}
