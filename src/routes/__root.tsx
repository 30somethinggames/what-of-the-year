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
      <ToastProvider>
        <div className="flex h-full w-full max-w-140 flex-col overflow-x-hidden bg-white-100 shadow-md">
          <Sentry.ErrorBoundary
            fallback={<DisplayError onRetry={() => window.location.reload()} />}
          >
            <Outlet />
          </Sentry.ErrorBoundary>
        </div>
      </ToastProvider>
    </div>
  );
}
