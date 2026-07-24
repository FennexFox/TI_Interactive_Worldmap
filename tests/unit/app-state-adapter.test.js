// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  changedRegionIds,
  createAppStateAdapter,
} from '../../src/runtime/app-state-adapter.js';

test('state adapter preserves selected Set identity and changed-region semantics', () => {
  const notifications = [];
  const adapter = createAppStateAdapter({
    activeScenarioId: '2022',
    onSelectedRegionsChanged: (changed, selected) => {
      notifications.push({changed: [...changed], selected: [...selected]});
    },
  });
  const selectedIdentity = adapter.selectedRegionIds;

  assert.deepEqual(adapter.setSelectedRegionIds(['Alpha', 'Beta', 'Alpha']), ['Alpha', 'Beta']);
  assert.equal(adapter.state.selectedRegionIds, selectedIdentity);
  assert.deepEqual([...adapter.selectedRegionIds], ['Alpha', 'Beta']);

  assert.deepEqual(adapter.setSelectedRegionIds(['Beta', 'Gamma']), ['Alpha', 'Beta', 'Gamma']);
  assert.equal(adapter.state.selectedRegionIds, selectedIdentity);
  assert.deepEqual(notifications, [
    {changed: ['Alpha', 'Beta'], selected: ['Alpha', 'Beta']},
    {changed: ['Alpha', 'Beta', 'Gamma'], selected: ['Beta', 'Gamma']},
  ]);
  assert.deepEqual(changedRegionIds(['Alpha', '', 'Beta'], ['Beta', 'Gamma']), ['Alpha', 'Beta', 'Gamma']);
});

test('state adapter preserves pin notifications and claimant override behavior', () => {
  const notifications = [];
  const adapter = createAppStateAdapter({
    onPinnedRegionsChanged: (changed, pinned) => {
      notifications.push({changed: [...changed], pinned: [...pinned]});
    },
  });
  const pinnedIdentity = adapter.getPinnedRegionIds();

  assert.equal(adapter.pinRegionState('Alpha', {capitalClaimant: 'AAA'}), undefined);
  assert.equal(adapter.getPinnedCapitalClaimant('Alpha'), 'AAA');
  assert.equal(adapter.pinRegionState('Alpha', {capitalClaimant: 'AAA'}), undefined);
  adapter.pinRegionState('Alpha', {capitalClaimantId: 'BBB'});
  adapter.setPinnedRegionIds(['Beta', 'Gamma']);
  adapter.unpinPinnedRegionState('Beta');
  adapter.clearPinnedRegionState();

  assert.equal(adapter.getPinnedRegionIds(), pinnedIdentity);
  assert.deepEqual(notifications, [
    {changed: ['Alpha'], pinned: ['Alpha']},
    {changed: ['Alpha'], pinned: ['Alpha']},
    {changed: ['Alpha', 'Beta', 'Gamma'], pinned: ['Beta', 'Gamma']},
    {changed: ['Beta'], pinned: ['Gamma']},
    {changed: ['Gamma'], pinned: []},
  ]);
});

test('state adapter exposes semantic transitions and getters without UI dependencies', () => {
  const reachable = [];
  const adapter = createAppStateAdapter({
    activeScenarioId: '2022',
    onReachableCapitalCandidatesChanged: visible => reachable.push(visible),
  });

  assert.equal(adapter.activateScenario('2026'), adapter.state);
  adapter.setActiveNationState('AAA');
  adapter.setHoverNationState('BBB');
  adapter.setSecondaryHoverNationState('CCC');
  adapter.setLockedNationState('AAA');
  adapter.setHoveredRegionState('Alpha', 'AAA');
  adapter.setFocusedRegionState('Alpha');
  adapter.setProjectFilterState('Project_Test');
  adapter.setActiveIncomingClaimKeyState('incoming:BBB');

  assert.equal(adapter.getActiveScenarioId(), '2026');
  assert.equal(adapter.getActiveNation(), 'AAA');
  assert.equal(adapter.getHoverNation(), 'AAA');
  assert.equal(adapter.getSecondaryHoverNation(), '');
  assert.equal(adapter.getLockedNation(), 'AAA');
  assert.equal(adapter.getHoveredRegionName(), 'Alpha');
  assert.equal(adapter.getFocusedRegionName(), 'Alpha');
  assert.equal(adapter.getProjectFilter(), 'Project_Test');
  assert.equal(adapter.getActiveIncomingClaimKey(), 'incoming:BBB');

  adapter.setReachableCapitalCandidatesVisibleState(false);
  adapter.toggleReachableCapitalCandidatesState();
  assert.deepEqual(reachable, [false, true]);

  assert.equal(adapter.clearTransientClaim(), adapter.state);
  assert.equal(adapter.getProjectFilter(), '');
  assert.equal(adapter.getActiveIncomingClaimKey(), '');
  assert.equal(adapter.clearSelection(), adapter.state);
  assert.equal(adapter.getActiveNation(), '');
  assert.equal(adapter.getLockedNation(), '');
});

test('scenario reconciliation keeps Set identity and reports the reconciled snapshot', () => {
  const reconciliations = [];
  const adapter = createAppStateAdapter({
    activeScenarioId: '2022',
    onScenarioReconciled: snapshot => reconciliations.push(snapshot),
  });
  const selectedIdentity = adapter.selectedRegionIds;
  const pinnedIdentity = adapter.getPinnedRegionIds();

  adapter.setSelectedRegionIds(['Keep', 'Drop']);
  adapter.setPinnedRegionIds(['Keep', 'Drop']);
  adapter.pinRegionState('Keep', {capitalClaimant: 'AAA'});
  adapter.pinRegionState('Drop', {capitalClaimant: 'ZZZ'});
  adapter.setFocusedRegionState('Drop');
  adapter.setLockedNationState('ZZZ');
  adapter.setHoveredRegionState('Drop', 'ZZZ');
  adapter.setProjectFilterState('Project_Drop');
  adapter.setActiveIncomingClaimKeyState('incoming:drop');

  assert.equal(adapter.reconcileScenario({
    regionIds: ['Keep'],
    nationIds: ['AAA'],
    projectIds: ['Project_Keep'],
    incomingClaimKeys: ['incoming:keep'],
  }), adapter.state);

  assert.equal(adapter.selectedRegionIds, selectedIdentity);
  assert.equal(adapter.getPinnedRegionIds(), pinnedIdentity);
  assert.deepEqual([...adapter.selectedRegionIds], ['Keep']);
  assert.deepEqual([...adapter.getPinnedRegionIds()], ['Keep']);
  assert.equal(adapter.getPinnedCapitalClaimant('Keep'), 'AAA');
  assert.equal(adapter.getFocusedRegionName(), '');
  assert.equal(adapter.getLockedNation(), '');
  assert.equal(adapter.getHoveredRegionName(), '');
  assert.equal(adapter.getHoverNation(), '');
  assert.equal(adapter.getProjectFilter(), '');
  assert.equal(adapter.getActiveIncomingClaimKey(), '');
  assert.equal(reconciliations.length, 1);
  assert.equal(reconciliations[0].state, adapter.state);
  assert.equal(reconciliations[0].selectedRegionIds, selectedIdentity);
  assert.equal(reconciliations[0].pinnedRegionIds, pinnedIdentity);
});
