import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUnsavedLeaveGuard } from "./useUnsavedLeaveGuard";

describe("useUnsavedLeaveGuard", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/editor");
  });

  it("runs pending action immediately when not blocking", () => {
    const action = vi.fn();
    const { result } = renderHook(() => useUnsavedLeaveGuard(false));
    act(() => {
      result.current.requestLeave(action);
    });
    expect(action).toHaveBeenCalledOnce();
    expect(result.current.isLeaveModalOpen).toBe(false);
  });

  it("opens modal instead of running action when blocking", () => {
    const action = vi.fn();
    const { result } = renderHook(() => useUnsavedLeaveGuard(true));
    act(() => {
      result.current.requestLeave(action);
    });
    expect(action).not.toHaveBeenCalled();
    expect(result.current.isLeaveModalOpen).toBe(true);
  });

  it("confirmLeave runs pending action and closes modal", () => {
    const action = vi.fn();
    const { result } = renderHook(() => useUnsavedLeaveGuard(true));
    act(() => {
      result.current.requestLeave(action);
    });
    act(() => {
      result.current.confirmLeave();
    });
    expect(action).toHaveBeenCalledOnce();
    expect(result.current.isLeaveModalOpen).toBe(false);
  });

  it("closeLeaveModal dismisses without running action", () => {
    const action = vi.fn();
    const { result } = renderHook(() => useUnsavedLeaveGuard(true));
    act(() => {
      result.current.requestLeave(action);
    });
    act(() => {
      result.current.closeLeaveModal();
    });
    expect(action).not.toHaveBeenCalled();
    expect(result.current.isLeaveModalOpen).toBe(false);
  });

  it("opens modal on browser back while blocking", () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const { result } = renderHook(() => useUnsavedLeaveGuard(true));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.isLeaveModalOpen).toBe(true);
    backSpy.mockRestore();
  });

  it("confirmLeave after popstate runs pending back navigation", () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const { result } = renderHook(() => useUnsavedLeaveGuard(true));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    act(() => {
      result.current.confirmLeave();
    });
    expect(backSpy).toHaveBeenCalled();
    expect(result.current.isLeaveModalOpen).toBe(false);
    backSpy.mockRestore();
  });

  it("allows immediate leave after confirmLeave cleared block", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result } = renderHook(() => useUnsavedLeaveGuard(true));
    act(() => {
      result.current.requestLeave(first);
      result.current.confirmLeave();
    });
    act(() => {
      result.current.requestLeave(second);
    });
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(result.current.isLeaveModalOpen).toBe(false);
  });
});
