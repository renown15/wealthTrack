import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AddAccountModal from '@/views/AccountHub/AddAccountModal.vue';
import type { Institution } from '@/models/Portfolio';
import type { ReferenceDataItem } from '@/models/ReferenceData';

describe('AddAccountModal', () => {
  const mockInstitutions: Institution[] = [
    { id: 1, userId: 1, name: 'Chase Bank', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  ];
  const mockAccountTypes: ReferenceDataItem[] = [
    {
      id: 2,
      classKey: 'account_type:checking',
      referenceValue: 'Checking Account',
      sortIndex: 1,
    },
  ];
  const mockAccountStatuses: ReferenceDataItem[] = [
    {
      id: 3,
      classKey: 'account_status:active',
      referenceValue: 'Active',
      sortIndex: 1,
    },
  ];

  it('does not render when open is false', () => {
    const wrapper = mount(AddAccountModal, {
      props: {
        open: false,
        type: 'create',
        resourceType: 'account',
        institutions: mockInstitutions,
        accountTypes: mockAccountTypes,
        accountStatuses: mockAccountStatuses,
      },
    });

    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('renders create modal correctly', () => {
    const wrapper = mount(AddAccountModal, {
      props: {
        open: true,
        type: 'create',
        resourceType: 'account',
        institutions: mockInstitutions,
        accountTypes: mockAccountTypes,
        accountStatuses: mockAccountStatuses,
      },
    });

    expect(wrapper.text()).toContain('New Account');
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('select').exists()).toBe(true);
  });

  it('renders edit modal correctly', () => {
    const wrapper = mount(AddAccountModal, {
      props: {
        open: true,
        type: 'edit',
        resourceType: 'account',
        institutions: mockInstitutions,
        initialName: 'Existing Account',
        accountTypes: mockAccountTypes,
        accountStatuses: mockAccountStatuses,
      },
    });

    expect(wrapper.text()).toContain('Edit Account');
  });

  it('emits close event when Cancel clicked', async () => {
    const wrapper = mount(AddAccountModal, {
      props: {
        open: true,
        type: 'create',
        resourceType: 'account',
        institutions: mockInstitutions,
        accountTypes: mockAccountTypes,
        accountStatuses: mockAccountStatuses,
      },
    });

    const cancelBtn = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel');
    await cancelBtn?.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits save event with correct data when Create clicked', async () => {
    const wrapper = mount(AddAccountModal, {
      props: {
        open: true,
        type: 'create',
        resourceType: 'account',
        institutions: mockInstitutions,
        accountTypes: mockAccountTypes,
        accountStatuses: mockAccountStatuses,
      },
    });

    const input = wrapper.find('input');
    const instSelect = wrapper.find('select#institution-select');
    const typeSelect = wrapper.find('select#accountType');
    const statusSelect = wrapper.find('select#accountStatus');
    await input.setValue('My Checking');
    await instSelect.setValue('1');
    await typeSelect.setValue('2');
    await statusSelect.setValue('3');

    const createBtn = wrapper.findAll('button').find((btn) => btn.text() === 'Create');
    await createBtn?.trigger('click');

    const emitted = wrapper.emitted('save');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toEqual({
      name: 'My Checking',
      institutionId: 1,
      typeId: 2,
      statusId: 3,
    });
  });

  it('does not emit save if name is empty', async () => {
    const wrapper = mount(AddAccountModal, {
      props: {
        open: true,
        type: 'create',
        resourceType: 'account',
        institutions: mockInstitutions,
        accountTypes: mockAccountTypes,
        accountStatuses: mockAccountStatuses,
      },
    });

    const createBtn = wrapper.findAll('button').find((btn) => btn.text() === 'Create');
    await createBtn?.trigger('click');

    expect(wrapper.emitted('save')).toBeFalsy();
  });
});
