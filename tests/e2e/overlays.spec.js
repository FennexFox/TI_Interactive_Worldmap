// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {
  chooseNation,
  clearMap,
  clickRegion,
  expect,
  groupedClaimRegionCount,
  test,
} from '../fixtures/app.js';

test('reachable capitals omit nations fully included in the selected regions claims', async ({page}) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await clickRegion(page, 'Paris');
  await expect(page.locator('#search')).toHaveValue(/France/);

  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="EastGermany"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Poland"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Kiev"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="BasqueCountry"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Katowice"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Milan"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="EastGermany"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Poland"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Kiev"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="BasqueCountry"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Katowice"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Milan"]')).toHaveCount(0);

  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Moskva"]')).toHaveCount(1);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Moskva"]')).toHaveCount(1);

  await clickRegion(page, 'Moskva');
  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region="Moskva"]')).toHaveCount(1);
  await expect(page.locator('#manualEnvelopeOverlays .manual-envelope-region-outline[data-region="Irkutsk"][data-envelope-depth="1"][data-envelope-claimant="RUS"]')).toHaveCount(1);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Portugal"]')).toHaveCount(0);
  await expect(page.locator('#reachableCandidatesPanel [data-candidate-row="Irkutsk"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Portugal"]')).toHaveCount(0);
  await expect(page.locator('#reachableCapitalCandidates .reachable-capital-candidate[data-candidate-region="Irkutsk"]')).toHaveCount(0);
});

test('claim cards synchronize map overlays, panel state, and empty map clear', async ({page}) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await chooseNation(page, 'Brazil', 'BRA');
  await clickRegion(page, 'Amazonia');
  await expect(page.locator('#selectionOutlines .selection-label[data-region="Amazonia"]')).toHaveText('Manaus');
  await expect(page.locator('.claimListItem[data-claim-kind="incoming"]')).toHaveCount(3);

  await page.locator('.claimListItem[data-claim-kind="outgoing"]').first().click();
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#projectSel')).toHaveValue('Project_GranColombia');
  await expect(page.locator('#claimPill')).toHaveText('Brazil: territory 9, claims 5, research tiers 1');
  await expect(page.locator('.claimListItem.active[data-claim-kind="outgoing"]')).toHaveCount(1);
  await expect(page.locator('.legendRegionItem[data-region-name="FrenchGuiana"]').first()).toBeVisible();

  await page.locator('.claimListItem[data-claim-kind="incoming"]').first().click();
  await expect(page.locator('#search')).toHaveValue(/Bolivia/);
  await expect(page.locator('#claimMode')).toHaveValue('project');
  await expect(page.locator('#projectSel')).toHaveValue('Project_SouthAmericanUnion');
  await expect(page.locator('#claimPill')).toHaveText('Bolivia: territory 1, claims 25, research tiers 1');
  expect(await groupedClaimRegionCount(page)).toBe(26);
  await expect(page.locator('.claimListItem.active[data-claim-kind="outgoing"]')).toHaveCount(1);

  await expect(page.locator('#pinnedRegionsPanel [data-pinned-region]')).toHaveCount(1);
  await clearMap(page);
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(page.locator('#search')).toHaveValue('');
  await expect(page.locator('#claimMode')).toHaveValue('all');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#claimOverlays .claim-overlay')).toHaveCount(0);
  await expect(page.locator('#selectionOutlines > *')).toHaveCount(0);
});

test('claim cards show localized project flavor text from catalog metadata', async ({page}) => {
  await page.goto('/?worldWrap=0');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await chooseNation(page, 'Brazil', 'BRA');
  const stewardCard = page.locator('.claimListItem[data-claim-kind="outgoing"][data-claim-key="Project_StewardoftheSouth"]');
  const projectQuote = stewardCard.locator('.claimCardTitleField--project .claimCardQuote');
  await expect(projectQuote).toHaveText(
    'An expansionist Brazil anoints itself as leader of an unwilling continent.',
  );

  await page.selectOption('#languageSel', 'ko');
  await expect(projectQuote).toHaveText(
    '팽창주의 국가인 브라질이 의지 없는 대륙의 지도자를 자처합니다.',
  );
});
