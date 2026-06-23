import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TextPromptModal from '@/components/TextPromptModal.vue';

const baseProps = {
  open: true,
  title: 'New Scenario',
  label: 'Name',
  modelValue: '',
  submitLabel: 'Create',
};

describe('TextPromptModal', () => {
  it('renders title, label and submit text when open', () => {
    const wrapper = mount(TextPromptModal, { props: baseProps });
    expect(wrapper.text()).toContain('New Scenario');
    expect(wrapper.text()).toContain('Name');
    expect(wrapper.text()).toContain('Create');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(TextPromptModal, { props: baseProps });
    await wrapper.find('input').setValue('Conservative');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Conservative']);
  });

  it('emits submit on Enter and on the primary button', async () => {
    const wrapper = mount(TextPromptModal, { props: { ...baseProps, modelValue: 'Plan' } });
    await wrapper.find('input').trigger('keyup.enter');
    await wrapper.find('.btn-primary').trigger('click');
    expect(wrapper.emitted('submit')).toHaveLength(2);
  });

  it('disables submit when the value is blank or whitespace', () => {
    const wrapper = mount(TextPromptModal, { props: { ...baseProps, modelValue: '   ' } });
    expect(wrapper.find('.btn-primary').attributes('disabled')).toBeDefined();
  });
});
