import React from "react";

/**
 * Reusable loading spinner component
 */
const LoadingSpinner = ({ size = "md", message = "Loading..." }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-b-2 border-primary mx-auto mb-4 ${sizeClasses[size]}`}
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
        {message && <p className="text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
