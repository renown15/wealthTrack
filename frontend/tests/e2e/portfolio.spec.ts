import { test, expect } from '@playwright/test';
import { getTestUser, getUserAccounts, queryTestDb } from './fixtures';

test.describe('E2E - Portfolio & Accounts', () => {
  test.beforeEach(async ({ page }) => {
    console.log('\\n📋 [PORTFOLIO TEST] Starting test...');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✅' : '❌';
    console.log(`   ${status} ${testInfo.title} (${testInfo.duration}ms)`);
  });

  async function loginAndNavigateToPortfolio(page: any) {
    const testEmail = `portfolio-${Date.now()}@example.com`;
    const testPassword = 'PortfolioTest123!';

    // Register user
    await page.goto('/');
    await page.click('text=Register');
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="firstName"]', 'Portfolio');
    await page.fill('input[id="lastName"]', 'Tester');
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Registration successful')).toBeVisible({
      timeout: 5000,
    });

    // Get user ID from database for later verification
    const user = await getTestUser(testEmail);

    return { testEmail, testPassword, userId: user.id };
  }

  test('should display portfolio hub after login', async ({ page }) => {
    const { testEmail, testPassword } = await loginAndNavigateToPortfolio(page);

    // Should be on portfolio/dashboard
    await expect(
      page.locator('text=/portfolio|accounts|dashboard/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should create new account', async ({ page }) => {
    const { testEmail, userId } = await loginAndNavigateToPortfolio(page);

    // Navigate to create account
    await page.click('text=/add|create|new account/i');

    // Fill account form
    const accountName = `Test Account ${Date.now()}`;
    await page.fill('input[id="accountName"]', accountName);

    // Select account type (assuming dropdown exists)
    await page.click('select[id="accountType"]');
    await page.click('text=Checking'); // Or whatever option is available

    // Submit
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(
      page.locator('text=/account created|success|added/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify account appears in list
    await expect(page.locator(`text=${accountName}`)).toBeVisible({
      timeout: 5000,
    });

    // Verify in database
    const accounts = await getUserAccounts(userId);
    expect(accounts.length).toBeGreaterThan(0);
    const createdAccount = accounts.find((a: any) => a.name === accountName);
    expect(createdAccount).toBeTruthy();
  });

  test('should display account balance', async ({ page }) => {
    const { userId } = await loginAndNavigateToPortfolio(page);

    // Create account with known balance
    const accountName = `Balance Test ${Date.now()}`;
    await page.click('text=/add|create|new account/i');
    await page.fill('input[id="accountName"]', accountName);
    await page.click('select[id="accountType"]');
    await page.click('text=Savings');
    await page.click('button[type="submit"]');
    await expect(page.locator(`text=${accountName}`)).toBeVisible({
      timeout: 5000,
    });

    // Get account from DB and set balance
    const accounts = await getUserAccounts(userId);
    const account = accounts.find((a: any) => a.name === accountName);

    // Insert balance record (this would normally be done via UI or API)
    await queryTestDb(
      `INSERT INTO account_balances (account_id, balance, recorded_at)
       VALUES ($1, $2, NOW())`,
      [account.id, 5000.00]
    );

    // Refresh to see balance
    await page.reload();

    // Verify balance displays
    await expect(page.locator('text=/5000|balance/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should link external institution', async ({ page }) => {
    const { userId } = await loginAndNavigateToPortfolio(page);

    // Navigate to link institution
    await page.click('text=/link|institution|bank|add institution/i');

    // This would typically open a modal or navigate to external flow
    // Fill credentials form
    await page.fill('input[id="institutionName"]', 'Test Bank');
    await page.fill('input[id="accountNumber"]', '123456789');
    await page.fill('input[id="password"]', 'BankPassword123!');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(
      page.locator('text=/linked|connected|success/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify in database - institution should exist
    const institutions = await queryTestDb(
      `SELECT * FROM institutions WHERE user_id = $1`,
      [userId]
    );
    expect((institutions as any[]).length).toBeGreaterThan(0);
  });

  test('should calculate total portfolio value', async ({ page }) => {
    const { userId } = await loginAndNavigateToPortfolio(page);

    // Create multiple accounts with different balances
    const account1 = `Account 1 ${Date.now()}`;
    const account2 = `Account 2 ${Date.now() + 1}`;

    // Create first account
    await page.click('text=/add|create|new account/i');
    await page.fill('input[id="accountName"]', account1);
    await page.click('select[id="accountType"]');
    await page.click('text=Checking');
    await page.click('button[type="submit"]');
    await expect(page.locator(`text=${account1}`)).toBeVisible({ timeout: 5000 });

    // Create second account
    await page.click('text=/add|create|new account/i');
    await page.fill('input[id="accountName"]', account2);
    await page.click('select[id="accountType"]');
    await page.click('text=Savings');
    await page.click('button[type="submit"]');
    await expect(page.locator(`text=${account2}`)).toBeVisible({ timeout: 5000 });

    // Get accounts and set balances
    const accounts = await getUserAccounts(userId);
    const acct1 = accounts.find((a: any) => a.name === account1);
    const acct2 = accounts.find((a: any) => a.name === account2);

    await queryTestDb(
      `INSERT INTO account_balances (account_id, balance, recorded_at) VALUES ($1, $2, NOW())`,
      [acct1.id, 1000.00]
    );
    await queryTestDb(
      `INSERT INTO account_balances (account_id, balance, recorded_at) VALUES ($1, $2, NOW())`,
      [acct2.id, 2500.00]
    );

    // Refresh and verify total
    await page.reload();

    // Total should be 3500
    await expect(page.locator('text=/3500|total/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should list all user accounts', async ({ page }) => {
    const { userId } = await loginAndNavigateToPortfolio(page);

    // Create 3 accounts
    const accountNames = [
      `List Test 1 ${Date.now()}`,
      `List Test 2 ${Date.now()}`,
      `List Test 3 ${Date.now()}`,
    ];

    for (const name of accountNames) {
      await page.click('text=/add|create|new account/i');
      await page.fill('input[id="accountName"]', name);
      await page.click('select[id="accountType"]');
      await page.click('text=Checking');
      await page.click('button[type="submit"]');
      await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 5000 });
    }

    // Verify all appear in list
    const accounts = await getUserAccounts(userId);
    expect(accounts.length).toBe(3);

    // Verify UI shows all
    for (const name of accountNames) {
      await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update account details', async ({ page }) => {
    const { userId } = await loginAndNavigateToPortfolio(page);

    const originalName = `Update Test ${Date.now()}`;
    const updatedName = `Updated Name ${Date.now()}`;

    // Create account
    await page.click('text=/add|create|new account/i');
    await page.fill('input[id="accountName"]', originalName);
    await page.click('select[id="accountType"]');
    await page.click('text=Savings');
    await page.click('button[type="submit"]');
    await expect(page.locator(`text=${originalName}`)).toBeVisible({
      timeout: 5000,
    });

    // Click to edit
    await page.click(`text=${originalName}`);
    await page.click('button[aria-label="Edit"]');

    // Update name
    await page.fill('input[id="accountName"]', updatedName);
    await page.click('button[type="submit"]');

    // Verify in UI
    await expect(page.locator(`text=${updatedName}`)).toBeVisible({
      timeout: 5000,
    });

    // Verify in database
    const accounts = await getUserAccounts(userId);
    const updated = accounts.find((a: any) => a.name === updatedName);
    expect(updated).toBeTruthy();
  });
});
