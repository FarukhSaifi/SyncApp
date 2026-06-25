import React from "react";

import { APP_CONFIG } from "@constants";
import { Toaster as HotToaster, toast, type ToastOptions } from "react-hot-toast";

import { ERROR_MESSAGES, INFO_MESSAGES, TOAST_TITLES } from "@constants/messages";

const TOAST_DURATION = APP_CONFIG.TOAST_AUTO_CLOSE_DELAY;
export const SYNCAPP_TOAST_CLASS = "syncapp-toast";

/** Base toast surface — uses CSS variables so light/dark theme switches apply automatically. */
const themedToastStyle: React.CSSProperties = {
  minWidth: APP_CONFIG.TOAST_MIN_WIDTH,
  maxWidth: APP_CONFIG.TOAST_MAX_WIDTH,
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  boxShadow: "0 4px 12px hsl(0 0% 0% / 0.12)",
  fontSize: "0.875rem",
  lineHeight: "1.25rem",
  padding: "12px 16px",
};

const themedToastBase: ToastOptions = {
  className: SYNCAPP_TOAST_CLASS,
  style: themedToastStyle,
  duration: TOAST_DURATION,
};

const defaultToastOptions: React.ComponentProps<typeof HotToaster>["toastOptions"] = {
  ...themedToastBase,
  success: {
    ...themedToastBase,
    iconTheme: {
      primary: "hsl(var(--positive))",
      secondary: "hsl(var(--positive-foreground))",
    },
  },
  error: {
    ...themedToastBase,
    iconTheme: {
      primary: "hsl(var(--destructive))",
      secondary: "hsl(var(--destructive-foreground))",
    },
  },
  blank: { ...themedToastBase },
  custom: { ...themedToastBase },
  loading: {
    ...themedToastBase,
    duration: Infinity,
    iconTheme: {
      primary: "hsl(var(--primary))",
      secondary: "hsl(var(--primary-foreground))",
    },
  },
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
      containerStyle={{ zIndex: 99999, ...containerStyle }}
      containerClassName={containerClassName}
    />
  );
};

export const useToaster = () => {
  return React.useMemo(
    () => ({
      success: (title: string, message?: string) =>
        toast.success(message ? `${title}: ${message}` : title, defaultToastOptions?.success),
      error: (title: string, message?: string) =>
        toast.error(message ? `${title}: ${message}` : title, defaultToastOptions?.error),
      warning: (title: string, message?: string) =>
        toast(message ? `⚠️ ${title}: ${message}` : `⚠️ ${title}`, {
          ...themedToastBase,
          iconTheme: {
            primary: "hsl(var(--warning))",
            secondary: "hsl(var(--warning-foreground))",
          },
        }),
      info: (title: string, message?: string) =>
        toast(message ? `${title}: ${message}` : title, {
          ...themedToastBase,
          icon: "ℹ️",
          iconTheme: {
            primary: "hsl(var(--accent))",
            secondary: "hsl(var(--accent-foreground))",
          },
        }),
      loading: (title: string, message?: string) =>
        toast.loading(message ? `${title}: ${message}` : title, defaultToastOptions?.loading),
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
        return toast.promise(
          promise,
          {
            loading: messages.loadingMessage || messages.loading || INFO_MESSAGES.LOADING,
            success: messages.successMessage || messages.success || TOAST_TITLES.SUCCESS,
            error: messages.errorMessage || messages.error || ERROR_MESSAGES.OPERATION_FAILED,
          },
          {
            ...themedToastBase,
            success: defaultToastOptions?.success,
            error: defaultToastOptions?.error,
            loading: defaultToastOptions?.loading,
          },
        );
      },
    }),
    [],
  );
};
