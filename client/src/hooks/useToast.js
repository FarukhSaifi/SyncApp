import { useToaster } from "../components/ui/Toaster";

/**
 * Enhanced toast hook with common app-specific toast patterns
 */
export const useToast = () => {
  const toaster = useToaster();

  // App-specific toast methods
  const apiSuccess = (message, title = "Success") => {
    toaster.success(title, message);
  };

  const apiError = (message, title = "Error") => {
    toaster.error(title, message);
  };

  const apiLoading = (message, title = "Loading") => {
    return toaster.loading(title, message);
  };

  const validationError = (message) => {
    toaster.error("Validation Error", message);
  };

  const networkError = () => {
    toaster.error("Network Error", "Unable to connect to server. Please check your connection.");
  };

  const authError = (message = "Authentication failed") => {
    toaster.error("Authentication Error", message);
  };

  const publishSuccess = (platform) => {
    toaster.success("Published!", `Post successfully published to ${platform}`);
  };

  const publishError = (platform, error) => {
    toaster.error("Publish Failed", `Failed to publish to ${platform}: ${error}`);
  };

  const saveSuccess = (isUpdate = false) => {
    toaster.success("Saved!", isUpdate ? "Post updated successfully" : "Post created successfully");
  };

  const deleteSuccess = () => {
    toaster.success("Deleted!", "Post deleted successfully");
  };

  const credentialsSaved = (platform) => {
    toaster.success("Credentials Saved", `${platform} API credentials saved successfully`);
  };

  const credentialsError = (platform, error) => {
    toaster.error("Credentials Error", `Failed to save ${platform} credentials: ${error}`);
  };

  const exportSuccess = (format) => {
    toaster.success("Exported!", `Post exported as ${format} successfully`);
  };

  const exportError = (format, error) => {
    toaster.error("Export Failed", `Failed to export as ${format}: ${error}`);
  };

  // Promise-based API calls with automatic toast handling
  const withToast = (promise, options = {}) => {
    const {
      loading = "Loading...",
      success = "Success!",
      error = "Operation failed",
      loadingMessage,
      successMessage,
      errorMessage
    } = options;

    return toaster.promise(promise, {
      loading,
      success,
      error,
      loadingMessage,
      successMessage,
      errorMessage
    });
  };

  return {
    ...toaster,
    // App-specific methods
    apiSuccess,
    apiError,
    apiLoading,
    validationError,
    networkError,
    authError,
    publishSuccess,
    publishError,
    saveSuccess,
    deleteSuccess,
    credentialsSaved,
    credentialsError,
    exportSuccess,
    exportError,
    withToast,
  };
};

export default useToast;
