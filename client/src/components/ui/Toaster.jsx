import React, { createContext, useCallback, useContext, useState } from "react";
import { FiAlertCircle, FiAlertTriangle, FiCheck, FiInfo, FiLoader, FiX } from "react-icons/fi";
import { APP_CONFIG } from "../../constants";

const ToasterContext = createContext();

export const useToaster = () => {
  const context = useContext(ToasterContext);
  if (!context) {
    throw new Error("useToaster must be used within a ToasterProvider");
  }
  return context;
};

const Toast = ({ toast, onRemove }) => {
  const getToastStyles = (type) => {
    const grayBg = "bg-muted/95 border border-border dark:bg-muted/95 dark:border-border";
    switch (type) {
      case "success":
        return {
          bg: `${grayBg} border-l-4 border-l-positive`,
          text: "text-positive dark:text-positive",
          icon: "text-positive",
          iconBg: "bg-positive/20 dark:bg-positive/30",
          iconComponent: FiCheck,
        };
      case "error":
        return {
          bg: `${grayBg} border-l-4 border-l-destructive`,
          text: "text-destructive dark:text-destructive",
          icon: "text-destructive",
          iconBg: "bg-destructive/20 dark:bg-destructive/30",
          iconComponent: FiAlertCircle,
        };
      case "warning":
        return {
          bg: `${grayBg} border-l-4 border-l-warning`,
          text: "text-warning dark:text-warning",
          icon: "text-warning",
          iconBg: "bg-warning/20 dark:bg-warning/30",
          iconComponent: FiAlertTriangle,
        };
      case "info":
        return {
          bg: `${grayBg} border-l-4 border-l-primary`,
          text: "text-primary dark:text-primary",
          icon: "text-primary",
          iconBg: "bg-primary/20 dark:bg-primary/30",
          iconComponent: FiInfo,
        };
      case "loading":
        return {
          bg: grayBg,
          text: "text-foreground dark:text-foreground",
          icon: "text-muted-foreground",
          iconBg: "bg-muted dark:bg-muted",
          iconComponent: FiLoader,
        };
      default:
        return {
          bg: grayBg,
          text: "text-foreground dark:text-foreground",
          icon: "text-muted-foreground",
          iconBg: "bg-muted dark:bg-muted",
          iconComponent: FiInfo,
        };
    }
  };

  const styles = getToastStyles(toast.type);
  const IconComponent = styles.iconComponent;

  return (
    <div
      className={`${styles.bg} border rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out transform ${
        toast.visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
      style={{ minWidth: APP_CONFIG.TOAST_MIN_WIDTH, maxWidth: APP_CONFIG.TOAST_MAX_WIDTH }}
    >
      <div className="flex items-start space-x-3">
        <div className={`${styles.iconBg} rounded-full p-2 shrink-0`}>
          <IconComponent className={`h-5 w-5 ${styles.icon} ${toast.type === "loading" ? "animate-spin" : ""}`} />
        </div>

        <div className="flex-1 min-w-0">
          {toast.title && <div className={`font-medium text-sm ${styles.text}`}>{toast.title}</div>}
          {toast.message && <div className={`text-sm mt-1 ${styles.text} opacity-90`}>{toast.message}</div>}
          {toast.action && <div className="mt-2">{toast.action}</div>}
        </div>

        {!toast.persistent && (
          <button
            onClick={() => onRemove(toast.id)}
            className={`${styles.text} opacity-70 hover:opacity-100 transition-opacity shrink-0`}
            aria-label="Close notification"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const Toaster = () => {
  const { toasts, removeToast } = useToaster();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export const ToasterProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      ...toast,
      id,
      visible: false,
      type: toast.type || "info",
      duration: toast.duration || (toast.type === "loading" ? 0 : 5000),
      persistent: toast.persistent || false,
    };

    setToasts((prev) => [...prev, newToast]);

    // Animate in
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: true } : t)));
    }, APP_CONFIG.TOAST_AUTO_CLOSE_DELAY);

    // Auto-remove toast after specified duration (unless persistent or loading)
    if (!newToast.persistent && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    // Animate out
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));

    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (title, message, options = {}) => addToast({ type: "success", title, message, ...options }),
    [addToast]
  );

  const error = useCallback(
    (title, message, options = {}) => addToast({ type: "error", title, message, ...options }),
    [addToast]
  );

  const warning = useCallback(
    (title, message, options = {}) => addToast({ type: "warning", title, message, ...options }),
    [addToast]
  );

  const info = useCallback(
    (title, message, options = {}) => addToast({ type: "info", title, message, ...options }),
    [addToast]
  );

  const loading = useCallback(
    (title, message, options = {}) => addToast({ type: "loading", title, message, persistent: true, ...options }),
    [addToast]
  );

  const promise = useCallback(
    (promise, messages) => {
      const loadingId = loading(messages.loading || "Loading...", messages.loadingMessage || "Please wait...");

      return promise
        .then((result) => {
          removeToast(loadingId);
          success(messages.success || "Success", messages.successMessage || "Operation completed successfully!");
          return result;
        })
        .catch((error) => {
          removeToast(loadingId);
          error(messages.error || "Error", messages.errorMessage || error.message || "Operation failed!");
          throw error;
        });
    },
    [loading, success, error, removeToast]
  );

  const value = {
    toasts,
    addToast,
    removeToast,
    updateToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    loading,
    promise,
  };

  return <ToasterContext.Provider value={value}>{children}</ToasterContext.Provider>;
};
