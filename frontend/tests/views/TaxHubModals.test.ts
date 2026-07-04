import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SetUtrModal from '@views/TaxHub/SetUtrModal.vue';
import TaxPeriodCommentaryModal from '@views/TaxHub/TaxPeriodCommentaryModal.vue';

beforeEach(() => {
  document.execCommand = vi.fn();
});

describe('SetUtrModal', () => {
  it('populates from the current UTR and emits it (trimmed) on save', async () => {
    const w = mount(SetUtrModal, { props: { open: true, utr: '1234567890' } });
    const input = w.find('input');
    expect((input.element as HTMLInputElement).value).toBe('1234567890');
    await input.setValue('  9999999999  ');
    await w.find('button.btn-primary').trigger('click');
    expect(w.emitted('save')?.[0]).toEqual(['9999999999']);
  });

  it('emits null when cleared', async () => {
    const w = mount(SetUtrModal, { props: { open: true, utr: '123' } });
    await w.find('input').setValue('');
    await w.find('button.btn-primary').trigger('click');
    expect(w.emitted('save')?.[0]).toEqual([null]);
  });
});

describe('TaxPeriodCommentaryModal', () => {
  it('loads the commentary and emits the draft on save', async () => {
    const w = mount(TaxPeriodCommentaryModal, {
      props: { open: true, periodName: '2025/26', commentary: '<p>hello</p>' },
    });
    expect(w.text()).toContain('2025/26');
    await w.find('button.btn-primary').trigger('click');
    expect(w.emitted('save')?.[0]).toEqual(['<p>hello</p>']);
  });

  it('emits close from Cancel', async () => {
    const w = mount(TaxPeriodCommentaryModal, {
      props: { open: true, periodName: 'X', commentary: '' },
    });
    await w.find('button.btn-modal-secondary').trigger('click');
    expect(w.emitted('close')).toBeTruthy();
  });
});
