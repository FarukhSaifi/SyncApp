import { ERROR_MESSAGES, SUCCESS_MESSAGES, TOAST_TITLES } from "@constants";
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";


import { useToast } from "./useToast";

const toaster = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
  promise: vi.fn(),
};

vi.mock("@components/common/Toaster", () => ({
  useToaster: () => toaster,
}));

describe("useToast", () => {
  it("delegates to toaster helpers", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.apiSuccess("Saved");
      result.current.apiError("Failed");
      result.current.apiLoading("Wait");
      result.current.validationError("Invalid");
      result.current.networkError();
      result.current.authError("Auth");
      result.current.publishSuccess("devto");
      result.current.publishError("devto", "x");
      result.current.saveSuccess(true);
      result.current.deleteSuccess();
      result.current.credentialsSaved("devto");
      result.current.credentialsRemoved("devto");
      result.current.credentialsError("devto", "bad key");
      result.current.credentialsRemoveError("devto", "still linked");
      result.current.exportSuccess("csv");
      result.current.exportError("csv", "disk full");
      void result.current.withToast(Promise.resolve(true), { successMessage: "ok" });
    });

    expect(toaster.success).toHaveBeenCalled();
    expect(toaster.error).toHaveBeenCalled();
    expect(toaster.loading).toHaveBeenCalled();
    expect(toaster.error).toHaveBeenCalledWith(TOAST_TITLES.NETWORK_ERROR, ERROR_MESSAGES.NETWORK_ERROR);
    expect(toaster.success).toHaveBeenCalledWith(
      TOAST_TITLES.SAVED,
      SUCCESS_MESSAGES.POST_UPDATED,
    );
  });
});
