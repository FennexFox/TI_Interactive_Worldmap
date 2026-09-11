// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  installRafCollector,
  measureFrameIntervals,
  percentile,
  poolIntervalSummaries,
  summarizeIntervals,
} from '../../tools/frame-intervals.mjs';

test('percentile interpolates sorted values and handles empty input', () => {
  assert.equal(percentile([], 0.5), null);
  assert.equal(percentile([4, 1, 3, 2], 0), 1);
  assert.equal(percentile([4, 1, 3, 2], 0.5), 2.5);
  assert.equal(percentile([4, 1, 3, 2], 1), 4);
});

test('summarizeIntervals reports central tendency, tails, and ratios', () => {
  assert.deepEqual(summarizeIntervals([10, 20, 40, 60]), {
    sampleCount: 4,
    mean: 32.5,
    median: 30,
    p95: 57,
    max: 60,
    over33_34: 2,
    over50: 1,
    over33_34Ratio: 0.5,
    over50Ratio: 0.25,
  });
  assert.equal(summarizeIntervals().sampleCount, 0);
});

test('poolIntervalSummaries combines raw interval samples', () => {
  assert.equal(poolIntervalSummaries([{intervals: [10, 20]}, {intervals: [30]}]).mean, 20);
});

function fakeCollectorPage() {
  const attributes = {viewBox: '0 0 1 1'};
  const svg = {getAttribute: name => attributes[name]};
  const observers = [];
  const rafs = new Map();
  const canceled = [];
  let nextRafId = 0;
  let now = 100;
  const original = {
    document: globalThis.document,
    window: globalThis.window,
    MutationObserver: globalThis.MutationObserver,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    performance: globalThis.performance,
  };
  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      observers.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  }
  globalThis.document = {querySelector: () => svg};
  globalThis.window = {};
  globalThis.MutationObserver = FakeMutationObserver;
  globalThis.requestAnimationFrame = callback => {
    const id = ++nextRafId;
    rafs.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = id => {
    canceled.push(id);
    rafs.delete(id);
  };
  Object.defineProperty(globalThis, 'performance', {configurable: true, value: {now: () => now}});
  const page = {evaluate: callback => callback()};
  function frame() {
    const [id, callback] = rafs.entries().next().value || [];
    assert.ok(id, 'expected a queued RAF');
    rafs.delete(id);
    now += 10;
    callback();
  }
  function mutateViewBox(value) {
    attributes.viewBox = value;
    observers.at(-1)?.callback([{type: 'attributes', attributeName: 'viewBox', target: svg}]);
  }
  function restore() {
    globalThis.document = original.document;
    globalThis.window = original.window;
    globalThis.MutationObserver = original.MutationObserver;
    globalThis.requestAnimationFrame = original.requestAnimationFrame;
    globalThis.cancelAnimationFrame = original.cancelAnimationFrame;
    Object.defineProperty(globalThis, 'performance', {configurable: true, value: original.performance});
  }
  return {page, frame, mutateViewBox, observers, rafs, canceled, restore};
}

test('RAF collector ignores unchanged viewBox and classifies numeric post-update intervals', async () => {
  const fake = fakeCollectorPage();
  try {
    await installRafCollector(fake.page);
    fake.frame();
    fake.frame();
    fake.mutateViewBox('0 0 1 1');
    fake.mutateViewBox('1 0 1 1');
    fake.frame();
    fake.frame();
    fake.frame();
    const result = globalThis.window.__TI_FRAME_COLLECTOR__.stop();
    assert.deepEqual(result.intervals.map(item => item.dt), [10, 10, 10, 10, 10]);
    assert.deepEqual(result.postViewBoxIntervals, [10, 10]);
    assert.equal(result.viewBoxMutations, 1);
    assert.equal(result.postViewBoxIntervals.every(Number.isFinite), true);
  } finally {
    fake.restore();
  }
});

function wrapperPage(fake) {
  return {
    evaluate: async callback => {
      // Prime/trailing callbacks are intentionally controlled by the fake RAF
      // scheduler in the action; their promise need not be driven here.
      const source = String(callback);
      if (source.includes('new Promise') && source.includes('requestAnimationFrame')) return undefined;
      return callback();
    },
  };
}

test('measureFrameIntervals returns numeric summaries and cleans up on action failure', async () => {
  const fake = fakeCollectorPage();
  try {
    const page = wrapperPage(fake);
    const success = await measureFrameIntervals(page, async () => {
      fake.mutateViewBox('2 0 1 1');
      fake.frame();
      fake.frame();
      return 'done';
    });
    assert.equal(success.value, 'done');
    assert.equal(success.fullInput.sampleCount, 2);
    assert.equal(success.postUpdate.sampleCount, 2);
    assert.equal(success.postUpdate.mean, 10);
    await assert.rejects(
      () => measureFrameIntervals(page, async () => { throw new Error('input failed'); }),
      /input failed/
    );
    assert.equal(globalThis.window.__TI_FRAME_COLLECTOR__, undefined);
  } finally {
    fake.restore();
  }
});

test('RAF collector reset excludes priming and reinstall stops old observer/RAF', async () => {
  const fake = fakeCollectorPage();
  try {
    await installRafCollector(fake.page);
    fake.frame();
    globalThis.window.__TI_FRAME_COLLECTOR__.reset();
    fake.frame();
    const firstObserver = fake.observers[0];
    await installRafCollector(fake.page);
    assert.equal(firstObserver.disconnected, true);
    assert.ok(fake.canceled.length >= 1);
    fake.frame();
    const collector = globalThis.window.__TI_FRAME_COLLECTOR__;
    const result = collector.stop();
    assert.deepEqual(result.intervals.map(item => item.dt), [10]);
    const stoppedAgain = collector.stop();
    assert.deepEqual(stoppedAgain.intervals, result.intervals);
    assert.equal(fake.rafs.size, 0);
  } finally {
    fake.restore();
  }
});
