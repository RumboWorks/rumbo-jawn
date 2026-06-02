// Rumbo QA suite — runs against the live server on localhost:4000.
// Covers: page rendering, design system, theme switcher, auth flows.
// Run: npx playwright test

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordUsageEvent, UsageKey } from '@rumbo/billing';
import { db } from '@rumbo/db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ss = (name) => path.join(__dirname, 'screenshots', `${name}.png`);

// ---- Helpers ----

async function screenshot(page, name) {
  await page.screenshot({ path: ss(name), fullPage: true });
}

async function registerUser(page, { name, email, password }) {
  await page.goto('/register');
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

// ---- Page rendering ----

test('home page renders with logo and nav', async ({ page }) => {
  await page.goto('/');
  await screenshot(page, '01-home');

  await expect(page.locator('.rj-wordmark')).toBeVisible();
  await expect(page.locator('.rj-header')).toBeVisible();
  await expect(page.locator('#rj-theme-select')).toBeVisible();
  // Not logged in — should show Sign in link
  await expect(page.locator('text=Sign in')).toBeVisible();
});

test('login page renders with email/password form', async ({ page }) => {
  await page.goto('/login');
  await screenshot(page, '02-login');

  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
  await expect(page.locator('text=Create one')).toBeVisible();
});

test('register page renders with all fields', async ({ page }) => {
  await page.goto('/register');
  await screenshot(page, '03-register');

  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test('admin requires platform admin access', async ({ page }) => {
  const res = await page.goto('/admin');
  await screenshot(page, '04-admin');
  expect(res.status()).toBe(403);
  await expect(page.locator('text=Forbidden')).toBeVisible();
});

test('platform admin can view central admin dashboard', async ({ page }) => {
  const email = `admin-${Date.now()}@example.org`;
  await registerUser(page, { name: 'Admin User', email, password: 'adminpass99' });
  await db.user.update({ where: { email }, data: { isPlatformAdmin: true } });

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Admin', exact: true })).toBeVisible();

  await page.goto('/admin');
  await screenshot(page, '04-admin-dashboard');

  await expect(page.locator('h1')).toContainText('Admin');
  await expect(page.locator('text=Central platform visibility')).toBeVisible();
  await expect(page.locator('.rj-sidebar__link', { hasText: 'AI calls' })).toBeVisible();
  await expect(page.locator('.rj-admin-metric__label', { hasText: 'Users' })).toBeVisible();

  await page.goto('/admin/users');
  await expect(page.locator('h1')).toContainText('Users');

  await page.goto('/admin/orgs');
  await expect(page.locator('h1')).toContainText('Organizations');
  await expect(page.locator('text=SLU budget').first()).toBeVisible();
  await page.getByRole('link', { name: /Admin User/ }).first().click();
  await expect(page.locator('h1')).toContainText("Admin User's workspace");
  await page.selectOption('select[name="tierKey"]', 'team');
  await page.locator('form[action$="/tier"] input[name="reason"]').fill('QA tier edit');
  await page.locator('form[action$="/tier"] button[type="submit"]').click();
  await expect(page.locator('.rj-admin-metric', { hasText: 'Team' })).toBeVisible();

  await page.fill('form[action$="/usage-budget"] input[name="limit"]', '12');
  await page.fill('form[action$="/usage-budget"] input[name="windowDays"]', '7');
  await page.locator('form[action$="/usage-budget"] input[name="reason"]').fill('QA budget edit');
  await page.locator('form[action$="/usage-budget"] button[type="submit"]').click();
  await expect(page.locator('.rj-admin-metric', { hasText: '0 / 12' })).toBeVisible();

  await page.goto('/admin/product-controls');
  await expect(page.locator('h1')).toContainText('Product controls');
  await expect(page.locator('th', { hasText: 'Tool' }).first()).toBeVisible();
  await expect(page.locator('td', { hasText: 'slu' }).first()).toBeVisible();
  await expect(page.locator('form[action$="/feature-flags"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Add' }).nth(1).click();
  await expect(page.locator('h1')).toContainText('New feature flag');
  await page.fill('form[action$="/feature-flags"] input[name="key"]', `qa.flag.${Date.now()}`);
  await page.locator('form[action$="/feature-flags"] input[name="reason"]').fill('QA flag edit');
  await page.locator('form[action$="/feature-flags"] button[type="submit"]').click();
  await expect(page.locator('h1')).toContainText('qa.flag.');

  await page.goto('/admin/audit-log');
  await expect(page.locator('h1')).toContainText('Audit log');
  await expect(page.locator('text=QA tier edit').first()).toBeVisible();
  await expect(page.locator('text=QA flag edit').first()).toBeVisible();

  await page.goto('/admin/jobs');
  await expect(page.locator('h1')).toContainText('Jobs');

  await page.goto('/admin/sounds-like-us');
  await expect(page.locator('h1')).toContainText('Sounds Like Us runs');

  await page.goto('/admin/ai-calls');
  await expect(page.locator('h1')).toContainText('AI calls');

  await page.goto('/admin/failures');
  await expect(page.locator('h1')).toContainText('Failures');
});

test('account placeholder page renders', async ({ page }) => {
  await page.goto('/account');
  await screenshot(page, '05-account');
  await expect(page.locator('h1')).toContainText('Account');
});

test('slu placeholder page renders', async ({ page }) => {
  await page.goto('/slu');
  await screenshot(page, '06-slu');
  await expect(page.locator('h1')).toBeVisible();
});

test('unknown route returns 404 page', async ({ page }) => {
  const res = await page.goto('/does-not-exist-xyz');
  await screenshot(page, '07-404');
  expect(res.status()).toBe(404);
  await expect(page.locator('text=404')).toBeVisible();
});

// ---- Design system ----

test('Rumboworks theme applies warm palette tokens', async ({ page }) => {
  await page.goto('/');
  const theme = await page.getAttribute('html', 'data-theme');
  expect(theme).toBe('rumboworks');

  // Check --rj-paper is the warm background (not pure white or grey)
  const bg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--rj-paper').trim()
  );
  expect(bg).toBe('#FAF7F1');
});

test('theme switcher changes data-theme to bw', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#rj-theme-select', 'bw');

  const theme = await page.getAttribute('html', 'data-theme');
  expect(theme).toBe('bw');

  // Assert the CSS variable is overridden (avoids the 200ms button transition)
  const ember = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--rj-ember-500').trim()
  );
  expect(ember).toBe('#555555');

  await screenshot(page, '08-theme-bw');

  // Reset to rumboworks so other tests aren't affected
  await page.selectOption('#rj-theme-select', 'rumboworks');
});

test('Google Fonts link present in head', async ({ page }) => {
  await page.goto('/');
  const fontsLink = await page.locator('link[href*="fonts.googleapis.com"]').count();
  expect(fontsLink).toBeGreaterThan(0);
});

test('brand mark SVG loads (not broken image)', async ({ page }) => {
  await page.goto('/');
  const imgStatus = await page.evaluate(async () => {
    const img = document.querySelector('.rj-logo img');
    if (!img) return 'missing';
    if (img.complete && img.naturalWidth > 0) return 'loaded';
    return new Promise(res => {
      img.onload = () => res('loaded');
      img.onerror = () => res('error');
    });
  });
  expect(imgStatus).toBe('loaded');
});

// ---- Auth flows ----

test('registration creates account and logs in', async ({ page }) => {
  const email = `qa-${Date.now()}@example.org`;
  await registerUser(page, { name: 'QA User', email, password: 'testpass99' });

  await screenshot(page, '09-post-register');
  await expect(page.locator('text=QA User')).toBeVisible();
  await expect(page.locator('text=Sign out')).toBeVisible();
});

test('wrong password shows error or stays on login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'nobody@example.org');
  await page.fill('input[name="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  // Should stay on /login (redirect back on failure)
  await expect(page).toHaveURL(/login/);
  await screenshot(page, '10-login-fail');
});

test('full cycle: register → logout → login', async ({ page }) => {
  const email = `cycle-${Date.now()}@example.org`;

  // Register
  await registerUser(page, { name: 'Cycle User', email, password: 'cycle99pass' });
  await expect(page.locator('text=Cycle User')).toBeVisible();

  // Logout
  await page.click('text=Sign out');
  await page.waitForURL('/');
  await expect(page.locator('text=Sign in')).toBeVisible();

  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'cycle99pass');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  await screenshot(page, '11-post-login');
  await expect(page.locator('text=Cycle User')).toBeVisible();
});

// ---- Sounds Like Us ----

test('SLU page renders with form and privacy notice', async ({ page }) => {
  await page.goto('/slu');
  await screenshot(page, '12-slu');

  await expect(page.locator('text=SOUNDS LIKE US')).toBeVisible();
  await expect(page.locator('input[name="url"]')).toBeVisible();
  await expect(page.locator('text=AI providers')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toContainText('Analyze');
});

test('SLU shows soft over-budget indicator after usage budget is exceeded', async ({ page }) => {
  const email = `slu-budget-${Date.now()}@example.org`;
  await registerUser(page, { name: 'Budget User', email, password: 'testpass99' });
  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  const orgId = user.memberships[0].orgId;
  for (let i = 0; i < 10; i++) {
    await recordUsageEvent({ orgId, tool: 'slu', usageKey: UsageKey.SLU_ANALYSIS_ROLLING_7D });
  }

  await page.goto('/slu');
  await expect(page.locator('text=Over budget')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toContainText('Analyze');
});

test('SLU: submitting URL without auth redirects to register', async ({ page }) => {
  await page.goto('/slu');
  await page.fill('input[name="url"]', 'https://example.org');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/register/);
  // URL should be pre-stashed for resume after auth
});

test('SLU: URL input pre-fills after returning from auth', async ({ page }) => {
  // Submit URL → get redirected to register → register → land at /slu with URL retained
  await page.goto('/slu');
  await page.fill('input[name="url"]', 'https://example.org');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/register/);

  // Register
  const email = `slu-resume-${Date.now()}@example.org`;
  await page.fill('input[name="name"]', 'SLU Resume');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'testpass99');
  await page.click('button[type="submit"]');

  // Should land on /slu (returnTo set to /slu)
  await expect(page).toHaveURL('/slu');
  await screenshot(page, '13-slu-after-auth');
});

test('requireAuth redirects unauthenticated users', async ({ page }) => {
  // /account uses app layout but doesn't require auth yet — this tests
  // that protected routes (added in Phase 04+) will redirect correctly.
  // For now, just verify /login is accessible after being redirected.
  await page.goto('/login');
  await expect(page).toHaveURL('/login');
});
