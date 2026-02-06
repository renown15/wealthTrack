import { test, expect } from '@playwright/test';
import { getTestUser, getTestUserProfile, verifyPasswordHashed } from './fixtures';

test.describe('E2E - User Registration', () => {
  test.beforeEach(async ({ page }) => {
    console.log('\\n📋 [REGISTRATION TEST] Starting test...');
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? '✅' : '❌';
    console.log(`   ${status} ${testInfo.title} (${testInfo.duration}ms)`);
  });

  test('should register new user with valid data', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/');
    await page.click('text=Register');

    // Fill registration form
    await page.fill('input[id="email"]', 'newuser@example.com');
    await page.fill('input[id="first_name"]', 'John');
    await page.fill('input[id="last_name"]', 'Doe');
    await page.fill('input[id="password"]', 'SecurePass123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=Registration successful')).toBeVisible({
      timeout: 5000,
    });

    // Verify user was created in database
    const user = await getTestUser('newuser@example.com');
    expect(user).toBeTruthy();
    expect(user.email).toBe('newuser@example.com');
    expect(user.is_active).toBe(true);

    // Verify password was hashed
    const isHashed = await verifyPasswordHashed('newuser@example.com');
    expect(isHashed).toBe(true);

    // Verify user_profile was created
    const profile = await getTestUserProfile(user.id);
    expect(profile).toBeTruthy();
    expect(profile.firstname).toBe('John');
    expect(profile.surname).toBe('Doe');
  });

  test('should reject invalid email format', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Register');

    // Try invalid email
    await page.fill('input[id="email"]', 'not-an-email');
    await page.fill('input[id="first_name"]', 'John');
    await page.fill('input[id="last_name"]', 'Doe');
    await page.fill('input[id="password"]', 'SecurePass123!');

    await page.click('button[type="submit"]');

    // Should show validation error
    const errorVisible = await page
      .locator('text=/invalid|email|format/i')
      .isVisible()
      .catch(() => false);

    // Either validation error shows or API rejects
    await expect(
      page.locator('text=/invalid|error|already exists/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should reject weak password', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Register');

    await page.fill('input[id="email"]', 'weakpass@example.com');
    await page.fill('input[id="first_name"]', 'John');
    await page.fill('input[id="last_name"]', 'Doe');
    await page.fill('input[id="password"]', '123'); // Too weak

    await page.click('button[type="submit"]');

    // Should show password validation error
    await expect(page.locator('text=/password|weak|strong/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should reject duplicate email', async ({ page }) => {
    // Register first user
    const email = `duplicate-${Date.now()}@example.com`;
    await page.goto('/');
    await page.click('text=Register');

    await page.fill('input[id="email"]', email);
    await page.fill('input[id="first_name"]', 'First');
    await page.fill('input[id="last_name"]', 'User');
    await page.fill('input[id="password"]', 'SecurePass123!');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=Registration successful')).toBeVisible({
      timeout: 5000,
    });

    // Try to register same email again
    await page.goto('/');
    await page.click('text=Register');

    await page.fill('input[id="email"]', email);
    await page.fill('input[id="first_name"]', 'Second');
    await page.fill('input[id="last_name"]', 'User');
    await page.fill('input[id="password"]', 'AnotherPass123!');

    await page.click('button[type="submit"]');

    // Should show "already exists" error
    await expect(page.locator('text=/already exists|duplicate/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should require all fields', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Register');

    // Try to submit with empty fields
    await page.click('button[type="submit"]');

    // Should show validation errors
    const errors = await page.locator('text=/required|please|field/i').count();
    expect(errors).toBeGreaterThan(0);
  });
});
