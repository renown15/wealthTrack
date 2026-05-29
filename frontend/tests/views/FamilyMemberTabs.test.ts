import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FamilyMemberTabs from '@views/AccountHub/FamilyMemberTabs.vue';
import type { FamilyMember } from '@/models/family';
import type { TabMode } from '@/composables/useFamilyTabs';

const mockMembers: FamilyMember[] = [
  { id: 1, accountId: 10, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
  { id: 2, accountId: 11, firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
];

describe('FamilyMemberTabs', () => {
  it('renders Me and All tabs', () => {
    const wrapper = mount(FamilyMemberTabs, { props: { members: [], activeId: null } });
    expect(wrapper.text()).toContain('Me');
    expect(wrapper.text()).toContain('All');
  });

  it('renders member tabs', () => {
    const wrapper = mount(FamilyMemberTabs, { props: { members: mockMembers, activeId: null } });
    expect(wrapper.text()).toContain('Alice Smith');
    expect(wrapper.text()).toContain('Bob Jones');
  });

  it('Me tab has active class when activeId is null', () => {
    const wrapper = mount(FamilyMemberTabs, { props: { members: [], activeId: null } });
    const meBtn = wrapper.findAll('button').find((b) => b.text() === 'Me');
    expect(meBtn?.classes()).toContain('text-blue-600');
  });

  it('All tab has active class when activeId is all', () => {
    const activeId: TabMode = 'all';
    const wrapper = mount(FamilyMemberTabs, { props: { members: [], activeId } });
    const allBtn = wrapper.findAll('button').find((b) => b.text() === 'All');
    expect(allBtn?.classes()).toContain('text-blue-600');
  });

  it('member tab has active class when activeId matches accountId', () => {
    const activeId: TabMode = 10;
    const wrapper = mount(FamilyMemberTabs, { props: { members: mockMembers, activeId } });
    const aliceBtn = wrapper.findAll('button').find((b) => b.text() === 'Alice Smith');
    expect(aliceBtn?.classes()).toContain('text-blue-600');
  });

  it('inactive tabs do not have active class', () => {
    const wrapper = mount(FamilyMemberTabs, { props: { members: mockMembers, activeId: null } });
    const allBtn = wrapper.findAll('button').find((b) => b.text() === 'All');
    expect(allBtn?.classes()).not.toContain('text-blue-600');
  });

  it('emits select with null when Me clicked', async () => {
    const wrapper = mount(FamilyMemberTabs, { props: { members: [], activeId: 'all' as TabMode } });
    await wrapper.findAll('button').find((b) => b.text() === 'Me')?.trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual([null]);
  });

  it('emits select with all when All clicked', async () => {
    const wrapper = mount(FamilyMemberTabs, { props: { members: [], activeId: null } });
    await wrapper.findAll('button').find((b) => b.text() === 'All')?.trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual(['all']);
  });

  it('emits select with accountId when member tab clicked', async () => {
    const wrapper = mount(FamilyMemberTabs, { props: { members: mockMembers, activeId: null } });
    await wrapper.findAll('button').find((b) => b.text() === 'Alice Smith')?.trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual([10]);
  });
});
