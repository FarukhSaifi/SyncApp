import React from "react";
import { Toaster as HotToaster, toast } from "react-hot-toast";

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
      toastOptions={toastOptions}
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
        toast.success(message ? `${title}: ${message}` : title),
      error: (title: string, message?: string) => 
        toast.error(message ? `${title}: ${message}` : title),
      warning: (title: string, message?: string) => 
        toast.error(message ? `⚠️ ${title}: ${message}` : `⚠️ ${title}`), // react-hot-toast fallback
      info: (title: string, message?: string) => 
        toast(message ? `${title}: ${message}` : title, { icon: "ℹ️" }),
      loading: (title: string, message?: string) => 
        toast.loading(message ? `${title}: ${message}` : title),
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
        }
      ): Promise<T> => {
        return toast.promise(promise, {
          loading: messages.loadingMessage || messages.loading || "Loading...",
          success: messages.successMessage || messages.success || "Success!",
          error: messages.errorMessage || messages.error || "Operation failed!",
        });
      },
    }),
    []
  );
};
