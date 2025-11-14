import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

/**
 * Reusable Modal Component
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when modal should close
 * @param {string} title - Modal title
 * @param {string} description - Modal description (optional)
 * @param {ReactNode} children - Modal content
 * @param {ReactNode} footer - Footer content (buttons, etc.) (optional)
 * @param {string} size - Modal size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' (default: 'md')
 * @param {boolean} closeOnOverlayClick - Close modal when clicking overlay (default: true)
 * @param {boolean} closeOnEscape - Close modal on Escape key (default: true)
 * @param {boolean} showCloseButton - Show close button in header (default: true)
 * @param {string} className - Additional classes for the modal card
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
}) => {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <Card className={`w-full ${sizeClasses[size]} mx-auto my-4 sm:my-8 max-h-[90vh] overflow-y-auto ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
              {description && <CardDescription className="mt-1">{description}</CardDescription>}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-4 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <FiX className="h-5 w-5" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className={footer ? "space-y-4" : ""}>{children}</CardContent>
        {footer && <div className="px-6 pb-6 pt-0 border-t">{footer}</div>}
      </Card>
    </div>
  );
};

export default Modal;
