"use client";

import type { SeoImproveReviewModalProps } from "@types";

import { BUTTON_SIZES, BUTTON_VARIANTS, MODAL_SIZES } from "@constants/designTokens";
import { SYNC_LABEL } from "@constants/messages";

import Button from "@components/common/Button";
import Modal from "@components/common/Modal";

/**
 * Review AI SEO snippet fixes before apply — never auto-writes into the editor.
 */
export default function SeoImproveReviewModal({
  isOpen,
  onClose,
  items,
  onToggleItem,
  onApply,
  isApplying = false,
}: SeoImproveReviewModalProps) {
  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={SYNC_LABEL["SEO_IMPROVE_REVIEW_TITLE"]}
      description={SYNC_LABEL["SEO_IMPROVE_REVIEW_DESC"]}
      size={MODAL_SIZES.TWO_XL}
      closeOnOverlayClick={!isApplying}
      closeOnEscape={!isApplying}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <Button variant={BUTTON_VARIANTS.OUTLINE} size={BUTTON_SIZES.SM} onClick={onClose} disabled={isApplying}>
            {SYNC_LABEL["SEO_IMPROVE_DISMISS"]}
          </Button>
          <Button
            variant={BUTTON_VARIANTS.DEFAULT}
            size={BUTTON_SIZES.SM}
            onClick={onApply}
            disabled={isApplying || selectedCount === 0}
          >
            {SYNC_LABEL["SEO_IMPROVE_APPLY_SELECTED"]}
            {selectedCount > 0 ? ` (${selectedCount})` : ""}
          </Button>
        </div>
      }
    >
      <ul className="max-h-[min(28rem,55vh)] space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-muted/20 p-3">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                checked={item.selected}
                onChange={() => onToggleItem(item.id)}
                disabled={isApplying}
              />
              <span className="min-w-0 flex-1 space-y-2">
                <span className="block text-xs font-semibold text-foreground">{item.issue}</span>
                {item.note ? <span className="block text-[11px] text-muted-foreground">{item.note}</span> : null}
                <span className="grid gap-2 sm:grid-cols-2">
                  <span className="space-y-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {SYNC_LABEL["SEO_IMPROVE_CURRENT"]}
                    </span>
                    <span className="block whitespace-pre-wrap wrap-break-word rounded-md border border-border bg-background p-2 text-[11px] text-muted-foreground">
                      {item.currentValue.trim() ? item.currentValue : SYNC_LABEL["SEO_IMPROVE_EMPTY_CURRENT"]}
                    </span>
                  </span>
                  <span className="space-y-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-warning">
                      {SYNC_LABEL["SEO_IMPROVE_PROPOSED"]}
                    </span>
                    <span className="block whitespace-pre-wrap wrap-break-word rounded-md border border-warning/30 bg-warning/5 p-2 text-[11px] text-foreground">
                      {item.value}
                    </span>
                  </span>
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
