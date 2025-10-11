import React, { createContext, useCallback, useContext, useState } from "react";
import { FiAlertCircle, FiAlertTriangle, FiCheck, FiInfo, FiLoader, FiX } from "react-icons/fi";

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
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
          text: "text-green-800 dark:text-green-200",
          icon: "text-green-400 dark:text-green-500",
          iconBg: "bg-green-100 dark:bg-green-800/30",
          iconComponent: FiCheck,
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
          text: "text-red-800 dark:text-red-200",
          icon: "text-red-400 dark:text-red-500",
          iconBg: "bg-red-100 dark:bg-red-800/30",
          iconComponent: FiAlertCircle,
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
          text: "text-yellow-800 dark:text-yellow-200",
          icon: "text-yellow-400 dark:text-yellow-500",
          iconBg: "bg-yellow-100 dark:bg-yellow-800/30",
          iconComponent: FiAlertTriangle,
        };
      case "info":
        return {
          bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
          text: "text-blue-800 dark:text-blue-200",
          icon: "text-blue-400 dark:text-blue-500",
          iconBg: "bg-blue-100 dark:bg-blue-800/30",
          iconComponent: FiInfo,
        };
      case "loading":
        return {
          bg: "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800",
          text: "text-gray-800 dark:text-gray-200",
          icon: "text-gray-400 dark:text-gray-500",
          iconBg: "bg-gray-100 dark:bg-gray-800/30",
          iconComponent: FiLoader,
        };
      default:
        return {
          bg: "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800",
          text: "text-gray-800 dark:text-gray-200",
          icon: "text-gray-400 dark:text-gray-500",
          iconBg: "bg-gray-100 dark:bg-gray-800/30",
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
      style={{ minWidth: "320px", maxWidth: "480px" }}
    >
      <div className="flex items-start space-x-3">
        <div className={`${styles.iconBg} rounded-full p-2 flex-shrink-0`}>
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
            className={`${styles.text} opacity-70 hover:opacity-100 transition-opacity flex-shrink-0`}
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
  const { toasts } = useToaster();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
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
    }, 100);

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
