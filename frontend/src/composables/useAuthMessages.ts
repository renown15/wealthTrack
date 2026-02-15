import { reactive } from 'vue';

interface MessageState {
  text: string;
  type: 'error' | 'success';
}

interface UseAuthMessagesReturn {
  message: MessageState;
  clearMessage: () => void;
  showError: (text: string, timeoutMs?: number) => void;
  showSuccess: (text: string, timeoutMs?: number) => void;
}

/**
 * Message display and management composable
 * Handles auto-clearing messages with configurable timeout
 */
export function useAuthMessages(): UseAuthMessagesReturn {
  const message = reactive<MessageState>({
    text: '',
    type: 'error',
  });

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const clearMessage = (): void => {
    message.text = '';
  };

  const showError = (text: string, timeoutMs: number = 5000): void => {
    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    message.text = text;
    message.type = 'error';
    if (timeoutMs > 0) {
      timeoutId = setTimeout(clearMessage, timeoutMs);
    }
  };

  const showSuccess = (text: string, timeoutMs: number = 5000): void => {
    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    message.text = text;
    message.type = 'success';
    if (timeoutMs > 0) {
      timeoutId = setTimeout(clearMessage, timeoutMs);
    }
  };

  return {
    message,
    clearMessage,
    showError,
    showSuccess,
  };
}

