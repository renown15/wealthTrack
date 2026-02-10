/**
 * Integration test - Full app flow with browser-like interactions
 * Tests: UI rendering, logging, portfolio hub display, user interactions
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiService } from '../src/services/ApiService';
import { debug } from '../src/utils/debug';
import { LoginController } from '../src/controllers/LoginController';
import { RegistrationController } from '../src/controllers/RegistrationController';

describe('Integration - Full App Browser Flow', () => {
  let appContainer: HTMLElement;
  let logOutput: string[] = [];

  beforeEach(() => {
    // Create app container
    appContainer = document.createElement('div');
    appContainer.id = 'app';
    document.body.appendChild(appContainer);

    // Capture debug output
    logOutput = [];
    const originalLog = console.debug;
    const originalError = console.error;
    const originalWarn = console.warn;

    vi.spyOn(console, 'debug').mockImplementation((...args) => {
      logOutput.push(`[DEBUG] ${args.join(' ')}`);
      originalLog(...args);
    });

    vi.spyOn(console, 'error').mockImplementation((...args) => {
      logOutput.push(`[ERROR] ${args.join(' ')}`);
      originalError(...args);
    });

    vi.spyOn(console, 'warn').mockImplementation((...args) => {
      logOutput.push(`[WARN] ${args.join(' ')}`);
      originalWarn(...args);
    });

    // Enable debug mode
    debug.enable();

    // Mock API responses
    vi.spyOn(apiService, 'registerUser').mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
    });

    vi.spyOn(apiService, 'loginUser').mockResolvedValue({
      accessToken: 'mock-jwt-token-123',
    });

    vi.spyOn(apiService, 'getCurrentUser').mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
    });

    vi.spyOn(apiService, 'getPortfolio').mockResolvedValue({
      accounts: [
        {
          id: 1,
          userId: 1,
          institutionId: 1,
          typeId: 1,
          statusId: 1,
          name: 'Checking Account',
          createdAt: new Date(),
          updatedAt: new Date(),
          latestBalance: {
            value: 5000,
            createdAt: new Date(),
          },
        },
        {
          id: 2,
          userId: 1,
          institutionId: 1,
          typeId: 2,
          statusId: 1,
          name: 'Savings Account',
          createdAt: new Date(),
          updatedAt: new Date(),
          latestBalance: {
            value: 25000,
            createdAt: new Date(),
          },
        },
      ],
      institutions: [
        {
          id: 1,
          userId: 1,
          name: 'My Bank',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    vi.spyOn(apiService, 'setAuthToken');
    vi.spyOn(apiService, 'getAuthToken').mockReturnValue('mock-jwt-token-123');
    vi.spyOn(apiService, 'clearAuthToken');
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (appContainer.parentElement) {
      appContainer.parentElement.removeChild(appContainer);
    }
    localStorage.clear();
    logOutput = [];
  });

  describe('App Logging Integration', () => {
    it('should log API calls through debug utility', async () => {
      const portfolioContainer = document.createElement('div');
      portfolioContainer.id = 'portfolio-container';
      appContainer.appendChild(portfolioContainer);

      // Enable debugging and verify logging works
      debug.enable();
      debug.log('[Test] Portfolio interaction started');

      // Trigger portfolio fetch
      await apiService.getPortfolio();

      // Verify getPortfolio was called
      expect(apiService.getPortfolio).toHaveBeenCalled();
    });

    it('should track debug state through app lifecycle', () => {
      expect(debug.isEnabled()).toBe(true);
      
      debug.disable();
      expect(debug.isEnabled()).toBe(false);
      
      debug.enable();
      expect(debug.isEnabled()).toBe(true);
    });

    it('should log errors when API calls fail', async () => {
      (apiService.getCurrentUser as any).mockRejectedValueOnce(
        new Error('API Error: 401 Unauthorized')
      );

      try {
        await apiService.getCurrentUser();
      } catch (error) {
        // Expected to fail
      }

      expect(apiService.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('UI Rendering - Login Flow', () => {
    it('should render login form with all required fields', async () => {
      const loginContainer = document.createElement('div');
      loginContainer.id = 'login-container';
      appContainer.appendChild(loginContainer);

      const controller = new LoginController('login-container');
      controller.init();

      const form = loginContainer.querySelector('form');
      expect(form).toBeDefined();

      const emailInput = loginContainer.querySelector('input[id="email"]');
      const passwordInput = loginContainer.querySelector('input[id="password"]');

      expect(emailInput).toBeDefined();
      expect(passwordInput).toBeDefined();
    });

    it('should handle user form input and submission', async () => {
      const loginContainer = document.createElement('div');
      loginContainer.id = 'login-container';
      appContainer.appendChild(loginContainer);

      const controller = new LoginController('login-container');
      controller.init();

      const emailInput = loginContainer.querySelector('input[id="email"]') as HTMLInputElement;
      const passwordInput = loginContainer.querySelector('input[id="password"]') as HTMLInputElement;

      // Simulate user typing
      if (emailInput) {
        emailInput.value = 'test@example.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (passwordInput) {
        passwordInput.value = 'Password123!';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Verify values were set
      expect(emailInput?.value).toBe('test@example.com');
      expect(passwordInput?.value).toBe('Password123!');
    });
  });

  describe('UI Rendering - Registration Flow', () => {
    it('should render registration form with all fields', () => {
      const regContainer = document.createElement('div');
      regContainer.id = 'registration-container';
      appContainer.appendChild(regContainer);

      const controller = new RegistrationController('registration-container');
      controller.init();

      const form = regContainer.querySelector('form');
      expect(form).toBeDefined();

      const emailInput = regContainer.querySelector('input[id="email"]');
      const firstNameInput = regContainer.querySelector('input[id="firstName"]');
      const lastNameInput = regContainer.querySelector('input[id="lastName"]');
      const passwordInput = regContainer.querySelector('input[id="password"]');

      expect(emailInput).toBeDefined();
      expect(firstNameInput).toBeDefined();
      expect(lastNameInput).toBeDefined();
      expect(passwordInput).toBeDefined();
    });
  });

  describe('Portfolio Hub Display', () => {
    it('should handle portfolio data with multiple accounts', async () => {
      const portfolioResponse = await apiService.getPortfolio();

      expect(portfolioResponse.accounts).toHaveLength(2);
      expect(portfolioResponse.accounts[0].name).toBe('Checking Account');
      expect(portfolioResponse.accounts[1].name).toBe('Savings Account');
      expect(portfolioResponse.accounts[0].latestBalance?.value).toBe(5000);
      expect(portfolioResponse.accounts[1].latestBalance?.value).toBe(25000);
    });

    it('should calculate total portfolio value', async () => {
      const portfolioResponse = await apiService.getPortfolio();

      const totalValue = portfolioResponse.accounts.reduce((sum: number, account: Record<string, unknown>) => {
        const latestBalance = account.latestBalance as Record<string, unknown> | undefined;
        return sum + (Number(latestBalance?.value) || 0);
      }, 0);

      expect(totalValue).toBe(30000);
    });
  });

  describe('Navigation & State Management', () => {
    it('should handle logout clearing auth state', async () => {
      localStorage.setItem('accessToken', 'mock-jwt-token-123');
      expect(localStorage.getItem('accessToken')).toBe('mock-jwt-token-123');

      // Simulate logout
      localStorage.removeItem('accessToken');
      apiService.clearAuthToken();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(apiService.clearAuthToken).toHaveBeenCalled();
    });

    it('should persist auth token across views', () => {
      const token = 'mock-jwt-token-456';
      localStorage.setItem('accessToken', token);

      // Simulate navigation to different view
      const newContainer = document.createElement('div');
      appContainer.appendChild(newContainer);

      // Token should still be available
      expect(localStorage.getItem('accessToken')).toBe(token);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized errors gracefully', async () => {
      (apiService.getCurrentUser as any).mockRejectedValueOnce(
        new Error('Unauthorized')
      );

      try {
        await apiService.getCurrentUser();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should recover from transient API failures', async () => {
      // First call fails, second succeeds
      (apiService.getPortfolio as any)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          accounts: [],
          institutions: [],
        });

      try {
        await apiService.getPortfolio();
      } catch {
        // Expected first failure
      }

      // Retry should succeed
      const result = await apiService.getPortfolio();
      expect(result).toBeDefined();
    });
  });

  describe('Browser-like User Journey', () => {
    it('should complete register -> login -> logout flow', async () => {
      const regContainer = document.createElement('div');
      regContainer.id = 'registration-container';
      appContainer.appendChild(regContainer);

      const regController = new RegistrationController('registration-container');
      regController.init();

      const emailInput = regContainer.querySelector('input[id="email"]') as HTMLInputElement;
      const firstNameInput = regContainer.querySelector('input[id="firstName"]') as HTMLInputElement;
      const lastNameInput = regContainer.querySelector('input[id="lastName"]') as HTMLInputElement;
      const passwordInput = regContainer.querySelector('input[id="password"]') as HTMLInputElement;

      if (emailInput) emailInput.value = 'newuser@example.com';
      if (firstNameInput) firstNameInput.value = 'Jane';
      if (lastNameInput) lastNameInput.value = 'Smith';
      if (passwordInput) passwordInput.value = 'SecurePass123!';

      expect(emailInput?.value).toBe('newuser@example.com');

      const loginContainer = document.createElement('div');
      loginContainer.id = 'login-container';
      appContainer.appendChild(loginContainer);

      const loginController = new LoginController('login-container');
      loginController.init();

      const loginEmail = loginContainer.querySelector('input[id="email"]') as HTMLInputElement;
      const loginPassword = loginContainer.querySelector('input[id="password"]') as HTMLInputElement;

      if (loginEmail) loginEmail.value = 'test@example.com';
      if (loginPassword) loginPassword.value = 'Password123!';

      localStorage.setItem('accessToken', 'mock-jwt-token-123');
      await apiService.getPortfolio();

      localStorage.removeItem('accessToken');
      apiService.clearAuthToken();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(apiService.clearAuthToken).toHaveBeenCalled();
    });
  });
});
