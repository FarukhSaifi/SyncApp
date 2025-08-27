import React, { useEffect, useState } from "react";
import { FiAlertCircle, FiExternalLink, FiKey, FiSave } from "react-icons/fi";
import Button from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Input from "../components/ui/Input";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [mediumApiKey, setMediumApiKey] = useState("");
  const [devtoApiKey, setDevtoApiKey] = useState("");
  const [devtoUsername, setDevtoUsername] = useState("");
  const [saved, setSaved] = useState({ medium: false, devto: false });

  useEffect(() => {
    // In a real app, you might want to fetch existing credentials
    // For now, we'll just show the form
  }, []);

  const handleSaveMediumCredentials = async () => {
    if (!mediumApiKey.trim()) {
      alert("Please enter your Medium API key");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/credentials/medium", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: mediumApiKey.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaved((prev) => ({ ...prev, medium: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, medium: false })), 3000);
        alert("Medium API credentials saved successfully!");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
      alert("Failed to save credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDevtoCredentials = async () => {
    if (!devtoApiKey.trim() || !devtoUsername.trim()) {
      alert("Please enter both DEV.to API key and username");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/credentials/devto", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: devtoApiKey.trim(),
          platform_config: {
            devto_username: devtoUsername.trim(),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaved((prev) => ({ ...prev, devto: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, devto: false })), 3000);
        alert("DEV.to API credentials saved successfully!");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
      alert("Failed to save credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your API credentials and platform settings
        </p>
      </div>

      {/* Medium Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiKey className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle>Medium Integration</CardTitle>
              <CardDescription>
                Connect your Medium account to publish posts directly
              </CardDescription>
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Medium Integration Token
            </label>
            <Input
              type="password"
              value={mediumApiKey}
              onChange={(e) => setMediumApiKey(e.target.value)}
              placeholder="Enter your Medium integration token..."
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-1">
              This token will be encrypted and stored securely
            </p>
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
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiKey className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>DEV.to Integration</CardTitle>
              <CardDescription>
                Connect your DEV.to account to publish posts directly
              </CardDescription>
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
              <label className="block text-sm font-medium text-foreground mb-2">
                DEV.to Username
              </label>
              <Input
                value={devtoUsername}
                onChange={(e) => setDevtoUsername(e.target.value)}
                placeholder="Enter your DEV.to username..."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                DEV.to API Key
              </label>
              <Input
                type="password"
                value={devtoApiKey}
                onChange={(e) => setDevtoApiKey(e.target.value)}
                placeholder="Enter your DEV.to API key..."
                className="w-full"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Both username and API key are required for DEV.to integration
          </p>
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

      {/* Platform Status */}
      <Card>
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
                  <p className="text-sm text-muted-foreground">
                    {mediumApiKey ? "Connected" : "Not connected"}
                  </p>
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
                  devtoApiKey && devtoUsername
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {devtoApiKey && devtoUsername ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FiKey className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">WordPress</p>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Planned
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
