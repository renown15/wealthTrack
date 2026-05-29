import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthService } from '@/composables/useAuthService';
import { apiService } from '@/services/ApiService';
import { ValidationService } from '@/services/ValidationService';

vi.mock('@/services/ApiService');
vi.mock('@/services/ValidationService');
vi.mock('@/modules/auth');
vi.mock('@/utils/debug', () => ({
  debug: { log: vi.fn(), error: vi.fn() },
}));

const registerPayload = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  password: 'password123',
};

describe('useAuthService — handleRegister', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns success when registration succeeds', async () => {
    vi.mocked(ValidationService.validateRegistrationForm).mockReturnValue({ isValid: true, errors: {} });
    vi.mocked(apiService.registerUser).mockResolvedValue(undefined);

    const { handleRegister } = useAuthService();
    const result = await handleRegister(registerPayload);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns error when validation fails', async () => {
    vi.mocked(ValidationService.validateRegistrationForm).mockReturnValue({
      isValid: false, errors: { email: 'Email already exists' },
    });

    const { handleRegister } = useAuthService();
    const result = await handleRegister(registerPayload);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(apiService.registerUser).not.toHaveBeenCalled();
  });

  it('returns error when API call fails', async () => {
    vi.mocked(ValidationService.validateRegistrationForm).mockReturnValue({ isValid: true, errors: {} });
    vi.mocked(apiService.registerUser).mockRejectedValue(new Error('Server error'));

    const { handleRegister } = useAuthService();
    const result = await handleRegister(registerPayload);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Server error');
  });

  it('calls registerUser with correct payload', async () => {
    vi.mocked(ValidationService.validateRegistrationForm).mockReturnValue({ isValid: true, errors: {} });
    vi.mocked(apiService.registerUser).mockResolvedValue(undefined);

    const { handleRegister } = useAuthService();
    await handleRegister(registerPayload);

    expect(apiService.registerUser).toHaveBeenCalledWith(registerPayload);
  });

  it('sets isSubmitting flag during registration', async () => {
    vi.mocked(ValidationService.validateRegistrationForm).mockReturnValue({ isValid: true, errors: {} });
    vi.mocked(apiService.registerUser).mockImplementation(
      () => new Promise((resolve) => {
        expect(service.isSubmitting.value).toBe(true);
        resolve(undefined);
      }),
    );

    const service = useAuthService();
    expect(service.isSubmitting.value).toBe(false);
    await service.handleRegister(registerPayload);
    expect(service.isSubmitting.value).toBe(false);
  });
});
