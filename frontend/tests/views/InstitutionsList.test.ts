import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InstitutionsList from '@/views/AccountHub/InstitutionsList.vue';
import type { Institution, PortfolioItem } from '@/models/WealthTrackDataModels';

describe('InstitutionsList', () => {
  const mockInstitutions: Institution[] = [
    { id: 1, userId: 1, name: 'Chase Bank', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    { id: 2, userId: 1, name: 'Wells Fargo', createdAt: '2025-01-02', updatedAt: '2025-01-02' },
  ];

  const mockPortfolioItems: PortfolioItem[] = [];

  it('does not render when institutions list is empty', () => {
    const wrapper = mount(InstitutionsList, {
      props: {
        institutions: [],
        portfolioItems: mockPortfolioItems,
        groupByParent: false,
      },
    });

    expect(wrapper.find('.institutions-section').exists()).toBe(false);
  });

  it('renders institutions when list is provided', () => {
    const wrapper = mount(InstitutionsList, {
      props: {
        institutions: mockInstitutions,
        portfolioItems: mockPortfolioItems,
        groupByParent: false,
      },
    });

    expect(wrapper.find('.institutions-section').exists()).toBe(true);
    expect(wrapper.text()).toContain('Chase Bank');
    expect(wrapper.text()).toContain('Wells Fargo');
  });

  it('emits editInstitution event when edit button clicked', async () => {
    const wrapper = mount(InstitutionsList, {
      props: {
        institutions: mockInstitutions,
        portfolioItems: mockPortfolioItems,
        groupByParent: false,
      },
    });

    const editButtons = wrapper.findAll('.btn-icon.edit');
    await editButtons[0].trigger('click');

    const emitted = wrapper.emitted('editInstitution');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toEqual(mockInstitutions[0]);
  });

  it('emits deleteInstitution event when delete button clicked', async () => {
    const wrapper = mount(InstitutionsList, {
      props: {
        institutions: mockInstitutions,
        portfolioItems: mockPortfolioItems,
        groupByParent: false,
      },
    });

    const deleteButtons = wrapper.findAll('.btn-icon.delete');
    await deleteButtons[0].trigger('click');

    const emitted = wrapper.emitted('deleteInstitution');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toBe(1);
    expect(emitted?.[0]?.[1]).toBe('Chase Bank');
  });
});
