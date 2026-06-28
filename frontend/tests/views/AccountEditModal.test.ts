import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountEditModal from '@views/AccountHub/AccountEditModal.vue';
import AccountModal from '@views/AccountHub/AccountModal.vue';
import type { Account } from '@/models/WealthTrackDataModels';

const account = {
  id: 7, userId: 1, institutionId: 2, name: 'BP Shares', typeId: 3, statusId: 1,
  openedAt: '2020-01-01', closedAt: null, accountNumber: '123', sortCode: '11-22-33',
  rollRefNumber: null, interestRate: null, fixedBonusRate: '1.5', fixedBonusRateEndDate: '2026-01-01',
  numberOfShares: '500', underlying: 'BP.L', price: '480', purchasePrice: '300',
  assetClass: 'Single Stock', encumbrance: '1000', taxYear: '2024/25',
  createdAt: '2020-01-01', updatedAt: '2020-01-01',
} as unknown as Account;

const base = { institutions: [], accountTypes: [], accountStatuses: [] };

describe('AccountEditModal', () => {
  it('forwards all optional account fields from the item to AccountModal', () => {
    const wrapper = mount(AccountEditModal, {
      props: { open: true, type: 'edit', item: account, ...base },
      global: { stubs: { AccountModal: true } },
    });
    const modal = wrapper.findComponent(AccountModal);
    expect(modal.props('accountId')).toBe(7);
    expect(modal.props('initialNumberOfShares')).toBe('500');
    expect(modal.props('initialFixedBonusRate')).toBe('1.5');
    expect(modal.props('initialFixedBonusRateEndDate')).toBe('2026-01-01');
    expect(modal.props('initialUnderlying')).toBe('BP.L');
    expect(modal.props('initialPurchasePrice')).toBe('300');
    expect(modal.props('initialAssetClass')).toBe('Single Stock');
    expect(modal.props('initialEncumbrance')).toBe('1000');
    expect(modal.props('initialTaxYear')).toBe('2024/25');
  });

  it('passes empty/null initials in create mode (no item)', () => {
    const wrapper = mount(AccountEditModal, {
      props: { open: true, type: 'create', item: null, ...base },
      global: { stubs: { AccountModal: true } },
    });
    const modal = wrapper.findComponent(AccountModal);
    expect(modal.props('initialNumberOfShares')).toBeNull();
    expect(modal.props('accountId')).toBeUndefined();
  });

  it('re-emits save from AccountModal', async () => {
    const wrapper = mount(AccountEditModal, {
      props: { open: true, type: 'edit', item: account, ...base },
      global: { stubs: { AccountModal: true } },
    });
    wrapper.findComponent(AccountModal).vm.$emit('save', { name: 'x' });
    expect(wrapper.emitted('save')?.[0]).toStrictEqual([{ name: 'x' }]);
  });
});
