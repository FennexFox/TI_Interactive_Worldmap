// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

export function percentile(values, rank) {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * Math.min(Math.max(rank, 0), 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function summarizeIntervals(intervals = []) {
  const values = intervals.filter(Number.isFinite);
  const round = value => value == null ? null : Number(value.toFixed(3));
  const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  return {
    sampleCount: values.length,
    mean: round(mean),
    median: round(percentile(values, 0.5)),
    p95: round(percentile(values, 0.95)),
    max: round(values.length ? Math.max(...values) : null),
    over33_34: values.filter(value => value > 33.34).length,
    over50: values.filter(value => value > 50).length,
    over33_34Ratio: values.length ? values.filter(value => value > 33.34).length / values.length : 0,
    over50Ratio: values.length ? values.filter(value => value > 50).length / values.length : 0,
  };
}

export async function installRafCollector(page) {
  await page.evaluate(() => {
    window.__TI_FRAME_COLLECTOR__?.stop?.();
    const svg = document.querySelector('#map');
    const state = {intervals: [], viewBoxMutations: 0, pendingViewBox: false, followingViewBox: false, last: performance.now(), lastViewBox: svg.getAttribute('viewBox')};
    let rafId = 0;
    let stopped = false;
    const observer = new globalThis.MutationObserver(records => {
      if (records.some(record => record.type === 'attributes'
        && record.attributeName === 'viewBox'
        && record.target.getAttribute('viewBox') !== state.lastViewBox)) {
        state.viewBoxMutations += 1;
        state.pendingViewBox = true;
        state.lastViewBox = svg.getAttribute('viewBox');
      }
    });
    observer.observe(svg, {attributes: true, attributeFilter: ['viewBox']});
    function frame() {
      if (stopped) return;
      const now = performance.now();
      // The mutation and collector may run in the same animation frame. Include
      // the following interval too so the subsequent paint is not missed merely
      // because of RAF callback registration order.
      state.intervals.push({dt: now - state.last, afterViewBox: state.pendingViewBox || state.followingViewBox});
      state.followingViewBox = state.pendingViewBox;
      state.pendingViewBox = false;
      state.last = now;
      if (!stopped) rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    window.__TI_FRAME_COLLECTOR__ = {
      stop() {
        stopped = true;
        cancelAnimationFrame(rafId);
        observer.disconnect();
        return {
          intervals: state.intervals,
          postViewBoxIntervals: state.intervals.filter(item => item.afterViewBox).map(item => item.dt),
          viewBoxMutations: state.viewBoxMutations,
        };
      },
      reset() {
        if (stopped) return;
        state.intervals.length = 0;
        state.viewBoxMutations = 0;
        state.pendingViewBox = false;
        state.followingViewBox = false;
        state.last = performance.now();
        state.lastViewBox = svg.getAttribute('viewBox');
      },
    };
  });
}

// Tool-side only: prime two RAFs, then observe the action through two trailing
// RAFs so the last scheduled viewBox write and its following frame are included.
// postUpdate is the first two observed intervals after a changed viewBox, a scheduling
// proxy that includes paint pressure, not a direct paint-duration measurement.
export async function measureFrameIntervals(page, action) {
  await installRafCollector(page);
  try {
    await page.evaluate(() => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__TI_FRAME_COLLECTOR__.reset();
        resolve();
      }));
    }));
    const value = await action();
    await page.evaluate(() => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    const raw = await page.evaluate(() => window.__TI_FRAME_COLLECTOR__.stop());
    const intervals = raw.intervals.map(item => item.dt);
    return {
      value,
      intervals,
      postUpdateIntervals: raw.postViewBoxIntervals,
      viewBoxMutations: raw.viewBoxMutations,
      fullInput: summarizeIntervals(intervals),
      postUpdate: summarizeIntervals(raw.postViewBoxIntervals),
    };
  } finally {
    await page.evaluate(() => {
      window.__TI_FRAME_COLLECTOR__?.stop();
      delete window.__TI_FRAME_COLLECTOR__;
    });
  }
}

export function poolIntervalSummaries(samples = []) {
  return summarizeIntervals(samples.flatMap(sample => sample.intervals || sample));
}
