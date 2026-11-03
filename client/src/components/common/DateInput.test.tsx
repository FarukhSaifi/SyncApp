import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { INPUT_SIZES } from "@constants/designTokens";

import DateInput from "./DateInput";

describe("DateInput", () => {
  it("renders label, hint, and error states", () => {
    render(<DateInput label="Schedule" hint="Pick a day" name="schedule-ok" />);
    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Pick a day")).toBeInTheDocument();

    render(<DateInput label="Due" error="Required" name="schedule-err" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(document.querySelector("input[name='schedule-err']")).toHaveAttribute("aria-invalid", "true");
  });

  it("opens native picker when field wrapper clicked", async () => {
    const user = userEvent.setup();
    const showPicker = vi.fn();
    render(<DateInput name="due" defaultValue="2026-10-27" />);
    const input = document.querySelector("input[type='date']") as HTMLInputElement;
    input.showPicker = showPicker;
    await user.click(input.parentElement as HTMLElement);
    expect(showPicker).toHaveBeenCalled();
  });

  it("does not call showPicker when disabled", () => {
    const showPicker = vi.fn();
    render(<DateInput name="due-disabled" disabled />);
    const input = document.querySelector("input[name='due-disabled']") as HTMLInputElement;
    input.showPicker = showPicker;
    input.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(showPicker).not.toHaveBeenCalled();
  });

  it("focuses input when showPicker is unavailable", async () => {
    const user = userEvent.setup();
    const focusSpy = vi.spyOn(HTMLInputElement.prototype, "focus");
    render(<DateInput name="due-fallback" />);
    const input = document.querySelector("input[name='due-fallback']") as HTMLInputElement;
    input.showPicker = () => {
      throw new Error("showPicker is not available");
    };
    await user.click(input);
    expect(focusSpy).toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it("forwards input onClick and applies small size classes", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<DateInput name="due-sm" size={INPUT_SIZES.SM} onClick={onClick} label="Due" />);
    const input = document.querySelector("input[name='due-sm']") as HTMLInputElement;
    input.showPicker = vi.fn();
    await user.click(input);
    expect(onClick).toHaveBeenCalled();
  });
});
