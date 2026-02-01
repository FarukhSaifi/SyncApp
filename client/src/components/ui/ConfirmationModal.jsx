import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { COLOR_CLASSES } from "../../constants";
import Button from "./Button";
import Modal from "./Modal";

/**
 * Reusable Confirmation Modal Component
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when modal is cancelled
 * @param {function} onConfirm - Function to call when user confirms
 * @param {string} title - Modal title (default: "Confirm Action")
 * @param {string|ReactNode} message - Confirmation message
 * @param {string} confirmText - Confirm button text (default: "Confirm")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {string} variant - Button variant for confirm: 'default' | 'destructive' (default: 'destructive')
 * @param {boolean} isLoading - Show loading state on confirm button (default: false)
 * @param {string} size - Modal size: 'sm' | 'md' | 'lg' (default: 'md')
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false,
  size = "md",
}) => {
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
            {isLoading ? "Processing..." : confirmText}
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
