import Button from "@components/common/Button";
import Modal from "@components/common/Modal";
import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

import { BUTTON_LABELS, BUTTON_VARIANTS, COLOR_CLASSES, INFO_MESSAGES, MODAL_TITLES } from "@constants";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
type ButtonVariant = (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
  size?: ModalSize;
}

/**
 * Reusable Confirmation Modal Component
 *
 * @param isOpen - Whether the modal is open
 * @param onClose - Function to call when modal is cancelled
 * @param onConfirm - Function to call when user confirms
 * @param title - Modal title (default: "Confirm Action")
 * @param message - Confirmation message
 * @param confirmText - Confirm button text (default: "Confirm")
 * @param cancelText - Cancel button text (default: "Cancel")
 * @param variant - Button variant for confirm (default: BUTTON_VARIANTS.DESTRUCTIVE)
 * @param isLoading - Show loading state on confirm button (default: false)
 * @param size - Modal size: 'sm' | 'md' | 'lg' (default: 'md')
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = MODAL_TITLES.CONFIRM_ACTION,
  message,
  confirmText = BUTTON_LABELS.CONFIRM,
  cancelText = BUTTON_LABELS.CANCEL,
  variant = BUTTON_VARIANTS.DESTRUCTIVE,
  isLoading = false,
  size = "md",
}: ConfirmationModalProps) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <div className="flex items-center justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? INFO_MESSAGES.PROCESSING : confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className="shrink-0">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${COLOR_CLASSES.ICON_BG.DESTRUCTIVE} flex items-center justify-center`}
          >
            <FiAlertTriangle className={`h-5 w-5 sm:h-6 sm:w-6 ${COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base text-foreground">{message}</div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
