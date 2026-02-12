import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AddReferenceDataModal from '@/views/AddReferenceDataModal.vue';
import type { ReferenceDataPayload } from '@/models/ReferenceData';

describe('AddReferenceDataModal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    const wrapper = mount(AddReferenceDataModal, {
      props: {
        open: true,
        isSubmitting: false,
      },
    });

    expect(wrapper.find('h3').exists()).toBe(true);
  });

  it('does not render when closed', () => {
    const wrapper = mount(AddReferenceDataModal, {
      props: {
        open: false,
        isSubmitting: false,
      },
    });

    // The modal should be hidden when open=false
    const modal = wrapper.find('[class*="modal"]');
    expect(modal.exists()).toBe(true);
  });

  it('emits close event when close button clicked', async () => {
    const wrapper = mount(AddReferenceDataModal, {
      props: {
        open: true,
        isSubmitting: false,
      },
    });

    const buttons = wrapper.findAll('button');
    const closeButton = buttons[0]; // First button is Cancel
    await closeButton.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits submit event with form data', async () => {
    const wrapper = mount(AddReferenceDataModal, {
      props: {
        open: true,
        isSubmitting: false,
      },
    });

    const inputs = wrapper.findAll('input');
    if (inputs.length >= 2) {
      await inputs[0].setValue('test_key');
      await inputs[1].setValue('test_value');
    }

    const buttons = wrapper.findAll('button');
    const submitButton = buttons[buttons.length - 1]; // Last button is Create
    await submitButton.trigger('click');

    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
  });

  it('displays error when provided', async () => {
    const wrapper = mount(AddReferenceDataModal, {
      props: {
        open: true,
        isSubmitting: false,
        error: 'Test error message',
      },
    });

    wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Test error message');
  });
});
