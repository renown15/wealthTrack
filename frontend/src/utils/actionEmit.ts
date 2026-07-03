import { getCurrentInstance, type ComponentInternalInstance } from 'vue';
import { debug } from '@/utils/debug';

/**
 * Guards against silently-dropped "action" emits.
 *
 * Vue discards a custom-event emit that has no matching `@listener` on the
 * parent — no error, no warning. vue-tsc doesn't catch it either (listeners are
 * optional by design). That let "Record Dividend" do nothing in the Tax Hub and
 * account transfers go unrefreshed in the Analytics/Outgoings modals.
 *
 * Wrap a component's `emit` with this for events that MUST cause an effect. If
 * such an event fires with no parent listener, we log a loud dev-mode error the
 * moment the action happens. It's precise by construction: it only triggers on a
 * real unheard emit, so runtime-gated buttons (shown only when their handler is
 * wired) never produce false positives — which is exactly why a static lint rule
 * can't do this job without an allowlist.
 *
 * Silent in production and in unit tests (which mount without a parent to assert
 * `emitted()`); only the dev build warns.
 */

/** Is there no `on<Event>` handler wired on this instance for `event`? Pure + env-independent so it can be unit-tested directly. */
export function isActionUnheard(instance: ComponentInternalInstance | null, event: string): boolean {
  const handlerProp = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
  return !instance?.vnode.props || !(handlerProp in instance.vnode.props);
}

type EmitFn = (event: string, ...args: unknown[]) => void;

// `E` is the specific (overloaded) emit type from defineEmits — left unconstrained
// so the typed signature is preserved for callers; we cast to EmitFn internally.
export function useActionEmit<E>(emit: E): E {
  const instance = getCurrentInstance();
  const guarded = (event: string, ...args: unknown[]): void => {
    if (import.meta.env.DEV && !import.meta.env.TEST && isActionUnheard(instance, event)) {
      const name = (instance?.type as { __name?: string })?.__name ?? 'component';
      debug.error(`[actionEmit] <${name}> emitted "${event}" but no parent listener is wired — the action did nothing.`);
    }
    (emit as EmitFn)(event, ...args);
  };
  return guarded as E;
}
