// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {createMapInteractionController} from '../../src/interaction/map-interaction-controller.js';

class FakeClassList {
  constructor(names = []) {
    this.names = new Set(names);
  }

  add(...names) {
    names.forEach(name => this.names.add(name));
  }

  contains(name) {
    return this.names.has(name);
  }

  remove(...names) {
    names.forEach(name => this.names.delete(name));
  }
}

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener, options) {
    assert.equal(typeof listener, 'function', `${type} listener must be callable`);
    const entries = this.listeners.get(type) || [];
    entries.push({listener, options});
    this.listeners.set(type, entries);
  }

  removeEventListener(type, listener, options) {
    const entries = this.listeners.get(type) || [];
    this.listeners.set(type, entries.filter(entry => (
      entry.listener !== listener || entry.options !== options
    )));
  }

  dispatch(type, event = {}) {
    event.type = type;
    for (const {listener} of [...(this.listeners.get(type) || [])]) listener(event);
  }

  listenerCount(type) {
    return (this.listeners.get(type) || []).length;
  }
}

class FakeNode extends FakeEventTarget {
  constructor({classes = [], dataset = {}} = {}) {
    super();
    this.classList = new FakeClassList(classes);
    this.dataset = dataset;
    this.style = {};
    this.textContent = '';
    this.offsetWidth = 160;
    this.offsetHeight = 26;
    this.children = new Set();
  }

  closest(selector) {
    if (selector.includes('data-region') && (this.dataset.regionId || this.dataset.region)) return this;
    return null;
  }

  contains(node) {
    return node === this || this.children.has(node);
  }

  getBoundingClientRect() {
    return {left: 0, top: 0, width: 800, height: 400};
  }
}

function createFakeWindow() {
  const window = new FakeEventTarget();
  const frames = new Map();
  const timers = new Map();
  const observers = [];
  let nextFrameId = 1;
  let nextTimerId = 100;
  window.requestAnimationFrame = callback => {
    const id = nextFrameId;
    nextFrameId += 1;
    frames.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = id => frames.delete(id);
  window.setTimeout = callback => {
    const id = nextTimerId;
    nextTimerId += 1;
    timers.set(id, callback);
    return id;
  };
  window.clearTimeout = id => timers.delete(id);
  window.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      this.observed = [];
      observers.push(this);
    }

    disconnect() {
      this.disconnected = true;
    }

    observe(node) {
      this.observed.push(node);
    }
  };
  return {frames, observers, timers, window};
}

function createHarness(overrides = {}) {
  const fakeWindow = createFakeWindow();
  const svg = new FakeNode();
  const svgWrap = new FakeNode();
  const tip = new FakeNode();
  const hitLayer = new FakeNode();
  const gridLayer = new FakeNode();
  const hit = new FakeNode({
    classes: ['region-hit'],
    dataset: {regionId: 'RegionA'},
  });
  hitLayer.children.add(hit);
  const context = {regionByName: {RegionA: {id: 0, regionName: 'RegionA'}}};
  const document = {
    elementFromPoint: () => hit,
    elementsFromPoint: () => [hit],
  };
  const controller = createMapInteractionController({
    window: fakeWindow.window,
    document,
    svg,
    svgWrap,
    tip,
    hitLayer,
    gridLayer,
    getContext: () => context,
    getMapView: () => ({width: 100, height: 50}),
    getWorldWrapEnabled: () => false,
    panMapView: () => {},
    ...overrides,
  });
  return {
    ...fakeWindow,
    context,
    controller,
    document,
    gridLayer,
    hit,
    hitLayer,
    svg,
    svgWrap,
    tip,
  };
}

test('map interaction controller binds each listener and observer exactly once', () => {
  const harness = createHarness();
  const {controller, hitLayer, observers, svg, svgWrap, window} = harness;

  controller.bind();
  controller.bind();

  for (const type of ['pointerover', 'pointermove', 'pointerout', 'click']) {
    assert.equal(hitLayer.listenerCount(type), 1, `hit listener ${type}`);
  }
  for (const type of [
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointercancel',
    'lostpointercapture',
    'mousemove',
    'wheel',
    'click',
    'mouseleave',
  ]) {
    assert.equal(svg.listenerCount(type), 1, `svg listener ${type}`);
  }
  assert.equal(window.listenerCount('resize'), 1);
  assert.equal(window.listenerCount('scroll'), 1);
  assert.deepEqual(observers[0].observed, [svgWrap]);

  controller.destroy();
  controller.destroy();

  assert.equal([...hitLayer.listeners.values()].flat().length, 0);
  assert.equal([...svg.listeners.values()].flat().length, 0);
  assert.equal(window.listenerCount('resize'), 0);
  assert.equal(window.listenerCount('scroll'), 0);
  assert.equal(observers[0].disconnected, true);
});

test('resetContext cancels hover, tooltip, pan, and render frames before they can become stale', () => {
  let hoverPreviewRuns = 0;
  let hoverVisualRuns = 0;
  let mapViewRuns = 0;
  let resetRuns = 0;
  const harness = createHarness({
    onContextReset: () => { resetRuns += 1; },
    onHoverFullVisualPass: () => { hoverVisualRuns += 1; },
    onHoverPreview: () => { hoverPreviewRuns += 1; },
    onMapViewRender: () => { mapViewRuns += 1; },
  });
  const {controller, frames, hit, svg} = harness;
  controller.bind();

  controller.scheduleHoverPreview('AAA');
  controller.scheduleHoverFullVisualPass();
  controller.showTooltip({clientX: 10, clientY: 20}, 0, 'Region A');
  svg.dispatch('pointerdown', {
    button: 0,
    clientX: 0,
    clientY: 0,
    pointerId: 1,
  });
  svg.dispatch('pointermove', {
    clientX: 20,
    clientY: 0,
    pointerId: 1,
    preventDefault() {},
    target: hit,
  });

  assert.equal(frames.size, 4);
  controller.resetContext();
  assert.equal(frames.size, 0);
  assert.equal(resetRuns, 1);
  assert.equal(controller.hasActiveTooltip(), false);
  assert.equal(svg.classList.contains('is-panning'), false);
  assert.equal(svg.classList.contains('is-panning-ready'), false);
  assert.equal(hoverPreviewRuns, 0);
  assert.equal(hoverVisualRuns, 0);
  assert.equal(mapViewRuns, 0);
});

test('hit events use the current context and drag suppression consumes one click', () => {
  const entered = [];
  const clicked = [];
  const harness = createHarness({
    onRegionClick: (_event, region) => clicked.push(region.regionName),
    onRegionEnter: (_event, region) => entered.push(region.regionName),
  });
  const {context, controller, hit, hitLayer, svg, timers} = harness;
  controller.bind();

  hitLayer.dispatch('pointerover', {
    pointerId: 1,
    target: hit,
  });
  context.regionByName.RegionA = {id: 1, regionName: 'RegionB'};
  hitLayer.dispatch('pointerover', {
    pointerId: 2,
    target: hit,
  });
  assert.deepEqual(entered, ['RegionA', 'RegionB']);

  svg.dispatch('pointerdown', {
    button: 0,
    clientX: 0,
    clientY: 0,
    pointerId: 3,
  });
  svg.dispatch('pointermove', {
    clientX: 20,
    clientY: 0,
    pointerId: 3,
    preventDefault() {},
    target: hit,
  });
  svg.dispatch('pointerup', {
    pointerId: 3,
    preventDefault() {},
    target: hit,
  });
  assert.equal(timers.size, 1);

  let prevented = 0;
  let stopped = 0;
  hitLayer.dispatch('click', {
    preventDefault: () => { prevented += 1; },
    stopPropagation: () => { stopped += 1; },
    target: hit,
  });
  assert.deepEqual(clicked, []);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);

  hitLayer.dispatch('click', {
    stopPropagation() {},
    target: hit,
  });
  assert.deepEqual(clicked, ['RegionB']);
});
