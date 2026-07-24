// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import {expect, test} from '../fixtures/app.js';

test('nation search uses catalog names and keeps region names separate', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  const search = page.locator('#search');
  const options = page.locator('#nationDropdown .searchOption');
  const taggedOption = tag => page.locator('.searchOptionTag', {hasText: new RegExp(`^${tag}$`)});
  const nationOption = tag => options
    .filter({has: taggedOption(tag)})
    .filter({hasNot: taggedOption('REGION')});
  const regionOption = options.filter({has: taggedOption('REGION')});

  await search.fill('Canada');
  await expect(nationOption('CAN').first()).toContainText('Canada');

  await search.fill('캐나다');
  await expect(nationOption('CAN').first()).toBeVisible();

  await search.fill('United States');
  await expect(nationOption('USA').first()).toBeVisible();

  await search.fill('China');
  await expect(nationOption('CHN').first()).toContainText('China');

  await search.fill('SEN');
  await expect(options.first().locator('.searchOptionTag')).toHaveText('SEG');
  await expect(nationOption('SEG').first()).toContainText('Senegal');
  await expect(nationOption('SEN')).toHaveCount(0);

  await search.fill('Senegambia');
  await expect(regionOption.filter({hasText: 'Dakar'}).first()).toContainText('SEG');
  await expect(nationOption('SEN')).toHaveCount(0);

  await search.fill('Denver');
  await expect(regionOption.filter({hasText: 'Denver'}).first()).toContainText('USA');

  await search.fill('Seoul');
  await expect(regionOption.filter({hasText: 'Seoul'}).first()).toContainText('KOR');

  await search.fill('Saudi Arabia');
  await expect(nationOption('SAU').first()).toContainText('Saudi Arabia');
  await expect(nationOption('SAU').first()).not.toContainText('formable');

  await search.fill('Guatemala');
  await expect(nationOption('GTM').first()).toContainText('Guatemala');
  await expect(regionOption.filter({hasText: 'Guatemala City'}).first()).toContainText('GTM');
  await expect(nationOption('GUA')).toHaveCount(0);

  await search.fill('Liangguang');
  await expect(nationOption('GUA').first()).toContainText('Liangguang');
  await expect(nationOption('GUA').first()).not.toContainText('Guatemala');
});

test('nation search matches claim project names to claimant nations', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  const search = page.locator('#search');
  const options = page.locator('#nationDropdown .searchOption');
  const taggedOption = tag => page.locator('.searchOptionTag', {hasText: new RegExp(`^${tag}$`)});
  const nationOption = tag => options
    .filter({has: taggedOption(tag)})
    .filter({hasNot: taggedOption('REGION')});

  await search.fill('United Turkestan');
  await expect(nationOption('TUR').first()).toBeVisible();

  await search.fill('Greater India');
  await expect(nationOption('IND').first()).toBeVisible();

  await search.fill('연합된 투르키스탄');
  await expect(nationOption('TUR').first()).toBeVisible();
});
