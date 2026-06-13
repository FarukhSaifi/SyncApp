"use client";

import { useEffect, useMemo, useState } from "react";

import { APP_CONFIG } from "@constants";
import { EDITOR_UI } from "@constants/messages";
import dayjs from "dayjs";
import { FiClock } from "react-icons/fi";

import Button from "@components/common/Button";
import Modal from "@components/common/Modal";

export interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledFor: string;
  onScheduleChange: (value: string) => void;
  isPublished?: boolean;
}

export default function SchedulePostModal({
  isOpen,
  onClose,
  scheduledFor,
  onScheduleChange,
  isPublished = false,
}: SchedulePostModalProps) {
  const [draftDateTime, setDraftDateTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraftDateTime(scheduledFor ? dayjs(scheduledFor).format("YYYY-MM-DDTHH:mm") : "");
    setError(null);
  }, [isOpen, scheduledFor]);

  const minDateTime = useMemo(() => dayjs().format("YYYY-MM-DDTHH:mm"), [isOpen]);

  const handleConfirm = () => {
    if (isPublished) {
      setError(EDITOR_UI.SCHEDULE_MODAL_PUBLISHED_DISABLED);
      return;
    }
    if (!draftDateTime) {
      setError(EDITOR_UI.SCHEDULE_MODAL_NO_DATE);
      return;
    }
    const selected = dayjs(draftDateTime);
    if (!selected.isAfter(dayjs())) {
      setError(EDITOR_UI.SCHEDULE_MODAL_PAST_DATE);
      return;
    }
    onScheduleChange(selected.toISOString());
    onClose();
  };

  const handleClear = () => {
    onScheduleChange("");
    onClose();
  };

  const previewDate =
    draftDateTime && dayjs(draftDateTime).isAfter(dayjs())
      ? dayjs(draftDateTime).format(APP_CONFIG.DATE_FORMAT_WITH_TIME)
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={EDITOR_UI.SCHEDULE_MODAL_TITLE}
      description={EDITOR_UI.SCHEDULE_MODAL_DESC}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-between sm:items-center">
          {scheduledFor ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={isPublished}>
              {EDITOR_UI.SCHEDULE_MODAL_CLEAR}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {EDITOR_UI.SCHEDULE_MODAL_CANCEL}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleConfirm} disabled={isPublished}>
              <FiClock className="h-3.5 w-3.5 mr-1.5" />
              {EDITOR_UI.SCHEDULE_MODAL_CONFIRM}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {isPublished ? (
          <p className="text-sm text-muted-foreground">{EDITOR_UI.SCHEDULE_MODAL_PUBLISHED_DISABLED}</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <label
                htmlFor="schedule-datetime"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                {EDITOR_UI.SCHEDULE_MODAL_DATETIME_LABEL}
              </label>
              <input
                id="schedule-datetime"
                type="datetime-local"
                value={draftDateTime}
                min={minDateTime}
                onChange={(e) => {
                  setDraftDateTime(e.target.value);
                  setError(null);
                }}
                className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
              />
            </div>

            {previewDate && (
              <p className="text-sm text-primary/90 bg-primary/5 border border-primary/15 rounded-md px-3 py-2">
                {EDITOR_UI.SCHEDULE_AUTO_PUBLISH(previewDate)}
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}
