import * as Sentry from "@sentry/react";
import { tanstackRouterBrowserTracingIntegration } from "@sentry/react";
import type { AnyRouter } from "@tanstack/react-router";

export function initSentry(router: AnyRouter) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [tanstackRouterBrowserTracingIntegration(router)],
    tracesSampleRate: 1.0,
  });
}
