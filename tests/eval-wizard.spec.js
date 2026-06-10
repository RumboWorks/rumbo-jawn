// Eval authoring wizard — single-page stepped run-creation flow.
// Covers the JS-on happy paths (new eval + new run on existing eval) and that
// the per-step gating blocks advancing past an invalid step. Runs against the
// live server on localhost:4000.

import { test, expect } from '@playwright/test';
import { registerLocalUser } from '@rumbo/auth';
import { db } from '@rumbo/db';

// Register through the UI so the browser holds a real session, then grant the
// user eval-manager access and seed a model + criterion so the picker steps are
// non-empty.
async function setupEvalManager(page, label) {
  const email = `${label}-${Date.now()}@example.org`;
  await page.goto('/register'); // redirects to /signup?tier=free
  await page.fill('input[name="firstName"]', 'Wizard');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'testpass99');
  await page.check('input[name="acceptTerms"]');
  await page.click('button[type="submit"]');
  await page.waitForURL('/auth/verify-pending');
  await db.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });
  await page.goto('/');

  const user = await db.user.findUnique({ where: { email }, include: { memberships: true } });
  const orgId = user.memberships[0].orgId;
  await db.toolGrant.create({ data: { userId: user.id, orgId, tool: 'eval', role: 'MANAGER' } });
  const model = await db.evalOrgModel.create({
    data: { organizationId: orgId, displayName: 'GPT-test', accessMethod: 'MANUAL', createdByUserId: user.id },
  });
  const criterion = await db.evalCriterion.create({
    data: { organizationId: orgId, title: 'Clarity', createdByUserId: user.id },
  });
  return { orgId, model, criterion };
}

test('new-eval wizard: steps through and launches the first run', async ({ page }) => {
  const { orgId } = await setupEvalManager(page, 'eval-wiz-new');

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/eval');
  await expect(page.locator('h1')).toContainText('Wizard’s Desk');
  await expect(page.locator('.eval-desk > .rj-admin-metrics')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await expect(page.locator('.rj-tool-switcher__trigger')).toContainText('Eval');
  await page.locator('.rj-tool-switcher__trigger').click();
  const switcher = page.locator('.rj-tool-switcher__dialog');
  await expect(switcher).toBeVisible();
  await expect(switcher).toContainText('Compare model and tool outputs with structured criteria');
  await expect(switcher).toContainText('Turn public source material into reusable voice');
  await page.locator('[data-tool-switcher-close]').click();
  const contentBox = await page.locator('.rj-app-content').boundingBox();
  expect(contentBox.width).toBeLessThanOrEqual(1200);
  await page.goto('/eval/evals/new');

  // JS enhancement engaged: the stepper shows and only the first step is active.
  const wizard = page.locator('.rj-wizard');
  await expect(wizard).toHaveClass(/is-enhanced/);
  await expect(page.locator('[data-wizard-step="about"]')).toBeVisible();
  await expect(page.locator('[data-wizard-step="prompt"]')).toBeHidden();

  // Step 1: About
  await page.fill('input[name="title"]', 'Spring appeal lines');
  await page.click('[data-wizard-next]');

  // Step 2: Prompt
  await expect(page.locator('[data-wizard-step="prompt"]')).toBeVisible();
  await page.fill('textarea[name="promptText"]', 'Write a warm donation ask.');
  await page.click('[data-wizard-next]');

  // Step 3: Models
  await expect(page.locator('[data-wizard-step="models"]')).toBeVisible();
  await page.check('input[name="modelIds"]');
  await page.click('[data-wizard-next]');

  // Step 4: Criteria
  await expect(page.locator('[data-wizard-step="criteria"]')).toBeVisible();
  await page.check('input[name="criterionIds"]');
  await page.click('[data-wizard-next]');

  // Step 5: Reviewers (optional)
  await expect(page.locator('[data-wizard-step="reviewers"]')).toBeVisible();
  await page.click('[data-wizard-next]');

  // Step 6: Review — summary reflects the choices.
  await expect(page.locator('[data-wizard-step="review"]')).toBeVisible();
  await expect(page.locator('[data-wizard-summary-text="promptText"]')).toContainText('warm donation ask');
  await expect(page.locator('[data-wizard-summary-list="modelIds"]')).toContainText('GPT-test');
  await expect(page.locator('[data-wizard-summary-list="criterionIds"]')).toContainText('Clarity');

  // Launch → lands on the run-status page with the success flash.
  await page.click('[data-wizard-submit]');
  await expect(page).toHaveURL(/\/eval\/runs\/[^/]+$/);
  await expect(page.locator('h1')).toContainText('Run 1');
  await expect(page.locator('.rj-alert--success')).toContainText('launched');

  await page.goto('/eval');
  const listTitleStyle = await page.locator('.eval-list-section__title').first().evaluate(element => {
    const style = getComputedStyle(element);
    return { fontSize: style.fontSize, textTransform: style.textTransform };
  });
  expect(listTitleStyle).toEqual({ fontSize: '12px', textTransform: 'uppercase' });

  const tableColors = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      header: style.getPropertyValue('--rj-table-header-bg').trim(),
      body: style.getPropertyValue('--rj-table-body-bg').trim(),
    };
  });
  expect(tableColors).toEqual({
    header: '#f6efdc',
    body: '#faf5e6',
  });
  await expect(page.locator('.eval-list-section .rj-table-tools__count')).toHaveCount(0);
  await expect(page.locator('.eval-table thead')).not.toContainText('Status');
  await expect(page.locator('.eval-table thead')).not.toContainText('Runs');
  await expect(page.locator('.eval-progress').first()).toBeVisible();
  await expect(page.locator('.eval-progress [aria-label="AI Responses"]').first()).toHaveAttribute('aria-valuetext', '0 of 1');
  await expect(page.locator('.eval-progress [aria-label="Human Reviews"]').first()).toHaveAttribute('aria-valuetext', '0 of 0');

  const completedEval = await db.eval.findFirst({
    where: { organizationId: orgId, title: 'Spring appeal lines' },
    include: { runs: { orderBy: { runNumber: 'desc' }, take: 1 } },
  });
  await db.evalRun.update({
    where: { id: completedEval.runs[0].id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
  await page.reload();

  const completedSection = page.locator('.eval-list-section', { hasText: 'Completed' });
  await expect(completedSection.locator('.eval-summary')).toBeVisible();
  await expect(completedSection.locator('.eval-summary__label')).toContainText([
    'date range',
    'runs',
    'models',
    'reviewers',
  ]);
  await expect(completedSection.locator('.eval-progress')).toHaveCount(0);
});

test('new-run wizard on an existing eval starts at the Prompt step', async ({ page }) => {
  const { orgId, model, criterion } = await setupEvalManager(page, 'eval-wiz-run');
  const ev = await db.eval.create({
    data: { organizationId: orgId, title: 'Existing eval', createdByUserId: (await db.evalOrgModel.findUnique({ where: { id: model.id } })).createdByUserId },
  });

  await page.goto(`/eval/evals/${ev.publicId}/runs/new`);

  // No About step in new-run mode; the first visible step is Prompt.
  await expect(page.locator('[data-wizard-step="about"]')).toHaveCount(0);
  await expect(page.locator('[data-wizard-step="prompt"]')).toBeVisible();

  await page.fill('textarea[name="promptText"]', 'Second run prompt.');
  await page.click('[data-wizard-next]');
  await page.check('input[name="modelIds"]');
  await page.click('[data-wizard-next]');
  await page.check('input[name="criterionIds"]');
  await page.click('[data-wizard-next]');
  await expect(page.locator('[data-wizard-step="reviewers"]')).toBeVisible();
  await page.click('[data-wizard-next]');
  await expect(page.locator('[data-wizard-step="review"]')).toBeVisible();
  await page.click('[data-wizard-submit]');

  await expect(page).toHaveURL(/\/eval\/runs\/[^/]+$/);
  await expect(page.locator('h1')).toContainText('Run 1');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all steps render stacked and the single submit launches the run', async ({ page }) => {
    await setupEvalManager(page, 'eval-wiz-nojs');

    await page.goto('/eval/evals/new');

    // No enhancement: the stepper nav is hidden and every step is visible.
    await expect(page.locator('.rj-wizard')).not.toHaveClass(/is-enhanced/);
    await expect(page.locator('[data-wizard-step="about"]')).toBeVisible();
    await expect(page.locator('[data-wizard-step="prompt"]')).toBeVisible();
    await expect(page.locator('[data-wizard-step="review"]')).toBeVisible();

    await page.fill('input[name="title"]', 'No-JS eval');
    await page.fill('textarea[name="promptText"]', 'Prompt without scripts.');
    await page.check('input[name="modelIds"]');
    await page.check('input[name="criterionIds"]');
    await page.click('[data-wizard-submit]');

    await expect(page).toHaveURL(/\/eval\/runs\/[^/]+$/);
    await expect(page.locator('h1')).toContainText('Run 1');
  });
});

test('wizard gates: Next does not advance past an empty required prompt', async ({ page }) => {
  await setupEvalManager(page, 'eval-wiz-gate');

  await page.goto('/eval/evals/new');
  await page.fill('input[name="title"]', 'Gated eval');
  await page.click('[data-wizard-next]'); // → Prompt

  await expect(page.locator('[data-wizard-step="prompt"]')).toBeVisible();
  // Prompt left empty: Next should keep us on the Prompt step.
  await page.click('[data-wizard-next]');
  await expect(page.locator('[data-wizard-step="prompt"]')).toBeVisible();
  await expect(page.locator('[data-wizard-step="models"]')).toBeHidden();
});
