import * as Sentry from "@sentry/react";
import { Outlet, createRootRoute } from "@tanstack/react-router";

import { DisplayError } from "components/states/error";
import { ToastProvider } from "components/toast";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex h-full justify-center">
      <div className="relative flex h-full w-full max-w-140 flex-col overflow-x-hidden bg-white-100 shadow-md">
        <ToastProvider>
          <Sentry.ErrorBoundary
            fallback={<DisplayError onRetry={() => window.location.reload()} />}
          >
            <Outlet />
          </Sentry.ErrorBoundary>
        </ToastProvider>
      </div>
    </div>
  );
}
