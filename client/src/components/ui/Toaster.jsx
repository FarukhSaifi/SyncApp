import React, { createContext, useContext, useState } from "react";
import { FiCheck, FiX, FiAlertCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

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
          bg: "bg-green-50 border-green-200",
          text: "text-green-800",
          icon: "text-green-400",
          iconBg: "bg-green-100",
          iconComponent: FiCheck,
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          text: "text-red-800",
          icon: "text-red-400",
          iconBg: "bg-red-100",
          iconComponent: FiAlertCircle,
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          text: "text-yellow-800",
          icon: "text-yellow-400",
          iconBg: "bg-yellow-100",
          iconComponent: FiAlertTriangle,
        };
      case "info":
        return {
          bg: "bg-blue-50 border-blue-200",
          text: "text-blue-800",
          icon: "text-blue-400",
          iconBg: "bg-blue-100",
          iconComponent: FiInfo,
        };
      default:
        return {
          bg: "bg-gray-50 border-gray-200",
          text: "text-gray-800",
          icon: "text-gray-400",
          iconBg: "bg-gray-100",
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
          <IconComponent className={`h-5 w-5 ${styles.icon}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className={`font-medium text-sm ${styles.text}`}>
              {toast.title}
            </div>
          )}
          {toast.message && (
            <div className={`text-sm mt-1 ${styles.text} opacity-90`}>
              {toast.message}
            </div>
          )}
        </div>
        
        <button
          onClick={() => onRemove(toast.id)}
          className={`${styles.text} opacity-70 hover:opacity-100 transition-opacity flex-shrink-0`}
        >
          <FiX className="h-4 w-4" />
        </button>
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

  const addToast = (toast) => {
    const id = Date.now();
    const newToast = { 
      ...toast, 
      id,
      visible: false,
      type: toast.type || "info"
    };
    
    setToasts((prev) => [...prev, newToast]);

    // Animate in
    setTimeout(() => {
      setToasts((prev) => 
        prev.map((t) => 
          t.id === id ? { ...t, visible: true } : t
        )
      );
    }, 100);

    // Auto-remove toast after specified duration (default: 5 seconds)
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    // Animate out
    setToasts((prev) => 
      prev.map((t) => 
        t.id === id ? { ...t, visible: false } : t
      )
    );
    
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  // Convenience methods
  const success = (title, message, duration) => 
    addToast({ type: "success", title, message, duration });
  
  const error = (title, message, duration) => 
    addToast({ type: "error", title, message, duration });
  
  const warning = (title, message, duration) => 
    addToast({ type: "warning", title, message, duration });
  
  const info = (title, message, duration) => 
    addToast({ type: "info", title, message, duration });

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return <ToasterContext.Provider value={value}>{children}</ToasterContext.Provider>;
};
