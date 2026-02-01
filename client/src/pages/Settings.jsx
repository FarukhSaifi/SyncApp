import React, { useEffect, useState } from "react";
import { FiAlertCircle, FiExternalLink, FiEye, FiEyeOff, FiKey, FiSave } from "react-icons/fi";
import Button from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { API_PATHS, COLOR_CLASSES, EXTERNAL_LINKS, SYNC_LABEL } from "../constants";
import { useToast } from "../hooks/useToast";
import { apiClient } from "../utils/apiClient";
import { devError, devLog, devWarn } from "../utils/logger";

const Settings = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [mediumApiKey, setMediumApiKey] = useState("");
  const [devtoApiKey, setDevtoApiKey] = useState("");
  const [devtoUsername, setDevtoUsername] = useState("");
  const [wordpressApiKey, setWordpressApiKey] = useState("");
  const [wordpressSiteUrl, setWordpressSiteUrl] = useState("");
  const [saved, setSaved] = useState({ medium: false, devto: false, wordpress: false });
  const [showMediumKey, setShowMediumKey] = useState(false);
  const [showDevtoKey, setShowDevtoKey] = useState(false);
  const [showWordpressKey, setShowWordpressKey] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        devLog("Loading credentials");
        const result = await apiClient.request(`${API_PATHS.CREDENTIALS}`);
        devLog("Credentials response:", result?.success ? "ok" : result?.error);

        if (result?.success && Array.isArray(result.data)) {
          const creds = result.data;
          const medium = creds.find((c) => c.platform_name === "medium");
          const devto = creds.find((c) => c.platform_name === "devto");
          const wordpress = creds.find((c) => c.platform_name === "wordpress");

          if (medium) {
            setSaved((prev) => ({ ...prev, medium: true }));
            if (medium.api_key) setMediumApiKey(medium.api_key);
          }
          if (devto) {
            setSaved((prev) => ({ ...prev, devto: true }));
            if (devto.platform_config?.devto_username) {
              setDevtoUsername(devto.platform_config.devto_username);
            }
            if (devto.api_key) setDevtoApiKey(devto.api_key);
          }
          if (wordpress) {
            setSaved((prev) => ({ ...prev, wordpress: true }));
            if (wordpress.site_url) setWordpressSiteUrl(wordpress.site_url);
            if (wordpress.api_key) setWordpressApiKey(wordpress.api_key);
          }
        } else {
          devWarn("No credentials found or invalid response");
        }
      } catch (e) {
        devError("Failed to load credentials:", e);
        toast.apiError(`${SYNC_LABEL.FAILED_TO_LOAD_CREDENTIALS}: ${e.message}`);
      }
    };
    loadCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, toast is stable

  const handleSaveMediumCredentials = async () => {
    if (!mediumApiKey.trim()) {
      toast.validationError(SYNC_LABEL.ENTER_MEDIUM_API_KEY);
      return;
    }

    setLoading(true);
    try {
      devLog("Saving Medium credentials");
      const result = await apiClient.upsertCredential("medium", {
        api_key: mediumApiKey.trim(),
      });

      if (result?.success) {
        setSaved((prev) => ({ ...prev, medium: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, medium: false })), 3000);
        toast.credentialsSaved("Medium");
        // Keep the key in the input so user can see it
      } else {
        toast.credentialsError("Medium", result?.error || "Failed to save credentials");
      }
    } catch (error) {
      devError("Error saving Medium credentials:", error);
      toast.credentialsError("Medium", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDevtoCredentials = async () => {
    if (!devtoApiKey.trim() || !devtoUsername.trim()) {
      toast.validationError(SYNC_LABEL.ENTER_DEVTO_CREDENTIALS);
      return;
    }

    setLoading(true);
    try {
      devLog("Saving DEV.to credentials");
      const result = await apiClient.upsertCredential("devto", {
        api_key: devtoApiKey.trim(),
        platform_config: {
          devto_username: devtoUsername.trim(),
        },
      });

      if (result?.success) {
        setSaved((prev) => ({ ...prev, devto: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, devto: false })), 3000);
        toast.credentialsSaved("DEV.to");
        // Keep the key in the input so user can see it
      } else {
        toast.credentialsError("DEV.to", result?.error || "Failed to save credentials");
      }
    } catch (error) {
      devError("Error saving DEV.to credentials:", error);
      toast.credentialsError("DEV.to", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWordpressCredentials = async () => {
    if (!wordpressApiKey.trim() || !wordpressSiteUrl.trim()) {
      toast.validationError(SYNC_LABEL.ENTER_WORDPRESS_CREDENTIALS);
      return;
    }

    // Validate WordPress site URL
    if (!wordpressSiteUrl.startsWith("http://") && !wordpressSiteUrl.startsWith("https://")) {
      toast.validationError(SYNC_LABEL.VALID_WORDPRESS_URL);
      return;
    }

    setLoading(true);
    try {
      devLog("Saving WordPress credentials");
      const result = await apiClient.upsertCredential("wordpress", {
        api_key: wordpressApiKey.trim(),
        site_url: wordpressSiteUrl.trim(),
      });

      if (result?.success) {
        setSaved((prev) => ({ ...prev, wordpress: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, wordpress: false })), 3000);
        toast.credentialsSaved("WordPress");
        // Keep the key in the input so user can see it
      } else {
        toast.credentialsError("WordPress", result?.error || "Failed to save credentials");
      }
    } catch (error) {
      devError("Error saving WordPress credentials:", error);
      toast.credentialsError("WordPress", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{SYNC_LABEL.SETTINGS_TITLE}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">{SYNC_LABEL.SETTINGS_DESCRIPTION}</p>
      </div>

      {/* Medium Integration */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`p-1.5 sm:p-2 ${COLOR_CLASSES.ICON_BG.WARNING} rounded-lg shrink-0`}>
              <FiKey className={`h-4 w-4 sm:h-6 sm:w-6 ${COLOR_CLASSES.ICON_COLOR.WARNING}`} />
            </div>
            <div>
              <CardTitle>{SYNC_LABEL.MEDIUM_INTEGRATION}</CardTitle>
              <CardDescription>{SYNC_LABEL.MEDIUM_INTEGRATION_DESCRIPTION}</CardDescription>
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
                      className="underline hover:text-blue-900"
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
                onChange={(e) => setMediumApiKey(e.target.value)}
                placeholder={saved.medium ? SYNC_LABEL.SAVED_HIDDEN : SYNC_LABEL.PLACEHOLDER_MEDIUM_TOKEN}
                className="w-full pr-12 sm:pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                aria-label={showMediumKey ? SYNC_LABEL.HIDE_API_KEY : SYNC_LABEL.SHOW_API_KEY}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMediumKey((v) => !v);
                }}
                className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full min-h-[44px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
              >
                {showMediumKey ? (
                  <FiEyeOff className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                ) : (
                  <FiEye className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                )}
              </button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{SYNC_LABEL.TOKEN_ENCRYPTED}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveMediumCredentials}
            disabled={loading || !mediumApiKey.trim()}
            className="flex items-center space-x-1.5 sm:space-x-2"
          >
            <FiSave className="h-3 w-3 sm:h-4 sm:w-4" />
            {loading ? SYNC_LABEL.SAVING : saved.medium ? SYNC_LABEL.SAVED : SYNC_LABEL.SAVE_CREDENTIALS}
          </Button>
        </CardFooter>
      </Card>

      {/* DEV.to Integration */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${COLOR_CLASSES.ICON_BG.PRIMARY} rounded-lg`}>
              <FiKey className={`h-6 w-6 ${COLOR_CLASSES.ICON_COLOR.PRIMARY}`} />
            </div>
            <div>
              <CardTitle>{SYNC_LABEL.DEVTO_INTEGRATION}</CardTitle>
              <CardDescription>{SYNC_LABEL.DEVTO_INTEGRATION_DESCRIPTION}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
              <div className="text-sm text-purple-800">
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
                onChange={(e) => setDevtoUsername(e.target.value)}
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
                  onChange={(e) => setDevtoApiKey(e.target.value)}
                  placeholder={saved.devto ? SYNC_LABEL.SAVED_HIDDEN : SYNC_LABEL.PLACEHOLDER_DEVTO_API_KEY}
                  className="w-full pr-12 sm:pr-10"
                  autoComplete="off"
                />
                <button
                  type="button"
                  aria-label={showDevtoKey ? SYNC_LABEL.HIDE_API_KEY : SYNC_LABEL.SHOW_API_KEY}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDevtoKey((v) => !v);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full min-h-[44px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
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
          <p className="text-sm text-muted-foreground">{SYNC_LABEL.BOTH_REQUIRED_DEVTO}</p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveDevtoCredentials}
            disabled={loading || !devtoApiKey.trim() || !devtoUsername.trim()}
            className="flex items-center space-x-1.5 sm:space-x-2"
          >
            <FiSave className="h-3 w-3 sm:h-4 sm:w-4" />
            {loading ? SYNC_LABEL.SAVING : saved.devto ? SYNC_LABEL.SAVED : SYNC_LABEL.SAVE_CREDENTIALS}
          </Button>
        </CardFooter>
      </Card>

      {/* WordPress Integration */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/15 rounded-lg">
              <FiKey className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{SYNC_LABEL.WORDPRESS_INTEGRATION}</CardTitle>
              <CardDescription>{SYNC_LABEL.WORDPRESS_INTEGRATION_DESCRIPTION}</CardDescription>
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
                      className="underline hover:text-blue-900"
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
              <label htmlFor="settings-wordpress-site-url" className="block text-sm font-medium text-foreground mb-2">
                {SYNC_LABEL.WORDPRESS_SITE_URL_LABEL}
              </label>
              <Input
                id="settings-wordpress-site-url"
                name="wordpressSiteUrl"
                type="url"
                value={wordpressSiteUrl}
                onChange={(e) => setWordpressSiteUrl(e.target.value)}
                placeholder={SYNC_LABEL.PLACEHOLDER_WORDPRESS_SITE_URL}
                className="w-full"
                autoComplete="url"
              />
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{SYNC_LABEL.WORDPRESS_URL_INFO}</p>
            </div>
            <div>
              <label htmlFor="settings-wordpress-api-key" className="block text-sm font-medium text-foreground mb-2">
                {SYNC_LABEL.WORDPRESS_API_KEY_LABEL}
              </label>
              <div className="relative">
                <Input
                  id="settings-wordpress-api-key"
                  name="wordpressApiKey"
                  type={showWordpressKey ? "text" : "password"}
                  value={wordpressApiKey}
                  onChange={(e) => setWordpressApiKey(e.target.value)}
                  placeholder={saved.wordpress ? SYNC_LABEL.SAVED_HIDDEN : SYNC_LABEL.PLACEHOLDER_WORDPRESS_API_KEY}
                  className="w-full pr-12 sm:pr-10"
                  autoComplete="off"
                />
                <button
                  type="button"
                  aria-label={showWordpressKey ? SYNC_LABEL.HIDE_API_KEY : SYNC_LABEL.SHOW_API_KEY}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowWordpressKey((v) => !v);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full min-h-[44px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer touch-manipulation"
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
          <p className="text-sm text-muted-foreground">{SYNC_LABEL.BOTH_REQUIRED_WORDPRESS}</p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveWordpressCredentials}
            disabled={loading || !wordpressApiKey.trim() || !wordpressSiteUrl.trim()}
            className="flex items-center space-x-1.5 sm:space-x-2"
          >
            <FiSave className="h-3 w-3 sm:h-4 sm:w-4" />
            {loading ? SYNC_LABEL.SAVING : saved.wordpress ? SYNC_LABEL.SAVED : SYNC_LABEL.SAVE_CREDENTIALS}
          </Button>
        </CardFooter>
      </Card>

      {/* Platform Status */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>{SYNC_LABEL.PLATFORM_STATUS}</CardTitle>
          <CardDescription>{SYNC_LABEL.PLATFORM_STATUS_DESCRIPTION}</CardDescription>
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
                    {mediumApiKey ? SYNC_LABEL.CONNECTED : SYNC_LABEL.NOT_CONNECTED}
                  </p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  mediumApiKey ? "bg-positive/15 text-positive" : "bg-muted text-muted-foreground"
                }`}
              >
                {mediumApiKey ? SYNC_LABEL.ACTIVE : SYNC_LABEL.INACTIVE}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${COLOR_CLASSES.ICON_BG.PRIMARY} rounded-lg`}>
                  <FiKey className={`h-4 w-4 ${COLOR_CLASSES.ICON_COLOR.PRIMARY}`} />
                </div>
                <div>
                  <p className="font-medium">{SYNC_LABEL.PLATFORM_DEVTO}</p>
                  <p className="text-sm text-muted-foreground">
                    {devtoApiKey && devtoUsername ? SYNC_LABEL.CONNECTED : SYNC_LABEL.NOT_CONNECTED}
                  </p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  devtoApiKey && devtoUsername ? "bg-positive/15 text-positive" : "bg-muted text-muted-foreground"
                }`}
              >
                {devtoApiKey && devtoUsername ? SYNC_LABEL.ACTIVE : SYNC_LABEL.INACTIVE}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/15 rounded-lg">
                  <FiKey className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{SYNC_LABEL.PLATFORM_WORDPRESS}</p>
                  <p className="text-sm text-muted-foreground">
                    {wordpressApiKey && wordpressSiteUrl ? SYNC_LABEL.CONNECTED : SYNC_LABEL.NOT_CONNECTED}
                  </p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  wordpressApiKey && wordpressSiteUrl
                    ? "bg-positive/15 text-positive"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {wordpressApiKey && wordpressSiteUrl ? SYNC_LABEL.ACTIVE : SYNC_LABEL.INACTIVE}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>{SYNC_LABEL.HELP_SUPPORT}</CardTitle>
          <CardDescription>{SYNC_LABEL.HELP_SUPPORT_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href="https://medium.com/me/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              <span>{SYNC_LABEL.MEDIUM_INTEGRATION_GUIDE}</span>
            </div>
            <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </a>

          <a
            href="https://dev.to/settings/account"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              <span>{SYNC_LABEL.DEVTO_API_KEY_GUIDE}</span>
            </div>
            <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </a>

          <a
            href="https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              <span>{SYNC_LABEL.WORDPRESS_JWT_PLUGIN}</span>
            </div>
            <FiExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </a>

          <a
            href={EXTERNAL_LINKS.GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
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
  );
};

export default Settings;
