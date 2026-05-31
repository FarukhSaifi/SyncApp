import React, { useEffect } from "react";

import { MODAL_SIZE_CLASSES } from "@constants";
import type { ModalProps } from "@types";
import { FiX } from "react-icons/fi";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const activeSize = Object.prototype.hasOwnProperty.call(MODAL_SIZE_CLASSES, size) ? size : "md";
  const sizeClass = MODAL_SIZE_CLASSES[activeSize];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <Card className={`w-full ${sizeClass} mx-auto my-4 sm:my-8 max-h-[90vh] overflow-y-auto ${className}`}>
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

