import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('@services/ApiService', () => ({
  apiService: { updateTaxPeriodCommentary: vi.fn(), setUtr: vi.fn() },
}));

import TaxHubHeaderActions from '@views/TaxHub/TaxHubHeaderActions.vue';

const period = {
  id: 1, userId: 1, name: '2025/26', startDate: '', endDate: '', commentary: '',
  accountGroupId: null, createdAt: '', updatedAt: '',
};

beforeEach(() => {
  document.execCommand = vi.fn();
});

describe('TaxHubHeaderActions', () => {
  it('shows the Commentary button only when a period is selected', () => {
    const withSel = mount(TaxHubHeaderActions, {
      props: { periods: [period] as never, selectedPeriodId: 1 },
    });
    expect(withSel.text()).toContain('Commentary');

    const noSel = mount(TaxHubHeaderActions, {
      props: { periods: [period] as never, selectedPeriodId: null },
    });
    expect(noSel.text()).not.toContain('Commentary');
    expect(noSel.text()).toContain('Set UTR');
  });

  it('opens the commentary editor when the button is clicked', async () => {
    const w = mount(TaxHubHeaderActions, {
      props: { periods: [period] as never, selectedPeriodId: 1 },
    });
    const btn = w.findAll('button').find((b) => b.text() === 'Commentary')!;
    await btn.trigger('click');
    expect(w.text()).toContain('Tell the story of this tax year');
  });
});
