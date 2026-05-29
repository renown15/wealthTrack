import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { reactive } from 'vue';
import ManageFamilyModal from '@/views/Family/ManageFamilyModal.vue';
import type { FamilyState } from '@composables/useFamily';

const mockState = reactive<FamilyState>({
  family: null,
  availableMembers: [],
  loading: false,
  error: null,
});

const mockLoadFamily = vi.fn();
const mockCreateFamily = vi.fn();
const mockRenameFamily = vi.fn();
const mockDeleteFamily = vi.fn();
const mockLoadAvailableMembers = vi.fn();
const mockAddMember = vi.fn();
const mockRemoveMember = vi.fn();

vi.mock('@composables/useFamily', () => ({
  useFamily: () => ({
    state: mockState,
    loadFamily: mockLoadFamily,
    createFamily: mockCreateFamily,
    renameFamily: mockRenameFamily,
    deleteFamily: mockDeleteFamily,
    loadAvailableMembers: mockLoadAvailableMembers,
    addMember: mockAddMember,
    removeMember: mockRemoveMember,
  }),
}));

const mockFamily = {
  id: 1, name: 'The Smiths', ownerId: 100, isOwner: true,
  members: [
    { id: 1, accountId: 100, firstName: 'John', lastName: 'Smith', email: 'john@example.com' },
    { id: 2, accountId: 200, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
  ],
};

describe('ManageFamilyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFamily.mockResolvedValue(undefined);
    mockLoadAvailableMembers.mockResolvedValue(undefined);
    mockCreateFamily.mockResolvedValue(true);
    mockRenameFamily.mockResolvedValue(true);
    mockDeleteFamily.mockResolvedValue(true);
    mockAddMember.mockResolvedValue(true);
    mockRemoveMember.mockResolvedValue(true);
    mockState.family = null;
    mockState.availableMembers = [];
    mockState.loading = false;
    mockState.error = null;
  });

  it('shows create form when no family exists', async () => {
    const wrapper = mount(ManageFamilyModal, {
      props: { open: true, currentUserId: 100 },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("don't belong to a family");
  });

  describe('handleCreate', () => {
    it('calls createFamily with trimmed name', async () => {
      const wrapper = mount(ManageFamilyModal, {
        props: { open: true, currentUserId: 100 },
      });
      await flushPromises();
      await wrapper.find('input[type="text"]').setValue('  The Lewises  ');
      await wrapper.find('button.btn.btn-primary').trigger('click');
      await flushPromises();
      expect(mockCreateFamily).toHaveBeenCalledWith('The Lewises');
    });

    it('does not call createFamily when name is blank', async () => {
      const wrapper = mount(ManageFamilyModal, {
        props: { open: true, currentUserId: 100 },
      });
      await flushPromises();
      await wrapper.find('button.btn.btn-primary').trigger('click');
      expect(mockCreateFamily).not.toHaveBeenCalled();
    });
  });

  describe('startRename / handleRename', () => {
    it('shows rename input when Rename clicked', async () => {
      mockState.family = { ...mockFamily };
      const wrapper = mount(ManageFamilyModal, {
        props: { open: true, currentUserId: 100 },
      });
      await flushPromises();
      await wrapper.find('button.btn.btn-secondary').trigger('click');
      expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    });

    it('calls renameFamily with new name', async () => {
      mockState.family = { ...mockFamily };
      const wrapper = mount(ManageFamilyModal, {
        props: { open: true, currentUserId: 100 },
      });
      await flushPromises();
      await wrapper.find('button.btn.btn-secondary').trigger('click');
      await wrapper.find('input[type="text"]').setValue('The Joneses');
      await wrapper.find('button.btn.btn-primary.btn-sm').trigger('click');
      await flushPromises();
      expect(mockRenameFamily).toHaveBeenCalledWith('The Joneses');
    });
  });

  describe('handleDelete', () => {
    it('calls deleteFamily when Delete Family clicked', async () => {
      mockState.family = { ...mockFamily };
      const wrapper = mount(ManageFamilyModal, {
        props: { open: true, currentUserId: 100 },
      });
      await flushPromises();
      await wrapper.find('button.btn.btn-danger').trigger('click');
      await flushPromises();
      expect(mockDeleteFamily).toHaveBeenCalled();
    });
  });

  describe('handleAddMember', () => {
    it('calls addMember after selecting a member', async () => {
      mockState.family = { ...mockFamily };
      mockState.availableMembers = [
        { id: 300, firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
      ];
      const wrapper = mount(ManageFamilyModal, {
        props: { open: true, currentUserId: 100 },
      });
      await flushPromises();
      const selectEl = wrapper.find('select').element as HTMLSelectElement;
      selectEl.selectedIndex = 1;
      await wrapper.find('select').trigger('change');
      await wrapper.find('button.btn.btn-primary.btn-sm.flex-shrink-0').trigger('click');
      await flushPromises();
      expect(mockAddMember).toHaveBeenCalled();
    });

    it('add button is disabled when no member selected', async () => {
      mockState.family = { ...mockFamily };
      mockState.availableMembers = [
        { id: 300, firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
      ];
      const wrapper = mount(ManageFamilyModal, {
        props: { open: true, currentUserId: 100 },
      });
      await flushPromises();
      const addBtn = wrapper.find('button.btn.btn-primary.btn-sm.flex-shrink-0');
      expect(addBtn.attributes('disabled')).toBeDefined();
    });
  });

  describe('handleRemoveMember', () => {
    it('calls removeMember when delete button clicked for non-owner', async () => {
      mockState.family = { ...mockFamily };
      const wrapper = mount(ManageFamilyModal, {
        props: { open: true, currentUserId: 100 },
      });
      await flushPromises();
      const removeBtn = wrapper.find('button.btn-icon.delete');
      await removeBtn.trigger('click');
      await flushPromises();
      expect(mockRemoveMember).toHaveBeenCalledWith(2);
    });
  });

  describe('watch on open', () => {
    it('reloads when modal re-opens', async () => {
      const wrapper = mount(ManageFamilyModal, {
        props: { open: false, currentUserId: 100 },
      });
      await wrapper.setProps({ open: true });
      await flushPromises();
      expect(mockLoadFamily).toHaveBeenCalled();
    });
  });
});
