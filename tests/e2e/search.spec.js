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

test('search input and keyboard navigation reuse dropdown options without changing contracts', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('#regions .region').first()).toBeVisible({timeout: 10000});

  const search = page.locator('#search');
  const dropdown = page.locator('#nationDropdown');
  const options = dropdown.locator('.searchOption[data-index]');
  await search.focus();
  await expect(dropdown).toBeVisible();
  await dropdown.evaluate(element => {
    element.searchChildListChanges = 0;
    element.searchMutationObserver = new window.MutationObserver(records => {
      element.searchChildListChanges += records.filter(record => record.type === 'childList').length;
    });
    element.searchMutationObserver.observe(element, {childList: true});
  });

  await search.fill('Canada');
  await expect(options.first().locator('.searchOptionTag')).toHaveText('CAN');
  await expect.poll(() => dropdown.evaluate(element => element.searchChildListChanges)).toBe(1);
  await expect(options.first()).toHaveClass(/\bactive\b/);
  await dropdown.evaluate(element => {
    element.searchFirstOption = element.querySelector('.searchOption[data-index="0"]');
  });

  await search.press('ArrowDown');
  await expect(options.nth(1)).toHaveClass(/\bactive\b/);
  await search.press('ArrowUp');
  await expect(options.first()).toHaveClass(/\bactive\b/);
  expect(await dropdown.evaluate(element => (
    element.searchFirstOption === element.querySelector('.searchOption[data-index="0"]')
  ))).toBe(true);
  expect(await dropdown.evaluate(element => element.searchChildListChanges)).toBe(1);

  await search.press('Enter');
  await expect(search).toHaveAttribute('data-selected-nation', 'CAN');
  await search.fill('Mexico');
  await expect(search).toHaveAttribute('data-selected-nation', '');

  await search.fill('zzzz-not-a-country');
  await expect(dropdown.locator('.searchOption.empty')).toBeVisible();
  await search.press('Escape');
  await expect(search).toHaveAttribute('aria-expanded', 'false');
  await expect(dropdown).toBeHidden();
  await dropdown.evaluate(element => element.searchMutationObserver.disconnect());
});
