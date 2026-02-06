import { test, expect, Browser, BrowserContext } from '@playwright/test';
import { getTestUser, getUserAccounts, queryTestDb } from './fixtures';

test.describe('E2E - Data Persistence', () => {
  test.beforeEach(async ({ page }) => {
    console.log('\\n📋 [PERSISTENCE TEST] Starting test...');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✅' : '❌';
    console.log(`   ${status} ${testInfo.title} (${testInfo.duration}ms)`);
  });

  async function registerUser(email: string, password: string, page: any) {
    await page.goto('/');
    await page.click('text=Register');
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="first_name"]', 'Persist');
    await page.fill('input[id="last_name"]', 'Test');
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Registration successful')).toBeVisible({
      timeout: 5000,
    });
  }

  async function loginUser(email: string, password: string, page: any) {
    await page.goto('/');
    await page.click('text=Login');
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await expect(
      page.locator('text=/dashboard|portfolio|accounts/i')
    ).toBeVisible({ timeout: 5000 });
  }

  test('should persist user profile across sessions', async ({ browser }) => {
    const email = `persist-profile-${Date.now()}@example.com`;
    const password = 'PersistTest123!';

    // Session 1: Register
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await registerUser(email, password, page1);

    // Get user from database
    const user = await getTestUser(email);
    expect(user).toBeTruthy();
    expect(user.email).toBe(email);

    await context1.close();

    // Session 2: Login and verify data is still there
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await loginUser(email, password, page2);

    // Verify user profile still visible
    await expect(
      page2.locator('text=/Persist|Test|dashboard/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify in database - data unchanged
    const userAfterLogin = await getTestUser(email);
    expect(userAfterLogin.id).toBe(user.id);
    expect(userAfterLogin.email).toBe(email);

    await context2.close();
  });

  test('should persist account data across sessions', async ({ browser }) => {
    const email = `persist-account-${Date.now()}@example.com`;
    const password = 'AccountPersist123!';
    const accountName = `Persistent Account ${Date.now()}`;

    // Session 1: Register and create account
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await registerUser(email, password, page1);

    // Get user ID
    const user = await getTestUser(email);
    const userId = user.id;

    // Create account
    await page1.click('text=/add|create|new account/i');
    await page1.fill('input[id="accountName"]', accountName);
    await page1.click('select[id="accountType"]');
    await page1.click('text=Checking');
    await page1.click('button[type="submit"]');

    // Verify account created
    await expect(page1.locator(`text=${accountName}`)).toBeVisible({
      timeout: 5000,
    });

    // Verify in database
    let accounts = await getUserAccounts(userId);
    expect(accounts.length).toBeGreaterThan(0);
    const createdAccount = accounts.find(
      (a: any) => a.name === accountName
    );
    expect(createdAccount).toBeTruthy();

    await context1.close();

    // Session 2: Login and verify account persisted
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await loginUser(email, password, page2);

    // Account should still be visible
    await expect(page2.locator(`text=${accountName}`)).toBeVisible({
      timeout: 5000,
    });

    // Verify in database - same account exists
    accounts = await getUserAccounts(userId);
    const persistedAccount = accounts.find(
      (a: any) => a.name === accountName
    );
    expect(persistedAccount).toBeTruthy();
    expect(persistedAccount.id).toBe(createdAccount.id);

    await context2.close();
  });

  test('should persist account balances across sessions', async ({ browser }) => {
    const email = `persist-balance-${Date.now()}@example.com`;
    const password = 'BalancePersist123!';
    const accountName = `Balance Check ${Date.now()}`;

    // Session 1: Create account with balance
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await registerUser(email, password, page1);

    const user = await getTestUser(email);
    const userId = user.id;

    // Create account
    await page1.click('text=/add|create|new account/i');
    await page1.fill('input[id="accountName"]', accountName);
    await page1.click('select[id="accountType"]');
    await page1.click('text=Savings');
    await page1.click('button[type="submit"]');

    // Set balance in database
    const accounts = await getUserAccounts(userId);
    const account = accounts.find((a: any) => a.name === accountName);

    const testBalance = 7500.50;
    await queryTestDb(
      `INSERT INTO account_balances (account_id, balance, recorded_at) VALUES ($1, $2, NOW())`,
      [account.id, testBalance]
    );

    await context1.close();

    // Session 2: Login and verify balance persisted
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await loginUser(email, password, page2);

    // Balance should be displayed
    await expect(
      page2.locator(`text=/7500|balance/i`)
    ).toBeVisible({ timeout: 5000 });

    // Verify in database
    const balanceRecord = await queryTestDb(
      `SELECT balance FROM account_balances WHERE account_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
      [account.id]
    );
    expect((balanceRecord as any[])[0].balance).toBe(testBalance);

    await context2.close();
  });

  test('should persist multiple institution credentials', async ({ browser }) => {
    const email = `persist-institutions-${Date.now()}@example.com`;
    const password = 'InstitutionPersist123!';

    // Session 1: Register and link institutions
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await registerUser(email, password, page1);

    const user = await getTestUser(email);
    const userId = user.id;

    // Link first institution
    await page1.click('text=/link|institution|bank/i');
    await page1.fill('input[id="institutionName"]', 'Bank One');
    await page1.fill('input[id="accountNumber"]', '111111111');
    await page1.fill('input[id="password"]', 'BankPass1!');
    await page1.click('button[type="submit"]');

    await expect(
      page1.locator('text=/linked|connected|success/i')
    ).toBeVisible({ timeout: 5000 });

    // Link second institution
    await page1.click('text=/link|institution|bank|add/i');
    await page1.fill('input[id="institutionName"]', 'Bank Two');
    await page1.fill('input[id="accountNumber"]', '222222222');
    await page1.fill('input[id="password"]', 'BankPass2!');
    await page1.click('button[type="submit"]');

    await expect(
      page1.locator('text=/linked|connected|success/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify in database
    let institutions = await queryTestDb(
      `SELECT * FROM institutions WHERE user_id = $1`,
      [userId]
    );
    expect(institutions.length).toBe(2);

    await context1.close();

    // Session 2: Login and verify institutions still linked
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await loginUser(email, password, page2);

    // Both institutions should be displayed
    await expect(page2.locator('text=Bank One')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=Bank Two')).toBeVisible({ timeout: 5000 });

    // Verify in database
    institutions = await queryTestDb(
      `SELECT * FROM institutions WHERE user_id = $1`,
      [userId]
    );
    expect(institutions.length).toBe(2);

    await context2.close();
  });

  test('should persist login state with JWT token', async ({ browser }) => {
    const email = `persist-jwt-${Date.now()}@example.com`;
    const password = 'JWTPersist123!';

    // Session 1: Register
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await registerUser(email, password, page1);

    // Get token
    const token1 = await page1.evaluate(() =>
      localStorage.getItem('token')
    );
    expect(token1).toBeTruthy();

    await context1.close();

    // Session 2: Login and get new token
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await loginUser(email, password, page2);

    const token2 = await page2.evaluate(() =>
      localStorage.getItem('token')
    );
    expect(token2).toBeTruthy();

    // Should be different tokens (new login session)
    // But same user should be accessible
    const user = await getTestUser(email);
    expect(user).toBeTruthy();

    await context2.close();
  });

  test('should persist and retrieve account transaction history', async ({
    browser,
  }) => {
    const email = `persist-transactions-${Date.now()}@example.com`;
    const password = 'TransactionPersist123!';
    const accountName = `History Check ${Date.now()}`;

    // Session 1: Create account and add transaction
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await registerUser(email, password, page1);

    const user = await getTestUser(email);
    const userId = user.id;

    // Create account
    await page1.click('text=/add|create|new account/i');
    await page1.fill('input[id="accountName"]', accountName);
    await page1.click('select[id="accountType"]');
    await page1.click('text=Checking');
    await page1.click('button[type="submit"]');

    const accounts = await getUserAccounts(userId);
    const account = accounts.find((a: any) => a.name === accountName);

    // Add transactions via database (simulating external sync)
    await queryTestDb(
      `INSERT INTO account_events (account_id, event_type_id, description, amount, event_date)
       SELECT $1, et.id, 'Initial Deposit', 1000.00, NOW() 
       FROM event_types et WHERE et.name = 'deposit'`,
      [account.id]
    );

    await context1.close();

    // Session 2: Log in and verify transaction history
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await loginUser(email, password, page2);

    // Click on account to see transactions
    await page2.click(`text=${accountName}`);

    // Verify transaction appears
    await expect(
      page2.locator('text=/Initial Deposit|1000/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify in database
    const events = await queryTestDb(
      `SELECT * FROM account_events WHERE account_id = $1`,
      [account.id]
    );
    expect(events.length).toBeGreaterThan(0);

    await context2.close();
  });
});
