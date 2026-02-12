import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountHubTable from '@/views/AccountHub/AccountHubTable.vue';
import type { PortfolioItem, Account, Institution, AccountEvent } from '@/models/WealthTrackDataModels';

describe('AccountHubTable', () => {
  const mockItems: PortfolioItem[] = [
    {
      account: {
        id: 1,
        userId: 1,
        institutionId: 1,
        name: 'Checking',
        typeId: 1,
        statusId: 1,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Account,
      institution: {
        id: 1,
        userId: 1,
        name: 'Chase Bank',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Institution,
      latestBalance: {
        id: 1,
        accountId: 1,
        userId: 1,
        eventType: 'balance_update',
        value: '5000.00',
        createdAt: '2025-01-15',
        updatedAt: '2025-01-15',
      } as AccountEvent,
      accountType: 'Checking Account',
      eventCount: 2,
    },
  ];

  it('renders accounts grid section', () => {
    const wrapper = mount(AccountHubTable, {
      props: {
        items: mockItems,
      },
    });

    expect(wrapper.text()).toContain('Institution');
    expect(wrapper.text()).toContain('Latest Balance');
  });

  it('displays account details correctly', () => {
    const wrapper = mount(AccountHubTable, {
      props: {
        items: mockItems,
      },
    });

    expect(wrapper.text()).toContain('Chase Bank');
    expect(wrapper.text()).toContain('£5,000.00');
    expect(wrapper.text()).toContain('Checking Account');
  });

  it('emits editAccount event when edit button clicked', async () => {
    const wrapper = mount(AccountHubTable, {
      props: {
        items: mockItems,
      },
    });

    const editBtn = wrapper.find('.btn-icon.edit');
    await editBtn.trigger('click');

    const emitted = wrapper.emitted('editAccount');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toEqual(mockItems[0].account);
  });

  it('emits deleteItem event when delete button clicked', async () => {
    const wrapper = mount(AccountHubTable, {
      props: {
        items: mockItems,
      },
    });

    const deleteBtn = wrapper.find('.btn-icon.delete');
    await deleteBtn.trigger('click');

    const emitted = wrapper.emitted('deleteItem');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual(['account', 1, 'Checking']);
  });

  it('handles empty items array', () => {
    const wrapper = mount(AccountHubTable, {
      props: {
        items: [],
      },
    });

    expect(wrapper.text()).toContain('Institution');
    expect(wrapper.findAll('tbody tr').length).toBe(0);
  });

  it('renders multiple accounts', () => {
    const items: PortfolioItem[] = [
      ...mockItems,
      {
        ...mockItems[0],
        account: { ...mockItems[0].account, id: 2, name: 'Savings' },
      },
    ];

    const wrapper = mount(AccountHubTable, {
      props: { items },
    });

    expect(wrapper.findAll('tbody tr').length).toBe(2);
    expect(wrapper.text()).toContain('Checking');
    expect(wrapper.text()).toContain('Savings');
  });

  it('emits showEvents when events button clicked', async () => {
    const wrapper = mount(AccountHubTable, {
      props: {
        items: mockItems,
      },
    });

    await wrapper.find('.btn-events').trigger('click');

    expect(wrapper.emitted('showEvents')).toBeTruthy();
    expect(wrapper.emitted('showEvents')?.[0]).toEqual([1, 'Checking', 2]);
  });

});
