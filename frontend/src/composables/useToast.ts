/**
 * Toast notification composable - wrapper around vue-toastification.
 */
import { useToast as useVueToast, POSITION } from 'vue-toastification';
import type { PluginOptions } from 'vue-toastification';

// Default toast options
export const toastOptions: PluginOptions = {
  position: POSITION.TOP_RIGHT,
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
};

interface ToastMethods {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  dismiss: (id?: number | string) => void;
}

export function useToast(): ToastMethods {
  const toast = useVueToast();

  return {
    showSuccess: (message: string): void => { toast.success(message); },
    showError: (message: string): void => { toast.error(message); },
    showWarning: (message: string): void => { toast.warning(message); },
    showInfo: (message: string): void => { toast.info(message); },
    dismiss: (id?: number | string): void => {
      if (id) toast.dismiss(id);
      else toast.clear();
    },
  };
}
