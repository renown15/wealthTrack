import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import InstitutionModal from '@views/AccountHub/InstitutionModal.vue';
import type { Institution } from '@models/WealthTrackDataModels';
import type { ReferenceDataItem } from '@/models/ReferenceData';

const inst: Institution = {
  id: 1, userId: 1, name: 'Chase', parentId: null, institutionType: null,
  createdAt: '', updatedAt: '',
};
const instType: ReferenceDataItem = {
  id: 1, classKey: 'institution_type:bank', referenceValue: 'Bank', sortIndex: 1,
};

const defaultProps = {
  open: true,
  type: 'create' as const,
  institutions: [inst],
  institutionTypes: [instType],
};

describe('InstitutionModal', () => {
  it('shows "New Institution" title for create type', () => {
    const wrapper = mount(InstitutionModal, { props: defaultProps });
    expect(wrapper.text()).toContain('New Institution');
  });

  it('shows "Edit Institution" title for edit type', () => {
    const wrapper = mount(InstitutionModal, { props: { ...defaultProps, type: 'edit' } });
    expect(wrapper.text()).toContain('Edit Institution');
  });

  it('emits close when cancel button clicked', async () => {
    const wrapper = mount(InstitutionModal, { props: defaultProps });
    await wrapper.find('button.btn-modal-secondary').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('handleSave: no emit when name is empty', async () => {
    const wrapper = mount(InstitutionModal, { props: defaultProps });
    await wrapper.find('button.btn-primary').trigger('click');
    expect(wrapper.emitted('save')).toBeFalsy();
  });

  it('handleSave: emits save with name when name filled in', async () => {
    const wrapper = mount(InstitutionModal, { props: defaultProps });
    const input = wrapper.find('input#institution-name');
    await input.setValue('Barclays');
    await wrapper.find('button.btn-primary').trigger('click');
    const emitted = wrapper.emitted('save');
    expect(emitted).toBeTruthy();
    expect((emitted![0][0] as any).name).toBe('Barclays');
  });

  it('resets form data when open changes to true', async () => {
    const wrapper = mount(InstitutionModal, {
      props: { ...defaultProps, open: false, initialName: 'OldName' },
    });
    await wrapper.setProps({ open: true });
    await nextTick();
    // After re-opening, form should be reset to initial values
    const input = wrapper.find('input#institution-name');
    expect((input.element as HTMLInputElement).value).toBe('OldName');
  });
});
