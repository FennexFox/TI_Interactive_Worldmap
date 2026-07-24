// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {expect, test} from '../fixtures/app.js';

test('language selector switches static and dynamic UI copy', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  await expect(page.locator('#languageSel')).toHaveValue('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Terra Invicta Claim / Unification Map');
  await expect(page.locator('#search')).toHaveAttribute('placeholder', 'Enter a nation tag, region, or project: CHN, Korea, Greater India...');
  await expect(page.locator('#claimMode option[value="project"]')).toHaveText('Selected project only');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('[data-aside-card="expansionNodes"]')).toBeVisible();
  await expect(page.locator('#reachableCandidatesPanel')).toContainText('0 candidate capitals');
  await expect(page.locator('#reachableCandidatesPanel')).toContainText('No reachable capital candidates.');
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(page.locator('#nationInfo')).toHaveText('Click a region on the map.');

  await page.locator('#search').click();
  await expect(page.locator('#nationDropdown')).toBeVisible();
  await expect(page.locator('#nationDropdown .searchOption').first()).toBeVisible();

  await page.selectOption('#languageSel', 'ko');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('h1')).toHaveText('Terra Invicta 영유권 / 통합 지도');
  await expect(page.locator('#search')).toHaveAttribute('placeholder', '국가 태그, 지역명, 프로젝트명 입력: CHN, Korea, Greater India...');
  await expect(page.locator('#claimMode option[value="project"]')).toHaveText('선택한 프로젝트만');
  await expect(page.locator('#claimPill')).toHaveText('영유권: -');
  await expect(page.locator('#reachableCandidatesPanel')).toContainText('후보 수도 0개');
  await expect(page.locator('#reachableCandidatesPanel')).toContainText('도달 가능한 수도 후보가 없습니다.');
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('고정된 확장 노드가 없습니다.');
  await expect(page.locator('#nationInfo')).toHaveText('지도에서 지역을 클릭하세요.');

  await page.selectOption('#languageSel', 'en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#claimPill')).toHaveText('Claims: -');
  await expect(page.locator('#reachableCandidatesPanel')).toContainText('No reachable capital candidates.');
  await expect(page.locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(page.locator('#nationInfo')).toHaveText('Click a region on the map.');
});

test('sidebar falls back when persisted settings have unexpected JSON types', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('ti-map-language', 'en');
    localStorage.setItem('ti-map-aside-card-collapsed', JSON.stringify(42));
    localStorage.setItem('ti-map-nation-info-sections', JSON.stringify(null));
  });

  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  const cards = page.locator('#asideCardList .sideCard');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toHaveAttribute('data-aside-card', 'explore');
  await expect(cards.nth(1)).toHaveAttribute('data-aside-card', 'expansionNodes');
  await expect(cards.nth(2)).toHaveAttribute('data-aside-card', 'selected');
  await expect(cards.nth(0).locator('.sideCardBody')).toBeVisible();
  await expect(cards.nth(1).locator('.sideCardBody')).toBeVisible();
  await expect(cards.nth(1).locator('#pinnedRegionsPanel')).toContainText('No pinned expansion nodes.');
  await expect(cards.nth(2).locator('.sideCardBody')).toBeVisible();
  await expect(cards.nth(2).locator('#nationInfo')).toContainText('Click a region on the map.');
});
