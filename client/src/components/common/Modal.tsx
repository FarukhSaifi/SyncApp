import React, { useEffect } from "react";

import { KEYBOARD_KEYS, MODAL_BODY_OVERFLOW, MODAL_SIZE_CLASSES } from "@constants";
import type { ModalProps } from "@types";
import { FiX } from "react-icons/fi";

import { BUTTON_LABELS } from "@constants/messages";

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
  size = MODAL_BODY_OVERFLOW["DEFAULT_SIZE"],
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_KEYS["ESCAPE"]) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = MODAL_BODY_OVERFLOW["HIDDEN"];
    } else {
      document.body.style.overflow = MODAL_BODY_OVERFLOW["UNSET"];
    }
    return () => {
      document.body.style.overflow = MODAL_BODY_OVERFLOW["UNSET"];
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const activeSize = Object.prototype.hasOwnProperty.call(MODAL_SIZE_CLASSES, size)
    ? size
    : MODAL_BODY_OVERFLOW["DEFAULT_SIZE"];
  const sizeClass = MODAL_SIZE_CLASSES[activeSize];

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:p-4"
      onClick={handleOverlayClick}
    >
      <Card className={`mx-auto my-4 max-h-[min(90vh,100%)] w-full overflow-y-auto sm:my-8 ${sizeClass} ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
              {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
            </div>
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={BUTTON_LABELS["CLOSE_MODAL_ARIA"]}
              >
                <FiX className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className={footer ? "space-y-4" : ""}>{children}</CardContent>
        {footer ? <div className="px-6 pb-6 pt-0 border-t">{footer}</div> : null}
      </Card>
    </div>
  );
};

export default Modal;
