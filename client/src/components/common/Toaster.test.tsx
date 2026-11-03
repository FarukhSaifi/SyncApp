import { TOAST_UI } from "@constants";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toaster, useToaster } from "./Toaster";

vi.mock("react-hot-toast", () => {
  const toastFn = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn((p: Promise<unknown>) => p),
  });
  return {
    default: toastFn,
    Toaster: ({
      position,
      toastOptions,
      containerClassName,
    }: {
      position?: string;
      toastOptions?: object;
      containerClassName?: string;
    }) => (
      <div
        data-testid="hot-toaster"
        data-position={position}
        className={containerClassName}
        data-options={JSON.stringify(toastOptions ?? {})}
      />
    ),
    toast: toastFn,
  };
});

describe("Toaster", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders hot-toast host with default position", () => {
    render(<Toaster />);
    expect(screen.getByTestId("hot-toaster")).toHaveAttribute("data-position", TOAST_UI.DEFAULT_POSITION);
  });

  it("merges custom toastOptions and container props", () => {
    render(<Toaster position="bottom-center" containerClassName="toast-host" gutter={12} reverseOrder />);
    const host = screen.getByTestId("hot-toaster");
    expect(host).toHaveAttribute("data-position", "bottom-center");
    expect(host.className).toContain("toast-host");
  });

  it("useToaster exposes imperative helpers", () => {
    const apiRef: { current: ReturnType<typeof useToaster> | null } = { current: null };
    function Probe() {
      apiRef.current = useToaster();
      return null;
    }
    render(<Probe />);
    const api = apiRef.current;
    if (api === null) {
      throw new Error("useToaster did not return an API");
    }
    api.success("Saved");
    api.error("Failed", "details");
    api.warning("Careful");
    api.info("Note");
    api.loading("Working");
    api.dismiss("toast-id");
    api.removeToast("toast-id-2");
    void api.promise(Promise.resolve("ok"), { success: "Done", loading: "Wait" });
  });
});
