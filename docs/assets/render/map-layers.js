const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULT_COPY_CONTEXT = Object.freeze({copyIndex: 0, xOffset: 0, isCanonical: true});

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function defaultWorldCopyContext() {
  return {...DEFAULT_COPY_CONTEXT};
}

export function normalizeWorldCopyContexts(copyContexts = [DEFAULT_COPY_CONTEXT]) {
  const contexts = Array.isArray(copyContexts) && copyContexts.length ? copyContexts : [DEFAULT_COPY_CONTEXT];
  return contexts.map((context, index) => {
    const copyIndex = finiteNumber(context?.copyIndex, index);
    const xOffset = finiteNumber(context?.xOffset);
    return {
      copyIndex,
      xOffset,
      isCanonical: context?.isCanonical !== undefined ? !!context.isCanonical : copyIndex === 0 && xOffset === 0,
    };
  });
}

export function worldCopyDataset(copyContext) {
  return {
    wrapCopy: copyContext.copyIndex,
    wrapOffset: copyContext.xOffset,
    wrapCanonical: copyContext.isCanonical ? '1' : '0',
  };
}

function registerRegionInstance(registry, regionId, element) {
  if (!registry || !regionId || !element) return;
  if (!registry.has(regionId)) registry.set(regionId, []);
  registry.get(regionId).push(element);
}

function clearRegistry(registry) {
  if (registry?.clear) registry.clear();
}

export function appendWorldCopyFragment(parentFragment, copyContext, copyCount, className, buildChildren) {
  const copyFragment = buildChildren();
  if (!copyFragment?.childNodes?.length) return;
  if (copyCount === 1 && copyContext.isCanonical && !copyContext.xOffset) {
    parentFragment.appendChild(copyFragment);
    return;
  }
  const group = createSvgElement('g', {
    class: className,
    transform: copyContext.xOffset ? `translate(${copyContext.xOffset} 0)` : null,
  }, worldCopyDataset(copyContext));
  group.appendChild(copyFragment);
  parentFragment.appendChild(group);
}

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

function normalizeDataset(dataset = {}) {
  return Object.fromEntries(
    Object.entries(dataset || {})
      .filter(([, value]) => value != null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, String(value)])
  );
}

function datasetRenderKey(dataset = {}) {
  return JSON.stringify(normalizeDataset(dataset));
}

export function buildVisualFillGroups(descriptors = []) {
  const groups = new Map();
  for (const descriptor of descriptors || []) {
    const path = descriptor?.path || descriptor?.region?.path;
    if (!path) continue;
    const className = descriptor.className || 'visual-fill-group';
    const fill = descriptor.fill || 'none';
    const fillOpacity = descriptor.fillOpacity ?? '';
    const dataset = normalizeDataset(descriptor.groupDataset || descriptor.dataset || {});
    const groupKey = descriptor.groupKey || JSON.stringify({
      className,
      fill,
      fillOpacity,
      dataset: datasetRenderKey(dataset),
    });
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        className,
        fill,
        fillOpacity,
        dataset,
        paths: [],
      });
    }
    groups.get(groupKey).paths.push(path);
  }
  return [...groups.values()];
}

export function createGroupedVisualFillFragment({
  descriptors = [],
  copyContexts,
  copyGroupClassName = 'visual-fill-copy',
} = {}) {
  const contexts = normalizeWorldCopyContexts(copyContexts);
  const groups = buildVisualFillGroups(descriptors);
  const frag = document.createDocumentFragment();
  for (const copyContext of contexts) {
    appendWorldCopyFragment(frag, copyContext, contexts.length, copyGroupClassName, () => {
      const copyFrag = document.createDocumentFragment();
      for (const group of groups) {
        copyFrag.appendChild(createSvgElement('path', {
          d: group.paths.join(' '),
          class: group.className,
          fill: group.fill,
          'fill-opacity': group.fillOpacity || null,
        }, {
          ...group.dataset,
          visualGroupSize: group.paths.length,
          ...worldCopyDataset(copyContext),
        }));
      }
      return copyFrag;
    });
  }
  return frag;
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

export function renderGrid({layer, mapView, copyContexts}) {
  const contexts = normalizeWorldCopyContexts(copyContexts);
  const {x, y, width: w, height: h} = mapView;
  const frag = document.createDocumentFragment();
  for (const copyContext of contexts) {
    appendWorldCopyFragment(frag, copyContext, contexts.length, 'grid-copy', () => {
      const copyFrag = document.createDocumentFragment();
      for (let lon = -3; lon <= 3.01; lon += 0.5) {
        copyFrag.appendChild(createSvgElement('path', {
          class: 'graticule',
          d: `M ${lon} ${y} L ${lon} ${y + h}`,
        }, worldCopyDataset(copyContext)));
      }
      for (let lat = -1.25; lat <= 1.01; lat += 0.25) {
        copyFrag.appendChild(createSvgElement('path', {
          class: 'graticule',
          d: `M ${x} ${lat} L ${x + w} ${lat}`,
        }, worldCopyDataset(copyContext)));
      }
      return copyFrag;
    });
  }
  replaceLayerChildren(layer, frag);
}

export function renderHitLayer({
  parent,
  indices,
  hitPathByRegion,
  hitPathInstancesByRegion,
  hitPathElements,
  copyContexts,
}) {
  const contexts = normalizeWorldCopyContexts(copyContexts);
  hitPathByRegion.clear();
  clearRegistry(hitPathInstancesByRegion);
  hitPathElements.length = 0;
  const frag = document.createDocumentFragment();
  for (const copyContext of contexts) {
    appendWorldCopyFragment(frag, copyContext, contexts.length, 'hit-copy', () => {
      const copyFrag = document.createDocumentFragment();
      for (const region of indices.regions) {
        const hitPath = createRegionPath(region, {
          class: 'region-hit',
          fill: 'transparent',
          stroke: 'none',
        }, {regionId: region.regionName, ...worldCopyDataset(copyContext)});
        if (copyContext.isCanonical) hitPathByRegion.set(region.regionName, hitPath);
        registerRegionInstance(hitPathInstancesByRegion, region.regionName, hitPath);
        hitPathElements.push(hitPath);
        copyFrag.appendChild(hitPath);
      }
      return copyFrag;
    });
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
  copyContexts,
}) {
  const contexts = normalizeWorldCopyContexts(copyContexts);
  labelTextElements.length = 0;
  replaceLayerChildren(layer);
  setLayerVisible(layer, labelsVisible);
  if (!labelsVisible) return;
  const frag = document.createDocumentFragment();
  for (const copyContext of contexts) {
    appendWorldCopyFragment(frag, copyContext, contexts.length, 'label-copy', () => {
      const copyFrag = document.createDocumentFragment();
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
          ...worldCopyDataset(copyContext),
        });
        labelTextElements.push(text);
        copyFrag.appendChild(text);
      }
      return copyFrag;
    });
  }
  replaceLayerChildren(layer, frag);
}

export function renderRegions({
  layer,
  hitLayer,
  labelLayer,
  indices,
  copyContexts,
  pathByRegion,
  pathInstancesByRegion,
  regionPathElements,
  hitPathByRegion,
  hitPathInstancesByRegion,
  hitPathElements,
  labelTextElements,
  labelsVisible,
  colorFor,
  labelPosition,
  localizedRegionName,
}) {
  const contexts = normalizeWorldCopyContexts(copyContexts);
  pathByRegion.clear();
  clearRegistry(pathInstancesByRegion);
  regionPathElements.length = 0;
  const frag = document.createDocumentFragment();
  for (const copyContext of contexts) {
    appendWorldCopyFragment(frag, copyContext, contexts.length, 'region-copy', () => {
      const copyFrag = document.createDocumentFragment();
      for (const region of indices.regions) {
        const path = createRegionPath(region, {
          class: 'region',
          fill: colorFor(region),
        }, worldCopyDataset(copyContext));
        if (copyContext.isCanonical) pathByRegion.set(region.regionName, path);
        registerRegionInstance(pathInstancesByRegion, region.regionName, path);
        regionPathElements.push(path);
        copyFrag.appendChild(path);
      }
      return copyFrag;
    });
  }
  replaceLayerChildren(layer, frag);
  renderHitLayer({parent: hitLayer, indices, hitPathByRegion, hitPathInstancesByRegion, hitPathElements, copyContexts: contexts});
  renderLabels({layer: labelLayer, labelTextElements, labelsVisible, regions: indices.regions, labelPosition, localizedRegionName, copyContexts: contexts});
}
