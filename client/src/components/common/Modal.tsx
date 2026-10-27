import React, { useEffect } from "react";

import { KEYBOARD_KEYS, MODAL_BODY_OVERFLOW, MODAL_SIZE_CLASSES } from "@constants";
import type { ModalProps } from "@types";
import { FiX } from "react-icons/fi";

import { BUTTON_LABELS } from "@constants/messages";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

/**
 * Reusable Modal — sticky header/footer, scrollable body for larger sizes.
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
      className="fixed inset-0 z-1400 flex items-center justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:p-4"
      onClick={handleOverlayClick}
    >
      <Card
        className={`mx-auto my-3 flex max-h-[min(92vh,100%)] w-full flex-col overflow-hidden sm:my-6 ${sizeClass} ${className}`}
      >
        <CardHeader className="shrink-0 border-b border-border pb-3! sm:pb-4!">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
              {description ? (
                <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
              ) : null}
            </div>
            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={BUTTON_LABELS["CLOSE_MODAL_ARIA"]}
              >
                <FiX className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className={`min-h-0 flex-1 overflow-y-auto ${footer ? "space-y-4 pb-4!" : ""}`}>
          {children}
        </CardContent>
        {footer ? (
          <div className="shrink-0 border-t border-border bg-card px-3 pb-3 pt-3 sm:px-6 sm:pb-5 sm:pt-4">{footer}</div>
        ) : null}
      </Card>
    </div>
  );
};

export default Modal;
