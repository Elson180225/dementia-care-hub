import { expect, test } from '@playwright/test';

const event = {
  id: '0feb5c61-5b68-4b07-8307-e02b5cc3ed24',
  title: 'Family Memory Workshop',
  city: 'Kuching',
  venue: 'Community Hall',
  mode: 'Physical',
  type: 'Workshop',
  starts_at: '2030-12-01T09:00:00+08:00',
  status: 'published',
};
const eventPath = `/learn-events/event/${event.id}`;
const reviewedResource = {
  id: 'reviewed', title: 'Memory Care Handbook', description: 'Practical family guidance.',
  language: 'English', last_reviewed_at: '2026-11-20T20:00:00Z',
};
const unreviewedResource = { id: 'unreviewed', title: 'Family Support Notes' };
const organisation = {
  id: 'directory-result', name: 'Bintulu Family Support Centre', city: 'Bintulu',
  category: 'services', services: ['Respite Care'],
};

test.beforeEach(async ({ page }) => {
  const responses = {
    '/api/activities': [event],
    '/api/public/organisations': [organisation],
    '/api/public/learning_resources': [reviewedResource, unreviewedResource],
    '/api/public/event-registration': { configured: false },
    '/api/public/learn-events-content': {},
  };
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: responses[path] ?? [] });
  });
});

async function openSearch(page) {
  await page.getByRole('button', { name: 'Search', exact: true }).press('Enter');
  const search = page.getByRole('dialog', { name: 'Search website' });
  return search.getByRole('searchbox');
}

test('search handles prefixes and synonyms and restores focus on Escape', async ({ page }) => {
  await page.goto('/understand-dementia');
  const input = await openSearch(page);
  await expect(input).toBeFocused();
  await input.fill('HEALTH hosp');
  const healthcare = page.getByRole('link', { name: /Healthcare Resources/ });
  await expect(healthcare).toHaveAttribute('href', '/find-help/assessment-healthcare');
  await input.fill('support carer');
  await expect(page.getByRole('link', { name: /Caregiver Wellbeing/ })).toBeVisible();
  await input.fill('caregiver xyzunknown');
  await expect(page.getByRole('heading', { name: /no results/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(input).toBeHidden();
  await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeFocused();
});

test('search opens a published event with shareable metadata', async ({ page, baseURL }) => {
  await page.goto('/understand-dementia');
  const input = await openSearch(page);
  await input.fill('Kuching worksh');
  await page.getByRole('link', { name: /Family Memory Workshop/ }).click();
  await expect(page).toHaveURL(eventPath);
  await expect(page.getByRole('heading', { name: event.title, level: 1 })).toBeVisible();
  const share = page.getByRole('link', { name: 'Share on WhatsApp' });
  const href = new URL(await share.getAttribute('href'));
  expect(href.origin).toBe('https://wa.me');
  expect(href.searchParams.get('text')).toBe(`${event.title}\n${baseURL}${eventPath}`);
  await page.reload();
  await expect(page).toHaveTitle(`${event.title} | RCBC Hope Care`);
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema).toMatchObject({
    '@type': 'Event', name: event.title, url: `${baseURL}${eventPath}`,
    startDate: '2030-12-01T01:00:00.000Z', location: { name: event.venue },
  });
});

test('search opens reviewed resources and leaves missing review dates unstamped', async ({ page }) => {
  await page.goto('/understand-dementia');
  const input = await openSearch(page);
  await input.fill('memory handbook');
  await page.getByRole('link', { name: /Memory Care Handbook/ }).click();
  await expect(page).toHaveURL('/learn-events/online-education#learning-resource-reviewed');
  const reviewed = page.locator('#learning-resource-reviewed');
  await expect(reviewed.getByText('Last reviewed: 21 November 2026')).toBeVisible();
  await expect(reviewed.locator('time')).toHaveAttribute('datetime', '2026-11-20T20:00:00.000Z');
  await expect(page.locator('#learning-resource-unreviewed').getByRole('heading')).toBeVisible();
  await expect(page.locator('#learning-resource-unreviewed time')).toHaveCount(0);
});

test('search opens a published directory result', async ({ page }) => {
  await page.goto('/understand-dementia');
  const input = await openSearch(page);
  await input.fill('Bintulu respite');
  await page.getByRole('link', { name: /Bintulu Family Support Centre/ }).click();
  await expect(page).toHaveURL('/find-help/resource-finder?resource=directory-result#finder-results');
  await expect(page.locator('#finder-results').getByRole('heading', { name: organisation.name })).toBeVisible();
});

test('Contact uses six categories, counts the message and retains details after a failed send', async ({ page }) => {
  await page.route('**/api/public/contact-settings', route => route.fulfill({ json: {
    projectEmail: 'project@example.test', organiserFacebook: 'https://www.facebook.com/example', whatsappCommunity: 'https://chat.whatsapp.com/example',
  } }));
  await page.route('**/api/enquiries', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/about/contact');
  const type = page.getByRole('combobox', { name: /what is your enquiry about/i });
  await expect(type.locator('option')).toHaveCount(7);
  await expect(page.getByRole('link', { name: /project email/i })).toHaveAttribute('href', 'mailto:project@example.test');
  await expect(page.getByRole('link', { name: /join our whatsapp community/i })).toHaveAttribute('href', 'https://chat.whatsapp.com/example');
  await page.getByLabel(/your name/i).fill('Example visitor');
  await page.getByLabel(/your email address/i).fill('visitor@example.test');
  await type.selectOption('Education & Training');
  const message = page.locator('#contact-message');
  await message.fill('文'.repeat(2001));
  await expect(message).toHaveValue('文'.repeat(2000));
  await expect(page.getByText('2,000 / 2,000')).toBeVisible();
  await page.getByRole('button', { name: 'Send Message', exact: false }).click();
  await expect(page.getByText(/could not be sent/)).toBeVisible();
  await expect(message).toHaveValue('文'.repeat(2000));
});

test('Get Updated submits country and consent and shows the confirmation', async ({ page }) => {
  await page.route('**/api/public/subscribe', route => {
    expect(route.request().postDataJSON()).toMatchObject({
      country: 'Malaysia', state: 'Sarawak', city: 'Miri', consent: true,
    });
    expect(route.request().postDataJSON()).not.toHaveProperty('language');
    return route.fulfill({ json: { status: 'subscribed', unsubscribeLink: '/get-updated?unsubscribe=example' } });
  });
  await page.goto('/get-updated');
  await page.getByRole('textbox', { name: /^name/i }).fill('Example visitor');
  await page.getByRole('textbox', { name: /^email/i }).fill('visitor@example.test');
  await page.getByRole('textbox', { name: /^country/i }).fill('Malaysia');
  await page.getByRole('textbox', { name: /^state \/ province \/ region/i }).fill('Sarawak');
  await page.getByRole('textbox', { name: /^city \/ town/i }).fill('Miri');
  await expect(page.getByLabel(/preferred language/i)).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Privacy Policy', exact: true }).first()).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(page.getByText(/you are now subscribed/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to Home' })).toBeVisible();
});

test('Support Groups and Resource Finder display the same published group and contact details', async ({ page }) => {
  const group = {
    id: 'support-group-listing', name: 'Miri Caregiver Circle', category: 'support-group',
    group_type: 'Community-led', service_type: 'Caregiver meetings', city: 'Miri',
    address: '12 Community Road', phone: '085123456', email: 'group@example.test',
  };
  await page.route('**/api/public/organisations*', route => route.fulfill({ json: [group] }));
  await page.goto('/caregiver-support/support-groups');
  await page.getByRole('combobox', { name: 'Group type' }).selectOption('Community-led');
  await expect(page.getByRole('heading', { name: group.name })).toBeVisible();
  await expect(page.getByRole('link', { name: group.email })).toHaveAttribute('href', `mailto:${group.email}`);
  await page.goto('/find-help/resource-finder?category=healthcare');
  await page.getByRole('combobox', { name: 'Type of support' }).selectOption(group.service_type);
  await expect(page.getByRole('heading', { name: group.name })).toBeVisible();
  await expect(page.getByRole('link', { name: group.phone })).toHaveAttribute('href', `tel:${group.phone}`);
});

test('public page share includes the clean URL and excludes subscription links', async ({ page, baseURL }) => {
  await page.goto('/understand-dementia?tracking=example#early-signs');
  const share = page.getByRole('link', { name: 'Share on WhatsApp' });
  const href = new URL(await share.getAttribute('href'));
  expect(href.searchParams.get('text')).toBe(`Dementia Care Connect\n${baseURL}/understand-dementia#early-signs`);
  await page.goto('/get-updated?unsubscribe=example');
  await expect(share).toHaveCount(0);
});
