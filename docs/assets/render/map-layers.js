const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSvgElement(tag, attrs = {}, dataset = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === 'textContent') element.textContent = String(value);
    else element.setAttribute(key, String(value));
  }
  for (const [key, value] of Object.entries(dataset)) {
    if (value == null || value === '') continue;
    element.dataset[key] = String(value);
  }
  return element;
}

export function createRegionPath(region, attrs = {}, dataset = {}) {
  return createSvgElement('path', {d: region.path, ...attrs}, {
    id: region.id,
    region: region.regionName,
    nation: region.nationTag,
    ...dataset,
  });
}

export function replaceLayerChildren(layer, children = []) {
  if (!layer) return;
  if (children instanceof DocumentFragment) {
    layer.replaceChildren(children);
    return;
  }
  const nextChildren = Array.isArray(children) ? children : [children];
  layer.replaceChildren(...nextChildren.filter(Boolean));
}

export function setLayerVisible(layer, visible) {
  if (layer) layer.style.display = visible ? '' : 'none';
}

export function renderGrid({layer, mapView}) {
  const {x, y, width: w, height: h} = mapView;
  let out = '';
  for (let lon = -3; lon <= 3.01; lon += 0.5) out += `<path class="graticule" d="M ${lon} ${y} L ${lon} ${y + h}"/>`;
  for (let lat = -1.25; lat <= 1.01; lat += 0.25) out += `<path class="graticule" d="M ${x} ${lat} L ${x + w} ${lat}"/>`;
  if (layer) layer.innerHTML = out;
}

export function renderHitLayer({parent, indices, hitPathByRegion, hitPathElements}) {
  hitPathByRegion.clear();
  hitPathElements.length = 0;
  const frag = document.createDocumentFragment();
  for (const region of indices.regions) {
    const hitPath = createRegionPath(region, {
      class: 'region-hit',
      fill: 'transparent',
      stroke: 'none',
    }, {regionId: region.regionName});
    hitPathByRegion.set(region.regionName, hitPath);
    hitPathElements.push(hitPath);
    frag.appendChild(hitPath);
  }
  replaceLayerChildren(parent, frag);
}

export function renderLabels({
  layer,
  labelTextElements,
  labelsVisible,
  regions,
  labelPosition,
  localizedRegionName,
}) {
  labelTextElements.length = 0;
  replaceLayerChildren(layer);
  setLayerVisible(layer, labelsVisible);
  if (!labelsVisible) return;
  const frag = document.createDocumentFragment();
  for (const region of regions) {
    const label = labelPosition(region);
    if (!label) continue;
    const text = createSvgElement('text', {
      class: 'label',
      x: label.x,
      y: label.y,
      textContent: localizedRegionName(region),
    }, {
      id: region.id,
      region: region.regionName,
      nation: region.nationTag,
    });
    labelTextElements.push(text);
    frag.appendChild(text);
  }
  replaceLayerChildren(layer, frag);
}

export function renderRegions({
  layer,
  hitLayer,
  labelLayer,
  indices,
  pathByRegion,
  regionPathElements,
  hitPathByRegion,
  hitPathElements,
  labelTextElements,
  labelsVisible,
  colorFor,
  labelPosition,
  localizedRegionName,
}) {
  pathByRegion.clear();
  regionPathElements.length = 0;
  const frag = document.createDocumentFragment();
  for (const region of indices.regions) {
    const path = createRegionPath(region, {
      class: 'region',
      fill: colorFor(region),
    });
    pathByRegion.set(region.regionName, path);
    regionPathElements.push(path);
    frag.appendChild(path);
  }
  replaceLayerChildren(layer, frag);
  renderHitLayer({parent: hitLayer, indices, hitPathByRegion, hitPathElements});
  renderLabels({layer: labelLayer, labelTextElements, labelsVisible, regions: indices.regions, labelPosition, localizedRegionName});
}
