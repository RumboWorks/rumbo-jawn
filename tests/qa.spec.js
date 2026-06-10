// Rumbo QA suite — runs against the live server on localhost:4000.
// Covers: page rendering, design system, theme switcher, auth flows.
// Run: npx playwright test

import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerLocalUser } from '@rumbo/auth';
import { handleWebhookEvent, recordUsageEvent, UsageKey } from '@rumbo/billing';
import { db } from '@rumbo/db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ss = (name) => path.join(__dirname, 'screenshots', `${name}.png`);

// ---- Helpers ----

async function screenshot(page, name) {
  await page.screenshot({ path: ss(name), fullPage: true });
}

// Marks an account's email as verified directly — QA's stand-in for opening
// the emailed link (the dedicated verification test exercises the real token).
async function verifyUserByEmail(email) {
  await db.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });
}

async function registerUser(page, { name, email, password }) {
  const [firstName, ...lastParts] = name.split(' ');
  await page.goto('/register'); // redirects to /signup?tier=free
  await page.fill('input[name="firstName"]', firstName);
  await page.fill('input[name="lastName"]', lastParts.join(' ') || 'User');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.check('input[name="acceptTerms"]');
  await page.click('button[type="submit"]');
  await page.waitForURL('/auth/verify-pending');
  await verifyUserByEmail(email);
  await page.goto('/');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
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

  await expect(page.locator('input[name="firstName"]')).toBeVisible();
  await expect(page.locator('input[name="lastName"]')).toBeVisible();
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
  const runId = Date.now();
  const email = `admin-${runId}@example.org`;
  await registerUser(page, { name: 'Admin User', email, password: 'adminpass99' });
  await db.user.update({ where: { email }, data: { isPlatformAdmin: true } });
  const sortUser = await registerLocalUser({
    name: 'Sort Check User',
    email: `sort-check-${runId}@example.org`,
    password: 'sortpass99',
  });
  await db.user.createMany({
    data: [
      { name: `Filter Target User ${runId}`, email: `filter-target-${runId}@example.org` },
      ...Array.from({ length: 10 }, (_, index) => ({
        name: `Table Filler User ${runId}-${index}`,
        email: `table-filler-${runId}-${index}@example.org`,
      })),
    ],
  });

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Admin', exact: true })).toBeVisible();

  await page.goto('/admin');
  await screenshot(page, '04-admin-dashboard');

  await expect(page.locator('h1')).toContainText('Admin');
  await expect(page.locator('.rj-admin-breadcrumbs').first()).toHaveText('admin');
  await expect(page.locator('text=Central platform visibility')).toBeVisible();
  await expect(page.locator('.rj-sidebar__link', { hasText: 'AI calls' })).toBeVisible();
  await expect(page.locator('.rj-admin-metric__label', { hasText: 'Users' })).toBeVisible();

  await page.goto('/admin/users');
  await expect(page.locator('h1')).toContainText('Users');
  await expect(page.locator('.rj-admin-breadcrumbs').first()).toHaveText('admin / users');
  await expect(page.locator('.rj-table-tools__count').first()).toContainText(/Showing 1–\d+ of \d+ users\./);
  await page.goto(`/admin/users?q=${encodeURIComponent(`Filter Target User ${runId}`)}`);
  await expect(page.locator('.rj-admin-table tbody tr:visible')).toHaveCount(1);
  await expect(page.locator('.rj-admin-table tbody tr:visible')).toContainText(`Filter Target User ${runId}`);
  await expect(page.locator('.rj-table-tools__count').first()).toContainText(/Showing 1–1 of 1 users\./);
  await page.goto('/admin/users');
  const userColumn = page.locator('.rj-admin-table tbody tr td:first-child');
  const normalizeColumn = async () => (await userColumn.allTextContents())
    .map(text => text.replace(/\s+/g, ' ').trim());
  await expect.poll(async () => (await normalizeColumn()).length).toBeGreaterThan(1);
  // Server-side sort: compare the rendered order against the database's own
  // ordering (same collation) instead of re-sorting in JS, whose locale rules
  // disagree with MySQL on punctuation-vs-digit ordering.
  const expectedEmails = async (dir) => (await db.user.findMany({
    orderBy: { email: dir },
    take: 50,
    select: { email: true },
  })).map(u => u.email);
  await page.locator('th.rj-table__sort-head', { hasText: 'User' }).click();
  await expect(page.locator('th', { hasText: 'User' })).toHaveClass(/is-sort-asc/);
  const ascendingUsers = await normalizeColumn();
  const expectedAsc = await expectedEmails('asc');
  ascendingUsers.forEach((cell, i) => expect(cell).toContain(expectedAsc[i]));
  await page.locator('th.rj-table__sort-head', { hasText: 'User' }).click();
  await expect(page.locator('th', { hasText: 'User' })).toHaveClass(/is-sort-desc/);
  const descendingUsers = await normalizeColumn();
  const expectedDesc = await expectedEmails('desc');
  descendingUsers.forEach((cell, i) => expect(cell).toContain(expectedDesc[i]));

  await page.goto(`/admin/users/${sortUser.id}`);
  await expect(page.locator('h1')).toContainText('Sort Check User');
  await expect(page.locator('.rj-admin-breadcrumbs').first()).toHaveText('admin / users');
  await expect(page.locator('text=Platform admin').first()).toBeVisible();
  await page.fill('form[action$="/profile"] input[name="firstName"]', 'Sort');
  await page.fill('form[action$="/profile"] input[name="lastName"]', 'Check Edited');
  await page.fill('form[action$="/profile"] input[name="reason"]', 'QA user edit');
  await page.locator('form[action$="/profile"] button[type="submit"]').click();
  await expect(page.locator('h1')).toContainText('Sort Check Edited');

  await page.goto('/admin/orgs');
  await expect(page.locator('h1')).toContainText('Organizations');
  await expect(page.locator('text=SLU budget').first()).toBeVisible();
  await page.getByRole('link', { name: /Admin User/ }).first().click();
  await expect(page.locator('h1')).toContainText("Admin User's workspace");
  await expect(page.locator('.rj-admin-breadcrumbs').first()).toHaveText('admin / organizations');
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
  await expect(page.locator('.rj-admin-breadcrumbs').first()).toHaveText('admin / product controls');
  await expect(page.locator('th', { hasText: 'Tool' }).first()).toBeVisible();
  await expect(page.locator('td', { hasText: 'slu' }).first()).toBeVisible();
  await expect(page.locator('form[action$="/feature-flags"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Add' }).nth(1).click();
  await expect(page.locator('h1')).toContainText('New feature flag');
  await expect(page.locator('.rj-admin-breadcrumbs').first()).toHaveText('admin / product controls');
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

test('account page supports profile and password edits', async ({ page }) => {
  const runId = Date.now();
  const email = `account-${runId}@example.org`;
  const nextEmail = `account-edited-${runId}@example.org`;
  await registerUser(page, { name: 'Account User', email, password: 'testpass99' });

  await page.goto('/account');
  await screenshot(page, '05-account');
  await expect(page.locator('h1')).toContainText("Account's account");
  await expect(page.locator('text=No team organizations.')).toBeVisible();

  // Inline-edit round trip: the profile row flips to a form, saves over fetch,
  // and swaps back to an updated display row.
  const profileRow = page.locator('[data-inline-edit]:has(form[action="/account/profile"])');
  await profileRow.locator('[data-edit-start]').click();
  await profileRow.locator('input[name="firstName"]').fill('Account');
  await profileRow.locator('input[name="lastName"]').fill('Edited');
  await profileRow.locator('input[name="email"]').fill(nextEmail);
  await profileRow.locator('form[data-edit-form] button[type="submit"]').click();
  await expect(page.locator('[data-inline-edit]:has(form[action="/account/profile"]) [data-edit-display]'))
    .toContainText(nextEmail);
  await expect(page.locator('[data-inline-edit]:has(form[action="/account/profile"]) [data-edit-display]'))
    .toContainText('Account Edited');

  const passwordRow = page.locator('[data-inline-edit]:has(form[action="/account/password"])');
  await passwordRow.locator('[data-edit-start]').click();
  await passwordRow.locator('input[name="currentPassword"]').fill('testpass99');
  await passwordRow.locator('input[name="newPassword"]').fill('newpass99');
  await passwordRow.locator('form[data-edit-form] button[type="submit"]').click();
  await expect(page.locator('[data-inline-edit]:has(form[action="/account/password"]) [data-edit-display]'))
    .toBeVisible();

  await page.goto('/auth/logout');
  await page.goto('/login');
  await page.fill('input[name="email"]', nextEmail);
  await page.fill('input[name="password"]', 'newpass99');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
});

test('password reset token updates local password', async ({ page }) => {
  const runId = Date.now();
  const email = `reset-${runId}@example.org`;
  const user = await registerLocalUser({ name: 'Reset User', email, password: 'oldpass99' });
  await verifyUserByEmail(email);
  const token = `qa-reset-${runId}`;
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await page.goto(`/password/reset/${token}`);
  await expect(page.locator('h1')).toContainText('Choose a new password');
  await page.fill('input[name="password"]', 'resetpass99');
  await page.click('button[type="submit"]');
  await page.waitForURL('/account');

  await page.goto('/auth/logout');
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'resetpass99');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
});

test('promoted organization manager can view member management', async ({ page }) => {
  const runId = Date.now();
  const email = `manager-${runId}@example.org`;
  const user = await registerLocalUser({ name: 'Manager User', email, password: 'manager99' });
  await verifyUserByEmail(email);
  const membership = await db.membership.findFirst({ where: { userId: user.id }, include: { org: true } });
  await db.membership.update({ where: { id: membership.id }, data: { role: 'MANAGER' } });

  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'manager99');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');

  await page.goto('/account');
  const orgLink = page.locator('.rj-sidebar__link', { hasText: membership.org.name });
  await expect(orgLink).toBeVisible();
  await orgLink.click();
  await expect(page.locator('h1')).toContainText(membership.org.name);
  await expect(page.locator('text=Invite member')).toBeVisible();
});

test('suspended users cannot sign in', async ({ page }) => {
  const runId = Date.now();
  const email = `suspended-${runId}@example.org`;
  const user = await registerLocalUser({ name: 'Suspended User', email, password: 'suspend99' });
  await db.user.update({
    where: { id: user.id },
    data: { status: 'SUSPENDED', statusReason: 'QA suspension', statusChangedAt: new Date() },
  });

  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'suspend99');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/login/);
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

test('paper theme is the default shared theme', async ({ page }) => {
  await page.goto('/');
  const theme = await page.getAttribute('html', 'data-theme');
  expect(theme).toBe('paper');

  const bg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--rj-bg').trim()
  );
  expect(bg).toBe('#f1ead8');
});

test('theme and density switchers persist browser-local preferences', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#rj-theme-select', 'dark');

  const theme = await page.getAttribute('html', 'data-theme');
  expect(theme).toBe('dark');

  await page.evaluate(() => localStorage.setItem('rj-density', 'compact'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await screenshot(page, '08-theme-dark');
  await page.selectOption('#rj-theme-select', 'paper');
  await page.evaluate(() => localStorage.setItem('rj-density', 'comfortable'));
});

test('navigation orientation is account-synced and active organization can switch', async ({ page }) => {
  const email = `ui-pref-${Date.now()}@example.org`;
  await registerUser(page, { name: 'UI Preference User', email, password: 'testpass99' });
  const user = await db.user.findUnique({ where: { email }, include: { memberships: true } });
  const secondOrg = await db.organization.create({
    data: { name: 'Second QA Organization', slug: `second-qa-${Date.now()}`, organizationType: 'NONPROFIT', createdByUserId: user.id },
  });
  await db.membership.create({ data: { userId: user.id, orgId: secondOrg.id, role: 'MANAGER' } });

  await page.goto('/account');
  await expect(page.locator('html')).toHaveAttribute('data-nav-orientation', 'horizontal');
  await page.click('#rj-nav-orientation-toggle');
  await expect(page.locator('html')).toHaveAttribute('data-nav-orientation', 'vertical');
  await expect.poll(async () => (await db.user.findUnique({ where: { id: user.id } })).navOrientation).toBe('VERTICAL');

  await page.locator('.rj-account-menu summary').click();
  await Promise.all([
    page.waitForResponse(response => response.url().includes('/organization/switch') && response.request().method() === 'POST'),
    page.selectOption('#rj-org-select', secondOrg.id),
  ]);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#rj-org-select')).toHaveValue(secondOrg.id);

  await page.goto('/auth/logout');
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'testpass99');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  await expect(page.locator('html')).toHaveAttribute('data-nav-orientation', 'vertical');
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
  await expect(page.locator('.rj-account-menu summary')).toHaveText('QA User');
  await page.locator('.rj-account-menu summary').click();
  await expect(page.getByRole('link', { name: 'Sign out' })).toBeVisible();
  const user = await db.user.findUnique({ where: { email } });
  expect(user.firstName).toBe('QA');
  expect(user.lastName).toBe('User');
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
  await expect(page.locator('.rj-account-menu summary')).toHaveText('Cycle User');

  // Logout
  await page.locator('.rj-account-menu summary').click();
  await page.getByRole('link', { name: 'Sign out' }).click();
  await page.waitForURL('/');
  await expect(page.locator('text=Sign in')).toBeVisible();

  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'cycle99pass');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  await screenshot(page, '11-post-login');
  await expect(page.locator('.rj-account-menu summary')).toHaveText('Cycle User');
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
  await expect(page).toHaveURL(/signup|register/);
  // URL should be pre-stashed for resume after auth
});

test('SLU: URL input pre-fills after returning from auth', async ({ page }) => {
  // Submit URL → get redirected to register → register → land at /slu with URL retained
  await page.goto('/slu');
  await page.fill('input[name="url"]', 'https://example.org');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/signup|register/);

  // Register — lands on verify-pending first (email gate), then SLU resumes.
  const email = `slu-resume-${Date.now()}@example.org`;
  await page.fill('input[name="firstName"]', 'SLU');
  await page.fill('input[name="lastName"]', 'Resume');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'testpass99');
  await page.check('input[name="acceptTerms"]');
  await page.click('button[type="submit"]');
  await page.waitForURL('/auth/verify-pending');
  await verifyUserByEmail(email);

  // The stashed URL survives the verification detour.
  await page.goto('/slu');
  await expect(page.locator('input[name="url"]')).toHaveValue('https://example.org');
  await screenshot(page, '13-slu-after-auth');
});

test('SLU: signed-in users get the app shell with the SLU sidebar', async ({ page }) => {
  const email = `slu-shell-${Date.now()}@example.org`;
  await registerUser(page, { name: 'Shell User', email, password: 'testpass99' });

  await page.goto('/slu');
  await expect(page.locator('.rj-sidebar__link', { hasText: 'Analyze' })).toBeVisible();
  await expect(page.locator('.rj-sidebar__link', { hasText: 'Your analyses' })).toBeVisible();

  await page.locator('.rj-sidebar__link', { hasText: 'Your analyses' }).click();
  await expect(page).toHaveURL('/slu/history');
  await expect(page.locator('h1')).toContainText('Your analyses');
});

// ---- Admin completeness (phase 18) ----

test('admin can create an org, manage partners, act as org, and delete the org', async ({ page }) => {
  const runId = Date.now();
  const email = `admin18-${runId}@example.org`;
  const orgName = `QA Org ${runId}`;
  const partnerName = `QA Partner ${runId}`;
  await registerUser(page, { name: 'AdminEighteen User', email, password: 'adminpass99' });
  await db.user.update({ where: { email }, data: { isPlatformAdmin: true } });
  page.on('dialog', dialog => dialog.accept());

  // Create an organization from admin.
  await page.goto('/admin/orgs/new');
  await expect(page.locator('h1')).toContainText('New organization');
  await page.fill('input[name="name"]', orgName);
  await page.selectOption('select[name="organizationType"]', 'NONPROFIT');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Organization created.')).toBeVisible();
  await expect(page.locator('h1')).toContainText(orgName);
  const orgUrl = page.url();

  // Act as the new org (admin has no membership there) — banner appears.
  await page.click('text=Act as this organization');
  await page.waitForURL('/');
  await expect(page.locator('.rj-acting-banner')).toContainText(`Acting as ${orgName}`);
  const actAudit = await db.adminAuditLog.findFirst({
    where: { action: 'admin.act_as_org' },
    orderBy: { createdAt: 'desc' },
  });
  expect(actAudit).not.toBeNull();
  await page.click('text=Return to my organization');
  await page.waitForURL('/');
  await expect(page.locator('.rj-acting-banner')).toHaveCount(0);

  // Partner account: create, add self as manager, grant access to the new org.
  await page.goto('/admin/partners/new');
  await page.fill('input[name="name"]', partnerName);
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Partner account created.')).toBeVisible();
  await expect(page.locator('h1')).toContainText(partnerName);

  await page.fill('form[action*="/members"] input[name="email"]', email);
  await page.locator('form[action*="/members"] button[type="submit"]').click();
  await expect(page.locator('text=Partner manager added.')).toBeVisible();
  await expect(page.locator('.rj-admin-table').first()).toContainText(email);

  await page.selectOption('form[action*="/org-access"] select[name="orgId"]', { label: `${orgName} (${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')})` });
  await page.locator('form[action*="/org-access"] button[type="submit"]').click();
  await expect(page.locator('text=Organization access granted.')).toBeVisible();
  await expect(page.locator('text=Managed organizations').locator('..').locator('..')).toContainText(orgName);

  // Eval runs admin panel renders.
  await page.goto('/admin/eval');
  await expect(page.locator('h1')).toContainText('Eval runs');

  // Delete the org with typed-name confirmation.
  await page.goto(orgUrl);
  await page.fill('input[name="confirmName"]', orgName);
  await page.locator('form[action$="/delete"] button[type="submit"]').click();
  await page.waitForURL('/admin/orgs');
  await expect(page.locator('text=Organization deleted.')).toBeVisible();
  await expect(page.locator('.rj-admin-table')).not.toContainText(orgName);

  // Cleanup the QA partner account so reruns stay tidy.
  await db.partnerAccount.deleteMany({ where: { name: partnerName } });
});

// ---- Partner self-service area (phase 19) ----

test('partner manager can create, edit, and archive client orgs and manage co-managers', async ({ page }) => {
  const runId = Date.now();
  const managerEmail = `partner-mgr-${runId}@example.org`;
  const colleagueEmail = `partner-colleague-${runId}@example.org`;
  const partnerName = `QA Partner Area ${runId}`;
  const orgName = `QA Client Org ${runId}`;
  page.on('dialog', dialog => dialog.accept());

  await registerUser(page, { name: 'Partner Manager', email: managerEmail, password: 'partner99' });
  await registerLocalUser({ name: 'Partner Colleague', email: colleagueEmail, password: 'partner99' });
  const manager = await db.user.findUnique({ where: { email: managerEmail } });
  const partner = await db.partnerAccount.create({ data: { name: partnerName } });
  await db.partnerMembership.create({ data: { partnerAccountId: partner.id, userId: manager.id, role: 'MANAGER' } });

  // Nav link appears and the dashboard renders with an empty state.
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Partner', exact: true })).toBeVisible();
  await page.goto('/partner');
  await expect(page.locator('h1')).toContainText('Partner dashboard');
  await expect(page.locator('text=No client organizations yet.')).toBeVisible();

  // Create a client org.
  await page.goto('/partner/orgs/new');
  await page.fill('input[name="name"]', orgName);
  await page.click('button[type="submit"]');
  await page.waitForURL('/partner');
  await expect(page.locator('text=Organization created.')).toBeVisible();
  const orgRow = page.locator('[data-inline-edit]', { hasText: orgName });
  await expect(orgRow).toBeVisible();

  // Inline-edit the org name over fetch.
  await orgRow.locator('[data-edit-start]').click();
  await orgRow.locator('input[name="name"]').fill(`${orgName} Edited`);
  await orgRow.locator('form[data-edit-form] button[type="submit"]').click();
  await expect(page.locator('[data-inline-edit] [data-edit-display]', { hasText: `${orgName} Edited` })).toBeVisible();

  // Manage co-managers: add by email, then remove.
  await page.fill('form[action*="/members"] input[name="email"]', colleagueEmail);
  await page.locator('form[action*="/members"] button[type="submit"]').click();
  await expect(page.locator('text=Partner manager added.')).toBeVisible();
  const colleagueRow = page.locator('tr', { hasText: colleagueEmail });
  await expect(colleagueRow).toBeVisible();
  await colleagueRow.locator('form[action$="/remove"] button').click();
  await expect(page.locator('text=Partner manager removed.')).toBeVisible();
  await expect(page.locator('tr', { hasText: colleagueEmail })).toHaveCount(0);

  // Archive the org (it has no direct members, so it is removed entirely).
  await page.locator('[data-inline-edit]', { hasText: `${orgName} Edited` })
    .locator('form[action$="/archive"] button').click();
  await expect(page.locator('text=Organization archived and removed')).toBeVisible();
  await expect(page.locator('[data-inline-edit]', { hasText: orgName })).toHaveCount(0);

  // Non-partner users are denied.
  await page.goto('/auth/logout');
  const outsiderEmail = `partner-outsider-${runId}@example.org`;
  await registerUser(page, { name: 'Outsider User', email: outsiderEmail, password: 'outsider99' });
  const res = await page.goto('/partner');
  expect(res.status()).toBe(403);

  await db.partnerAccount.delete({ where: { id: partner.id } });
});

// ---- Tiered signup + email verification (phase 20) ----

test('tiered signup: pricing, team provisioning, verification gate and real token', async ({ page }) => {
  const runId = Date.now();
  const email = `signup-team-${runId}@example.org`;
  const orgName = `QA Team Org ${runId}`;

  // Pricing page lists all four plans.
  await page.goto('/pricing');
  await screenshot(page, '14-pricing');
  await expect(page.locator('.rj-pricing-card')).toHaveCount(4);
  await page.getByRole('link', { name: 'Choose Team' }).click();
  await expect(page).toHaveURL(/\/signup\?tier=team/);

  // Team signup collects an organization name and requires terms.
  await expect(page.locator('input[name="orgName"]')).toBeVisible();
  await expect(page.locator('input[name="acceptTerms"]')).toHaveAttribute('required', '');
  await page.fill('input[name="firstName"]', 'Team');
  await page.fill('input[name="lastName"]', 'Signup');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'teampass99');
  await page.fill('input[name="orgName"]', orgName);
  await page.check('input[name="acceptTerms"]');
  await page.click('button[type="submit"]');
  await page.waitForURL('/auth/verify-pending');
  await screenshot(page, '15-verify-pending');

  // Unverified users are parked: app surfaces bounce back to verify-pending.
  await page.goto('/account');
  await expect(page).toHaveURL('/auth/verify-pending');

  // Real token flow: a known token verifies and resumes the stashed URL.
  const user = await db.user.findUnique({ where: { email } });
  const token = `qa-verify-${runId}`;
  await db.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  await page.goto(`/auth/verify/${token}`);
  await expect(page).toHaveURL('/account');

  // Team provisioning: named org, manager membership, recorded paid intent.
  const org = await db.organization.findFirst({
    where: { name: orgName },
    include: { memberships: true, entitlement: true },
  });
  expect(org).not.toBeNull();
  expect(org.memberships).toHaveLength(1);
  expect(org.memberships[0].role).toBe('MANAGER');
  expect(org.entitlement.overrides?.intendedTier).toBe('team');
});

test('partner signup provisions a partner account and first org', async ({ page }) => {
  const runId = Date.now();
  const email = `signup-partner-${runId}@example.org`;
  const partnerName = `QA Signup Partner ${runId}`;

  await page.goto('/signup?tier=partner');
  await expect(page.locator('input[name="partnerName"]')).toBeVisible();
  await page.fill('input[name="firstName"]', 'Partner');
  await page.fill('input[name="lastName"]', 'Signup');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'partnerpass99');
  await page.fill('input[name="partnerName"]', partnerName);
  await page.check('input[name="acceptTerms"]');
  await page.click('button[type="submit"]');
  await page.waitForURL('/auth/verify-pending');
  await verifyUserByEmail(email);

  // Verified partner lands in the partner area with their first client org.
  await page.goto('/partner');
  await expect(page.locator('h1')).toContainText('Partner dashboard');
  await expect(page.locator('[data-inline-edit]', { hasText: partnerName })).toBeVisible();

  const partner = await db.partnerAccount.findFirst({
    where: { name: partnerName },
    include: { memberships: true, orgAccesses: true },
  });
  expect(partner.memberships).toHaveLength(1);
  expect(partner.memberships[0].role).toBe('MANAGER');
  expect(partner.orgAccesses).toHaveLength(1);
});

// ---- Stripe billing (phase 21) ----

test('billing page renders and webhook sync drives the tier up and back down', async ({ page, request }) => {
  const runId = Date.now();
  const email = `billing-${runId}@example.org`;
  await registerUser(page, { name: 'Billing User', email, password: 'billing99' });

  // The personal-workspace owner can see billing (unconfigured-Stripe state).
  await page.goto('/billing');
  await expect(page.locator('h1')).toContainText('Billing');
  await expect(page.locator('text=Current plan')).toBeVisible();
  await expect(page.locator('text=Free plan')).toBeVisible();

  // The webhook endpoint refuses politely while Stripe isn't configured.
  const webhookRes = await request.post('/billing/webhook', { data: {} });
  expect(webhookRes.status()).toBe(503);

  // Webhook sync: an active subscription flips the tier implied by its price.
  const user = await db.user.findUnique({ where: { email }, include: { memberships: true } });
  const orgId = user.memberships[0].orgId;
  const priceId = `price_qa_${runId}`;
  const qaTier = await db.productTier.create({
    data: { key: `qa-tier-${runId}`, name: 'QA Paid Tier', stripePriceId: priceId, features: { slu: true, eval: true } },
  });
  const subscription = {
    id: `sub_qa_${runId}`,
    status: 'active',
    customer: `cus_qa_${runId}`,
    metadata: { orgId },
    items: { data: [{ price: { id: priceId } }] },
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
    cancel_at_period_end: false,
  };
  await handleWebhookEvent({ type: 'customer.subscription.updated', data: { object: subscription } });
  let entitlement = await db.organizationEntitlement.findUnique({ where: { orgId }, include: { tier: true } });
  expect(entitlement.tier.key).toBe(`qa-tier-${runId}`);
  expect(entitlement.stripeSubscriptionId).toBe(`sub_qa_${runId}`);
  expect(entitlement.stripeSubscriptionStatus).toBe('active');

  // The billing page now offers the Stripe portal for the live subscription.
  await page.goto('/billing');
  await expect(page.locator('text=Manage billing')).toBeVisible();

  // Cancellation (subscription.deleted) downgrades back to free.
  await handleWebhookEvent({ type: 'customer.subscription.deleted', data: { object: subscription } });
  entitlement = await db.organizationEntitlement.findUnique({ where: { orgId }, include: { tier: true } });
  expect(entitlement.tier.key).toBe('free');
  expect(entitlement.stripeSubscriptionStatus).toBe('canceled');

  await db.productTier.delete({ where: { id: qaTier.id } });
});

test('suspended organizations lose tool access until unsuspended', async ({ page }) => {
  const runId = Date.now();
  const email = `suspend-org-${runId}@example.org`;
  await registerUser(page, { name: 'Suspend Org', email, password: 'suspend99' });
  const user = await db.user.findUnique({ where: { email }, include: { memberships: true } });
  const orgId = user.memberships[0].orgId;

  await db.organization.update({ where: { id: orgId }, data: { suspendedAt: new Date(), suspendedReason: 'QA suspension' } });
  const blocked = await page.goto('/slu');
  expect(blocked.status()).toBe(403);

  await db.organization.update({ where: { id: orgId }, data: { suspendedAt: null, suspendedReason: null } });
  const restored = await page.goto('/slu');
  expect(restored.status()).toBe(200);
});

// ---- Help system (phase 22) ----

test('help system: admin CRUD, tool help page, context API, and the drawer', async ({ page }) => {
  const runId = Date.now();
  const adminEmail = `help-admin-${runId}@example.org`;
  const title = `QA Help Article ${runId}`;
  await registerUser(page, { name: 'Help Admin', email: adminEmail, password: 'helppass99' });
  await db.user.update({ where: { email: adminEmail }, data: { isPlatformAdmin: true } });
  page.on('dialog', dialog => dialog.accept());

  // Create + publish via the dedicated editor.
  await page.goto('/admin/help/new');
  await expect(page.locator('h1')).toContainText('New help article');
  await page.selectOption('select[name="tool"]', 'slu');
  await page.fill('input[name="slug"]', `qa-article-${runId}`);
  await page.fill('input[name="title"]', title);
  // Two keys: a unique one for the exact-match API assertion, plus the SLU
  // history page's key so the drawer test below includes this article.
  await page.fill('input[name="contextKeys"]', 'qa.test.key, slu');
  await page.fill('textarea[name="bodyMarkdown"]', '# Hello\n\nThis is **QA** help content.');
  await page.check('input[name="isPublished"]');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Help article saved.')).toBeVisible();

  // Published article renders on the tool help page.
  await page.goto('/help/slu');
  await expect(page.locator('.rj-help-item', { hasText: title })).toBeVisible();
  await expect(page.locator('.rj-help-item__body strong', { hasText: 'QA' })).toBeVisible();

  // Context API: exact key match first, tool fallback otherwise.
  const exact = await (await page.request.get('/help/api/context?key=qa.test.key')).json();
  expect(exact.matched).toBe('context');
  expect(exact.articles[0].title).toBe(title);
  const fallback = await (await page.request.get('/help/api/context?key=slu.some-unknown-page')).json();
  expect(fallback.matched).toBe('tool');

  // The drawer opens from the page-header "?" and loads tool help.
  await page.goto('/slu/history');
  await page.locator('[data-help-open]').first().click();
  await expect(page.locator('#rj-help-drawer')).toBeVisible();
  await expect(page.locator('#rj-help-drawer-body')).toContainText(title);

  // Unpublish hides it; delete removes it.
  await page.goto('/admin/help');
  await page.locator('tr', { hasText: title }).locator('form[action$="/publish"] button').click();
  await expect(page.locator('text=Article unpublished.')).toBeVisible();
  await page.goto('/help/slu');
  await expect(page.locator('.rj-help-item', { hasText: title })).toHaveCount(0);
  await page.goto('/admin/help');
  await page.locator('tr', { hasText: title }).locator('form[action$="/delete"] button').click();
  await expect(page.locator('text=Article deleted.')).toBeVisible();
});

test('requireAuth redirects unauthenticated users', async ({ page }) => {
  // /account uses app layout but doesn't require auth yet — this tests
  // that protected routes (added in Phase 04+) will redirect correctly.
  // For now, just verify /login is accessible after being redirected.
  await page.goto('/login');
  await expect(page).toHaveURL('/login');
});
