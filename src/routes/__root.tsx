import * as Sentry from "@sentry/react";
import { Outlet, createRootRoute, useNavigate } from "@tanstack/react-router";

import { DisplayError } from "components/states/error";
import { ToastProvider } from "components/toast";
import { getApiError } from "utils/api-error";

export const Route = createRootRoute({
  component: RootLayout,
});

interface FallbackProps {
  error: unknown;
  resetError: () => void;
}

/**
 * Every failed authz throws, so a kicked or departed player's live subscriptions
 * land here mid-game. Retry alone would only re-throw for them — the home link is
 * the way out.
 */
function RootErrorFallback({ error, resetError }: FallbackProps) {
  const navigate = useNavigate();

  const onHome = async () => {
    await navigate({ to: "/", replace: true });
    resetError();
  };

  return (
    <DisplayError
      message={getApiError(error).message}
      onRetry={() => window.location.reload()}
      onHome={onHome}
    />
  );
}

function RootLayout() {
  return (
    <div className="flex h-full justify-center">
      <div className="relative flex h-full w-full max-w-140 flex-col overflow-x-hidden bg-white-100 shadow-md">
        <ToastProvider>
          <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
              <RootErrorFallback error={error} resetError={resetError} />
            )}
          >
            <Outlet />
          </Sentry.ErrorBoundary>
        </ToastProvider>
      </div>
    </div>
  );
}
