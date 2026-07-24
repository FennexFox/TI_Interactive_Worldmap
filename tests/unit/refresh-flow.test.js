// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {runRefreshSteps} from '../../src/runtime/refresh-flow.js';

test('runRefreshSteps executes each named action once in order', () => {
  const calls = [];

  runRefreshSteps(['prepare', 'render', 'settle'], {
    prepare: () => calls.push('prepare'),
    render: () => calls.push('render'),
    settle: () => calls.push('settle'),
  });

  assert.deepEqual(calls, ['prepare', 'render', 'settle']);
});

test('runRefreshSteps rejects an incomplete action registry', () => {
  assert.throws(
    () => runRefreshSteps(['prepare', 'render'], {prepare() {}}),
    /Missing refresh action: render/,
  );
});
