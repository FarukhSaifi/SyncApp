import React from "react";

import { BUTTON_VARIANTS, ROUTES, SYNC_LABEL } from "@constants";
import type { ErrorBoundaryProps, ErrorBoundaryState } from "@types";
import { logError } from "@utils/logger";

import Button from "@components/common/Button";

/**
 * Catches render errors in the subtree and shows a recovery screen with dashboard navigation.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError("ErrorBoundary caught", {
      error,
      componentStack: errorInfo?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">{SYNC_LABEL.SOMETHING_WENT_WRONG}</h1>
            <p className="text-muted-foreground mb-6">{SYNC_LABEL.UNEXPECTED_ERROR_TRY_AGAIN}</p>
            <Button
              type="button"
              variant={BUTTON_VARIANTS.PRIMARY}
              onClick={() => {
                window.location.href = ROUTES.DASHBOARD;
              }}
            >
              {SYNC_LABEL.GO_TO_DASHBOARD}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
