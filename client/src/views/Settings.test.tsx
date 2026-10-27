import React from "react";

import {
  LINKEDIN_OAUTH_QUERY,
  PLATFORM_DISPLAY_NAMES,
  PLATFORMS,
  SETTINGS_SECTION_IDS,
  SYNC_LABEL,
  TOAST_TITLES,
} from "@constants";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@utils/apiClient";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


const toastMocks = {
  apiError: vi.fn(),
  apiSuccess: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  validationError: vi.fn(),
  credentialsError: vi.fn(),
  credentialsSuccess: vi.fn(),
  credentialsSaved: vi.fn(),
  credentialsRemoved: vi.fn(),
  credentialsRemoveError: vi.fn(),
};

vi.mock("@hooks/useToast", () => ({
  useToast: () => toastMocks,
}));

import Settings from "./Settings";

describe("Settings view", () => {
  beforeEach(() => {
    vi.spyOn(apiClient, "request").mockImplementation(async (path: string) => {
      if (String(path).includes("credentials")) {
        return {
          success: true,
          data: [],
        };
      }
      if (String(path).includes("linkedin")) {
        return { success: true, data: { redirectUri: "http://localhost/callback" } };
      }
      return { success: true, data: null };
    });
    vi.spyOn(apiClient, "upsertCredential").mockResolvedValue({ success: true });
    vi.spyOn(apiClient, "deleteCredential").mockResolvedValue({ success: true });
    vi.spyOn(apiClient, "linkedinOAuthStart").mockResolvedValue({
      success: true,
      data: { url: "https://linkedin.example/oauth" },
    });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("loads credential sections", async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalled();
      expect(screen.getByLabelText(SYNC_LABEL.MEDIUM_API_KEY_LABEL)).toBeInTheDocument();
    });
  });

  it("shows credential load error via toast", async () => {
    vi.mocked(apiClient.request).mockRejectedValueOnce(new Error("network down"));
    render(<Settings />);
    await waitFor(() => {
      expect(toastMocks.apiError).toHaveBeenCalled();
    });
  });

  it("saves devto credential", async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.DEVTO_API_KEY_LABEL)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.DEVTO_USERNAME_LABEL), "devuser");
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.DEVTO_API_KEY_LABEL), "dev-key");
    const saveButtons = screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL.SAVE_CREDENTIALS, "i") });
    await userEvent.click(saveButtons[1]);
    await waitFor(() => {
      expect(apiClient.upsertCredential).toHaveBeenCalledWith(
        PLATFORMS.DEVTO,
        expect.objectContaining({ api_key: "dev-key" }),
      );
    });
  });

  it("surfaces medium save failure via credentialsError", async () => {
    vi.mocked(apiClient.upsertCredential).mockResolvedValueOnce({ success: false, error: "invalid key" });
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.MEDIUM_API_KEY_LABEL)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.MEDIUM_API_KEY_LABEL), "bad");
    await userEvent.click(screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL.SAVE_CREDENTIALS, "i") })[0]);
    await waitFor(() => {
      expect(toastMocks.credentialsError).toHaveBeenCalled();
    });
  });

  it("validates wordpress site url before save", async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.WORDPRESS_SITE_URL_LABEL)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.WORDPRESS_SITE_URL_LABEL), "bad-url");
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.WORDPRESS_API_KEY_LABEL), "wp-key");
    const saveButtons = screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL.SAVE_CREDENTIALS, "i") });
    await userEvent.click(saveButtons[saveButtons.length - 1]);
    await waitFor(() => {
      expect(toastMocks.validationError).toHaveBeenCalled();
    });
  });

  it("saves medium credential", async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.MEDIUM_API_KEY_LABEL)).toBeInTheDocument();
    });
    const keyInput = screen.getByLabelText(SYNC_LABEL.MEDIUM_API_KEY_LABEL);
    await userEvent.type(keyInput, "secret-key");
    await userEvent.click(screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL.SAVE_CREDENTIALS, "i") })[0]);
    await waitFor(() => {
      expect(apiClient.upsertCredential).toHaveBeenCalled();
    });
  });

  it("disables medium save when disconnected and key empty", async () => {
    vi.mocked(apiClient.request).mockImplementation(async (path: string) => {
      if (String(path).includes("credentials")) {
        return { success: true, data: [] };
      }
      if (String(path).includes("linkedin")) {
        return { success: true, data: { redirectUri: "http://localhost/callback" } };
      }
      return { success: true, data: null };
    });
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.MEDIUM_API_KEY_LABEL)).toBeInTheDocument();
    });
    const saveButtons = screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL.SAVE_CREDENTIALS, "i") });
    expect(saveButtons[0]).toBeDisabled();
  });

  it("disconnects medium when connected and fields cleared", async () => {
    vi.mocked(apiClient.request).mockImplementation(async (path: string) => {
      if (String(path).includes("credentials")) {
        return { success: true, data: [{ platform_name: PLATFORMS.MEDIUM, configured: true }] };
      }
      if (String(path).includes("linkedin")) {
        return { success: true, data: { redirectUri: "http://localhost/callback" } };
      }
      return { success: true, data: null };
    });
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: SYNC_LABEL.DISCONNECT_PLATFORM })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DISCONNECT_PLATFORM }));
    await waitFor(() => {
      expect(apiClient.deleteCredential).toHaveBeenCalledWith(PLATFORMS.MEDIUM);
      expect(toastMocks.credentialsRemoved).toHaveBeenCalledWith(SYNC_LABEL.PLATFORM_MEDIUM);
    });
  });

  it("saves wordpress with valid https site url", async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.WORDPRESS_SITE_URL_LABEL)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.WORDPRESS_SITE_URL_LABEL), "https://blog.example.com");
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.WORDPRESS_API_KEY_LABEL), "wp-secret");
    const saveButtons = screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL.SAVE_CREDENTIALS, "i") });
    await userEvent.click(saveButtons[saveButtons.length - 1]);
    await waitFor(() => {
      expect(apiClient.upsertCredential).toHaveBeenCalledWith(
        PLATFORMS.WORDPRESS,
        expect.objectContaining({ site_url: "https://blog.example.com" }),
      );
      expect(toastMocks.credentialsSaved).toHaveBeenCalledWith(SYNC_LABEL.PLATFORM_WORDPRESS);
    });
  });

  it("disables devto save when only username is filled", async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.DEVTO_USERNAME_LABEL)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByLabelText(SYNC_LABEL.DEVTO_USERNAME_LABEL), "only-user");
    const devtoSave = screen.getAllByRole("button", { name: new RegExp(SYNC_LABEL.SAVE_CREDENTIALS, "i") })[1];
    expect(devtoSave).toBeDisabled();
  });

  it("starts LinkedIn OAuth connect flow", async () => {
    const hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        pathname: "/settings",
        search: "",
        set href(next: string) {
          hrefSetter(next);
        },
        get href() {
          return "http://localhost/settings";
        },
      },
    });
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.CONNECT_LINKEDIN, "i") })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.CONNECT_LINKEDIN, "i") }));
    await waitFor(() => {
      expect(apiClient.linkedinOAuthStart).toHaveBeenCalled();
      expect(hrefSetter).toHaveBeenCalledWith("https://linkedin.example/oauth");
    });
  });

  it("copies LinkedIn redirect URI to clipboard", async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: SYNC_LABEL.LINKEDIN_COPY_REDIRECT_URI })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.LINKEDIN_COPY_REDIRECT_URI }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("http://localhost/callback");
      expect(toastMocks.success).toHaveBeenCalledWith(TOAST_TITLES.SUCCESS, SYNC_LABEL.LINKEDIN_REDIRECT_COPIED);
    });
  });

  it("surfaces medium disconnect failure via credentialsRemoveError", async () => {
    vi.mocked(apiClient.request).mockImplementation(async (path: string) => {
      if (String(path).includes("credentials")) {
        return { success: true, data: [{ platform_name: PLATFORMS.MEDIUM, configured: true }] };
      }
      if (String(path).includes("linkedin")) {
        return { success: true, data: { redirectUri: "http://localhost/callback" } };
      }
      return { success: true, data: null };
    });
    vi.mocked(apiClient.deleteCredential).mockResolvedValueOnce({ success: false, error: "revoke failed" });
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: SYNC_LABEL.DISCONNECT_PLATFORM })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DISCONNECT_PLATFORM }));
    await waitFor(() => {
      expect(toastMocks.credentialsRemoveError).toHaveBeenCalledWith(
        SYNC_LABEL.PLATFORM_MEDIUM,
        "revoke failed",
      );
    });
  });

  it("surfaces LinkedIn connect failure via apiError", async () => {
    vi.mocked(apiClient.linkedinOAuthStart).mockResolvedValueOnce({ success: false, error: "oauth down" });
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.CONNECT_LINKEDIN, "i") })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole("button", { name: new RegExp(SYNC_LABEL.CONNECT_LINKEDIN, "i") }));
    await waitFor(() => {
      expect(toastMocks.apiError).toHaveBeenCalledWith("oauth down");
    });
  });

  it("shows LinkedIn connected toast from oauth query param", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    const connectedUrl = `http://localhost/settings?${LINKEDIN_OAUTH_QUERY.CONNECTED_KEY}=${LINKEDIN_OAUTH_QUERY.CONNECTED_VALUE}`;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL(connectedUrl),
    });
    render(<Settings />);
    await waitFor(() => {
      expect(toastMocks.success).toHaveBeenCalledWith(TOAST_TITLES.SUCCESS, SYNC_LABEL.LINKEDIN_CONNECTED_SUCCESS);
    });
    replaceState.mockRestore();
  });

  it("scrolls to a section from the settings nav", async () => {
    const scrollIntoView = vi.fn();
    const target = document.createElement("section");
    target.id = SETTINGS_SECTION_IDS.DEVTO;
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.MEDIUM_API_KEY_LABEL)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: PLATFORM_DISPLAY_NAMES[PLATFORMS.DEVTO] }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    target.remove();
  });

  it("prefills stored platform fields when credentials exist", async () => {
    vi.mocked(apiClient.request).mockImplementation(async (path: string) => {
      if (String(path).includes("credentials")) {
        return {
          success: true,
          data: [
            {
              platform_name: PLATFORMS.DEVTO,
              configured: true,
              platform_config: { devto_username: "stored-dev" },
            },
            {
              platform_name: PLATFORMS.WORDPRESS,
              configured: true,
              site_url: "https://blog.example.com",
            },
            {
              platform_name: PLATFORMS.LINKEDIN,
              configured: true,
              token_expired: true,
            },
          ],
        };
      }
      if (String(path).includes("linkedin")) {
        return { success: true, data: { redirectUri: "http://localhost/callback" } };
      }
      return { success: true, data: null };
    });
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.DEVTO_USERNAME_LABEL)).toHaveValue("stored-dev");
      expect(screen.getByLabelText(SYNC_LABEL.WORDPRESS_SITE_URL_LABEL)).toHaveValue("https://blog.example.com");
      expect(screen.getByText(SYNC_LABEL.LINKEDIN_TOKEN_EXPIRED_HINT)).toBeInTheDocument();
    });
  });

  it("disconnects LinkedIn when connected", async () => {
    vi.mocked(apiClient.request).mockImplementation(async (path: string) => {
      if (String(path).includes("credentials")) {
        return {
          success: true,
          data: [{ platform_name: PLATFORMS.LINKEDIN, configured: true }],
        };
      }
      if (String(path).includes("linkedin")) {
        return { success: true, data: { redirectUri: "http://localhost/callback" } };
      }
      return { success: true, data: null };
    });
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: SYNC_LABEL.DISCONNECT_LINKEDIN })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DISCONNECT_LINKEDIN }));
    await waitFor(() => {
      expect(apiClient.deleteCredential).toHaveBeenCalledWith(PLATFORMS.LINKEDIN);
      expect(toastMocks.credentialsRemoved).toHaveBeenCalledWith(SYNC_LABEL.PLATFORM_LINKEDIN);
    });
  });

  it("toggles medium API key visibility", async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(SYNC_LABEL.MEDIUM_API_KEY_LABEL)).toBeInTheDocument();
    });
    const mediumCard = document.getElementById(SETTINGS_SECTION_IDS.MEDIUM);
    expect(mediumCard).toBeTruthy();
    const mediumScope = within(mediumCard as HTMLElement);
    const keyInput = mediumScope.getByLabelText(SYNC_LABEL.MEDIUM_API_KEY_LABEL);
    expect(keyInput).toHaveAttribute("type", "password");
    await userEvent.click(mediumScope.getByRole("button", { name: SYNC_LABEL.SHOW_API_KEY }));
    expect(keyInput).toHaveAttribute("type", "text");
    await userEvent.click(mediumScope.getByRole("button", { name: SYNC_LABEL.HIDE_API_KEY }));
    expect(keyInput).toHaveAttribute("type", "password");
  });

  it("surfaces LinkedIn oauth error query param", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL(`http://localhost/settings?${LINKEDIN_OAUTH_QUERY.ERROR_KEY}=access_denied`),
    });
    render(<Settings />);
    await waitFor(() => {
      expect(toastMocks.apiError).toHaveBeenCalledWith("access_denied");
    });
    replaceState.mockRestore();
  });
});
