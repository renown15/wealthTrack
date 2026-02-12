import { ref, type Ref } from 'vue';
import type { AccountEvent } from '@/models/WealthTrackDataModels';
import { apiService } from '@/services/ApiService';

export interface UseEventsModalReturn {
  eventsModalOpen: Ref<boolean>;
  eventsTitle: Ref<string>;
  eventsLoading: Ref<boolean>;
  eventsError: Ref<string | undefined>;
  events: Ref<AccountEvent[]>;
  openEventsModal: (accountId: number, accountName: string) => Promise<void>;
  closeEventsModal: () => void;
}

export function useEventsModal(): UseEventsModalReturn {
  const eventsModalOpen = ref(false);
  const eventsTitle = ref('');
  const eventsLoading = ref(false);
  const eventsError = ref<string | undefined>(undefined);
  const events = ref<AccountEvent[]>([]);

  const openEventsModal = async (
    accountId: number,
    accountName: string,
  ): Promise<void> => {
    eventsModalOpen.value = true;
    eventsTitle.value = `${accountName} · Events`;
    eventsLoading.value = true;
    eventsError.value = undefined;
    events.value = [];

    try {
      events.value = await apiService.getAccountEvents(accountId);
    } catch (error) {
      eventsError.value = error instanceof Error ? error.message : 'Unable to load events';
    } finally {
      eventsLoading.value = false;
    }
  };

  const closeEventsModal = (): void => {
    eventsModalOpen.value = false;
    events.value = [];
    eventsError.value = undefined;
  };

  return {
    eventsModalOpen,
    eventsTitle,
    eventsLoading,
    eventsError,
    events,
    openEventsModal,
    closeEventsModal,
  };
}
