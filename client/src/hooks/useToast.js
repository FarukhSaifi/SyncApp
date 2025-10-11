import { useCallback, useMemo } from "react";
import { useToaster } from "../components/ui/Toaster";

/**
 * Enhanced toast hook with common app-specific toast patterns
 * All methods are memoized to prevent infinite re-renders
 */
export const useToast = () => {
  const toaster = useToaster();

  // Memoize all methods to ensure stability and prevent re-renders
  const apiSuccess = useCallback(
    (message, title = "Success") => {
      toaster.success(title, message);
    },
    [toaster]
  );

  const apiError = useCallback(
    (message, title = "Error") => {
      toaster.error(title, message);
    },
    [toaster]
  );

  const apiLoading = useCallback(
    (message, title = "Loading") => {
      return toaster.loading(title, message);
    },
    [toaster]
  );

  const validationError = useCallback(
    (message) => {
      toaster.error("Validation Error", message);
    },
    [toaster]
  );

  const networkError = useCallback(() => {
    toaster.error("Network Error", "Unable to connect to server. Please check your connection.");
  }, [toaster]);

  const authError = useCallback(
    (message = "Authentication failed") => {
      toaster.error("Authentication Error", message);
    },
    [toaster]
  );

  const publishSuccess = useCallback(
    (platform) => {
      toaster.success("Published!", `Post successfully published to ${platform}`);
    },
    [toaster]
  );

  const publishError = useCallback(
    (platform, error) => {
      toaster.error("Publish Failed", `Failed to publish to ${platform}: ${error}`);
    },
    [toaster]
  );

  const saveSuccess = useCallback(
    (isUpdate = false) => {
      toaster.success("Saved!", isUpdate ? "Post updated successfully" : "Post created successfully");
    },
    [toaster]
  );

  const deleteSuccess = useCallback(() => {
    toaster.success("Deleted!", "Post deleted successfully");
  }, [toaster]);

  const credentialsSaved = useCallback(
    (platform) => {
      toaster.success("Credentials Saved", `${platform} API credentials saved successfully`);
    },
    [toaster]
  );

  const credentialsError = useCallback(
    (platform, error) => {
      toaster.error("Credentials Error", `Failed to save ${platform} credentials: ${error}`);
    },
    [toaster]
  );

  const exportSuccess = useCallback(
    (format) => {
      toaster.success("Exported!", `Post exported as ${format} successfully`);
    },
    [toaster]
  );

  const exportError = useCallback(
    (format, error) => {
      toaster.error("Export Failed", `Failed to export as ${format}: ${error}`);
    },
    [toaster]
  );

  const withToast = useCallback(
    (promise, options = {}) => {
      const {
        loading = "Loading...",
        success = "Success!",
        error = "Operation failed",
        loadingMessage,
        successMessage,
        errorMessage,
      } = options;

      return toaster.promise(promise, {
        loading,
        success,
        error,
        loadingMessage,
        successMessage,
        errorMessage,
      });
    },
    [toaster]
  );

  // Return stable object with all toast methods
  return useMemo(
    () => ({
      ...toaster,
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
    }),
    [
      toaster,
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
    ]
  );
};

export default useToast;
