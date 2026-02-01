import React from "react";

const DEFAULT_MESSAGE = "Loading...";

/**
 * Full-page or inline loading indicator. Use for auth check and route Suspense.
 */
function LoadingScreen({ message = DEFAULT_MESSAGE, inline = false }) {
  if (inline) {
    return (
      <div
        className="min-h-[300px] flex items-center justify-center text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4"
          aria-hidden
        />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
