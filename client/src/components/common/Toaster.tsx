import React from "react";

import { APP_CONFIG } from "@constants";
import { Toaster as HotToaster, toast } from "react-hot-toast";


const TOAST_DURATION = APP_CONFIG.TOAST_AUTO_CLOSE_DELAY;

const defaultToastOptions: React.ComponentProps<typeof HotToaster>["toastOptions"] = {
  duration: TOAST_DURATION,
  style: {
    minWidth: APP_CONFIG.TOAST_MIN_WIDTH,
    maxWidth: APP_CONFIG.TOAST_MAX_WIDTH,
  },
  success: { duration: TOAST_DURATION },
  error: { duration: TOAST_DURATION },
  blank: { duration: TOAST_DURATION },
  custom: { duration: TOAST_DURATION },
  loading: { duration: Infinity },
};

// Custom wrapper to default Toast position to top-right
export const Toaster = ({
  position = "top-right",
  toastOptions,
  reverseOrder,
  gutter,
  containerStyle,
  containerClassName,
}: React.ComponentProps<typeof HotToaster>) => {
  return (
    <HotToaster
      position={position}
      toastOptions={{ ...defaultToastOptions, ...toastOptions }}
      reverseOrder={reverseOrder}
      gutter={gutter}
      containerStyle={containerStyle}
      containerClassName={containerClassName}
    />
  );
};

// Dummy ToasterProvider since react-hot-toast handles global state automatically
export const ToasterProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Adapter hook mapping ToasterContextValue to react-hot-toast
export const useToaster = () => {
  return React.useMemo(
    () => ({
      success: (title: string, message?: string) =>
        toast.success(message ? `${title}: ${message}` : title, { duration: TOAST_DURATION }),
      error: (title: string, message?: string) =>
        toast.error(message ? `${title}: ${message}` : title, { duration: TOAST_DURATION }),
      warning: (title: string, message?: string) =>
        toast.error(message ? `⚠️ ${title}: ${message}` : `⚠️ ${title}`, { duration: TOAST_DURATION }),
      info: (title: string, message?: string) =>
        toast(message ? `${title}: ${message}` : title, { icon: "ℹ️", duration: TOAST_DURATION }),
      loading: (title: string, message?: string) => toast.loading(message ? `${title}: ${message}` : title),
      removeToast: (id: string) => toast.dismiss(id),
      dismiss: (id: string) => toast.dismiss(id),
      promise: <T,>(
        promise: Promise<T>,
        messages: {
          loading?: string;
          loadingMessage?: string;
          success?: string;
          successMessage?: string;
          error?: string;
          errorMessage?: string;
        },
      ): Promise<T> => {
        return toast.promise(promise, {
          loading: messages.loadingMessage || messages.loading || "Loading...",
          success: messages.successMessage || messages.success || "Success!",
          error: messages.errorMessage || messages.error || "Operation failed!",
        });
      },
    }),
    [],
  );
};
