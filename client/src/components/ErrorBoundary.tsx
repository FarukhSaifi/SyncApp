import React from "react";

import { ROUTES, SYNC_LABEL } from "@constants";
import { logError } from "@utils/logger";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
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
            <button
              onClick={() => (window.location.href = ROUTES.DASHBOARD)}
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            >
              {SYNC_LABEL.GO_TO_DASHBOARD}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
