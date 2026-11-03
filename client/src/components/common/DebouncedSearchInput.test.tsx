import { DATA_TABLE } from "@constants";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DebouncedSearchInput from "./DebouncedSearchInput";

describe("DebouncedSearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("debounces parent onChange after typing stops", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();
    render(
      <DebouncedSearchInput
        value=""
        onChange={onChange}
        debounceMs={DATA_TABLE.SEARCH_DEBOUNCE_MS}
        aria-label="Search posts"
      />,
    );

    await user.type(screen.getByLabelText("Search posts"), "sync");
    expect(onChange).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(DATA_TABLE.SEARCH_DEBOUNCE_MS + 10);
    });
    expect(onChange).toHaveBeenCalledWith("sync");
  });

  it("forwards custom leftIcon when search icon hidden", () => {
    render(
      <DebouncedSearchInput
        value=""
        onChange={vi.fn()}
        showSearchIcon={false}
        leftIcon={<span data-testid="custom-icon">icon</span>}
        aria-label="Search posts"
        debounceMs={50}
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders without default search icon when disabled", () => {
    render(
      <DebouncedSearchInput
        value=""
        onChange={vi.fn()}
        showSearchIcon={false}
        aria-label="Search posts"
        debounceMs={50}
      />,
    );
    expect(screen.getByLabelText("Search posts")).toBeInTheDocument();
  });

  it("syncs draft when controlled value changes externally", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DebouncedSearchInput value="alpha" onChange={onChange} aria-label="Search posts" debounceMs={50} />,
    );
    expect(screen.getByLabelText("Search posts")).toHaveValue("alpha");
    rerender(<DebouncedSearchInput value="beta" onChange={onChange} aria-label="Search posts" debounceMs={50} />);
    expect(screen.getByLabelText("Search posts")).toHaveValue("beta");
  });
});
