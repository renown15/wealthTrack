import { test, expect } from '@playwright/test';
import { getTestUser, queryTestDb, seedReferenceData } from './fixtures';

test.describe('E2E - User Login', () => {
  test.beforeEach(async ({ page }) => {
    console.log('\\n📋 [LOGIN TEST] Starting test...');
    // Ensure we have a test user to log in
    await seedReferenceData();

    // Create test user for login tests
    const hashedPassword = '$2b$12$wUEeVpEgHUPh3GHlnNkrvu'; // This would need actual bcrypt
    // For testing, we'll rely on the registration test creating users, or seed manually
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✅' : '❌';
    console.log(`   ${status} ${testInfo.title} (${testInfo.duration}ms)`);
  });

  test('should login with valid credentials', async ({ page }) => {
    const testEmail = `login-test-${Date.now()}@example.com`;
    const testPassword = 'LoginTest123!';

    // First register a user
    await page.goto('/');
    await page.click('text=Register');
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="firstName"]', 'Login');
    await page.fill('input[id="lastName"]', 'Tester');
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Registration successful')).toBeVisible({
      timeout: 5000,
    });

    // Now logout by navigating away
    await page.goto('/');

    // Now test login
    await page.click('text=Login');

    // Fill login form
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);

    // Submit login
    await page.click('button[type="submit"]');

    // Should redirect to dashboard/portfolio
    await expect(
      page.locator('text=/dashboard|portfolio|accounts/i')
    ).toBeVisible({ timeout: 5000 });

    // Verify JWT token is stored
    const token = await page.evaluate(() => {
      return localStorage.getItem('token');
    });
    expect(token).toBeTruthy();

    // Verify user data in database
    const user = await getTestUser(testEmail);
    expect(user).toBeTruthy();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');

    await page.fill('input[id="email"]', 'nonexistent@example.com');
    await page.fill('input[id="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Should show authentication error
    await expect(
      page.locator('text=/invalid|incorrect|unauthorized/i')
    ).toBeVisible({ timeout: 5000 });

    // Token should NOT be stored
    const token = await page.evaluate(() => {
      return localStorage.getItem('token');
    });
    expect(token).toBeNull();
  });

  test('should reject wrong password', async ({ page }) => {
    const testEmail = `wrong-pass-${Date.now()}@example.com`;
    const correctPassword = 'CorrectPass123!';

    // Register user
    await page.goto('/');
    await page.click('text=Register');
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="firstName"]', 'Wrong');
    await page.fill('input[id="lastName"]', 'Pass');
    await page.fill('input[id="password"]', correctPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Registration successful')).toBeVisible({
      timeout: 5000,
    });

    // Try login with wrong password
    await page.goto('/');
    await page.click('text=Login');

    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Should show authentication error
    await expect(
      page.locator('text=/invalid|incorrect|unauthorized/i')
    ).toBeVisible({ timeout: 5000 });

    // Token should NOT be stored
    const token = await page.evaluate(() => {
      return localStorage.getItem('token');
    });
    expect(token).toBeNull();
  });

  test('should require email field', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');

    await page.fill('input[id="password"]', 'SomePassword123!');

    // Try submit without email
    await page.click('button[type="submit"]');

    // Should show validation error
    const errorVisible = await page
      .locator('text=/required|email|field/i')
      .isVisible()
      .catch(() => false);

    // Either client-side validation or server error
    if (!errorVisible) {
      await expect(
        page.locator('text=/email|invalid|required/i')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should require password field', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');

    await page.fill('input[id="email"]', 'user@example.com');

    // Try submit without password
    await page.click('button[type="submit"]');

    // Should show validation error
    const errorVisible = await page
      .locator('text=/required|password|field/i')
      .isVisible()
      .catch(() => false);

    // Either client-side validation or server error
    if (!errorVisible) {
      await expect(
        page.locator('text=/password|invalid|required/i')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should preserve login state on page refresh', async ({ page }) => {
    const testEmail = `refresh-${Date.now()}@example.com`;
    const testPassword = 'RefreshTest123!';

    // Register and login
    await page.goto('/');
    await page.click('text=Register');
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="firstName"]', 'Refresh');
    await page.fill('input[id="lastName"]', 'Test');
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Registration successful')).toBeVisible({
      timeout: 5000,
    });

    // Get token
    const tokenBeforeRefresh = await page.evaluate(() => {
      return localStorage.getItem('token');
    });
    expect(tokenBeforeRefresh).toBeTruthy();

    // Refresh page
    await page.reload();

    // Token should still be there
    const tokenAfterRefresh = await page.evaluate(() => {
      return localStorage.getItem('token');
    });
    expect(tokenAfterRefresh).toBe(tokenBeforeRefresh);

    // Should still be on authenticated view
    await expect(
      page.locator('text=/dashboard|portfolio|accounts/i')
    ).toBeVisible({ timeout: 5000 });
  });
});
