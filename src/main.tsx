import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ConvexReactClient } from "convex/react";
import { DEFAULT_STALE_TIME } from "queries/constants";

import { routeTree } from "./routeTree.gen";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: DEFAULT_STALE_TIME,
    },
  },
});

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex} storage={localStorage}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ConvexAuthProvider>
  </StrictMode>,
);
