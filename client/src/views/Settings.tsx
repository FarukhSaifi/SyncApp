"use client";
import React, { useEffect, useMemo, useState } from "react";

import SettingsPageHeader from "@components/settings/SettingsPageHeader";
import SettingsSectionNav from "@components/settings/SettingsSectionNav";
import {
  API_PATHS,
  APP_CONFIG,
  COLOR_CLASSES,
  EXTERNAL_LINKS,
  LINKEDIN_OAUTH_CALLBACK_FALLBACK,
  LINKEDIN_OAUTH_QUERY,
  PAGE_DESCRIPTIONS,
  PLATFORMS,
  PLATFORM_DISPLAY_NAMES,
  SETTINGS_SECTION_IDS,
  SYNC_LABEL,
  TOAST_TITLES,
  URL_SCHEME_PREFIXES,
} from "@constants";
import { useToast } from "@hooks/useToast";
import type { ApiCredential, ApiResponse, SavedState } from "@types";
import { apiClient } from "@utils/apiClient";
import { isCredentialConnected } from "@utils/credentials";
import { devError, devLog, devWarn } from "@utils/logger";
import { FiAlertCircle, FiCopy, FiExternalLink, FiEye, FiEyeOff, FiKey, FiLinkedin, FiSave } from "react-icons/fi";

import { SETTINGS_LAYOUT, BUTTON_VARIANTS, BUTTON_SIZES } from "@constants/designTokens";

import Button from "@components/common/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/common/Card";
import ConnectionStatusPill from "@components/common/ConnectionStatusPill";
import Input from "@components/common/Input";

const Settings = () => {
  const toast = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [mediumApiKey, setMediumApiKey] = useState<string>("");
  const [devtoApiKey, setDevtoApiKey] = useState<string>("");
  const [devtoUsername, setDevtoUsername] = useState<string>("");
  const [wordpressApiKey, setWordpressApiKey] = useState<string>("");
  const [wordpressSiteUrl, setWordpressSiteUrl] = useState<string>("");
  const [saved, setSaved] = useState<SavedState>({ medium: false, devto: false, wordpress: false, linkedin: false });
  const [connected, setConnected] = useState<SavedState>({
    medium: false,
    devto: false,
    wordpress: false,
    linkedin: false,
  });
  const [decryptFailed, setDecryptFailed] = useState<SavedState>({
    medium: false,
    devto: false,
    wordpress: false,
    linkedin: false,
  });
  const [showMediumKey, setShowMediumKey] = useState<boolean>(false);
  const [showDevtoKey, setShowDevtoKey] = useState<boolean>(false);
  const [showWordpressKey, setShowWordpressKey] = useState<boolean>(false);
  const [linkedinConnecting, setLinkedinConnecting] = useState(false);
  const [linkedinTokenExpired, setLinkedinTokenExpired] = useState(false);
  const [linkedinRedirectUri, setLinkedinRedirectUri] = useState<string>(LINKEDIN_OAUTH_CALLBACK_FALLBACK);
  const [activeSectionId, setActiveSectionId] = useState<string>(SETTINGS_SECTION_IDS.MEDIUM);

  const sectionNavItems = useMemo(
    () => [
      { id: SETTINGS_SECTION_IDS.MEDIUM, label: PLATFORM_DISPLAY_NAMES[PLATFORMS.MEDIUM] },
      { id: SETTINGS_SECTION_IDS.DEVTO, label: PLATFORM_DISPLAY_NAMES[PLATFORMS.DEVTO] },
      { id: SETTINGS_SECTION_IDS.WORDPRESS, label: PLATFORM_DISPLAY_NAMES[PLATFORMS.WORDPRESS] },
      { id: SETTINGS_SECTION_IDS.LINKEDIN, label: PLATFORM_DISPLAY_NAMES[PLATFORMS.LINKEDIN] },
      { id: SETTINGS_SECTION_IDS.STATUS, label: SYNC_LABEL.PLATFORM_STATUS },
      { id: SETTINGS_SECTION_IDS.HELP, label: SYNC_LABEL.HELP_SUPPORT },
    ],
    [],
  );

  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        devLog("Loading credentials");
        const result = await apiClient.request(`${API_PATHS.CREDENTIALS}`);
        devLog(
          "Credentials response:",
          (result as ApiResponse<unknown>)?.success ? "ok" : (result as ApiResponse<unknown>)?.message,
        );

        if ((result as ApiResponse<unknown>)?.success && Array.isArray((result as ApiResponse<unknown>)?.data)) {
          const creds = (result as ApiResponse<unknown>)?.data as ApiCredential[];
          const medium = creds.find((c: ApiCredential) => c.platform_name === PLATFORMS.MEDIUM);
          const devto = creds.find((c: ApiCredential) => c.platform_name === PLATFORMS.DEVTO);
          const wordpress = creds.find((c: ApiCredential) => c.platform_name === PLATFORMS.WORDPRESS);
          const linkedin = creds.find((c: ApiCredential) => c.platform_name === PLATFORMS.LINKEDIN);

          if (medium) {
            setConnected((prev) => ({ ...prev, medium: isCredentialConnected(medium) }));
            setDecryptFailed((prev) => ({ ...prev, medium: Boolean(medium.decrypt_failed) }));
            // Keys are masked server-side — leave input empty; placeholder shows "Saved (hidden)".
            setMediumApiKey("");
          }
          if (devto) {
            setConnected((prev) => ({ ...prev, devto: isCredentialConnected(devto) }));
            setDecryptFailed((prev) => ({ ...prev, devto: Boolean(devto.decrypt_failed) }));
            if (devto.platform_config?.devto_username) {
              setDevtoUsername(devto.platform_config.devto_username as unknown as string);
            }
            setDevtoApiKey("");
          }
          if (wordpress) {
            setConnected((prev) => ({ ...prev, wordpress: isCredentialConnected(wordpress) }));
            setDecryptFailed((prev) => ({ ...prev, wordpress: Boolean(wordpress.decrypt_failed) }));
            if (wordpress.site_url) {
              setWordpressSiteUrl(wordpress.site_url as unknown as string);
            }
            setWordpressApiKey("");
          }
          if (linkedin) {
            setConnected((prev) => ({ ...prev, linkedin: isCredentialConnected(linkedin) }));
            setLinkedinTokenExpired(Boolean(linkedin.token_expired));
          }
        } else {
          devWarn((result as ApiResponse<unknown>)?.message || "No credentials found or invalid response");
        }
      } catch (e) {
        devError("Failed to load credentials:", e);
        toast.apiError(`${SYNC_LABEL.FAILED_TO_LOAD_CREDENTIALS}: ${(e as Error)?.message || ""}`);
      }
    };

    const loadLinkedInOAuthStatus = async () => {
      try {
        const result = await apiClient.request<ApiResponse<{ configured?: boolean; redirectUri?: string }>>(
          API_PATHS.LINKEDIN_OAUTH_STATUS,
        );
        if (result?.success && result.data?.redirectUri) {
          setLinkedinRedirectUri(result.data.redirectUri);
        }
      } catch (e) {
        devWarn("LinkedIn OAuth status unavailable", e);
      }
    };

    loadCredentials();
    loadLinkedInOAuthStatus();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get(LINKEDIN_OAUTH_QUERY.CONNECTED_KEY) === LINKEDIN_OAUTH_QUERY.CONNECTED_VALUE) {
        setConnected((prev) => ({ ...prev, linkedin: true }));
        setLinkedinTokenExpired(false);
        toast.success(TOAST_TITLES.SUCCESS, SYNC_LABEL.LINKEDIN_CONNECTED_SUCCESS);
        window.history.replaceState({}, "", window.location.pathname);
      }
      const linkedinError = params.get(LINKEDIN_OAUTH_QUERY.ERROR_KEY);
      if (linkedinError) {
        toast.apiError(decodeURIComponent(linkedinError));
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, toast is stable

  const handleSaveMediumCredentials = async () => {
    const isDisconnect = !mediumApiKey.trim() && connected.medium;
    if (!mediumApiKey.trim() && !connected.medium) {
      toast.validationError(SYNC_LABEL.ENTER_MEDIUM_API_KEY);
      return;
    }

    setLoading(true);
    try {
      devLog(isDisconnect ? "Disconnecting Medium" : "Saving Medium credentials");
      const result = isDisconnect
        ? await apiClient.deleteCredential(PLATFORMS.MEDIUM)
        : await apiClient.upsertCredential(PLATFORMS.MEDIUM, {
            api_key: mediumApiKey.trim(),
          });

      if (result?.success) {
        if (isDisconnect) {
          setConnected((prev) => ({ ...prev, medium: false }));
          setMediumApiKey("");
          toast.credentialsRemoved(SYNC_LABEL.PLATFORM_MEDIUM);
        } else {
          setConnected((prev) => ({ ...prev, medium: true }));
          setDecryptFailed((prev) => ({ ...prev, medium: false }));
          setSaved((prev) => ({ ...prev, medium: true }));
          setTimeout(() => setSaved((prev) => ({ ...prev, medium: false })), APP_CONFIG.SAVED_TOAST_DURATION_MS);
          toast.credentialsSaved(SYNC_LABEL.PLATFORM_MEDIUM);
        }
      } else if (isDisconnect) {
        toast.credentialsRemoveError(
          SYNC_LABEL.PLATFORM_MEDIUM,
          result?.error || SYNC_LABEL.FAILED_TO_REMOVE_CREDENTIALS,
        );
      } else {
        toast.credentialsError(SYNC_LABEL.PLATFORM_MEDIUM, result?.error || SYNC_LABEL.FAILED_TO_SAVE_CREDENTIALS);
      }
    } catch (error) {
      devError("Error saving Medium credentials:", error);
      if (isDisconnect) {
        toast.credentialsRemoveError(
          SYNC_LABEL.PLATFORM_MEDIUM,
          (error as Error)?.message || SYNC_LABEL.FAILED_TO_REMOVE_CREDENTIALS,
        );
      } else {
        toast.credentialsError(
          SYNC_LABEL.PLATFORM_MEDIUM,
          (error as Error)?.message || SYNC_LABEL.FAILED_TO_SAVE_CREDENTIALS,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDevtoCredentials = async () => {
    const fieldsEmpty = !devtoApiKey.trim() && !devtoUsername.trim();
    const isDisconnect = fieldsEmpty && connected.devto;
    const fieldsPartial = !fieldsEmpty && (!devtoApiKey.trim() || !devtoUsername.trim());

    if (fieldsPartial || (fieldsEmpty && !connected.devto)) {
      toast.validationError(SYNC_LABEL.ENTER_DEVTO_CREDENTIALS);
      return;
    }

    setLoading(true);
    try {
      devLog(isDisconnect ? "Disconnecting DEV.to" : "Saving DEV.to credentials");
      const result = isDisconnect
        ? await apiClient.deleteCredential(PLATFORMS.DEVTO)
        : await apiClient.upsertCredential(PLATFORMS.DEVTO, {
            api_key: devtoApiKey.trim(),
            platform_config: {
              devto_username: devtoUsername.trim(),
            },
          });

      if (result?.success) {
        if (isDisconnect) {
          setConnected((prev) => ({ ...prev, devto: false }));
          setDevtoApiKey("");
          setDevtoUsername("");
          toast.credentialsRemoved(SYNC_LABEL.PLATFORM_DEVTO);
        } else {
          setConnected((prev) => ({ ...prev, devto: true }));
          setDecryptFailed((prev) => ({ ...prev, devto: false }));
          setSaved((prev) => ({ ...prev, devto: true }));
          setTimeout(() => setSaved((prev) => ({ ...prev, devto: false })), APP_CONFIG.SAVED_TOAST_DURATION_MS);
          toast.credentialsSaved(SYNC_LABEL.PLATFORM_DEVTO);
        }
      } else if (isDisconnect) {
        toast.credentialsRemoveError(
          SYNC_LABEL.PLATFORM_DEVTO,
          result?.error || SYNC_LABEL.FAILED_TO_REMOVE_CREDENTIALS,
        );
      } else {
        toast.credentialsError(SYNC_LABEL.PLATFORM_DEVTO, result?.error || SYNC_LABEL.FAILED_TO_SAVE_CREDENTIALS);
      }
    } catch (error) {
      devError("Error saving DEV.to credentials:", error);
      if (isDisconnect) {
        toast.credentialsRemoveError(
          SYNC_LABEL.PLATFORM_DEVTO,
          (error as Error)?.message || SYNC_LABEL.FAILED_TO_REMOVE_CREDENTIALS,
        );
      } else {
        toast.credentialsError(
          SYNC_LABEL.PLATFORM_DEVTO,
          (error as Error)?.message || SYNC_LABEL.FAILED_TO_SAVE_CREDENTIALS,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWordpressCredentials = async () => {
    const fieldsEmpty = !wordpressApiKey.trim() && !wordpressSiteUrl.trim();
    const isDisconnect = fieldsEmpty && connected.wordpress;
    const fieldsPartial = !fieldsEmpty && (!wordpressApiKey.trim() || !wordpressSiteUrl.trim());

    if (fieldsPartial || (fieldsEmpty && !connected.wordpress)) {
      toast.validationError(SYNC_LABEL.ENTER_WORDPRESS_CREDENTIALS);
      return;
    }

    if (
      !isDisconnect &&
      !wordpressSiteUrl.startsWith(URL_SCHEME_PREFIXES.HTTP) &&
      !wordpressSiteUrl.startsWith(URL_SCHEME_PREFIXES.HTTPS)
    ) {
      toast.validationError(SYNC_LABEL.VALID_WORDPRESS_URL);
      return;
    }

    setLoading(true);
    try {
      devLog(isDisconnect ? "Disconnecting WordPress" : "Saving WordPress credentials");
      const result = isDisconnect
        ? await apiClient.deleteCredential(PLATFORMS.WORDPRESS)
        : await apiClient.upsertCredential(PLATFORMS.WORDPRESS, {
            api_key: wordpressApiKey.trim(),
            site_url: wordpressSiteUrl.trim(),
          });

      if (result?.success) {
        if (isDisconnect) {
          setConnected((prev) => ({ ...prev, wordpress: false }));
          setWordpressApiKey("");
          setWordpressSiteUrl("");
          toast.credentialsRemoved(SYNC_LABEL.PLATFORM_WORDPRESS);
        } else {
          setConnected((prev) => ({ ...prev, wordpress: true }));
          setDecryptFailed((prev) => ({ ...prev, wordpress: false }));
          setSaved((prev) => ({ ...prev, wordpress: true }));
          setTimeout(() => setSaved((prev) => ({ ...prev, wordpress: false })), APP_CONFIG.SAVED_TOAST_DURATION_MS);
          toast.credentialsSaved(SYNC_LABEL.PLATFORM_WORDPRESS);
        }
      } else if (isDisconnect) {
        toast.credentialsRemoveError(
          SYNC_LABEL.PLATFORM_WORDPRESS,
          result?.error || SYNC_LABEL.FAILED_TO_REMOVE_CREDENTIALS,
        );
      } else {
        toast.credentialsError(SYNC_LABEL.PLATFORM_WORDPRESS, result?.error || SYNC_LABEL.FAILED_TO_SAVE_CREDENTIALS);
      }
    } catch (error) {
      devError("Error saving WordPress credentials:", error);
      if (isDisconnect) {
        toast.credentialsRemoveError(
          SYNC_LABEL.PLATFORM_WORDPRESS,
          (error as Error)?.message || SYNC_LABEL.FAILED_TO_REMOVE_CREDENTIALS,
        );
      } else {
        toast.credentialsError(
          SYNC_LABEL.PLATFORM_WORDPRESS,
          (error as Error)?.message || SYNC_LABEL.FAILED_TO_SAVE_CREDENTIALS,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLinkedInRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(linkedinRedirectUri);
      toast.success(TOAST_TITLES.SUCCESS, SYNC_LABEL.LINKEDIN_REDIRECT_COPIED);
    } catch {
      toast.apiError(SYNC_LABEL.FAILED_TO_COPY_LINKEDIN);
    }
  };

  const handleConnectLinkedIn = async () => {
    setLinkedinConnecting(true);
    try {
      const result = await apiClient.linkedinOAuthStart();
      if (result?.success && result.data?.url) {
        window.location.href = result.data.url;
        return;
      }
      toast.apiError(result?.error || SYNC_LABEL.LINKEDIN_CONNECT_FAILED);
    } catch (error) {
      toast.apiError((error as Error)?.message || SYNC_LABEL.LINKEDIN_CONNECT_FAILED);
    } finally {
      setLinkedinConnecting(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    setLoading(true);
    try {
      const result = await apiClient.deleteCredential(PLATFORMS.LINKEDIN);
      if (result?.success) {
        setConnected((prev) => ({ ...prev, linkedin: false }));
        setLinkedinTokenExpired(false);
        toast.credentialsRemoved(SYNC_LABEL.PLATFORM_LINKEDIN);
      } else {
        toast.credentialsRemoveError(
          SYNC_LABEL.PLATFORM_LINKEDIN,
          result?.error || SYNC_LABEL.FAILED_TO_REMOVE_CREDENTIALS,
        );
      }
    } catch (error) {
      toast.credentialsRemoveError(
        SYNC_LABEL.PLATFORM_LINKEDIN,
        (error as Error)?.message || SYNC_LABEL.FAILED_TO_REMOVE_CREDENTIALS,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={SETTINGS_LAYOUT.PAGE_CLASS}>
      <SettingsPageHeader title={SYNC_LABEL.SETTINGS_TITLE} description={SYNC_LABEL.SETTINGS_DESCRIPTION} />

      <div className={SETTINGS_LAYOUT.BODY_CLASS}>
        <SettingsSectionNav
          items={sectionNavItems}
          activeId={activeSectionId}
          onSelect={scrollToSection}
          ariaLabel={PAGE_DESCRIPTIONS.SETTINGS_SECTION_NAV_ARIA}
        />

        <div className={SETTINGS_LAYOUT.SECTIONS_CLASS}>
          {/* Medium Integration */}
          <Card id={SETTINGS_SECTION_IDS.MEDIUM} className={SETTINGS_LAYOUT.CARD_CLASS}>
            <CardHeader>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className={`p-1.5 sm:p-2 ${COLOR_CLASSES.ICON_BG.WARNING} rounded-lg shrink-0`}>
                  <FiKey className={`h-4 w-4 sm:h-6 sm:w-6 ${COLOR_CLASSES.ICON_COLOR.WARNING}`} />
                </div>
                <div>
                  <CardTitle>{SYNC_LABEL.MEDIUM_INTEGRATION}</CardTitle>
                  <CardDescription>{SYNC_LABEL.MEDIUM_INTEGRATION_DESC}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <FiAlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">{SYNC_LABEL.HOW_TO_GET_MEDIUM_KEY}</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        {SYNC_LABEL.GO_TO}{" "}
                        <a
                          href={EXTERNAL_LINKS.MEDIUM_SETTINGS}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          {SYNC_LABEL.MEDIUM_SETTINGS}
                        </a>
                      </li>
                      <li>{SYNC_LABEL.INTEGRATION_TOKENS}</li>
                      <li>{SYNC_LABEL.GET_INTEGRATION_TOKEN}</li>
                      <li>{SYNC_LABEL.COPY_TOKEN}</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="settings-medium-token" className="block text-sm font-medium text-foreground mb-2">
                  {SYNC_LABEL.MEDIUM_API_KEY_LABEL}
                </label>
                <div className="relative">
                  <Input
                    id="settings-medium-token"
                    name="mediumApiKey"
                    type={showMediumKey ? "text" : "password"}
                    value={mediumApiKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMediumApiKey(e.target.value)}
                    placeholder={connected.medium ? SYNC_LABEL.SAVED_HIDDEN : SYNC_LABEL.PLACEHOLDER_MEDIUM_TOKEN}
                    className="w-full pr-12 sm:pr-10"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    aria-label={showMediumKey ? SYNC_LABEL.HIDE_API_KEY : SYNC_LABEL.SHOW_API_KEY}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMediumKey((v) => !v);
                    }}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full min-h-11 text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
                  >
                    {showMediumKey ? (
                      <FiEyeOff className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    ) : (
                      <FiEye className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    )}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                  {connected.medium ? SYNC_LABEL.CLEAR_FIELDS_TO_DISCONNECT : SYNC_LABEL.TOKEN_ENCRYPTED}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveMediumCredentials}
                disabled={loading || (!mediumApiKey.trim() && !connected.medium)}
                variant={!mediumApiKey.trim() && connected.medium ? "outline" : "primary"}
                className="flex items-center space-x-1.5 sm:space-x-2"
              >
                <FiSave className="h-3 w-3 sm:h-4 sm:w-4" />
                {loading
                  ? SYNC_LABEL.SAVING
                  : !mediumApiKey.trim() && connected.medium
                    ? SYNC_LABEL.DISCONNECT_PLATFORM
                    : saved.medium
                      ? SYNC_LABEL.SAVED
                      : SYNC_LABEL.SAVE_CREDENTIALS}
              </Button>
            </CardFooter>
          </Card>

          {/* DEV.to Integration */}
          <Card id={SETTINGS_SECTION_IDS.DEVTO} className={SETTINGS_LAYOUT.CARD_CLASS}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${COLOR_CLASSES.ICON_BG.PRIMARY} rounded-lg`}>
                  <FiKey className={`h-6 w-6 ${COLOR_CLASSES.ICON_COLOR.PRIMARY}`} />
                </div>
                <div>
                  <CardTitle>{SYNC_LABEL.DEVTO_INTEGRATION}</CardTitle>
                  <CardDescription>{SYNC_LABEL.DEVTO_INTEGRATION_DESC}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {decryptFailed.devto ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <FiAlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">{SYNC_LABEL.CREDENTIAL_DECRYPT_FAILED_BANNER}</p>
                  </div>
                </div>
              ) : null}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiAlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">{SYNC_LABEL.HOW_TO_GET_DEVTO_KEY}</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        {SYNC_LABEL.GO_TO}{" "}
                        <a
                          href={EXTERNAL_LINKS.DEVTO_SETTINGS}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary/90"
                        >
                          {SYNC_LABEL.DEVTO_SETTINGS}
                        </a>
                      </li>
                      <li>{SYNC_LABEL.API_KEYS_SECTION}</li>
                      <li>{SYNC_LABEL.GENERATE_API_KEY}</li>
                      <li>{SYNC_LABEL.COPY_KEY}</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-devto-username" className="block text-sm font-medium text-foreground mb-2">
                    {SYNC_LABEL.DEVTO_USERNAME_LABEL}
                  </label>
                  <Input
                    id="settings-devto-username"
                    name="devtoUsername"
                    value={devtoUsername}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDevtoUsername(e.target.value)}
                    placeholder={SYNC_LABEL.PLACEHOLDER_DEVTO_USERNAME}
                    className="w-full"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label htmlFor="settings-devto-api-key" className="block text-sm font-medium text-foreground mb-2">
                    {SYNC_LABEL.DEVTO_API_KEY_LABEL}
                  </label>
                  <div className="relative">
                    <Input
                      id="settings-devto-api-key"
                      name="devtoApiKey"
                      type={showDevtoKey ? "text" : "password"}
                      value={devtoApiKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDevtoApiKey(e.target.value)}
                      placeholder={
                        decryptFailed.devto
                          ? SYNC_LABEL.CREDENTIAL_REENTER_REQUIRED
                          : connected.devto
                            ? SYNC_LABEL.SAVED_HIDDEN
                            : SYNC_LABEL.PLACEHOLDER_DEVTO_API_KEY
                      }
                      className="w-full pr-12 sm:pr-10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      aria-label={showDevtoKey ? SYNC_LABEL.HIDE_API_KEY : SYNC_LABEL.SHOW_API_KEY}
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDevtoKey((v) => !v);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full min-h-11 text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
                    >
                      {showDevtoKey ? (
                        <FiEyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <FiEye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {connected.devto ? SYNC_LABEL.CLEAR_FIELDS_TO_DISCONNECT : SYNC_LABEL.BOTH_REQUIRED_DEVTO}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveDevtoCredentials}
                disabled={loading || ((!devtoApiKey.trim() || !devtoUsername.trim()) && !connected.devto)}
                variant={!devtoApiKey.trim() && !devtoUsername.trim() && connected.devto ? "outline" : "primary"}
                className="flex items-center space-x-1.5 sm:space-x-2"
              >
                <FiSave className="h-3 w-3 sm:h-4 sm:w-4" />
                {loading
                  ? SYNC_LABEL.SAVING
                  : !devtoApiKey.trim() && !devtoUsername.trim() && connected.devto
                    ? SYNC_LABEL.DISCONNECT_PLATFORM
                    : saved.devto
                      ? SYNC_LABEL.SAVED
                      : SYNC_LABEL.SAVE_CREDENTIALS}
              </Button>
            </CardFooter>
          </Card>

          {/* WordPress Integration */}
          <Card id={SETTINGS_SECTION_IDS.WORDPRESS} className={SETTINGS_LAYOUT.CARD_CLASS}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/15 rounded-lg">
                  <FiKey className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{SYNC_LABEL.WORDPRESS_INTEGRATION}</CardTitle>
                  <CardDescription>{SYNC_LABEL.WORDPRESS_INTEGRATION_DESC}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <FiAlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">{SYNC_LABEL.HOW_TO_GET_WORDPRESS_KEY}</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        {SYNC_LABEL.INSTALL_JWT_PLUGIN}{" "}
                        <a
                          href={EXTERNAL_LINKS.WORDPRESS_JWT_PLUGIN}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          {SYNC_LABEL.WORDPRESS_JWT_PLUGIN}
                        </a>
                      </li>
                      <li>{SYNC_LABEL.WORDPRESS_ADMIN}</li>
                      <li>{SYNC_LABEL.GENERATE_APP_PASSWORD}</li>
                      <li>{SYNC_LABEL.USE_USERNAME_PASSWORD}</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="settings-wordpress-site-url"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {SYNC_LABEL.WORDPRESS_SITE_URL_LABEL}
                  </label>
                  <Input
                    id="settings-wordpress-site-url"
                    name="wordpressSiteUrl"
                    type="url"
                    value={wordpressSiteUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWordpressSiteUrl(e.target.value)}
                    placeholder={SYNC_LABEL.PLACEHOLDER_WORDPRESS_SITE_URL}
                    className="w-full"
                    autoComplete="url"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{SYNC_LABEL.WORDPRESS_URL_INFO}</p>
                </div>
                <div>
                  <label
                    htmlFor="settings-wordpress-api-key"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {SYNC_LABEL.WORDPRESS_API_KEY_LABEL}
                  </label>
                  <div className="relative">
                    <Input
                      id="settings-wordpress-api-key"
                      name="wordpressApiKey"
                      type={showWordpressKey ? "text" : "password"}
                      value={wordpressApiKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWordpressApiKey(e.target.value)}
                      placeholder={
                        connected.wordpress ? SYNC_LABEL.SAVED_HIDDEN : SYNC_LABEL.PLACEHOLDER_WORDPRESS_API_KEY
                      }
                      className="w-full pr-12 sm:pr-10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      aria-label={showWordpressKey ? SYNC_LABEL.HIDE_API_KEY : SYNC_LABEL.SHOW_API_KEY}
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowWordpressKey((v) => !v);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full min-h-11 text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
                    >
                      {showWordpressKey ? (
                        <FiEyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <FiEye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{SYNC_LABEL.WORDPRESS_API_KEY_INFO}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {connected.wordpress ? SYNC_LABEL.CLEAR_FIELDS_TO_DISCONNECT : SYNC_LABEL.BOTH_REQUIRED_WORDPRESS}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveWordpressCredentials}
                disabled={loading || ((!wordpressApiKey.trim() || !wordpressSiteUrl.trim()) && !connected.wordpress)}
                variant={
                  !wordpressApiKey.trim() && !wordpressSiteUrl.trim() && connected.wordpress ? "outline" : "primary"
                }
                className="flex items-center space-x-1.5 sm:space-x-2"
              >
                <FiSave className="h-3 w-3 sm:h-4 sm:w-4" />
                {loading
                  ? SYNC_LABEL.SAVING
                  : !wordpressApiKey.trim() && !wordpressSiteUrl.trim() && connected.wordpress
                    ? SYNC_LABEL.DISCONNECT_PLATFORM
                    : saved.wordpress
                      ? SYNC_LABEL.SAVED
                      : SYNC_LABEL.SAVE_CREDENTIALS}
              </Button>
            </CardFooter>
          </Card>

          {/* LinkedIn Integration */}
          <Card id={SETTINGS_SECTION_IDS.LINKEDIN} className={SETTINGS_LAYOUT.CARD_CLASS}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/15 rounded-lg">
                  <FiLinkedin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{SYNC_LABEL.LINKEDIN_INTEGRATION}</CardTitle>
                  <CardDescription>{SYNC_LABEL.LINKEDIN_INTEGRATION_DESC}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <FiAlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">{SYNC_LABEL.LINKEDIN_HOW_TO_CONNECT}</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>{SYNC_LABEL.LINKEDIN_OAUTH_STEP_1}</li>
                      <li>{SYNC_LABEL.LINKEDIN_OAUTH_STEP_2}</li>
                      <li>{SYNC_LABEL.LINKEDIN_OAUTH_STEP_3}</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">{SYNC_LABEL.LINKEDIN_REDIRECT_URI_LABEL}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="flex-1 break-all rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground">
                    {linkedinRedirectUri}
                  </code>
                  <Button
                    type="button"
                    variant={BUTTON_VARIANTS.OUTLINE}
                    size={BUTTON_SIZES.SM}
                    onClick={handleCopyLinkedInRedirectUri}
                    className="shrink-0 justify-center"
                  >
                    <FiCopy className="mr-1.5 h-3.5 w-3.5" />
                    {SYNC_LABEL.LINKEDIN_COPY_REDIRECT_URI}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {connected.linkedin ? SYNC_LABEL.CONNECTED : SYNC_LABEL.NOT_CONNECTED}
              </p>
              {linkedinTokenExpired ? (
                <p className="flex items-start gap-1.5 text-[11px] text-warning">
                  <FiAlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  {SYNC_LABEL.LINKEDIN_TOKEN_EXPIRED_HINT}
                </p>
              ) : null}
              {!connected.linkedin && !linkedinTokenExpired ? (
                <p className="text-[11px] text-muted-foreground">{SYNC_LABEL.LINKEDIN_OAUTH_BROWSER_HINT}</p>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              {connected.linkedin ? (
                <Button
                  onClick={handleDisconnectLinkedIn}
                  disabled={loading || linkedinConnecting}
                  variant={BUTTON_VARIANTS.OUTLINE}
                  className="flex items-center space-x-1.5 sm:space-x-2"
                >
                  {loading ? SYNC_LABEL.SAVING : SYNC_LABEL.DISCONNECT_LINKEDIN}
                </Button>
              ) : (
                <Button
                  onClick={handleConnectLinkedIn}
                  disabled={loading || linkedinConnecting}
                  variant={BUTTON_VARIANTS.PRIMARY}
                  className="flex items-center space-x-1.5 sm:space-x-2"
                >
                  <FiLinkedin className="h-3 w-3 sm:h-4 sm:w-4" />
                  {linkedinConnecting ? SYNC_LABEL.CONNECTING_LINKEDIN : SYNC_LABEL.CONNECT_LINKEDIN}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Platform Status */}
          <Card id={SETTINGS_SECTION_IDS.STATUS} className={SETTINGS_LAYOUT.CARD_CLASS}>
            <CardHeader>
              <CardTitle>{SYNC_LABEL.PLATFORM_STATUS}</CardTitle>
              <CardDescription>{SYNC_LABEL.PLATFORM_STATUS_DESC}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className={`p-1.5 sm:p-2 ${COLOR_CLASSES.ICON_BG.WARNING} rounded-lg shrink-0`}>
                      <FiKey className={`h-3 w-3 sm:h-4 sm:w-4 ${COLOR_CLASSES.ICON_COLOR.WARNING}`} />
                    </div>
                    <div>
                      <p className="font-medium">{SYNC_LABEL.PLATFORM_MEDIUM}</p>
                      <p className="text-sm text-muted-foreground">
                        {connected.medium ? SYNC_LABEL.CONNECTED : SYNC_LABEL.NOT_CONNECTED}
                      </p>
                    </div>
                  </div>
                  <ConnectionStatusPill connected={connected.medium} />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${COLOR_CLASSES.ICON_BG.PRIMARY} rounded-lg`}>
                      <FiKey className={`h-4 w-4 ${COLOR_CLASSES.ICON_COLOR.PRIMARY}`} />
                    </div>
                    <div>
                      <p className="font-medium">{SYNC_LABEL.PLATFORM_DEVTO}</p>
                      <p className="text-sm text-muted-foreground">
                        {connected.devto ? SYNC_LABEL.CONNECTED : SYNC_LABEL.NOT_CONNECTED}
                      </p>
                    </div>
                  </div>
                  <ConnectionStatusPill connected={connected.devto} />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/15 rounded-lg">
                      <FiKey className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{SYNC_LABEL.PLATFORM_WORDPRESS}</p>
                      <p className="text-sm text-muted-foreground">
                        {connected.wordpress ? SYNC_LABEL.CONNECTED : SYNC_LABEL.NOT_CONNECTED}
                      </p>
                    </div>
                  </div>
                  <ConnectionStatusPill connected={connected.wordpress} />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/15 rounded-lg">
                      <FiLinkedin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{SYNC_LABEL.PLATFORM_LINKEDIN}</p>
                      <p className="text-sm text-muted-foreground">
                        {connected.linkedin ? SYNC_LABEL.CONNECTED : SYNC_LABEL.NOT_CONNECTED}
                      </p>
                    </div>
                  </div>
                  <ConnectionStatusPill connected={connected.linkedin} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card id={SETTINGS_SECTION_IDS.HELP} className={SETTINGS_LAYOUT.CARD_CLASS}>
            <CardHeader>
              <CardTitle>{SYNC_LABEL.HELP_SUPPORT}</CardTitle>
              <CardDescription>{SYNC_LABEL.HELP_SUPPORT_DESC}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href={EXTERNAL_LINKS.MEDIUM_SETTINGS}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span>{SYNC_LABEL.MEDIUM_INTEGRATION_GUIDE}</span>
                </div>
                <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              </a>

              <a
                href={EXTERNAL_LINKS.DEVTO_SETTINGS}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span>{SYNC_LABEL.DEVTO_API_KEY_GUIDE}</span>
                </div>
                <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              </a>

              <a
                href={EXTERNAL_LINKS.WORDPRESS_JWT_PLUGIN}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span>{SYNC_LABEL.WORDPRESS_JWT_PLUGIN}</span>
                </div>
                <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              </a>

              <a
                href={EXTERNAL_LINKS.LINKEDIN_DEVELOPER}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span>{SYNC_LABEL.LINKEDIN_INTEGRATION}</span>
                </div>
                <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              </a>

              <a
                href={EXTERNAL_LINKS.GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <span>{SYNC_LABEL.GITHUB_REPOSITORY}</span>
                </div>
                <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
