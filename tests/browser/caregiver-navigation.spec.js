import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ json: [] }));
});

test('caregiver overview and guidance are distinct, with working legacy links', async ({ page }) => {
  await page.goto('/caregiver-support');
  const cards = page.locator('.caregiver-pathways-pair .caregiver-pathway-card');
  await expect(cards).toHaveCount(6);
  await expect(page.locator('.caregiver-guidance-menu')).toHaveCount(0);
  const guidance = cards.first();
  await expect(guidance).toHaveAttribute('href', '/caregiver-support/guidance');
  await guidance.click();
  await expect(page).toHaveURL('/caregiver-support/guidance');
  await expect(page.locator('.caregiver-guidance-option')).toHaveCount(5);
  await expect(cards).toHaveCount(0);
  await page.locator('.caregiver-back-link').click();
  await expect(page).toHaveURL('/caregiver-support');
  await page.goto('/caregiver-support#guidance');
  await expect(page).toHaveURL('/caregiver-support/guidance');
  await page.goto('/caregiver-support?topic=activities');
  await expect(page).toHaveURL('/caregiver-support/guidance?topic=activities');
  await expect(page.locator('.caregiver-guidance-option[aria-pressed="true"]')).toContainText('Activities');
});

test('training cards share a resting style and are links with a purple interaction state', async ({ page }) => {
  await page.goto('/caregiver-support/training');
  const cards = page.locator('a.caregiver-learning-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(cards.last()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await cards.first().hover();
  await expect(cards.first()).toHaveCSS('background-color', 'rgb(69, 32, 109)');
  await expect(cards.first().locator('h3')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await cards.first().click();
  await expect(page).toHaveURL('/learn-events/online-education');
});

test('About contents navigation stays below the header and highlights the visible section', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.goto('/about');
  const mission = page.locator('.about-toc a[href="#mission"]');
  await mission.click();
  await expect(mission).toHaveAttribute('aria-current', 'location');
  await expect.poll(async () => page.evaluate(() => {
    const header = document.querySelector('.site-header').getBoundingClientRect();
    const toc = document.querySelector('.about-toc').getBoundingClientRect();
    return toc.top >= header.bottom;
  })).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.about-toc')).toHaveCSS('position', 'static');
});
