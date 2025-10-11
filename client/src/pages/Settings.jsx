import React, { useEffect, useState } from "react";
import { FiAlertCircle, FiExternalLink, FiEye, FiEyeOff, FiKey, FiSave } from "react-icons/fi";
import Button from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { API_PATHS } from "../constants";
import { useToast } from "../hooks/useToast";
import { apiClient } from "../utils/apiClient";

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

  const MASK = "••••••••••••••••";

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        console.log("🔄 Loading credentials...");
        const result = await apiClient.request(`${API_PATHS.CREDENTIALS}`);
        console.log("📋 Credentials response:", result);

        if (result?.success && Array.isArray(result.data)) {
          const creds = result.data;
          const medium = creds.find((c) => c.platform_name === "medium");
          const devto = creds.find((c) => c.platform_name === "devto");
          const wordpress = creds.find((c) => c.platform_name === "wordpress");

          if (medium) {
            setSaved((prev) => ({ ...prev, medium: true }));
            setMediumApiKey(MASK);
          }
          if (devto) {
            setSaved((prev) => ({ ...prev, devto: true }));
            if (devto.platform_config?.devto_username) {
              setDevtoUsername(devto.platform_config.devto_username);
            }
            setDevtoApiKey(MASK);
          }
          if (wordpress) {
            setSaved((prev) => ({ ...prev, wordpress: true }));
            if (wordpress.site_url) setWordpressSiteUrl(wordpress.site_url);
            setWordpressApiKey(MASK);
          }
        } else {
          console.warn("⚠️ No credentials found or invalid response");
        }
      } catch (e) {
        console.error("❌ Failed to load credentials:", e);
        toast.apiError(`Failed to load credentials: ${e.message}`);
      }
    };
    loadCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, toast is stable

  const handleSaveMediumCredentials = async () => {
    if (!mediumApiKey.trim() || mediumApiKey === MASK) {
      toast.validationError("Please enter your Medium API key");
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 Saving Medium credentials...");
      const result = await apiClient.upsertCredential("medium", {
        api_key: mediumApiKey.trim(),
      });

      if (result?.success) {
        setSaved((prev) => ({ ...prev, medium: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, medium: false })), 3000);
        toast.credentialsSaved("Medium");
        setMediumApiKey(MASK);
      } else {
        toast.credentialsError("Medium", result?.error || "Failed to save credentials");
      }
    } catch (error) {
      console.error("❌ Error saving Medium credentials:", error);
      toast.credentialsError("Medium", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDevtoCredentials = async () => {
    if (!devtoApiKey.trim() || devtoApiKey === MASK || !devtoUsername.trim()) {
      toast.validationError("Please enter both DEV.to API key and username");
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 Saving DEV.to credentials...");
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
        setDevtoApiKey(MASK);
      } else {
        toast.credentialsError("DEV.to", result?.error || "Failed to save credentials");
      }
    } catch (error) {
      console.error("❌ Error saving DEV.to credentials:", error);
      toast.credentialsError("DEV.to", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWordpressCredentials = async () => {
    if (!wordpressApiKey.trim() || wordpressApiKey === MASK || !wordpressSiteUrl.trim()) {
      toast.validationError("Please enter both WordPress API key and site URL");
      return;
    }

    // Validate WordPress site URL
    if (!wordpressSiteUrl.startsWith("http://") && !wordpressSiteUrl.startsWith("https://")) {
      toast.validationError("Please enter a valid WordPress site URL (must start with http:// or https://)");
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 Saving WordPress credentials...");
      const result = await apiClient.upsertCredential("wordpress", {
        api_key: wordpressApiKey.trim(),
        site_url: wordpressSiteUrl.trim(),
      });

      if (result?.success) {
        setSaved((prev) => ({ ...prev, wordpress: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, wordpress: false })), 3000);
        toast.credentialsSaved("WordPress");
        setWordpressApiKey(MASK);
      } else {
        toast.credentialsError("WordPress", result?.error || "Failed to save credentials");
      }
    } catch (error) {
      console.error("❌ Error saving WordPress credentials:", error);
      toast.credentialsError("WordPress", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your API credentials and platform settings</p>
      </div>

      {/* Medium Integration */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiKey className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle>Medium Integration</CardTitle>
              <CardDescription>Connect your Medium account to publish posts directly</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How to get your Medium API key:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Go to{" "}
                    <a
                      href="https://medium.com/me/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900"
                    >
                      Medium Settings
                    </a>
                  </li>
                  <li>Scroll down to "Integration tokens"</li>
                  <li>Click "Get integration token"</li>
                  <li>Copy the generated token</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Medium Integration Token</label>
            <div className="relative">
              <Input
                type={showMediumKey ? "text" : "password"}
                value={mediumApiKey}
                onChange={(e) => setMediumApiKey(e.target.value)}
                placeholder={
                  saved.medium ? "Saved (hidden) — enter new to replace" : "Enter your Medium integration token..."
                }
                className="w-full pr-10"
              />
              <button
                type="button"
                aria-label={showMediumKey ? "Hide API key" : "Show API key"}
                onClick={() => setShowMediumKey((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showMediumKey ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">This token will be encrypted and stored securely</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveMediumCredentials}
            disabled={loading || !mediumApiKey.trim()}
            className="flex items-center space-x-2"
          >
            <FiSave className="h-4 w-4" />
            {loading ? "Saving..." : saved.medium ? "Saved!" : "Save Credentials"}
          </Button>
        </CardFooter>
      </Card>

      {/* DEV.to Integration */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiKey className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>DEV.to Integration</CardTitle>
              <CardDescription>Connect your DEV.to account to publish posts directly</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">How to get your DEV.to API key:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Go to{" "}
                    <a
                      href="https://dev.to/settings/account"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-purple-900"
                    >
                      DEV.to Settings
                    </a>
                  </li>
                  <li>Scroll down to "API Keys" section</li>
                  <li>Click "Generate API Key"</li>
                  <li>Copy the generated key</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">DEV.to Username</label>
              <Input
                value={devtoUsername}
                onChange={(e) => setDevtoUsername(e.target.value)}
                placeholder="Enter your DEV.to username..."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">DEV.to API Key</label>
              <div className="relative">
                <Input
                  type={showDevtoKey ? "text" : "password"}
                  value={devtoApiKey}
                  onChange={(e) => setDevtoApiKey(e.target.value)}
                  placeholder={saved.devto ? "Saved (hidden) — enter new to replace" : "Enter your DEV.to API key..."}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  aria-label={showDevtoKey ? "Hide API key" : "Show API key"}
                  onClick={() => setShowDevtoKey((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showDevtoKey ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Both username and API key are required for DEV.to integration</p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveDevtoCredentials}
            disabled={loading || !devtoApiKey.trim() || !devtoUsername.trim()}
            className="flex items-center space-x-2"
          >
            <FiSave className="h-4 w-4" />
            {loading ? "Saving..." : saved.devto ? "Saved!" : "Save Credentials"}
          </Button>
        </CardFooter>
      </Card>

      {/* WordPress Integration */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiKey className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>WordPress Integration</CardTitle>
              <CardDescription>Connect your WordPress site to publish posts directly</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How to get your WordPress API key:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Install and activate the{" "}
                    <a
                      href="https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900"
                    >
                      JWT Authentication plugin
                    </a>
                  </li>
                  <li>Go to WordPress Admin → Users → Your Profile</li>
                  <li>Generate a new application password</li>
                  <li>Use your username and the generated password as the API key</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">WordPress Site URL</label>
              <Input
                value={wordpressSiteUrl}
                onChange={(e) => setWordpressSiteUrl(e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground mt-1">Your WordPress site URL (e.g., https://yoursite.com)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">WordPress API Key</label>
              <div className="relative">
                <Input
                  type={showWordpressKey ? "text" : "password"}
                  value={wordpressApiKey}
                  onChange={(e) => setWordpressApiKey(e.target.value)}
                  placeholder={
                    saved.wordpress ? "Saved (hidden) — enter new to replace" : "Enter your WordPress API key..."
                  }
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  aria-label={showWordpressKey ? "Hide API key" : "Show API key"}
                  onClick={() => setShowWordpressKey((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showWordpressKey ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your WordPress username:password or application password
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Both site URL and API key are required for WordPress integration
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveWordpressCredentials}
            disabled={loading || !wordpressApiKey.trim() || !wordpressSiteUrl.trim()}
            className="flex items-center space-x-2"
          >
            <FiSave className="h-4 w-4" />
            {loading ? "Saving..." : saved.wordpress ? "Saved!" : "Save Credentials"}
          </Button>
        </CardFooter>
      </Card>

      {/* Platform Status */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
          <CardDescription>Current status of your connected platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FiKey className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Medium</p>
                  <p className="text-sm text-muted-foreground">{mediumApiKey ? "Connected" : "Not connected"}</p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  mediumApiKey ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {mediumApiKey ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiKey className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">DEV.to</p>
                  <p className="text-sm text-muted-foreground">
                    {devtoApiKey && devtoUsername ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  devtoApiKey && devtoUsername ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {devtoApiKey && devtoUsername ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiKey className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">WordPress</p>
                  <p className="text-sm text-muted-foreground">
                    {wordpressApiKey && wordpressSiteUrl ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  wordpressApiKey && wordpressSiteUrl ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {wordpressApiKey && wordpressSiteUrl ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>Resources to help you get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href="https://medium.com/me/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FiExternalLink className="h-4 w-4 text-muted-foreground" />
              <span>Medium Integration Token Guide</span>
            </div>
            <FiExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>

          <a
            href="https://dev.to/settings/account"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FiExternalLink className="h-4 w-4 text-muted-foreground" />
              <span>DEV.to API Key Guide</span>
            </div>
            <FiExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>

          <a
            href="https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FiExternalLink className="h-4 w-4 text-muted-foreground" />
              <span>WordPress JWT Authentication Plugin</span>
            </div>
            <FiExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>

          <a
            href="https://github.com/your-repo/syncapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-3">
              <FiExternalLink className="h-4 w-4 text-muted-foreground" />
              <span>GitHub Repository</span>
            </div>
            <FiExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
