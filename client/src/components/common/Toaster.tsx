import React from "react";

import { APP_CONFIG, TOAST_UI } from "@constants";
import type { ToasterProps } from "@types";
import { Toaster as HotToaster, toast, type DefaultToastOptions, type ToastOptions } from "react-hot-toast";

import { ERROR_MESSAGES, INFO_MESSAGES, TOAST_TITLES } from "@constants/messages";

/** Base toast surface — uses CSS variables so light/dark theme switches apply automatically. */
const themedToastStyle: React.CSSProperties = {
  minWidth: APP_CONFIG.TOAST_MIN_WIDTH,
  maxWidth: APP_CONFIG.TOAST_MAX_WIDTH,
  background: TOAST_UI.BACKGROUND,
  color: TOAST_UI.COLOR,
  border: TOAST_UI.BORDER,
  borderRadius: TOAST_UI.BORDER_RADIUS,
  boxShadow: TOAST_UI.BOX_SHADOW,
  fontSize: TOAST_UI.FONT_SIZE,
  lineHeight: TOAST_UI.LINE_HEIGHT,
  padding: TOAST_UI.PADDING,
};

const themedToastBase: ToastOptions = {
  className: TOAST_UI.CLASS_NAME,
  style: themedToastStyle,
  duration: APP_CONFIG.TOAST_AUTO_CLOSE_DELAY,
};

const defaultToastOptions: DefaultToastOptions = {
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

/** App-wide toast host — defaults to top-right with themed SyncApp chrome. */
export const Toaster = ({
  position = TOAST_UI.DEFAULT_POSITION,
  toastOptions,
  reverseOrder,
  gutter,
  containerStyle,
  containerClassName,
}: ToasterProps) => {
  return (
    <HotToaster
      position={position}
      toastOptions={{ ...defaultToastOptions, ...toastOptions }}
      reverseOrder={reverseOrder}
      gutter={gutter}
      containerStyle={{ zIndex: TOAST_UI.Z_INDEX, ...containerStyle }}
      containerClassName={containerClassName}
    />
  );
};

/** Imperative toast helpers (success / error / warning / info / loading / promise). */
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
