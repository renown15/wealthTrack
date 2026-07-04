import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useTaxHubActions } from '@composables/useTaxHubActions';
import { apiService } from '@services/ApiService';
import { authModule } from '@/modules/auth';

vi.mock('@services/ApiService', () => ({
  apiService: { updateTaxPeriodCommentary: vi.fn(), setUtr: vi.fn() },
}));

const mockApi = vi.mocked(apiService);

const makePeriods = () =>
  ref([
    { id: 1, userId: 1, name: '2025/26', startDate: '', endDate: '', commentary: 'old',
      accountGroupId: null, createdAt: '', updatedAt: '' },
  ] as never);

beforeEach(() => vi.clearAllMocks());

describe('useTaxHubActions', () => {
  it('exposes the selected period', () => {
    const { selectedPeriod } = useTaxHubActions(makePeriods(), ref(1));
    expect(selectedPeriod.value?.name).toBe('2025/26');
  });

  it('saves commentary and updates the period in place', async () => {
    mockApi.updateTaxPeriodCommentary.mockResolvedValue({ id: 1, commentary: 'new' } as never);
    const periods = makePeriods();
    const { saveCommentary, commentaryOpen } = useTaxHubActions(periods, ref(1));
    commentaryOpen.value = true;
    await saveCommentary('<p>new</p>');
    expect(mockApi.updateTaxPeriodCommentary).toHaveBeenCalledWith(1, '<p>new</p>');
    expect(periods.value[0].commentary).toBe('new');
    expect(commentaryOpen.value).toBe(false);
  });

  it('sends null commentary when the html is empty', async () => {
    mockApi.updateTaxPeriodCommentary.mockResolvedValue({ id: 1, commentary: null } as never);
    const { saveCommentary } = useTaxHubActions(makePeriods(), ref(1));
    await saveCommentary('');
    expect(mockApi.updateTaxPeriodCommentary).toHaveBeenCalledWith(1, null);
  });

  it('does nothing when no period is selected', async () => {
    const { saveCommentary } = useTaxHubActions(makePeriods(), ref(null));
    await saveCommentary('x');
    expect(mockApi.updateTaxPeriodCommentary).not.toHaveBeenCalled();
  });

  it('saves the UTR and updates the auth user', async () => {
    mockApi.setUtr.mockResolvedValue({ id: 1, utr: '1234567890' } as never);
    const setUser = vi.spyOn(authModule, 'setUser');
    const { saveUtr, utrOpen, currentUtr } = useTaxHubActions(makePeriods(), ref(1));
    utrOpen.value = true;
    await saveUtr('1234567890');
    expect(mockApi.setUtr).toHaveBeenCalledWith('1234567890');
    expect(setUser).toHaveBeenCalled();
    expect(currentUtr.value).toBe('1234567890');
    expect(utrOpen.value).toBe(false);
  });
});
