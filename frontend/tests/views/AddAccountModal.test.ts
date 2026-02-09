import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AddAccountModal from '@/views/AccountHub/AddAccountModal.vue';
import type { Institution } from '@/models/Portfolio';

describe('AddAccountModal', () => {
  const mockInstitutions: Institution[] = [
    { id: 1, userId: 1, name: 'Chase Bank', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  ];

  it('does not render when open is false', () => {
    const wrapper = mount(AddAccountModal, {
      props: {
        open: false,
        type: 'create',
        resourceType: 'account',
        institutions: mockInstitutions,
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
      },
    });

    const input = wrapper.find('input');
    const select = wrapper.find('select');
    await input.setValue('My Checking');
    await select.setValue('1');

    const createBtn = wrapper.findAll('button').find((btn) => btn.text() === 'Create');
    await createBtn?.trigger('click');

    const emitted = wrapper.emitted('save');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toBe('My Checking');
    expect(emitted?.[0]?.[1]).toBe(1);
  });

  it('does not emit save if name is empty', async () => {
    const wrapper = mount(AddAccountModal, {
      props: {
        open: true,
        type: 'create',
        resourceType: 'account',
        institutions: mockInstitutions,
      },
    });

    const createBtn = wrapper.findAll('button').find((btn) => btn.text() === 'Create');
    await createBtn?.trigger('click');

    expect(wrapper.emitted('save')).toBeFalsy();
  });
});
