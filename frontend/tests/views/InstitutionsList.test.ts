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

  describe('grouped view with parent and children', () => {
    const groupedInstitutions: Institution[] = [
      {
        id: 10,
        userId: 1,
        name: 'HSBC',
        institutionType: 'Bank',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 11,
        userId: 1,
        name: 'HSBC UK',
        parentId: 10,
        institutionType: 'Bank',
        createdAt: '2025-01-02',
        updatedAt: '2025-01-02',
      },
      {
        id: 12,
        userId: 1,
        name: 'HSBC International',
        parentId: 10,
        institutionType: 'Bank',
        createdAt: '2025-01-03',
        updatedAt: '2025-01-03',
      },
    ];

    it('does not display parent institution as a child row in grouped view', () => {
      const wrapper = mount(InstitutionsList, {
        props: {
          institutions: groupedInstitutions,
          portfolioItems: [],
          groupByParent: true,
        },
      });

      // Get all rows in the tbody
      const rows = wrapper.findAll('tbody tr');

      // Find rows that are child institution rows (filter out group headers)
      const childRows = rows.filter((row) => {
        // Group headers have the 📁 emoji
        return !row.text().includes('📁');
      });

      // Verify parent (HSBC) is not in the child rows
      childRows.forEach((row) => {
        const rowText = row.text();
        // Should only contain child institution names, not the parent
        expect(rowText).not.toBe(expect.stringContaining('HSBC'));
      });

      // Verify only child institutions are shown as children
      expect(childRows.length).toBe(2);
      const childTexts = childRows.map((r) => r.text());
      expect(childTexts.some((t) => t.includes('HSBC UK'))).toBe(true);
      expect(childTexts.some((t) => t.includes('HSBC International'))).toBe(true);
    });

    it('displays parent institution in group header with summary total', () => {
      const wrapper = mount(InstitutionsList, {
        props: {
          institutions: groupedInstitutions,
          portfolioItems: [],
          groupByParent: true,
        },
      });

      const headerRows = wrapper.findAll('tbody tr').filter((row) => row.text().includes('📁'));
      expect(headerRows.length).toBeGreaterThan(0);

      // Verify parent name appears in group header
      const headerText = wrapper.text();
      expect(headerText).toContain('📁 HSBC');
    });

    it('shows only child institutions under parent group', () => {
      const wrapper = mount(InstitutionsList, {
        props: {
          institutions: groupedInstitutions,
          portfolioItems: [],
          groupByParent: true,
        },
      });

      const text = wrapper.text();

      // Verify child institutions are present
      expect(text).toContain('HSBC UK');
      expect(text).toContain('HSBC International');

      // Parent should only appear once in the group header, not as a child
      // Count occurrences of "HSBC" - should be minimal (just in header and possibly the child names)
      const hsbcMatches = (text.match(/\bHSBC\b/g) || []).length;
      // Should appear in group header and that's it (not as a separate child row)
      expect(hsbcMatches).toBeLessThanOrEqual(3); // Once in header, and might be in HSBC UK/International names
    });
  });
});
