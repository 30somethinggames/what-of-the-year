import * as Sentry from "@sentry/react";
import { Outlet, createRootRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

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
 *
 * The fallback lets go the moment the router lands somewhere else. Route
 * components are lazy chunks, and the route that threw stays mounted while the
 * next one loads, so a throw in that window would otherwise pin this screen
 * after the URL has moved on. `resolvedLocation` is the one that advances only
 * once the new route has rendered, which is when the error is stale.
 */
function RootErrorFallback({ error, resetError }: FallbackProps) {
  const navigate = useNavigate();
  const resolvedPathname = useRouterState({
    select: (state) => state.resolvedLocation?.pathname ?? state.location.pathname,
  });
  const caughtAt = useRef(resolvedPathname);

  useEffect(() => {
    if (resolvedPathname !== caughtAt.current) resetError();
  }, [resolvedPathname, resetError]);

  const onHome = async () => {
    await navigate({ to: "/", replace: true });
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
