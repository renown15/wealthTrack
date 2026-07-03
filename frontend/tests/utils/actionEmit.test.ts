import { describe, it, expect } from 'vitest';
import type { ComponentInternalInstance } from 'vue';
import { isActionUnheard } from '@/utils/actionEmit';

const instanceWith = (props: Record<string, unknown>) =>
  ({ vnode: { props } }) as unknown as ComponentInternalInstance;

describe('isActionUnheard', () => {
  it('reports heard when the matching on<Event> handler is present', () => {
    const inst = instanceWith({ onRecordDividend: () => {} });
    expect(isActionUnheard(inst, 'recordDividend')).toBe(false);
  });

  it('reports unheard when no handler is wired for the event', () => {
    const inst = instanceWith({ onClose: () => {} });
    expect(isActionUnheard(inst, 'recordDividend')).toBe(true);
  });

  it('capitalises the first letter only (matches Vue on-prop naming)', () => {
    const inst = instanceWith({ onTransferred: () => {} });
    expect(isActionUnheard(inst, 'transferred')).toBe(false);
  });

  it('treats a null instance as unheard', () => {
    expect(isActionUnheard(null, 'anything')).toBe(true);
  });

  it('treats missing vnode props as unheard', () => {
    expect(isActionUnheard(instanceWith(null as never), 'anything')).toBe(true);
  });
});
