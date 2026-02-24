import { useCallback, useMemo } from "react";
import { useToaster } from "../components/ui/Toaster";
import { ERROR_MESSAGES, SUCCESS_MESSAGES, TOAST_TITLES } from "../constants";

/**
 * Enhanced toast hook with common app-specific toast patterns
 * All methods are memoized to prevent infinite re-renders
 */
export const useToast = () => {
  const toaster = useToaster();

  // Memoize all methods to ensure stability and prevent re-renders
  const apiSuccess = useCallback(
    (message, title = TOAST_TITLES.SUCCESS) => {
      toaster.success(title, message);
    },
    [toaster],
  );

  const apiError = useCallback(
    (message, title = TOAST_TITLES.ERROR) => {
      toaster.error(title, message);
    },
    [toaster],
  );

  const apiLoading = useCallback(
    (message, title = TOAST_TITLES.LOADING) => {
      return toaster.loading(title, message);
    },
    [toaster],
  );

  const validationError = useCallback(
    (message) => {
      toaster.error(TOAST_TITLES.VALIDATION_ERROR, message);
    },
    [toaster],
  );

  const networkError = useCallback(() => {
    toaster.error(TOAST_TITLES.NETWORK_ERROR, ERROR_MESSAGES.NETWORK_ERROR);
  }, [toaster]);

  const authError = useCallback(
    (message = TOAST_TITLES.AUTH_ERROR) => {
      toaster.error(TOAST_TITLES.AUTH_ERROR, message);
    },
    [toaster],
  );

  const publishSuccess = useCallback(
    (platform) => {
      toaster.success(TOAST_TITLES.PUBLISHED, SUCCESS_MESSAGES.PUBLISHED_TO_PLATFORM(platform));
    },
    [toaster],
  );

  const publishError = useCallback(
    (platform, error) => {
      toaster.error(TOAST_TITLES.PUBLISH_FAILED, ERROR_MESSAGES.FAILED_TO_PUBLISH_PLATFORM(platform, error));
    },
    [toaster],
  );

  const saveSuccess = useCallback(
    (isUpdate = false) => {
      toaster.success(TOAST_TITLES.SAVED, isUpdate ? SUCCESS_MESSAGES.POST_UPDATED : SUCCESS_MESSAGES.POST_CREATED);
    },
    [toaster],
  );

  const deleteSuccess = useCallback(() => {
    toaster.success(TOAST_TITLES.DELETED, SUCCESS_MESSAGES.POST_DELETED);
  }, [toaster]);

  const credentialsSaved = useCallback(
    (platform) => {
      toaster.success(TOAST_TITLES.CREDENTIALS_SAVED, SUCCESS_MESSAGES.CREDENTIALS_SAVED(platform));
    },
    [toaster],
  );

  const credentialsError = useCallback(
    (platform, error) => {
      toaster.error(TOAST_TITLES.CREDENTIALS_ERROR, ERROR_MESSAGES.CREDENTIALS_SAVE_FAILED(platform, error));
    },
    [toaster],
  );

  const exportSuccess = useCallback(
    (format) => {
      toaster.success(TOAST_TITLES.EXPORTED, SUCCESS_MESSAGES.EXPORT_SUCCESS(format));
    },
    [toaster],
  );

  const exportError = useCallback(
    (format, error) => {
      toaster.error(TOAST_TITLES.EXPORT_FAILED, ERROR_MESSAGES.EXPORT_FAILED(format, error));
    },
    [toaster],
  );

  const withToast = useCallback(
    (promise, options = {}) => {
      const {
        loading = TOAST_TITLES.LOADING,
        success = TOAST_TITLES.SUCCESS,
        error = ERROR_MESSAGES.OPERATION_FAILED,
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
    [toaster],
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
    ],
  );
};

export default useToast;
