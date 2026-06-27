import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TaxScopeModal from '@views/TaxHub/TaxScopeModal.vue';
import type { EligibleAccount } from '@/models/TaxModels';

const makeAccount = (note: string | null = null): EligibleAccount => ({
  accountId: 1, accountName: 'Savings', accountType: 'Savings Account',
  institutionName: 'Bank', interestRate: '2.0', accountStatus: 'Open',
  accountNumber: null, sortCode: null, rollRefNumber: null,
  eligibilityReason: 'interest_bearing', eventCount: 0, firstBalanceDate: null,
  taxReturn: note === null ? null : {
    id: 1, accountId: 1, taxPeriodId: 1, income: null, capitalGain: null,
    taxTakenOff: null, scope: 'Out of Scope', note,
    createdAt: '2025-01-01', updatedAt: '2025-01-01',
  },
  documents: [],
});

describe('TaxScopeModal', () => {
  it('prefills the textarea from the existing note', () => {
    const wrapper = mount(TaxScopeModal, { props: { open: true, account: makeAccount('Existing') } });
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Existing');
  });

  it('emits trimmed note on save', async () => {
    const wrapper = mount(TaxScopeModal, { props: { open: true, account: makeAccount() } });
    await wrapper.find('textarea').setValue('  Below threshold  ');
    await wrapper.findAll('button').find((b) => b.text() === 'Mark Out of Scope')?.trigger('click');
    expect(wrapper.emitted('save')?.[0]).toStrictEqual(['Below threshold']);
  });

  it('emits close when cancelled', async () => {
    const wrapper = mount(TaxScopeModal, { props: { open: true, account: makeAccount() } });
    await wrapper.findAll('button').find((b) => b.text() === 'Cancel')?.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
