import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

/**
 * Reusable Modal Component
 *
 * @param isOpen - Whether the modal is open
 * @param onClose - Function to call when modal should close
 * @param title - Modal title
 * @param description - Modal description (optional)
 * @param children - Modal content
 * @param footer - Footer content (buttons, etc.) (optional)
 * @param size - Modal size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' (default: 'md')
 * @param closeOnOverlayClick - Close modal when clicking overlay (default: true)
 * @param closeOnEscape - Close modal on Escape key (default: true)
 * @param showCloseButton - Show close button in header (default: true)
 * @param className - Additional classes for the modal card
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
}: ModalProps) => {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
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

  const sizeClasses: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
                className="ml-4 text-muted-foreground hover:text-foreground transition-colors shrink-0"
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
