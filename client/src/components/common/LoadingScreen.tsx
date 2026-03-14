import { INFO_MESSAGES } from "@constants";
import { LOADING_UI } from "@constants/designTokens";

interface LoadingScreenProps {
  message?: string;
  inline?: boolean;
}

const DEFAULT_MESSAGE = INFO_MESSAGES.LOADING;

/**
 * Full-page or inline loading indicator. Use for auth check and route Suspense.
 */
function LoadingScreen({ message = DEFAULT_MESSAGE, inline = false }: LoadingScreenProps) {
  if (inline) {
    return (
      <div
        className={`${LOADING_UI.INLINE_MIN_HEIGHT_CLASS} flex items-center justify-center text-muted-foreground`}
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
          className={`animate-spin rounded-full ${LOADING_UI.SPINNER_SIZE_CLASS} ${LOADING_UI.SPINNER_BORDER_CLASS} mx-auto mb-4`}
          aria-hidden
        />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
