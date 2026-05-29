import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthService } from '@/composables/useAuthService';
import { apiService } from '@/services/ApiService';
import { ValidationService } from '@/services/ValidationService';
import { authModule } from '@/modules/auth';

vi.mock('@/services/ApiService');
vi.mock('@/services/ValidationService');
vi.mock('@/modules/auth');
vi.mock('@/utils/debug', () => ({
  debug: { log: vi.fn(), error: vi.fn() },
}));

describe('useAuthService — handleLogin', () => {
  const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

  beforeEach(() => { vi.clearAllMocks(); });

  it('returns success when login succeeds', async () => {
    vi.mocked(ValidationService.validateLoginForm).mockReturnValue({ isValid: true, errors: {} });
    vi.mocked(apiService.loginUser).mockResolvedValue({ accessToken: 'valid-token-123' });
    vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockUser);

    const { handleLogin } = useAuthService();
    const result = await handleLogin({ email: 'john@example.com', password: 'password123' });

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeUndefined();
  });

  it('returns error when validation fails', async () => {
    vi.mocked(ValidationService.validateLoginForm).mockReturnValue({
      isValid: false, errors: { email: 'Invalid email format' },
    });

    const { handleLogin } = useAuthService();
    const result = await handleLogin({ email: 'invalid', password: 'password123' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(apiService.loginUser).not.toHaveBeenCalled();
  });

  it('returns error when API call fails', async () => {
    vi.mocked(ValidationService.validateLoginForm).mockReturnValue({ isValid: true, errors: {} });
    vi.mocked(apiService.loginUser).mockRejectedValue(new Error('Network error'));

    const { handleLogin } = useAuthService();
    const result = await handleLogin({ email: 'john@example.com', password: 'password123' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('returns error when response has no accessToken', async () => {
    vi.mocked(ValidationService.validateLoginForm).mockReturnValue({ isValid: true, errors: {} });
    vi.mocked(apiService.loginUser).mockResolvedValue({ accessToken: undefined } as never);

    const { handleLogin } = useAuthService();
    const result = await handleLogin({ email: 'john@example.com', password: 'password123' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No access token');
  });

  it('sets token and user on successful login', async () => {
    vi.mocked(ValidationService.validateLoginForm).mockReturnValue({ isValid: true, errors: {} });
    vi.mocked(apiService.loginUser).mockResolvedValue({ accessToken: 'token-123' });
    vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockUser);

    const { handleLogin } = useAuthService();
    await handleLogin({ email: 'john@example.com', password: 'password123' });

    expect(authModule.setToken).toHaveBeenCalledWith('token-123');
    expect(authModule.setUser).toHaveBeenCalledWith(mockUser);
  });

  it('sets isSubmitting flag during request', async () => {
    vi.mocked(ValidationService.validateLoginForm).mockReturnValue({ isValid: true, errors: {} });
    vi.mocked(apiService.loginUser).mockImplementation(
      () => new Promise((resolve) => {
        expect(service.isSubmitting.value).toBe(true);
        resolve({ accessToken: 'token' });
      }),
    );
    vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockUser);

    const service = useAuthService();
    expect(service.isSubmitting.value).toBe(false);
    await service.handleLogin({ email: 'john@example.com', password: 'password123' });
    expect(service.isSubmitting.value).toBe(false);
  });

  it('isSubmitting is false initially', () => {
    const { isSubmitting } = useAuthService();
    expect(isSubmitting.value).toBe(false);
  });
});
