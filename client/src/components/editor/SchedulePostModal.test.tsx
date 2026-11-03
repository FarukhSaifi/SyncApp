import React from "react";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EDITOR_UI } from "@constants/messages";
import { PLATFORMS } from "@constants/platforms";

import SchedulePostModal from "./SchedulePostModal";

describe("SchedulePostModal", () => {
  afterEach(() => {
    cleanup();
  });

  const onClose = vi.fn();
  const onScheduleSave = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    onScheduleSave.mockReset();
    onScheduleSave.mockResolvedValue(true);
  });

  function renderModal(overrides: Partial<React.ComponentProps<typeof SchedulePostModal>> = {}) {
    return render(
      <SchedulePostModal
        isOpen
        onClose={onClose}
        scheduledFor=""
        scheduledPlatforms={[]}
        connectedPlatforms={[PLATFORMS.DEVTO, PLATFORMS.MEDIUM]}
        onScheduleSave={onScheduleSave}
        {...overrides}
      />,
    );
  }

  it("renders schedule form when open", () => {
    renderModal();
    expect(screen.getByText(EDITOR_UI.SCHEDULE_MODAL_TITLE)).toBeInTheDocument();
    expect(screen.getByLabelText(EDITOR_UI.SCHEDULE_MODAL_DATETIME_LABEL)).toBeInTheDocument();
  });

  it("shows validation when datetime is missing", async () => {
    renderModal();
    await userEvent.click(screen.getAllByRole("button", { name: EDITOR_UI.SCHEDULE_MODAL_CONFIRM })[0]);
    expect(screen.getByText(EDITOR_UI.SCHEDULE_MODAL_NO_DATE)).toBeInTheDocument();
    expect(onScheduleSave).not.toHaveBeenCalled();
  });

  it("shows validation for past datetime", async () => {
    renderModal();
    const input = screen.getByLabelText(EDITOR_UI.SCHEDULE_MODAL_DATETIME_LABEL);
    await userEvent.clear(input);
    await userEvent.type(input, dayjs().subtract(1, "day").format("YYYY-MM-DDTHH:mm"));
    await userEvent.click(screen.getAllByRole("button", { name: EDITOR_UI.SCHEDULE_MODAL_CONFIRM })[0]);
    expect(screen.getByText(EDITOR_UI.SCHEDULE_MODAL_PAST_DATE)).toBeInTheDocument();
  });

  it("confirms future schedule and closes on success", async () => {
    renderModal();
    const future = dayjs().add(2, "day").format("YYYY-MM-DDTHH:mm");
    const input = screen.getByLabelText(EDITOR_UI.SCHEDULE_MODAL_DATETIME_LABEL);
    await userEvent.clear(input);
    await userEvent.type(input, future);
    await userEvent.click(screen.getAllByRole("button", { name: EDITOR_UI.SCHEDULE_MODAL_CONFIRM })[0]);

    await waitFor(() => {
      expect(onScheduleSave).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows message when no platforms are connected", () => {
    renderModal({ connectedPlatforms: [] });
    expect(screen.getAllByText(EDITOR_UI.SCHEDULE_MODAL_NO_CONNECTED)[0]).toBeInTheDocument();
  });

  it("blocks scheduling when post is already published", async () => {
    renderModal({ isPublished: true });
    expect(screen.getAllByText(EDITOR_UI.SCHEDULE_MODAL_PUBLISHED_DISABLED)[0]).toBeInTheDocument();
    const confirmButtons = screen.queryAllByRole("button", { name: EDITOR_UI.SCHEDULE_MODAL_CONFIRM });
    confirmButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("clears schedule when clear control is used", async () => {
    renderModal({
      scheduledFor: dayjs().add(1, "day").toISOString(),
      scheduledPlatforms: [PLATFORMS.DEVTO],
    });
    await userEvent.click(screen.getAllByRole("button", { name: EDITOR_UI.SCHEDULE_MODAL_CLEAR })[0]);
    await waitFor(() => {
      expect(onScheduleSave).toHaveBeenCalledWith("", []);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls onClose from cancel", async () => {
    renderModal();
    await userEvent.click(screen.getAllByRole("button", { name: EDITOR_UI.SCHEDULE_MODAL_CANCEL })[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
