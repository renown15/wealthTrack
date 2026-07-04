import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('@composables/outgoingTypes', () => ({
  isOutgoingInstitution: (t: string | null | undefined) =>
    ['Utility Provider', 'Insurer', 'Subscription Service', 'Household', 'Memberships', 'School']
      .includes(t ?? ''),
}));

import InstitutionsPanel from '@/views/AccountHub/InstitutionsPanel.vue';
import type { Institution, PortfolioItem } from '@/models/WealthTrackDataModels';

const makeInstitution = (id: number, name: string): Institution => ({
  id, userId: 1, name, createdAt: '2025-01-01', updatedAt: '2025-01-01',
});

const makeItem = (institutionId: number): PortfolioItem => ({
  account: {
    id: institutionId * 10, userId: 1, institutionId,
    name: 'Account', typeId: 1, statusId: 1,
    openedAt: null, closedAt: null, createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
  institution: makeInstitution(institutionId, `Institution ${institutionId}`),
  latestBalance: null,
});

const defaultProps = {
  portfolioItems: [],
  allMembers: [],
  groupByParent: false,
  loading: false,
  readOnly: false,
  isAllTab: false,
};

describe('InstitutionsPanel hide inactive toggle', () => {
  it('hides institutions with no portfolio items by default', () => {
    const active = makeInstitution(1, 'Active Bank');
    const inactive = makeInstitution(2, 'Inactive Bank');
    const wrapper = mount(InstitutionsPanel, {
      props: {
        ...defaultProps,
        institutions: [active, inactive],
        portfolioItems: [makeItem(1)],
      },
    });
    expect(wrapper.text()).toContain('Active Bank');
    expect(wrapper.text()).not.toContain('Inactive Bank');
  });

  it('excludes Outgoings-hub provider institutions even when active', () => {
    const bank = makeInstitution(1, 'Active Bank');
    const provider: Institution = { ...makeInstitution(2, 'British Gas'), institutionType: 'Utility Provider' };
    const wrapper = mount(InstitutionsPanel, {
      props: {
        ...defaultProps,
        institutions: [bank, provider],
        portfolioItems: [makeItem(1), makeItem(2)], // both have accounts (active)
      },
    });
    expect(wrapper.text()).toContain('Active Bank');
    expect(wrapper.text()).not.toContain('British Gas');
  });

  it('shows all institutions when hide inactive is toggled off', async () => {
    const active = makeInstitution(1, 'Active Bank');
    const inactive = makeInstitution(2, 'Inactive Bank');
    const wrapper = mount(InstitutionsPanel, {
      props: {
        ...defaultProps,
        institutions: [active, inactive],
        portfolioItems: [makeItem(1)],
      },
    });
    const toggles = wrapper.findAll('button');
    const hideToggle = toggles.find((b) => b.attributes('title')?.includes('no accounts'));
    expect(hideToggle).toBeDefined();
    await hideToggle!.trigger('click');
    expect(wrapper.text()).toContain('Active Bank');
    expect(wrapper.text()).toContain('Inactive Bank');
  });

  it('shows all institutions when all have portfolio items', () => {
    const inst1 = makeInstitution(1, 'Bank One');
    const inst2 = makeInstitution(2, 'Bank Two');
    const wrapper = mount(InstitutionsPanel, {
      props: {
        ...defaultProps,
        institutions: [inst1, inst2],
        portfolioItems: [makeItem(1), makeItem(2)],
      },
    });
    expect(wrapper.text()).toContain('Bank One');
    expect(wrapper.text()).toContain('Bank Two');
  });

  it('keeps parent institution when it has no accounts but a child does', () => {
    const parent = makeInstitution(1, 'Parent Group');
    const child = { ...makeInstitution(2, 'Child Bank'), parentId: 1 };
    const wrapper = mount(InstitutionsPanel, {
      props: {
        ...defaultProps,
        institutions: [parent, child],
        portfolioItems: [makeItem(2)],
      },
    });
    expect(wrapper.text()).toContain('Parent Group');
    expect(wrapper.text()).toContain('Child Bank');
  });
});
